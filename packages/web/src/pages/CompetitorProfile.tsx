import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ── Static data ─────────────────────────────────────────────────────────────
interface Sku {
  product: string;
  yours: string;
  theirs: string;
  gap: string;
  dir: 'negative' | 'positive' | 'zero';
  promo?: { sale: string; type: string; label: string; ends: string; effectiveGap: string };
}
interface Brand {
  key: string;
  name: string;
  hasAlert: boolean;
  yourSkus: number;
  theirSkus: number;
  yourRange: string;
  theirRange: string;
  gapLabel: string;
  gapClass: 'gap-danger' | 'gap-teal' | 'gap-even';
  sub: string;
  skus: Sku[];
}

const SHARED_BRANDS: Brand[] = [
  {
    key: 'ff', name: 'Friendly Farms', hasAlert: true,
    yourSkus: 3, theirSkus: 3,
    yourRange: '$50–$90', theirRange: '$42–$82',
    gapLabel: '−$8', gapClass: 'gap-danger',
    sub: '3 SKUs each · you\'re higher on all · flash sale active',
    skus: [
      { product: 'FF 3.5g Flower', yours: '$50', theirs: '$42', gap: '−$8', dir: 'negative', promo: { sale: '$36', type: 'flash', label: 'Weekend Flash Sale', ends: 'Sun', effectiveGap: '−$14' } },
      { product: 'FF 7g Flower', yours: '$90', theirs: '$82', gap: '−$8', dir: 'negative' },
      { product: 'FF 1g Vape', yours: '$55', theirs: '$55', gap: 'Even', dir: 'zero' },
    ],
  },
  {
    key: 'jeeter', name: 'Jeeter', hasAlert: false,
    yourSkus: 5, theirSkus: 8,
    yourRange: '$12–$55', theirRange: '$12–$52',
    gapLabel: 'Even', gapClass: 'gap-even',
    sub: '5 your SKUs · 8 theirs · pricing at parity',
    skus: [
      { product: 'Jeeter Juice 1g', yours: '$42', theirs: '$42', gap: 'Even', dir: 'zero' },
      { product: 'Jeeter Baby 0.5g', yours: '$18', theirs: '$18', gap: 'Even', dir: 'zero' },
      { product: 'Jeeter Baby 5pk', yours: '$55', theirs: '$52', gap: '+$3', dir: 'positive' },
      { product: 'Jeeter Infused Pre-Roll', yours: '$28', theirs: '$28', gap: 'Even', dir: 'zero' },
      { product: 'Jeeter XL Pre-Roll', yours: '$38', theirs: '$35', gap: '+$3', dir: 'positive' },
    ],
  },
  {
    key: 'kanha', name: 'Kanha', hasAlert: false,
    yourSkus: 4, theirSkus: 4,
    yourRange: '$18–$35', theirRange: '$18–$32',
    gapLabel: '+$3', gapClass: 'gap-teal',
    sub: '4 SKUs each · you\'re cheaper on edibles',
    skus: [
      { product: 'Kanha Gummies 100mg', yours: '$22', theirs: '$22', gap: 'Even', dir: 'zero' },
      { product: 'Kanha Gummies 200mg', yours: '$35', theirs: '$32', gap: '+$3', dir: 'positive' },
      { product: 'Kanha Nano 100mg', yours: '$28', theirs: '$28', gap: 'Even', dir: 'zero' },
      { product: 'Kanha Belts 100mg', yours: '$18', theirs: '$18', gap: 'Even', dir: 'zero' },
    ],
  },
];

const CATEGORIES = [
  { cat: 'Flower', youSkus: 45, youRange: '$18–$80', themSkus: 62, themRange: '$15–$75', shared: 8, youPct: 73 },
  { cat: 'Vapes', youSkus: 28, youRange: '$22–$60', themSkus: 41, themRange: '$18–$58', shared: 4, youPct: 68 },
  { cat: 'Edibles', youSkus: 18, youRange: '$12–$55', themSkus: 22, themRange: '$12–$50', shared: 3, youPct: 82 },
  { cat: 'Concentrates', youSkus: 12, youRange: '$25–$80', themSkus: 18, themRange: '$22–$75', shared: 2, youPct: 67 },
  { cat: 'Pre-rolls', youSkus: 22, youRange: '$8–$45', themSkus: 31, themRange: '$8–$42', shared: 5, youPct: 71 },
  { cat: 'Accessories', youSkus: 8, youRange: '$5–$30', themSkus: 14, themRange: '$5–$35', shared: 0, youPct: 57 },
];

