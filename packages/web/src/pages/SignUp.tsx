import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    { n: '01', label: 'Org Setup', sub: 'Company info' },
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

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '26px 28px', boxShadow: 'var(--card-shadow)', marginBottom: 18 }}>
      <div style={{ marginBottom: 22, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3, letterSpacing: '-0.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid rgba(9,161,161,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6 }}>{children}</div>
  </div>
);

const LockItem = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--warm-soft)', border: '1px solid rgba(186,117,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2.5" style={{ width: 10, height: 10 }}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{children}</div>
  </div>
);

export default function SignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => navigate('/setup/locations'), 800);
  };

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* Left */}
          <div>
            <Card title="Company information" sub="How your organization appears in CannaSpy.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Company name <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="text" placeholder="Pacific MSO Group" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>DBA / Trade name</label>
                  <input type="text" placeholder="Optional" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>Primary contact <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="text" placeholder="Your name" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <input type="email" placeholder="you@company.com" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input type="tel" placeholder="(555) 000-0000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Number of locations <span style={{ color: 'var(--rose)' }}>*</span></label>
                  <select defaultValue="" style={{ ...inputStyle, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235484A4' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 11px center', paddingRight: 32 }}>
                    <option value="" disabled>Select range</option>
                    <option>1–2 locations</option>
                    <option>3–5 locations</option>
                    <option>6–9 locations</option>
                    <option>10–15 locations</option>
                    <option>16–20 locations</option>
                    <option>20+ locations</option>
                  </select>
                </div>
              </div>
            </Card>

            <button
              onClick={handleContinue}
              disabled={loading}
              style={{ width: '100%', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', padding: '13px 0', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', boxShadow: '0 4px 18px rgba(9,161,161,0.32)', opacity: loading ? 0.85 : 1 }}
            >
              {loading ? 'Setting up your account…' : 'Start free trial  →'}
            </button>
          </div>

          {/* Right */}
          <div>
            {/* Trial badge */}
            <div style={{ background: 'linear-gradient(135deg, var(--accent-soft) 0%, var(--warm-soft) 100%)', border: '1px solid rgba(9,161,161,0.22)', borderRadius: 'var(--r)', padding: '20px 22px', marginBottom: 18, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Free trial</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>14</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>days free. No card required.</div>
            </div>

            <Card title="Included in your trial">
              <CheckItem>Daily competitor price & catalog monitoring</CheckItem>
              <CheckItem>Promotions and deal tracking</CheckItem>
              <CheckItem>Price history and trend charts</CheckItem>
              <CheckItem>Market heat map — 1,785 CA dispensaries</CheckItem>
              <CheckItem>Alert feed — price drops, new products, promos</CheckItem>
              <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
              <LockItem><strong style={{ color: 'var(--text-2)' }}>Blocking</strong> — keep rivals off CannaSpy. Unlocks when you upgrade.</LockItem>
            </Card>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px 18px', boxShadow: 'var(--card-shadow)', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>
              After your trial, pricing starts at <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)', fontWeight: 500 }}>$100/slot/month</span>. You choose how many competitors to track or block — no fixed bundles, no contracts.
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
