import { useEffect, useMemo, useRef, useState } from 'react';
import { useEvents } from '../../../hooks/useEvents';
import useOrganizations from '../../../hooks/useOrganizations';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { eventStateMeta, verificationStateMeta } from '../../contributor/eventMeta';
import { MAP_LAYERS } from '../../../utils/eventMapLayers';
import 'leaflet/dist/leaflet.css';

/* ─── Google-style marker SVG pin ───────────────────────────────────────────── */
const createGooglePin = (fillColor = '#1a73e8') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <defs>
        <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <!-- Pin body -->
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z"
            fill="${fillColor}" filter="url(#shadow)"/>
      <!-- Inner circle white -->
      <circle cx="18" cy="18" r="7" fill="white"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export default function ImpactMap() {
  // Global/public scope — no contributorId filter, matching this page's
  // existing "everyone's activity, worldwide" role. Pins are colored by
  // event_state now (spec §24: "where are unresolved problems / where's
  // pollution recurring" — a map should answer questions, not just be a
  // pin dump), not the old legacy approval status.
  const { events, loading, error } = useEvents();
  const { organizations } = useOrganizations();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(3);
  const [activeLayerId, setActiveLayerId] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const activeLayer = MAP_LAYERS.find((l) => l.id === activeLayerId) || MAP_LAYERS[0];
  const layerContext = useMemo(
    () => ({ userLocation, organizationId: selectedOrgId || null }),
    [userLocation, selectedOrgId]
  );

  const handleSelectLayer = (layer) => {
    setActiveLayerId(layer.id);
    setLocationError(null);
    if (layer.needsLocation && !userLocation) {
      if (!navigator.geolocation) {
        setLocationError('Location is not available in this browser.');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        () => setLocationError('Could not get your location — check permissions.'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
    if (layer.needsOrganization && !selectedOrgId && organizations.length > 0) {
      setSelectedOrgId(organizations[0].orgId);
    }
  };

  const valid = useMemo(
    () => events.filter(
      (e) => e.lat != null && e.lon != null && !isNaN(Number(e.lat)) && !isNaN(Number(e.lon))
    ),
    [events]
  );

  const layeredEvents = useMemo(
    () => valid.filter((e) => activeLayer.test(e, layerContext)),
    [valid, activeLayer, layerContext]
  );

  /* ── Tile URL helpers ──────────────────────────────────────────────────── */
  const getGoogleTileUrl = (maptype = 'roadmap') => {
    // Google Maps tile URL (publicly accessible, no API key needed for basic use)
    const t = maptype === 'satellite' ? 's' : 'm';
    return `https://mt{s}.google.com/vt/lyrs=${t}&x={x}&y={y}&z={z}`;
  };

  /* ── Initialize map (once) ─────────────────────────────────────────────── */
  useEffect(() => {
    if (loading) return;

    const initMap = async () => {
      const { default: L } = await import('leaflet');

      if (leafletMap.current || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 3,
        zoomControl: false,         // We add it manually at bottom-right
        attributionControl: true,
      });

      // ── Bottom-right zoom control (Google Maps style) ──
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // ── Google Maps Roadmap tiles ──
      tileLayerRef.current = L.tileLayer(
        getGoogleTileUrl('roadmap'),
        {
          attribution:
            'Map data &copy;2026 Google',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          tileSize: 256,
        }
      ).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMap.current = map;

      // Track center/zoom for "Open in Maps" button
      map.on('moveend zoomend', () => {
        const c = map.getCenter();
        setMapCenter([c.lat, c.lng]);
        setMapZoom(map.getZoom());
      });

      setTimeout(() => map.invalidateSize(), 300);
    };

    initMap();

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  /* ── Redraw markers whenever the active layer's filtered set changes ────── */
  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    const drawMarkers = async () => {
      const { default: L } = await import('leaflet');
      const map = leafletMap.current;
      const markersLayer = markersLayerRef.current;
      if (cancelled || !map || !markersLayer) return;

      markersLayer.clearLayers();

      if (layeredEvents.length > 0) {
        const latLngs = layeredEvents.map((e) => [Number(e.lat), Number(e.lon)]);

        layeredEvents.forEach((event, i) => {
          const [lat, lng] = latLngs[i];
          const locationLabel = event.locationLabel || 'BlueMind Activity Site';
          const stateMeta = eventStateMeta(event.eventState);
          const verMeta = verificationStateMeta(event.verificationState);
          const subjectLabel = event.subjects?.map((s) => s.label).join(', ') || 'Unclassified';

          // Plain pin marker, details move into the click popup
          const icon = L.divIcon({
            className: '',
            html: `
              <div class="gmap-pin-wrapper" aria-label="${locationLabel}">
                <img src="${createGooglePin(stateMeta.color)}" width="36" height="46" alt="pin"/>
              </div>`,
            iconSize: [36, 46],
            iconAnchor: [18, 46],
            popupAnchor: [0, -50],
          });

          const popupContent = `
            <div class="gmap-popup">
              <div class="gmap-popup-title">${locationLabel}</div>
              <div class="gmap-popup-row">
                <span class="gmap-popup-key">Subjects</span>
                <span class="gmap-popup-val">${subjectLabel}</span>
              </div>
              <div class="gmap-popup-row">
                <span class="gmap-popup-key">State</span>
                <span class="gmap-popup-val gmap-status" style="color: ${stateMeta.color}">${stateMeta.label}</span>
              </div>
              <div class="gmap-popup-row">
                <span class="gmap-popup-key">Verification</span>
                <span class="gmap-popup-val gmap-status" style="color: ${verMeta.color}">${verMeta.label}</span>
              </div>
              <a class="gmap-directions-link"
                 href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}"
                 target="_blank" rel="noopener noreferrer">
                Directions
              </a>
            </div>`;

          L.marker([lat, lng], { icon })
            .addTo(markersLayer)
            .bindPopup(popupContent, {
              maxWidth: 240,
              className: 'gmap-popup-container',
            });
        });

        if (activeLayer.id === 'near-me' && userLocation) {
          map.setView(userLocation, 7);
          setMapCenter(userLocation);
        } else if (latLngs.length === 1) {
          map.setView(latLngs[0], 10);
          setMapCenter(latLngs[0]);
        } else {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60] });
        }
      } else if (activeLayer.id === 'near-me' && userLocation) {
        map.setView(userLocation, 7);
        setMapCenter(userLocation);
      }
    };

    drawMarkers();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, layeredEvents, activeLayer.id, userLocation]);

  if (error) return <div className="alert alert-danger">Error: {error.message}</div>;

  const googleMapsUrl = `https://www.google.com/maps/@${mapCenter[0]},${mapCenter[1]},${mapZoom}z`;

  return (
    <section style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="card mb-6" style={{ flexShrink: 0, padding: '1.25rem 1.75rem' }}>
        <h3 style={{ marginBottom: '0.25rem' }}>Global Impact Map</h3>
        <p className="text-muted" style={{ margin: '0 0 0.9rem' }}>{activeLayer.question}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {MAP_LAYERS.map((layer) => {
            const active = layer.id === activeLayerId;
            const count = layer.id === 'all' ? valid.length : valid.filter((e) => layer.test(e, layerContext)).length;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => handleSelectLayer(layer)}
                disabled={loading}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '999px',
                  border: active ? '1px solid var(--accent, #1a73e8)' : '1px solid var(--border, #dadce0)',
                  background: active ? 'var(--accent, #1a73e8)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-primary, #202124)',
                  fontSize: '0.8rem',
                  fontWeight: active ? 600 : 500,
                  cursor: loading ? 'default' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {layer.label}{layer.id !== 'near-me' && layer.id !== 'by-org' ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>

        {activeLayer.id === 'by-org' && (
          <div style={{ marginTop: '0.75rem' }}>
            {organizations.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.78rem' }} className="text-muted">No organizations found.</p>
            ) : (
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                style={{
                  padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-md, 6px)',
                  border: '1px solid var(--border, #dadce0)', fontSize: '0.8rem',
                }}
              >
                {organizations.map((org) => (
                  <option key={org.orgId} value={org.orgId}>{org.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {locationError && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.78rem', color: '#c14f2c' }}>{locationError}</p>
        )}
        {activeLayer.id === 'near-me' && !locationError && !userLocation && (
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.78rem' }} className="text-muted">
            Waiting for your location…
          </p>
        )}
      </div>

      {!loading && !error && valid.length === 0 && (
        <div className="alert alert-info" role="alert">
          The map is ready, but there are no environmental events to display at the moment.
        </div>
      )}
      {!loading && !error && valid.length > 0 && layeredEvents.length === 0 && activeLayer.id !== 'near-me' && (
        <div className="alert alert-info" role="alert">
          No events currently match "{activeLayer.label}".
        </div>
      )}

      <div className="map-wrapper">
        {/* "Open in Maps" overlay button — top-left like Google Maps */}
        {!loading && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="open-in-maps-btn"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Open in Maps
          </a>
        )}

        {loading ? (
          <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingSpinner layout="map" />
          </div>
        ) : (
          <div
            ref={mapRef}
            id="impact-map"
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </div>
    </section>
  );
}