const YOUR_EXCLUSIVES = [
  { name: 'Maven', detail: '6 SKUs · Flower + Vapes' },
  { name: 'Raw Garden', detail: '4 SKUs · Vapes' },
  { name: 'Gold Flora', detail: '3 SKUs · Flower' },
  { name: 'CBX', detail: '4 SKUs · Flower' },
  { name: 'Zkittlez', detail: '2 SKUs · Flower' },
  { name: 'Heavy Hitters', detail: '3 SKUs · Vapes' },
  { name: 'Alien Labs', detail: '3 SKUs · Flower + Conc.' },
  { name: 'Stiiizy Pods', detail: '8 SKUs · Vapes' },
];

const THEIR_EXCLUSIVES = [
  { name: 'Stiiizy Flower', detail: '18 SKUs · Flower' },
  { name: 'Stiiizy Edibles', detail: '8 SKUs · Edibles' },
  { name: 'Pac-Man Extracts', detail: '6 SKUs · Concentrates' },
  { name: 'Connected', detail: '5 SKUs · Flower' },
  { name: 'Dosist', detail: '4 SKUs · Vapes' },
  { name: 'Cannatique', detail: '4 SKUs · Flower' },
  { name: 'Lowell Herb Co.', detail: '4 SKUs · Pre-rolls' },
  { name: 'West Coast Cure', detail: '3 SKUs · Concentrates' },
  { name: 'Moxie', detail: '3 SKUs · Concentrates' },
  { name: 'Calyx Peaks', detail: '2 SKUs · Concentrates' },
  { name: 'Camino', detail: '4 SKUs · Edibles' },
  { name: 'Select', detail: '3 SKUs · Vapes' },
];

interface AlertItem {
  badge: string;
  badgeColor: string;
  badgeBg: string;
  title: string;
  sub: string;
  time: string;
  urgent: boolean;
  stats: { n: string; label: string; color?: string }[];
}

