import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Data ───────────────────────────────────────────────────────────────────

interface BenchItem {
  cat: string; yours: number; avg: number; low: number; high: number;
}

const BENCH_DATA: BenchItem[] = [
  { cat: 'Flower', yours: 49, avg: 46, low: 38, high: 55 },
  { cat: 'Vapes', yours: 56, avg: 52, low: 44, high: 62 },
  { cat: 'Pre-rolls', yours: 28, avg: 27, low: 18, high: 38 },
  { cat: 'Edibles', yours: 24, avg: 24, low: 16, high: 32 },
  { cat: 'Concentrates', yours: 62, avg: 58, low: 48, high: 72 },
];

const MARKET_TABS = [
  { label: 'Heat Map', route: '/market' },
  { label: 'Competitor Ranking', route: '/competitor-ranking' },
  { label: 'My Benchmarks', route: '/benchmarks' },
  { label: 'SKU Gap Analysis', route: '/sku-gap' },
  { label: 'Deal Effectiveness', route: '/deal-effectiveness' },
];

export default function MyBenchmarks() {
  const navigate = useNavigate();
  const [bench, setBench] = useState<BenchItem[]>(BENCH_DATA);
  const [sortState, setSortState] = useState<{ col: number; dir: number }>({ col: -1, dir: 1 });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dropdown state
  const [locOpen, setLocOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [locVal, setLocVal] = useState('WeHo Flagship');
  const [catVal, setCatVal] = useState('All');

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function handleTabClick(route: string, label: string) {
    if (route === '/benchmarks') return;
    showToast(`Navigate to ${label}`);
  }

  // Summary stats
  const totalYou = bench.reduce((s, b) => s + b.yours, 0);
  const totalAvg = bench.reduce((s, b) => s + b.avg, 0);
  const avgYou = Math.round(totalYou / bench.length);
  const avgMkt = Math.round(totalAvg / bench.length);
  const gap = (totalYou - totalAvg) / bench.length;
  const above = bench.filter(b => b.yours > b.avg).length;

  const summaryItems = [
    { v: `$${avgYou}`, l: 'Your avg price', c: 'var(--text-1)' },
    { v: `$${avgMkt}`, l: 'Market avg price', c: 'var(--text-3)' },
    { v: `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`, l: 'Avg gap vs. market', c: gap > 0 ? 'var(--danger)' : 'var(--accent)' },
    { v: `${above}/${bench.length}`, l: 'Categories above avg', c: 'var(--warm)' },
  ];

  type BenchKey = keyof BenchItem;
  const COL_KEYS: BenchKey[] = ['cat', 'yours', 'avg', 'low', 'high'];

  function handleSort(col: number) {
    const dir = sortState.col === col ? -sortState.dir : -1;
    setSortState({ col, dir });
    if (col >= COL_KEYS.length) return;
    const key = COL_KEYS[col];
    setBench(prev => [...prev].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (typeof va === 'string') return (va as string).localeCompare(vb as string) * dir;
      return ((va as number) - (vb as number)) * dir;
    }));
  }

  function positionLabel(b: BenchItem) {
    if (b.yours >= b.high - 2) return 'Market high';
    if (b.yours <= b.low + 2) return 'Market low';
    if (b.yours > b.avg) return 'Above avg';
    if (b.yours < b.avg) return 'Below avg';
    return 'At market';
  }
  function positionColor(b: BenchItem) {
    if (b.yours >= b.high - 2) return 'var(--danger)';
    if (b.yours <= b.low + 2) return 'var(--accent)';
    if (b.yours > b.avg) return 'var(--warm)';
    return 'var(--accent)';
  }
  function gapColor(gap: number) {
    return gap > 0 ? 'var(--danger)' : gap < 0 ? 'var(--accent)' : 'var(--text-3)';
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 5px)', left: 0,
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(30,60,80,0.14)',
    zIndex: 300, minWidth: 140, padding: 5,
  };
  const ddBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
    borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600,
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text-1)', cursor: 'pointer',
    fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const,
  });

  const colHeaders = ['Category', 'Your Avg', 'Market Avg', 'Market Low', 'Market High', 'Gap vs. Avg', 'Position'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14, overflow: 'hidden' }}
      onClick={() => { setLocOpen(false); setCatOpen(false); }}>

      {/* TOPBAR */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>My Benchmarks</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>WHERE YOU STAND IN THE MARKET</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => showToast('Exporting benchmarks…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* MARKET NAV TABS */}
      <div style={{ display: 'flex', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {MARKET_TABS.map(tab => {
          const active = tab.route === '/benchmarks';
          return (
            <div key={tab.route} onClick={() => handleTabClick(tab.route, tab.label)} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {tab.label}
            </div>
          );
        })}
      </div>

      {/* FILTER BAR */}
      <div onClick={e => e.stopPropagation()} style={{ padding: '8px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Location</span>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={ddBtnStyle(true)} onClick={e => { e.stopPropagation(); setLocOpen(o => !o); setCatOpen(false); }}>
            {locVal}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          {locOpen && (
            <div style={dropdownStyle}>
              {['WeHo Flagship', 'DTLA East', 'Long Beach'].map(opt => (
                <div key={opt} onClick={() => { setLocVal(opt); setLocOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === locVal ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === locVal ? 700 : 400, cursor: 'pointer' }}>{opt}{opt === locVal ? ' ✓' : ''}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Category</span>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={ddBtnStyle(false)} onClick={e => { e.stopPropagation(); setCatOpen(o => !o); setLocOpen(false); }}>
            {catVal}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          {catOpen && (
            <div style={dropdownStyle}>
              {['All', 'Flower', 'Vapes', 'Edibles', 'Pre-rolls'].map(opt => (
                <div key={opt} onClick={() => { setCatVal(opt); setCatOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === catVal ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === catVal ? 700 : 400, cursor: 'pointer' }}>{opt}{opt === catVal ? ' ✓' : ''}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>Benchmarked against 5 tracked rivals · WeHo market</div>
      </div>

      {/* MAIN SCROLL */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* SUMMARY STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {summaryItems.map((s, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: s.c, lineHeight: 1, marginBottom: 3 }}>{s.v}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* PRICE POSITION CHART */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Price Position by Category</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Your avg vs. market avg · higher = you charge more</span>
          </div>
          <div style={{ padding: '18px 20px' }}>
            {bench.map((b, i) => {
              const range = (b.high - b.low) || 1;
              const yourPct = Math.max(0, Math.min(100, ((b.yours - b.low) / range) * 100));
              const avgPct = Math.max(0, Math.min(100, ((b.avg - b.low) / range) * 100));
              const gap = b.yours - b.avg;
              const gc = gap > 0 ? 'var(--danger)' : gap < 0 ? 'var(--accent)' : 'var(--text-3)';
              return (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{b.cat}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: gc, fontWeight: 700 }}>{gap > 0 ? '+' : ''}{gap} vs. market avg</span>
                  </div>
                  <div style={{ position: 'relative', height: 14, background: 'var(--surface-3)', borderRadius: 7 }}>
                    {/* gradient overlay */}
                    <div style={{ position: 'absolute', inset: 0, borderRadius: 7, background: 'linear-gradient(to right,var(--accent-soft),var(--danger-soft))', opacity: 0.5 }} />
                    {/* avg marker */}
                    <div style={{ position: 'absolute', left: `${avgPct}%`, top: -4, width: 2, height: 22, background: 'var(--text-3)', borderRadius: 1 }} />
                    {/* your position marker */}
                    <div style={{ position: 'absolute', left: `calc(${yourPct}% - 7px)`, top: -5, width: 14, height: 24, background: gc, borderRadius: 4, opacity: 0.85 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>
                    <span>Low ${b.low}</span>
                    <span>Avg ${b.avg}&nbsp;&nbsp;You ${b.yours}</span>
                    <span>High ${b.high}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETAILED BENCHMARK TABLE */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h6" /></svg>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Detailed Benchmark</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Click headers to sort</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {colHeaders.map((h, i) => (
                  <th key={i} onClick={() => handleSort(i)}
                    style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                    {h}{sortState.col === i ? (sortState.dir === 1 ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bench.map((b, i) => {
                const gap = b.yours - b.avg;
                const pos = positionLabel(b);
                const pc = positionColor(b);
                const gc = gapColor(gap);
                return (
                  <tr key={i}>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600 }}>{b.cat}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700 }}>${b.yours}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>${b.avg}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)' }}>${b.low}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--danger)' }}>${b.high}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: gc }}>{gap > 0 ? '+' : ''}{gap}</td>
                    <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 3, background: pc + '22', color: pc }}>{pos}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}
