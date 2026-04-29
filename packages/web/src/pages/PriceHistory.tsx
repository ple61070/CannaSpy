import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Types & Data ─────────────────────────────────────────────────────────────
interface Rival {
  key: string;
  name: string;
  status: 'blocked' | 'tracking';
  color: string;
}

const RIVALS: Rival[] = [
  { key: 'stiiizy', name: 'STIIIZY', status: 'blocked', color: '#D396A6' },
  { key: 'medmen', name: 'MedMen', status: 'tracking', color: '#09A1A1' },
  { key: 'otc', name: 'Off The Charts', status: 'blocked', color: '#5484A4' },
  { key: 'catalyst', name: 'Catalyst', status: 'tracking', color: '#d4900a' },
  { key: 'harbor', name: 'Harborside', status: 'tracking', color: '#e05a6a' },
];

interface PriceEvent {
  date: string;
  rival: string;
  old: number;
  newVal: number;
  type: 'flash' | 'sale' | 'perm';
  label: string;
}

interface SkuData {
  yours: number;
  label: string;
  meta: string;
  low: { val: number; label: string };
  high: { val: number; label: string };
  changes: number;
  promoDays: number;
  series: Record<string, [number, number][] | null>;
  events: PriceEvent[];
}

const HISTORY: Record<string, SkuData> = {
  ff1: {
    yours: 50, label: 'Friendly Farms 3.5g Flower', meta: 'Your price: $50 · 5 rivals tracked',
    low: { val: 36, label: 'STIIIZY flash sale' }, high: { val: 50, label: 'MedMen, OTC match' },
    changes: 7, promoDays: 23,
    series: {
      stiiizy: [[0,42],[14,42],[21,36],[28,36],[35,42],[45,42],[60,36],[70,36],[90,42]],
      medmen: [[0,50],[90,50]], otc: [[0,50],[90,50]], catalyst: null, harbor: null,
      yours: [[0,50],[90,50]],
    },
    events: [
      { date: 'Apr 10', rival: 'STIIIZY', old: 42, newVal: 36, type: 'flash', label: 'Weekend Flash' },
      { date: 'Mar 22', rival: 'STIIIZY', old: 36, newVal: 42, type: 'perm', label: 'Back to standard' },
      { date: 'Mar 8', rival: 'STIIIZY', old: 42, newVal: 36, type: 'flash', label: 'Weekend Flash' },
      { date: 'Feb 14', rival: 'STIIIZY', old: 36, newVal: 42, type: 'perm', label: 'Post-promo reset' },
      { date: 'Jan 28', rival: 'STIIIZY', old: 42, newVal: 36, type: 'sale', label: 'Brand Week Sale' },
    ],
  },
  ff3: {
    yours: 55, label: 'Friendly Farms 1g Vape', meta: 'Your price: $55 · 3 rivals tracked',
    low: { val: 44, label: 'MedMen happy hour' }, high: { val: 55, label: 'You, STIIIZY, OTC' },
    changes: 4, promoDays: 31,
    series: {
      stiiizy: [[0,55],[90,55]], medmen: [[0,55],[20,44],[35,44],[50,55],[90,55]], otc: [[0,52],[90,52]], catalyst: null, harbor: null,
      yours: [[0,55],[90,55]],
    },
    events: [
      { date: 'Mar 15', rival: 'MedMen', old: 44, newVal: 55, type: 'perm', label: 'Happy hour ended' },
      { date: 'Feb 20', rival: 'MedMen', old: 55, newVal: 44, type: 'sale', label: 'Happy Hour 4-7pm' },
      { date: 'Feb 5', rival: 'OTC', old: 55, newVal: 52, type: 'perm', label: 'Price reduction' },
      { date: 'Jan 20', rival: 'OTC', old: 52, newVal: 55, type: 'perm', label: 'Price restored' },
    ],
  },
  j1: {
    yours: 42, label: 'Jeeter Juice 1g Vape', meta: 'Your price: $42 · 4 rivals tracked',
    low: { val: 32, label: 'OTC Brand Day Sale' }, high: { val: 42, label: 'You, STIIIZY, MedMen' },
    changes: 6, promoDays: 18,
    series: {
      stiiizy: [[0,42],[90,42]], medmen: [[0,42],[90,42]], otc: [[0,40],[15,32],[22,40],[60,32],[68,40],[90,40]], catalyst: null, harbor: [[0,42],[90,42]],
      yours: [[0,42],[90,42]],
    },
    events: [
      { date: 'Apr 12', rival: 'OTC', old: 40, newVal: 32, type: 'flash', label: 'Brand Day Sale' },
      { date: 'Apr 5', rival: 'OTC', old: 32, newVal: 40, type: 'perm', label: 'Sale ended' },
      { date: 'Mar 1', rival: 'OTC', old: 40, newVal: 32, type: 'flash', label: 'Brand Day Sale' },
      { date: 'Feb 22', rival: 'OTC', old: 32, newVal: 40, type: 'perm', label: 'Sale ended' },
    ],
  },
  j5: {
    yours: 38, label: 'Jeeter XL Pre-Roll', meta: 'Your price: $38 · 2 rivals tracked',
    low: { val: 35, label: 'STIIIZY persistent' }, high: { val: 38, label: 'You, MedMen' },
    changes: 2, promoDays: 0,
    series: {
      stiiizy: [[0,35],[90,35]], medmen: [[0,38],[90,38]], otc: [[0,35],[90,35]], catalyst: null, harbor: null,
      yours: [[0,38],[90,38]],
    },
    events: [
      { date: 'Jan 30', rival: 'STIIIZY', old: 38, newVal: 35, type: 'perm', label: 'Price cut' },
      { date: 'Jan 22', rival: 'OTC', old: 38, newVal: 35, type: 'perm', label: 'Price cut' },
    ],
  },
  k2: {
    yours: 35, label: 'Kanha Gummies 200mg', meta: 'Your price: $35 · 2 rivals tracked',
    low: { val: 32, label: 'STIIIZY, OTC standard' }, high: { val: 35, label: 'You, MedMen' },
    changes: 1, promoDays: 5,
    series: {
      stiiizy: [[0,32],[90,32]], medmen: [[0,35],[90,35]], otc: [[0,32],[90,32]], catalyst: null, harbor: null,
      yours: [[0,35],[90,35]],
    },
    events: [
      { date: 'Feb 10', rival: 'STIIIZY', old: 35, newVal: 32, type: 'perm', label: 'Price reduction' },
    ],
  },
  rg1: {
    yours: 58, label: 'Raw Garden 1g Live Resin Vape', meta: 'Your price: $58 · 2 rivals tracked',
    low: { val: 49, label: 'Catalyst daily brand deal' }, high: { val: 58, label: 'You, OTC standard' },
    changes: 3, promoDays: 90,
    series: {
      stiiizy: null, medmen: null, otc: [[0,58],[90,58]], catalyst: [[0,58],[10,49],[90,49]], harbor: null,
      yours: [[0,58],[90,58]],
    },
    events: [
      { date: 'Jan 25', rival: 'Catalyst', old: 58, newVal: 49, type: 'sale', label: 'Daily Brand Deal (permanent)' },
    ],
  },
};

