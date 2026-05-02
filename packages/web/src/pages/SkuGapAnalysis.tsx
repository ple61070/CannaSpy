import { useState } from 'react';
import { MarketSubNav } from '../components/shared/MarketSubNav';

interface GapRow {
  name: string;
  brand: string;
  cat: string;
  rivals: number;
  price: number;
  opp: 'high' | 'medium' | 'low';
}

const INITIAL_GAPS: GapRow[] = [
  { name: 'Heavy Hitters 1g Vape',     brand: 'Heavy Hitters',  cat: 'Vapes',     rivals: 3, price: 48, opp: 'high' },
  { name: 'Backpack Boyz 3.5g Flower', brand: 'Backpack Boyz',  cat: 'Flower',    rivals: 2, price: 65, opp: 'high' },
  { name: 'Jeeter Baby Infused 5pk',   brand: 'Jeeter',         cat: 'Pre-rolls', rivals: 3, price: 60, opp: 'high' },
  { name: 'Presidential OG 3.5g',      brand: 'Presidential',   cat: 'Flower',    rivals: 2, price: 58, opp: 'high' },
  { name: 'Pax Era Pod 0.5g',          brand: 'Pax Era',        cat: 'Vapes',     rivals: 2, price: 40, opp: 'medium' },
  { name: 'Kiva Terra Bites 100mg',    brand: 'Kiva',           cat: 'Edibles',   rivals: 3, price: 22, opp: 'medium' },
  { name: 'Camino Sours 100mg',        brand: 'Kiva',           cat: 'Edibles',   rivals: 2, price: 20, opp: 'medium' },
  { name: 'Raw Garden Preroll 5pk',    brand: 'Raw Garden',     cat: 'Pre-rolls', rivals: 2, price: 32, opp: 'medium' },
  { name: 'Select Elite 1g',           brand: 'Select',         cat: 'Vapes',     rivals: 2, price: 44, opp: 'medium' },
  { name: 'Stiiizy Pod Premium',       brand: 'STIIIZY',        cat: 'Vapes',     rivals: 1, price: 42, opp: 'low' },
  { name: 'Punch Bar 225mg',           brand: 'Punch Edibles',  cat: 'Edibles',   rivals: 2, price: 18, opp: 'low' },
  { name: 'Garden Society Gummies',    brand: 'Garden Society', cat: 'Edibles',   rivals: 1, price: 28, opp: 'low' },
];

type SortCol = keyof GapRow;

const OPP_COLOR: Record<string, string> = {
  high: 'var(--warm)',
  medium: 'var(--accent)',
  low: 'var(--text-3)',
};

const MARKET_TABS = ['Heat Map', 'Competitor Ranking', 'My Benchmarks', 'SKU Gap Analysis', 'Deal Effectiveness'];

export default function SkuGapAnalysis() {
  const [gaps, setGaps] = useState<GapRow[]>(INITIAL_GAPS);
  const [sortCol, setSortCol] = useState<SortCol>('rivals');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [toast, setToast] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState('All Categories');
  const [catOpen, setCatOpen] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function handleSort(col: SortCol) {
    const newDir: 1 | -1 = col === sortCol ? (sortDir === 1 ? -1 : 1) : -1;
    setSortCol(col);
    setSortDir(newDir);
    setGaps(prev => [...prev].sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (typeof va === 'string' && typeof vb === 'string') return va.localeCompare(vb) * newDir;
      return ((va as number) - (vb as number)) * newDir;
    }));
  }

  function sortIndicator(col: SortCol) {
    if (col !== sortCol) return '';
    return sortDir === 1 ? ' ▲' : ' ▼';
  }

  const highCount = INITIAL_GAPS.filter(g => g.opp === 'high').length;
  const medCount = INITIAL_GAPS.filter(g => g.opp === 'medium').length;

  const summaryStats = [
    { v: INITIAL_GAPS.length, l: 'Gap SKUs total',     c: 'var(--danger)' },
    { v: highCount,           l: 'High opportunity',   c: 'var(--warm)' },
    { v: medCount,            l: 'Medium opportunity', c: 'var(--accent)' },
  ];

  const catOptions = ['All Categories', 'Flower', 'Vapes', 'Pre-rolls', 'Edibles'];

  const thStyle = (col: SortCol): React.CSSProperties => ({
    padding: '8px 12px',
    textAlign: 'left',
    fontFamily: 'var(--mono)',
    fontSize: 9,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    borderBottom: '2px solid var(--border-2)',
    background: 'var(--surface-2)',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>SKU Gap Analysis</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>PRODUCTS YOU SHOULD CONSIDER ADDING</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => showToast('Exporting SKU gap report…')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      {/* Market sub-nav */}
      <MarketSubNav />

      {/* Filter bar */}
      <div style={{ padding: '8px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Category</span>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setCatOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: catFilter !== 'All Categories' ? 'var(--accent)' : 'var(--surface)', color: catFilter !== 'All Categories' ? '#fff' : 'var(--text-1)', cursor: 'pointer' }}>
            {catFilter}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {catOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(30,60,80,0.14)', zIndex: 300, minWidth: 140, padding: 5 }}>
              {catOptions.map(opt => (
                <div
                  key={opt}
                  onClick={() => { setCatFilter(opt); setCatOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === catFilter ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === catFilter ? 700 : 400, cursor: 'pointer' }}>
                  {opt} {opt === catFilter ? '✓' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }}/>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Carried by</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer' }}>
          2+ rivals
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>
          <span style={{ color: 'var(--danger)', fontWeight: 700 }}>12 SKUs</span> rivals carry that you don't
        </div>
      </div>

      {/* Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
          {summaryStats.map(s => (
            <div key={s.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1, marginBottom: 3 }}>{s.v}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Gap table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>SKUs Rivals Carry — You Don't</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Click a row to see rival pricing</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {(['name', 'brand', 'cat', 'rivals', 'price', 'opp'] as SortCol[]).map((col, i) => {
                  const labels = ['SKU', 'Brand', 'Category', `Rivals Carrying${sortCol === 'rivals' ? '' : ''}`, 'Avg Rival Price', 'Opportunity'];
                  return (
                    <th key={col} style={thStyle(col)} onClick={() => handleSort(col)}>
                      {labels[i]}{sortIndicator(col)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {gaps.map((g) => {
                const oppColor = OPP_COLOR[g.opp];
                const oppLabel = g.opp === 'high' ? 'High' : g.opp === 'medium' ? 'Medium' : 'Low';
                return (
                  <tr
                    key={g.name}
                    style={{ cursor: 'pointer' }}
                    onClick={() => showToast(`${g.name} — ${g.rivals} rivals carry at avg $${g.price}`)}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{g.name}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-2)' }}>{g.brand}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)' }}>{g.cat}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {[0,1,2,3,4].map(i => (
                          <div key={i} style={{ width: 10, height: 10, borderRadius: 2, marginRight: 2, background: i < g.rivals ? 'var(--danger)' : 'var(--surface-3)' }}/>
                        ))}
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginLeft: 4 }}>{g.rivals}</span>
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>${g.price}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: `${oppColor}22`, color: oppColor }}>{oppLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warm)', flexShrink: 0 }}/>
          {toast}
        </div>
      )}
    </div>
  );
}
