import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Data ───────────────────────────────────────────────────────────────────

type Tier = 'elite' | 'hot' | 'competitive' | 'standard';

interface Market {
  id: string; name: string; tier: Tier; rate: string;
  dispensaries: number; yours: number; rivals: number;
  cx: number; cy: number; r: number;
}

const MARKETS: Market[] = [
  { id: 'weho', name: 'West Hollywood', tier: 'elite', rate: '$250', dispensaries: 38, yours: 1, rivals: 5, cx: 205, cy: 295, r: 22 },
  { id: 'dtla', name: 'Downtown LA', tier: 'elite', rate: '$250', dispensaries: 45, yours: 2, rivals: 4, cx: 230, cy: 305, r: 24 },
  { id: 'sf', name: 'San Francisco', tier: 'elite', rate: '$250', dispensaries: 42, yours: 1, rivals: 3, cx: 108, cy: 115, r: 22 },
  { id: 'oakland', name: 'Oakland', tier: 'hot', rate: '$200', dispensaries: 31, yours: 1, rivals: 3, cx: 118, cy: 135, r: 19 },
  { id: 'sddowntown', name: 'San Diego', tier: 'hot', rate: '$200', dispensaries: 28, yours: 1, rivals: 2, cx: 270, cy: 420, r: 18 },
  { id: 'longbeach', name: 'Long Beach', tier: 'competitive', rate: '$150', dispensaries: 22, yours: 1, rivals: 3, cx: 240, cy: 320, r: 16 },
  { id: 'sacramento', name: 'Sacramento', tier: 'competitive', rate: '$150', dispensaries: 19, yours: 1, rivals: 2, cx: 165, cy: 145, r: 15 },
  { id: 'anaheim', name: 'Anaheim', tier: 'competitive', rate: '$150', dispensaries: 17, yours: 0, rivals: 2, cx: 258, cy: 308, r: 14 },
  { id: 'riverside', name: 'Riverside/Corona', tier: 'standard', rate: '$100', dispensaries: 12, yours: 1, rivals: 1, cx: 285, cy: 305, r: 13 },
  { id: 'fresno', name: 'Fresno', tier: 'standard', rate: '$100', dispensaries: 9, yours: 0, rivals: 0, cx: 195, cy: 225, r: 11 },
  { id: 'bakersfield', name: 'Bakersfield', tier: 'standard', rate: '$100', dispensaries: 7, yours: 0, rivals: 0, cx: 205, cy: 270, r: 10 },
  { id: 'stockton', name: 'Stockton', tier: 'standard', rate: '$100', dispensaries: 8, yours: 0, rivals: 0, cx: 148, cy: 168, r: 10 },
];

const TIER_COLORS: Record<Tier, string> = {
  elite: '#e05a6a', hot: '#d4900a', competitive: '#09A1A1', standard: '#5484A4',
};
const TIER_LABELS: Record<Tier, string> = {
  elite: 'Elite', hot: 'Hot', competitive: 'Competitive', standard: 'Standard',
};

interface Tooltip { x: number; y: number; market: Market }

const MARKET_TABS = [
  { label: 'Heat Map', route: '/market' },
  { label: 'Competitor Ranking', route: '/competitor-ranking' },
  { label: 'My Benchmarks', route: '/benchmarks' },
  { label: 'SKU Gap Analysis', route: '/sku-gap' },
  { label: 'Deal Effectiveness', route: '/deal-effectiveness' },
];

