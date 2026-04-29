import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Data ───────────────────────────────────────────────────────────────────

type RivalStatus = 'blocked' | 'tracking' | 'blocking-you' | 'untracked';

interface Rival {
  rank: number; name: string; color: string; init: string;
  status: RivalStatus; threat: number; dist: number;
  sharedSkus: number; priceGap: number; locs: number;
}

const RIVALS_DATA: Rival[] = [
  { rank: 1, name: 'STIIIZY WeHo', color: '#D396A6', init: 'ST', status: 'blocked', threat: 94, dist: 1.2, sharedSkus: 14, priceGap: -8, locs: 10 },
  { rank: 2, name: 'Off The Charts', color: '#5484A4', init: 'OT', status: 'blocked', threat: 88, dist: 2.9, sharedSkus: 16, priceGap: -4, locs: 8 },
  { rank: 3, name: 'MedMen WeHo', color: '#09A1A1', init: 'MM', status: 'tracking', threat: 72, dist: 0.8, sharedSkus: 11, priceGap: 0, locs: 5 },
  { rank: 4, name: 'Catalyst', color: '#d4900a', init: 'CA', status: 'tracking', threat: 61, dist: 1.9, sharedSkus: 8, priceGap: 6, locs: 4 },
  { rank: 5, name: 'Harborside LA', color: '#e05a6a', init: 'HA', status: 'tracking', threat: 48, dist: 3.6, sharedSkus: 6, priceGap: 2, locs: 3 },
  { rank: 6, name: 'Jungle Boys DTLA', color: '#d4900a', init: 'JB', status: 'blocking-you', threat: 41, dist: 2.1, sharedSkus: 9, priceGap: -2, locs: 4 },
  { rank: 7, name: 'Cookies WeHo', color: '#D396A6', init: 'CK', status: 'blocking-you', threat: 38, dist: 0.6, sharedSkus: 7, priceGap: -5, locs: 3 },
  { rank: 8, name: 'Connected Cannabis', color: '#09A1A1', init: 'CC', status: 'untracked', threat: 29, dist: 2.8, sharedSkus: 5, priceGap: 0, locs: 2 },
  { rank: 9, name: 'Zen Dispensary', color: '#5484A4', init: 'ZN', status: 'untracked', threat: 22, dist: 3.1, sharedSkus: 3, priceGap: 0, locs: 1 },
];

const MARKET_TABS = [
  { label: 'Heat Map', route: '/market' },
  { label: 'Competitor Ranking', route: '/competitor-ranking' },
  { label: 'My Benchmarks', route: '/benchmarks' },
  { label: 'SKU Gap Analysis', route: '/sku-gap' },
  { label: 'Deal Effectiveness', route: '/deal-effectiveness' },
];

