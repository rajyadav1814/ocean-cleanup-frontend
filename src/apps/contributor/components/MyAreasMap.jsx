import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minimize } from 'lucide-react';
import { eventStateMeta } from '../eventMeta';
import { MAP_LAYERS } from '../../../utils/eventMapLayers';
import useOrganizations from '../../../hooks/useOrganizations';
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

// Compact layer-chip bar (spec §24: a map should answer questions, not
// just be a pin dump) — same MAP_LAYERS vocabulary as the public Global
// Impact Map, rendered small enough to fit inside the dashboard card and
// duplicated into the fullscreen overlay so it stays usable there too.
function LayerBar({ activeLayerId, onSelect, counts, compact }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: compact ? '0.6rem' : '0.75rem' }}>
      {MAP_LAYERS.map((layer) => {
        const active = layer.id === activeLayerId;
        return (
          <button
            key={layer.id}
            type="button"
            onClick={() => onSelect(layer)}
            style={{
              padding: compact ? '0.28rem 0.6rem' : '0.35rem 0.7rem',
              borderRadius: '999px',
              border: active ? '1px solid var(--primary)' : '1px solid var(--border-light)',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? '#fff' : 'var(--text-primary)',
              fontSize: compact ? '0.68rem' : '0.72rem',
              fontWeight: active ? 700 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {layer.label}{layer.id !== 'near-me' && layer.id !== 'by-org' ? ` (${counts[layer.id] ?? 0})` : ''}
          </button>
        );
      })}
    </div>
  );
}

/**
 * MyAreasMap — the contributor's own environmental events plotted by
 * location, pin color driven by event_state (not the legacy approval
 * status the public ImpactMap still uses) so a glance at the map shows
 * what's still open vs. addressed, matching the ontology's own state
 * vocabulary instead of a proxy for it.
 *
 * Layers (spec §24) reuse the same MAP_LAYERS definitions as the public
 * Global Impact Map, scoped to this contributor's own events, so "Where
 * are unresolved problems / What has changed recently / etc." are
 * answerable here too instead of the map just being a pin dump.
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
  const markersLayerRef = useRef(null);

  const { organizations } = useOrganizations();
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
      (e) => e.lat != null && e.lon != null && !Number.isNaN(Number(e.lat)) && !Number.isNaN(Number(e.lon))
    ),
    [events]
  );

  const layerCounts = useMemo(() => {
    const counts = {};
    MAP_LAYERS.forEach((layer) => {
      counts[layer.id] = layer.id === 'all' ? valid.length : valid.filter((e) => layer.test(e, layerContext)).length;
    });
    return counts;
  }, [valid, layerContext]);

  const layeredEvents = useMemo(
    () => valid.filter((e) => activeLayer.test(e, layerContext)),
    [valid, activeLayer, layerContext]
  );

  /* ── Initialize map (once) ─────────────────────────────────────────────── */
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

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMap.current = map;

      setTimeout(() => map.invalidateSize(), 300);
    };

    initMap();

    return () => {
      cancelled = true;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
        mapContainerRef.current = null;
        markersLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Redraw markers whenever the active layer's filtered set changes ────── */
  useEffect(() => {
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
            .addTo(markersLayer)
            .bindPopup(
              `<div style="font:600 0.8rem sans-serif;">${subjectLabel}</div>
               <div style="font:0.72rem sans-serif;color:#666;margin-top:2px;">${event.locationLabel || ''}</div>
               <div style="font:700 0.7rem sans-serif;color:${meta.color};margin-top:4px;text-transform:uppercase;">${meta.label}</div>`,
              { maxWidth: 220 }
            );
        });

        if (activeLayer.id === 'near-me' && userLocation) {
          map.setView(userLocation, 7);
        } else if (latLngs.length === 1) {
          map.setView(latLngs[0], 11);
        } else {
          map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });
        }
      } else if (activeLayer.id === 'near-me' && userLocation) {
        map.setView(userLocation, 7);
      }
    };

    drawMarkers();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layeredEvents, activeLayer.id, userLocation]);

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

  const orgPicker = activeLayer.id === 'by-org' && organizations.length > 0 && (
    <select
      value={selectedOrgId}
      onChange={(e) => setSelectedOrgId(e.target.value)}
      style={{
        padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-md, 6px)',
        border: '1px solid var(--border-light)', fontSize: '0.72rem', marginBottom: '0.6rem',
      }}
    >
      {organizations.map((org) => (
        <option key={org.orgId} value={org.orgId}>{org.name}</option>
      ))}
    </select>
  );

  const statusLine = (locationError || (activeLayer.id === 'near-me' && !userLocation)) && (
    <p style={{ margin: '0 0 0.6rem', fontSize: '0.72rem', color: locationError ? '#c14f2c' : 'var(--text-muted)' }}>
      {locationError || 'Waiting for your location…'}
    </p>
  );

  if (valid.length === 0) {
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', textAlign: 'center', padding: '2rem 0' }}>
        No located reports yet — locations show up here once your submissions include GPS.
      </div>
    );
  }

  return (
    <>
      <LayerBar activeLayerId={activeLayerId} onSelect={handleSelectLayer} counts={layerCounts} compact />
      {orgPicker}
      {statusLine}
      {layeredEvents.length === 0 && activeLayer.id !== 'near-me' && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.6rem' }}>
          No reports currently match "{activeLayer.label}".
        </div>
      )}

      <div ref={inlineSlotRef} style={{ height: '260px', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />

      {isFullscreen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0.9rem 1.1rem 0', flexShrink: 0 }}>
              <LayerBar activeLayerId={activeLayerId} onSelect={handleSelectLayer} counts={layerCounts} />
              {orgPicker}
              {statusLine}
            </div>
            <div ref={fullscreenSlotRef} style={{ flex: 1, width: '100%' }} />
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
