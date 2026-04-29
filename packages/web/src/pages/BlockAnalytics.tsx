import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Data ───────────────────────────────────────────────────────────────────

type ViewKey = 'all' | 'stiiizy' | 'otc';

interface ViewData {
  roi: string; days: number; events: number; spent: string; advantage: string;
  title: string; sub: string;
  mDays: number; mDaysSub: string;
  mPrice: number; mPriceSub: string;
  mPromo: number; mPromSub: string;
  mContacts: number; mContactsSub: string;
  sideRoi: string; sideRoiSub: string;
  chartTitle: string; eventsSub: string;
  costRows: { k: string; v: string; type?: string }[];
}

const VIEWS: Record<ViewKey, ViewData> = {
  all: {
    roi: '4.7×', days: 69, events: 42, spent: '$4,306', advantage: '~$20K',
    title: 'Both blocks are delivering positive ROI',
    sub: "STIIIZY and Off The Charts have been blocked from CannaSpy for 47 and 22 days respectively. While blocked, you've captured 42 competitive intelligence events they couldn't see.",
    mDays: 69, mDaysSub: 'STIIIZY 47d + OTC 22d',
    mPrice: 31, mPriceSub: 'While rivals had no visibility into yours',
    mPromo: 8, mPromSub: 'Avg. 3 days advance notice per promo',
    mContacts: 0, mContactsSub: 'Zero outreach attempts made to either rival',
    sideRoi: '4.7×', sideRoiSub: '$20K estimated revenue advantage vs. $4,306 spent on blocks to date.',
    chartTitle: 'Cumulative Block Value vs. Cost', eventsSub: '42 events · click headers to sort',
    costRows: [
      { k: 'STIIIZY WeHo (47 days)', v: '$3,133' },
      { k: 'Off The Charts DTLA (22 days)', v: '$1,173' },
      { k: 'Total spent to date', v: '$4,306', type: 'total' },
      { k: 'Next auto-charge (May 1)', v: '$3,600' },
      { k: 'Est. revenue advantage', v: '~$20,000', type: 'teal' },
      { k: 'Net ROI to date', v: '+$15,694', type: 'teal' },
    ],
  },
  stiiizy: {
    roi: '5.7×', days: 47, events: 28, spent: '$3,133', advantage: '~$18K',
    title: 'STIIIZY block is delivering strong ROI',
    sub: "STIIIZY West Hollywood has been blocked from CannaSpy for 47 days. While blocked, you've captured 28 competitive intelligence events they couldn't see.",
    mDays: 47, mDaysSub: 'Since Mar 10, 2026',
    mPrice: 20, mPriceSub: 'Price moves detected before STIIIZY could respond',
    mPromo: 6, mPromSub: 'Flash sales and brand promotions',
    mContacts: 0, mContactsSub: 'Zero outreach by CannaSpy to STIIIZY',
    sideRoi: '5.7×', sideRoiSub: '$18K estimated revenue advantage vs. $3,133 spent to date.',
    chartTitle: 'STIIIZY Block: Value vs. Cost', eventsSub: '28 events · STIIIZY only',
    costRows: [
      { k: 'Days active', v: '47 days' },
      { k: 'Rate', v: '$2,000/mo (Elite)' },
      { k: 'Prorated first charge (Mar 10)', v: '$1,533' },
      { k: 'Auto-charge May 1', v: '$2,000' },
      { k: 'Total spent to date', v: '$3,133', type: 'total' },
      { k: 'Est. revenue advantage', v: '~$18,000', type: 'teal' },
    ],
  },
  otc: {
    roi: '3.2×', days: 22, events: 14, spent: '$1,173', advantage: '~$3.8K',
    title: 'Off The Charts block is building momentum',
    sub: 'Off The Charts DTLA has been blocked from CannaSpy for 22 days. The block is younger but already generating positive ROI through 14 captured intelligence events.',
    mDays: 22, mDaysSub: 'Since Apr 4, 2026',
    mPrice: 11, mPriceSub: 'Price moves detected while OTC was dark',
    mPromo: 2, mPromSub: 'Jeeter Brand Day and general promo',
    mContacts: 0, mContactsSub: 'Zero outreach by CannaSpy to OTC',
    sideRoi: '3.2×', sideRoiSub: '$3.8K estimated revenue advantage vs. $1,173 spent to date.',
    chartTitle: 'Off The Charts Block: Value vs. Cost', eventsSub: '14 events · OTC only',
    costRows: [
      { k: 'Days active', v: '22 days' },
      { k: 'Rate', v: '$1,600/mo (Elite)' },
      { k: 'Prorated first charge (Apr 4)', v: '$1,173' },
      { k: 'Auto-charge May 1', v: '$1,600' },
      { k: 'Total spent to date', v: '$1,173', type: 'total' },
      { k: 'Est. revenue advantage', v: '~$3,800', type: 'teal' },
    ],
  },
};

