import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AddedLocation {
  id: string;
  name: string;
  address: string;
  tier: 'elite' | 'hot' | 'competitive' | 'standard';
}

const INITIAL_LOCS: AddedLocation[] = [
  { id: '1', name: 'West Hollywood Flagship', address: '8001 Santa Monica Blvd, West Hollywood, CA 90046', tier: 'elite' },
  { id: '2', name: 'DTLA — South Figueroa', address: '1234 S Figueroa St, Los Angeles, CA 90015', tier: 'elite' },
  { id: '3', name: 'Long Beach — Pacific Coast', address: '500 Pacific Coast Hwy, Long Beach, CA 90802', tier: 'competitive' },
];

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
    { n: '02', label: 'Add Locations', sub: '3 of 10+ added' },
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
  const [locs, setLocs] = useState<AddedLocation[]>(INITIAL_LOCS);
  const [addLoading, setAddLoading] = useState(false);
  const [nextLoading, setNextLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const usedSlots = locs.length * 5; // rough estimate
  const fillPct = Math.min((usedSlots / TOTAL_SLOTS) * 100, 100);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleAdd = () => {
    setAddLoading(true);
    setTimeout(() => {
      setAddLoading(false);
      showToast('Location added');
    }, 1000);
  };

  const handleNext = () => {
    setNextLoading(true);
    setTimeout(() => {
      navigate('/setup/competitors');
    }, 1200);
  };

  const removeLocation = (id: string) => {
    setLocs(prev => prev.filter(l => l.id !== id));
  };

  const btnNext: React.CSSProperties = { flex: 2, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', padding: '11px 20px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 18px rgba(9,161,161,0.32)' };
  const btnBack: React.CSSProperties = { flex: 1, background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer' };

  const marketCoverage = [
    { name: 'West Hollywood', tier: 'elite' },
    { name: 'Downtown LA', tier: 'elite' },
    { name: 'Long Beach', tier: 'competitive' },
    { name: '+ 7 more pending', tier: 'pending' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Add your dispensary locations</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 2 }}>SCREEN 02 · LOCATION WIZARD · STEP 2 OF 3</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', padding: '5px 10px', border: '1px solid var(--border-2)', borderRadius: 20 }}>PACIFIC MSO GROUP</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #09A1A1, #D396A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', boxShadow: '0 2px 8px rgba(9,161,161,0.3)' }}>PS</div>
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
                {/* Grid lines */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(84,132,164,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(84,132,164,0.08) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* Roads */}
                <div style={{ position: 'absolute', top: '38%', left: 0, right: 0, height: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', top: '64%', left: 0, right: 0, height: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: '34%', top: 0, bottom: 0, width: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: '66%', top: 0, bottom: 0, width: 5, background: 'var(--border-2)', borderRadius: 2 }} />
                {/* Blocks */}
                <div style={{ position: 'absolute', top: '12%', left: '36%', width: '28%', height: '22%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '42%', left: '8%', width: '23%', height: '18%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '42%', left: '70%', width: '20%', height: '18%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                <div style={{ position: 'absolute', top: '68%', left: '36%', width: '28%', height: '20%', background: 'rgba(84,132,164,0.07)', borderRadius: 3 }} />
                {/* Pin */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -68%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ position: 'relative', width: 24, height: 24 }}>
                    <div style={{ position: 'absolute', top: -4, left: -4, width: 30, height: 30, borderRadius: '50%', background: 'rgba(9,161,161,0.2)', animation: 'pinPulse 2s ease-out infinite' }} />
                    <div style={{ width: 22, height: 22, background: 'var(--accent)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', boxShadow: '0 4px 14px rgba(9,161,161,0.5)' }} />
                    <div style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', position: 'absolute', top: 7, left: 7 }} />
                  </div>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-1)', whiteSpace: 'nowrap' as const, boxShadow: 'var(--card-shadow)' }}>West Hollywood, CA</div>
                </div>
                <div style={{ position: 'absolute', bottom: 9, left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', whiteSpace: 'nowrap' as const }}>ADDRESS AUTO-PINS AS YOU TYPE</div>
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Location name <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input type="text" placeholder="e.g. West Hollywood Flagship" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 15 }}>
                <label style={labelStyle}>Street address <span style={{ color: 'var(--rose)' }}>*</span></label>
                <input type="text" placeholder="Start typing — Google Places autocomplete" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 15 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input type="text" placeholder="West Hollywood" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>ZIP</label>
                  <input type="text" placeholder="90046" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, marginBottom: 6 }}>
                <div>
                  <label style={labelStyle}>DCC License # <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="text" placeholder="C10-0000000-LIC" style={inputStyle} />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>California retailer license.</div>
                </div>
                <div>
                  <label style={labelStyle}>Market tier</label>
                  <select defaultValue="Hot" style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235484A4' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center', paddingRight: 30 }}>
                    <option>Auto-detect</option>
                    <option>Standard — $100/slot</option>
                    <option>Competitive — $150/slot</option>
                    <option>Hot — $200/slot</option>
                    <option>Elite — $250–300/slot</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                <button style={{ ...btnBack, flex: 1 }}>Import CSV</button>
                <button style={{ ...btnNext, flex: 2 }} onClick={handleAdd} disabled={addLoading}>
                  {addLoading ? 'Adding location…' : 'Add this location +'}
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
                    <TierBadge tier={loc.tier} />
                    <button onClick={() => removeLocation(loc.id)} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--border-2)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              <button style={{ width: '100%', background: 'transparent', border: '1.5px dashed var(--border-2)', borderRadius: 'var(--r-sm)', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                Add another location
              </button>

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button style={btnBack} onClick={() => navigate('/setup')}>← Back</button>
                <button style={btnNext} onClick={handleNext} disabled={nextLoading}>
                  {nextLoading ? 'Loading rivals…' : 'Continue to Rival Discovery →'}
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
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 22, boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid var(--border)', letterSpacing: '-0.01em' }}>Market coverage</div>
              {marketCoverage.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < marketCoverage.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 12, color: m.tier === 'pending' ? 'var(--text-3)' : 'var(--text-2)' }}>{m.name}</div>
                  {m.tier === 'pending' ? (
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', border: '1px solid var(--border-2)', borderRadius: 20, padding: '2px 8px' }}>PENDING</div>
                  ) : (
                    <TierBadge tier={m.tier} />
                  )}
                </div>
              ))}
            </div>

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
