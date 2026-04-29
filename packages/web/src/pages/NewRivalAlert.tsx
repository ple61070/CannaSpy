import { useState } from 'react';

type OptKey = 'track' | 'block' | 'watch' | 'dismiss';

const OPT_CONFIG: Record<OptKey, { label: string; color: string }> = {
  track:   { label: 'Start tracking — 1 slot',   color: 'var(--accent)' },
  block:   { label: 'Track and block — 2 slots', color: 'var(--warm)' },
  watch:   { label: 'Watch only — no slot',       color: 'var(--text-2)' },
  dismiss: { label: 'Dismiss for 7 days',         color: 'var(--text-3)' },
};

const CONFIRM_MSG: Record<OptKey, string> = {
  track:   'Cookies WeHo added to tracking — 1 slot activated',
  block:   'Cookies WeHo tracked and blocked — 2 slots activated',
  watch:   'Watching passively — no slot used',
  dismiss: 'Alert dismissed for 7 days',
};

export default function NewRivalAlert() {
  const [selected, setSelected] = useState<OptKey>('track');
  const [toast, setToast] = useState<string | null>(null);
  const [toastColor, setToastColor] = useState('var(--accent)');

  function showToast(msg: string, color: string) {
    setToast(msg);
    setToastColor(color);
    setTimeout(() => setToast(null), 2400);
  }

  function confirmAction() {
    showToast(CONFIRM_MSG[selected], OPT_CONFIG[selected].color);
  }

  const optionBg = (key: OptKey) => {
    if (key !== selected) return 'transparent';
    if (key === 'block') return 'rgba(212,144,10,0.06)';
    return 'var(--accent-soft)';
  };
  const optionBorderLeft = (key: OptKey) => {
    if (key !== selected) return '3px solid transparent';
    if (key === 'block') return '3px solid var(--warm)';
    return '3px solid var(--accent)';
  };
  const radioStyle = (key: OptKey): React.CSSProperties => {
    const active = key === selected;
    if (!active) return {
      width: 16, height: 16, borderRadius: '50%',
      border: '2px solid var(--border-2)',
      marginTop: 2, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'transparent',
    };
    const bg = key === 'block' ? 'var(--warm)' : 'var(--accent)';
    return {
      width: 16, height: 16, borderRadius: '50%',
      border: `2px solid ${bg}`, background: bg,
      marginTop: 2, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    };
  };

  const opts: { key: OptKey; title: string; tag: string; tagStyle: React.CSSProperties; sub: string }[] = [
    {
      key: 'track',
      title: 'Start tracking Cookies WeHo',
      tag: 'Recommended',
      tagStyle: { background: 'var(--accent-soft)', color: 'var(--accent)' },
      sub: 'Add to your WeHo competitive set. 1 slot ($200/mo at Elite rate). Daily price and promo monitoring begins immediately. You will receive alerts when they change prices on shared SKUs.',
    },
    {
      key: 'block',
      title: 'Track and block Cookies WeHo',
      tag: 'Aggressive',
      tagStyle: { background: 'rgba(212,144,10,0.15)', color: 'var(--warm)' },
      sub: 'Track + block them in CannaSpy. 2 slots ($400/mo at Elite rate). They can never see your data while the block is active. Auto-renews monthly.',
    },
    {
      key: 'watch',
      title: 'Watch only — no slot used',
      tag: 'Free',
      tagStyle: { background: 'var(--surface-3)', color: 'var(--text-3)' },
      sub: 'No alerts and no slot charge. CannaSpy continues to scrape them passively. You can upgrade to tracking at any time. They can subscribe to CannaSpy.',
    },
    {
      key: 'dismiss',
      title: 'Dismiss this alert',
      tag: 'Snooze 7 days',
      tagStyle: { background: 'var(--surface-3)', color: 'var(--text-3)' },
      sub: 'Hide this alert for 7 days. If Cookies WeHo is still untracked after that, a new alert fires automatically.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>New Rival Detected</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>WEST HOLLYWOOD · 1.4 MILES FROM YOUR FLAGSHIP</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => showToast('Dismissed — will resurface in 7 days', 'var(--text-3)')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            Dismiss
          </button>
          <button
            onClick={() => showToast('Cookies WeHo added to tracking', 'var(--accent)')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Start tracking
          </button>
        </div>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Alert Hero */}
        <div style={{ background: 'linear-gradient(135deg,rgba(224,90,106,0.08),rgba(224,90,106,0.03))', border: '2px solid rgba(224,90,106,0.25)', borderLeft: '5px solid var(--danger)', borderRadius: 'var(--r)', padding: '22px 26px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(224,90,106,0.08)', border: '1.5px solid rgba(224,90,106,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 5 }}>New competitor detected</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 5 }}>Cookies WeHo opened 1.4 miles from your flagship</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>CannaSpy detected a new licensed dispensary within your 3-mile monitoring radius. First seen today at 2:47 AM. Menu is live with 84 SKUs across Flower, Vapes, and Pre-rolls — 12 overlap with your current inventory.</div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' as const }}>
              {[
                '1.4 miles — 8855 Santa Monica Blvd, WeHo',
                'Opened Apr 14, 2026 — 2 days ago',
                'DCC License: C10-0001892-LIC',
                '84 SKUs tracked · 12 overlap with you',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{item}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>
          {/* Proximity map */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
            <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>Proximity — WeHo Flagship</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>3-mile radius</span>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ width: '100%', height: 220, background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <svg width="100%" height="100%" viewBox="0 0 420 220" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.15"/>
                    </pattern>
                  </defs>
                  <rect width="420" height="220" fill="url(#grid)"/>
                  <line x1="0" y1="110" x2="420" y2="110" stroke="currentColor" strokeWidth="1.5" opacity="0.1"/>
                  <line x1="210" y1="0" x2="210" y2="220" stroke="currentColor" strokeWidth="1.5" opacity="0.1"/>
                  <circle cx="210" cy="110" r="88" fill="none" stroke="#09A1A1" strokeWidth="1" strokeDasharray="4 3" opacity="0.35"/>
                  <circle cx="210" cy="110" r="30" fill="none" stroke="#09A1A1" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.2"/>
                  <circle cx="210" cy="110" r="14" fill="#09A1A1" fillOpacity="0.15" stroke="#09A1A1" strokeWidth="2"/>
                  <circle cx="210" cy="110" r="5" fill="#09A1A1"/>
                  <text x="210" y="132" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="9" fontWeight="700" fill="#09A1A1" opacity="0.9">Your Flagship</text>
                  <circle cx="258" cy="85" r="13" fill="#e05a6a" fillOpacity="0.15" stroke="#e05a6a" strokeWidth="2"/>
                  <circle cx="258" cy="85" r="5" fill="#e05a6a"/>
                  <circle cx="258" cy="85" r="18" fill="none" stroke="#e05a6a" strokeWidth="1.5" opacity="0.5">
                    <animate attributeName="r" from="13" to="26" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <text x="258" y="107" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="9" fontWeight="700" fill="#e05a6a" opacity="0.9">NEW: Cookies WeHo</text>
                  <circle cx="175" cy="88" r="8" fill="#D396A6" fillOpacity="0.2" stroke="#D396A6" strokeWidth="1.5"/>
                  <circle cx="175" cy="88" r="3" fill="#D396A6"/>
                  <text x="175" y="104" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="8" fill="#D396A6" opacity="0.75">STIIIZY</text>
                  <circle cx="238" cy="138" r="8" fill="#09A1A1" fillOpacity="0.2" stroke="#09A1A1" strokeWidth="1.5"/>
                  <circle cx="238" cy="138" r="3" fill="#09A1A1"/>
                  <text x="238" y="154" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="8" fill="#09A1A1" opacity="0.75">MedMen</text>
                  <circle cx="163" cy="140" r="8" fill="#09A1A1" fillOpacity="0.2" stroke="#09A1A1" strokeWidth="1.5"/>
                  <circle cx="163" cy="140" r="3" fill="#09A1A1"/>
                  <text x="163" y="156" textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="8" fill="#09A1A1" opacity="0.75">Catalyst</text>
                  <line x1="210" y1="110" x2="258" y2="85" stroke="#e05a6a" strokeWidth="1" strokeDasharray="3 2" opacity="0.5"/>
                  <text x="234" y="96" fontFamily="JetBrains Mono,monospace" fontSize="8" fill="#e05a6a" opacity="0.8">1.4 mi</text>
                  <circle cx="18" cy="200" r="5" fill="#e05a6a"/>
                  <text x="28" y="204" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="9" fill="currentColor" opacity="0.6">New rival</text>
                  <circle cx="95" cy="200" r="5" fill="#09A1A1"/>
                  <text x="105" y="204" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="9" fill="currentColor" opacity="0.6">Tracking</text>
                  <circle cx="172" cy="200" r="5" fill="#D396A6"/>
                  <text x="182" y="204" fontFamily="Plus Jakarta Sans,sans-serif" fontSize="9" fill="currentColor" opacity="0.6">Blocked</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* First Intel Snapshot */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>First Intel Snapshot</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Apr 16, 2:47 AM</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr>
                    {['Category', 'SKUs', 'Avg Price'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Flower</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11 }}>32</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>$58 <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 400 }}>+$9 vs. you</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Vapes</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11 }}>28</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>$54 <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 400 }}>+$4 vs. you</span></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '9px 12px', fontWeight: 600 }}>Pre-rolls</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11 }}>24</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>$26 <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 400 }}>−$2 vs. you</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Similar rivals */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>Similar rivals you track</span>
              </div>
              <div style={{ padding: '0 14px' }}>
                {[
                  { initials: 'ST', bg: '#D396A6', name: 'STIIIZY WeHo', meta: '0.8 mi · 1,712 SKUs', status: 'Blocked', statusBg: 'rgba(211,150,166,0.11)', statusColor: 'var(--rose)' },
                  { initials: 'MM', bg: '#09A1A1', name: 'MedMen WeHo', meta: '1.1 mi · 953 SKUs', status: 'Tracking', statusBg: 'rgba(9,161,161,0.10)', statusColor: 'var(--accent)' },
                ].map((r) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{r.initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{r.name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>{r.meta}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: r.statusBg, color: r.statusColor }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Decision Panel */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>What do you want to do?</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Dismissed alerts resurface after 7 days if the rival is still untracked</span>
          </div>

          {opts.map((opt, i) => (
            <div
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              style={{
                padding: '14px 16px',
                borderBottom: i < opts.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                background: optionBg(opt.key),
                borderLeft: optionBorderLeft(opt.key),
                transition: 'background 0.15s',
              }}>
              <div style={radioStyle(opt.key)}>
                {selected === opt.key && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{ width: 9, height: 9 }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>
                  {opt.title}{' '}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, marginLeft: 8, ...opt.tagStyle }}>{opt.tag}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{opt.sub}</div>
              </div>
            </div>
          ))}

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => showToast('Dismissed for 7 days', 'var(--text-3)')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
              Skip for now
            </button>
            <button
              onClick={confirmAction}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: `1.5px solid ${OPT_CONFIG[selected].color}`, background: OPT_CONFIG[selected].color, color: '#fff', transition: 'all 0.2s' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {OPT_CONFIG[selected].label}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: toastColor, flexShrink: 0 }}/>
          {toast}
        </div>
      )}
    </div>
  );
}
