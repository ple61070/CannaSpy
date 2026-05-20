import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthFetch } from '../lib/useAuthFetch';

const API = import.meta.env.VITE_API_URL ?? '';

type Panel = 'alerts' | 'delivery' | 'thresholds' | 'locations';

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 40, height: 22,
        background: on ? 'var(--accent)' : 'var(--border-2)',
        borderRadius: 11, position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 0.25s', flexShrink: 0,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, background: '#fff', borderRadius: '50%',
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  );
}

function Seg({ options, selected, onChange }: { options: string[]; selected: number; onChange: (i: number) => void }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: 2, gap: 2 }}>
      {options.map((opt, i) => (
        <div key={opt} onClick={() => onChange(i)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', color: selected === i ? '#fff' : 'var(--text-2)', background: selected === i ? 'var(--accent)' : 'transparent', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' as const, userSelect: 'none' as const }}>
          {opt}
        </div>
      ))}
    </div>
  );
}

const selStyle: React.CSSProperties = {
  padding: '6px 26px 6px 10px', borderRadius: 'var(--r-sm)',
  border: '1.5px solid var(--border-2)', background: 'var(--surface)',
  color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, cursor: 'pointer',
  appearance: 'none', WebkitAppearance: 'none', outline: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%238aafc8' stroke-width='2.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '12px',
};

const numStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border-2)',
  background: 'var(--surface)', color: 'var(--text-1)', fontFamily: 'var(--mono)',
  fontSize: 12, width: 70, textAlign: 'center', outline: 'none',
};

function Row({ label, desc, right, extra }: { label: string; desc?: string; right?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{desc}</div>}
        {extra}
      </div>
      {right && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>{right}</div>}
    </div>
  );
}

function Card({ title, sub, children, action }: { title: string; sub: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>{sub}</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function AlertGrid({ rows, values, onChange }: { rows: { label: string; desc: string; badge?: string; }[]; values: boolean[]; onChange: (i: number, v: boolean) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 20px', borderBottom: i < rows.length - 2 ? '1px solid var(--border)' : (rows.length % 2 === 0 && i >= rows.length - 2 ? 'none' : '1px solid var(--border)') }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ width: 13, height: 13 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              </div>
              {row.label}
              {row.badge && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 10, background: 'rgba(9,161,161,0.13)', color: 'var(--accent)', border: '1px solid rgba(9,161,161,0.22)' }}>{row.badge}</span>
              )}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 1, paddingLeft: 34 }}>{row.desc}</div>
          </div>
          <Toggle on={values[i]} onChange={v => onChange(i, v)} />
        </div>
      ))}
    </div>
  );
}

const DIGEST_OPTIONS = ['realtime', 'daily', 'weekly'] as const;

