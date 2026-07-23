import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * LocationPicker — autocomplete location input backed by OpenStreetMap Nominatim.
 *
 * Props:
 *   value        – current display string (controlled)
 *   onChange(place) – called with { displayName, lat, lon } on selection
 *   placeholder  – input placeholder text
 *   required     – HTML required attribute
 */
export default function LocationPicker({ value, onChange, placeholder = 'Search location…', required }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Keep internal query in sync when parent resets the value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    // Notify parent that text changed but no place selected yet
    onChange({ displayName: q, lat: null, lon: null });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(q), 400);
  }

  function handleSelect(place) {
    const displayName = place.display_name;
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setQuery(displayName);
    setSuggestions([]);
    setOpen(false);
    onChange({ displayName, lat, lon });
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          style={{ paddingLeft: '2.25rem', paddingRight: loading ? '2.25rem' : undefined }}
        />

        {/* Spinner */}
        {loading && (
          <div style={{
            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            width: '14px', height: '14px', border: '2px solid var(--border-light)',
            borderTopColor: 'var(--primary)', borderRadius: '50%',
            animation: 'lp-spin 0.7s linear infinite'
          }} />
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--surface)', border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          listStyle: 'none', margin: 0, padding: '0.25rem 0',
          zIndex: 9999, maxHeight: '260px', overflowY: 'auto'
        }}>
          {suggestions.map((place) => (
            <li
              key={place.place_id}
              onMouseDown={() => handleSelect(place)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                padding: '0.65rem 0.875rem', cursor: 'pointer',
                transition: 'background 0.15s', borderBottom: '1px solid rgba(255,255,255,0.04)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Pin icon */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                  {place.display_name}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {parseFloat(place.lat).toFixed(5)}, {parseFloat(place.lon).toFixed(5)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        @keyframes lp-spin { to { transform: translateY(-50%) rotate(360deg); } }
      `}</style>
    </div>
  );
}
