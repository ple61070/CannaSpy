import React, { useState } from 'react';

type TabKey = 'open' | 'progress' | 'done' | 'all';

interface Task {
  id: number;
  title: string;
  type: string;
  typeClass: string;
  priority: 'high' | 'medium' | 'low';
  rival?: string;
  source: string;
  dueText: string;
  dueClass: string;
  assignees: { initials: string; color: string }[];
  triggerText: string;
  context?: string;
  status: TabKey;
}

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
  'Price response': { bg: 'rgba(9,161,161,0.12)', color: 'var(--accent)' },
  'Promo response': { bg: 'rgba(212,144,10,0.15)', color: 'var(--warm)' },
  'POS update':     { bg: 'rgba(84,132,164,0.12)', color: 'var(--slate)' },
  'Menu update':    { bg: 'rgba(211,150,166,0.11)', color: 'var(--rose)' },
  'Block action':   { bg: 'rgba(224,90,106,0.1)', color: 'var(--danger)' },
};
const PRI_STYLES: Record<string, { bg: string; color: string }> = {
  high:   { bg: 'rgba(224,90,106,0.1)', color: 'var(--danger)' },
  medium: { bg: 'rgba(212,144,10,0.15)', color: 'var(--warm)' },
  low:    { bg: 'var(--surface-3)', color: 'var(--text-3)' },
};
const DUE_COLORS: Record<string, string> = {
  'due-urgent': 'var(--danger)',
  'due-soon': 'var(--warm)',
  'due-ok': 'var(--text-3)',
};

const OPEN_TASKS: Task[] = [
  { id: 1, title: 'Review pricing response — STIIIZY Tropic Jack 3.5g dropped to $14', type: 'Price response', typeClass: 'type-price', priority: 'high', rival: 'STIIIZY WeHo', source: 'WeHo Flagship', dueText: 'Due today', dueClass: 'due-urgent', assignees: [{ initials: 'PS', color: '#09A1A1' }, { initials: 'MG', color: '#d4900a' }], triggerText: 'Price drop alert — STIIIZY WeHo · Tropic Jack 3.5g $18 → $14 (−22%)', context: 'STIIIZY dropped Tropic Jack 3.5g from $18 to $14 — now at parity with our price. This is their third price match on a Friendly Farms SKU in 30 days. Pattern suggests they are monitoring our pricing closely. Our margin on this SKU at $14 is 31%. At $12 it drops to 18%.', status: 'open' },
  { id: 2, title: 'Update POS pricing — match STIIIZY Tropic Jack or hold at $18', type: 'POS update', typeClass: 'type-pos', priority: 'high', rival: 'STIIIZY WeHo', source: 'WeHo Flagship', dueText: 'Due today', dueClass: 'due-urgent', assignees: [{ initials: 'MG', color: '#d4900a' }], triggerText: 'Linked to task #1 — price decision must happen first', status: 'open' },
  { id: 3, title: 'Update menu listing — verify our pricing reflects current menu', type: 'Menu update', typeClass: 'type-menu-update', priority: 'high', source: 'All locations', dueText: 'Due today', dueClass: 'due-urgent', assignees: [{ initials: 'JK', color: '#5484A4' }], triggerText: 'Price change alert — menu may be out of sync with POS', status: 'open' },
  { id: 4, title: 'Counter MedMen WeHo happy hour — evaluate afternoon promo options', type: 'Promo response', typeClass: 'type-promo', priority: 'medium', rival: 'MedMen WeHo', source: 'WeHo Flagship', dueText: 'Due Apr 18', dueClass: 'due-soon', assignees: [{ initials: 'PS', color: '#09A1A1' }], triggerText: 'Recurring promo alert — MedMen 4-7 PM daily on FF Vapes', status: 'open' },
  { id: 5, title: 'Call Jeeter rep — confirm if OTC has preferential pricing on new SKUs', type: 'Price response', typeClass: 'type-price', priority: 'medium', rival: 'Off The Charts', source: 'DTLA East', dueText: 'Due Apr 19', dueClass: 'due-soon', assignees: [{ initials: 'PS', color: '#09A1A1' }], triggerText: 'New SKU alert — Off The Charts added 14 Jeeter SKUs in 7 days', status: 'open' },
  { id: 6, title: 'Evaluate blocking Cookies WeHo — new rival 1.4mi from flagship', type: 'Block action', typeClass: 'type-block', priority: 'medium', rival: 'Cookies WeHo', source: 'WeHo Flagship', dueText: 'Due Apr 20', dueClass: 'due-ok', assignees: [{ initials: 'PS', color: '#09A1A1' }, { initials: 'RM', color: '#D396A6' }], triggerText: 'New rival alert — Cookies WeHo opened Apr 14 with 84 SKUs, 12 overlap', status: 'open' },
  { id: 7, title: 'Review Raw Garden SKU gap — Catalyst carries 8 SKUs we do not stock', type: 'Price response', typeClass: 'type-price', priority: 'low', rival: 'Catalyst', source: 'WeHo Flagship', dueText: 'Due Apr 22', dueClass: 'due-ok', assignees: [{ initials: 'MG', color: '#d4900a' }], triggerText: 'SKU gap detected — 8 Raw Garden items at Catalyst not in our inventory', status: 'open' },
];