export default function NotificationSettings() {
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const [panel, setPanel] = useState<Panel>('alerts');
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [sharedAlerts, setSharedAlerts] = useState([true, true, true, true]);
  const [generalAlerts, setGeneralAlerts] = useState([true, false, false, true]);

  const [emailOn, setEmailOn] = useState(true);
  const [pushOn, setPushOn] = useState(true);
  const [smsOn, setSmsOn] = useState(true);
  const [sharedDigest, setSharedDigest] = useState(0);
  const [generalDigest, setGeneralDigest] = useState(1);
  const [quietOn, setQuietOn] = useState(true);
  const [quietWeekend, setQuietWeekend] = useState(false);

  const [priceThreshold, setPriceThreshold] = useState(5);
  const [dollarThreshold, setDollarThreshold] = useState(2);
  const [maxAlerts, setMaxAlerts] = useState(25);
  const [cooldown, setCooldown] = useState('1 hour');

  useEffect(() => {
    authFetch(`${API}/api/v1/settings/notifications`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        const d = res.data;
        if (d.email_enabled != null) setEmailOn(d.email_enabled);
        if (d.push_enabled != null) setPushOn(d.push_enabled);
        if (d.price_threshold_pct != null) setPriceThreshold(d.price_threshold_pct);
        if (d.digest_frequency) {
          const idx = DIGEST_OPTIONS.indexOf(d.digest_frequency);
          if (idx >= 0) { setSharedDigest(idx); setGeneralDigest(idx); }
        }
        if (d.quiet_hours_start) setQuietOn(true);
        if (Array.isArray(d.alert_types)) {
          setSharedAlerts([
            d.alert_types.includes('price_drop'),
            d.alert_types.includes('price_increase'),
            d.alert_types.includes('new_promo'),
            d.alert_types.includes('new_sku'),
          ]);
          setGeneralAlerts([
            d.alert_types.includes('new_competitor'),
            d.alert_types.includes('new_sku'),
            d.alert_types.includes('sku_removed'),
            d.alert_types.includes('promo_ended'),
          ]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const alertTypes: string[] = [];
      if (sharedAlerts[0]) alertTypes.push('price_drop');
      if (sharedAlerts[1]) alertTypes.push('price_increase');
      if (sharedAlerts[2]) alertTypes.push('new_promo');
      if (sharedAlerts[3]) alertTypes.push('new_sku');
      if (generalAlerts[0]) alertTypes.push('new_competitor');
      if (generalAlerts[2]) alertTypes.push('sku_removed');
      if (generalAlerts[3]) alertTypes.push('promo_ended');
      await authFetch(`${API}/api/v1/settings/notifications`, {
        method: 'PATCH',
        body: JSON.stringify({
          email_enabled: emailOn,
          push_enabled: pushOn,
          price_threshold_pct: priceThreshold,
          digest_frequency: DIGEST_OPTIONS[sharedDigest] ?? 'realtime',
        }),
      });
      setDirty(false);
      showToast('Changes saved');
    } catch {
      showToast('Failed to save — please try again');
    }
  }, [emailOn, pushOn, priceThreshold, sharedDigest, sharedAlerts, generalAlerts]);

  const mark = () => setDirty(true);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const navItems: { id: Panel; label: string }[] = [
    { id: 'alerts', label: 'Alert types' },
    { id: 'delivery', label: 'Delivery & digest' },
    { id: 'thresholds', label: 'Thresholds' },
    { id: 'locations', label: 'Per-location overrides' },
  ];

  const sharedRows = [
    { label: 'Rival price drop on shared brand', desc: 'Rival drops price on a brand you both carry', badge: 'Priority' },
    { label: 'Rival price increase on shared brand', desc: 'Opportunity to reprice or hold advantage' },
    { label: 'Rival flash sale on shared brand', desc: 'Time-limited sale on a brand you both carry', badge: 'Priority' },
    { label: 'Rival adds a brand you carry', desc: 'A rival starts stocking a brand you already carry', badge: 'New' },
  ];

  const generalRows = [
    { label: 'New rival competitor detected', desc: 'New dispensary opens in your market area' },
    { label: 'Rival new SKUs added', desc: 'Rivals expand their catalog with new products' },
    { label: 'Rival SKUs removed', desc: "Products dropped from a rival's active menu" },
    { label: 'Rival recurring deal changes', desc: 'Daily deals or happy hours added or changed' },
  ];

  const locOverrides = [
    { name: 'WeHo Flagship', market: 'Elite · WeHo', email: true, sms: true, push: true, digest: 'Real-time', quiet: 'Global', threshold: 'Global' },
    { name: 'DTLA Flagship', market: 'Hot · DTLA', email: true, sms: false, push: false, digest: 'Daily', quiet: 'Off', threshold: 'Global' },
    { name: 'SoMa San Francisco', market: 'Elite · SoMa SF', email: true, sms: true, push: true, digest: 'Real-time', quiet: 'Custom', threshold: '3%' },
  ];

  const btnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' };
  const btnPrimary: React.CSSProperties = { ...btnBase, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 18px rgba(9,161,161,0.32)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Notification Settings</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>WeHo Flagship · All Locations</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={btnBase} onClick={() => { setDirty(false); showToast('Reset to defaults'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>
            Reset to defaults
          </button>
          <button style={btnPrimary} onClick={handleSave}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>
            Save changes
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, maxWidth: 1000 }}>

          {/* Left nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, position: 'sticky', top: 0 }}>
            {navItems.map(item => (
              <div key={item.id} onClick={() => setPanel(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 'var(--r-sm)', fontSize: 13, fontWeight: panel === item.id ? 600 : 500, color: panel === item.id ? 'var(--accent)' : 'var(--text-2)', cursor: 'pointer', background: panel === item.id ? 'var(--surface)' : 'transparent', border: panel === item.id ? '1px solid var(--border)' : '1px solid transparent', boxShadow: panel === item.id ? 'var(--card-shadow)' : 'none', userSelect: 'none' as const }}>
                {item.label}
              </div>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
            <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '6px 12px', lineHeight: 1.5 }}>
              Changes apply to all locations unless overridden
            </div>
          </div>

          {/* Right panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* PANEL: Alert Types */}
            {panel === 'alerts' && (
              <>
                <Card title="Shared brand alerts" sub="Alerts for price moves on brands you and a rival both carry. Highest priority — always recommended on.">
                  <AlertGrid rows={sharedRows} values={sharedAlerts} onChange={(i, v) => { const n = [...sharedAlerts]; n[i] = v; setSharedAlerts(n); mark(); }} />
                </Card>
                <Card title="General alerts" sub="Broader market activity alerts. Lower priority than shared brand alerts.">
                  <AlertGrid rows={generalRows} values={generalAlerts} onChange={(i, v) => { const n = [...generalAlerts]; n[i] = v; setGeneralAlerts(n); mark(); }} />
                </Card>
              </>
            )}

            {/* PANEL: Delivery */}
            {panel === 'delivery' && (
              <>
                <Card title="Delivery channels" sub="Where you receive alerts. Email required for digest mode.">
                  <Row label="Email alerts" desc="patrick@cannaspy.com · Sends to your account email" right={<Toggle on={emailOn} onChange={v => { setEmailOn(v); mark(); }} />} />
                  <Row label="Push notifications" desc="Browser and mobile push alerts for real-time delivery" right={<Toggle on={pushOn} onChange={v => { setPushOn(v); mark(); }} />} />
                  <Row
                    label="SMS / text alerts"
                    desc="Text message alerts for urgent price changes. US numbers only."
                    right={<Toggle on={smsOn} onChange={v => { setSmsOn(v); mark(); }} />}
                    extra={smsOn ? (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input style={{ ...numStyle, width: 160, textAlign: 'left', fontFamily: 'var(--mono)' }} defaultValue="+1 (310) 555-0188" />
                          <button style={{ padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Verify number</button>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)' }}>✓ Verified</span>
                        </div>
                        <div style={{ marginTop: 7 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>SMS alert types</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                            {['Price drops', 'Price increases', 'New promos', 'Block released', 'New rival'].map((t, i) => (
                              <span key={t} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 5, border: '1.5px solid', cursor: 'pointer', userSelect: 'none' as const, background: i === 0 ? 'var(--accent)' : 'var(--surface-3)', color: i === 0 ? '#fff' : 'var(--text-2)', borderColor: i === 0 ? 'var(--accent)' : 'var(--border-2)' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : undefined}
                  />
                  <Row label="Slack notifications" desc="Post alerts to a Slack channel — coming soon" right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '2px 7px', borderRadius: 10, background: 'rgba(9,161,161,0.13)', color: 'var(--accent)', border: '1px solid rgba(9,161,161,0.22)' }}>Soon</span>
                      <Toggle on={false} onChange={() => {}} disabled />
                    </div>
                  } />
                </Card>

                <Card title="Digest frequency" sub="How often alerts are batched and sent. Real-time fires immediately — recommended for shared brand alerts.">
                  <Row label="Shared brand alerts" desc="Price moves and flash sales on brands you both carry — act fast" right={<Seg options={['Real-time', 'Daily', 'Weekly']} selected={sharedDigest} onChange={v => { setSharedDigest(v); mark(); }} />} />
                  <Row label="General alerts" desc="SKU changes, new rivals, recurring deal updates" right={<Seg options={['Real-time', 'Daily', 'Weekly']} selected={generalDigest} onChange={v => { setGeneralDigest(v); mark(); }} />} />
                </Card>

                <Card title="Quiet hours" sub="No alerts sent during this window. Monitoring still runs — alerts queue and deliver when quiet hours end.">
                  <Row label="Enable quiet hours" desc="Silence alerts overnight and on weekends" right={<Toggle on={quietOn} onChange={v => { setQuietOn(v); mark(); }} />} />
                  {quietOn && (
                    <>
                      <Row label="Quiet window" desc="Local time · Alerts queued and released at end of window" right={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <select defaultValue="10:00 PM" style={{ ...selStyle, width: 100 }} onChange={mark}><option>10:00 PM</option><option>9:00 PM</option><option>8:00 PM</option><option>11:00 PM</option></select>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>to</span>
                          <select defaultValue="7:00 AM" style={{ ...selStyle, width: 100 }} onChange={mark}><option>7:00 AM</option><option>6:00 AM</option><option>8:00 AM</option><option>9:00 AM</option></select>
                        </div>
                      } />
                      <Row label="Include weekends" desc="Extend quiet hours to Saturday and Sunday" right={<Toggle on={quietWeekend} onChange={v => { setQuietWeekend(v); mark(); }} />} />
                    </>
                  )}
                </Card>
              </>
            )}

            {/* PANEL: Thresholds */}
            {panel === 'thresholds' && (
              <>
                <Card title="Price change threshold" sub="Only alert when a price changes by at least this percentage. Filters out penny-rounding noise.">
                  <Row label="Minimum price change" desc="Applies to all price-related alerts. Shared brand alerts ignore this — they always fire." right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" value={priceThreshold} min={1} max={50} onChange={e => { setPriceThreshold(+e.target.value); mark(); }} style={numStyle} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>% change</span>
                    </div>
                  } />
                  <Row label="Minimum dollar change" desc="Also require at least this dollar amount — prevents alerts on $0.50 moves" right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>$</span>
                      <input type="number" value={dollarThreshold} min={0} max={20} onChange={e => { setDollarThreshold(+e.target.value); mark(); }} style={numStyle} />
                    </div>
                  } />
                </Card>
                <Card title="Alert volume control" sub="Prevents alert fatigue when monitoring detects widespread market movement.">
                  <Row label="Max alerts per day" desc="Cap total daily alerts across all locations. Prioritizes shared brand alerts first." right={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" value={maxAlerts} min={5} max={200} onChange={e => { setMaxAlerts(+e.target.value); mark(); }} style={numStyle} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>alerts/day</span>
                    </div>
                  } />
                  <Row label="Cooldown between same-rival alerts" desc="Don't fire another alert on the same rival within this window" right={
                    <select value={cooldown} onChange={e => { setCooldown(e.target.value); mark(); }} style={selStyle}>
                      <option>No cooldown</option><option>1 hour</option><option>4 hours</option><option>24 hours</option>
                    </select>
                  } />
                </Card>
              </>
            )}

            {/* PANEL: Per-location overrides */}
            {panel === 'locations' && (
              <Card title="Per-location overrides" sub="These settings override the global defaults for specific locations. Leave a toggle off to inherit the global setting." action={
                <button style={btnBase} onClick={() => showToast('Override dialog coming soon')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                  Add override
                </button>
              }>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Location', 'Email', 'SMS', 'Push', 'Digest', 'Quiet hours', 'Threshold'].map(h => (
                          <th key={h} style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-3)', padding: '10px 16px', borderBottom: '1px solid var(--border)', textAlign: h === 'Location' ? 'left' as const : 'center' as const, fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {locOverrides.map((loc, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{loc.name}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 4, background: 'rgba(211,150,166,0.14)', color: 'var(--rose)', display: 'inline-block', marginTop: 2 }}>{loc.market}</div>
                          </td>
                          {(['email', 'sms', 'push'] as const).map(field => (
                            <td key={field} style={{ padding: '12px 16px', textAlign: 'center' as const }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <Toggle on={loc[field]} onChange={() => mark()} />
                              </div>
                            </td>
                          ))}
                          <td style={{ padding: '12px 16px', textAlign: 'center' as const }}>
                            <select defaultValue={loc.digest} onChange={mark} style={{ ...selStyle, width: 100 }}>
                              <option>Real-time</option><option>Daily</option><option>Weekly</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' as const }}>
                            <select defaultValue={loc.quiet} onChange={mark} style={{ ...selStyle, width: 90 }}>
                              <option>Global</option><option>Off</option><option>Custom</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' as const }}>
                            <select defaultValue={loc.threshold} onChange={mark} style={{ ...selStyle, width: 90 }}>
                              <option>Global</option><option>3%</option><option>10%</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ opacity: 0.5 }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>+ 7 more locations</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>Using global defaults</div>
                        </td>
                        <td colSpan={6} style={{ padding: '12px 16px', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                          Inheriting all global settings · Click to expand
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>

      {/* Save bar */}
      <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: dirty ? 'var(--warm)' : 'var(--accent)', flexShrink: 0 }} />
          {dirty ? 'Unsaved changes' : 'All changes saved'}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnBase} onClick={() => { setDirty(false); showToast('Changes discarded'); }}>Discard changes</button>
          <button style={btnPrimary} onClick={handleSave}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>
            Save changes
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text-1)', color: 'var(--surface)', padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', zIndex: 9000, letterSpacing: '0.04em' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
