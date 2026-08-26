import { useEffect, useRef } from 'react';
import { eventStateMeta } from '../eventMeta';
import 'leaflet/dist/leaflet.css';

const createPin = (fillColor) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 36 46">
      <defs>
        <filter id="shadow" x="-30%" y="-10%" width="160%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
        </filter>
      </defs>
      <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z"
            fill="${fillColor}" filter="url(#shadow)"/>
      <circle cx="18" cy="18" r="7" fill="white"/>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

/**
 * MyAreasMap — the contributor's own environmental events plotted by
 * location, pin color driven by event_state (not the legacy approval
 * status the public ImpactMap still uses) so a glance at the map shows
 * what's still open vs. addressed, matching the ontology's own state
 * vocabulary instead of a proxy for it.
 */
export default function MyAreasMap({ events }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);

  const valid = events.filter(
    (e) => e.lat != null && e.lon != null && !Number.isNaN(Number(e.lat)) && !Number.isNaN(Number(e.lon))
  );

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      const { default: L } = await import('leaflet');
      if (cancelled || leafletMap.current || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 3,
        zoomControl: false,
        attributionControl: true,
      });
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy;2026 Google',
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        tileSize: 256,
      }).addTo(map);

      leafletMap.current = map;

      if (valid.length > 0) {
        const latLngs = valid.map((e) => [Number(e.lat), Number(e.lon)]);

        valid.forEach((event, i) => {
          const [lat, lng] = latLngs[i];
          const meta = eventStateMeta(event.eventState);
          const subjectLabel = event.subjects?.map((s) => s.label).join(', ') || 'Report';
          const icon = L.divIcon({
            className: '',
            html: `<img src="${createPin(meta.color)}" width="30" height="38" alt="pin"/>`,
            iconSize: [30, 38],
            iconAnchor: [15, 38],
            popupAnchor: [0, -40],
          });

          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(
              `<div style="font:600 0.8rem sans-serif;">${subjectLabel}</div>
               <div style="font:0.72rem sans-serif;color:#666;margin-top:2px;">${event.locationLabel || ''}</div>
               <div style="font:700 0.7rem sans-serif;color:${meta.color};margin-top:4px;text-transform:uppercase;">${meta.label}</div>`,
              { maxWidth: 220 }
            );
        });

        if (valid.length === 1) {
          map.setView(latLngs[0], 11);
        } else {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
        }
      }

      setTimeout(() => map.invalidateSize(), 300);
    };

    initMap();

    return () => {
      cancelled = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  if (valid.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '2rem 0' }}>
        No located reports yet — locations show up here once your submissions include GPS.
      </div>
    );
  }

  return <div ref={mapRef} style={{ height: '260px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />;
}