const ALERTS: AlertItem[] = [
  {
    badge: 'SHARED BRAND ALERT', badgeColor: 'var(--accent)', badgeBg: 'rgba(9,161,161,0.10)',
    title: 'Friendly Farms 3.5g dropped −$8',
    sub: 'You both carry this SKU — you are now $8 above their price',
    time: '1h ago', urgent: true,
    stats: [
      { n: '$50', label: 'Your price' },
      { n: '$42', label: 'Their price', color: 'var(--danger)' },
      { n: '−$8', label: "You're higher", color: 'var(--danger)' },
    ],
  },
  {
    badge: 'SHARED BRAND ALERT', badgeColor: 'var(--accent)', badgeBg: 'rgba(9,161,161,0.10)',
    title: 'Jeeter Baby 5pk raised +$3 — opportunity',
    sub: 'You both carry this SKU — you are now $3 cheaper',
    time: '3h ago', urgent: false,
    stats: [
      { n: '$55', label: 'Your price' },
      { n: '$52', label: 'Their price', color: 'var(--accent)' },
      { n: '+$3', label: "You're cheaper", color: 'var(--accent)' },
    ],
  },
  {
    badge: 'CATALOG ALERT', badgeColor: 'var(--text-2)', badgeBg: 'var(--surface-3)',
    title: '6 new Concentrates added overnight',
    sub: 'None from brands you carry — watch list only',
    time: '6h ago', urgent: false,
    stats: [
      { n: '+6', label: 'SKUs added' },
      { n: '0', label: 'Shared brands' },
    ],
  },
  {
    badge: 'PROMO ALERT', badgeColor: 'var(--warm)', badgeBg: 'rgba(212,144,10,0.1)',
    title: 'Buy 2 get 1 on all STIIIZY-brand vapes',
    sub: 'Own-brand promotion only — does not affect your shared brands',
    time: 'Yesterday', urgent: false,
    stats: [
      { n: 'BOGO', label: 'Promo type' },
      { n: 'None', label: 'Shared brands' },
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function CompetitorProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'shared' | 'category' | 'gaps' | 'alerts'>('shared');
  const [selectedBrand, setSelectedBrand] = useState<string>('ff');
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }

  const selectedBrandData = SHARED_BRANDS.find(b => b.key === selectedBrand);

  const s: React.CSSProperties = { fontFamily: 'var(--sans)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14 }}>

      {/* ── Rival Header ── */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', flexShrink: 0, padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0 12px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            WeHo Flagship
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>STIIIZY West Hollywood</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 20, background: 'rgba(211,150,166,0.15)', color: 'var(--rose)', border: '1px solid rgba(211,150,166,0.3)' }}>Blocked</span>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.04em' }}>1.2 mi · Last updated 47 min ago · 1,747 SKUs</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(211,150,166,0.08)', border: '1px solid rgba(211,150,166,0.18)', borderRadius: 20, padding: '4px 12px', flexShrink: 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, color: 'var(--rose)', letterSpacing: '0.06em' }}>Blocked 47 days · cannot access CannaSpy</span>
            <button onClick={() => showToast('Opening cancellation flow…')} style={{ marginLeft: 8, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--rose)', background: 'none', border: '1px solid rgba(211,150,166,0.4)', borderRadius: 10, padding: '2px 8px', cursor: 'pointer' }}>Cancel block</button>
          </div>
        </div>
        {/* Stat tiles */}
        <div style={{ display: 'flex', gap: 6, paddingBottom: 14, flexWrap: 'wrap' }}>
          {[
            { n: '3', label: 'Shared brands', color: 'var(--danger)' },
            { n: '8', label: 'Your exclusives', color: 'var(--text-1)' },
            { n: '12', label: 'Their exclusives', color: 'var(--warm)' },
            { n: '12', label: 'Changes today', color: 'var(--danger)' },
            { n: '1,747', label: 'Total SKUs', color: 'var(--text-1)' },
            { n: '4', label: 'Active alerts', color: 'var(--accent)' },
          ].map(tile => (
            <div key={tile.label} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 14px', flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: tile.color, lineHeight: 1 }}>{tile.n}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{tile.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs bar ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', padding: '0 24px', background: 'var(--surface)', flexShrink: 0 }}>
        {([
          { id: 'shared', label: 'Shared Brands', count: '3' },
          { id: 'category', label: 'Category Overview' },
          { id: 'gaps', label: 'Brand Gaps', count: '20' },
          { id: 'alerts', label: 'Recent Alerts', count: '4' },
        ] as { id: string; label: string; count?: string }[]).map(tab => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{ padding: '10px 18px', fontSize: 12, fontWeight: 600, color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-3)', cursor: 'pointer', borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -2, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {tab.label}
            {tab.count && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, background: activeTab === tab.id ? 'rgba(9,161,161,0.10)' : 'var(--surface-3)', border: `1px solid ${activeTab === tab.id ? 'rgba(9,161,161,0.2)' : 'var(--border)'}`, borderRadius: 10, padding: '1px 6px', color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-3)' }}>{tab.count}</span>
            )}
          </div>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', minHeight: 0 }}>

        {/* SHARED BRANDS */}
        {activeTab === 'shared' && (
          <>
            {/* Brand list */}
            <div style={{ width: 340, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Brands both dispensaries carry</div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 9px', borderRadius: 12, background: 'rgba(9,161,161,0.10)', color: 'var(--accent)', fontWeight: 500 }}>3 shared</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 9px', borderRadius: 12, background: 'var(--surface-3)', color: 'var(--text-2)', fontWeight: 500 }}>8 your exclusives</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 9px', borderRadius: 12, background: 'rgba(212,144,10,0.12)', color: 'var(--warm)', fontWeight: 500 }}>12 their exclusives</span>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {/* Alert section */}
                <div style={{ padding: '6px 16px 3px', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  ⚠ Alert — action needed
                </div>
                {SHARED_BRANDS.filter(b => b.hasAlert).map(b => (
                  <BrandRow key={b.key} brand={b} isAlert selected={selectedBrand === b.key} onSelect={() => setSelectedBrand(b.key)} />
                ))}
                <div style={{ padding: '6px 16px 3px', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  Shared brands — no active alert
                </div>
                {SHARED_BRANDS.filter(b => !b.hasAlert).map(b => (
                  <BrandRow key={b.key} brand={b} isAlert={false} selected={selectedBrand === b.key} onSelect={() => setSelectedBrand(b.key)} />
                ))}
              </div>
            </div>

            {/* Brand detail */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-2)', minWidth: 0 }}>
              {selectedBrandData ? (
                <BrandDetail brand={selectedBrandData} showToast={showToast} />
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 10 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em' }}>Select a brand to compare SKUs</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* CATEGORY OVERVIEW */}
        {activeTab === 'category' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Category', 'Your menu', 'Their menu', 'Visual', 'Shared brands'].map((h, i) => (
                      <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '10px 16px', borderBottom: '2px solid var(--border)', textAlign: i === 4 ? 'right' : 'left', background: 'var(--surface-2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map(c => {
                    const maxSkus = Math.max(c.youSkus, c.themSkus);
                    const youW = Math.round((c.youSkus / maxSkus) * 100);
                    return (
                      <tr key={c.cat}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{c.cat}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>{c.youSkus} SKUs</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{c.youRange}</div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>{c.themSkus} SKUs</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{c.themRange}</div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', width: 120 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--accent)', marginBottom: 1 }}>YOU</div>
                              <div style={{ height: 5, borderRadius: 3, background: 'var(--accent)', width: `${youW}%` }} />
                            </div>
                            <div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--rose)', marginBottom: 1 }}>THEM</div>
                              <div style={{ height: 5, borderRadius: 3, background: 'var(--rose)', width: '100%' }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', textAlign: 'right' }}>
                          {c.shared > 0 ? `${c.shared} brand${c.shared === 1 ? '' : 's'}` : <span style={{ color: 'var(--text-3)' }}>None</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BRAND GAPS */}
        {activeTab === 'gaps' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
            <GapCard
              badgeLabel="Your exclusives"
              badgeColor="var(--accent)"
              badgeBg="rgba(9,161,161,0.10)"
              title="Brands you carry — they don't"
              sub="Protect these. They carry none of these brands. Your competitive advantage."
              items={YOUR_EXCLUSIVES}
              dotColor="var(--accent)"
            />
            <GapCard
              badgeLabel="Their exclusives"
              badgeColor="var(--warm)"
              badgeBg="rgba(212,144,10,0.12)"
              title="Brands they carry — you don't"
              sub="Watch list. If any of these gain traction, consider adding them to your menu."
              items={THEIR_EXCLUSIVES}
              dotColor="var(--warm)"
            />
          </div>
        )}

        {/* RECENT ALERTS */}
        {activeTab === 'alerts' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {ALERTS.map((a, i) => (
              <div key={i} onClick={() => showToast('Opening alert detail…')} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${a.urgent ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: 10, boxShadow: 'var(--card-shadow)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 4, background: a.badgeBg, color: a.badgeColor }}>{a.badge}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{a.time}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{a.sub}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {a.stats.map(stat => (
                    <div key={stat.label} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: stat.color || 'var(--text-1)' }}>{stat.n}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 1 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 24, padding: '9px 18px', fontSize: 12, fontWeight: 500, color: 'var(--text-1)', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9998, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function BrandRow({ brand, isAlert, selected, onSelect }: { brand: Brand; isAlert: boolean; selected: boolean; onSelect: () => void }) {
  const initials = brand.name.split(' ').map(w => w[0]).join('').substring(0, 2);
  const gapColor = brand.gapClass === 'gap-danger' ? 'var(--danger)' : brand.gapClass === 'gap-teal' ? 'var(--accent)' : 'var(--text-3)';
  return (
    <div
      onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selected ? 'rgba(9,161,161,0.08)' : isAlert ? 'rgba(224,90,106,0.04)' : 'transparent', borderLeft: selected ? '3px solid var(--accent)' : isAlert ? '3px solid var(--danger)' : '3px solid transparent', position: 'relative' }}
    >
      {isAlert && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />}
      {!isAlert && <div style={{ width: 7, flexShrink: 0 }} />}
      <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, background: isAlert ? 'rgba(224,90,106,0.12)' : 'rgba(9,161,161,0.10)', color: isAlert ? 'var(--danger)' : 'var(--accent)' }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{brand.name}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)' }}>{brand.sub}</div>
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, flexShrink: 0, color: gapColor }}>{brand.gapLabel}</div>
    </div>
  );
}

function BrandDetail({ brand, showToast }: { brand: Brand; showToast: (msg: string) => void }) {
  const gapColor = brand.gapClass === 'gap-danger' ? 'var(--danger)' : brand.gapClass === 'gap-teal' ? 'var(--accent)' : 'var(--text-3)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>SHARED BRAND — STIIIZY WEST HOLLYWOOD</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', marginBottom: 8 }}>{brand.name}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { n: brand.yourSkus, label: 'Your SKUs', color: 'var(--text-1)' },
            { n: brand.theirSkus, label: 'Their SKUs', color: 'var(--text-1)' },
            { n: brand.yourRange, label: 'Your range', color: 'var(--text-1)' },
            { n: brand.theirRange, label: 'Their range', color: gapColor },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.n}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {brand.hasAlert && (
          <div style={{ background: 'rgba(224,90,106,0.06)', border: '1px solid rgba(224,90,106,0.2)', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 3 }}>SHARED BRAND ALERT — 1H AGO</div>
            <div style={{ fontSize: 12, color: 'var(--text-1)' }}>They dropped prices on this brand. You are currently above their price on 2 of 3 shared SKUs.</div>
          </div>
        )}
        {brand.skus.some(s => s.promo) && (
          <div style={{ background: 'rgba(224,90,106,0.06)', border: '1px solid rgba(224,90,106,0.2)', borderRadius: 'var(--r-sm)', padding: '9px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--danger)' }}>⚡ FLASH SALE ACTIVE</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)', marginLeft: 4 }}>Weekend Flash Sale · ends Sun</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginLeft: 'auto' }}>$36 <span style={{ fontWeight: 400, textDecoration: 'line-through', opacity: 0.6 }}>$42</span></div>
          </div>
        )}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>SKU-level price comparison</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 18 }}>
          <thead>
            <tr>
              {['Product', 'Your price', 'Their price', 'Gap'].map(h => (
                <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '5px 8px', borderBottom: '2px solid var(--border)', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {brand.skus.map(sku => (
              <tr key={sku.product}>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', color: 'var(--text-1)' }}>{sku.product}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-1)' }}>{sku.yours}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                  {sku.promo ? (
                    <div>
                      <div style={{ textDecoration: 'line-through', color: 'var(--text-3)', fontSize: 10 }}>{sku.theirs} reg.</div>
                      <div style={{ color: 'var(--danger)', fontWeight: 700 }}>⚡ {sku.promo.sale} sale <span style={{ fontSize: 9, opacity: 0.7 }}>ends {sku.promo.ends}</span></div>
                    </div>
                  ) : (
                    <span style={{ color: sku.dir === 'negative' ? 'var(--danger)' : sku.dir === 'positive' ? 'var(--accent)' : 'var(--text-3)', fontWeight: 700 }}>{sku.theirs}</span>
                  )}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid var(--border)' }}>
                  {sku.promo ? (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(224,90,106,0.12)', color: 'var(--danger)' }}>{sku.promo.effectiveGap}</span>
                  ) : (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: sku.dir === 'negative' ? 'rgba(224,90,106,0.12)' : sku.dir === 'positive' ? 'rgba(9,161,161,0.10)' : 'var(--surface-3)', color: sku.dir === 'negative' ? 'var(--danger)' : sku.dir === 'positive' ? 'var(--accent)' : 'var(--text-3)' }}>{sku.gap}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 12px', marginTop: 4 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginBottom: 4 }}>30-day trend</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{brand.name} pricing at this rival has been stable for 28 days. The current price change was detected today and is new behavior.</div>
        </div>
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)', display: 'flex', gap: 8 }}>
        <button onClick={() => showToast(`Opening Price Intelligence — ${brand.name} view…`)} style={{ flex: 1, padding: '9px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}>View in price matrix →</button>
        {brand.hasAlert && (
          <button onClick={() => showToast('Price matched — Friendly Farms 3.5g updated to $42')} style={{ padding: '9px 14px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--danger)', background: 'transparent', color: 'var(--danger)' }}>Respond →</button>
        )}
      </div>
    </div>
  );
}

function GapCard({ badgeLabel, badgeColor, badgeBg, title, sub, items, dotColor }: { badgeLabel: string; badgeColor: string; badgeBg: string; title: string; sub: string; items: { name: string; detail: string }[]; dotColor: string }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 12, display: 'inline-block', marginBottom: 6, background: badgeBg, color: badgeColor }}>{badgeLabel}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub}</div>
      </div>
      <div style={{ padding: '8px 0' }}>
        {items.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{item.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{item.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
