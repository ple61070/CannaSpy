import { useState } from 'react';
import { MarketSubNav } from '../components/shared/MarketSubNav';

interface DealRow {
  date: string;
  rival: string;
  promo: string;
  type: string;
  days: number;
  disc: string;
  resp: string;
  freq: string;
}

const INITIAL_DEALS: DealRow[] = [
  { date: 'Apr 16', rival: 'STIIIZY',  promo: 'Weekend Flash — FF Flower & Vapes 14% off',   type: 'Flash',     days: 3,  disc: '-14%', resp: 'Held',    freq: 'Monthly' },
  { date: 'Apr 15', rival: 'MedMen',   promo: '4/20 Week Happy Hour 3–8PM daily',             type: 'Happy hour',days: 7,  disc: '-20%', resp: 'Pending', freq: 'Annual' },
  { date: 'Apr 14', rival: 'OTC',      promo: 'Jeeter Brand Day — 20% off all Jeeter',        type: 'Brand day', days: 1,  disc: '-20%', resp: 'Acted',   freq: 'Monthly' },
  { date: 'Apr 12', rival: 'STIIIZY',  promo: 'Jeeter XL permanent price reduction',          type: 'Permanent', days: 0,  disc: '-8%',  resp: 'Pending', freq: 'One-time' },
  { date: 'Apr 8',  rival: 'Catalyst', promo: 'Daily Brand Deal — Raw Garden 15% off',        type: 'Recurring', days: 90, disc: '-15%', resp: 'Held',    freq: 'Daily' },
  { date: 'Apr 5',  rival: 'OTC',      promo: 'Kanha Edibles Promo Week',                     type: 'Flash',     days: 5,  disc: '-9%',  resp: 'Held',    freq: 'Quarterly' },
  { date: 'Mar 28', rival: 'MedMen',   promo: 'Happy Hour 4–7PM daily FF Vapes',              type: 'Recurring', days: 90, disc: '-20%', resp: 'None',    freq: 'Daily' },
  { date: 'Mar 22', rival: 'STIIIZY',  promo: 'Weekend Flash ended — prices reverted',        type: 'Flash end', days: 0,  disc: '+14%', resp: 'N/A',     freq: '' },
  { date: 'Mar 18', rival: 'Catalyst', promo: 'Weekend Bundle — buy 2 get 1 Pre-rolls',       type: 'Bundle',    days: 2,  disc: 'BOGO', resp: 'Held',    freq: 'Monthly' },
  { date: 'Mar 15', rival: 'OTC',      promo: "St. Patrick's Day — 20% all green SKUs",       type: 'Flash',     days: 3,  disc: '-20%', resp: 'None',    freq: 'Annual' },
  { date: 'Mar 8',  rival: 'STIIIZY',  promo: 'Weekend Flash Sale — 8 shared SKUs',           type: 'Flash',     days: 3,  disc: '-14%', resp: 'Held',    freq: 'Monthly' },
  { date: 'Feb 20', rival: 'MedMen',   promo: 'Happy Hour launch — FF Vapes 4–7PM',           type: 'Recurring', days: 55, disc: '-20%', resp: 'None',    freq: 'Daily' },
];

type SortKey = keyof DealRow;
const SORT_KEYS: SortKey[] = ['date', 'rival', 'promo', 'type', 'days', 'disc', 'resp', 'freq'];
const COL_LABELS = ['Date', 'Rival', 'Promotion', 'Type', 'Duration', 'Discount', 'Your Response', 'Recurrence'];

const MARKET_TABS = ['Heat Map', 'Competitor Ranking', 'My Benchmarks', 'SKU Gap Analysis', 'Deal Effectiveness'];

const PATTERNS = [
  {
    title: 'STIIIZY runs flash sales every 3–4 weeks',
    body: 'Weekend only, always Fri–Mon. Avg discount −14% on shared Flower and Vapes. All 3 prior events reverted Monday.',
  },
  {
    title: 'MedMen Happy Hour is now a permanent fixture',
    body: 'Running daily 4–7 PM since Feb 20. 87 consecutive days. Affects 3 shared FF Vape SKUs. Treat as their effective daily price during peak hours.',
  },
  {
    title: 'Catalyst Raw Garden deal is every day, not weekly',
    body: 'Deepest effective discount in the market at −15%. Runs continuously. Affects Vapes and Concentrates category overlap with your menu.',
  },
];

function typeColor(type: string) {
  if (type === 'Flash') return 'var(--danger)';
  if (type === 'Recurring') return 'var(--warm)';
  if (type === 'Brand day') return 'var(--rose)';
  return 'var(--text-3)';
}
function respColor(resp: string) {
  if (resp === 'Acted') return 'var(--accent)';
  if (resp === 'Pending') return 'var(--warm)';
  return 'var(--text-3)';
}
function durationStr(days: number) {
  if (days === 0) return 'Instant';
  if (days === 90) return 'Ongoing';
  return `${days}d`;
}
function discColor(disc: string) {
  if (disc.startsWith('-')) return 'var(--accent)';
  if (disc.startsWith('+')) return 'var(--danger)';
  return 'var(--text-3)';
}

