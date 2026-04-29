import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PromoDeepDive() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

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
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' };
  const cardHeader: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 };
  const thStyle: React.CSSProperties = { padding: '7px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' };
  const tdStyle: React.CSSProperties = { padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, verticalAlign: 'middle' };

  return (
    <div style={root}>
      {/* TOPBAR */}
      <div style={topbar}>
        <div style={backBtn} onClick={() => navigate(-1)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Promotions Tracker
        </div>
        <div style={sep} />
        <div style={backBtn} onClick={() => navigate('/alerts')}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Alert Feed
        </div>
        <div style={sep} />
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>Promo Deep Dive</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn} onClick={() => showToast('Exporting promo analysis…')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button style={btnPrimary} onClick={() => showToast('Setting promo counter-alert for MedMen Happy Hour…')}>
            Set counter-alert
          </button>
        </div>
      </div>

      <div style={scroll}>
        {/* PROMO HERO */}
        <div style={{ background: 'var(--surface)', border: '1px solid rgba(212,144,10,0.25)', borderLeft: '4px solid var(--warm)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 5 }}>Active Promotion · Recurring · Detected Jan 20, 2026</div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 3 }}>MedMen WeHo: Happy Hour 4–7PM — 20% off Friendly Farms Vapes</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Runs <strong>daily, 4:00–7:00 PM</strong> · Affects <strong>3 shared SKUs</strong> you carry · Reduces MedMen's effective price from $55 to <strong style={{ color: 'var(--accent)' }}>$44</strong> during peak evening hours</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Recurring', bg: 'var(--warm-soft)', color: 'var(--warm)' },
              { label: 'Tracking rival', bg: 'var(--accent-soft)', color: 'var(--accent)' },
              { label: '3 shared SKUs undercut', bg: 'var(--danger-soft)', color: 'var(--danger)' },
              { label: '0.8 mi away', bg: 'rgba(84,132,164,0.1)', color: 'var(--slate)' },
            ].map(({ label, bg, color }) => (
              <span key={label} style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px', borderRadius: 10, background: bg, color }}>{label}</span>
            ))}
          </div>
        </div>

        {/* TWO-COL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start', marginBottom: 16 }}>
          {/* MAIN COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* PROMO DETAILS */}
            <div style={card}>
              <div style={cardHeader}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Promotion Details</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>MedMen West Hollywood</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '14px 16px' }}>
                {[
                  { label: 'Type', val: 'Happy Hour', sub: 'Time-limited daily window' },
                  { label: 'Schedule', val: 'Daily 4–7 PM', sub: '3 hours / day, 7 days' },
                  { label: 'Discount', val: '20% off', sub: 'Applies to all FF Vapes', color: 'var(--accent)' },
                  { label: 'Category', val: 'Friendly Farms Vapes', sub: 'Brand-specific' },
                  { label: 'First detected', val: 'Jan 20, 2026', sub: '87 days ago — ongoing' },
                  { label: 'Status', val: '● Active now', sub: 'Confirmed this morning', color: 'var(--warm)' },
                ].map(({ label, val, sub, color }) => (
                  <div key={label} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: color || 'var(--text-1)' }}>{val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AFFECTED SKUS */}
            <div style={card}>
              <div style={cardHeader}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h6"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Affected SKUs — Shared with You</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Your price vs. MedMen during happy hour</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['SKU', 'MedMen Standard', 'MedMen HH Price', 'Your Price', 'HH Gap'].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Friendly Farms 1g Vape', brand: 'FF · Vapes · 1g', std: '$55', hh: '$44', yours: '$55', gap: '−$11 (you higher)' },
                    { name: 'Friendly Farms 0.5g Vape', brand: 'FF · Vapes · 0.5g', std: '$35', hh: '$28', yours: '$35', gap: '−$7 (you higher)' },
                    { name: 'Friendly Farms Cart 2-Pack', brand: 'FF · Vapes · Bundle', std: '$95', hh: '$76', yours: '$95', gap: '−$19 (you higher)' },
                  ].map(({ name, brand, std, hh, yours, gap }) => (
                    <tr key={name}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{brand}</div>
                      </td>
                      <td style={tdStyle}><span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', textDecoration: 'line-through' }}>{std}</span></td>
                      <td style={tdStyle}><span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{hh}</span></td>
                      <td style={tdStyle}><span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--slate)' }}>{yours}</span></td>
                      <td style={tdStyle}><span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)' }}>{gap}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PROMO HISTORY */}
            <div style={card}>
              <div style={cardHeader}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Promo History at MedMen WeHo</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Last 90 days</span>
              </div>
              <div style={{ padding: '10px 16px' }}>
                {[
                  { date: 'Jan 20', type: 'Recurring', flash: false, desc: 'Happy Hour 4–7PM launched (20% FF Vapes)', dur: 'Ongoing' },
                  { date: 'Mar 8', type: 'Flash', flash: true, desc: "St. Patrick's Day: 25% off all green-packaged SKUs", dur: '3 days' },
                  { date: 'Apr 1', type: 'Flash', flash: true, desc: 'April Brand Day: Double points + 15% off Kanha edibles', dur: '1 day' },
                  { date: 'Apr 15', type: 'Recurring', flash: false, desc: '4/20 Week: Happy Hour extended to 3–8 PM for one week', dur: '7 days' },
                ].map(({ date, type, flash, desc, dur }) => (
                  <div key={date} style={{ display: 'grid', gridTemplateColumns: '60px 80px 1fr 60px', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{date}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, background: flash ? 'var(--danger-soft)' : 'var(--warm-soft)', color: flash ? 'var(--danger)' : 'var(--warm)' }}>{type}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', textAlign: 'right' }}>{dur}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SIDE COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Daily exposure window</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--warm)' }}>3 hrs</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>Every day 4–7 PM, MedMen undercuts you on 3 shared vape SKUs. Peak foot traffic hour.</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Running for</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700 }}>87 days</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>This is an established promo strategy, not a one-time event. Treat as permanent pricing.</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Largest gap (HH)</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>$19</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>FF Cart 2-Pack: MedMen charges $76, you charge $95 during their happy hour.</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Distance to rival</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700 }}>0.8 mi</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>Close enough that customers comparison-shop before driving. This gap matters.</div>
            </div>
          </div>
        </div>

        {/* COUNTER-PROMO GRID */}
        <div style={{ background: 'linear-gradient(135deg,rgba(212,144,10,0.08) 0%,rgba(212,144,10,0.03) 100%)', border: '2px solid rgba(212,144,10,0.35)', borderRadius: 'var(--r)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(212,144,10,0.15)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(212,144,10,0.25)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 2 }}>Your Move</div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>Counter-Promo Options</div>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>Select a strategy to log it</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {[
              {
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                title: 'Match with your own happy hour',
                sub: '3:30–7:30 PM daily. Start 30 min earlier, end 30 min later — you own the window.',
                toast: 'Opening counter-promo setup for daily 3:30–7:30 PM window…',
                color: 'var(--warm)',
              },
              {
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>,
                title: 'Bundle instead of discount',
                sub: 'Buy 2 get 1 on FF Vapes at your standard price. Protects margin, provides value.',
                toast: 'Logging bundle-instead strategy…',
                color: 'var(--warm)',
              },
              {
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                title: 'Loyalty points on FF Vapes',
                sub: '2× points during 4–8 PM. Locks in repeat customers without a public price cut.',
                toast: 'Setting reward points promo on FF Vapes…',
                color: 'var(--warm)',
              },
              {
                icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></svg>,
                title: 'Hold — different customer',
                sub: "MedMen serves a different demographic. Your regulars aren't price-shopping against them.",
                toast: 'Logging hold-price decision…',
                color: 'var(--slate)',
              },
            ].map(({ icon, title, sub, toast: t, color }) => (
              <div
                key={title}
                onClick={() => showToast(t)}
                style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', border: '1.5px solid rgba(212,144,10,0.2)', background: 'var(--surface)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--warm)', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}
