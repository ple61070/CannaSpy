import { useState } from 'react';

interface Reply {
  author: string;
  role?: string;
  body: string;
  time: string;
}

interface Annotation {
  id: string;
  authorInitials: string;
  authorBg: string;
  author: string;
  rivalLabel: string;
  rivalBg: string;
  rivalColor: string;
  contextLabel?: string;
  contextBg?: string;
  contextColor?: string;
  time: string;
  body: string;
  tags: { label: string; type: 'flag' | 'insight' | 'question' | 'plain' }[];
  reactions: { emoji: string; count: number }[];
  replyLabel: string;
  status: 'Open' | 'Resolved';
  resolved?: boolean;
  replies: Reply[];
  open?: boolean;
}

const INIT_ANNOTATIONS: Annotation[] = [
  {
    id: 'card-1',
    authorInitials: 'PS', authorBg: '#09A1A1', author: 'Patrick S.',
    rivalLabel: 'STIIIZY WeHo', rivalBg: 'rgba(224,90,106,0.1)', rivalColor: 'var(--danger)',
    contextLabel: 'Flower pricing', contextBg: 'var(--surface-3)', contextColor: 'var(--text-3)',
    time: '2 hours ago',
    body: "STIIIZY dropped their Tropic Jack 3.5g from $18 to $14 overnight — same price as us now. This is the third time they have matched us on a Friendly Farms SKU in 30 days. Either they are watching us closely or reacting to the same distributor pricing pressure. Worth escalating to the buying team before we respond.",
    tags: [
      { label: '🚩 Flag', type: 'flag' },
      { label: '💡 Price intel', type: 'insight' },
      { label: 'Flower', type: 'plain' },
      { label: 'Friendly Farms', type: 'plain' },
    ],
    reactions: [{ emoji: '👀', count: 3 }, { emoji: '🔥', count: 1 }],
    replyLabel: 'Reply',
    status: 'Open',
    open: true,
    replies: [
      { author: 'Maria G.', role: 'Buying Manager', body: 'Confirming — distributor told us Friendly Farms raised their floor price last week. STIIIZY probably got the same memo. I will check if we should hold or meet them.', time: '45 min ago' },
      { author: 'Patrick S.', body: 'Good to know. Hold for now — if we match we give up $4/unit across all WeHo locations. Let CannaSpy track if they go lower again.', time: '32 min ago' },
    ],
  },
  {
    id: 'card-2',
    authorInitials: 'MG', authorBg: '#d4900a', author: 'Maria G.',
    rivalLabel: 'MedMen WeHo', rivalBg: 'rgba(212,144,10,0.18)', rivalColor: 'var(--warm)',
    contextLabel: 'Happy hour', contextBg: 'var(--surface-3)', contextColor: 'var(--text-3)',
    time: '5 hours ago',
    body: 'MedMen happy hour is now running 4–7 PM every day on Friendly Farms Vapes. That is 3 hours of below-market pricing on our #1 SKU. We need a counter-move — either a loyalty program for afternoon customers or targeted SMS during those hours.',
    tags: [
      { label: '❓ Question', type: 'question' },
      { label: 'Vapes', type: 'plain' },
      { label: 'Promotions', type: 'plain' },
    ],
    reactions: [{ emoji: '💬', count: 2 }],
    replyLabel: 'Reply · 1 reply',
    status: 'Open',
    replies: [],
  },
  {
    id: 'card-3',
    authorInitials: 'JK', authorBg: '#5484A4', author: 'James K.',
    rivalLabel: 'Off The Charts DTLA', rivalBg: 'rgba(84,132,164,0.12)', rivalColor: 'var(--slate)',
    time: 'Yesterday, 3:14 PM',
    body: 'Off The Charts added 14 new Jeeter SKUs this week. They are clearly pushing the Jeeter relationship hard — might be exclusive or preferred vendor pricing. We carry 6 Jeeter SKUs. This is worth a call to our Jeeter rep to understand if OTC is getting better terms.',
    tags: [
      { label: '💡 Insight', type: 'insight' },
      { label: 'Jeeter', type: 'plain' },
      { label: 'New SKUs', type: 'plain' },
    ],
    reactions: [{ emoji: '👀', count: 4 }],
    replyLabel: 'Reply',
    status: 'Open',
    replies: [],
  },
  {
    id: 'card-4',
    authorInitials: 'PS', authorBg: '#09A1A1', author: 'Patrick S.',
    rivalLabel: 'STIIIZY WeHo', rivalBg: 'rgba(211,150,166,0.11)', rivalColor: 'var(--rose)',
    time: 'Yesterday, 10:22 AM',
    body: 'Confirmed: STIIIZY WeHo is running a 4/20 pre-sale through April 19. Their Blue Dream 3.5g went from $18 to $12 — below our cost. Not matching this. Will monitor for when it reverts.',
    tags: [
      { label: '💡 Insight', type: 'insight' },
      { label: '4/20', type: 'plain' },
    ],
    reactions: [{ emoji: '✅', count: 2 }],
    replyLabel: 'Reply',
    status: 'Resolved',
    resolved: true,
    replies: [],
  },
];