export default function CompetitorRanking() {
  const navigate = useNavigate();
  const [rivals, setRivals] = useState<Rival[]>(RIVALS_DATA);
  const [sortState, setSortState] = useState<{ col: number; dir: number }>({ col: 3, dir: -1 });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dropdown state
  const [locOpen, setLocOpen] = useState(false);
  const [radOpen, setRadOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [locVal, setLocVal] = useState('WeHo Flagship');
  const [radVal, setRadVal] = useState('3 miles');
  const [sortVal, setSortVal] = useState('Threat score');

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function handleTabClick(route: string, label: string) {
    if (route === '/competitor-ranking') return;
    showToast(`Navigate to ${label}`);
  }

  type RivalKey = keyof Rival;
  const COL_KEYS: RivalKey[] = ['rank', 'name', 'status', 'threat', 'dist', 'sharedSkus', 'priceGap', 'locs'];

  function handleSort(col: number) {
    const dir = sortState.col === col ? -sortState.dir : -1;
    setSortState({ col, dir });
    const key = COL_KEYS[col];
    if (!key) return;
    setRivals(prev => [...prev].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (typeof va === 'string') return (va as string).localeCompare(vb as string) * dir;
      return ((va as number) - (vb as number)) * dir;
    }));
  }

  // Compute summary
  const summary = rivals.reduce((acc, r) => {
    if (r.threat >= 80) acc.high++;
    else if (r.threat >= 50) acc.med++;
    if (r.status === 'tracking') acc.tracked++;
    if (r.status === 'blocked') acc.blocked++;
    if (r.status === 'untracked') acc.untracked++;
    return acc;
  }, { high: 0, med: 0, tracked: 0, blocked: 0, untracked: 0 });

  const summaryItems = [
    { v: summary.high, l: 'High threat rivals', c: 'var(--danger)' },
    { v: summary.med, l: 'Medium threat', c: 'var(--warm)' },
    { v: summary.tracked, l: 'Tracked rivals', c: 'var(--accent)' },
    { v: summary.blocked, l: 'Blocked by you', c: 'var(--rose)' },
    { v: summary.untracked, l: 'Untracked nearby', c: 'var(--text-2)' },
  ];

  function statusStyle(status: RivalStatus): React.CSSProperties {
    if (status === 'blocked') return { background: 'var(--rose-soft)', color: 'var(--rose)' };
    if (status === 'tracking') return { background: 'var(--accent-soft)', color: 'var(--accent)' };
    if (status === 'blocking-you') return { background: 'rgba(212,144,10,0.12)', color: 'var(--warm)' };
    return { background: 'var(--surface-3)', color: 'var(--text-3)' };
  }
  function statusLabel(status: RivalStatus) {
    if (status === 'blocked') return 'Blocked by you';
    if (status === 'tracking') return 'Tracking';
    if (status === 'blocking-you') return 'Blocking you';
    return 'Untracked';
  }
  function threatColor(threat: number) {
    return threat >= 80 ? 'var(--danger)' : threat >= 60 ? 'var(--warm)' : 'var(--text-2)';
  }

  const colHeaders = ['#', 'Rival', 'Status', 'Threat', 'Distance', 'Shared SKUs', 'Price vs. You', 'Locations', 'Action'];

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 5px)', left: 0,
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(30,60,80,0.14)',
    zIndex: 300, minWidth: 150, padding: 5,
  };
  const ddBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px',
    borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600,
    border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border-2)'}`,
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? '#fff' : 'var(--text-1)', cursor: 'pointer',
    fontFamily: 'var(--sans)', whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14, overflow: 'hidden' }}
      onClick={() => { setLocOpen(false); setRadOpen(false); setSortOpen(false); }}>

      {/* TOPBAR */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Competitor Ranking</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>WEST HOLLYWOOD · THREAT SCORE &amp; PRICE POSITION</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => showToast('Exporting competitor ranking…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* MARKET NAV TABS */}
      <div style={{ display: 'flex', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {MARKET_TABS.map(tab => {
          const active = tab.route === '/competitor-ranking';
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
          <div style={ddBtnStyle(true)} onClick={e => { e.stopPropagation(); setLocOpen(o => !o); setRadOpen(false); setSortOpen(false); }}>
            {locVal}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          {locOpen && (
            <div style={dropdownStyle}>
              {['WeHo Flagship', 'DTLA East', 'Long Beach', 'All Locations'].map(opt => (
                <div key={opt} onClick={() => { setLocVal(opt); setLocOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === locVal ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === locVal ? 700 : 400, cursor: 'pointer' }}>{opt}{opt === locVal ? ' ✓' : ''}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Radius</span>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={ddBtnStyle(false)} onClick={e => { e.stopPropagation(); setRadOpen(o => !o); setLocOpen(false); setSortOpen(false); }}>
            {radVal}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          {radOpen && (
            <div style={dropdownStyle}>
              {['1 mile', '3 miles', '5 miles', 'All market'].map(opt => (
                <div key={opt} onClick={() => { setRadVal(opt); setRadOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === radVal ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === radVal ? 700 : 400, cursor: 'pointer' }}>{opt}{opt === radVal ? ' ✓' : ''}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Sort by</span>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <div style={ddBtnStyle(false)} onClick={e => { e.stopPropagation(); setSortOpen(o => !o); setLocOpen(false); setRadOpen(false); }}>
            {sortVal}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </div>
          {sortOpen && (
            <div style={dropdownStyle}>
              {['Threat score', 'Distance', 'Shared SKUs', 'Price gap'].map(opt => (
                <div key={opt} onClick={() => { setSortVal(opt); setSortOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === sortVal ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === sortVal ? 700 : 400, cursor: 'pointer' }}>{opt}{opt === sortVal ? ' ✓' : ''}</div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>12 rivals within 3 mi · 5 tracked · 2 blocked</div>
      </div>

      {/* MAIN SCROLL */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* SUMMARY STRIP */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {summaryItems.map((s, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 16px', flex: 1, boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, lineHeight: 1, marginBottom: 2, color: s.c }}>{s.v}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* RANK TABLE */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {colHeaders.map((h, i) => (
                  <th key={i} onClick={() => i < 8 ? handleSort(i) : undefined}
                    style={{ padding: '9px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)', cursor: i < 8 ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    {h}{sortState.col === i ? (sortState.dir === 1 ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rivals.map((r, idx) => {
                const tc = threatColor(r.threat);
                const pg = r.priceGap;
                const pgTxt = pg === 0 || r.status === 'untracked' ? '—' : pg > 0 ? `+$${pg} higher` : `$${Math.abs(pg)} lower`;
                const pgColor = pg > 0 ? 'var(--danger)' : (pg < 0 && r.status !== 'untracked') ? 'var(--accent)' : 'var(--text-3)';
                return (
                  <tr key={r.rank} style={{ cursor: 'default' }}>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: r.rank <= 3 ? 'var(--warm)' : 'var(--text-3)' }}>{r.rank}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0, background: r.color }}>{r.init}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{r.dist} mi away</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, ...statusStyle(r.status) }}>{statusLabel(r.status)}</span>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 80, height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden', display: 'inline-block' }}>
                          <div style={{ height: 8, borderRadius: 4, width: `${r.threat}%`, background: tc, opacity: 0.75 }} />
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: tc }}>{r.threat}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{r.dist} mi</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>{r.sharedSkus}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: pgColor }}>{pgTxt}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{r.locs}</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
                      {r.status === 'untracked' && (
                        <button onClick={() => showToast(`Adding ${r.name} to tracking…`)} style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-2)' }}>+ Track</button>
                      )}
                      {r.status === 'tracking' && (
                        <button onClick={() => showToast(`Block ${r.name}`)} style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid rgba(211,150,166,0.4)', background: 'var(--surface-3)', color: 'var(--rose)' }}>Block</button>
                      )}
                      {r.status === 'blocked' && (
                        <button onClick={() => showToast(`Navigate to Block Analytics`)} style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, cursor: 'pointer', border: '1px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-2)' }}>Analytics →</button>
                      )}
                      {r.status === 'blocking-you' && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--warm)' }}>Blocking you</span>
                      )}
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
