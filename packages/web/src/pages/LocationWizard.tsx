import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import cannaspyIcon from '../assets/cannaspy-icon.png';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../components/map/mapStyle';
import { useAuthFetch } from '../lib/useAuthFetch';

const API = import.meta.env.VITE_API_URL ?? '';

interface Location {
  id: string;
  name: string;
  address: string;
  dcc_license: string | null;
  active: boolean;
}

interface DispensarySuggestion {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  business_type: 'storefront' | 'delivery' | 'both';
  dcc_license: string | null;
  lat: number | null;
  lng: number | null;
}

const BTYPE_CONFIG = {
  storefront: { label: 'Storefront', bg: 'var(--accent-soft)', color: 'var(--accent)', border: 'rgba(9,161,161,0.3)' },
  delivery:   { label: 'Delivery',   bg: 'var(--warm-soft)',   color: 'var(--warm)',   border: 'rgba(186,117,23,0.3)' },
  both:       { label: 'Storefront + Delivery', bg: 'var(--surface-3)', color: 'var(--text-2)', border: 'var(--border-2)' },
} as const;

const TIER_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  elite:       { bg: 'rgba(211,150,166,0.13)', color: 'var(--rose)',  border: 'rgba(211,150,166,0.28)', label: 'ELITE' },
  hot:         { bg: 'rgba(246,201,146,0.13)', color: '#b8780a',      border: 'rgba(246,201,146,0.3)',  label: 'HOT' },
  competitive: { bg: 'var(--accent-soft)',      color: 'var(--accent)', border: 'rgba(9,161,161,0.22)',  label: 'COMPETITIVE' },
  standard:    { bg: 'var(--surface-3)',         color: 'var(--text-2)', border: 'var(--border)',         label: 'STANDARD' },
};

function TierBadge({ tier }: { tier: string }) {
  const s = TIER_STYLES[tier] ?? TIER_STYLES.standard;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 20, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.08em', whiteSpace: 'nowrap' as const, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      {s.label}
    </div>
  );
}

function StepBar({ active }: { active: number }) {
  const steps = [
    { n: '01', label: 'Org Setup', sub: 'Complete' },
    { n: '02', label: 'Add Locations', sub: 'Add your dispensaries' },
    { n: '03', label: 'Find Rivals', sub: 'Track & block' },
  ];
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 28px', display: 'flex', alignItems: 'center', marginBottom: 26, boxShadow: 'var(--card-shadow)' }}>
      {steps.map((s, i) => {
        const isDone = i < active;
        const isActive = i === active;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, position: 'relative' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500, flexShrink: 0,
              background: isDone ? 'var(--accent)' : isActive ? 'var(--accent)' : 'var(--surface-3)',
              color: isDone || isActive ? '#fff' : 'var(--text-3)',
              boxShadow: isActive ? '0 0 0 4px rgba(9,161,161,0.15)' : isDone ? '0 0 0 3px rgba(9,161,161,0.10)' : 'none',
            }}>
              {isDone ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: 14, height: 14 }}><polyline points="20 6 9 17 4 12" /></svg>
              ) : s.n}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isActive || isDone ? 'var(--text-1)' : 'var(--text-3)', whiteSpace: 'nowrap' as const }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' as const }}>{s.sub}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ position: 'absolute', left: 155, width: 'calc(100% - 160px)', height: 2, background: isDone ? 'var(--accent)' : 'var(--border-2)', top: '50%', transform: 'translateY(-50%)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '9px 12px', fontFamily: 'var(--sans)',
  fontSize: 13, color: 'var(--text-1)', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
  marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' as const,
};

