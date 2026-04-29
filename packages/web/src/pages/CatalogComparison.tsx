import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Data ─────────────────────────────────────────────────────────────────────
interface RivalSummary {
  key: string;
  name: string;
  status: 'blocked' | 'tracking';
  color: string;
  skus: number;
  overlap: number;
  exclusive: number;
}

const RIVALS: RivalSummary[] = [
  { key: 'stiiizy', name: 'STIIIZY', status: 'blocked', color: '#D396A6', skus: 28, overlap: 14, exclusive: 4 },
  { key: 'medmen', name: 'MedMen', status: 'tracking', color: '#09A1A1', skus: 22, overlap: 11, exclusive: 3 },
  { key: 'otc', name: 'Off The Charts', status: 'blocked', color: '#5484A4', skus: 35, overlap: 16, exclusive: 9 },
  { key: 'catalyst', name: 'Catalyst', status: 'tracking', color: '#d4900a', skus: 18, overlap: 8, exclusive: 6 },
  { key: 'harbor', name: 'Harborside', status: 'tracking', color: '#e05a6a', skus: 15, overlap: 6, exclusive: 5 },
];

const YOUR_SKUS = 32;
const MAX_SKUS = 35;

interface CatRow {
  name: string;
  icon: string;
  yours: number;
  rivals: Record<string, number>;
  overlap: Record<string, number>;
}

const CAT_DATA: CatRow[] = [
  { name: 'Flower', icon: '🌿', yours: 8, rivals: { stiiizy: 6, medmen: 5, otc: 10, catalyst: 4, harbor: 3 }, overlap: { stiiizy: 5, medmen: 4, otc: 7, catalyst: 3, harbor: 2 } },
  { name: 'Vapes', icon: '💨', yours: 7, rivals: { stiiizy: 8, medmen: 6, otc: 12, catalyst: 5, harbor: 4 }, overlap: { stiiizy: 5, medmen: 4, otc: 6, catalyst: 3, harbor: 2 } },
  { name: 'Pre-rolls', icon: '🔥', yours: 6, rivals: { stiiizy: 7, medmen: 5, otc: 6, catalyst: 4, harbor: 3 }, overlap: { stiiizy: 3, medmen: 2, otc: 3, catalyst: 1, harbor: 1 } },
  { name: 'Edibles', icon: '🍬', yours: 5, rivals: { stiiizy: 4, medmen: 3, otc: 4, catalyst: 2, harbor: 3 }, overlap: { stiiizy: 1, medmen: 1, otc: 0, catalyst: 1, harbor: 1 } },
  { name: 'Concentrates', icon: '⚗️', yours: 4, rivals: { stiiizy: 2, medmen: 2, otc: 2, catalyst: 2, harbor: 1 }, overlap: { stiiizy: 0, medmen: 0, otc: 0, catalyst: 0, harbor: 0 } },
  { name: 'Topicals', icon: '💧', yours: 2, rivals: { stiiizy: 1, medmen: 1, otc: 1, catalyst: 1, harbor: 1 }, overlap: { stiiizy: 0, medmen: 0, otc: 0, catalyst: 0, harbor: 0 } },
];

const EXCLUSIVE_YOURS = [
  { name: 'Maven 7g Flower', cat: 'Flower', price: 85 },
  { name: 'Raw Garden Live Badder 1g', cat: 'Concentrates', price: 65 },
  { name: 'Kanha Belts 100mg', cat: 'Edibles', price: 18 },
  { name: 'Maven 1g Vape', cat: 'Vapes', price: 52 },
];

const EXCLUSIVE_OTC = [
  { name: 'Backpack Boyz 3.5g', cat: 'Flower', price: 65 },
  { name: 'Heavy Hitters 1g', cat: 'Vapes', price: 48 },
  { name: 'Pax Era Pod', cat: 'Vapes', price: 40 },
  { name: 'Kiva Terra Bites', cat: 'Edibles', price: 22 },
];

