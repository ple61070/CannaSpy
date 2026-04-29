import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Data ─────────────────────────────────────────────────────────────────────
type Presence = 'y' | '~' | 'n';

interface Brand {
  name: string;
  color: string;
  cat: string;
  yours: number;
  rivals: Record<string, Presence>;
  yCat: 'Shared' | 'Your Exclusive' | 'Rival Only';
}

const BRANDS: Brand[] = [
  { name: 'Friendly Farms', color: '#e05a6a', cat: 'Flower/Vapes', yours: 3, rivals: { stiiizy: 'y', medmen: 'y', otc: 'y', catalyst: 'n', harbor: 'n' }, yCat: 'Shared' },
  { name: 'Jeeter', color: '#5484A4', cat: 'Pre-rolls/Vapes', yours: 5, rivals: { stiiizy: 'y', medmen: 'y', otc: 'y', catalyst: 'y', harbor: 'y' }, yCat: 'Shared' },
  { name: 'Kanha', color: '#09A1A1', cat: 'Edibles', yours: 4, rivals: { stiiizy: 'y', medmen: 'y', otc: 'y', catalyst: 'n', harbor: 'y' }, yCat: 'Shared' },
  { name: 'Maven', color: '#D396A6', cat: 'Flower/Vapes', yours: 3, rivals: { stiiizy: 'n', medmen: 'y', otc: 'n', catalyst: 'n', harbor: 'n' }, yCat: 'Your Exclusive' },
  { name: 'Raw Garden', color: '#d4900a', cat: 'Vapes/Concentrates', yours: 3, rivals: { stiiizy: 'n', medmen: 'n', otc: 'y', catalyst: 'y', harbor: 'n' }, yCat: 'Shared' },
  { name: 'AbsoluteXtracts', color: '#09A1A1', cat: 'Vapes', yours: 2, rivals: { stiiizy: 'n', medmen: 'n', otc: 'n', catalyst: 'n', harbor: 'n' }, yCat: 'Your Exclusive' },
  { name: 'Stiiizy (house)', color: '#D396A6', cat: 'Vapes/Flower', yours: 0, rivals: { stiiizy: 'y', medmen: 'n', otc: 'n', catalyst: 'n', harbor: 'n' }, yCat: 'Rival Only' },
  { name: 'Heavy Hitters', color: '#5484A4', cat: 'Vapes', yours: 0, rivals: { stiiizy: 'y', medmen: 'y', otc: 'y', catalyst: 'n', harbor: 'n' }, yCat: 'Rival Only' },
  { name: 'Backpack Boyz', color: '#e05a6a', cat: 'Flower', yours: 0, rivals: { stiiizy: 'n', medmen: 'n', otc: 'y', catalyst: 'n', harbor: 'n' }, yCat: 'Rival Only' },
  { name: 'Connected Cannabis', color: '#d4900a', cat: 'Flower', yours: 2, rivals: { stiiizy: '~', medmen: 'n', otc: '~', catalyst: 'n', harbor: 'n' }, yCat: 'Your Exclusive' },
  { name: 'Pax Era', color: '#5484A4', cat: 'Vapes', yours: 0, rivals: { stiiizy: 'y', medmen: 'y', otc: 'n', catalyst: 'n', harbor: 'n' }, yCat: 'Rival Only' },
  { name: 'PLUS Products', color: '#09A1A1', cat: 'Edibles', yours: 2, rivals: { stiiizy: 'n', medmen: 'n', otc: 'n', catalyst: 'y', harbor: 'n' }, yCat: 'Your Exclusive' },
  { name: 'Venom OG', color: '#D396A6', cat: 'Flower', yours: 1, rivals: { stiiizy: 'n', medmen: 'n', otc: 'n', catalyst: 'n', harbor: 'n' }, yCat: 'Your Exclusive' },
];

const RIVAL_COLS = [
  { key: 'stiiizy', label: 'STIIIZY', status: 'blocked', color: '#D396A6' },
  { key: 'medmen', label: 'MedMen', status: 'tracking', color: '#09A1A1' },
  { key: 'otc', label: 'Off The Charts', status: 'blocked', color: '#5484A4' },
  { key: 'catalyst', label: 'Catalyst', status: 'tracking', color: '#d4900a' },
  { key: 'harbor', label: 'Harborside', status: 'tracking', color: '#e05a6a' },
];

function rowBg(cat: Brand['yCat']): string {
  if (cat === 'Shared') return 'rgba(9,161,161,0.04)';
  if (cat === 'Your Exclusive') return 'rgba(9,161,161,0.02)';
  return 'rgba(224,90,106,0.03)';
}

function catLabel(cat: Brand['yCat']): React.ReactNode {
  if (cat === 'Shared') return <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(9,161,161,0.10)', color: 'var(--accent)', marginLeft: 6 }}>shared</span>;
  if (cat === 'Your Exclusive') return <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(9,161,161,0.08)', color: 'var(--accent)', marginLeft: 6 }}>your exclusive</span>;
  return <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(224,90,106,0.08)', color: 'var(--danger)', marginLeft: 6 }}>rival only</span>;
}