export default function LocationWizard() {
  const navigate = useNavigate();
  const authFetch = useAuthFetch();

  const [locs, setLocs] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Name autocomplete state
  const [nameInput, setNameInput] = useState('');
  const [suggestions, setSuggestions] = useState<DispensarySuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameWrapRef = useRef<HTMLDivElement>(null);

  // Address autocomplete state
  const [addrInput, setAddrInput] = useState('');
  const [addrSuggestions, setAddrSuggestions] = useState<{ place_name: string; center: [number, number] }[]>([]);
  const [showAddrSuggestions, setShowAddrSuggestions] = useState(false);
  const [addrHighlightIdx, setAddrHighlightIdx] = useState(-1);
  const addrTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addrWrapRef = useRef<HTMLDivElement>(null);

  const licenseRef = useRef<HTMLInputElement>(null);

  const [viewport, setViewport] = useState({ lng: -117.5, lat: 33.9, zoom: 9 });
  const [markerPos, setMarkerPos] = useState<{ lng: number; lat: number } | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geocodeAddress = (addr: string) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (addr.length < 6) { setMarkerPos(null); return; }
    geocodeTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(addr)}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address,poi&limit=1`
        );
        const data = await res.json();
        if (data.features?.length) {
          const [lng, lat] = data.features[0].center;
          setMarkerPos({ lng, lat });
          setViewport({ lng, lat, zoom: 14 });
        }
      } catch {}
    }, 600);
  };

  const fetchAddrSuggestions = (q: string) => {
    if (addrTimer.current) clearTimeout(addrTimer.current);
    if (q.trim().length < 4) { setAddrSuggestions([]); setShowAddrSuggestions(false); return; }
    addrTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=US&types=address&limit=6&bbox=-124.4,32.5,-114.1,42.0`
        );
        const data = await res.json();
        if (data.features?.length) {
          setAddrSuggestions(data.features.map((f: any) => ({ place_name: f.place_name, center: f.center })));
          setShowAddrSuggestions(true);
          setAddrHighlightIdx(-1);
        } else {
          setAddrSuggestions([]);
          setShowAddrSuggestions(false);
        }
      } catch { setAddrSuggestions([]); setShowAddrSuggestions(false); }
    }, 300);
  };

  const selectAddrSuggestion = (s: { place_name: string; center: [number, number] }) => {
    const clean = s.place_name.replace(/, United States$/, '');
    setAddrInput(clean);
    setShowAddrSuggestions(false);
    setAddrSuggestions([]);
    const [lng, lat] = s.center;
    setMarkerPos({ lng, lat });
    setViewport({ lng, lat, zoom: 15 });
  };

  const fetchSuggestions = useCallback((q: string) => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (q.trim().length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await authFetch(`${API}/api/v1/map/suggest?q=${encodeURIComponent(q)}&limit=8`);
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setSuggestions(json.data);
          setShowSuggestions(true);
          setHighlightIdx(-1);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch { setSuggestions([]); setShowSuggestions(false); }
    }, 280);
  }, [authFetch]);

  const selectSuggestion = (s: DispensarySuggestion) => {
    setNameInput(s.name);
    setShowSuggestions(false);
    setSuggestions([]);
    const fullAddress = `${s.address}, ${s.city}, CA`;
    setAddrInput(fullAddress);
    if (licenseRef.current && s.dcc_license) licenseRef.current.value = s.dcc_license;
    if (s.lat && s.lng) {
      setMarkerPos({ lng: s.lng, lat: s.lat });
      setViewport({ lng: s.lng, lat: s.lat, zoom: 14 });
    } else {
      geocodeAddress(fullAddress);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameWrapRef.current && !nameWrapRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (addrWrapRef.current && !addrWrapRef.current.contains(e.target as Node)) {
        setShowAddrSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    authFetch(`${API}/api/v1/locations`)
      .then(r => r.json())
      .then(d => setLocs(d.locations ?? []))
      .catch(() => setLocs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    const name = nameInput.trim();
    const address = addrInput.trim();
    const dcc_license = licenseRef.current?.value.trim() || null;

    if (!name) { setFormError('Location name is required.'); return; }
    if (!address) { setFormError('Street address is required.'); return; }
    setFormError(null);
    setAddLoading(true);

    try {
      const res = await authFetch(`${API}/api/v1/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, ...(dcc_license ? { dcc_license } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to add location');
      setLocs(prev => [...prev, { id: data.id, name, address, dcc_license, active: true }]);
      setNameInput('');
      setAddrInput('');
      if (licenseRef.current) licenseRef.current.value = '';
      setMarkerPos(null);
      showToast(`${name} added`);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const handleNext = () => {
    if (!locs.length) { showToast('Add at least one location to continue.'); return; }
    setNextLoading(true);
    setTimeout(() => navigate('/setup/competitors'), 400);
  };

  const removeLocation = async (id: string) => {
    setLocs(prev => prev.filter(l => l.id !== id));
    await authFetch(`${API}/api/v1/locations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    }).catch(() => {});
  };

  const btnNext: React.CSSProperties = { flex: 2, background: locs.length ? 'var(--accent)' : 'var(--surface-3)', color: locs.length ? '#fff' : 'var(--text-3)', border: 'none', borderRadius: 'var(--r-sm)', padding: '11px 20px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: locs.length ? 'pointer' : 'default', boxShadow: locs.length ? '0 4px 18px rgba(9,161,161,0.32)' : 'none' };
  const btnBack: React.CSSProperties = { flex: 1, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1a2f42', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src={cannaspyIcon} alt="CannaSpy" style={{ width: 32, height: 32 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Add your dispensary locations</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 2 }}>SCREEN 02 · LOCATION WIZARD · STEP 2 OF 3</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #09A1A1, #D396A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', boxShadow: '0 2px 8px rgba(9,161,161,0.3)' }}>CS</div>
        </div>
      </div>

      {/* Page */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <StepBar active={1} />

        <div style={{ maxWidth: 740, margin: '0 auto' }}>

            {/* Add form */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '26px 28px', boxShadow: 'var(--card-shadow)', marginBottom: 18 }}>
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>Add a location</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>Each location gets independent monitoring and its own rival set.</div>
              </div>

              {/* Live map */}
              <div style={{ borderRadius: 'var(--r-sm)', overflow: 'hidden', marginBottom: 16, height: 200, border: '1.5px solid var(--border-2)' }}>
                <Map
                  mapboxAccessToken={MAPBOX_TOKEN}
                  longitude={viewport.lng}
                  latitude={viewport.lat}
                  zoom={viewport.zoom}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  onMove={e => setViewport({ lng: e.viewState.longitude, lat: e.viewState.latitude, zoom: e.viewState.zoom })}
                >
                  <NavigationControl position="top-right" />
                  {markerPos && (
                    <Marker longitude={markerPos.lng} latitude={markerPos.lat} anchor="bottom">
                      <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', boxShadow: '0 4px 14px rgba(9,161,161,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', transform: 'rotate(45deg)' }} />
                      </div>
                    </Marker>
                  )}
                </Map>
              </div>

              <div style={{ marginBottom: 15, position: 'relative' }} ref={nameWrapRef}>
                <label style={labelStyle}>Location name <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Start typing your dispensary name…"
                  style={inputStyle}
                  value={nameInput}
                  onChange={e => { setNameInput(e.target.value); fetchSuggestions(e.target.value); }}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onKeyDown={e => {
                    if (!showSuggestions) return;
                    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
                    else if (e.key === 'Enter' && highlightIdx >= 0) { e.preventDefault(); selectSuggestion(suggestions[highlightIdx]); }
                    else if (e.key === 'Escape') setShowSuggestions(false);
                  }}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9000,
                    background: 'var(--surface)', border: '1px solid var(--border-2)',
                    borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                    marginTop: 4, overflow: 'hidden',
                  }}>
                    {suggestions.map((s, i) => {
                      const bt = BTYPE_CONFIG[s.business_type] ?? BTYPE_CONFIG.storefront;
                      const isHigh = i === highlightIdx;
                      return (
                        <div
                          key={s.id}
                          onMouseDown={() => selectSuggestion(s)}
                          onMouseEnter={() => setHighlightIdx(i)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
                            cursor: 'pointer', background: isHigh ? 'var(--surface-2)' : 'transparent',
                            borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          {/* Icon */}
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: bt.bg, border: `1px solid ${bt.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke={bt.color} strokeWidth="2" style={{ width: 14, height: 14 }}>
                              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                              <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                          </div>
                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{s.address}, {s.city}, CA</div>
                          </div>
                          {/* Badge */}
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', padding: '3px 8px', borderRadius: 20, background: bt.bg, color: bt.color, border: `1px solid ${bt.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {bt.label.toUpperCase()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 15, position: 'relative' }} ref={addrWrapRef}>
                <label style={labelStyle}>Full address <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Start typing the street address…"
                  style={inputStyle}
                  value={addrInput}
                  autoComplete="off"
                  onChange={e => { setAddrInput(e.target.value); fetchAddrSuggestions(e.target.value); }}
                  onFocus={() => { if (addrSuggestions.length > 0) setShowAddrSuggestions(true); }}
                  onKeyDown={e => {
                    if (!showAddrSuggestions) return;
                    if (e.key === 'ArrowDown') { e.preventDefault(); setAddrHighlightIdx(i => Math.min(i + 1, addrSuggestions.length - 1)); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); setAddrHighlightIdx(i => Math.max(i - 1, 0)); }
                    else if (e.key === 'Enter' && addrHighlightIdx >= 0) { e.preventDefault(); selectAddrSuggestion(addrSuggestions[addrHighlightIdx]); }
                    else if (e.key === 'Escape') setShowAddrSuggestions(false);
                  }}
                />
                {showAddrSuggestions && addrSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9000,
                    background: 'var(--surface)', border: '1px solid var(--border-2)',
                    borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                    marginTop: 4, overflow: 'hidden',
                  }}>
                    {addrSuggestions.map((s, i) => {
                      const isHigh = i === addrHighlightIdx;
                      const [street, ...rest] = s.place_name.replace(/, United States$/, '').split(', ');
                      return (
                        <div
                          key={i}
                          onMouseDown={() => selectAddrSuggestion(s)}
                          onMouseEnter={() => setAddrHighlightIdx(i)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px',
                            cursor: 'pointer', background: isHigh ? 'var(--surface-2)' : 'transparent',
                            borderBottom: i < addrSuggestions.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--surface-3)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" style={{ width: 13, height: 13 }}>
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                            </svg>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{street}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{rest.join(', ')}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 6 }}>
                <label style={labelStyle}>DCC License #</label>
                <input ref={licenseRef} type="text" placeholder="C10-0000000-LIC" style={inputStyle} />
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>California retailer license (optional).</div>
              </div>

              {formError && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(212,83,126,0.1)', border: '1px solid rgba(212,83,126,0.3)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--rose)' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  style={{ ...btnNext, flex: 1, boxShadow: '0 4px 18px rgba(9,161,161,0.32)', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}
                  onClick={handleAdd}
                  disabled={addLoading}
                >
                  {addLoading ? 'Adding…' : 'Add this location +'}
                </button>
              </div>
            </div>

            {/* Added locations */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '26px 28px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Locations added</div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid rgba(9,161,161,0.22)', padding: '2px 9px', borderRadius: 20 }}>{locs.length}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Each is an independent monitoring node.</div>
              </div>

              {loading ? (
                <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>Loading…</div>
              ) : locs.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center' as const, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', border: '1.5px dashed var(--border-2)', borderRadius: 'var(--r-sm)' }}>
                  No locations added yet. Fill in the form above to add your first.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {locs.map(loc => (
                    <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(9,161,161,0.32)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ width: 13, height: 13 }}><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{loc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{loc.address}</div>
                      </div>
                      {loc.dcc_license && (
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', border: '1px solid var(--border-2)', borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap' as const }}>{loc.dcc_license}</div>
                      )}
                      <button onClick={() => removeLocation(loc.id)} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--border-2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button style={btnBack} onClick={() => navigate('/setup')}>← Back</button>
                <button style={btnNext} onClick={handleNext} disabled={nextLoading || !locs.length}>
                  {nextLoading ? 'Loading rivals…' : locs.length ? 'Continue to Rival Discovery →' : 'Add a location to continue'}
                </button>
              </div>
            </div>

            {/* Pro tip strip */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 20px', marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 12, boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid rgba(9,161,161,0.22)', borderRadius: 20, padding: '4px 10px', whiteSpace: 'nowrap' as const, marginTop: 1 }}>TIP</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
                Add all your locations before moving to step 3 — rival discovery runs independently per location, so each market gets its own competitor set. You can add more locations from Location Management at any time.
              </div>
            </div>

        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text-1)', color: 'var(--surface)', padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', zIndex: 9000, letterSpacing: '0.04em' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
