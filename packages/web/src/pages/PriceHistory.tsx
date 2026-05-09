import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuthFetch } from '../lib/useAuthFetch';

const API = import.meta.env.VITE_API_URL ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  name: string;
  category: string;
  competitor_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
}

interface Competitor {
  competitor_id: string;
  competitor_name: string;
  slot_type: 'track' | 'block';
}

interface SeriesPoint {
  date: string; // 'YYYY-MM-DD'
  price: number;
  on_sale: boolean;
  discount_label: string | null;
}

interface HistoryData {
  product_name: string;
  days: number;
  competitors: Competitor[];
  series: Record<string, SeriesPoint[]>; // competitor_id → points
}

// ── Palette: assign stable colors to competitor index ─────────────────────────
const RIVAL_COLORS = ['#ba7517', '#d4537e', '#5484A4', '#d4900a', '#8b5cf6', '#3b8bd4'];
function rivalColor(idx: number) { return RIVAL_COLORS[idx % RIVAL_COLORS.length]; }

// ── SVG Chart helpers ─────────────────────────────────────────────────────────
const CHART_W = 900, CHART_H = 200;
const PAD = { top: 16, right: 20, bottom: 32, left: 48 };

function dateToDay(dateStr: string, startDate: Date): number {
  const d = new Date(dateStr);
  return Math.round((d.getTime() - startDate.getTime()) / 86_400_000);
}

function dayToX(day: number, totalDays: number) {
  return PAD.left + (day / Math.max(totalDays, 1)) * (CHART_W - PAD.left - PAD.right);
}

function priceToY(price: number, minP: number, maxP: number) {
  const range = maxP - minP || 1;
  const ratio = (price - minP) / range;
  return PAD.top + (1 - ratio) * (CHART_H - PAD.top - PAD.bottom);
}