interface IntelEvent {
  date: string; rival: string; event: string;
  type: 'price' | 'promo' | 'sku'; response: 'Acted' | 'Held' | 'Pending'; impact: string;
}

const ALL_INTEL: IntelEvent[] = [
  { date: 'Apr 16', rival: 'STIIIZY', event: 'FF 3.5g dropped $42→$36 (Weekend Flash)', type: 'price', response: 'Held', impact: '+$2,400' },
  { date: 'Apr 14', rival: 'OTC', event: 'Jeeter Juice $40→$32 (Brand Day Sale)', type: 'promo', response: 'Acted', impact: '+$1,800' },
  { date: 'Apr 12', rival: 'STIIIZY', event: 'Jeeter XL dropped $38→$35 (permanent)', type: 'price', response: 'Pending', impact: 'TBD' },
  { date: 'Apr 10', rival: 'STIIIZY', event: 'Weekend Flash Sale launched — 6 SKUs', type: 'promo', response: 'Held', impact: '+$900' },
  { date: 'Apr 8', rival: 'OTC', event: 'Raw Garden 0.5g dropped $38→$36', type: 'price', response: 'Acted', impact: '+$620' },
  { date: 'Apr 5', rival: 'OTC', event: 'Kanha Gummies 200mg dropped $35→$32', type: 'price', response: 'Acted', impact: '+$480' },
  { date: 'Apr 2', rival: 'STIIIZY', event: 'Jeeter Baby 5-pack dropped $55→$52', type: 'price', response: 'Held', impact: '+$340' },
  { date: 'Mar 30', rival: 'STIIIZY', event: 'New SKU: STIIIZY Pod 0.5g Premium added', type: 'sku', response: 'Held', impact: 'Noted' },
  { date: 'Apr 6', rival: 'OTC', event: 'Raw Garden Live Badder dropped $65→$62', type: 'price', response: 'Acted', impact: '+$390' },
  { date: 'Mar 25', rival: 'STIIIZY', event: 'Kanha 200mg dropped $35→$32', type: 'price', response: 'Acted', impact: '+$560' },
  { date: 'Mar 22', rival: 'STIIIZY', event: 'Weekend Flash ended — prices reverted', type: 'price', response: 'Held', impact: 'N/A' },
  { date: 'Mar 18', rival: 'STIIIZY', event: 'Happy Hour 4-7PM launched on FF Vapes', type: 'promo', response: 'Pending', impact: 'TBD' },
  { date: 'Mar 15', rival: 'STIIIZY', event: '5 new SKUs added across Indica Flower', type: 'sku', response: 'Held', impact: 'Noted' },
  { date: 'Mar 12', rival: 'STIIIZY', event: 'Weekend Flash Sale launched — 8 SKUs', type: 'promo', response: 'Held', impact: '+$1,100' },
];

