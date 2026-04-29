import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PriceChangeDeepDive() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [sortState, setSortState] = useState<Record<number, 1 | -1>>({});

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const root: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-1)' };
  const topbar: React.CSSProperties = { padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' };
  const scroll: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '16px 20px' };
  const backBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' };
  const sep: React.CSSProperties = { width: 1, height: 16, background: 'var(--border-2)' };
  const btn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' };
  const btnPrimary: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' };
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 0 };
  const cardHeader: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 };

  type TableRow = [string, string, string, string, string, boolean, boolean];
  const [tableRows] = useState<TableRow[]>([
    ['You', '$50', '—', 'Your price', 'None', false, false],
    ['STIIIZY', '$36 ↓', '−$14 (−28%)', 'Flash sale', 'Weekend Flash', true, true],
    ['MedMen', '$50', 'Even', 'Standard', 'None', false, false],
    ['Off The Charts', '$50', 'Even', 'Standard', 'None', false, true],
    ['Catalyst', '—', "Doesn't carry", 'N/A', 'N/A', false, false],
    ['Harborside', '—', "Doesn't carry", 'N/A', 'N/A', false, false],
  ]);

  const [sortedRows, setSortedRows] = useState<TableRow[]>(tableRows);

  const handleSort = (colIdx: number) => {
    const dir: 1 | -1 = sortState[colIdx] === 1 ? -1 : 1;
    setSortState({ ...sortState, [colIdx]: dir });
    const sorted = [...sortedRows].sort((a, b) => {
      const va = a[colIdx] as string;
      const vb = b[colIdx] as string;
      const na = parseFloat(va.replace(/[^0-9.\-]/g, ''));
      const nb = parseFloat(vb.replace(/[^0-9.\-]/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return (na - nb) * dir;
      return va.localeCompare(vb) * dir;
    });
    setSortedRows(sorted);
  };

  const thStyle: React.CSSProperties = { padding: '7px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)', cursor: 'pointer', userSelect: 'none' };
  const tdStyle: React.CSSProperties = { padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, verticalAlign: 'middle' };

  const colHeaders = ['Rival', 'Current Price', 'vs. You ($50)', 'Type', 'Promo'];

  // SVG sparkline data
  const W = 260, H = 80;
  const PAD = { t: 8, r: 6, b: 18, l: 28 };
  const days = 30;
  const minP = 32, maxP = 54;
  const px = (d: number) => PAD.l + (d / days) * (W - PAD.l - PAD.r);
  const py = (p: number) => PAD.t + (1 - (p - minP) / (maxP - minP)) * (H - PAD.t - PAD.b);

  const stiizyPts: [number, number][] = Array.from({ length: days + 1 }, (_, i) => [i, (i >= 8 && i <= 11) || (i >= 22 && i <= 25) ? 36 : 42]);
  const yoursPts: [number, number][] = [[0, 50], [days, 50]];

  const makePath = (pts: [number, number][]) => pts.map(([d, p], i) => `${i === 0 ? 'M' : 'L'}${px(d).toFixed(1)} ${py(p).toFixed(1)}`).join('');
  const stiizyPath = makePath(stiizyPts);
  const yoursPath = makePath(yoursPts);
  const areaPath = stiizyPath + ` L${px(days).toFixed(1)} ${py(minP).toFixed(1)} L${px(0).toFixed(1)} ${py(minP).toFixed(1)} Z`;

  return (
    <div style={root}>
      {/* TOPBAR */}
      <div style={topbar}>
        <div style={backBtn} onClick={() => navigate(-1)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Alert Detail
        </div>
        <div style={sep} />
        <div style={backBtn} onClick={() => navigate('/price-intelligence')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Price Intelligence
        </div>
        <div style={sep} />
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Price Change Deep Dive</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            90-day history
          </button>
          <button style={btnPrimary} onClick={() => showToast('Opening pricing response for this SKU')}>
            Respond
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div style={scroll}>
        {/* EVENT HERO */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '4px solid var(--accent)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 5 }}>Price Change Event · Apr 18, 2026 · 6:18 AM</div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3 }}>STIIIZY: Friendly Farms 3.5g Flower — $42 → $36</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>14.3% price reduction · $14 below your price · Weekend Flash Sale (ends Sunday Apr 20)</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Price Drop', bg: 'var(--accent-soft)', color: 'var(--accent)' },
              { label: 'Flash Sale', bg: 'var(--danger-soft)', color: 'var(--danger)' },
              { label: 'Blocked Rival', bg: 'var(--rose-soft)', color: 'var(--rose)' },
              { label: 'Pattern Match', bg: 'var(--warm-soft)', color: 'var(--warm)' },
            ].map(({ label, bg, color }) => (
              <span key={label} style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 10, background: bg, color }}>{label}</span>
            ))}
          </div>
        </div>

        {/* RECOMMENDATION BOX */}
        <div style={{ background: 'rgba(9,161,161,0.05)', border: '1px solid rgba(9,161,161,0.2)', borderLeft: '4px solid var(--accent)', borderRadius: 'var(--r)', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(9,161,161,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 3 }}>CannaSpy Recommendation</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>Hold your price through the weekend</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>STIIIZY's flash sales have reverted 100% of the time within 3 days. Matching their flash price costs margin permanently; their reversion is temporary. Monitor and re-evaluate Monday morning.</div>
            </div>
            <button onClick={() => showToast('Response logged — re-alerting Monday if STIIIZY doesn\'t revert')} style={{ flexShrink: 0, padding: '7px 14px', background: 'var(--accent)', color: '#fff', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Accept
            </button>
          </div>
        </div>

        {/* TWO-COL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
          {/* MAIN COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* MARKET SNAPSHOT TABLE */}
            <div style={card}>
              <div style={cardHeader}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Market Snapshot — Friendly Farms 3.5g</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>All rivals · current prices</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {colHeaders.map((h, i) => (
                      <th key={h} style={thStyle} onClick={() => handleSort(i)}>
                        {h}{sortState[i] ? (sortState[i] === 1 ? ' ▲' : ' ▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, ri) => {
                    const [rival, price, gap, type, promo, isFlash, isBlocked] = row;
                    const isYou = rival === 'You';
                    return (
                      <tr key={ri} style={{ background: isYou ? 'rgba(9,161,161,0.04)' : isFlash ? 'rgba(9,161,161,0.06)' : undefined }}>
                        <td style={tdStyle}>
                          {isYou ? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>● You</span> :
                            <><span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', marginRight: 5, verticalAlign: 'middle', background: ri === 1 ? '#D396A6' : ri === 2 ? '#09A1A1' : ri === 3 ? '#5484A4' : ri === 4 ? '#d4900a' : '#e05a6a' }} />{rival}{isBlocked && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px', borderRadius: 3, marginLeft: 3, background: 'var(--rose-soft)', color: 'var(--rose)' }}>blocked</span>}{!isBlocked && rival !== 'You' && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, padding: '1px 5px', borderRadius: 3, marginLeft: 3, background: 'var(--accent-soft)', color: 'var(--accent)' }}>tracking</span>}</>}
                        </td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontWeight: 700, color: isYou ? 'var(--danger)' : isFlash ? 'var(--accent)' : 'var(--text-2)' }}>{price}</td>
                        <td style={{ ...tdStyle, fontFamily: 'var(--mono)', fontSize: 10, color: isFlash ? 'var(--accent)' : 'var(--text-3)' }}>{gap}</td>
                        <td style={{ ...tdStyle, fontFamily: isFlash ? 'var(--mono)' : undefined, fontSize: isFlash ? 9 : undefined, color: isFlash ? 'var(--danger)' : 'var(--text-2)' }}>{type}</td>
                        <td style={{ ...tdStyle, color: isFlash ? 'var(--danger)' : 'var(--text-3)', fontSize: 11, fontWeight: isFlash ? 600 : undefined }}>{promo}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PATTERN ANALYSIS */}
            <div style={card}>
              <div style={cardHeader}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Flash Sale Pattern Analysis</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>STIIIZY West Hollywood · 90-day history</span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {[
                  { icon: '📅', label: 'Sale frequency', sub: 'How often STIIIZY runs this exact promotion', val: 'Every 3–4 weeks', color: 'var(--warm)' },
                  { icon: '⏰', label: 'Average duration', sub: 'How long flash sales last before price reverts', val: '3 days (Fri–Sun)', color: '' },
                  { icon: '📅', label: 'Occurrences in 90 days', sub: 'Jan 28, Mar 8, Apr 10 (current)', val: '3 times', color: '' },
                  { icon: '🔍', label: 'SKUs affected per sale', sub: 'Flash typically covers all Friendly Farms + Jeeter items', val: '6–8 SKUs', color: '' },
                  { icon: '📈', label: 'Revert reliability', sub: 'All prior flash sales reverted to standard pricing on Monday', val: '100% (3/3)', color: 'var(--accent)' },
                ].map(({ icon, label, sub, val, color }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, background: 'var(--surface-2)' }}>{icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{sub}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: color || 'var(--text-2)', textAlign: 'right' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRIOR PRICE EVENTS */}
            <div style={card}>
              <div style={cardHeader}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Prior Price Events — This SKU at STIIIZY</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>90-day lookback</span>
              </div>
              <div style={{ padding: '10px 16px' }}>
                {[
                  { date: 'Apr 10', change: '−$6', drop: true, label: 'Weekend Flash Sale → $42 to $36', dur: '3 days' },
                  { date: 'Apr 13', change: '+$6', drop: false, label: 'Sale ended → reverted to $42', dur: 'revert' },
                  { date: 'Mar 8', change: '−$6', drop: true, label: 'Weekend Flash Sale → $42 to $36', dur: '3 days' },
                  { date: 'Mar 11', change: '+$6', drop: false, label: 'Sale ended → reverted to $42', dur: 'revert' },
                  { date: 'Jan 28', change: '−$6', drop: true, label: 'Brand Week Sale → $42 to $36', dur: '4 days' },
                  { date: 'Feb 1', change: '+$6', drop: false, label: 'Sale ended → reverted to $42', dur: 'revert' },
                ].map(({ date, change, drop, label, dur }) => (
                  <div key={date + change} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', width: 50, flexShrink: 0 }}>{date}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, width: 55, flexShrink: 0, color: drop ? 'var(--accent)' : 'var(--danger)' }}>{change}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{dur}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDE COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Your gap vs. flash price</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: 'var(--danger)' }}>$14</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>You're 28% above STIIIZY's current flash price on this SKU</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Your gap vs. standard price</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: 'var(--warm)' }}>$8</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>You're 16% above STIIIZY's normal price — even when they're not on sale</div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Flash sale ends</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>Sun</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>Based on pattern, price reverts to $42 Monday Apr 21. This is a 3-day window.</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Confidence level</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700 }}>High</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>3 prior identical events all reverted within 72 hours</div>
            </div>

            {/* MINI SPARKLINE */}
            <div style={card}>
              <div style={cardHeader}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>30-Day Price Trend</span>
              </div>
              <div style={{ padding: '12px 16px 8px' }}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 80 }} preserveAspectRatio="none">
                  {[36, 42, 50].map((p) => (
                    <g key={p}>
                      <line x1={PAD.l} y1={py(p)} x2={W - PAD.r} y2={py(p)} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
                      <text x={PAD.l - 3} y={py(p) + 3} textAnchor="end" fontFamily="JetBrains Mono,monospace" fontSize="8" fill="currentColor" fillOpacity="0.4">${p}</text>
                    </g>
                  ))}
                  <path d={yoursPath} fill="none" stroke="#09A1A1" strokeWidth="1.5" strokeDasharray="4 2" strokeOpacity="0.6" />
                  <path d={areaPath} fill="rgba(211,150,166,0.08)" />
                  <path d={stiizyPath} fill="none" stroke="#D396A6" strokeWidth="1.8" />
                  {(['Mar 18', 'Apr 1', 'Apr 18'] as const).map((lbl, i) => {
                    const d = i === 0 ? 0 : i === 1 ? 14 : 30;
                    return <text key={lbl} x={px(d)} y={H - PAD.b + 12} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="8" fill="currentColor" fillOpacity="0.4">{lbl}</text>;
                  })}
                </svg>
              </div>
              <div style={{ padding: '0 16px 12px', display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-3)' }}>
                  <div style={{ width: 14, height: 2, background: '#09A1A1', borderRadius: 1 }} /> You ($50)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-3)' }}>
                  <div style={{ width: 14, height: 2, background: '#D396A6', borderRadius: 1 }} /> STIIIZY
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}