type TagType = 'flag' | 'insight' | 'question' | 'fyi';

function tagBg(type: 'flag' | 'insight' | 'question' | 'plain') {
  if (type === 'flag') return 'rgba(224,90,106,0.1)';
  if (type === 'insight') return 'rgba(9,161,161,0.10)';
  if (type === 'question') return 'rgba(212,144,10,0.18)';
  return 'var(--surface-3)';
}
function tagColor(type: 'flag' | 'insight' | 'question' | 'plain') {
  if (type === 'flag') return 'var(--danger)';
  if (type === 'insight') return 'var(--accent)';
  if (type === 'question') return 'var(--warm)';
  return 'var(--text-3)';
}

const DATE_GROUPS = [
  { label: 'Today — Apr 16', ids: ['card-1', 'card-2'] },
  { label: 'Yesterday — Apr 15', ids: ['card-3', 'card-4'] },
];

const CP_TAG_CONFIG: { key: TagType; label: string; selClass: string; bg: string; color: string }[] = [
  { key: 'flag',     label: '🚩 Flag',     selClass: 'flag',     bg: 'var(--danger)', color: '#fff' },
  { key: 'insight',  label: '💡 Insight',  selClass: 'insight',  bg: 'var(--accent)', color: '#fff' },
  { key: 'question', label: '❓ Question', selClass: 'question', bg: 'var(--warm)',   color: '#fff' },
  { key: 'fyi',      label: '📌 FYI',      selClass: 'fyi',      bg: 'var(--slate)',  color: '#fff' },
];

const ASSIGNEES = [
  { initials: 'PS', bg: '#09A1A1', name: 'Patrick S.' },
  { initials: 'MG', bg: '#d4900a', name: 'Maria G.' },
  { initials: 'JK', bg: '#5484A4', name: 'James K.' },
  { initials: 'RM', bg: '#D396A6', name: 'Rosa M.' },
];