export default function MarketHeatMap() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<SVGSVGElement>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function handleTabClick(route: string, label: string) {
    if (route === '/market') return;
    showToast(`Navigate to ${label}`);
  }

  function handleCircleMouseEnter(e: React.MouseEvent<SVGCircleElement>, m: Market) {
    const rect = (e.target as SVGCircleElement).ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = rect.width / 700;
    const scaleY = rect.height / 520;
    setTooltip({ x: rect.left + m.cx * scaleX, y: rect.top + m.cy * scaleY, market: m });
  }

  function handleCircleMouseLeave() {
    setTooltip(null);
  }

  const sorted = [...MARKETS].sort((a, b) => {
    const order: Record<Tier, number> = { elite: 0, hot: 1, competitive: 2, standard: 3 };
    return order[a.tier] - order[b.tier] || b.dispensaries - a.dispensaries;
  });

  // Build CA path + circles SVG content
  const caPath = 'M 90 30 L 130 28 L 145 55 L 160 60 L 175 50 L 195 55 L 220 45 L 240 52 L 260 48 L 290 58 L 310 80 L 320 110 L 315 140 L 310 180 L 320 220 L 325 270 L 330 310 L 320 350 L 305 390 L 290 430 L 270 460 L 245 480 L 210 490 L 180 480 L 160 460 L 150 440 L 90 400 L 70 370 L 60 330 L 55 280 L 60 230 L 65 180 L 70 140 L 75 100 L 80 60 Z';

  const tierBadgeStyle = (tier: Tier): React.CSSProperties => {
    if (tier === 'elite') return { background: 'rgba(224,90,106,0.12)', color: 'var(--danger)' };
    if (tier === 'hot') return { background: 'rgba(212,144,10,0.12)', color: 'var(--warm)' };
    if (tier === 'competitive') return { background: 'var(--accent-soft)', color: 'var(--accent)' };
    return { background: 'var(--surface-3)', color: 'var(--text-3)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14, overflow: 'hidden' }}>

      {/* TOPBAR */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Market Heat Map</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>CALIFORNIA · DISPENSARY DENSITY &amp; SLOT PRICING</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => showToast('Exporting market heat data…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
          </button>
        </div>
      </div>

      {/* MARKET NAV TABS */}
      <div style={{ display: 'flex', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {MARKET_TABS.map(tab => {
          const active = tab.route === '/market';
          return (
            <div key={tab.route} onClick={() => handleTabClick(tab.route, tab.label)} style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {tab.label}
            </div>
          );
        })}
      </div>

      {/* MAP LAYOUT */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* MAP MAIN */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--surface-2)' }}>
          <svg ref={mapRef} viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            {/* CA outline */}
            <path d={caPath} fill="rgba(84,132,164,0.06)" stroke="var(--border-2)" strokeWidth="1.5" />
            {/* Market circles */}
            {MARKETS.map(m => {
              const col = TIER_COLORS[m.tier];
              const isSelected = m.id === selected;
              const dotCount = Math.min(Math.floor(m.dispensaries / 5), 8);
              const dots = Array.from({ length: dotCount }, (_, i) => {
                const angle = (i / dotCount) * Math.PI * 2;
                const dr = m.r * 0.55;
                return { x: m.cx + Math.cos(angle) * dr, y: m.cy + Math.sin(angle) * dr };
              });
              return (
                <g key={m.id}>
                  <circle
                    cx={m.cx} cy={m.cy} r={m.r}
                    fill={col} fillOpacity={0.18}
                    stroke={isSelected ? col : col} strokeWidth={isSelected ? 2.5 : 1.5}
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setSelected(m.id); showToast(`${m.name}: ${m.dispensaries} dispensaries · ${m.rate}/slot`); }}
                    onMouseEnter={e => handleCircleMouseEnter(e, m)}
                    onMouseLeave={handleCircleMouseLeave}
                  />
                  {dots.map((d, di) => <circle key={di} cx={d.x} cy={d.y} r={2} fill={col} fillOpacity={0.5} style={{ pointerEvents: 'none' }} />)}
                  <text x={m.cx} y={m.cy + 1} textAnchor="middle" dominantBaseline="middle" fontFamily="JetBrains Mono,monospace" fontSize={8} fontWeight={700} fill={col} fillOpacity={0.9} style={{ pointerEvents: 'none' }}>{m.dispensaries}</text>
                  {m.yours > 0 && <circle cx={m.cx} cy={m.cy} r={m.r + 5} fill="none" stroke="#09A1A1" strokeWidth={1.5} strokeDasharray="3 2" style={{ pointerEvents: 'none' }} />}
                  <text x={m.cx} y={m.cy + m.r + 10} textAnchor="middle" fontFamily="Plus Jakarta Sans,sans-serif" fontSize={9} fontWeight={600} fill="currentColor" fillOpacity={0.55} style={{ pointerEvents: 'none' }}>{m.name.split('/')[0]}</text>
                </g>
              );
            })}
          </svg>

          {/* LEGEND */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 14px', boxShadow: 'var(--card-shadow)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-3)', marginBottom: 7 }}>Market tier · slot rate</div>
            {([
              { color: '#e05a6a', label: 'Elite — $250–300/slot' },
              { color: '#d4900a', label: 'Hot — $200/slot' },
              { color: '#09A1A1', label: 'Competitive — $150/slot' },
              { color: '#5484A4', label: 'Standard — $100/slot' },
            ]).map((leg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, fontSize: 11, color: 'var(--text-2)' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: leg.color, opacity: 0.8, flexShrink: 0 }} />
                {leg.label}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #09A1A1', flexShrink: 0 }} />
              Your location
            </div>
          </div>

          {/* ZOOM CONTROLS */}
          <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['+', '−'].map(btn => (
              <div key={btn} onClick={() => showToast(btn === '+' ? 'Zoomed in' : 'Zoomed out')} style={{ width: 32, height: 32, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--card-shadow)', color: 'var(--text-2)', fontSize: 16, fontWeight: 700 }}>
                {btn}
              </div>
            ))}
          </div>

          {/* TOOLTIP */}
          {tooltip && (() => {
            const m = tooltip.market;
            const col = TIER_COLORS[m.tier];
            return (
              <div style={{ position: 'fixed', left: tooltip.x + 16, top: tooltip.y - 10, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '10px 14px', boxShadow: '0 8px 32px rgba(30,60,80,0.15)', pointerEvents: 'none', zIndex: 100, minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3, display: 'inline-block', marginBottom: 5, background: col + '22', color: col }}>{TIER_LABELS[m.tier]} · {m.rate}/slot</span>
                {[
                  ['Dispensaries', m.dispensaries],
                  ['Slot rate', m.rate + '/slot'],
                  ['Your locations', m.yours || 'None'],
                  ['Rivals tracked', m.rivals],
                ].map(([k, val], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-2)', marginBottom: 2 }}>
                    <span>{k}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--text-1)' }}>{String(val)}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* SIDEBAR */}
        <div style={{ width: 320, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>California Markets</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Click a market to see details</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {sorted.map(m => {
              const isSelected = m.id === selected;
              const col = TIER_COLORS[m.tier];
              return (
                <div key={m.id} onClick={() => { setSelected(m.id); showToast(`${m.name}: ${m.dispensaries} dispensaries · ${m.rate}/slot`); }}
                  style={{ background: isSelected ? 'var(--surface)' : 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent', borderRadius: 'var(--r-sm)', padding: '11px 13px', marginBottom: 7, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, flex: 1 }}>
                      {m.name}
                      {m.yours > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', marginLeft: 4 }}>{m.yours} loc</span>}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, ...tierBadgeStyle(m.tier) }}>{TIER_LABELS[m.tier]}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    {[
                      { val: m.dispensaries, label: 'Dispensaries' },
                      { val: m.rivals, label: 'Rivals tracked' },
                      { val: m.rate, label: 'Slot rate' },
                    ].map((s, i) => (
                      <div key={i} style={{ background: 'var(--surface)', borderRadius: 4, padding: '4px 6px' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>{s.val}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--border)' }}>Slot rate: {m.rate}/slot · {TIER_LABELS[m.tier]} tier</div>
                </div>
              );
            })}
          </div>
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
