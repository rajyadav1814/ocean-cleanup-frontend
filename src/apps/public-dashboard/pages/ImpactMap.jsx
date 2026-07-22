import { useEffect, useRef } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import { useTheme } from '../../../context/ThemeContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
// Static import guarantees Leaflet CSS is in the bundle BEFORE any JS runs
import 'leaflet/dist/leaflet.css';

export default function ImpactMap() {
  const { activities, loading, error } = useActivities();
  const { theme } = useTheme();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize map once loading is complete
  useEffect(() => {
    if (loading) return;

    const initMap = async () => {
      const { default: L } = await import('leaflet');

      // Fix broken default icon paths in Vite builds
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (leafletMap.current || !mapRef.current) return; // already initialized

      const map = L.map(mapRef.current, {
        center: [19.9340979, 67.3750703],
        zoom: 3,
        zoomControl: true,
      });

      // Always use OpenStreetMap — dark mode is handled via CSS filter below
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      leafletMap.current = map;

      // Plot markers
      const valid = activities.filter(
        a => a.latitude != null && a.longitude != null &&
          !isNaN(Number(a.latitude)) && !isNaN(Number(a.longitude))
      );

      if (valid.length > 0) {
        const latLngs = valid.map(a => [Number(a.latitude), Number(a.longitude)]);

        valid.forEach((activity, i) => {
          L.marker(latLngs[i]).addTo(map).bindPopup(`
            <div style="font-family:sans-serif;min-width:160px;">
              <strong style="display:block;margin-bottom:4px;">${activity.location || 'Unknown location'}</strong>
              <span>Category: ${activity.category || '—'}</span><br/>
              <span>Quantity: ${activity.quantity ?? '—'} kg</span><br/>
              <span>Status: <b>${activity.status || '—'}</b></span>
            </div>
          `);
        });

        if (valid.length === 1) {
          map.setView(latLngs[0], 10);
        } else {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50] });
        }
      }

      // Fixes "grey tiles" caused by size miscalculation in flex/grid containers
      setTimeout(() => map.invalidateSize(), 250);
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

  const isDark = theme !== 'light';

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
        {loading ? (
          <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : (
          <div
            ref={mapRef}
            id="impact-map"
            style={{
              height: '100%',
              width: '100%',
              // CSS filter for dark mode — inverts OSM tiles into a beautiful dark map
              // Water → dark blue, land → dark grey, labels remain readable
              filter: isDark
                ? 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(85%)'
                : 'none',
            }}
          />
        )}
      </div>
    </section>
  );
}