export default function TeamAnnotations() {
  const [annotations, setAnnotations] = useState<Annotation[]>(INIT_ANNOTATIONS);
  const [openCards, setOpenCards] = useState<Set<string>>(new Set(['card-1']));
  const [toast, setToast] = useState<string | null>(null);
  const [toastColor, setToastColor] = useState('var(--accent)');

  // Filter bar state
  const [rivalFilter, setRivalFilter] = useState('All rivals');
  const [typeFilter, setTypeFilter] = useState('All types');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [rivalOpen, setRivalOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Compose state
  const [cpRival, setCpRival] = useState('STIIIZY WeHo');
  const [cpRivalOpen, setCpRivalOpen] = useState(false);
  const [cpContext, setCpContext] = useState('');
  const [cpNote, setCpNote] = useState('');
  const [cpTag, setCpTag] = useState<TagType>('flag');
  const [cpAssigned, setCpAssigned] = useState<Set<string>>(new Set(['PS']));

  function showToast(msg: string, color = 'var(--accent)') {
    setToast(msg);
    setToastColor(color);
    setTimeout(() => setToast(null), 2400);
  }

  function toggleCard(id: string) {
    setOpenCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAssignee(initials: string) {
    setCpAssigned(prev => {
      const next = new Set(prev);
      if (next.has(initials)) next.delete(initials); else next.add(initials);
      return next;
    });
  }

  function postAnnotation() {
    if (!cpNote.trim()) { showToast('Add a note before posting', 'var(--warm)'); return; }
    showToast('Annotation posted — team notified', 'var(--accent)');
    setCpNote('');
    setCpContext('');
  }

  const closeDropdowns = () => { setRivalOpen(false); setTypeOpen(false); setStatusOpen(false); setCpRivalOpen(false); };

  const ddStyle: React.CSSProperties = {
    position: 'absolute', top: 'calc(100% + 5px)', left: 0,
    background: 'var(--surface)', border: '1px solid var(--border-2)',
    borderRadius: 'var(--r-sm)', boxShadow: '0 8px 32px rgba(30,60,80,0.14)',
    zIndex: 200, minWidth: 160, padding: 5,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }} onClick={closeDropdowns}>
      {/* Topbar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Team Annotations</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>SHARED CONTEXT ON COMPETITOR INTELLIGENCE</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={() => document.getElementById('cp-note-input')?.focus()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New annotation
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Rival filter */}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Rival</span>
        <div style={{ position: 'relative' }}>
          <div onClick={e => { e.stopPropagation(); setRivalOpen(o => !o); setTypeOpen(false); setStatusOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
            {rivalFilter}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {rivalOpen && (
            <div style={ddStyle}>
              {['All rivals', 'STIIIZY', 'MedMen', 'Off The Charts'].map(opt => (
                <div key={opt} onClick={e => { e.stopPropagation(); setRivalFilter(opt); setRivalOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === rivalFilter ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === rivalFilter ? 700 : 400, cursor: 'pointer' }}>
                  {opt} {opt === rivalFilter ? '✓' : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px', flexShrink: 0 }}/>

        {/* Type filter */}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Type</span>
        <div style={{ position: 'relative' }}>
          <div onClick={e => { e.stopPropagation(); setTypeOpen(o => !o); setRivalOpen(false); setStatusOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer' }}>
            {typeFilter}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {typeOpen && (
            <div style={ddStyle}>
              {['All types', 'Flag', 'Insight', 'Question'].map(opt => (
                <div key={opt} onClick={e => { e.stopPropagation(); setTypeFilter(opt); setTypeOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === typeFilter ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === typeFilter ? 700 : 400, cursor: 'pointer' }}>
                  {opt} {opt === typeFilter ? '✓' : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border-2)', margin: '0 4px', flexShrink: 0 }}/>

        {/* Status filter */}
        <span style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Status</span>
        <div style={{ position: 'relative' }}>
          <div onClick={e => { e.stopPropagation(); setStatusOpen(o => !o); setRivalOpen(false); setTypeOpen(false); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer' }}>
            {statusFilter}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          {statusOpen && (
            <div style={ddStyle}>
              {['Open', 'Resolved', 'All'].map(opt => (
                <div key={opt} onClick={e => { e.stopPropagation(); setStatusFilter(opt); setStatusOpen(false); showToast('Filter updated'); }}
                  style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === statusFilter ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === statusFilter ? 700 : 400, cursor: 'pointer' }}>
                  {opt} {opt === statusFilter ? '✓' : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>7 open · 3 assigned to you</div>
      </div>

      {/* Two-pane */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Annotation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', minHeight: 0 }}>
          {DATE_GROUPS.map(group => {
            const groupAnns = annotations.filter(a => group.ids.includes(a.id));
            return (
              <div key={group.label} style={{ marginBottom: 24 }}>
                {/* Group label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
                  {group.label}
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
                </div>

                {groupAnns.map(ann => {
                  const isOpen = openCards.has(ann.id);
                  return (
                    <div key={ann.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--card-shadow)', marginBottom: 10, overflow: 'hidden', opacity: ann.resolved ? 0.65 : 1 }}>
                      {/* Card header */}
                      <div style={{ padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }} onClick={() => toggleCard(ann.id)}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: ann.authorBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 1 }}>{ann.authorInitials}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' as const }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{ann.author}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, marginLeft: 6, background: ann.rivalBg, color: ann.rivalColor }}>{ann.rivalLabel}</span>
                            {ann.contextLabel && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, marginLeft: 2, background: ann.contextBg, color: ann.contextColor }}>{ann.contextLabel}</span>
                            )}
                          </div>
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)' }}>{ann.time}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-1)', lineHeight: 1.6, marginTop: 5 }}>{ann.body}</div>
                          <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' as const }}>
                            {ann.tags.map(t => (
                              <span key={t.label} style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 10, background: tagBg(t.type), color: tagColor(t.type) }}>{t.label}</span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            {ann.reactions.map(r => (
                              <span key={r.emoji} onClick={e => { e.stopPropagation(); showToast('Reaction added'); }}
                                style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                                {r.emoji} {r.count}
                              </span>
                            ))}
                            <span onClick={e => { e.stopPropagation(); document.getElementById('cp-note-input')?.focus(); }}
                              style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, color: 'var(--text-3)', cursor: 'pointer', marginLeft: 'auto' }}>
                              {ann.replyLabel}
                            </span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: ann.status === 'Open' ? 'rgba(224,90,106,0.1)' : 'rgba(9,161,161,0.10)', color: ann.status === 'Open' ? 'var(--danger)' : 'var(--accent)' }}>
                              {ann.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Thread replies */}
                      {isOpen && ann.replies.length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                          {ann.replies.map((r, ri) => (
                            <div key={ri} style={{ padding: '10px 14px 10px 54px', borderBottom: ri < ann.replies.length - 1 ? '1px solid var(--border)' : 'none' }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', marginBottom: 3 }}>
                                {r.author}{r.role && <span style={{ fontWeight: 400, color: 'var(--text-3)' }}> · {r.role}</span>}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-1)', lineHeight: 1.5 }}>{r.body}</div>
                              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 3 }}>{r.time}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Compose panel */}
        <div style={{ width: 340, flexShrink: 0, background: 'var(--surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>New Annotation</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>Visible to all team members with access</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Rival */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Rival</div>
              <div style={{ position: 'relative' }}>
                <div onClick={e => { e.stopPropagation(); setCpRivalOpen(o => !o); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, border: '1.5px solid var(--border-2)', background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
                  {cpRival}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ width: 10, height: 10, opacity: 0.6 }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {cpRivalOpen && (
                  <div style={{ ...ddStyle, width: '100%' }}>
                    {['STIIIZY WeHo', 'MedMen WeHo', 'Off The Charts DTLA', 'Catalyst WeHo', 'General market'].map(opt => (
                      <div key={opt} onClick={e => { e.stopPropagation(); setCpRival(opt); setCpRivalOpen(false); }}
                        style={{ padding: '7px 10px', borderRadius: 6, fontSize: 12, color: opt === cpRival ? 'var(--accent)' : 'var(--text-1)', fontWeight: opt === cpRival ? 700 : 400, cursor: 'pointer' }}>
                        {opt} {opt === cpRival ? '✓' : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Context */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Context (optional)</div>
              <input
                id="cp-context-input"
                value={cpContext}
                onChange={e => setCpContext(e.target.value)}
                placeholder="e.g. Flower pricing, Happy hour, New SKU…"
                style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Note */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Note</div>
              <textarea
                id="cp-note-input"
                value={cpNote}
                onChange={e => setCpNote(e.target.value)}
                placeholder="What did you observe? What action, if any, should the team take?"
                style={{ width: '100%', padding: '9px 10px', border: '1.5px solid var(--border-2)', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 12, outline: 'none', resize: 'none', minHeight: 80, lineHeight: 1.5, boxSizing: 'border-box' }}
              />
            </div>

            {/* Tag */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Tag</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                {CP_TAG_CONFIG.map(t => {
                  const active = cpTag === t.key;
                  return (
                    <span key={t.key} onClick={() => setCpTag(t.key)}
                      style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 600, padding: '4px 9px', borderRadius: 10, border: `1.5px solid ${active ? t.bg : 'var(--border-2)'}`, cursor: 'pointer', background: active ? t.bg : 'transparent', color: active ? t.color : 'var(--text-2)', transition: 'all 0.15s' }}>
                      {t.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Assign to */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Assign to</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {ASSIGNEES.map(a => {
                  const sel = cpAssigned.has(a.initials);
                  return (
                    <div key={a.initials} title={a.name} onClick={() => toggleAssignee(a.initials)}
                      style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer', background: a.bg, opacity: sel ? 1 : 0.45, border: sel ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent', transition: 'opacity 0.15s' }}>
                      {a.initials}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={postAnnotation}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '8px 13px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', border: '1.5px solid var(--accent)', background: 'var(--accent)', color: '#fff' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ width: 12, height: 12 }}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Post annotation
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 'var(--r-sm)', padding: '11px 18px', fontSize: 12, fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9000, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: toastColor, flexShrink: 0 }}/>
          {toast}
        </div>
      )}
    </div>
  );
}
