import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Location {
  id: string;
  name: string;
  address: string;
  market: string;
  mktClass: string;
  license: string;
  health: 'ok' | 'warn' | 'fail';
  healthLabel: string;
  lastRun: string;
  items: number;
  track: number;
  block: number;
  active: boolean;
  log: { s: string; t: string; n: string }[];
  competitors: string[];
  blocked: string[];
}

const LOCATIONS: Location[] = [
  { id: 'loc1', name: 'WeHo Flagship', address: '8001 Santa Monica Blvd, West Hollywood, CA', market: 'Elite', mktClass: 'elite', license: 'C10-0001234-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '2h ago', items: 3241, track: 6, block: 2, active: true, log: [{ s: 'ok', t: '2:47 AM', n: '3,241 items' }, { s: 'ok', t: 'Yesterday', n: '3,238 items' }, { s: 'ok', t: '2 days ago', n: '3,219 items' }], competitors: ['STIIIZY WeHo', 'MedMen WeHo', 'Off The Charts', 'Catalyst WeHo', 'Jungle Boys', 'Harborside'], blocked: ['STIIIZY WeHo', 'MedMen WeHo'] },
  { id: 'loc2', name: 'DTLA Flagship', address: '835 S Figueroa St, Los Angeles, CA', market: 'Hot', mktClass: 'hot', license: 'C10-0001235-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '2h ago', items: 2891, track: 7, block: 2, active: true, log: [{ s: 'ok', t: '2:52 AM', n: '2,891 items' }, { s: 'ok', t: 'Yesterday', n: '2,884 items' }, { s: 'warn', t: '2 days ago', n: '2,201 items — partial' }], competitors: ['STIIIZY DTLA', 'Cookies DTLA', 'MedMen DTLA', 'Jungle Boys DTLA', 'Pure Beauty', 'Gold Flora', 'Zen Dispensary'], blocked: ['STIIIZY DTLA', 'Cookies DTLA'] },
  { id: 'loc3', name: 'SoMa San Francisco', address: '1326 Mission St, San Francisco, CA', market: 'Elite', mktClass: 'elite', license: 'C10-0001236-LIC', health: 'warn', healthLabel: 'Stale', lastRun: '8h ago', items: 2104, track: 5, block: 1, active: true, log: [{ s: 'warn', t: '6:12 AM', n: '2,104 items — delay' }, { s: 'ok', t: 'Yesterday', n: '3,092 items' }, { s: 'ok', t: '2 days ago', n: '3,088 items' }], competitors: ['Harborside SF', 'STIIIZY SF', 'Cookies SF', 'Apothecarium', 'MedMen Union Sq'], blocked: ['Harborside SF'] },
  { id: 'loc4', name: 'Mission District SF', address: '2001 Mission St, San Francisco, CA', market: 'Elite', mktClass: 'elite', license: 'C10-0001237-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '2h ago', items: 1987, track: 6, block: 2, active: true, log: [{ s: 'ok', t: '2:58 AM', n: '1,987 items' }, { s: 'ok', t: 'Yesterday', n: '1,984 items' }, { s: 'ok', t: '2 days ago', n: '1,980 items' }], competitors: ['Harborside SF', 'Apothecarium', 'STIIIZY Mission', 'Green Door', 'Urbn Leaf', 'Bloom Room'], blocked: ['Harborside SF', 'Apothecarium'] },
  { id: 'loc5', name: 'Oakland Telegraph', address: '4218 Telegraph Ave, Oakland, CA', market: 'Hot', mktClass: 'hot', license: 'C10-0001238-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '3h ago', items: 2340, track: 7, block: 2, active: true, log: [{ s: 'ok', t: '3:04 AM', n: '2,340 items' }, { s: 'ok', t: 'Yesterday', n: '2,338 items' }, { s: 'ok', t: '2 days ago', n: '2,325 items' }], competitors: ['Harborside Oakland', 'STIIIZY Oakland', 'Embarc Oakland', 'Blaze Oakland', 'Gold Flora Oak', 'Verilife', 'Caliva'], blocked: ['Harborside Oakland', 'Embarc Oakland'] },
  { id: 'loc6', name: 'Long Beach Downtown', address: '200 Pine Ave, Long Beach, CA', market: 'Competitive', mktClass: 'competitive', license: 'C10-0001239-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '2h ago', items: 1654, track: 6, block: 2, active: true, log: [{ s: 'ok', t: '2:41 AM', n: '1,654 items' }, { s: 'ok', t: 'Yesterday', n: '1,651 items' }, { s: 'ok', t: '2 days ago', n: '1,649 items' }], competitors: ['OC3 Long Beach', 'STIIIZY LB', 'Catalyst LB', 'Herbarium', '420 Central', 'Torrey Holistics'], blocked: ['OC3 Long Beach', 'Catalyst LB'] },
  { id: 'loc7', name: 'Sacramento Midtown', address: '1500 L St, Sacramento, CA', market: 'Competitive', mktClass: 'competitive', license: 'C10-0001240-LIC', health: 'fail', healthLabel: 'Failed', lastRun: '26h ago', items: 0, track: 5, block: 2, active: true, log: [{ s: 'fail', t: '2:30 AM', n: '0 items — connection timeout' }, { s: 'ok', t: '2 days ago', n: '2,104 items' }, { s: 'ok', t: '3 days ago', n: '2,100 items' }], competitors: ['Delta9 Sac', 'Barbary Coast Sac', 'STIIIZY Sac', 'Gold Flora Sac', 'Caliva Sac'], blocked: ['Delta9 Sac', 'Barbary Coast Sac'] },
  { id: 'loc8', name: 'San Diego Gaslamp', address: '465 Market St, San Diego, CA', market: 'Hot', mktClass: 'hot', license: 'C10-0001241-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '2h ago', items: 2217, track: 7, block: 3, active: true, log: [{ s: 'ok', t: '2:44 AM', n: '2,217 items' }, { s: 'ok', t: 'Yesterday', n: '2,213 items' }, { s: 'ok', t: '2 days ago', n: '2,208 items' }], competitors: ['Mankind SD', 'Urbn Leaf SD', 'STIIIZY SD', 'Harborside SD', 'Torrey Holistics', 'Cannabist SD', 'Green Tiger'], blocked: ['Mankind SD', 'Urbn Leaf SD', 'Harborside SD'] },
  { id: 'loc9', name: 'Beverly Hills', address: '9595 Wilshire Blvd, Beverly Hills, CA', market: 'Elite', mktClass: 'elite', license: 'C10-0001242-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '2h ago', items: 1893, track: 6, block: 2, active: true, log: [{ s: 'ok', t: '2:51 AM', n: '1,893 items' }, { s: 'ok', t: 'Yesterday', n: '1,890 items' }, { s: 'ok', t: '2 days ago', n: '1,888 items' }], competitors: ['STIIIZY BH', 'MedMen BH', 'Calma BH', 'Starbuds BH', 'The Artist Tree', 'Green Qween'], blocked: ['STIIIZY BH', 'MedMen BH'] },
  { id: 'loc10', name: 'Riverside Downtown', address: '3750 University Ave, Riverside, CA', market: 'Standard', mktClass: 'standard', license: 'C10-0001243-LIC', health: 'ok', healthLabel: 'Healthy', lastRun: '4h ago', items: 1204, track: 4, block: 0, active: false, log: [{ s: 'ok', t: '3 days ago', n: '1,204 items' }, { s: 'ok', t: '4 days ago', n: '1,198 items' }, { s: 'ok', t: '5 days ago', n: '1,195 items' }], competitors: ['Desert Hot Springs', 'Caliva Riverside', 'STIIIZY Riv', 'Harborside Riv'], blocked: [] },
];

function healthColor(h: string) {
  if (h === 'ok') return 'var(--accent)';
  if (h === 'warn') return 'var(--warm)';
  return 'var(--danger)';
}

function mktBadgeStyle(cls: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    elite: { bg: 'rgba(211,150,166,0.14)', color: 'var(--rose)' },
    hot: { bg: 'rgba(212,144,10,0.12)', color: 'var(--warm)' },
    competitive: { bg: 'rgba(84,132,164,0.12)', color: 'var(--slate)' },
    standard: { bg: 'var(--surface-3)', color: 'var(--text-2)' },
  };
  const s = map[cls] ?? map.standard;
  return { fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap' as const, background: s.bg, color: s.color };
}

function logDotColor(s: string) {
  if (s === 'ok') return 'var(--accent)';
  if (s === 'warn') return 'var(--warm)';
  return 'var(--danger)';
}

function slotCostPerSlot(market: string) {
  if (market === 'Elite') return 250;
  if (market === 'Hot') return 200;
  if (market === 'Competitive') return 150;
  return 100;
}

const colGrid = '2fr 1.4fr 1fr 1fr 1fr 1fr 140px';

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: colGrid }}>
      {cols.map((c, i) => (
        <div key={i} style={{ padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' as const, textAlign: (i === 0 ? 'left' : 'center') as 'left' | 'center' }}>
          {c}
        </div>
      ))}
    </div>
  );
}

export default function LocationManagement() {
  const navigate = useNavigate();
  const [locs, setLocs] = useState<Location[]>(LOCATIONS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const active = locs.filter(l => l.active);
  const inactive = locs.filter(l => !l.active);
  const totalTrack = locs.reduce((a, l) => a + l.track, 0);
  const totalBlock = locs.reduce((a, l) => a + l.block, 0);
  const totalSkus = locs.reduce((a, l) => a + l.items, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const deactivate = (id: string) => {
    setLocs(prev => prev.map(l => l.id === id ? { ...l, active: false } : l));
    setExpanded(null);
    setShowDeactivateModal(null);
    const loc = locs.find(l => l.id === id);
    if (loc) showToast(loc.name + ' deactivated');
  };

  const reactivate = (id: string) => {
    setLocs(prev => prev.map(l => l.id === id ? { ...l, active: true } : l));
    const loc = locs.find(l => l.id === id);
    if (loc) showToast(loc.name + ' reactivated');
  };

  const btnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-2)', background: 'transparent', color: 'var(--text-2)', fontFamily: 'var(--sans)' };

  function LocRow({ loc }: { loc: Location }) {
    const isExpanded = expanded === loc.id;
    const cost = (loc.track + loc.block) * slotCostPerSlot(loc.market);

    return (
      <div style={{ borderBottom: '1px solid var(--border)', opacity: loc.active ? 1 : 0.5 }}>
        {/* Main row */}
        <div
          onClick={() => setExpanded(isExpanded ? null : loc.id)}
          style={{ display: 'grid', gridTemplateColumns: colGrid, alignItems: 'center', cursor: 'pointer' }}
        >
          {/* Name */}
          <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-2)', color: 'var(--text-3)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 10, height: 10, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{loc.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.address}</div>
            </div>
          </div>
          {/* Market */}
          <div style={{ padding: '13px 16px', textAlign: 'center' }}>
            <span style={mktBadgeStyle(loc.mktClass)}>{loc.market}</span>
          </div>
          {/* License */}
          <div style={{ padding: '13px 16px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-2)' }}>{loc.license.split('-').slice(0, 2).join('-')}</div>
          {/* Health */}
          <div style={{ padding: '13px 16px', textAlign: 'center' }}>
            {loc.active ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: healthColor(loc.health), flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: healthColor(loc.health) }}>{loc.healthLabel}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{loc.lastRun}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>Paused</div>
            )}
          </div>
          {/* Slots */}
          <div style={{ padding: '13px 16px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700 }}>
            <span style={{ color: 'var(--accent)' }}>{loc.track} track</span>
            {loc.block > 0 && <><span style={{ color: 'var(--text-3)', fontWeight: 400 }}> · </span><span style={{ color: 'var(--rose)' }}>{loc.block} block</span></>}
          </div>
          {/* Status */}
          <div style={{ padding: '13px 16px', textAlign: 'center' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', padding: '3px 9px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 4, background: loc.active ? 'rgba(9,161,161,0.12)' : 'var(--surface-3)', color: loc.active ? 'var(--accent)' : 'var(--text-3)', border: loc.active ? '1px solid rgba(9,161,161,0.22)' : '1px solid var(--border)' }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: loc.active ? 'var(--accent)' : 'var(--text-3)' }} />
              {loc.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {/* Actions */}
          <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button style={btnBase} onClick={() => navigate('/locations')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              Dashboard
            </button>
            {loc.active ? (
              <button style={{ ...btnBase, borderColor: 'rgba(224,90,106,0.35)', color: 'var(--danger)' }} onClick={() => setShowDeactivateModal(loc.id)}>
                Deactivate
              </button>
            ) : (
              <button style={btnBase} onClick={() => reactivate(loc.id)}>Reactivate</button>
            )}
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ padding: '16px 20px 16px 54px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {/* Spy runs */}
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 8 }}>Recent spy runs</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {loc.log.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 5, background: 'var(--surface-3)' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: logDotColor(r.s), flexShrink: 0 }} />
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', width: 60, flexShrink: 0 }}>{r.t}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-2)' }}>{r.n}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Items collected</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{loc.items > 0 ? loc.items.toLocaleString() : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Spy pipeline</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-1)' }}>Primary API</span>
                </div>
              </div>
              {/* Competitors */}
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 8 }}>Competitors ({loc.competitors.length})</div>
                {loc.competitors.map((c, i) => {
                  const isBlocked = loc.blocked.includes(c);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < loc.competitors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{c}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: isBlocked ? 'var(--danger)' : 'var(--accent)' }}>{isBlocked ? 'Blocked' : 'Tracking'}</span>
                    </div>
                  );
                })}
              </div>
              {/* Location details */}
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--text-3)', marginBottom: 8 }}>Location details</div>
                {[
                  ['Market tier', `${loc.market} · $${slotCostPerSlot(loc.market)}/slot`],
                  ['Monthly slot cost', `$${cost.toLocaleString()}`],
                  ['DCC license', loc.license],
                  ['Active since', 'Mar 2026'],
                ].map(([k, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{k}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: k === 'Monthly slot cost' ? 'var(--accent)' : 'var(--text-1)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Detail actions */}
            <div style={{ padding: '10px 20px 14px 54px', display: 'flex', gap: 8, borderTop: '1px solid var(--border)' }}>
              <button style={btnBase} onClick={() => navigate('/locations')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                Open dashboard
              </button>
              <button style={btnBase} onClick={() => showToast('Competitor discovery opened')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                Add competitors
              </button>
              <button style={btnBase} onClick={() => showToast(`Spy run queued for ${loc.name}`)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>
                Spy now
              </button>
              <button style={btnBase} onClick={() => showToast('Edit location opened')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 11, height: 11 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function TableCard({ title, sub, locs: rows, headerCols }: { title: string; sub: string; locs: Location[]; headerCols: string[] }) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: 'var(--surface-2)' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{title}</span>
          <span style={{ fontSize: 11, color: 'var(--text-2)', marginLeft: 4 }}>{sub}</span>
        </div>
        <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <TableHeader cols={headerCols} />
        </div>
        {rows.map(loc => <LocRow key={loc.id} loc={loc} />)}
      </div>
    );
  }

  const statPillStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '7px 14px', flexShrink: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)', cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Location Management</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>Catalyst Group MSO · {locs.length} locations</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }} onClick={() => showToast('All locations queued for next spy run · 2 AM')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" /></svg>
            Spy all now
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 18px rgba(9,161,161,0.32)' }} onClick={() => setShowAddModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add location
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '12px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' as const }}>
        {[
          { n: locs.length, label: 'Total locations', color: 'var(--accent)' },
          { n: active.length, label: 'Active', color: 'var(--text-1)' },
          { n: inactive.length, label: 'Inactive', color: 'var(--rose)' },
        ].map(s => (
          <div key={s.label} style={statPillStyle}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{s.label}</div>
            </div>
          </div>
        ))}
        <div style={{ width: 1, height: 28, background: 'var(--border-2)', flexShrink: 0, margin: '0 2px' }} />
        {[
          { n: totalTrack, label: 'Track slots', color: 'var(--accent)' },
          { n: totalBlock, label: 'Block slots', color: 'var(--rose)' },
        ].map(s => (
          <div key={s.label} style={statPillStyle}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>{s.label}</div>
            </div>
          </div>
        ))}
        <div style={{ width: 1, height: 28, background: 'var(--border-2)', flexShrink: 0, margin: '0 2px' }} />
        <div style={statPillStyle}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>{totalSkus.toLocaleString()}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>SKUs tracked</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          Spy pipeline healthy · Last run 2:47 AM
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <TableCard title="Active locations" sub={`— ${active.length} of ${locs.length} · Click a row to expand details`} locs={active} headerCols={['Location', 'Market', 'License', 'Spy status', 'Slots', 'Status', 'Actions']} />
        <TableCard title="Inactive locations" sub="— 1 · Spying paused · Slots not billed" locs={inactive} headerCols={['Location', 'Market', 'License', 'Last spy run', 'Slots', 'Status', 'Actions']} />
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,28,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: 24, width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Add a new location</div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>Spying begins within the next scheduled window (2–5 AM Pacific). You will be billed for slots immediately on activation.</div>
            {[['Location name', 'e.g. WeHo Flagship', 'text'], ['Street address', 'e.g. 8001 Santa Monica Blvd, West Hollywood, CA', 'text']].map(([label, placeholder, type]) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>{label}</label>
                <input type={type} placeholder={placeholder} style={{ width: '100%', padding: '8px 11px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>Market tier</label>
                <select style={{ width: '100%', padding: '8px 11px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none', appearance: 'none', WebkitAppearance: 'none' }}>
                  <option>Standard — $100/slot</option><option>Competitive — $150/slot</option><option>Hot — $200/slot</option><option>Elite — $250/slot</option>
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>DCC license #</label>
                <input type="text" placeholder="C10-0000000-LIC" style={{ width: '100%', padding: '8px 11px', borderRadius: 'var(--r-sm)', border: '1.5px solid var(--border-2)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 13, outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }} onClick={() => { setShowAddModal(false); showToast('Location added · Spy scheduled for 2 AM'); }}>Add location</button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate modal */}
      {showDeactivateModal && (() => {
        const loc = locs.find(l => l.id === showDeactivateModal);
        return loc ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,20,28,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowDeactivateModal(null)}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r)', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', padding: 24, width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>Deactivate {loc.name}?</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>Spying on this location will pause immediately. Active blocks remain reserved but billing stops. You can reactivate at any time.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }} onClick={() => setShowDeactivateModal(null)}>Cancel</button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid rgba(224,90,106,0.35)', background: 'transparent', color: 'var(--danger)' }} onClick={() => deactivate(loc.id)}>Deactivate</button>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'var(--text-1)', color: 'var(--surface)', padding: '9px 18px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', zIndex: 9000, letterSpacing: '0.04em' }}>
          {toast}
        </div>
      )}
    </div>
  );
}