const SUPPRESS_BARS = [
  { name: 'STIIIZY WeHo', days: 47, max: 70, color: '#D396A6', status: 'active' },
  { name: 'Off The Charts DTLA', days: 22, max: 70, color: '#5484A4', status: 'active' },
  { name: 'Jungle Boys', days: 63, max: 70, color: '#d4900a', status: 'blocking-you' },
  { name: 'Harborside SJ', days: 31, max: 70, color: '#d4900a', status: 'blocking-you' },
  { name: 'Cookies SF', days: 8, max: 70, color: '#d4900a', status: 'blocking-you' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BlockAnalytics() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewKey>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState(1);
  const [events, setEvents] = useState<IntelEvent[]>(ALL_INTEL);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const v = VIEWS[view];

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  useEffect(() => {
    const filtered = view === 'all' ? ALL_INTEL
      : view === 'stiiizy' ? ALL_INTEL.filter(e => e.rival === 'STIIIZY')
      : ALL_INTEL.filter(e => e.rival === 'OTC');
    setEvents(filtered);
    setSortCol(null);
  }, [view]);

  function handleSort(col: number) {
    const dir = sortCol === col ? -sortDir : 1;
    setSortCol(col);
    setSortDir(dir);
    const cols: (keyof IntelEvent)[] = ['date', 'rival', 'event', 'type', 'response', 'impact'];
    const key = cols[col];
    setEvents(prev => [...prev].sort((a, b) => {
      const va = a[key] as string;
      const vb = b[key] as string;
      return va.localeCompare(vb) * dir;
    }));
  }

  // Build SVG chart inline
  function buildChart() {
    const datasets: Record<ViewKey, { days: number; dailyCost: number; dailyValue: number }> = {
      all: { days: 47, dailyCost: 120, dailyValue: 430 },
      stiiizy: { days: 47, dailyCost: 67, dailyValue: 383 },
      otc: { days: 22, dailyCost: 53, dailyValue: 172 },
    };
    const d = datasets[view];
    const W = 560, H = 140;
    const PAD = { t: 12, r: 20, b: 28, l: 48 };

    function jitter(seed: number) {
      const x = Math.sin((seed + 1) * 9301 + (view.length * 49297)) * 233280;
      return 0.9 + ((x - Math.floor(x)) * 0.2);
    }

    const valuePts: [number, number][] = [];
    const costPts: [number, number][] = [];
    for (let i = 0; i <= d.days; i++) {
      valuePts.push([i, Math.round(i * d.dailyValue * jitter(i))]);
      costPts.push([i, Math.round(i * d.dailyCost)]);
    }
    const maxY = Math.max(...valuePts.map(p => p[1]), ...costPts.map(p => p[1])) * 1.1 || 1000;

    function px(day: number) { return PAD.l + (day / d.days) * (W - PAD.l - PAD.r); }
    function py(val: number) { return PAD.t + (1 - val / maxY) * (H - PAD.t - PAD.b); }
    function makePath(pts: [number, number][]) {
      return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p[0]).toFixed(1)} ${py(p[1]).toFixed(1)}`).join('');
    }

    const lines: string[] = [];
    for (let g = 0; g <= 4; g++) {
      const gv = Math.round(maxY * g / 4);
      const gy = py(gv).toFixed(1);
      lines.push(`<line x1="${PAD.l}" y1="${gy}" x2="${W - PAD.r}" y2="${gy}" stroke="currentColor" stroke-opacity="0.06" stroke-width="1"/>`);
      lines.push(`<text x="${PAD.l - 4}" y="${+gy + 3}" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="8" fill="currentColor" fill-opacity="0.4">$${gv >= 1000 ? (gv / 1000).toFixed(0) + 'K' : gv}</text>`);
    }

    const labelDays = [0, Math.round(d.days / 3), Math.round(d.days * 2 / 3), d.days];
    labelDays.forEach(ld => {
      lines.push(`<text x="${px(ld).toFixed(1)}" y="${H - PAD.b + 14}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="8" fill="currentColor" fill-opacity="0.4">Day ${ld}</text>`);
    });

    const areaPath = makePath(valuePts) + ` L${px(d.days)} ${H - PAD.b} L${PAD.l} ${H - PAD.b} Z`;
    lines.push(`<path d="${areaPath}" fill="rgba(9,161,161,0.07)" stroke="none"/>`);
    lines.push(`<path d="${makePath(valuePts)}" fill="none" stroke="var(--accent)" stroke-width="2"/>`);
    lines.push(`<path d="${makePath(costPts)}" fill="none" stroke="var(--rose)" stroke-width="1.5" stroke-dasharray="4 2"/>`);

    return { W, H, html: lines.join('') };
  }

  const chart = buildChart();

  const typePillStyle = (type: string): React.CSSProperties => {
    if (type === 'price') return { background: 'var(--danger-soft)', color: 'var(--danger)' };
    if (type === 'promo') return { background: 'rgba(212,144,10,0.12)', color: 'var(--warm)' };
    return { background: 'var(--accent-soft)', color: 'var(--accent)' };
  };
  const typeLabel = (type: string) => type === 'sku' ? 'New SKU' : type.charAt(0).toUpperCase() + type.slice(1);

  const respStyle = (r: string): React.CSSProperties => {
    if (r === 'Acted') return { background: 'rgba(9,161,161,0.1)', color: 'var(--accent)' };
    if (r === 'Pending') return { background: 'rgba(212,144,10,0.12)', color: 'var(--warm)' };
    return { background: 'var(--surface-3)', color: 'var(--text-3)' };
  };

  const colHeaders = ['Date', 'Rival', 'Event', 'Type', 'Response', 'Est. Impact'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', color: 'var(--text-1)', fontSize: 14, overflow: 'hidden' }}>

      {/* TOPBAR */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <button onClick={() => navigate('/blocks')} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          Block Management
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--border-2)' }} />
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Block Analytics</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>ROI &amp; BLOCK PERFORMANCE REPORT</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => showToast('Exporting block analytics report…')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export report
          </button>
          <button onClick={() => showToast('Navigate to Manage Renewals')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
            Manage renewals
          </button>
        </div>
      </div>

      {/* BLOCK SELECTOR TABS */}
      <div style={{ display: 'flex', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', padding: '0 24px', flexShrink: 0 }}>
        {([
          { key: 'all' as ViewKey, label: 'All Blocks Combined', badge: '2 active', isAll: true },
          { key: 'stiiizy' as ViewKey, label: 'STIIIZY WeHo', badge: '47 days' },
          { key: 'otc' as ViewKey, label: 'Off The Charts DTLA', badge: '22 days' },
        ]).map(tab => {
          const active = view === tab.key;
          return (
            <div key={tab.key} onClick={() => setView(tab.key)} style={{ padding: '11px 18px', fontSize: 12, fontWeight: 600, color: active ? (tab.isAll ? 'var(--accent)' : 'var(--rose)') : 'var(--text-3)', cursor: 'pointer', borderBottom: active ? `2px solid ${tab.isAll ? 'var(--accent)' : 'var(--rose)'}` : '2px solid transparent', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? (tab.isAll ? 'var(--accent)' : 'var(--rose)') : 'var(--border-2)', flexShrink: 0 }} />
              {tab.label}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8, background: active ? (tab.isAll ? 'var(--accent-soft)' : 'var(--rose-soft)') : 'var(--surface-3)', color: active ? (tab.isAll ? 'var(--accent)' : 'var(--rose)') : 'var(--text-3)' }}>{tab.badge}</span>
            </div>
          );
        })}
      </div>

      {/* MAIN SCROLL */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* ROI HERO */}
        <div style={{ background: 'linear-gradient(135deg,rgba(9,161,161,0.08),rgba(9,161,161,0.02))', border: '1.5px solid rgba(9,161,161,0.2)', borderRadius: 'var(--r)', padding: '22px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 56, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.02em' }}>{v.roi}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)', marginTop: 3 }}>Block ROI</div>
          </div>
          <div style={{ width: 1, height: 70, background: 'var(--border-2)', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 24, flex: 1, flexWrap: 'wrap' }}>
            {[
              { val: v.days, label: 'Total days blocked' },
              { val: v.events, label: 'Intel events captured' },
              { val: v.spent, label: 'Total spent to date' },
              { val: v.advantage, label: 'Est. revenue advantage', color: 'var(--accent)' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: s.color || 'var(--text-1)', lineHeight: 1, marginBottom: 3 }}>{s.val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ width: 1, height: 70, background: 'var(--border-2)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{v.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>{v.sub}</div>
          </div>
        </div>

        {/* METRIC GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Block days', val: v.mDays, color: 'var(--rose)', sub: v.mDaysSub, trend: '▲ +1 per day', trendColor: 'var(--accent)' },
            { label: 'Price changes detected', val: v.mPrice, color: 'var(--accent)', sub: v.mPriceSub, trend: '▲ 3 this week', trendColor: 'var(--accent)' },
            { label: 'Promo launches detected', val: v.mPromo, color: 'var(--warm)', sub: v.mPromSub, trend: '▲ 1 active now', trendColor: 'var(--accent)' },
            { label: 'Sales contacts blocked', val: v.mContacts, color: 'var(--rose)', sub: v.mContactsSub, trend: '▬ As expected', trendColor: 'var(--text-3)' },
          ].map((m, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, lineHeight: 1, marginBottom: 3, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.4 }}>{m.sub}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9, color: m.trendColor }}>{m.trend}</div>
            </div>
          ))}
        </div>

        {/* TWO COL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

          {/* MAIN COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* BLOCK DURATION BARS */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Block Duration</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Days blocked · all rivals</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {SUPPRESS_BARS.map((bar, i) => {
                  const isYou = bar.status === 'active';
                  const pct = Math.round(bar.days / bar.max * 100);
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < SUPPRESS_BARS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: isYou ? 'var(--rose)' : 'var(--warm)', width: 130, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bar.name}</div>
                      <div style={{ flex: 1, height: 10, background: 'var(--surface-3)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: 10, borderRadius: 5, position: 'absolute', left: 0, top: 0, width: `${pct}%`, background: bar.color, opacity: 0.7 }} />
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, width: 36, textAlign: 'right', color: bar.color }}>{bar.days}d</div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: isYou ? 'var(--rose-soft)' : 'rgba(212,144,10,0.12)', color: isYou ? 'var(--rose)' : 'var(--warm)', flexShrink: 0 }}>{isYou ? 'blocked' : 'blocking you'}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* VALUE CHART */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{v.chartTitle}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Since block placed · estimated</span>
              </div>
              <div style={{ padding: '16px 16px 8px' }}>
                <svg viewBox={`0 0 ${chart.W} ${chart.H}`} preserveAspectRatio="none" width="100%" height={chart.H} dangerouslySetInnerHTML={{ __html: chart.html }} />
              </div>
              <div style={{ display: 'flex', gap: 14, padding: '0 16px 12px', flexWrap: 'wrap' }}>
                {[
                  { color: 'var(--accent)', label: 'Est. revenue advantage' },
                  { color: 'var(--rose)', label: 'Cumulative block cost' },
                  { color: 'var(--border-2)', label: 'Break-even line', dashed: true },
                ].map((leg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-3)' }}>
                    <div style={{ width: 14, height: 3, borderRadius: 2, background: leg.color, borderTop: leg.dashed ? '1px dashed var(--text-3)' : undefined }} />
                    {leg.label}
                  </div>
                ))}
              </div>
            </div>

            {/* INTEL EVENTS TABLE */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Intelligence Events While Rivals Were Blocked</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>{v.eventsSub}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {colHeaders.map((h, i) => (
                      <th key={i} onClick={() => handleSort(i)} style={{ padding: '7px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {h}{sortCol === i ? (sortDir === 1 ? ' ▲' : ' ▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => {
                    const isPos = ev.impact.startsWith('+');
                    return (
                      <tr key={i} style={{ cursor: 'default' }}>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{ev.date}</td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, color: 'var(--rose)' }}>{ev.rival}</td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-1)' }}>{ev.event}</td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 6px', borderRadius: 3, ...typePillStyle(ev.type) }}>{typeLabel(ev.type)}</span>
                        </td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, ...respStyle(ev.response) }}>{ev.response}</span>
                        </td>
                        <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: isPos ? 'var(--accent)' : 'var(--text-3)' }}>{ev.impact}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SIDE COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* ROI stat */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Combined ROI</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, lineHeight: 1, color: 'var(--accent)' }}>{v.sideRoi}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>{v.sideRoiSub}</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Monthly block spend</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, lineHeight: 1, color: 'var(--rose)' }}>$3,600</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>$2,000 STIIIZY + $1,600 OTC. Both auto-renew May 1.</div>
            </div>

            {/* Response stats */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Avg. response lead time</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, lineHeight: 1, color: 'var(--accent)' }}>2.4 hrs</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>Average time between CannaSpy detecting a competitor move and you responding. Rivals had no equivalent capability.</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Acted on intel events</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>5 / 42</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>5 events triggered a pricing or promo response. Remaining 37 were monitored — no action needed.</div>
            </div>

            {/* Cost breakdown */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Block cost breakdown</span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                {v.costRows.map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < v.costRows.length - 1 ? '1px solid var(--border)' : 'none', fontWeight: row.type === 'total' ? 700 : 400, fontSize: row.type === 'total' ? 13 : 12 }}>
                    <div style={{ color: 'var(--text-2)' }}>{row.k}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: row.type === 'teal' ? 'var(--accent)' : 'var(--text-1)' }}>{row.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Single block actions (when not 'all') */}
            {view !== 'all' && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
                <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Block actions</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 12 }}>This block auto-renews on the 1st of each month. To cancel, return to Block Management — cancellation is immediate and any prorated remainder is forfeited.</div>
                  <button onClick={() => { showToast('Opening Block Management to confirm cancellation…'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', borderRadius: 'var(--r-sm)', fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', border: '1.5px solid rgba(211,150,166,0.35)', color: 'var(--rose)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>
                    <span>Cancel this block</span>
                  </button>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 8, textAlign: 'center', letterSpacing: '0.04em' }}>Cancel flow is on Block Management</div>
                </div>
              </div>
            )}

            {/* Rivals blocking you */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--warm)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(212,144,10,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--warm)' }}>Rivals blocking you</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Active blocks on your account</span>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 10, lineHeight: 1.5 }}>3 rivals currently hold active blocks on your account. You cannot see their CannaSpy data — and they're paying to keep it that way.</div>
                {[{ name: 'Jungle Boys', days: '63 days' }, { name: 'Harborside SJ', days: '31 days' }, { name: 'Cookies SF', days: '8 days' }].map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warm)' }}>{r.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warm)', fontWeight: 700 }}>{r.days}</span>
                  </div>
                ))}
              </div>
            </div>

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
