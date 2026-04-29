import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-1)' },
  topbar: { padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' },
  scroll: { flex: 1, overflowY: 'auto', padding: '16px 20px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' },
  sep: { width: 1, height: 16, background: 'var(--border-2)' },
  title: { fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' },
  actions: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 },
  btn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' },
};

export default function AlertDetail() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const modalContent: Record<string, { title: string; body: string }> = {
    hold: { title: 'Confirm: Hold Price', body: "You've chosen to hold your price. CannaSpy will re-alert Monday if STIIIZY doesn't revert." },
    match: { title: 'Confirm: Match Weekend', body: 'Set Friendly Farms 3.5g to $36 Friday through Sunday, restoring $50 on Monday.' },
    undercut: { title: 'Confirm: Undercut at $34', body: 'Set Friendly Farms 3.5g to $34 Friday through Sunday. This undercuts STIIIZY by $2.' },
    promo: { title: 'Confirm: Bundle Promo', body: 'Create a Buy 2 Get 1 on Friendly Farms this weekend while holding your $50 unit price.' },
  };

  const handleRespond = () => {
    if (!selectedOption) { showToast('Select a response option below first'); return; }
    setShowModal(true);
  };

  const cardBase: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', padding: '16px 20px', marginBottom: 16 };

  return (
    <div style={s.root}>
      {/* TOPBAR */}
      <div style={s.topbar}>
        <div style={s.backBtn} onClick={() => navigate(-1)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Alert Feed
        </div>
        <div style={s.sep} />
        <div style={s.title}>Alert Detail</div>
        <div style={s.actions}>
          <button style={s.btn} onClick={() => showToast('Alert marked as reviewed')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Mark reviewed
          </button>
          <button style={s.btn} onClick={() => navigate('/price-deep-dive')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Price deep dive
          </button>
          <button style={s.btnPrimary} onClick={handleRespond}>
            Respond to this
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* SCROLL CONTENT */}
      <div style={s.scroll}>

        {/* ALERT HERO */}
        <div style={{ ...cardBase, borderLeft: '4px solid var(--danger)', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>WEST HOLLYWOOD FLAGSHIP</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span>STIIIZY West Hollywood</span>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, background: 'rgba(224,90,106,0.08)', color: 'var(--danger)' }}>Price Drop</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.25 }}>STIIIZY dropped Friendly Farms 3.5g from $42 to $36</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>They're now <strong style={{ color: 'var(--danger)' }}>$14 below your price</strong> on a shared SKU that moves volume — this is a competitive pricing event you should respond to.</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Rival', val: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', display: 'inline-block' }} />STIIIZY West Hollywood</span> },
              { label: 'Status', val: <span style={{ color: 'var(--rose)' }}>● Blocked by you</span> },
              { label: 'Distance', val: '1.2 mi away' },
              { label: 'Detected', val: 'Today, 6:18 AM' },
              { label: 'Duration', val: 'Weekend Flash Sale' },
              { label: 'Ends', val: <span style={{ color: 'var(--warm)' }}>Sunday Apr 20</span> },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PRICE DELTA */}
        <div style={cardBase}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Price Movement</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 16 }}>Friendly Farms 3.5g Flower · Indica</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '14px 24px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>Previous Price</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700, color: 'var(--text-3)', textDecoration: 'line-through' }}>$42</div>
            </div>
            <div style={{ fontSize: 24, color: 'var(--text-3)' }}>→</div>
            <div style={{ textAlign: 'center', padding: '14px 24px', borderRadius: 'var(--r-sm)', background: 'rgba(9,161,161,0.05)', border: '1px solid rgba(9,161,161,0.3)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 6 }}>New Price</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>$36</div>
            </div>
            <div style={{ width: 1, height: 60, background: 'var(--border-2)', margin: '0 4px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>−$6</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>−14.3%</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>vs. your $50 = <span style={{ color: 'var(--danger)', fontWeight: 700 }}>$14 gap</span></div>
            </div>
            <div style={{ textAlign: 'center', padding: '14px 24px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid rgba(84,132,164,0.2)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 6 }}>Your Price</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--slate)' }}>$50</div>
            </div>
          </div>
          <div style={{ background: 'rgba(212,144,10,0.07)', border: '1px solid rgba(212,144,10,0.2)', borderRadius: 'var(--r-sm)', padding: '12px 16px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 5 }}>Active Promotion</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Weekend Flash Sale — "Flash Deals This Weekend Only"</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>Sale pricing active Apr 18–20 · Applies to all Friendly Farms SKUs at this location · Pattern: STIIIZY runs this promotion approximately every 3–4 weeks</div>
          </div>
        </div>

        {/* CONTEXT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {[
            {
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
              title: '90-Day Price Context',
              rows: [
                ['STIIIZY standard price', '$42', ''],
                ['STIIIZY flash low', '$36', 'alert'],
                ['Previous flash sales', '3 in 90 days', ''],
                ['Avg flash duration', '3 days', ''],
                ['Market low (all rivals)', '$36 (STIIIZY)', 'alert'],
                ['Market high (all rivals)', '$50 (MedMen, OTC)', ''],
                ['Your position', 'Market high ($50)', 'danger'],
              ],
            },
            {
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
              title: 'Location Context',
              rows: [
                ['STIIIZY distance', '1.2 mi', ''],
                ['Shared brands (this SKU)', 'STIIIZY, MedMen, OTC', ''],
                ['Other rivals at this price', 'None', ''],
                ['STIIIZY block age', '47 days', 'highlight'],
                ['STIIIZY block renews', 'May 15', ''],
                ['Flash pattern risk', 'Medium — 3-day window', 'warm'],
              ],
            },
          ].map(({ icon, title, rows }) => (
            <div key={title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>{icon}{title}</div>
              {rows.map(([k, v, type]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-3)' }}>{k}</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--mono)', fontSize: 11, color: type === 'alert' ? 'var(--danger)' : type === 'highlight' ? 'var(--accent)' : type === 'danger' ? 'var(--danger)' : type === 'warm' ? 'var(--warm)' : 'var(--text-1)' }}>{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* RESPONSE OPTIONS */}
        <div style={{ ...cardBase, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>How do you want to respond?</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { key: 'hold', icon: '⏸', title: 'Hold price', sub: "STIIIZY reverts in ~3 days. Wait it out — don't let a flash sale drag your margin down permanently." },
              { key: 'match', icon: '🎯', title: 'Match for the weekend', sub: 'Set a temporary promo ($36 Fri–Sun) to protect volume, then restore Monday. Est. impact: −$56 weekend revenue.' },
              { key: 'undercut', icon: '⚡', title: 'Undercut at $34', sub: "Go below STIIIZY's flash price. High aggression — only if this SKU is a weekend traffic driver for you." },
              { key: 'promo', icon: '🎁', title: 'Bundle promo instead', sub: 'Keep your price but add a buy-2-get-1-free on FF. Protects margin while offering value.' },
            ].map(({ key, icon, title, sub }) => (
              <div
                key={key}
                onClick={() => setSelectedOption(key)}
                style={{ flex: 1, minWidth: 160, padding: '12px 14px', borderRadius: 'var(--r-sm)', border: `1.5px solid ${selectedOption === key ? 'var(--accent)' : 'var(--border-2)'}`, background: selectedOption === key ? 'var(--accent-soft)' : 'var(--surface-2)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RELATED ALERTS */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          Related alerts from STIIIZY
          <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        {[
          { dot: 'var(--danger)', text: 'STIIIZY dropped Jeeter XL Pre-Roll from $38 to $35 — $3 below your price', time: '2h ago' },
          { dot: 'var(--warm)', text: 'STIIIZY started Weekend Flash promotion — affects 6 shared SKUs', time: '6h ago' },
          { dot: 'var(--accent)', text: 'STIIIZY ran identical flash sale on Mar 28 — lasted 3 days, reverted Apr 1', time: 'Mar 28' },
        ].map(({ dot, text, time }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', marginBottom: 5, cursor: 'pointer' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <div style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{text}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{time}</div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && selectedOption && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 800, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 801, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: '28px 32px', width: 480, maxWidth: '90vw' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{modalContent[selectedOption].title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>{modalContent[selectedOption].body}</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={s.btn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btnPrimary} onClick={() => { setShowModal(false); showToast("Response logged — you'll be re-alerted Monday if needed"); }}>Confirm</button>
            </div>
          </div>
        </>
      )}

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
