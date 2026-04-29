import React, { useState } from 'react';

const COV_ROWS = [
  { field: 'Current price per SKU',         yes: true,  note: 'Live price as shown to customers today' },
  { field: 'On-sale flag & original price',  yes: true,  note: 'Detects active discounts and sale depth' },
  { field: 'Discount label text',            yes: true,  note: 'e.g. "20% off", "BOGO", "Happy Hour"' },
  { field: 'Price vs. prior day (delta)',    yes: true,  note: 'Computed by CannaSpy diff engine' },
  { field: 'Product brand & category',       yes: true,  note: 'Flower, Vapes, Pre-rolls, Edibles, Concentrates' },
  { field: 'Strain name & genetics',         yes: true,  note: 'Indica / Sativa / Hybrid + strain name where available' },
  { field: 'Lab-verified THC/CBD values',    yes: true,  note: 'In mg per item when provided by the dispensary' },
  { field: 'New & discontinued products',    yes: true,  note: 'Detected on each daily run by comparison to prior snapshot' },
  { field: 'Promotional schedule',           yes: true,  note: 'Happy hours, daily brand deals, first-time offers' },
  { field: 'Business hours & open status',   yes: true,  note: 'Current day hours and live open/closed flag' },
  { field: 'Online ordering availability',   yes: true,  note: 'Whether delivery or pickup is currently active' },
  { field: 'Transaction-level sales data',   yes: false, note: 'Not collected — CannaSpy accesses public menus only' },
  { field: 'Customer PII or loyalty data',   yes: false, note: 'Not collected — no access to internal systems' },
  { field: 'Internal inventory quantities',  yes: false, note: 'Counts not publicly accessible; in-stock status only' },
];

const FAQS = [
  { q: 'Where does the pricing data come from?', a: 'CannaSpy aggregates pricing, product, and promotional data from publicly available cannabis market sources. Our data collection infrastructure is proprietary — what matters to you is that pricing and menu data is updated daily and covers every licensed dispensary in your competitive set.' },
  { q: 'Is this legal? Are you monitoring without permission?', a: 'CannaSpy collects only publicly available data — information that any consumer, competitor, or third party can access through normal browsing. We do not bypass authentication, access private systems, or collect data that requires a login. This is the same methodology used by price comparison services, market research firms, and competitive intelligence tools across every industry.' },
  { q: 'How fresh is the data? When was the last update?', a: "Every tracked dispensary is refreshed daily between 2:00–5:00 AM Pacific. By the time you open your dashboard in the morning, the prior day's prices are already reflected. Price changes detected overnight appear as alerts immediately after the collection run completes, typically before 6 AM." },
  { q: 'What happens if a competitor moves to a different menu platform?', a: 'Our data collection is designed to be platform-agnostic. We track what dispensaries make publicly available, regardless of which menu management system they use. Moving platforms does not meaningfully affect our coverage of that competitor. We maintain a fallback pipeline specifically to handle this scenario.' },
  { q: 'How accurate is the product normalization?', a: 'Product name normalization uses an AI-assisted matching system trained on the California cannabis market. Accuracy across identical products at different dispensaries is above 96%. Low-confidence matches are flagged with a reduced confidence indicator in the price matrix.' },
  { q: 'Can a competitor see that CannaSpy is monitoring them?', a: 'No. CannaSpy accesses the same public menu data that any consumer or developer accesses when browsing. There is no tracking, fingerprinting, or identifiable signal that distinguishes CannaSpy requests from ordinary traffic.' },
  { q: 'What if the data shows a price that looks wrong?', a: 'Every data point shows a timestamp and confidence level. If you see a price that looks inconsistent with what you know, use the "Flag data issue" button on any price cell to report it. Our team reviews flagged records within 24 hours and re-verifies against the live source.' },
];