function PresenceCell({ p }: { p: Presence }) {
  if (p === 'y') return <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(9,161,161,0.10)', color: 'var(--accent)', fontSize: 13 }}>✓</div>;
  if (p === '~') return <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(212,144,10,0.12)', color: 'var(--warm)', fontSize: 13 }}>~</div>;
  return <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'var(--surface-3)', color: 'var(--text-3)', fontSize: 13 }}>—</div>;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function BrandCoverage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14 }}>

      {/* Topbar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0 0' }}>
          <button onClick={() => navigate('/price-intelligence')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Price Intelligence
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--border-2)' }} />
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Brand Coverage</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>BRAND-LEVEL PRESENCE · WEST HOLLYWOOD</div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => showToast('Exporting brand coverage report…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export
            </button>
          </div>
        </div>
        {/* Sub-nav */}
        <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Price History', to: '/price-history', active: false },
            { label: 'Catalog Comparison', to: '/catalog-comparison', active: false },
            { label: 'Brand Coverage', to: '/brand-coverage', active: true },
          ].map(tab => (
            <div key={tab.label} onClick={() => navigate(tab.to)} style={{ padding: '10px 18px', fontSize: 12, fontWeight: 600, color: tab.active ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', borderBottom: tab.active ? '2px solid var(--accent)' : '2px solid transparent', whiteSpace: 'nowrap' }}>
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>View</span>
        <select style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)' }}
          onChange={() => showToast('Filtering brand matrix…')}>
          <option>All brands</option>
          <option>Shared only</option>
          <option>Your exclusives</option>
          <option>Rival exclusives</option>
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Category</span>
        <select style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
          onChange={() => showToast('Filtering brand matrix…')}>
          <option>All</option>
          <option>Flower</option>
          <option>Vapes</option>
          <option>Pre-rolls</option>
          <option>Edibles</option>
        </select>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 700 }}>5 exclusive brands</span> · <span style={{ color: 'var(--warm)', fontWeight: 700 }}>3 rival-only brands</span> you don't carry
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* Insight cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            {
              icon: '🏆',
              metric: '5',
              label: 'Your exclusive brands',
              body: 'Brands no rival currently carries — your differentiation advantage.',
            },
            {
              icon: '🤝',
              metric: '5',
              label: 'Shared brands (head-to-head)',
              body: 'These are the price battles — every rival carries them. Pricing discipline matters most here.',
            },
            {
              icon: '⚠️',
              metric: '3',
              label: "Rival-only brands you don't carry",
              body: "Heavy Hitters, Backpack Boyz, Pax Era — carried by 2+ rivals but missing from your menu.",
            },
          ].map(card => (
            <div key={card.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: 18, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent)', margin: '6px 0 2px' }}>{card.metric}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5, marginTop: 6 }}>{card.body}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { el: <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: 'rgba(9,161,161,0.15)', color: 'var(--accent)', fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 9 }}>YOU</div>, label: 'You carry this brand' },
            { el: <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: 'rgba(9,161,161,0.10)', color: 'var(--accent)', fontSize: 11 }}>✓</div>, label: 'Rival carries it' },
            { el: <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: 'rgba(212,144,10,0.12)', color: 'var(--warm)', fontSize: 11 }}>~</div>, label: 'Partial (subset of SKUs)' },
            { el: <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 5, background: 'var(--surface-3)', color: 'var(--text-3)', fontSize: 11 }}>—</div>, label: 'Not carried' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-2)' }}>
              {item.el}
              {item.label}
            </div>
          ))}
        </div>

        {/* Brand matrix */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', marginBottom: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 200 }} />
              <col style={{ width: 80 }} />
              {RIVAL_COLS.map(r => <col key={r.key} style={{ width: 110 }} />)}
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>Brand</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--accent)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>You</th>
                {RIVAL_COLS.map(r => (
                  <th key={r.key} style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: r.color, borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.label}<br />
                    <span style={{ fontSize: 8, opacity: 0.7 }}>{r.status}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BRANDS.map(b => (
                <tr key={b.name} style={{ background: rowBg(b.yCat) }}>
                  <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 3, height: 32, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', display: 'flex', alignItems: 'center' }}>
                          {b.name}{catLabel(b.yCat)}
                        </div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>{b.cat}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>
                    {b.yours === 0 ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'var(--surface-3)', color: 'var(--text-3)', fontSize: 13 }}>—</div>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(9,161,161,0.15)', color: 'var(--accent)', fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 10, flexDirection: 'column', lineHeight: 1.1 }}>
                        {b.yours}<span style={{ fontSize: 7, letterSpacing: '0.06em' }}>SKU{b.yours !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </td>
                  {RIVAL_COLS.map(r => (
                    <td key={r.key} style={{ padding: '9px 14px', borderBottom: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>
                      <PresenceCell p={b.rivals[r.key] || 'n'} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--sans)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}
