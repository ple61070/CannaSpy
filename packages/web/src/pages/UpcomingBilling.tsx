import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type BlockKey = 'stiiizy' | 'otc';

interface BlockData {
  name: string;
  shortName: string;
  days: number;
  daysLeft: number;
  changes: number;
  cost: number;
  spent: number;
  roi: string;
}

const BLOCKS: Record<BlockKey, BlockData> = {
  stiiizy: { name: 'STIIIZY West Hollywood', shortName: 'STIIIZY', days: 47, daysLeft: 15, changes: 28, cost: 2000, spent: 3133, roi: '5.7×' },
  otc: { name: 'Off The Charts DTLA', shortName: 'Off The Charts', days: 22, daysLeft: 15, changes: 14, cost: 1600, spent: 1173, roi: '3.2×' },
};

export default function UpcomingBilling() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [activeBlock, setActiveBlock] = useState<BlockKey>('stiiizy');
  const [decision, setDecision] = useState<'renew' | 'cancel' | null>(null);
  const [showModal, setShowModal] = useState(false);

  const b = BLOCKS[activeBlock];

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
  const btnAccent: React.CSSProperties = { ...btn, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' };
  const btnDanger: React.CSSProperties = { ...btn, border: '1.5px solid rgba(224,90,106,0.4)', color: 'var(--danger)', background: 'var(--surface-3)' };
  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' };
  const cardHeader: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 };

  const handleDecisionClick = (type: 'renew' | 'cancel') => {
    setDecision(type);
    if (type === 'renew') showToast('Block will auto-renew May 1 — no action needed');
  };

  const handleConfirmCancel = () => {
    if (decision !== 'cancel') { showToast('Block auto-renews May 1 — no action needed'); return; }
    setShowModal(true);
  };

  return (
    <div style={root}>
      {/* TOPBAR */}
      <div style={topbar}>
        <div style={backBtn} onClick={() => navigate(-1)}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Block Management
        </div>
        <div style={sep} />
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>Upcoming Billing Preview</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button style={btn}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            View analytics
          </button>
          <button style={btnAccent} onClick={() => showToast('Both blocks will auto-renew May 1 — no action needed')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Looks good — no changes
          </button>
        </div>
      </div>

      <div style={scroll}>
        {/* BLOCK SELECTOR TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(Object.entries(BLOCKS) as [BlockKey, BlockData][]).map(([key, data]) => (
            <div
              key={key}
              onClick={() => { setActiveBlock(key); setDecision(null); }}
              style={{ padding: '8px 16px', borderRadius: 20, fontSize: 11, fontWeight: 600, border: `1.5px solid ${activeBlock === key ? 'var(--rose)' : 'var(--border-2)'}`, background: activeBlock === key ? 'var(--rose-soft)' : 'var(--surface)', color: activeBlock === key ? 'var(--rose)' : 'var(--text-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
              {key === 'stiiizy' ? 'STIIIZY WeHo' : 'Off The Charts DTLA'}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, background: activeBlock === key ? 'rgba(211,150,166,0.25)' : 'var(--rose-soft)', color: 'var(--rose)', padding: '1px 5px', borderRadius: 8, fontWeight: 700 }}>
                ${data.cost.toLocaleString()} · May 1
              </span>
            </div>
          ))}
        </div>

        {/* BILLING PREVIEW BANNER */}
        <div style={{ borderRadius: 'var(--r)', padding: '18px 22px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 16, border: '2px solid rgba(212,144,10,0.28)', borderLeft: '5px solid var(--warm)', background: 'rgba(212,144,10,0.06)' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(212,144,10,0.10)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--warm)', marginBottom: 4 }}>Auto-renews May 1 — {b.daysLeft} days from now</div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 4 }}>{b.name} auto-renews May 1 — ${b.cost.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>This block has been active for <strong>{b.days} days</strong> and will automatically continue on May 1. No action is needed to keep it running. If you want to cancel, do so before May 1 — the block stays active through Apr 30 at no additional charge.</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button style={{ ...btn, opacity: 0.6, pointerEvents: 'none' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Auto-renews May 1 — no action needed
              </button>
              <button style={btnDanger} onClick={() => { handleDecisionClick('cancel'); setShowModal(true); }}>Cancel before Apr 30</button>
              <button style={{ ...btn, marginLeft: 4 }}>See block ROI →</button>
            </div>
          </div>
        </div>

        {/* COUNTDOWN BOXES */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {[
            { num: b.days, label: 'Days active', color: 'var(--accent)' },
            { num: b.changes, label: 'Intel events captured', color: 'var(--accent)' },
            { num: `$${b.cost.toLocaleString()}`, label: 'Monthly auto-charge', color: 'var(--rose)' },
            { num: `$${b.spent.toLocaleString()}`, label: 'Spent to date', color: 'var(--accent)' },
            { num: 'May 1', label: 'Next auto-charge', color: 'var(--accent)', highlighted: true },
          ].map(({ num, label, color, highlighted }) => (
            <div key={label} style={{ flex: 1, background: highlighted ? 'rgba(9,161,161,0.04)' : 'var(--surface)', border: highlighted ? '1.5px solid rgba(9,161,161,0.2)' : '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: typeof num === 'string' && num === 'May 1' ? 22 : 32, fontWeight: 700, lineHeight: 1, marginBottom: 3, color }}>{num}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* TWO-COL */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start' }}>
          {/* MAIN COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* WHAT YOUR BLOCK PROTECTS */}
            <div style={card}>
              <div style={cardHeader}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>What your {b.shortName} block protects</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>{b.days} days active</span>
              </div>
              {[
                { icon: '🔒', label: `${b.shortName} can't access CannaSpy`, sub: 'They have no visibility into your pricing, promos, or inventory changes', val: 'Active', color: 'var(--accent)' },
                { icon: '📈', label: `${b.changes} competitor changes you knew about first`, sub: 'Price moves, new SKUs, promo launches — all detected while they were in the dark', val: `+${b.changes} alerts`, color: 'var(--accent)' },
                { icon: '🎯', label: `No CannaSpy outreach to ${b.shortName}`, sub: `Our sales team has made zero contact attempts since block was placed Apr 1`, val: '0 contacts', color: 'var(--accent)' },
                { icon: '💰', label: 'Estimated revenue advantage', sub: 'Based on 3 price response opportunities where you had advance notice', val: '~$18K', color: 'var(--accent)' },
              ].map(({ icon, label, sub, val, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0, background: 'var(--surface-2)' }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{sub}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, flexShrink: 0, color }}>{val}</div>
                </div>
              ))}

              {/* CONSEQUENCE BOX */}
              <div style={{ background: 'rgba(224,90,106,0.05)', border: '1px solid rgba(224,90,106,0.2)', borderRadius: 'var(--r-sm)', padding: '14px 16px', margin: '0 16px 16px' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--danger)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  If you cancel this block
                </div>
                {[
                  { n: '1', text: <span>Block stays active through <strong>May 31</strong> (end of current billing period). No charge on Jun 1.</span> },
                  { n: '2', text: <span><strong>{b.shortName} is added to our active prospect list</strong> on May 1 when the block ends. Our sales team is automatically notified.</span> },
                  { n: '3', text: <span>{b.shortName} can now subscribe to CannaSpy, gaining full access to your pricing, promos, and product intelligence.</span> },
                  { n: '4', text: <span>If {b.shortName} subscribes, they can block <em>you</em> — reversing the intelligence advantage you currently hold.</span> },
                ].map(({ n, text }) => (
                  <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--danger)', width: 18, flexShrink: 0, marginTop: 1 }}>{n}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RENEWAL DECISION */}
            <div style={card}>
              <div style={{ ...cardHeader, background: 'var(--surface-2)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Your options for May 1</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>Act before Apr 30 to cancel · otherwise auto-renews</span>
              </div>
              {/* Renew option */}
              <div
                onClick={() => handleDecisionClick('renew')}
                style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: decision !== 'cancel' ? 'rgba(9,161,161,0.05)' : undefined, borderLeft: decision !== 'cancel' ? '3px solid var(--accent)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${decision !== 'cancel' ? 'var(--accent)' : 'var(--border-2)'}`, background: decision !== 'cancel' ? 'var(--accent)' : undefined, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {decision !== 'cancel' && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Keep running — auto-renews May 1</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--accent-soft)', color: 'var(--accent)', marginLeft: 'auto' }}>Default · no action needed</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 24, lineHeight: 1.5 }}>Block continues automatically. ${b.cost.toLocaleString()} will be charged on May 1. {b.shortName} remains blocked with zero access to CannaSpy for another month.</div>
              </div>
              {/* Cancel option */}
              <div
                onClick={() => handleDecisionClick('cancel')}
                style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: decision === 'cancel' ? 'rgba(224,90,106,0.05)' : undefined, borderLeft: decision === 'cancel' ? '3px solid var(--danger)' : undefined }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${decision === 'cancel' ? 'var(--danger)' : 'var(--border-2)'}`, background: decision === 'cancel' ? 'var(--danger)' : undefined, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {decision === 'cancel' && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Cancel — stop auto-renew before Apr 30</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, background: 'var(--danger-soft)', color: 'var(--danger)', marginLeft: 'auto' }}>Block ends Apr 30</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 24, lineHeight: 1.5 }}>Block stays fully active through Apr 30 at no additional charge. On May 1 the auto-charge stops and {b.shortName} is added to the active prospect list. They can then subscribe to CannaSpy.</div>
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <button style={{ ...btn, flex: 1, opacity: 0.6 }} onClick={() => showToast('Block will auto-renew May 1 — no action needed')}>No change — auto-renews May 1</button>
                <button style={btnDanger} onClick={handleConfirmCancel}>Cancel this block</button>
              </div>
            </div>
          </div>

          {/* SIDE COL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* ROI CARD */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Block ROI</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>{b.roi}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>Estimated $18K revenue advantage vs. ${b.spent.toLocaleString()} spent on this block to date.</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Cost per intelligence day</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700 }}>${Math.round(b.cost / 30)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>${b.cost.toLocaleString()}/mo ÷ 30 days. Per day you know what {b.shortName} is doing and they don't know what you are doing.</div>
            </div>
            {/* NEXT CHARGE */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Next auto-charge</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>May 1</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>${b.cost.toLocaleString()} charged automatically. No action needed. Cancel before Apr 30 to stop the May charge.</div>
              <div style={{ height: 1, background: 'var(--border)', margin: '10px 0' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-3)', marginBottom: 3 }}>Block started</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700 }}>Apr 1</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>{b.days} days active. {b.shortName} has had zero CannaSpy access since then.</div>
            </div>
            {/* BILLING TIMELINE */}
            <div style={card}>
              <div style={cardHeader}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Billing cycle</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {[
                  { dot: 'var(--accent)', dotEmpty: false, date: 'Apr 1, 2026', label: 'Block placed & first charge', sub: `Prorated $1,533 · 10 locations · $200/slot`, labelColor: '' },
                  { dot: 'var(--accent)', dotEmpty: true, date: 'Today — Apr 16', label: 'You are here — 47 days active', sub: '28 intel events captured · STIIIZY still dark', labelColor: 'var(--accent)' },
                  { dot: 'var(--accent)', dotEmpty: false, date: 'May 1', label: `Auto-charge — $${b.cost.toLocaleString()}`, sub: 'Block continues automatically · cancel before Apr 30 to stop', labelColor: 'var(--accent)' },
                  { dot: 'var(--border-2)', dotEmpty: false, date: 'Jun 1, Jul 1 …', label: 'Continues monthly', sub: 'Auto-charges on the 1st until you cancel', labelColor: 'var(--text-3)', last: true },
                ].map(({ dot, dotEmpty, date, label, sub, labelColor, last }, idx) => (
                  <div key={date} style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: last ? 0 : 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotEmpty ? 'var(--surface)' : dot, border: dotEmpty ? `2px solid ${dot}` : undefined, flexShrink: 0 }} />
                      {!last && <div style={{ width: 1, height: 28, background: 'var(--border-2)', marginTop: 3 }} />}
                    </div>
                    <div style={{ flex: 1, marginLeft: 8 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginBottom: 1 }}>{date}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: labelColor || 'var(--text-1)' }}>{label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 800, backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 801, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r)', boxShadow: '0 20px 60px rgba(0,0,0,0.22)', padding: '28px 32px', width: 460, maxWidth: '90vw' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Cancel Block — {b.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
              Auto-renew will be stopped. The block stays fully active through <strong>Apr 30</strong> at no additional charge. On May 1, the ${b.cost.toLocaleString()} charge does not occur and {b.shortName} is added to the active prospect list. <strong>They can then subscribe to CannaSpy.</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={btn} onClick={() => setShowModal(false)}>Go back</button>
              <button style={{ ...btn, background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }} onClick={() => { setShowModal(false); showToast('Decision confirmed'); }}>Yes, cancel auto-renew</button>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </div>
  );
}