function overlapClass(pct: number): { bg: string; color: string } {
  if (pct >= 70) return { bg: 'rgba(9,161,161,0.10)', color: 'var(--accent)' };
  if (pct >= 40) return { bg: 'rgba(212,144,10,0.12)', color: 'var(--warm)' };
  return { bg: 'rgba(211,150,166,0.11)', color: 'var(--rose)' };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CatalogComparison() {
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
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Catalog Comparison</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>SKU OVERLAP & GAPS · WEST HOLLYWOOD</div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => showToast('Exporting catalog comparison…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export
            </button>
          </div>
        </div>
        {/* Sub-nav */}
        <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Price History', to: '/price-history', active: false },
            { label: 'Catalog Comparison', to: '/catalog-comparison', active: true },
            { label: 'Brand Coverage', to: '/brand-coverage', active: false },
          ].map(tab => (
            <div key={tab.label} onClick={() => navigate(tab.to)} style={{ padding: '10px 18px', fontSize: 12, fontWeight: 600, color: tab.active ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', borderBottom: tab.active ? '2px solid var(--accent)' : '2px solid transparent', whiteSpace: 'nowrap' }}>
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Category</span>
        <select style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          <option>All Categories</option>
          <option>Flower</option>
          <option>Vapes</option>
          <option>Pre-rolls</option>
          <option>Edibles</option>
          <option>Concentrates</option>
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Sort by</span>
        <select style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          <option>SKU Count</option>
          <option>Overlap %</option>
          <option>Exclusive SKUs</option>
        </select>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>
          Your catalog: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>18 shared SKUs</span> across 5 rivals
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* Rival summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {RIVALS.map(r => {
            const pct = Math.round(r.overlap / YOUR_SKUS * 100);
            const barW = Math.round(r.skus / MAX_SKUS * 100);
            const overlapPct = Math.round(r.overlap / Math.min(r.skus, YOUR_SKUS) * 100);
            const ol = overlapClass(overlapPct);
            return (
              <div key={r.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 3, flexShrink: 0, background: r.status === 'blocked' ? 'rgba(211,150,166,0.11)' : 'rgba(9,161,161,0.10)', color: r.status === 'blocked' ? 'var(--rose)' : 'var(--accent)' }}>{r.status}</span>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: r.color, lineHeight: 1, margin: '8px 0 4px' }}>{r.skus}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>total SKUs</div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 8 }}>
                  <div style={{ height: 4, borderRadius: 2, width: `${barW}%`, background: r.color, opacity: 0.7 }} />
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 700, background: ol.bg, color: ol.color }}>{r.overlap} shared ({pct}% of yours)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Category breakdown table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h6" /></svg>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>SKU Count by Category</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Your catalog vs. each rival · shared brands only</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>Category</th>
                <th style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--accent)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>You ({YOUR_SKUS})</th>
                {RIVALS.map(r => (
                  <th key={r.key} style={{ padding: '8px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: r.color, borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAT_DATA.map(cat => (
                <tr key={cat.name}>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-3)', flexShrink: 0, fontSize: 13 }}>{cat.icon}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{cat.name}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>You: {cat.yours} SKUs</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{cat.yours}</td>
                  {RIVALS.map(r => {
                    const rv = cat.rivals[r.key] || 0;
                    const ov = cat.overlap[r.key] || 0;
                    const barW = Math.round(rv / 12 * 100);
                    const olPct = rv > 0 ? Math.round(ov / rv * 100) : 0;
                    const ol = overlapClass(olPct);
                    return (
                      <td key={r.key} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ flex: 1, height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: 8, borderRadius: 4, width: `${barW}%`, background: r.color, opacity: 0.75 }} />
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: r.color, width: 24, textAlign: 'right', flexShrink: 0 }}>{rv}</div>
                        </div>
                        {rv > 0 && <div style={{ marginTop: 3 }}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 700, background: ol.bg, color: ol.color }}>{ov} shared</span></div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Exclusive SKUs panel */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Exclusive SKUs</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>SKUs you carry that rivals don't — your differentiation advantage</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '16px 18px' }}>
            {/* Yours */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>✓ Your exclusive SKUs (rivals don't carry)</div>
              {EXCLUSIVE_YOURS.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{s.cat}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>${s.price}</div>
                </div>
              ))}
            </div>
            {/* OTC */}
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5484A4', marginBottom: 8 }}>Off The Charts exclusives (you don't carry)</div>
              {EXCLUSIVE_OTC.map(s => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{s.cat}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>${s.price}</div>
                </div>
              ))}
            </div>
          </div>
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
