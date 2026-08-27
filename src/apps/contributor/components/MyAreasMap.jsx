import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Minimize } from 'lucide-react';
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
 *
 * The leaflet container is a plain DOM node (not JSX-owned) so that
 * toggling fullscreen can move the same live map instance between the
 * inline slot and a document.body portal slot instead of destroying and
 * re-initializing it (which would lose zoom/markers and cause a flash).
 */
export default function MyAreasMap({ events, isFullscreen, onExitFullscreen }) {
  const inlineSlotRef = useRef(null);
  const fullscreenSlotRef = useRef(null);
  const mapContainerRef = useRef(null);
  const leafletMap = useRef(null);

  const valid = events.filter(
    (e) => e.lat != null && e.lon != null && !Number.isNaN(Number(e.lat)) && !Number.isNaN(Number(e.lon))
  );

  useEffect(() => {
    let cancelled = false;

    const initMap = async () => {
      const { default: L } = await import('leaflet');
      if (cancelled || leafletMap.current || !inlineSlotRef.current) return;

      const container = document.createElement('div');
      container.style.height = '100%';
      container.style.width = '100%';
      mapContainerRef.current = container;
      inlineSlotRef.current.appendChild(container);

      const map = L.map(container, {
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
        mapContainerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // Moves the live map container between the inline slot and the fullscreen
  // portal slot, then resizes it — leaflet only needs invalidateSize() after
  // its container's dimensions change, no re-init required.
  useEffect(() => {
    const container = mapContainerRef.current;
    const targetSlot = isFullscreen ? fullscreenSlotRef.current : inlineSlotRef.current;
    if (!container || !targetSlot) return;
    targetSlot.appendChild(container);
    const t = setTimeout(() => leafletMap.current?.invalidateSize(), 60);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onExitFullscreen(); };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  if (valid.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '2rem 0' }}>
        No located reports yet — locations show up here once your submissions include GPS.
      </div>
    );
  }

  return (
    <>
      <div ref={inlineSlotRef} style={{ height: '260px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />

      {isFullscreen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div ref={fullscreenSlotRef} style={{ height: '100%', width: '100%' }} />
            <button
              type="button"
              onClick={onExitFullscreen}
              aria-label="Close fullscreen map"
              style={{
                position: 'absolute', top: '16px', right: '16px', zIndex: 3001,
                width: '40px', height: '40px', padding: 0, borderRadius: '999px',
                background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              <Minimize size={18} strokeWidth={2.25} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