const SKU_CHIPS = [
  { key: 'ff1', label: 'FF 3.5g', dot: '#e05a6a' },
  { key: 'ff3', label: 'FF 1g Vape', dot: '#e05a6a' },
  { key: 'j1', label: 'Jeeter Juice', dot: '#5484A4' },
  { key: 'j5', label: 'Jeeter XL', dot: '#5484A4' },
  { key: 'k2', label: 'Kanha 200mg', dot: '#09A1A1' },
  { key: 'rg1', label: 'Raw Garden', dot: '#d4900a' },
];

const SKU_LABELS: Record<string, string> = {
  ff1: 'Friendly Farms 3.5g', ff3: 'Friendly Farms 1g Vape', j1: 'Jeeter Juice 1g',
  j5: 'Jeeter XL Pre-Roll', k2: 'Kanha Gummies 200mg', rg1: 'Raw Garden 1g Live Resin',
};

// ── SVG Chart helpers ────────────────────────────────────────────────────────
const CHART_W = 900, CHART_H = 200;
const PAD = { top: 16, right: 20, bottom: 32, left: 44 };

function dayToX(day: number) {
  return PAD.left + (day / 90) * (CHART_W - PAD.left - PAD.right);
}
function priceToY(price: number, minP: number, maxP: number) {
  const range = maxP - minP || 1;
  const ratio = (price - minP) / range;
  return PAD.top + (1 - ratio) * (CHART_H - PAD.top - PAD.bottom);
}
function buildPath(pts: [number, number][], minP: number, maxP: number) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${dayToX(p[0]).toFixed(1)} ${priceToY(p[1], minP, maxP).toFixed(1)}`).join(' ');
}
function buildArea(pts: [number, number][], minP: number, maxP: number) {
  const path = buildPath(pts, minP, maxP);
  const lastX = dayToX(pts[pts.length - 1][0]).toFixed(1);
  const firstX = dayToX(pts[0][0]).toFixed(1);
  const baseY = (CHART_H - PAD.bottom).toFixed(1);
  return `${path} L${lastX} ${baseY} L${firstX} ${baseY} Z`;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PriceHistory() {
  const navigate = useNavigate();
  const [currentSku, setCurrentSku] = useState('ff1');
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  function toggleLine(key: string) {
    setHiddenLines(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function switchSku(key: string) {
    setCurrentSku(key);
    setHiddenLines({});
  }

  const data = HISTORY[currentSku];

  // Compute min/max for chart
  const allPrices: number[] = [data.yours];
  RIVALS.forEach(r => {
    const s = data.series[r.key];
    if (s) s.forEach(p => allPrices.push(p[1]));
  });
  const minP = Math.min(...allPrices) - 3;
  const maxP = Math.max(...allPrices) + 3;

  // Build SVG paths
  const gridLines: React.ReactNode[] = [];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    const price = minP + (maxP - minP) * (i / steps);
    const y = priceToY(price, minP, maxP);
    gridLines.push(
      <line key={`g${i}`} x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />,
      <text key={`t${i}`} x={PAD.left - 5} y={y + 4} textAnchor="end" fontFamily="JetBrains Mono,monospace" fontSize="9" fill="currentColor" fillOpacity="0.4">${Math.round(price)}</text>
    );
  }

  const xLabels = [{ label: 'Jan 15', day: 0 }, { label: 'Feb', day: 16 }, { label: 'Mar', day: 44 }, { label: 'Apr', day: 75 }];

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
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Price History</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>90-DAY TREND · WEST HOLLYWOOD FLAGSHIP</div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => showToast('Exporting chart data as CSV…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export CSV
            </button>
          </div>
        </div>
        {/* Sub-nav */}
        <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Price History', to: '/price-history', active: true },
            { label: 'Catalog Comparison', to: '/catalog-comparison', active: false },
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
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>SKU</span>
        <select value={currentSku} onChange={e => switchSku(e.target.value)} style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          {Object.entries(SKU_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Window</span>
        <select defaultValue="90" style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          <option>30 Days</option>
          <option>60 Days</option>
          <option value="90">90 Days</option>
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Rivals</span>
        <select style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          <option>All rivals</option>
          <option>STIIIZY (blocked)</option>
          <option>MedMen (tracking)</option>
          <option>Off The Charts (blocked)</option>
          <option>Catalyst (tracking)</option>
        </select>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
          Updated 6 min ago
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

        {/* SKU chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {SKU_CHIPS.map(chip => (
            <div key={chip.key} onClick={() => switchSku(chip.key)} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1.5px solid ${currentSku === chip.key ? 'var(--accent)' : 'var(--border-2)'}`, background: currentSku === chip.key ? 'var(--accent)' : 'var(--surface)', color: currentSku === chip.key ? '#fff' : 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: chip.dot, flexShrink: 0, opacity: currentSku === chip.key ? 1 : 0.5, display: 'inline-block' }} />
              {chip.label}
            </div>
          ))}
        </div>

        {/* Chart card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 22px', boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>{data.label} — Price History</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{data.meta} · Jan 15 – Apr 15, 2026</div>
            </div>
            <button onClick={() => showToast('Setting price alert for this SKU…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              Set alert
            </button>
          </div>

          {/* Stat strip */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Your Price', val: `$${data.yours}`, valColor: 'var(--text-1)', delta: 'Unchanged 90d' },
              { label: 'Rival Low', val: `$${data.low.val}`, valColor: 'var(--accent)', delta: data.low.label },
              { label: 'Rival High', val: `$${data.high.val}`, valColor: 'var(--danger)', delta: data.high.label },
              { label: 'Price Changes', val: String(data.changes), valColor: 'var(--text-2)', delta: 'across all rivals' },
              { label: 'Days w/ Promo', val: String(data.promoDays), valColor: 'var(--text-2)', delta: 'at least 1 rival active' },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 14px', flex: 1, minWidth: 100 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>{stat.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: stat.valColor }}>{stat.val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{stat.delta}</div>
              </div>
            ))}
          </div>

          {/* SVG Chart */}
          <div style={{ position: 'relative', width: '100%', height: 220 }}>
            <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
              {gridLines}
              {xLabels.map(m => (
                <text key={m.label} x={dayToX(m.day)} y={CHART_H - PAD.bottom + 14} textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="9" fill="currentColor" fillOpacity="0.4">{m.label}</text>
              ))}
              {/* Your area */}
              {data.series.yours && !hiddenLines['yours'] && (
                <>
                  <path d={buildArea(data.series.yours, minP, maxP)} fill="rgba(9,161,161,0.06)" stroke="none" />
                  <path d={buildPath(data.series.yours, minP, maxP)} fill="none" stroke="#09A1A1" strokeWidth="2.5" strokeDasharray="5 3" strokeOpacity="0.7" />
                </>
              )}
              {/* Rival lines */}
              {RIVALS.map(r => {
                if (hiddenLines[r.key]) return null;
                const pts = data.series[r.key];
                if (!pts) return null;
                return (
                  <g key={r.key}>
                    <path d={buildPath(pts, minP, maxP)} fill="none" stroke={r.color} strokeWidth="2" />
                    {pts.map((p, idx) => {
                      if (idx === 0 || idx === pts.length - 1) return null;
                      return <circle key={idx} cx={dayToX(p[0])} cy={priceToY(p[1], minP, maxP)} r="3.5" fill={r.color} stroke="var(--surface)" strokeWidth="1.5" />;
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
            <div onClick={() => toggleLine('yours')} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)', cursor: 'pointer', opacity: hiddenLines['yours'] ? 0.3 : 1 }}>
              <div style={{ width: 18, height: 2.5, borderRadius: 2, background: '#09A1A1', flexShrink: 0 }} />
              <span>You (${data.yours})</span>
            </div>
            {RIVALS.map(r => {
              if (!data.series[r.key]) return null;
              return (
                <div key={r.key} onClick={() => toggleLine(r.key)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-2)', cursor: 'pointer', opacity: hiddenLines[r.key] ? 0.3 : 1 }}>
                  <div style={{ width: 18, height: 2.5, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                  <span>{r.name}</span>
                  {r.status === 'blocked' && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, background: 'rgba(211,150,166,0.15)', color: r.color, padding: '1px 4px', borderRadius: 3, marginLeft: 3 }}>blocked</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Event log */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            Price Change Events
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          {data.events.map((ev, i) => {
            const rival = RIVALS.find(r => r.name === ev.rival || r.key === ev.rival);
            const color = rival ? rival.color : 'var(--text-2)';
            const isDown = ev.newVal < ev.old;
            const delta = isDown ? `-$${ev.old - ev.newVal}` : `+$${ev.newVal - ev.old}`;
            const tagStyle: React.CSSProperties = ev.type === 'flash'
              ? { background: 'rgba(224,90,106,0.12)', color: 'var(--danger)' }
              : ev.type === 'sale'
                ? { background: 'rgba(212,144,10,0.12)', color: 'var(--warm)' }
                : { background: 'rgba(9,161,161,0.10)', color: 'var(--accent)' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: 5 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', width: 72, flexShrink: 0 }}>{ev.date}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color, flex: 1 }}>{ev.rival}
                  {rival?.status === 'blocked' && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', padding: '1px 5px', borderRadius: 3, marginLeft: 5, background: 'rgba(211,150,166,0.15)', color: 'var(--rose)' }}>blocked</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.label}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: isDown ? 'var(--accent)' : 'var(--danger)', flexShrink: 0 }}>{delta}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', width: 48, textAlign: 'right', flexShrink: 0 }}>${ev.old} → ${ev.newVal}</div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, flexShrink: 0, ...tagStyle }}>{ev.type}</span>
              </div>
            );
          })}
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
