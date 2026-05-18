import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthFetch } from '../lib/useAuthFetch';

const API = import.meta.env.VITE_API_URL ?? '';

interface Location {
  id: string;
  name: string;
  address: string;
  dcc_license: string | null;
  active: boolean;
}

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

const TOTAL_SLOTS = 50;

export default function LocationWizard() {
  const navigate = useNavigate();
  const authFetch = useAuthFetch();

  const [locs, setLocs] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  const usedSlots = locs.length * 5;
  const fillPct = Math.min((usedSlots / TOTAL_SLOTS) * 100, 100);

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
    const name = nameRef.current?.value.trim() ?? '';
    const address = addressRef.current?.value.trim() ?? '';
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
      if (nameRef.current) nameRef.current.value = '';
      if (addressRef.current) addressRef.current.value = '';
      if (licenseRef.current) licenseRef.current.value = '';
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 20, alignItems: 'start' }}>

          {/* Left */}
          <div>
            {/* Add form */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '26px 28px', boxShadow: 'var(--card-shadow)', marginBottom: 18 }}>
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>Add a location</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>Each location gets independent monitoring and its own rival set.</div>
              </div>

              {/* Map placeholder */}
              <div style={{ background: 'var(--surface-3)', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', height: 168, position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(84,132,164,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(84,132,164,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div style={{ position: 'absolute', top: '38%', left: 0, right: 0, height: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', top: '64%', left: 0, right: 0, height: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: '34%', top: 0, bottom: 0, width: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', top: '12%', left: '36%', width: '28%', height: '22%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '42%', left: '8%', width: '23%', height: '18%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '42%', left: '70%', width: '20%', height: '18%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '68%', left: '36%', width: '28%', height: '20%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -68%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', width: 24, height: 24 }}>
                    <div style={{ position: 'absolute', top: -4, left: -4, width: 30, height: 30, borderRadius: '50%', background: 'rgba(9,161,161,0.2)' }} />
                    <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', boxShadow: '0 4px 14px rgba(9,161,161,0.5)' }} />
                    <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', position: 'absolute', top: 7, left: 7 }} />
                  </div>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' as const, boxShadow: 'var(--card-shadow)' }}>Your location</div>
                </div>
                <div style={{ position: 'absolute', bottom: 9, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', whiteSpace: 'nowrap' as const }}>ADDRESS AUTO-PINS AS YOU TYPE</div>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Location name <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input ref={nameRef} type="text" placeholder="e.g. West Hollywood Flagship" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Full address <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input ref={addressRef} type="text" placeholder="e.g. 8001 Santa Monica Blvd, West Hollywood, CA 90046" style={inputStyle} />
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
          </div>

          {/* Right */}
          <div>
            {/* Slot usage */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 22, boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Slot usage</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{usedSlots} / {TOTAL_SLOTS}</div>
              </div>
              <div style={{ background: 'var(--surface-3)', borderRadius: 6, height: 7, overflow: 'hidden', margin: '10px 0 6px' }}>
                <div style={{ height: '100%', borderRadius: 6, background: 'linear-gradient(90deg, #09A1A1, #F6C992)', width: `${fillPct}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                <span>0 used</span><span>{usedSlots} reserved</span><span>{TOTAL_SLOTS - usedSlots} free</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', lineHeight: 1.65 }}>
                Slots assigned in step 3 when you add rivals. Adjust total from Billing anytime.
              </div>
            </div>

            {/* Market coverage */}
            {locs.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 22, boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)', letterSpacing: '-0.01em' }}>Market coverage</div>
                {locs.map((loc, i) => (
                  <div key={loc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < locs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 170 }}>{loc.name}</div>
                    <TierBadge tier="standard" />
                  </div>
                ))}
              </div>
            )}

            {/* Pro tip */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 22, boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)', letterSpacing: '-0.01em' }}>Pro tip</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.75 }}>
                Add all locations before step 3. Rival discovery runs per location — WeHo competitors differ from Long Beach.<br /><br />
                <strong style={{ color: 'var(--text-1)' }}>Missing one later?</strong> Add from Location Management — each new location auto-expands slot count.
              </div>
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
