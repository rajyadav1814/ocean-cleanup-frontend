import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [position, setPosition] = useState(lat && lon ? { lat, lng: lon } : null);
  const [locationName, setLocationName] = useState(value || '');
  const [isFetchingName, setIsFetchingName] = useState(false);
  const markerRef = useRef(null);

  // Helper to reverse geocode lat/lng to a place name
  const fetchLocationName = async (lat, lng) => {
    try {
      setIsFetchingName(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        // Use a shorter name if possible (e.g. city/town/village/suburb)
        const address = data.address || {};
        const shortName = address.amenity || address.road || address.village || address.suburb || address.city || address.town || data.name;
        
        // If we found a short recognizable name, use it + the broader region, else fallback to full display_name
        if (shortName && address.state) {
           setLocationName(`${shortName}, ${address.state}`);
        } else {
           setLocationName(data.display_name.split(',').slice(0, 3).join(','));
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding failed', err);
    } finally {
      setIsFetchingName(false);
    }
  };

  // Initialize with current location if no lat/lon is provided
  useEffect(() => {
    if (!lat && !lon) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPosition(newPos);
            fetchLocationName(newPos.lat, newPos.lng);
          },
          (err) => {
            console.warn('Geolocation error:', err);
            // Fallback to a default location (e.g. London) if geolocation fails
            setPosition({ lat: 51.505, lng: -0.09 });
            fetchLocationName(51.505, -0.09);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        setPosition({ lat: 51.505, lng: -0.09 });
        fetchLocationName(51.505, -0.09);
      }
    }
  }, [lat, lon]);

  // Sync internal state to parent when internal state changes
  useEffect(() => {
    if (position) {
      onChange({ displayName: locationName, lat: position.lat, lon: position.lng });
    }
  }, [position, locationName]); 

  // When clicking on the map (handled in MapEvents), we want to fetch the name
  // To avoid modifying MapEvents, we can just hook into handleDragEnd and also map clicks.
  // We'll update MapEvents to call fetchLocationName.

  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker != null) {
      const newPos = marker.getLatLng();
      setPosition(newPos);
      fetchLocationName(newPos.lat, newPos.lng);
    }
  }, []);

  // Update MapEvents component locally inside the file scope (since it's defined above)
  // Actually MapEvents is outside this scope. Let's just create an inline one here, or pass it.


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      {/* Name Input */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <input 
          type="text" 
          placeholder="Enter a custom name for this location (e.g. Rozi Beach)..." 
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          required
        />
      </div>

      {/* Map Container */}
      <div style={{ position: 'relative', height: '300px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
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
            <MapEvents position={position} setPosition={setPosition} onPositionChange={fetchLocationName} />
          </MapContainer>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
            Loading map...
          </div>
        )}
      </div>

      {/* Lat/Lng display (read-only to show they are captured) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%' }}>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
          <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Latitude</label>
          <input 
            type="text" 
            value={position ? position.lat.toFixed(6) : ''} 
            readOnly 
            style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', width: '100%', minWidth: 0, padding: '0.75rem 1rem' }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 0 }}>
          <label style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Longitude</label>
          <input 
            type="text" 
            value={position ? (position.lng || position.lon || 0).toFixed(6) : ''} 
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

    </div>
  );
}