export default function DealEffectiveness() {
  const [deals, setDeals] = useState<DealRow[]>(INITIAL_DEALS);
  const [sortCol, setSortCol] = useState<SortKey>('days');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [toast, setToast] = useState<string | null>(null);
  const [rivalOpen, setRivalOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [rivalFilter, setRivalFilter] = useState('All rivals');
  const [typeFilter, setTypeFilter] = useState('All types');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function handleSort(col: SortKey, idx: number) {
    const newDir: 1 | -1 = col === sortCol ? (sortDir === 1 ? -1 : 1) : -1;
    setSortCol(col);
    setSortDir(newDir);
    setDeals(prev => [...prev].sort((a, b) => {
      const va = a[col];
      const vb = b[col];
      if (typeof va === 'string') return va.localeCompare(vb as string) * newDir;
      return ((va as number) - (vb as number)) * newDir;
    }));
  }

  function sortInd(col: SortKey) {
    if (col !== sortCol) return '';
    return sortDir === 1 ? ' ▲' : ' ▼';
  }

  const flashCount = INITIAL_DEALS.filter(d => d.type === 'Flash').length;
  const recurCount = INITIAL_DEALS.filter(d => d.type === 'Recurring').length;
  const actedCount = INITIAL_DEALS.filter(d => d.resp === 'Acted').length;
  const summaryStats = [
    { v: INITIAL_DEALS.length, l: 'Total promo events', c: 'var(--text-1)' },
    { v: flashCount,           l: 'Flash sales',         c: 'var(--danger)' },
    { v: recurCount,           l: 'Recurring promos',    c: 'var(--warm)' },
    { v: actedCount,           l: 'You responded',       c: 'var(--accent)' },
  ];

  const thStyle: React.CSSProperties = {
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Deal Effectiveness</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>HOW RIVAL PROMOS PERFORM &amp; WHAT TO COUNTER</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => showToast('Exporting deal effectiveness…')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      {/* Market sub-nav */}
      <MarketSubNav />

      {/* Filter bar */}
      <div style={{ padding: '8px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={() => { setRivalOpen(false); setTypeOpen(false); }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Rival</span>
        <div style={{ position: 'relative' }}>
          <div onClick={e => { e.stopPropagation(); setRivalOpen(o => !o); setTypeOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: rivalFilter !== 'All rivals' ? 'var(--accent)' : 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
            {rivalFilter}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {rivalOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(30,60,80,0.14)', zIndex: 300, minWidth: 140, padding: 5 }}>
              {['All rivals', 'STIIIZY', 'MedMen', 'Off The Charts', 'Catalyst'].map(opt => (
                <div key={opt} onClick={e => { e.stopPropagation(); setRivalFilter(opt); setRivalOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === rivalFilter ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === rivalFilter ? 700 : 400, cursor: 'pointer' }}>
                  {opt} {opt === rivalFilter ? '✓' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }}/>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Promo type</span>
        <div style={{ position: 'relative' }}>
          <div onClick={e => { e.stopPropagation(); setTypeOpen(o => !o); setRivalOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer' }}>
            {typeFilter}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {typeOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 5px)', left: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(30,60,80,0.14)', zIndex: 300, minWidth: 140, padding: 5 }}>
              {['All types', 'Flash sale', 'Happy hour', 'Brand day', 'Recurring'].map(opt => (
                <div key={opt} onClick={e => { e.stopPropagation(); setTypeFilter(opt); setTypeOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === typeFilter ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === typeFilter ? 700 : 400, cursor: 'pointer' }}>
                  {opt} {opt === typeFilter ? '✓' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>90-day lookback · 5 rivals · 23 promo events</div>
      </div>

      {/* Scroll */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }}>
          {summaryStats.map(s => (
            <div key={s.l} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1, marginBottom: 3 }}>{s.v}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Promo table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth={2}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>Rival Promo Log — 90 Days</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Click headers to sort</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {SORT_KEYS.map((col, i) => (
                  <th key={col} style={thStyle} onClick={() => handleSort(col, i)}>
                    {COL_LABELS[i]}{sortInd(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((d, idx) => {
                const tc = typeColor(d.type);
                const rc = respColor(d.resp);
                const dc = discColor(d.disc);
                const dstr = durationStr(d.days);
                return (
                  <tr key={idx} style={{ cursor: 'pointer' }} onClick={() => showToast(`${d.rival}: ${d.promo.substring(0, 45)}…`)}>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{d.date}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--rose)' }}>{d.rival}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-1)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.promo}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${tc}22`, color: tc, whiteSpace: 'nowrap' }}>{d.type}</span>
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>{dstr}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: dc }}>{d.disc}</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: `${rc}22`, color: rc }}>{d.resp}</span>
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{d.freq}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pattern insights */}
        <div style={{ background: 'linear-gradient(135deg,rgba(212,144,10,0.07),rgba(212,144,10,0.02))', border: '1.5px solid rgba(212,144,10,0.2)', borderRadius: 'var(--r)', padding: '18px 22px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 12 }}>Pattern Insights — 90 Days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {PATTERNS.map(p => (
              <div key={p.title} style={{ background: 'var(--surface)', border: '1px solid rgba(212,144,10,0.15)', borderRadius: 'var(--r-sm)', padding: '13px 15px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.55 }}>{p.body}</div>
              </div>
            ))}
          </div>
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
