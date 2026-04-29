import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const slotData: Record<number, { mo: string; rate: string; disc: string; sub: string }> = {
  10: { mo: '$950',   rate: '$95/slot',  disc: '5% off',  sub: '10 slots × $95/slot/month' },
  20: { mo: '$1,800', rate: '$90/slot',  disc: '10% off', sub: '20 slots × $90/slot/month' },
  50: { mo: '$4,250', rate: '$85/slot',  disc: '15% off', sub: '50 slots × $85/slot/month' },
  80: { mo: '$6,800', rate: '$85/slot',  disc: '15% off', sub: '80 slots × $85/slot/month' },
};

const SLOT_OPTIONS = [
  { n: 10, mo: '$950',   off: '5% off' },
  { n: 20, mo: '$1,800', off: '10% off' },
  { n: 50, mo: '$4,250', off: '15% off' },
  { n: 80, mo: '$6,800', off: '15% off' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--surface-2)', border: '1.5px solid var(--border-2)',
  borderRadius: 'var(--r-sm)', padding: '10px 13px', fontFamily: 'var(--sans)',
  fontSize: 13, color: 'var(--text-1)', outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
  marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' as const,
};

function StepBar({ active }: { active: number }) {
  const steps = [
    { n: '01', label: 'Org Setup', sub: 'Company & billing' },
    { n: '02', label: 'Add Locations', sub: 'Your dispensaries' },
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

function Card({ title, sub, children, animDelay }: { title: string; sub: string; children: React.ReactNode; animDelay?: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '26px 28px', boxShadow: 'var(--card-shadow)', marginBottom: 18, animationDelay: animDelay }}>
      <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>{sub}</div>
      </div>
      {children}
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const [planAla, setPlanAla] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState(50);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const slot = slotData[selectedSlots];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/setup/locations');
    }, 1200);
  };

  const sumRowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 };
  const sumKStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-2)' };
  const sumVStyle: React.CSSProperties = { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-1)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>Create your organization</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 2 }}>SCREEN 01 · ORG SETUP · STEP 1 OF 3</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.1em', padding: '5px 10px', border: '1px solid var(--border-2)', borderRadius: 20, cursor: 'pointer' }}>NEED HELP?</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #09A1A1, #D396A6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', boxShadow: '0 2px 8px rgba(9,161,161,0.3)' }}>PS</div>
        </div>
      </div>

      {/* Page */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <StepBar active={0} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 355px', gap: 20, alignItems: 'start' }}>

          {/* Left */}
          <div>
            <Card title="Company information" sub="How your organization appears in CannaSpy.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Company name <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="text" defaultValue="Pacific MSO Group" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DBA / Trade name</label>
                  <input type="text" placeholder="Optional" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Primary contact <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="text" defaultValue="Patrick Simac" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="email" defaultValue="patrick@pacific-mso.com" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" placeholder="(555) 000-0000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Locations <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <select defaultValue="10–15 locations" style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235484A4' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center', paddingRight: 32 }}>
                    <option>1–2 locations</option>
                    <option>3–5 locations</option>
                    <option>10–15 locations</option>
                    <option>16–20 locations</option>
                    <option>20+ locations</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card title="Billing & plan" sub="Pricing scales automatically as you add locations and rivals.">
              {/* Plan tiles */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Plan type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'À La Carte', price: '$100', unit: '/slot', desc: 'Track or block — same price. Recommended for MSOs.', ala: true },
                    { label: 'Slot Tiers', price: 'from $99', unit: '/mo', desc: 'Fixed bundles. Starter · Standard · Growth · Pro.', ala: false },
                  ].map(p => (
                    <div key={p.label} onClick={() => setPlanAla(p.ala)} style={{ border: `1.5px solid ${(planAla === p.ala) ? 'var(--accent)' : 'var(--border-2)'}`, borderRadius: 'var(--r-sm)', padding: '14px 16px', cursor: 'pointer', background: (planAla === p.ala) ? 'var(--accent-soft)' : 'var(--surface-2)', position: 'relative' }}>
                      {planAla === p.ala && <span style={{ position: 'absolute', top: 10, right: 12, fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>✓</span>}
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{p.label}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--accent)', fontWeight: 500 }}>{p.price}<span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.unit}</span></div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, lineHeight: 1.5 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slot tiles */}
              <div>
                <label style={labelStyle}>Starting slot count</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {SLOT_OPTIONS.map(s => (
                    <div key={s.n} onClick={() => setSelectedSlots(s.n)} style={{ border: `1.5px solid ${selectedSlots === s.n ? 'var(--accent)' : 'var(--border-2)'}`, borderRadius: 'var(--r-sm)', padding: '12px 8px', textAlign: 'center', cursor: 'pointer', background: selectedSlots === s.n ? 'var(--accent-soft)' : 'var(--surface-2)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 500, color: 'var(--accent)', display: 'block', fontVariantNumeric: 'tabular-nums' }}>{s.n}</span>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{s.mo}/mo</div>
                      <div style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 600, marginTop: 3, fontFamily: 'var(--mono)' }}>{s.off}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Volume discounts: 10+ slots 5% · 20+ slots 10% · 50+ slots 15%</div>
              </div>

              <button
                onClick={handleContinue}
                disabled={loading}
                style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', padding: 12, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', marginTop: 6, boxShadow: '0 4px 18px rgba(9,161,161,0.32)', opacity: loading ? 0.85 : 1 }}
              >
                {loading ? 'Setting up locations…' : 'Continue to Location Setup  →'}
              </button>
            </Card>
          </div>

          {/* Right */}
          <div>
            <Card title="Account summary" sub="Updates live as you configure.">
              <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 10 }}>Organization</div>
                <div style={sumRowStyle}><div style={sumKStyle}>Company</div><div style={sumVStyle}>Pacific MSO Group</div></div>
                <div style={sumRowStyle}><div style={sumKStyle}>Contact</div><div style={sumVStyle}>Patrick Simac</div></div>
                <div style={sumRowStyle}><div style={sumKStyle}>Locations</div><div style={sumVStyle}>10–15</div></div>
              </div>
              <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 10 }}>Billing</div>
                <div style={sumRowStyle}><div style={sumKStyle}>Plan</div><div style={sumVStyle}>{planAla ? 'À La Carte' : 'Slot Tiers'}</div></div>
                <div style={sumRowStyle}><div style={sumKStyle}>Slots</div><div style={sumVStyle}>{selectedSlots} slots</div></div>
                <div style={sumRowStyle}><div style={sumKStyle}>Rate</div><div style={sumVStyle}>{slot.rate}</div></div>
                <div style={sumRowStyle}><div style={sumKStyle}>Discount</div><div style={{ ...sumVStyle, color: 'var(--accent)' }}>{slot.disc}</div></div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--warm-soft) 100%)', border: '1px solid rgba(9,161,161,0.22)', borderRadius: 'var(--r-sm)', padding: '18px 16px', textAlign: 'center', marginTop: 16 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'var(--accent)', marginBottom: 6 }}>Monthly total</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{slot.mo}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>{slot.sub}</div>
              </div>
            </Card>

            <Card title="What is a slot?" sub="">
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.75 }}>
                One slot = one tracked competitor <em>or</em> one blocked competitor per location. Both cost the same.<br /><br />
                A 10-location MSO tracking 4 rivals and blocking 1 per location = <strong style={{ color: 'var(--text-1)' }}>50 slots</strong>.
              </div>
              <div style={{ background: 'var(--warm-soft)', border: '1px solid rgba(246,201,146,0.32)', borderLeft: '3px solid var(--warm)', borderRadius: '0 var(--r-sm) var(--r-sm) 0', padding: '13px 15px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, marginTop: 16 }}>
                <strong style={{ color: 'var(--text-1)' }}>Track:</strong> Daily prices, promos & catalog.<br />
                <strong style={{ color: 'var(--text-1)' }}>Block:</strong> Keep them off CannaSpy — permanently, while you pay.
              </div>
            </Card>
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
