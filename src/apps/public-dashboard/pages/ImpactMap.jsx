import { useEffect, useRef, useState } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import { useTheme } from '../../../context/ThemeContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import 'leaflet/dist/leaflet.css';

/* ─── Google-style red SVG pin ────────────────────────────────────────────── */
const createGooglePin = (label = '') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
      <defs>
        <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <!-- Pin body -->
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z"
            fill="#EA4335" filter="url(#shadow)"/>
      <!-- Inner circle white -->
      <circle cx="18" cy="18" r="7" fill="white"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/* ─── "Open in Maps" link ──────────────────────────────────────────────────── */
function OpenInMapsBtn({ lat, lng, label }) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="open-in-maps-btn"
      title="Open in Google Maps"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      Open in Maps
    </a>
  );
}

export default function ImpactMap() {
  const { activities, loading, error } = useActivities();
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const tileLayerRef = useRef(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(3);

  /* ── Tile URL helpers ──────────────────────────────────────────────────── */
  const getGoogleTileUrl = (maptype = 'roadmap') => {
    // Google Maps tile URL (publicly accessible, no API key needed for basic use)
    const t = maptype === 'satellite' ? 's' : 'm';
    return `https://mt{s}.google.com/vt/lyrs=${t}&x={x}&y={y}&z={z}`;
  };

  /* ── Initialize map ────────────────────────────────────────────────────── */
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

      leafletMap.current = map;

      // ── Plot markers ──
      const valid = activities.filter(
        (a) =>
          a.lat != null &&
          a.lon != null &&
          !isNaN(Number(a.lat)) &&
          !isNaN(Number(a.lon))
      );

      if (valid.length > 0) {
        const latLngs = valid.map((a) => [Number(a.lat), Number(a.lon)]);

        valid.forEach((activity, i) => {
          const [lat, lng] = latLngs[i];
          const locationLabel = activity.location || 'Ocean Cleanup Site';

          // Google-style DivIcon with pin + label
          const icon = L.divIcon({
            className: '',
            html: `
              <div class="gmap-pin-wrapper">
                <img src="${createGooglePin()}" width="36" height="46" alt="pin"/>
                <div class="gmap-pin-label">${locationLabel}</div>
              </div>`,
            iconSize: [36, 46],
            iconAnchor: [18, 46],
            popupAnchor: [0, -50],
          });

          const popupContent = `
            <div class="gmap-popup">
              <div class="gmap-popup-title">${locationLabel}</div>
              <div class="gmap-popup-row">
                <span class="gmap-popup-key">Category</span>
                <span class="gmap-popup-val">${activity.category || '—'}</span>
              </div>
              <div class="gmap-popup-row">
                <span class="gmap-popup-key">Quantity</span>
                <span class="gmap-popup-val">${activity.quantity ?? '—'} kg</span>
              </div>
              <div class="gmap-popup-row">
                <span class="gmap-popup-key">Status</span>
                <span class="gmap-popup-val gmap-status">${activity.status || '—'}</span>
              </div>
              <a class="gmap-directions-link"
                 href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}"
                 target="_blank" rel="noopener noreferrer">
                Directions
              </a>
            </div>`;

          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(popupContent, {
              maxWidth: 240,
              className: 'gmap-popup-container',
            });
        });

        if (valid.length === 1) {
          map.setView(latLngs[0], 10);
          setMapCenter(latLngs[0]);
        } else {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60] });
        }
      }

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
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activities]);

  if (error) return <div className="alert alert-danger">Error: {error.message}</div>;

  const googleMapsUrl = `https://www.google.com/maps/@${mapCenter[0]},${mapCenter[1]},${mapZoom}z`;

  return (
    <section>
      <div className="mb-6">
        <h3>Global Impact Map</h3>
        <p className="text-muted">Visualizing worldwide cleanup locations.</p>
      </div>

      {!loading && !error && activities.length === 0 && (
        <div className="alert alert-info" role="alert">
          The map is ready, but there are no cleanup activities to display at the moment.
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
            <LoadingSpinner />
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