function buildPath(pts: Array<{ day: number; price: number }>, minP: number, maxP: number, totalDays: number) {
  return pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${dayToX(p.day, totalDays).toFixed(1)} ${priceToY(p.price, minP, maxP).toFixed(1)}`
  ).join(' ');
}

// ── Empty / Loading states ────────────────────────────────────────────────────
function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 12 }}>
      {msg}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PriceHistory() {
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const currentLocationId = useStore(s => s.currentLocationId);

  const [days, setDays] = useState(90);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  // Fetch product list for location
  useEffect(() => {
    if (!currentLocationId) return;
    setLoadingProducts(true);
    authFetch(`${API}/api/v1/prices/products?location_id=${currentLocationId}`)
      .then(r => r.json())
      .then(data => {
        const prods: Product[] = data.data?.products || [];
        setProducts(prods);
        if (prods.length > 0 && !selectedProduct) {
          setSelectedProduct(prods[0].name);
        }
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  }, [currentLocationId]);

  // Fetch history when product or days changes
  const fetchHistory = useCallback(() => {
    if (!currentLocationId || !selectedProduct) return;
    setLoadingHistory(true);
    const params = new URLSearchParams({
      location_id: currentLocationId,
      product_name: selectedProduct,
      days: String(days),
    });
    authFetch(`${API}/api/v1/prices/history-by-product?${params}`)
      .then(r => r.json())
      .then(data => {
        setHistoryData(data.data || null);
        setHiddenLines({});
        setLoadingHistory(false);
      })
      .catch(() => setLoadingHistory(false));
  }, [currentLocationId, selectedProduct, days]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function toggleLine(id: string) {
    setHiddenLines(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ── Derive chart data ───────────────────────────────────────────────────────
  const competitors = historyData?.competitors || [];
  const series = historyData?.series || {};

  // Build normalized series: [{ day, price }] relative to window start
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  type NormPoint = { day: number; price: number; on_sale: boolean };
  const normSeries: Record<string, NormPoint[]> = {};
  for (const c of competitors) {
    const pts = series[c.competitor_id] || [];
    if (pts.length === 0) continue;
    normSeries[c.competitor_id] = pts.map(p => ({
      day: dateToDay(p.date, startDate),
      price: p.price,
      on_sale: p.on_sale,
    }));
  }

  // If only 1 data point, extend as a flat line to today
  for (const [cid, pts] of Object.entries(normSeries)) {
    if (pts.length === 1) {
      normSeries[cid] = [{ ...pts[0], day: 0 }, { ...pts[0], day: days }];
    }
  }

  const allPrices: number[] = [];
  for (const pts of Object.values(normSeries)) {
    pts.forEach(p => allPrices.push(p.price));
  }
  const minP = allPrices.length ? Math.min(...allPrices) - 2 : 0;
  const maxP = allPrices.length ? Math.max(...allPrices) + 2 : 100;

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  for (let i = 0; i <= 4; i++) {
    const price = minP + (maxP - minP) * (i / 4);
    const y = priceToY(price, minP, maxP);
    gridLines.push(
      <line key={`g${i}`} x1={PAD.left} y1={y} x2={CHART_W - PAD.right} y2={y} stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />,
      <text key={`t${i}`} x={PAD.left - 5} y={y + 4} textAnchor="end" fontFamily="Space Mono,monospace" fontSize="9" fill="currentColor" fillOpacity="0.4">${Math.round(price)}</text>
    );
  }

  // X-axis labels: evenly spaced dates over the window
  const xLabels: Array<{ label: string; day: number }> = [];
  const labelCount = days <= 30 ? 4 : days <= 60 ? 5 : 6;
  for (let i = 0; i <= labelCount; i++) {
    const day = Math.round((days / labelCount) * i);
    const d = new Date(startDate);
    d.setDate(d.getDate() + day);
    xLabels.push({ label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), day });
  }

  // Stats
  const allCurrentPrices = competitors
    .map(c => (series[c.competitor_id]?.[series[c.competitor_id].length - 1]?.price) ?? null)
    .filter(Boolean) as number[];
  const rivalLow = allCurrentPrices.length ? Math.min(...allCurrentPrices) : null;
  const rivalHigh = allCurrentPrices.length ? Math.max(...allCurrentPrices) : null;
  const rivalLowName = rivalLow != null
    ? competitors.find(c => series[c.competitor_id]?.[series[c.competitor_id].length - 1]?.price === rivalLow)?.competitor_name
    : null;

  const noLocation = !currentLocationId;
  const noProducts = !loadingProducts && products.length === 0;
  const noHistory = !loadingHistory && historyData && Object.keys(series).length === 0;

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
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 2 }}>
            {days}-DAY TREND · LIVE DATA
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => showToast('Exporting chart data as CSV…')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
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
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Product</span>
        <select
          value={selectedProduct ?? ''}
          onChange={e => { setSelectedProduct(e.target.value); setHiddenLines({}); }}
          disabled={loadingProducts || products.length === 0}
          style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', maxWidth: 280 }}>
          {loadingProducts && <option>Loading products…</option>}
          {!loadingProducts && products.length === 0 && <option>No shared products found</option>}
          {products.map(p => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px' }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Window</span>
        <select
          value={String(days)}
          onChange={e => setDays(Number(e.target.value))}
          style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          <option value="30">30 Days</option>
          <option value="60">60 Days</option>
          <option value="90">90 Days</option>
        </select>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
          {loadingHistory
            ? <><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ba7517' }} /> Fetching…</>
            : <><div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} /> Live data</>
          }
        </div>
      </div>

      {/* Content */}
      {noLocation ? (
        <EmptyState msg="Select a location to view price history." />
      ) : noProducts ? (
        <EmptyState msg="No products found across ≥2 competitors. Run the data pipeline to populate." />
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Product chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {products.slice(0, 12).map((p, i) => (
              <div
                key={p.name}
                onClick={() => { setSelectedProduct(p.name); setHiddenLines({}); }}
                style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1.5px solid ${selectedProduct === p.name ? 'var(--accent)' : 'var(--border-2)'}`, background: selectedProduct === p.name ? 'var(--accent)' : 'var(--surface)', color: selectedProduct === p.name ? '#fff' : 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: rivalColor(i), flexShrink: 0, opacity: selectedProduct === p.name ? 1 : 0.5, display: 'inline-block' }} />
                {p.name.length > 28 ? p.name.slice(0, 26) + '…' : p.name}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, opacity: 0.7 }}>{p.competitor_count}×</span>
              </div>
            ))}
          </div>

          {/* Chart card */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px 22px', boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  {selectedProduct ?? '—'} — Price History
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                  {competitors.length} rival{competitors.length !== 1 ? 's' : ''} tracked · last {days} days
                </div>
              </div>
              <button
                onClick={() => showToast('Setting price alert for this product…')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                Set alert
              </button>
            </div>

            {/* Stat strip */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                {
                  label: 'Rival Low',
                  val: rivalLow != null ? `$${rivalLow}` : '—',
                  valColor: 'var(--accent)',
                  delta: rivalLowName ?? 'No data yet',
                },
                {
                  label: 'Rival High',
                  val: rivalHigh != null ? `$${rivalHigh}` : '—',
                  valColor: 'var(--text-2)',
                  delta: `${competitors.length} rivals tracked`,
                },
                {
                  label: 'Avg Price',
                  val: allCurrentPrices.length
                    ? `$${(allCurrentPrices.reduce((a, b) => a + b, 0) / allCurrentPrices.length).toFixed(2)}`
                    : '—',
                  valColor: 'var(--text-2)',
                  delta: 'across rivals',
                },
                {
                  label: 'Data Points',
                  val: String(Object.values(series).reduce((s, pts) => s + pts.length, 0)),
                  valColor: 'var(--text-2)',
                  delta: `${days}-day window`,
                },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 14px', flex: 1, minWidth: 100 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>{stat.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: stat.valColor }}>{stat.val}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{stat.delta}</div>
                </div>
              ))}
            </div>

            {/* SVG Chart */}
            {noHistory ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 11, border: '1px dashed var(--border)', borderRadius: 6 }}>
                No price data in this window. Pipeline run will populate this chart.
              </div>
            ) : loadingHistory ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                Pulling latest prices…
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', width: '100%', height: 220 }}>
                  <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                    {gridLines}
                    {xLabels.map(m => (
                      <text key={m.label} x={dayToX(m.day, days)} y={CHART_H - PAD.bottom + 14} textAnchor="middle" fontFamily="Space Mono,monospace" fontSize="9" fill="currentColor" fillOpacity="0.4">{m.label}</text>
                    ))}
                    {competitors.map((c, idx) => {
                      const pts = normSeries[c.competitor_id];
                      if (!pts || hiddenLines[c.competitor_id]) return null;
                      const color = c.slot_type === 'block' ? '#ba7517' : rivalColor(idx);
                      const d = buildPath(pts, minP, maxP, days);
                      return (
                        <g key={c.competitor_id}>
                          <path d={d} fill="none" stroke={color} strokeWidth="2" />
                          {pts.filter((_, i) => i > 0 && i < pts.length - 1).map((p, i) => (
                            <circle key={i} cx={dayToX(p.day, days)} cy={priceToY(p.price, minP, maxP)} r="3.5" fill={color} stroke="var(--surface)" strokeWidth="1.5" />
                          ))}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
                  {competitors.map((c, idx) => {
                    const pts = normSeries[c.competitor_id];
                    if (!pts) return null;
                    const color = c.slot_type === 'block' ? '#ba7517' : rivalColor(idx);
                    const lastPrice = series[c.competitor_id]?.slice(-1)[0]?.price;
                    return (
                      <div key={c.competitor_id} onClick={() => toggleLine(c.competitor_id)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-2)', cursor: 'pointer', opacity: hiddenLines[c.competitor_id] ? 0.3 : 1 }}>
                        <div style={{ width: 18, height: 2.5, borderRadius: 2, background: color, flexShrink: 0 }} />
                        <span>{c.competitor_name}</span>
                        {lastPrice != null && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>${lastPrice}</span>}
                        {c.slot_type === 'block' && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, background: 'rgba(186,117,23,0.15)', color: '#ba7517', padding: '1px 4px', borderRadius: 3 }}>blocked</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Price points log */}
          {!noHistory && !loadingHistory && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                Price Observations
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {competitors.flatMap(c =>
                (series[c.competitor_id] || []).map((pt, i) => {
                  const color = c.slot_type === 'block' ? '#ba7517' : rivalColor(competitors.indexOf(c));
                  return (
                    <div key={`${c.competitor_id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: 5 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', width: 88, flexShrink: 0 }}>{pt.date}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color, flex: 1 }}>
                        {c.competitor_name}
                        {c.slot_type === 'block' && <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, marginLeft: 5, background: 'rgba(186,117,23,0.15)', color: '#ba7517' }}>blocked</span>}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-1)', flexShrink: 0 }}>${pt.price}</div>
                      {pt.on_sale && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, background: 'rgba(212,144,10,0.12)', color: '#d4900a' }}>
                          {pt.discount_label || 'sale'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

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