const PROGRESS_TASKS: Task[] = [
  { id: 8, title: 'Update POS for 4/20 promotion — price drop in effect through Apr 20', type: 'POS update', typeClass: 'type-pos', priority: 'high', source: 'All locations', dueText: 'Due Apr 17', dueClass: 'due-urgent', assignees: [{ initials: 'JK', color: '#5484A4' }], triggerText: 'Promo schedule update — 4/20 pricing live Apr 17', status: 'progress' },
  { id: 9, title: 'Update menu listing — 4/20 specials need to be listed by 9 AM', type: 'Menu update', typeClass: 'type-menu-update', priority: 'medium', source: 'WeHo + DTLA', dueText: 'Due Apr 17', dueClass: 'due-urgent', assignees: [{ initials: 'JK', color: '#5484A4' }], triggerText: 'Linked to task #8 — 4/20 specials', status: 'progress' },
  { id: 10, title: 'Brief floor staff — MedMen happy hour starts 4 PM, prepare response talking points', type: 'Promo response', typeClass: 'type-promo', priority: 'low', rival: 'MedMen WeHo', source: 'WeHo Flagship', dueText: 'Due Apr 17', dueClass: 'due-soon', assignees: [{ initials: 'RM', color: '#D396A6' }], triggerText: 'Recurring promo alert — MedMen happy hour 4-7 PM', status: 'progress' },
];

const DONE_TASKS: Task[] = [
  { id: 11, title: 'Reviewed STIIIZY weekend flash — decision: hold pricing, monitor through Sunday', type: 'Price response', typeClass: 'type-price', priority: 'medium', source: 'WeHo Flagship', dueText: 'Done Apr 14 · Patrick S.', dueClass: 'due-ok', assignees: [], triggerText: '', status: 'done' },
  { id: 12, title: 'Updated menu listing — added Friendly Farms new vape SKUs to listing', type: 'Menu update', typeClass: 'type-menu-update', priority: 'low', source: 'All locations', dueText: 'Done Apr 13 · James K.', dueClass: 'due-ok', assignees: [], triggerText: '', status: 'done' },
  { id: 13, title: 'POS updated — Kanha edibles sale price loaded for all WeHo terminals', type: 'POS update', typeClass: 'type-pos', priority: 'low', source: 'WeHo Flagship', dueText: 'Done Apr 12 · Maria G.', dueClass: 'due-ok', assignees: [], triggerText: '', status: 'done' },
];

