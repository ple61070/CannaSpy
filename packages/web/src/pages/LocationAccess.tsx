import React, { useState } from 'react';

const MEMBERS = [
  { id: 'ps', name: 'Patrick S.', role: 'admin',   color: '#09A1A1', title: 'Founder & CEO' },
  { id: 'mg', name: 'Maria G.',   role: 'manager', color: '#d4900a', title: 'Buying Manager' },
  { id: 'jk', name: 'James K.',   role: 'manager', color: '#5484A4', title: 'Director of Ops' },
  { id: 'rm', name: 'Rosa M.',    role: 'viewer',  color: '#D396A6', title: 'Store Manager — WeHo' },
  { id: 'td', name: 'Tom D.',     role: 'viewer',  color: '#e05a6a', title: 'Store Manager — DTLA' },
] as const;

type MemberId = 'ps' | 'mg' | 'jk' | 'rm' | 'td';
type LocId = 'weho' | 'dtla1' | 'dtla2' | 'lb' | 'oak' | 'sf' | 'sac' | 'oc' | 'riv' | 'sd';

const LOCATIONS: { id: LocId; name: string; market: string }[] = [
  { id: 'weho',  name: 'WeHo Flagship',   market: 'Elite' },
  { id: 'dtla1', name: 'DTLA East',        market: 'Elite' },
  { id: 'dtla2', name: 'DTLA Arts',        market: 'Elite' },
  { id: 'lb',    name: 'Long Beach',       market: 'Competitive' },
  { id: 'oak',   name: 'Oakland',          market: 'Hot' },
  { id: 'sf',    name: 'SF SoMa',          market: 'Elite' },
  { id: 'sac',   name: 'Sacramento',       market: 'Competitive' },
  { id: 'oc',    name: 'Orange County',    market: 'Standard' },
  { id: 'riv',   name: 'Riverside/Corona', market: 'Standard' },
  { id: 'sd',    name: 'San Diego',        market: 'Hot' },
];

type AccessMap = Record<MemberId, Record<LocId, boolean>>;

const INITIAL_ACCESS: AccessMap = {
  ps: { weho: true, dtla1: true, dtla2: true, lb: true, oak: true, sf: true, sac: true, oc: true, riv: true, sd: true },
  mg: { weho: true, dtla1: true, dtla2: true, lb: true, oak: true, sf: true, sac: true, oc: true, riv: true, sd: true },
  jk: { weho: true, dtla1: true, dtla2: true, lb: true, oak: true, sf: true, sac: true, oc: true, riv: true, sd: true },
  rm: { weho: true, dtla1: false, dtla2: false, lb: false, oak: false, sf: false, sac: false, oc: false, riv: false, sd: false },
  td: { weho: false, dtla1: true, dtla2: true, lb: false, oak: false, sf: false, sac: false, oc: false, riv: false, sd: false },
};

const MARKET_COLORS: Record<string, string> = {
  Elite: 'var(--danger)',
  Hot: 'var(--warm)',
  Competitive: 'var(--accent)',
  Standard: 'var(--text-3)',
};

const ROLE_LABELS: Record<string, string> = { admin: 'Admin', manager: 'Manager', viewer: 'Viewer' };
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin:   { bg: 'rgba(224,90,106,0.1)', color: 'var(--danger)' },
  manager: { bg: 'rgba(212,144,10,0.15)', color: 'var(--warm)' },
  viewer:  { bg: 'var(--surface-3)', color: 'var(--text-3)' },
};

const CheckSVG = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{ width: 11, height: 11 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function LocationAccess() {
  const [access, setAccess] = useState<AccessMap>(INITIAL_ACCESS);
  const [toast, setToast] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('manager');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const toggleAccess = (memberId: MemberId, locId: LocId) => {
    const newVal = !access[memberId][locId];
    setAccess(prev => ({ ...prev, [memberId]: { ...prev[memberId], [locId]: newVal } }));
    const member = MEMBERS.find(m => m.id === memberId);
    const loc = LOCATIONS.find(l => l.id === locId);
    showToast(`${newVal ? 'Granted' : 'Removed'}: ${member?.name} — ${loc?.name}`);
  };

  const sendInvite = () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showToast('Enter a valid email address');
      return;
    }
    showToast(`Invite sent to ${inviteEmail} (${ROLE_LABELS[inviteRole]})`);
    setInviteEmail('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Location Access Control</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>ADMIN · WHO SEES WHAT</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => showToast('Access changes saved')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><polyline points="20 6 9 17 4 12" /></svg>
            Save changes
          </button>
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}
            onClick={() => (document.getElementById('invite-email') as HTMLInputElement)?.focus()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Invite member
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

        {/* Info callout */}
        <div style={{ background: 'var(--accent-soft)', border: '1px solid rgba(9,161,161,0.2)', borderRadius: 'var(--r-sm)', padding: '11px 14px', display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 16 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div style={{ fontSize: 11, color: 'var(--text-2)', lineHeight: 1.5 }}>
            <strong>Admin access:</strong> Admins see all locations and cannot be restricted. Managers and Viewers only see locations you grant them. Access changes take effect immediately.
          </div>
        </div>

        {/* Matrix card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>Team Access Matrix</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginLeft: 'auto' }}>5 members · 10 locations · Click checkboxes to toggle</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)', minWidth: 180 }}>Member</th>
                  {LOCATIONS.map(loc => (
                    <th key={loc.id} style={{ padding: '10px 14px', textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', borderBottom: '2px solid var(--border-2)', background: 'var(--surface-2)', minWidth: 90, whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 8, color: MARKET_COLORS[loc.market], marginBottom: 2 }}>{loc.market}</div>
                      {loc.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEMBERS.map(m => (
                  <tr key={m.id}>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {m.id.toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{m.name}</div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{m.title}</div>
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 3, marginLeft: 6, ...ROLE_COLORS[m.role] }}>
                          {ROLE_LABELS[m.role]}
                        </span>
                      </div>
                    </td>
                    {LOCATIONS.map(loc => {
                      const isAdmin = m.role === 'admin';
                      const isOn = access[m.id as MemberId][loc.id];
                      return (
                        <td key={loc.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle', textAlign: 'center' }}>
                          <div
                            onClick={isAdmin ? undefined : () => toggleAccess(m.id as MemberId, loc.id)}
                            style={{
                              width: 20, height: 20, borderRadius: 5,
                              border: isAdmin ? '2px solid var(--danger)' : '2px solid var(--border-2)',
                              background: isAdmin ? 'rgba(224,90,106,0.08)' : (isOn ? 'var(--accent)' : 'var(--surface-3)'),
                              cursor: isAdmin ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto', transition: 'all 0.15s',
                            }}
                          >
                            {(isAdmin || isOn) && <CheckSVG />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)' }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>Invite Team Member</div>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '14px 16px', alignItems: 'center' }}>
            <input
              id="invite-email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="colleague@yourcompany.com"
              style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              style={{ padding: '7px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 11, outline: 'none', cursor: 'pointer' }}
            >
              <option value="viewer">Viewer</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={sendInvite}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              Send invite
            </button>
          </div>
          {/* Role legend */}
          <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { color: 'var(--danger)', label: 'Admin — full access, all locations, can manage team' },
              { color: 'var(--warm)', label: 'Manager — granted locations, can add tracking and blocks' },
              { color: 'var(--text-3)', label: 'Viewer — granted locations, read-only, no blocking' },
            ].map(item => (
              <div key={item.label} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                {item.label}
              </div>
            ))}
          </div>
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