const PIPELINE_STEPS = [
  { num: '01', title: 'Discovery', body: 'Licensed dispensaries identified via California DCC license database and public maps APIs. No competitor is added without a verified DCC license number.', badge: 'Nightly scan', badgeBg: 'var(--accent-soft)', badgeColor: 'var(--accent)' },
  { num: '02', title: 'Collection', body: 'Full menu data collected from publicly available cannabis market data sources. Pricing, SKU details, sale flags, discount labels, and lab values are captured per item.', badge: '2–5 AM Pacific', badgeBg: 'var(--accent-soft)', badgeColor: 'var(--accent)' },
  { num: '03', title: 'Normalization', body: 'Product names are normalized across dispensaries so "Friendly Farms OG 1g" and "FF OG Cartridge 1000mg" resolve to the same SKU for accurate cross-market comparison.', badge: 'AI-assisted', badgeBg: 'rgba(212,144,10,0.15)', badgeColor: 'var(--warm)' },
  { num: '04', title: 'Diff & Alert', body: 'Every new collection is compared to the prior snapshot. Price changes, new SKUs, removed products, and promo starts/ends generate alerts in real time.', badge: 'Real-time events', badgeBg: 'rgba(224,90,106,0.08)', badgeColor: 'var(--danger)' },
  { num: '05', title: 'Redundancy', body: 'A parallel fallback pipeline runs independently. If primary collection encounters an issue, fallback activates automatically — your data never goes stale.', badge: 'Always-on backup', badgeBg: 'var(--surface-3)', badgeColor: 'var(--text-3)' },
];

const FRESHNESS = [
  { time: '2:34 AM', label: 'Last collection run', sub: 'Apr 16 · All 10 tracked rivals refreshed · 0 failures' },
  { time: '2:47 AM', label: 'Last normalization pass', sub: '14 new product matches resolved across 3 dispensaries' },
  { time: '2:51 AM', label: 'Last alerts generated', sub: '3 price changes, 1 new SKU, 1 promo start detected' },
  { time: '99.1%', label: '30-day uptime', sub: '2 minor outages, both recovered within 4 hours via fallback' },
];

export default function DataTrust() {
  const [toast, setToast] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Data Trust &amp; Provenance</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>HOW WE COLLECT DATA &amp; WHY YOU CAN RELY ON IT</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => showToast('Opening data quality report…')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            Download data report
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Data confidence</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1.2, marginBottom: 10 }}>You are looking at real data.<br />Not estimates. Not surveys.</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, maxWidth: 620 }}>
            CannaSpy collects pricing, product, and promotional data directly from publicly available cannabis market sources — the same information any consumer can access by browsing your competitors. Every price in your dashboard reflects what a customer would see if they walked in today.
          </div>
        </div>

        {/* Trust score strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { val: '98.7%', label: 'Data accuracy', sub: 'Price records verified against live source within 24 hours of display' },
            { val: 'Daily', label: 'Refresh cadence', sub: 'Every tracked dispensary monitored between 2–5 AM Pacific, every day' },
            { val: '~1,300', label: 'CA dispensaries covered', sub: 'Every licensed California dispensary with a public menu is in scope' },
            { val: 'Public', label: 'Data source type', sub: 'No authentication bypass. No ToS violation. Publicly accessible pricing only.' },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px 18px', boxShadow: 'var(--card-shadow)', minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 24, fontWeight: 700, lineHeight: 1, marginBottom: 3, color: 'var(--accent)' }}>{item.val}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 5, lineHeight: 1.4 }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            How your data is collected
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 8 }}>
            {PIPELINE_STEPS.map(step => (
              <div key={step.num} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', boxShadow: 'var(--card-shadow)', minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--accent)', marginBottom: 5 }}>{step.num}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.5 }}>{step.body}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, marginTop: 6, display: 'inline-block', background: step.badgeBg, color: step.badgeColor }}>{step.badge}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Data freshness */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          Data freshness — current status
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: 24 }}>
          {FRESHNESS.map(f => (
            <div key={f.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '13px 15px', boxShadow: 'var(--card-shadow)', minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{f.time}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{f.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-2)', lineHeight: 1.4 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        {/* Coverage table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2}><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>What data fields are collected per dispensary</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>Data field</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>Collected</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {COV_ROWS.map(row => (
                <tr key={row.field}>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 600, color: 'var(--text-1)', verticalAlign: 'middle' }}>{row.field}</td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', textAlign: 'center', verticalAlign: 'middle' }}>
                    {row.yes ? (
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--surface-3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={3} style={{ width: 10, height: 10 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '9px 12px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text-2)', verticalAlign: 'middle' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          Common questions about data quality
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginBottom: 8, overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
            <div
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{faq.q}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 16, height: 16, color: 'var(--text-3)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            {openFaq === i && (
              <div style={{ padding: '12px 18px 14px', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7, borderTop: '1px solid var(--border)' }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
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