const ALL_TASKS = [...OPEN_TASKS, ...PROGRESS_TASKS, ...DONE_TASKS];

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} style={{ width: 10, height: 10 }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function ActionQueue() {
  const [activeTab, setActiveTab] = useState<TabKey>('open');
  const [selectedTaskId, setSelectedTaskId] = useState<number>(1);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [dpStatus, setDpStatus] = useState<string>('open');
  const [dpNotes, setDpNotes] = useState('Decision pending — waiting on Maria to confirm margin threshold. If STIIIZY holds at $14 through the weekend, we match. If they revert Monday as usual, we hold.');
  const [toast, setToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('price');
  const [newPriority, setNewPriority] = useState('medium');
  const [newAssignee, setNewAssignee] = useState('Patrick S.');
  const [newDue, setNewDue] = useState('2026-04-18');
  const [newNotes, setNewNotes] = useState('');
  const [assignChips, setAssignChips] = useState<Set<string>>(new Set(['PS', 'MG']));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const toggleCheck = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); showToast('Marked as done'); }
      return next;
    });
  };

  const markDone = () => {
    setDpStatus('done');
    setChecked(prev => new Set([...prev, selectedTaskId]));
    showToast('Task marked as done');
  };

  const toggleAssign = (initials: string) => {
    setAssignChips(prev => {
      const next = new Set(prev);
      if (next.has(initials)) { next.delete(initials); showToast('Assignee removed'); }
      else { next.add(initials); showToast('Assigned — they will be notified'); }
      return next;
    });
  };

  const createTask = () => {
    if (!newTitle.trim()) { showToast('Add a task description first'); return; }
    setShowModal(false);
    setNewTitle('');
    showToast('Task created and assigned');
  };

  const selectedTask = ALL_TASKS.find(t => t.id === selectedTaskId) || OPEN_TASKS[0];

  const visibleTasks = () => {
    if (activeTab === 'open') return OPEN_TASKS;
    if (activeTab === 'progress') return PROGRESS_TASKS;
    if (activeTab === 'done') return DONE_TASKS;
    return ALL_TASKS;
  };

  const borderLeft = (t: Task) => {
    if (t.priority === 'high') return '3px solid var(--danger)';
    if (t.priority === 'medium') return '3px solid var(--warm)';
    return '3px solid transparent';
  };

  const chipChip = (initials: string, color: string) => {
    const assigned = assignChips.has(initials);
    return (
      <div
        key={initials}
        onClick={() => toggleAssign(initials)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          border: assigned ? '1.5px solid var(--accent)' : '1.5px solid var(--border-2)',
          background: assigned ? 'var(--accent-soft)' : 'var(--surface-2)',
          color: assigned ? 'var(--accent)' : 'var(--text-1)',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <div style={{ width: 16, height: 16, borderRadius: 4, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
        {{ PS: 'Patrick S.', MG: 'Maria G.', JK: 'James K.', RM: 'Rosa M.' }[initials] || initials}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Action Queue</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>TASKS GENERATED FROM ALERTS · ASSIGN · TRACK · RESOLVE</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New task
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Assigned to</span>
        <select style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontFamily: 'var(--sans)', outline: 'none' }}>
          <option>Everyone</option>
          <option>Me (Patrick S.)</option>
          <option>Maria G.</option>
          <option>James K.</option>
          <option>Unassigned</option>
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Type</span>
        <select style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)', outline: 'none' }}>
          <option>All types</option>
          <option>Price response</option>
          <option>POS update</option>
          <option>Menu update</option>
          <option>Promo response</option>
          <option>Block action</option>
        </select>
        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Location</span>
        <select style={{ padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer', fontFamily: 'var(--sans)', outline: 'none' }}>
          <option>All locations</option>
          <option>WeHo Flagship</option>
          <option>DTLA East</option>
          <option>SoMa SF</option>
        </select>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>7 open · 3 in progress · 12 resolved this week</div>
      </div>

      {/* Main layout */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', minHeight: 0 }}>
          {/* Summary strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
            {[
              { val: '7', color: 'var(--danger)', label: 'Open tasks' },
              { val: '3', color: 'var(--warm)', label: 'In progress' },
              { val: '12', color: 'var(--accent)', label: 'Done this week' },
              { val: '4.2h', color: 'var(--text-2)', label: 'Avg resolution' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '10px 14px', boxShadow: 'var(--card-shadow)' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, lineHeight: 1, marginBottom: 2, color: s.color }}>{s.val}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: 3, marginBottom: 14, width: 'fit-content' }}>
            {([['open', 'Open', '7'], ['progress', 'In Progress', '3'], ['done', 'Done', '12'], ['all', 'All', '']] as [TabKey, string, string][]).map(([key, label, count]) => (
              <div
                key={key}
                onClick={() => setActiveTab(key)}
                style={{ padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, background: activeTab === key ? 'var(--accent)' : 'transparent', color: activeTab === key ? '#fff' : 'var(--text-3)', transition: 'all 0.15s' }}
              >
                {label}
                {count && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, background: activeTab === key ? 'rgba(255,255,255,0.25)' : 'var(--surface-3)', color: activeTab === key ? '#fff' : 'var(--text-3)' }}>{count}</span>}
              </div>
            ))}
          </div>

          {/* Task cards */}
          {(activeTab === 'open' || activeTab === 'all') && (
            <>
              {(activeTab === 'all' || true) && OPEN_TASKS.filter(t => t.priority === 'high').length > 0 && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '14px 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  High priority <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
              )}
              {OPEN_TASKS.filter(t => t.priority === 'high').map(t => renderTaskCard(t))}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '14px 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                Medium priority <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {OPEN_TASKS.filter(t => t.priority !== 'high').map(t => renderTaskCard(t))}
            </>
          )}
          {(activeTab === 'progress' || activeTab === 'all') && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '14px 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                In progress <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {PROGRESS_TASKS.map(t => renderProgressCard(t))}
            </>
          )}
          {(activeTab === 'done' || activeTab === 'all') && (
            <>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', margin: '14px 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                Completed this week <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              {DONE_TASKS.map(t => renderDoneCard(t))}
            </>
          )}
        </div>

        {/* Detail panel */}
        <div style={{ width: 360, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Panel header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.3 }}>{selectedTask.title}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, ...TYPE_STYLES[selectedTask.type] }}>{selectedTask.type}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, ...PRI_STYLES[selectedTask.priority] }}>{selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)} priority</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: DUE_COLORS[selectedTask.dueClass] }}>{selectedTask.dueText}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={dpStatus}
                onChange={e => { setDpStatus(e.target.value); if (e.target.value === 'done') markDone(); else showToast('Status updated'); }}
                style={{ padding: '5px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 10, outline: 'none', cursor: 'pointer' }}
              >
                <option value="open">Open</option>
                <option value="progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <button
                onClick={markDone}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 'var(--r-sm)', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>
                Mark done
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {/* Triggered by */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Triggered by</div>
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 11px', fontSize: 12, color: 'var(--text-1)', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth={2}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {selectedTask.triggerText}
              </div>
              <div style={{ marginTop: 5, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>Alert fired Apr 16 at 2:51 AM · WeHo Flagship</div>
            </div>

            {/* Context */}
            {selectedTask.context && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Context</div>
                <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '9px 11px', fontSize: 11, color: 'var(--text-1)', lineHeight: 1.6 }}>{selectedTask.context}</div>
              </div>
            )}

            {/* Assign to */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Assign to</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {chipChip('PS', '#09A1A1')}
                {chipChip('MG', '#d4900a')}
                {chipChip('JK', '#5484A4')}
                {chipChip('RM', '#D396A6')}
              </div>
            </div>

            {/* Resolution notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Resolution notes</div>
              <textarea
                value={dpNotes}
                onChange={e => setDpNotes(e.target.value)}
                placeholder="What was decided? What action was taken?"
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none', resize: 'none', minHeight: 70, lineHeight: 1.5 }}
              />
            </div>

            {/* Activity */}
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Activity</div>
              {[
                { dot: 'var(--danger)', body: <><strong>Task created</strong> — Auto-generated from price drop alert</>, time: 'Apr 16, 2:51 AM' },
                { dot: 'var(--accent)', body: <><strong>Patrick S.</strong> assigned Maria G. and added resolution notes</>, time: 'Apr 16, 8:14 AM' },
                { dot: 'var(--warm)', body: <><strong>Maria G.</strong> — checking distributor cost floor before we decide</>, time: 'Apr 16, 9:32 AM' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 10, fontSize: 11 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, marginTop: 4, flexShrink: 0, display: 'inline-block' }} />
                  <div>
                    <div style={{ color: 'var(--text-2)', lineHeight: 1.5 }}>{item.body}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel footer */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            <button onClick={() => showToast('Notes saved')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>Save notes</button>
            <button onClick={markDone} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>
              Mark done
            </button>
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 500 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', zIndex: 501, width: 480, maxWidth: '90vw' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>New Task</div>
              <div onClick={() => setShowModal(false)} style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', background: 'var(--surface-3)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </div>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>Task</div>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="What needs to happen?" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>Type</div>
                  <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }}>
                    <option value="price">Price response</option>
                    <option value="pos">POS update</option>
                    <option value="menu-update">Menu update</option>
                    <option value="promo">Promo response</option>
                    <option value="block">Block action</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>Priority</div>
                  <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>Assign to</div>
                  <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)} style={{ width: '100%', padding: '7px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }}>
                    <option>Patrick S.</option>
                    <option>Maria G.</option>
                    <option>James K.</option>
                    <option>Rosa M.</option>
                    <option>Tom D.</option>
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>Due date</div>
                  <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none' }} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5 }}>Notes</div>
                <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Context, links to alerts, what to check..." style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none', resize: 'none', minHeight: 64 }} />
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--border-2)', background: 'var(--surface-3)', color: 'var(--text-1)' }}>Cancel</button>
              <button onClick={createTask} style={{ padding: '7px 14px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}>Create task</button>
            </div>
          </div>
        </>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, display: 'inline-block' }} />
          {toast}
        </div>
      )}
    </div>
  );

  function renderTaskCard(t: Task) {
    const isSelected = selectedTaskId === t.id;
    const isDone = checked.has(t.id);
    return (
      <div
        key={t.id}
        onClick={() => setSelectedTaskId(t.id)}
        style={{
          background: 'var(--surface)', border: isSelected ? '1px solid var(--border-2)' : '1px solid var(--border)',
          borderLeft: isSelected ? (t.priority === 'high' ? '3px solid var(--danger)' : '3px solid var(--accent)') : borderLeft(t),
          borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', marginBottom: 8, overflow: 'hidden', cursor: 'pointer', opacity: isDone ? 0.55 : 1,
        }}
      >
        <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div
            onClick={e => toggleCheck(e, t.id)}
            style={{ width: 18, height: 18, borderRadius: 5, border: isDone ? '2px solid var(--accent)' : '2px solid var(--border-2)', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? 'var(--accent)' : 'transparent', cursor: 'pointer' }}
          >
            {isDone && <CheckIcon />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isDone ? 'var(--text-3)' : 'var(--text-1)', marginBottom: 3, lineHeight: 1.3, textDecoration: isDone ? 'line-through' : 'none' }}>{t.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, ...TYPE_STYLES[t.type] }}>{t.type}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, ...PRI_STYLES[t.priority] }}>{t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
              {t.rival && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--rose)' }}>{t.rival}</span>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{t.source}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: DUE_COLORS[t.dueClass] }}>{t.dueText}</span>
              <div style={{ display: 'flex', gap: 3, marginLeft: 'auto', flexShrink: 0 }}>
                {t.assignees.map(a => (
                  <div key={a.initials} style={{ width: 20, height: 20, borderRadius: 5, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{a.initials}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderProgressCard(t: Task) {
    return (
      <div
        key={t.id}
        onClick={() => setSelectedTaskId(t.id)}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: borderLeft(t), borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', marginBottom: 8, overflow: 'hidden', cursor: 'pointer' }}
      >
        <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--warm)', border: '2px solid var(--warm)', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 3, lineHeight: 1.3 }}>{t.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, ...TYPE_STYLES[t.type] }}>{t.type}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, ...PRI_STYLES[t.priority] }}>{t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}</span>
              {t.rival && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: 'var(--rose)' }}>{t.rival}</span>}
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{t.source}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: DUE_COLORS[t.dueClass] }}>{t.dueText}</span>
              <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                {t.assignees.map(a => (
                  <div key={a.initials} style={{ width: 20, height: 20, borderRadius: 5, background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: '#fff' }}>{a.initials}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderDoneCard(t: Task) {
    return (
      <div
        key={t.id}
        onClick={() => setSelectedTaskId(t.id)}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--accent)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', marginBottom: 8, overflow: 'hidden', cursor: 'pointer', opacity: 0.55 }}
      >
        <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', border: '2px solid var(--accent)', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 3, lineHeight: 1.3, textDecoration: 'line-through' }}>{t.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, ...TYPE_STYLES[t.type] }}>{t.type}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{t.source}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--accent)' }}>{t.dueText}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
