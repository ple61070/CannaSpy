import React, { useState } from 'react';

const MISSED_ITEMS = [
  {
    color: 'var(--danger)',
    text: <><strong>STIIIZY WeHo</strong> dropped Tropic Jack 3.5g from $18 to $14 — matching your price point on your #1 Flower SKU. They have now run 3 flash sales in 30 days.</>,
    time: 'Detected May 2 · 2 days after your cancellation',
  },
  {
    color: 'var(--warm)',
    text: <><strong>MedMen WeHo</strong> added 6 new Friendly Farms Vape SKUs and expanded their happy hour from 3 hours to 5 hours daily.</>,
    time: 'Detected May 4',
  },
  {
    color: 'var(--warm)',
    text: <><strong>Cookies WeHo</strong> — a new dispensary 1.4 miles from your flagship — opened May 3 with 84 SKUs, 12 of which overlap with your inventory. Their Flower avg is $9 above yours.</>,
    time: 'Detected May 3',
  },
  {
    color: 'var(--accent)',
    text: <><strong>Off The Charts</strong> ran a Jeeter Brand Day promotion at −20% across 14 SKUs. The event lasted 1 day and appears to be recurring monthly.</>,
    time: 'Detected May 7',
  },
];

const STATS = [
  { val: '10', color: 'var(--text-1)', label: 'Locations', note: 'All preserved — reactivates instantly' },
  { val: '63', color: 'var(--accent)', label: 'Tracked rivals', note: 'Competitive set saved' },
  { val: '18', color: 'var(--rose)', label: 'Block slots', note: 'Released May 1' },
  { val: '14,025', color: 'var(--text-1)', label: 'Price records saved', note: '90-day history retained' },
  { val: '$14,025', color: 'var(--warm)', label: 'Monthly value', note: 'At time of cancellation' },
  { val: '4', color: 'var(--accent)', label: 'Team members', note: 'Access suspended, not deleted' },
];

export default function Offboarded() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 720 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#09A1A1 0%,#F6C992 100%)', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(9,161,161,0.45)' }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="8.5" x2="22" y2="8.5" />
            </svg>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>CannaSpy</div>
        </div>

        {/* Status card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '28px 32px', boxShadow: 'var(--card-shadow)', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--surface-2)', border: '1px solid var(--border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={1.8}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 8 }}>Your account is cancelled</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 16px' }}>
            Your Catalyst Cannabis subscription ended on May 1, 2026. Your data and settings are preserved for 90 days. You can reactivate at any time — your competitive set, history, and team members will be exactly as you left them.
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginBottom: 20 }}>
            Subscription ended: May 1, 2026 · Data retained until: Jul 30, 2026
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => showToast('Reactivating your account…')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 18px rgba(9,161,161,0.32)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
              Reactivate now
            </button>
            <button
              onClick={() => showToast('Opening your saved data…')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}
            >
              View saved data
            </button>
          </div>
        </div>

        {/* Block released alert */}
        <div style={{ background: 'rgba(212,144,10,0.07)', border: '1.5px solid rgba(212,144,10,0.25)', borderLeft: '4px solid var(--warm)', borderRadius: 'var(--r)', padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(212,144,10,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--warm)" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3 }}>Your blocks on STIIIZY WeHo and Off The Charts DTLA were released on May 1</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>Both rivals are now eligible to subscribe to CannaSpy. Our sales team contacted them within 24 hours of your cancellation. If either subscribes before you reactivate, you will not be able to block them until their subscription lapses. Reactivate now to reclaim those block slots before they do.</div>
          </div>
        </div>

        {/* What was active */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>What was active when you cancelled</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ padding: '14px 16px', borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{s.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 4, lineHeight: 1.4 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* What they missed */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--card-shadow)', marginBottom: 16 }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>What your competitors did while you were away</div>
          </div>
          {MISSED_ITEMS.map((item, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.color, marginTop: 5, flexShrink: 0, display: 'inline-block' }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5 }}>{item.text}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>{item.time}</div>
              </div>
            </div>
          ))}
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--surface-2)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-3)', marginTop: 5, flexShrink: 0, display: 'inline-block' }} />
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>+ 18 more price change events detected in the last 15 days. Reactivate to see the full history.</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 2 }}>Available on reactivation</div>
            </div>
          </div>
        </div>

        {/* Reactivate CTA */}
        <div style={{ background: 'linear-gradient(135deg,rgba(9,161,161,0.07) 0%,rgba(9,161,161,0.02) 100%)', border: '1.5px solid rgba(9,161,161,0.2)', borderRadius: 'var(--r)', padding: '22px 26px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 6 }}>Your competitors are not standing still</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 18 }}>Every day you are not watching, they are moving — on pricing, on promotions, on your shared SKUs. Your data and competitive set are preserved and ready. Reactivation takes under 60 seconds.</div>
          <button
            onClick={() => showToast('Reactivating your Catalyst Cannabis account…')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--r-sm)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 18px rgba(9,161,161,0.32)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 13, height: 13 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
            Reactivate — pick up where you left off
          </button>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>Same pricing as before · No setup fee · Cancel any time</div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
          {toast}
        </div>
      )}
    </div>
  );
}
