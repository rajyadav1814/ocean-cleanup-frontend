import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function toCoordinate(value) {
  if (value === null || value === undefined || value === '') return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function toPosition(lat, lon) {
  const normalizedLat = toCoordinate(lat);
  const normalizedLon = toCoordinate(lon);
  return normalizedLat === null || normalizedLon === null
    ? null
    : { lat: normalizedLat, lng: normalizedLon };
}

// A component to handle map clicks and drag events
function MapEvents({ position, setPosition, onPositionChange }) {
  const map = useMap();

  // Update map view when position changes externally
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { animate: true });
    }
  }, [map, position]);

  useMapEvents({
    click(e) {
      const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition(pos);
      if (onPositionChange) onPositionChange(pos.lat, pos.lng);
    },
  });

  return null;
}

export default function MapLocationPicker({ value, lat, lon, onChange }) {
  const suppliedPosition = toPosition(lat, lon);
  const [position, setPosition] = useState(() => suppliedPosition);
  const [locationName, setLocationName] = useState(value || '');
  const [isFetchingName, setIsFetchingName] = useState(false);
  const [isMapRequested, setIsMapRequested] = useState(Boolean(suppliedPosition));
  // Set when the device couldn't give a position (denied, timed out, or no
  // geolocation). The map then waits for the user to place the pin instead
  // of guessing a location they'd submit without noticing.
  const [locateError, setLocateError] = useState('');
  const markerRef = useRef(null);

  // Location architecture (spec §18) — only the device's Geolocation API
  // knows either of these, so they're tracked here rather than derived
  // later server-side. `accuracy` is the browser-reported radius in
  // meters; it only means something for a point the device itself just
  // located, so dragging the pin or clicking elsewhere on the map clears
  // it back to null and flips captureMethod to 'manual_pin' — a
  // deliberately placed pin isn't a lesser source, it just isn't a GPS fix.
  const [accuracy, setAccuracy] = useState(null);
  const [captureMethod, setCaptureMethod] = useState('unknown');

  // API responses may serialize coordinates as strings. Normalize them before
  // passing them to Leaflet or formatting them with toFixed().
  useEffect(() => {
    if (
      suppliedPosition &&
      (!position || position.lat !== suppliedPosition.lat || position.lng !== suppliedPosition.lng)
    ) {
      setPosition(suppliedPosition);
      setIsMapRequested(true);
    }
  }, [suppliedPosition?.lat, suppliedPosition?.lng]);

  // Helper to reverse geocode lat/lng to a proper structured place name
  // Only the latest lookup may set the name: dragging the pin twice quickly
  // can otherwise let the slower first response overwrite the second.
  const lookupIdRef = useRef(0);
  const fetchLocationName = async (lat, lng) => {
    const lookupId = ++lookupIdRef.current;
    // Coordinates are a usable name on their own, so Submit is never blocked
    // waiting on (or failing at) the place-name lookup.
    const coordinateName = `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
    try {
      setIsFetchingName(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=16`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (lookupId !== lookupIdRef.current) return;
      if (!data?.display_name) {
        setLocationName(coordinateName);
        return;
      }
      const a = data.address || {};

      // Nominatim display_name is already ordered specific → broad (comma-separated)
      // Take first 4-5 parts for a rich readable address
      const displayParts = data.display_name
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Try to prepend a specific named place (beach, park, amenity etc.) if it isn't already in display_name
      const specificPlace = a.amenity || a.tourism || a.leisure || a.natural || a.waterway;
      if (specificPlace && !displayParts[0].toLowerCase().includes(specificPlace.toLowerCase())) {
        displayParts.unshift(specificPlace);
      }

      // Take up to 5 parts, remove exact consecutive duplicates
      const unique = displayParts.filter((p, i) => p !== displayParts[i - 1]);
      setLocationName(unique.slice(0, 5).join(', '));
    } catch {
      if (lookupId === lookupIdRef.current) setLocationName(coordinateName);
    } finally {
      if (lookupId === lookupIdRef.current) setIsFetchingName(false);
    }
  };

  // Initialize with current location if no lat/lon is provided and user has requested map access
  useEffect(() => {
    if (!isMapRequested || suppliedPosition || position || locateError) return;
    if (!navigator.geolocation) {
      setLocateError("This browser can't share your location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(newPos);
        // Number.isFinite guard: some browsers report accuracy as 0 for
        // a genuinely unknown fix rather than omitting it.
        setAccuracy(Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null);
        setCaptureMethod('gps');
        fetchLocationName(newPos.lat, newPos.lng);
      },
      (err) => {
        setLocateError(err?.code === 1
          ? 'Location access is turned off.'
          : "We couldn't find your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [suppliedPosition, isMapRequested, position, locateError]);

  // Sync internal state to parent when internal state changes
  useEffect(() => {
    if (position) {
      onChange({ displayName: locationName, lat: position.lat, lon: position.lng, accuracy, captureMethod });
    }
  }, [position, locationName, accuracy, captureMethod]);

  // When clicking on the map (handled in MapEvents), we want to fetch the name
  // To avoid modifying MapEvents, we can just hook into handleDragEnd and also map clicks.
  // We'll update MapEvents to call fetchLocationName.

  // Dragging the marker (or clicking elsewhere, below) moves the point off
  // wherever it was — a stale accuracy figure from the original GPS fix (or
  // no fix at all) no longer describes this position, and 'manual_pin' is
  // the honest capture method for it from here on.
  const handleManualPositionChange = useCallback((newLat, newLng) => {
    setAccuracy(null);
    setCaptureMethod('manual_pin');
    fetchLocationName(newLat, newLng);
  }, []);

  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPosition(newPos);
      handleManualPositionChange(newPos.lat, newPos.lng);
    }
  }, []);

  // Update MapEvents component locally inside the file scope (since it's defined above)
  // Actually MapEvents is outside this scope. Let's just create an inline one here, or pass it.


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>

      {/* Map Container */}
      {isMapRequested ? (
        <div style={{ position: 'relative', height: '260px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
          {position ? (
            <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={position}
                draggable={true}
                eventHandlers={{ dragend: handleDragEnd }}
                ref={markerRef}
              />
              <MapEvents position={position} setPosition={setPosition} onPositionChange={handleManualPositionChange} />
            </MapContainer>
          ) : locateError ? (
            <>
              <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapEvents position={null} setPosition={setPosition} onPositionChange={handleManualPositionChange} />
              </MapContainer>
              <div role="alert" style={{
                position: 'absolute', top: '0.6rem', left: '0.6rem', right: '0.6rem', zIndex: 1000,
                display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
                padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-md)',
                background: 'var(--surface, #fff)', border: '1px solid var(--border-light)',
                fontSize: '0.8rem', color: 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                <span style={{ flex: 1, minWidth: '12rem' }}>{locateError} Tap the map to place the pin where this happened.</span>
                <button type="button" className="secondary" onClick={() => setLocateError('')} style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}>
                  Try again
                </button>
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
              Loading map & locating you...
            </div>
          )}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.85rem', width: '100%',
          padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-light)', background: 'var(--surface-hover)'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pin the cleanup site on a map</span>
          <button type="button" className="bm-button" onClick={() => setIsMapRequested(true)} style={{ padding: '0.55rem 1.1rem', fontWeight: 600, flexShrink: 0 }}>
            Load map
          </button>
        </div>
      )}

      {/* Location name (auto-filled, editable) + read-only Lat/Lng — only once a point exists */}
      {position && (
        <>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="map-location-name" style={{ fontSize: '0.8rem' }}>Location name</label>
            <input
              id="map-location-name"
              type="text"
              placeholder="Enter a name for this location (e.g. Rozi Beach)"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              maxLength={200}
              aria-invalid={!isFetchingName && !locationName.trim()}
            />
            {!isFetchingName && !locationName.trim() && (
              <p role="alert" style={{ margin: '0.35rem 0 0', fontSize: '0.74rem', color: 'var(--danger, #ef4444)' }}>
                Add a name for this location to submit the report.
              </p>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Latitude</label>
              <input
                type="text"
                value={Number(position.lat).toFixed(6)}
                readOnly
                style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', width: '100%', minWidth: 0, padding: '0.75rem 1rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
              <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Longitude</label>
              <input
                type="text"
                value={Number(position.lng ?? position.lon ?? 0).toFixed(6)}
                readOnly
                style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', width: '100%', minWidth: 0, padding: '0.75rem 1rem' }}
              />
            </div>
          </div>

          {isFetchingName && (
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '-0.25rem' }}>
              Fetching location name...
            </div>
          )}

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
            <em>Drag the marker or click anywhere on the map to adjust the coordinates.</em>
          </div>
        </>
      )}

    </div>
  );
}
