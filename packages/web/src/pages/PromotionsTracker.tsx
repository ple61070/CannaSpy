import { useState, useMemo, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type View = 'cal' | 'list' | 'insights'
type FilterKey = 'all' | 'flash' | 'bogo' | 'happy_hour' | 'early_bird' | 'daily_deal' | 'weekly_deal' | 'member_price' | 'timed' | 'recurring' | 'shared' | 'expiring'
type InsightFilter = 'all' | 'conflict' | 'opp'
type InsightSort = 'severity' | 'day' | 'rival'

interface Rival { key: string; name: string; dist: string; blocked: boolean }
interface PriceRow { sku: string; yours: string; theirs: string; gap: string; gc: string; pc: string }
interface Promo {
  key: string; rival: string; subtype: string; shared: boolean; brand: string
  days: number[]; time_window: string | null; discount: string; gap: string | null
  expires: string; title: string; narrative: string; rows: PriceRow[]
}
interface YourPromo { key: string; days: number[]; category: string; subtype: string; time_window: string | null; discount: number; label: string }

// ─── Static config ─────────────────────────────────────────────────────────
const ST: Record<string, { ico: string; label: string; color: string }> = {
  flash:        { ico: '⚡', label: 'Flash Sale',  color: 'var(--danger)' },
  bogo:         { ico: '🔄', label: 'BOGO',        color: 'var(--danger)' },
  happy_hour:   { ico: '🕐', label: 'Happy Hour',  color: 'var(--warm)' },
  early_bird:   { ico: '🌅', label: 'Early Bird',  color: 'var(--warm)' },
  daily_deal:   { ico: '↺',  label: 'Daily Deal',  color: 'var(--slate)' },
  weekly_deal:  { ico: '📅', label: 'Weekly',      color: 'var(--slate)' },
  member_price: { ico: '★',  label: 'Members',     color: 'var(--slate)' },
}

function subtypeColor(st: string): string {
  if (['flash','bogo'].includes(st)) return 'var(--danger)'
  if (['happy_hour','early_bird'].includes(st)) return 'var(--warm)'
  return 'var(--slate)'
}
function subtypeSoft(st: string): string {
  if (['flash','bogo'].includes(st)) return 'rgba(224,90,106,0.1)'
  if (['happy_hour','early_bird'].includes(st)) return 'rgba(212,144,10,0.1)'
  return 'rgba(84,132,164,0.1)'
}

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DAY_LABELS = ['M','T','W','T','F','S','S']

// ─── Data ──────────────────────────────────────────────────────────────────
const RIVALS: Rival[] = [
  { key:'stiiizy', name:'STIIIZY WeHo',   dist:'1.2 mi', blocked:true },
  { key:'medmen',  name:'MedMen WeHo',    dist:'0.8 mi', blocked:false },
  { key:'otc',     name:'Off The Charts', dist:'2.9 mi', blocked:true },
  { key:'catalyst',name:'Catalyst Co.',   dist:'1.9 mi', blocked:false },
  { key:'jungle',  name:'Jungle Boys',    dist:'2.4 mi', blocked:false },
]

const PROMOS: Promo[] = [
  { key:'ff-flash-stiiizy', rival:'stiiizy', subtype:'flash', shared:true, brand:'Friendly Farms',
    days:[1,1,1,1,1,1,1], time_window:null, discount:'−28%', gap:'−$14', expires:'Sun Apr 20',
    title:'Friendly Farms 3.5g — 28% off flash sale',
    narrative:'STIIIZY is running a weekend flash sale on Friendly Farms 3.5g. At $36 vs your $50 — a $14 gap on a brand you both carry. You are 28% more expensive on a shared brand until Sunday.',
    rows:[{sku:'FF 3.5g Flower',yours:'$50',theirs:'$36',gap:'−$14',gc:'d',pc:'d'},{sku:'FF 7g Flower',yours:'$90',theirs:'$68',gap:'−$22',gc:'d',pc:'d'}] },

  { key:'rg-flash-medmen', rival:'medmen', subtype:'flash', shared:true, brand:'Raw Garden',
    days:[0,1,1,1,1,1,1], time_window:null, discount:'−24%', gap:'−$14', expires:'Sun Apr 20',
    title:'Raw Garden 1g vape — Fri–Sun flash sale',
    narrative:'MedMen running a weekend Raw Garden flash. $44 vs your $58 on a shared brand. Ends Sunday.',
    rows:[{sku:'Raw Garden 1g Vape',yours:'$58',theirs:'$44',gap:'−$14',gc:'d',pc:'d'}] },

  { key:'cbx-flash-otc', rival:'otc', subtype:'flash', shared:false, brand:'CBX',
    days:[1,1,1,0,0,0,0], time_window:null, discount:'−31%', gap:null, expires:'Wed Apr 16',
    title:'CBX Cherries — 3-day flash sale',
    narrative:"Off The Charts running a 3-day CBX flash. You don't carry CBX — low direct impact, but aggressive premium flower pricing pulls traffic.",
    rows:[{sku:'CBX Cherries 3.5g',yours:'—',theirs:'$45',gap:'N/A',gc:'',pc:'d'}] },

  { key:'jb-bogo-jungle', rival:'jungle', subtype:'bogo', shared:false, brand:'Jungle Boys',
    days:[1,1,1,1,1,1,1], time_window:null, discount:'B2G1', gap:null, expires:'Sun Apr 20',
    title:'Jungle Boys — Buy 2 Get 1 concentrate bundle',
    narrative:'Jungle Boys B2G1 on house concentrate line all week. Not a brand you carry — low direct threat but BOGO in concentrates shifts weekend traffic.',
    rows:[] },

  { key:'hh-medmen', rival:'medmen', subtype:'happy_hour', shared:false, brand:'All vapes',
    days:[1,1,1,1,1,1,1], time_window:'4–7pm', discount:'−20%', gap:null, expires:'Standing',
    title:'Happy Hour — 20% off all vapes 4–7pm',
    narrative:'MedMen daily vape happy hour 4–7pm. Overlaps your peak evening traffic. Brands discounted partially match your vape selection.',
    rows:[] },

  { key:'rg-hh-jungle', rival:'jungle', subtype:'happy_hour', shared:true, brand:'Raw Garden',
    days:[0,0,0,1,0,0,0], time_window:'5–8pm', discount:'−15%', gap:'−$9', expires:'Standing',
    title:'Raw Garden Happy Hour — Thursdays 5–8pm',
    narrative:'Jungle Boys Thursday evening Raw Garden happy hour. Shared brand — on Thursdays 5–8pm they have a 15% edge on a brand you both carry.',
    rows:[{sku:'Raw Garden 1g Vape',yours:'$58',theirs:'$49',gap:'−$9',gc:'w',pc:'w'}] },

  { key:'hh-catalyst', rival:'catalyst', subtype:'happy_hour', shared:false, brand:'Concentrates',
    days:[1,1,1,1,1,0,0], time_window:'5–7pm', discount:'−20%', gap:null, expires:'Standing',
    title:'Happy Hour — 20% off concentrates 5–7pm',
    narrative:'Catalyst runs a weekday concentrate happy hour 5–7pm. Not a direct pricing exposure but draws traffic during your evening peak.',
    rows:[] },

  { key:'eb-stiiizy', rival:'stiiizy', subtype:'early_bird', shared:false, brand:'All flower',
    days:[0,0,0,0,0,1,1], time_window:'10am–12pm', discount:'−15%', gap:null, expires:'Standing',
    title:'Early Bird — 15% off all flower 10am–12pm (Weekends)',
    narrative:'STIIIZY runs a weekend early bird special on all flower. Opens 2 hours before you typically see peak traffic. Drives morning dispensary switching.',
    rows:[] },

  { key:'rg-daily-catalyst', rival:'catalyst', subtype:'daily_deal', shared:true, brand:'Raw Garden',
    days:[1,1,1,1,1,1,1], time_window:null, discount:'−16%', gap:'−$9', expires:'Standing',
    title:'Raw Garden daily deal — every day, all day',
    narrative:'Catalyst has run this Raw Garden deal for 11 consecutive days. At $49 vs your $58, this is a standing competitive gap on a shared brand.',
    rows:[{sku:'Raw Garden 1g Live Resin',yours:'$58',theirs:'$49',gap:'−$9',gc:'w',pc:'w'}] },

  { key:'ff-mon-otc', rival:'otc', subtype:'weekly_deal', shared:true, brand:'Friendly Farms',
    days:[1,0,0,0,0,0,0], time_window:null, discount:'−15%', gap:'−$8', expires:'Standing',
    title:'Friendly Farms Monday deal — every Monday',
    narrative:'Off The Charts has run FF Monday deals for 10 weeks. Every Monday all FF products are 15% off. Blocked rival — cannot see your response.',
    rows:[{sku:'FF 3.5g Flower',yours:'$50',theirs:'$42',gap:'−$8',gc:'w',pc:'w'}] },

  { key:'kanha-tues-stiiizy', rival:'stiiizy', subtype:'weekly_deal', shared:false, brand:'Kanha',
    days:[0,1,0,0,0,0,0], time_window:null, discount:'−20%', gap:null, expires:'Standing',
    title:'Kanha Tuesday deal — every Tuesday',
    narrative:'STIIIZY runs a Tuesday Kanha edibles deal. You carry Kanha at full price. Six weeks running. Low urgency.',
    rows:[] },

  { key:'maven-wknd-catalyst', rival:'catalyst', subtype:'member_price', shared:false, brand:'Maven',
    days:[0,0,0,0,0,1,1], time_window:null, discount:'−10%', gap:null, expires:'Standing',
    title:'Maven weekend member pricing — Sat–Sun',
    narrative:'Catalyst offers Maven weekend pricing to loyalty members — 10% off Sat–Sun. Loyalty pricing is harder to counter directly.',
    rows:[] },

  { key:'ff-sat-medmen', rival:'medmen', subtype:'weekly_deal', shared:true, brand:'Friendly Farms',
    days:[0,0,0,0,0,1,0], time_window:null, discount:'−12%', gap:'−$6', expires:'Standing',
    title:'Friendly Farms Saturday deal — every Saturday',
    narrative:'MedMen runs a Saturday FF special. Their FF price is $44 vs your $50 — a $6 shared-brand gap on your highest-traffic day.',
    rows:[{sku:'FF 3.5g Flower',yours:'$50',theirs:'$44',gap:'−$6',gc:'w',pc:'w'}] },
]

const YOUR_PROMOS: YourPromo[] = [
  { key:'y-hh-vapes',   days:[1,1,1,1,1,0,0], category:'vape',    subtype:'happy_hour',  time_window:'5–8pm',  discount:20, label:'Happy Hour — 20% off all vapes 5–8pm (Mon–Fri)' },
  { key:'y-flower-fri', days:[0,0,0,0,1,0,0], category:'flower',  subtype:'weekly_deal', time_window:null,     discount:15, label:'Flower Friday — 15% off all flower' },
  { key:'y-jeeter-sat', days:[0,0,0,0,0,1,0], category:'preroll', subtype:'weekly_deal', time_window:null,     discount:20, label:'Jeeter Saturday — 20% off all Jeeter' },
  { key:'y-new-cust',   days:[1,1,1,1,1,1,1], category:'all',     subtype:'first_time',  time_window:null,     discount:15, label:'First-time customer — 15% off entire order' },
  { key:'y-edible-sun', days:[0,0,0,0,0,0,1], category:'edible',  subtype:'weekly_deal', time_window:null,     discount:25, label:'Sunday Funday — 25% off all edibles' },
]

const LIST_SECTIONS = [
  { id:'flash',        label:'⚡ Flash Sales',       subtypes:['flash'] },
  { id:'bogo',         label:'🔄 BOGO / Bundle',     subtypes:['bogo'] },
  { id:'happy_hour',   label:'🕐 Happy Hour',        subtypes:['happy_hour'] },
  { id:'early_bird',   label:'🌅 Early Bird',        subtypes:['early_bird'] },
  { id:'daily_deal',   label:'↺ Daily Deals',        subtypes:['daily_deal'] },
  { id:'weekly_deal',  label:'📅 Weekly Deals',      subtypes:['weekly_deal'] },
  { id:'member_price', label:'★ Member Pricing',     subtypes:['member_price'] },
]

// ─── Filter ────────────────────────────────────────────────────────────────
function matchFilter(p: Promo, activeType: FilterKey, sharedOnly: boolean): boolean {
  let typeOk = false
  if (activeType === 'all') typeOk = true
  else if (activeType === 'flash') typeOk = p.subtype === 'flash'
  else if (activeType === 'bogo') typeOk = p.subtype === 'bogo'
  else if (activeType === 'happy_hour') typeOk = p.subtype === 'happy_hour'
  else if (activeType === 'early_bird') typeOk = p.subtype === 'early_bird'
  else if (activeType === 'daily_deal') typeOk = p.subtype === 'daily_deal'
  else if (activeType === 'weekly_deal') typeOk = p.subtype === 'weekly_deal'
  else if (activeType === 'member_price') typeOk = p.subtype === 'member_price'
  else if (activeType === 'timed') typeOk = ['happy_hour','early_bird'].includes(p.subtype)
  else if (activeType === 'recurring') typeOk = ['daily_deal','weekly_deal','member_price'].includes(p.subtype)
  else if (activeType === 'shared') typeOk = p.shared
  else if (activeType === 'expiring') typeOk = p.expires !== 'Standing'
  if (!typeOk) return false
  if (sharedOnly && !p.shared) return false
  return true
}

// ─── Insights engine ───────────────────────────────────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  'All vapes':'vape','vape':'vape','Vapes':'vape',
  'All flower':'flower','flower':'flower','Flower':'flower',
  'Friendly Farms':'flower','CBX':'flower','Raw Garden':'vape',
  'Kanha':'edible','Maven':'concentrate','Concentrates':'concentrate',
  'Jungle Boys':'concentrate','All':'all','all':'all',
}
function getRivalCategory(p: Promo): string {
  const cat = CATEGORY_MAP[p.brand] || null
  if (!cat && p.subtype === 'happy_hour') return 'vape'
  return cat || 'other'
}

interface Conflict {
  type: 'conflict'; severity: 'critical'|'high'|'medium'; days: number[]; dayNames: string[]
  rival_key: string; your_key: string; rival_name: string; rival_promo: string; your_promo: string
  category: string; rival_discount: number|string; your_discount: number; shared: boolean
  rival_deeper: boolean; subtype: string; time_window: string|null; your_time: string|null
}
interface Opportunity { type: 'opportunity'; category: string; days: number[]; dayNames: string[] }
interface MechanicOpp { mechanic: string; label: string }

function generateInsights(): { conflicts: Conflict[]; opps: Opportunity[]; mechanic_opps: MechanicOpp[] } {
  const conflicts: Conflict[] = []
  let opps: Opportunity[] = []
  const mechanic_opps: MechanicOpp[] = []
  const DAYS = [0,1,2,3,4,5,6]
  const MECH_LABELS: Record<string,string> = {
    happy_hour:'Happy hour (time-gated discount)', early_bird:'Early bird (open-to-noon pricing)',
    bogo:'Buy-one-get-one bundle', bundle:'Multi-unit bundle deal',
    daily_deal:'Daily brand deal', weekly_deal:'Weekly recurring brand day',
    flash_sale:'Flash sale (48–72hr)', first_time:'First-time customer offer', loyalty:'Loyalty member pricing',
  }

  PROMOS.forEach(rp => {
    const rCat = getRivalCategory(rp)
    YOUR_PROMOS.forEach(yp => {
      if (rCat !== yp.category && yp.category !== 'all' && rCat !== 'other') return
      const overlapDays = DAYS.filter(d => rp.days[d] && yp.days[d])
      if (!overlapDays.length) return
      const dup = conflicts.some(x => x.rival_key === rp.key && x.your_key === yp.key)
      if (dup) return
      const rival = RIVALS.find(r => r.key === rp.rival)
      const severity: 'critical'|'high'|'medium' = rp.shared && yp.category !== 'all' ? 'critical' :
        !rp.shared && yp.category !== 'all' ? 'high' : 'medium'
      const rivalDisc = parseFloat(String(rp.discount).replace(/[^0-9.]/g,'')) || 0
      const yourDisc = parseFloat(String(yp.discount).replace(/[^0-9.]/g,'')) || 0
      conflicts.push({
        type:'conflict', severity, days:overlapDays, dayNames:overlapDays.map(d=>DAY_NAMES[d]),
        rival_key:rp.key, your_key:yp.key, rival_name:rival?.name||rp.rival,
        rival_promo:rp.title||rp.brand, your_promo:yp.label, category:rCat,
        rival_discount:rp.discount, your_discount:yp.discount, shared:rp.shared,
        rival_deeper: rivalDisc > yourDisc, subtype:rp.subtype,
        time_window:rp.time_window, your_time:yp.time_window,
      })
    })
  })
  const SEV_ORDER: Record<string,number> = {critical:0,high:1,medium:2}
  conflicts.sort((a,b) => (SEV_ORDER[a.severity]||9)-(SEV_ORDER[b.severity]||9))

  const CATS = ['flower','vape','edible','concentrate','preroll']
  CATS.forEach(cat => {
    DAYS.forEach(d => {
      const rivalHas = PROMOS.some(p => p.days[d] && getRivalCategory(p)===cat)
      const youHave = YOUR_PROMOS.some(p => p.days[d] && (p.category===cat||p.category==='all'))
      if (!rivalHas && !youHave) {
        const gapDays = DAYS.filter(dd => {
          const rh = PROMOS.some(p => p.days[dd] && getRivalCategory(p)===cat)
          const yh = YOUR_PROMOS.some(p => p.days[dd] && (p.category===cat||p.category==='all'))
          return !rh && !yh
        })
        if (gapDays[0]===d) {
          opps.push({ type:'opportunity', category:cat, days:gapDays, dayNames:gapDays.map(dd=>DAY_NAMES[dd]) })
        }
      }
    })
  })
  const seenCats: Record<string,boolean> = {}
  opps = opps.filter(o => { if(seenCats[o.category]) return false; seenCats[o.category]=true; return true })

  const ALL_MECHANICS = ['happy_hour','early_bird','bogo','bundle','daily_deal','weekly_deal','flash_sale','first_time','loyalty']
  const rivalMechs = PROMOS.map(p=>p.subtype)
  const yourMechs = YOUR_PROMOS.map(p=>p.subtype)
  ALL_MECHANICS.forEach(m => {
    if (!rivalMechs.includes(m) && !yourMechs.includes(m)) {
      mechanic_opps.push({ mechanic:m, label:MECH_LABELS[m]||m })
    }
  })

  return { conflicts, opps, mechanic_opps }
}

function getSuggestion(cf: Conflict): string {
  if (cf.severity==='critical' && cf.shared) {
    return cf.rival_deeper
      ? `Move your ${cf.category} promo to a different day where ${cf.rival_name} has no deal running. Running the same category at a lower discount than a rival on a shared brand drives customers directly to them.`
      : `You have the price advantage here, but running the same promo on the same day splits attention. Consider shifting yours to a day where you run unopposed and own the full traffic lift.`
  }
  if (cf.subtype==='happy_hour' && cf.time_window && cf.your_time) {
    if (cf.time_window===cf.your_time) return `Your windows overlap exactly. Shift your ${cf.category} happy hour by 2 hours — run 6–9pm while they run 4–7pm. You capture post-dinner traffic they miss.`
    return `Windows are adjacent but not identical. Monitor traffic data on both — customers may still comparison-shop across the overlap period.`
  }
  if (cf.subtype==='weekly_deal') return `Move your ${cf.category} deal to a different day. Check the calendar — ${cf.rival_name} leaves several days in this category completely uncovered.`
  return `Consider shifting your ${cf.category} promo to a day where ${cf.rival_name} has no competing deal — you will own the full traffic lift rather than splitting it.`
}

const MECH_SUGGEST: Record<string,{why:string;suggest:string}> = {
  happy_hour: { why:"No rival in WeHo runs a happy hour outside MedMen's 4–7pm window. A 5–8pm window on a different category would capture post-work traffic without direct overlap.", suggest:"Run a flower happy hour 5–8pm Mon–Fri — no rivals own this window." },
  early_bird: { why:"STIIIZY already runs a weekend 10am–12pm early bird on flower. An early bird on VAPES on weekdays is completely uncontested.", suggest:"10am–12pm weekday vape early bird — zero rival coverage at this time." },
  bogo:       { why:"No rival runs a BOGO in vapes, edibles, or prerolls. BOGO mechanics generate significantly higher basket sizes than pct-off deals.", suggest:"Buy-1-get-1 on vape cartridges (1g) — no rival offers this format." },
  bundle:     { why:"Bundle deals create perceived value without cutting your margin-per-unit. No rival is using this format currently.", suggest:"3-for-$XX preroll bundle on Sundays — differentiated from every rival." },
  daily_deal: { why:"Catalyst already owns Raw Garden daily. Picking a different brand gives you a standing deal your regulars can plan around.", suggest:"Pick a high-volume brand you own exclusively and run a daily deal to build habitual traffic." },
}

const OPP_WHY: Record<string,string> = {
  flower:'No rival runs a flower promo on these days. Flower is your highest-volume category. Owning these windows builds habitual traffic before rivals notice the gap.',
  vape:'Rivals only promote vapes Mon–Fri (MedMen happy hour). Weekend vape promos are completely uncontested — Friday and Saturday are high-volume vape days industry-wide.',
  edible:'No rival runs an edible promo this week except STIIIZY Kanha on Tuesday. Edibles have the widest demographic appeal and are a natural upsell to flower buyers.',
  concentrate:'Concentrates are under-promoted across all rivals this week. Concentrate buyers are high-loyalty, high-spend customers — a weekly brand day in this category builds a dedicated audience.',
  preroll:'Preroll promotions are absent from all rivals this week. Prerolls are an impulse purchase — any promo drives meaningful unit volume increases with minimal margin cost.',
}
const OPP_SUGGEST: Record<string,string> = {
  flower:'Add a Flower Wednesday or Flower Sunday deal to own the gap days with no rival competition.',
  vape:'Weekend vape promotion (Sat or Sun) — zero rivals in this window. Even 10% off outperforms their silence.',
  edible:'Edible Tuesday or Thursday — STIIIZY only runs Kanha on Tuesday. A broader edibles deal on a different day is completely uncontested.',
  concentrate:'Weekly concentrate brand day (Wed or Thu) — pick a brand you stock heavily and own this day.',
  preroll:'Preroll Monday or Preroll Thursday — no rivals in this format any day this week.',
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function PromotionsTracker() {
  const [view, setView] = useState<View>('cal')
  const [activeType, setActiveType] = useState<FilterKey>('all')
  const [sharedOnly, setSharedOnly] = useState(false)
  const [drawerKey, setDrawerKey] = useState<string | null>(null)
  const [insightFilter, setInsightFilter] = useState<InsightFilter>('all')
  const [insightCat, setInsightCat] = useState<string>('all')
  const [insightSort, setInsightSort] = useState<InsightSort>('severity')
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [typePopOpen, setTypePopOpen] = useState(false)
  const [iShowPopOpen, setIShowPopOpen] = useState(false)
  const [iCatPopOpen, setICatPopOpen] = useState(false)
  const [iSortPopOpen, setISortPopOpen] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  function showToast(msg: string) {
    setToastMsg(msg); setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2400)
  }
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const closeAllPops = useCallback(() => {
    setTypePopOpen(false); setIShowPopOpen(false); setICatPopOpen(false); setISortPopOpen(false)
  }, [])

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as HTMLElement
      if (!t.closest('[data-pop-group]')) closeAllPops()
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [closeAllPops])

  const filteredPromos = useMemo(() => PROMOS.filter(p => matchFilter(p, activeType, sharedOnly)), [activeType, sharedOnly])
  const insights = useMemo(() => generateInsights(), [])

  const drawerPromo = drawerKey ? PROMOS.find(p => p.key === drawerKey) ?? null : null
  const drawerRival = drawerPromo ? RIVALS.find(r => r.key === drawerPromo.rival) ?? null : null

  // Summary card counts
  const flashCount = PROMOS.filter(p => ['flash','bogo'].includes(p.subtype)).length
  const timedCount = PROMOS.filter(p => ['happy_hour','early_bird'].includes(p.subtype)).length
  const recurCount = PROMOS.filter(p => ['daily_deal','weekly_deal','member_price'].includes(p.subtype)).length
  const sharedCount = PROMOS.filter(p => p.shared).length
  const expiringCount = PROMOS.filter(p => p.expires !== 'Standing').length

  // Insight counts
  const warningCount = insights.conflicts.filter(c => c.severity !== 'medium').length

  // Sorted insights
  const filteredConflicts = useMemo(() => {
    let c = insights.conflicts.filter(cf => insightCat === 'all' || cf.category === insightCat)
    if (insightFilter === 'opp') return []
    const SEV: Record<string,number> = {critical:0,high:1,medium:2}
    const DAY: Record<string,number> = {Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}
    if (insightSort === 'severity') c = [...c].sort((a,b) => (SEV[a.severity]||9)-(SEV[b.severity]||9))
    else if (insightSort === 'day') c = [...c].sort((a,b) => (DAY[a.dayNames[0]]||9)-(DAY[b.dayNames[0]]||9))
    else if (insightSort === 'rival') c = [...c].sort((a,b) => a.rival_name.localeCompare(b.rival_name))
    return c
  }, [insights, insightCat, insightFilter, insightSort])

  const filteredOpps = useMemo(() => {
    if (insightFilter === 'conflict') return []
    return insights.opps.filter(o => insightCat === 'all' || o.category === insightCat)
  }, [insights, insightCat, insightFilter])

  // ─── Summary card ─────────────────────────────────────────────────────────
  function SummaryCard({ id, filter, count, label, sub, ico, numColor, borderColor, bgColor }:
    { id: string; filter: FilterKey; count: number; label: string; sub: string; ico: string; numColor: string; borderColor: string; bgColor: string }) {
    const active = activeType === filter
    return (
      <div
        onClick={() => setActiveType(active ? 'all' : filter)}
        style={{
          flex:1, minWidth:120, background: active ? `rgba(${bgColor},0.12)` : 'var(--surface)',
          border: `1px solid ${active ? borderColor : 'var(--border)'}`,
          borderTop: `3px solid ${active ? borderColor : 'transparent'}`,
          borderRadius:'var(--r-sm)', padding:'12px 14px', cursor:'pointer',
          boxShadow:'var(--card-shadow)', transition:'all 0.15s',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:22, fontWeight:700, color:numColor }}>{count}</div>
          <div style={{ fontSize:18 }}>{ico}</div>
        </div>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', marginBottom:2 }}>{label}</div>
        <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{sub}</div>
        {active && <div style={{ fontFamily:'var(--mono)', fontSize:9, color:numColor, marginTop:4 }}>Filtered ↑</div>}
      </div>
    )
  }

  // ─── Dropdown wrapper ──────────────────────────────────────────────────────
  function Dd({ label, value, open, onToggle, children }: { label: string; value: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
    return (
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', whiteSpace:'nowrap' }}>{label}</span>
        <div style={{ position:'relative' }} data-pop-group="1">
          <button
            onClick={e => { e.stopPropagation(); onToggle() }}
            style={{
              background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6,
              padding:'4px 10px', fontFamily:'var(--mono)', fontSize:10, color:'var(--text-1)',
              cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
            }}
          >
            {value}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width:9, height:9, opacity:0.55 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {open && (
            <div style={{
              position:'absolute', top:'calc(100% + 4px)', left:0, zIndex:200,
              background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8,
              minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,0.3)', overflow:'hidden',
            }}>
              {children}
            </div>
          )}
        </div>
      </div>
    )
  }

  function DdOption({ children, selected, onClick }: { children: React.ReactNode; selected?: boolean; onClick: () => void }) {
    return (
      <div
        onClick={e => { e.stopPropagation(); onClick() }}
        style={{
          padding:'7px 12px', fontSize:11, cursor:'pointer', color: selected ? 'var(--accent)' : 'var(--text-1)',
          background: selected ? 'rgba(9,161,161,0.08)' : 'transparent',
          display:'flex', alignItems:'center', gap:6,
          borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
        }}
      >{children}</div>
    )
  }

  // ─── Calendar view ─────────────────────────────────────────────────────────
  function CalView() {
    const today = 1 // index 1 = Tuesday
    return (
      <div style={{ border:'1px solid var(--border)', borderRadius:'var(--r-sm)', overflow:'hidden', background:'var(--surface)' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'160px repeat(7, 1fr)', borderBottom:'1px solid var(--border)' }}>
          <div style={{ padding:'10px 12px', fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', borderRight:'1px solid var(--border)' }}>Rival</div>
          {DAY_NAMES.map((d, i) => (
            <div key={d} style={{
              padding:'8px 6px', textAlign:'center', borderRight: i < 6 ? '1px solid var(--border)' : undefined,
              background: i === today ? 'rgba(9,161,161,0.05)' : undefined,
            }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color: i === today ? 'var(--accent)' : 'var(--text-2)' }}>{d}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', marginTop:1 }}>Apr {14+i}</div>
              {i === today && <div style={{ width:4, height:4, borderRadius:'50%', background:'var(--accent)', margin:'3px auto 0' }}/>}
            </div>
          ))}
        </div>
        {/* Rows */}
        {RIVALS.map((r, ri) => {
          const rp = filteredPromos.filter(p => p.rival === r.key)
          if (activeType !== 'all' && !rp.length) return null
          return (
            <div key={r.key} style={{ display:'grid', gridTemplateColumns:'160px repeat(7, 1fr)', borderBottom: ri < RIVALS.length-1 ? '1px solid var(--border)' : undefined }}>
              <div style={{ padding:'10px 12px', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:3 }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:'var(--text-1)' }}>{r.name}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>{r.dist}</div>
                <div style={{
                  display:'inline-block', padding:'1px 6px', borderRadius:4, fontSize:9, fontFamily:'var(--mono)', fontWeight:700,
                  background: r.blocked ? 'rgba(212,148,166,0.15)' : 'rgba(9,161,161,0.1)',
                  color: r.blocked ? 'var(--rose)' : 'var(--accent)',
                  border: `1px solid ${r.blocked ? 'rgba(212,148,166,0.3)' : 'rgba(9,161,161,0.25)'}`,
                  alignSelf:'flex-start',
                }}>
                  {r.blocked ? 'Blocked' : 'Tracking'}
                </div>
              </div>
              {[0,1,2,3,4,5,6].map(d => {
                const dp = rp.filter(p => p.days[d])
                return (
                  <div key={d} style={{
                    padding:'6px 5px', borderRight: d < 6 ? '1px solid var(--border)' : undefined,
                    minHeight:70, display:'flex', flexDirection:'column', gap:4,
                    background: d === today ? 'rgba(9,161,161,0.03)' : undefined,
                  }}>
                    {!dp.length
                      ? <div style={{ color:'var(--text-3)', fontSize:13, textAlign:'center', paddingTop:20 }}>—</div>
                      : dp.map(p => (
                        <div
                          key={p.key}
                          onClick={() => setDrawerKey(p.key)}
                          style={{
                            background: subtypeSoft(p.subtype),
                            border: `1px solid ${subtypeColor(p.subtype)}40`,
                            borderLeft: `3px solid ${p.shared ? 'var(--accent)' : subtypeColor(p.subtype)}`,
                            borderRadius:5, padding:'4px 5px', cursor:'pointer',
                            transition:'filter 0.1s',
                          }}
                        >
                          <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color:'var(--text-1)', marginBottom:2, lineHeight:1.2 }}>{p.brand}</div>
                          <div style={{ display:'flex', flexWrap:'wrap', gap:2 }}>
                            <span style={{ fontFamily:'var(--mono)', fontSize:8, padding:'1px 4px', borderRadius:3, background: subtypeColor(p.subtype) + '20', color: subtypeColor(p.subtype), fontWeight:700 }}>
                              {ST[p.subtype]?.ico} {ST[p.subtype]?.label}
                            </span>
                            {p.shared && <span style={{ fontFamily:'var(--mono)', fontSize:8, padding:'1px 4px', borderRadius:3, background:'rgba(9,161,161,0.15)', color:'var(--accent)', fontWeight:700 }}>◆ Shared</span>}
                          </div>
                          {(p.gap || p.discount) && (
                            <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color: p.gap ? 'var(--danger)' : 'var(--text-2)', marginTop:2 }}>
                              {p.shared && p.gap ? p.gap : p.discount}
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  // ─── List view ────────────────────────────────────────────────────────────
  function ListView() {
    const hasAny = LIST_SECTIONS.some(sec => filteredPromos.some(p => sec.subtypes.includes(p.subtype)))
    if (!hasAny) return (
      <div style={{ padding:32, textAlign:'center', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>
        No promos match this filter
      </div>
    )
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {LIST_SECTIONS.map(sec => {
          const items = filteredPromos.filter(p => sec.subtypes.includes(p.subtype))
          if (!items.length) return null
          const col = subtypeColor(sec.subtypes[0])
          return (
            <div key={sec.id}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:col, textTransform:'uppercase', letterSpacing:'0.1em' }}>{sec.label}</div>
                <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>{items.length}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {items.map(p => {
                  const r = RIVALS.find(x => x.key === p.rival)
                  const col2 = subtypeColor(p.subtype)
                  return (
                    <div
                      key={p.key}
                      onClick={() => setDrawerKey(p.key)}
                      style={{
                        background:'var(--surface)', border:`1px solid var(--border)`,
                        borderLeft:`3px solid ${col2}`, borderRadius:'var(--r-sm)',
                        padding:'11px 14px', cursor:'pointer', display:'flex', gap:12,
                        boxShadow:'var(--card-shadow)',
                      }}
                    >
                      <div style={{
                        width:34, height:34, borderRadius:7, background: subtypeSoft(p.subtype),
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0,
                      }}>{ST[p.subtype]?.ico}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)' }}>{r?.name} · {r?.dist}</span>
                          {r?.blocked && <span style={{ fontFamily:'var(--mono)', fontSize:8, padding:'1px 5px', borderRadius:3, background:'rgba(212,148,166,0.15)', color:'var(--rose)', fontWeight:700 }}>BLOCKED</span>}
                        </div>
                        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-1)', marginBottom:4 }}>{p.title}</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:4 }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background: subtypeSoft(p.subtype), color:col2, border:`1px solid ${col2}30` }}>
                            {ST[p.subtype]?.ico} {ST[p.subtype]?.label}
                          </span>
                          {p.time_window && <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background:'var(--surface-2)', color:'var(--text-2)', border:'1px solid var(--border)' }}>🕐 {p.time_window}</span>}
                          {p.shared && <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background:'rgba(9,161,161,0.1)', color:'var(--accent)', border:'1px solid rgba(9,161,161,0.25)', fontWeight:700 }}>◆ Shared</span>}
                        </div>
                        <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>
                          {p.discount}{p.gap ? ` · ${p.gap} gap vs you` : ''}{p.expires !== 'Standing' ? ` · Expires ${p.expires}` : ''}
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                        <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 8px', borderRadius:20, background: subtypeSoft(p.subtype), color:col2, border:`1px solid ${col2}40`, fontWeight:700 }}>
                          {ST[p.subtype]?.label}
                        </span>
                        <span style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>{p.expires}</span>
                        {p.shared && p.gap && <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:'var(--danger)' }}>{p.gap} gap</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ─── Insights view ────────────────────────────────────────────────────────
  const SEV_CFG: Record<string,{ bg:string; border:string; badge:string; label:string }> = {
    critical: { bg:'rgba(224,90,106,0.07)',  border:'var(--danger)', badge:'var(--danger)', label:'Critical' },
    high:     { bg:'rgba(212,144,10,0.07)',  border:'var(--warm)',   badge:'var(--warm)',   label:'High' },
    medium:   { bg:'rgba(84,132,164,0.06)',  border:'var(--slate)',  badge:'var(--slate)',  label:'Medium' },
  }

  function fmtDisc(d: number|string): string {
    if (d === undefined || d === null) return '?'
    const s = String(d).replace(/[−\-]/g,'').replace(/%/g,'')
    return isNaN(Number(s)) ? s : s + '%'
  }

  function InsightsView() {
    const iCount = (insightFilter!=='opp' ? filteredConflicts.length : 0) + (insightFilter!=='conflict' ? filteredOpps.length : 0)
    return (
      <div>
        {/* Filter bar */}
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)',
          padding:'8px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:6,
          boxShadow:'var(--card-shadow)', flexWrap:'wrap',
        }}>
          <Dd label="Show" value={insightFilter==='all'?'All insights':insightFilter==='conflict'?'Conflicts only':'Opportunities only'} open={iShowPopOpen}
            onToggle={() => { closeAllPops(); setIShowPopOpen(v => !v) }}>
            {(['all','conflict','opp'] as const).map(v => (
              <DdOption key={v} selected={insightFilter===v} onClick={() => { setInsightFilter(v); setIShowPopOpen(false) }}>
                {v==='all'?'All insights':v==='conflict'?<><span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'var(--danger)',marginRight:4}}/>Conflicts only</>:<><span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'var(--accent)',marginRight:4}}/>Opportunities only</>}
              </DdOption>
            ))}
          </Dd>
          <div style={{ width:1, height:20, background:'var(--border)' }}/>
          <Dd label="Category" value={insightCat==='all'?'All':insightCat.charAt(0).toUpperCase()+insightCat.slice(1)} open={iCatPopOpen}
            onToggle={() => { closeAllPops(); setICatPopOpen(v => !v) }}>
            {['all','flower','vape','edible','concentrate','preroll'].map(v => (
              <DdOption key={v} selected={insightCat===v} onClick={() => { setInsightCat(v); setICatPopOpen(false) }}>
                {v==='all'?'All categories':v.charAt(0).toUpperCase()+v.slice(1)}
              </DdOption>
            ))}
          </Dd>
          <div style={{ width:1, height:20, background:'var(--border)' }}/>
          <Dd label="Sort" value={insightSort==='severity'?'Severity':insightSort==='day'?'Day':'Rival'} open={iSortPopOpen}
            onToggle={() => { closeAllPops(); setISortPopOpen(v => !v) }}>
            {([['severity','Severity (critical first)'],['day','Day (Mon → Sun)'],['rival','Rival name']] as const).map(([v,l]) => (
              <DdOption key={v} selected={insightSort===v} onClick={() => { setInsightSort(v); setISortPopOpen(false) }}>{l}</DdOption>
            ))}
          </Dd>
          <div style={{ marginLeft:'auto', fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)' }}>{iCount} item{iCount!==1?'s':''}</div>
        </div>

        {/* Your schedule strip */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'14px 16px', marginBottom:18, boxShadow:'var(--card-shadow)' }}>
          <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:10 }}>Your current promos — WeHo Flagship</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {YOUR_PROMOS.map(p => {
              const col = p.subtype==='happy_hour'?'var(--accent)':p.subtype==='early_bird'?'var(--warm)':p.subtype==='first_time'?'var(--rose)':'var(--slate)'
              const days = p.days.map((d,i) => d ? DAY_LABELS[i] : null).filter(Boolean).join('')
              return (
                <div key={p.key} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, padding:'6px 10px', fontSize:11, color:'var(--text-1)' }}>
                  <span style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color:col, marginRight:5 }}>{days}</span>
                  {p.label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Conflicts */}
        {insightFilter !== 'opp' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--danger)' }}>⚠ Scheduling conflicts</div>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>{filteredConflicts.length} found</div>
            </div>
            {!filteredConflicts.length
              ? <div style={{ padding:16, textAlign:'center', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>No conflicts this week — your schedule is clear</div>
              : filteredConflicts.map(cf => {
                const sev = SEV_CFG[cf.severity] || SEV_CFG.medium
                const deeperNote = cf.rival_deeper
                  ? ` They are offering <strong>${fmtDisc(cf.rival_discount)} off</strong> vs your <strong>${fmtDisc(cf.your_discount)} off</strong> — customers who compare will go to them.`
                  : ` You are offering <strong>${fmtDisc(cf.your_discount)} off</strong> vs their <strong>${fmtDisc(cf.rival_discount)} off</strong> — you have the better deal.`
                const sharedNote = cf.shared ? ' This is a <strong>shared brand</strong> — customers can compare prices directly.' : ''
                return (
                  <div key={cf.rival_key+'_'+cf.your_key} style={{
                    background:sev.bg, border:`1px solid ${sev.border}40`, borderLeft:`3px solid ${sev.border}`,
                    borderRadius:'var(--r-sm)', padding:'13px 15px', marginBottom:8,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                      <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, letterSpacing:'0.08em', padding:'2px 8px', borderRadius:20, background:sev.badge, color:'#fff' }}>{sev.label.toUpperCase()}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:'var(--text-1)' }}>{cf.dayNames.join(', ')} · {cf.category.toUpperCase()}</div>
                      <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', marginLeft:'auto' }}>{cf.rival_name}</div>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-1)', marginBottom:6 }}
                      dangerouslySetInnerHTML={{ __html:`<strong>${cf.rival_name}</strong> has <em>${cf.rival_promo}</em> while you run <em>${cf.your_promo}</em>.${deeperNote}${sharedNote}` }}/>
                    <div style={{ background:'rgba(9,161,161,0.08)', border:'1px solid rgba(9,161,161,0.2)', borderRadius:6, padding:'8px 11px', fontSize:11, color:'var(--text-1)' }}>
                      <span style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color:'var(--accent)', marginRight:6 }}>→ SUGGESTION</span>
                      {getSuggestion(cf)}
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* Opportunities */}
        {insightFilter !== 'conflict' && (
          <div style={{ marginTop:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)' }}>○ Open market windows</div>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>{filteredOpps.length} identified</div>
            </div>
            {!filteredOpps.length
              ? <div style={{ padding:16, textAlign:'center', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-3)' }}>No open windows found — rival schedule is dense</div>
              : filteredOpps.map(op => (
                <div key={op.category} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:'3px solid var(--accent)', borderRadius:'var(--r-sm)', padding:'13px 15px', marginBottom:8, boxShadow:'var(--card-shadow)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, letterSpacing:'0.08em', padding:'2px 8px', borderRadius:20, background:'rgba(9,161,161,0.12)', color:'var(--accent)', border:'1px solid rgba(9,161,161,0.25)' }}>OPPORTUNITY</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:'var(--text-1)' }}>{op.category.toUpperCase()} · {op.dayNames.join(', ')}</div>
                    <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', marginLeft:'auto' }}>No rival coverage</div>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:8 }}>{OPP_WHY[op.category]||'This category is uncontested this week.'}</div>
                  <div style={{ background:'rgba(9,161,161,0.08)', border:'1px solid rgba(9,161,161,0.2)', borderRadius:6, padding:'8px 11px', fontSize:11, color:'var(--text-1)' }}>
                    <span style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color:'var(--accent)', marginRight:6 }}>→ SUGGESTION</span>
                    {OPP_SUGGEST[op.category]||'Consider adding a promo in this category.'}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Untapped mechanics */}
        {insights.mechanic_opps.length > 0 && (
          <div style={{ marginTop:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--warm)' }}>◑ Untapped promo mechanics</div>
              <div style={{ flex:1, height:1, background:'var(--border)' }}/>
            </div>
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'14px 16px', boxShadow:'var(--card-shadow)' }}>
              <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:10 }}>These promo formats are used by <strong>neither you nor any rival</strong> this week. Any of them could differentiate your schedule immediately.</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {insights.mechanic_opps.map(m => {
                  const info = MECH_SUGGEST[m.mechanic]
                  return (
                    <div key={m.mechanic} style={{ border:'1px solid var(--border)', borderRadius:6, padding:'9px 12px' }}>
                      <div style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color:'var(--warm)', marginBottom:4 }}>{m.label}</div>
                      {info && <>
                        <div style={{ fontSize:11, color:'var(--text-2)', marginBottom:5 }}>{info.why}</div>
                        <div style={{ fontSize:11, color:'var(--text-1)', fontWeight:600 }}>→ {info.suggest}</div>
                      </>}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Drawer ───────────────────────────────────────────────────────────────
  function Drawer() {
    if (!drawerPromo) return null
    const p = drawerPromo
    const r = drawerRival
    const col = subtypeColor(p.subtype)
    const daysRow = DAY_LABELS.map((d, i) => {
      const on = p.days[i]
      const bg = on ? col : 'var(--surface-3)'
      return (
        <div key={i} style={{
          width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--mono)', fontSize:10, fontWeight:700, background:bg,
          color: on ? '#fff' : 'var(--text-3)', border:`1px solid ${on ? bg : 'var(--border)'}`,
        }}>{d}</div>
      )
    })
    return (
      <>
        <div onClick={() => setDrawerKey(null)} style={{ position:'fixed', inset:0, zIndex:299, background:'rgba(0,0,0,0.3)' }}/>
        <div style={{
          position:'fixed', top:0, right:0, bottom:0, width:420, zIndex:300,
          background:'var(--surface)', borderLeft:'1px solid var(--border)',
          display:'flex', flexDirection:'column', boxShadow:'-8px 0 32px rgba(0,0,0,0.4)',
        }}>
          {/* Header */}
          <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, alignItems:'flex-start' }}>
            <button onClick={() => setDrawerKey(null)} style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:6, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width:14, height:14 }}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-1)', marginBottom:3, lineHeight:1.3 }}>{p.title}</div>
              <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', marginBottom:6 }}>
                {r ? `${r.name} · ${r.dist}` : ''}{r?.blocked ? ' · BLOCKED' : ''}
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background: subtypeSoft(p.subtype), color:col, fontWeight:700 }}>{ST[p.subtype]?.ico} {ST[p.subtype]?.label}</span>
                {p.time_window && <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background:'var(--surface-2)', color:'var(--text-2)', border:'1px solid var(--border)' }}>🕐 {p.time_window}</span>}
                {p.shared && <span style={{ fontFamily:'var(--mono)', fontSize:9, padding:'2px 6px', borderRadius:4, background:'rgba(9,161,161,0.1)', color:'var(--accent)', fontWeight:700 }}>◆ Shared</span>}
              </div>
            </div>
          </div>
          {/* Scroll body */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 18px' }}>
            {/* Stats */}
            <div style={{ display:'flex', gap:8, marginBottom:16 }}>
              {[
                { label: p.shared && p.gap ? 'Gap vs you' : 'Discount', val: p.gap || p.discount },
                { label: 'Time window', val: p.time_window || 'All day' },
                { label: 'Expires', val: p.expires === 'Standing' ? '∞' : p.expires.replace('Sun ','').replace('Wed ','') },
              ].map(s => (
                <div key={s.label} style={{ flex:1, background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 10px' }}>
                  <div style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color: s.label.includes('Gap') ? 'var(--danger)' : 'var(--text-1)', marginBottom:3 }}>{s.val}</div>
                  <div style={{ fontFamily:'var(--mono)', fontSize:8, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Days */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Active days this week</div>
              <div style={{ display:'flex', gap:3 }}>{daysRow}</div>
            </div>
            {/* Narrative */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>What this means</div>
              <div style={{ fontSize:12, color:'var(--text-1)', lineHeight:1.6 }}>{p.narrative}</div>
            </div>
            {/* Price table */}
            {p.rows.length > 0 && (
              <div>
                <div style={{ fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Price comparison</div>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                  <thead>
                    <tr>
                      {['SKU','Your price','Their price','Gap'].map(h => (
                        <th key={h} style={{ fontFamily:'var(--mono)', fontSize:9, fontWeight:700, color:'var(--text-3)', textAlign:'left', padding:'6px 8px', borderBottom:'1px solid var(--border)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.rows.map((rw, ri) => (
                      <tr key={ri} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'7px 8px', color:'var(--text-2)' }}>{rw.sku}</td>
                        <td style={{ padding:'7px 8px', color:'var(--text-2)' }}>{rw.yours}</td>
                        <td style={{ padding:'7px 8px', color: rw.pc==='d'?'var(--danger)':rw.pc==='w'?'var(--warm)':'var(--text-2)', fontWeight:600 }}>{rw.theirs}</td>
                        <td style={{ padding:'7px 8px' }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:10, fontWeight:700, color: rw.gc==='d'?'var(--danger)':rw.gc==='w'?'var(--warm)':'var(--text-2)' }}>{rw.gap}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {/* Footer */}
          <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:6 }}>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { showToast('Marked as reviewed'); setDrawerKey(null) }} style={{ flex:1, padding:'8px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, fontFamily:'var(--mono)', fontSize:10, color:'var(--text-1)', cursor:'pointer' }}>
                Mark reviewed
              </button>
              <button onClick={() => showToast('Opening price matrix...')} style={{ flex:1, padding:'8px 12px', background:'var(--accent)', border:'none', borderRadius:7, fontFamily:'var(--mono)', fontSize:10, color:'#fff', fontWeight:700, cursor:'pointer' }}>
                Open price matrix →
              </button>
            </div>
            {p.shared ? (
              <button onClick={() => showToast('Price response flow opened')} style={{ width:'100%', padding:'8px 12px', background:'rgba(212,148,166,0.1)', border:'1px solid rgba(212,148,166,0.3)', borderRadius:7, fontFamily:'var(--mono)', fontSize:10, color:'var(--rose)', fontWeight:700, cursor:'pointer' }}>
                Respond to price gap →
              </button>
            ) : p.subtype !== 'member_price' ? (
              <button onClick={() => showToast('Block flow opened')} style={{ width:'100%', padding:'8px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, fontFamily:'var(--mono)', fontSize:10, color:'var(--text-1)', cursor:'pointer' }}>
                Block this rival →
              </button>
            ) : null}
          </div>
        </div>
      </>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden', position:'relative' }}>

      {/* Topbar */}
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, flexShrink:0, background:'var(--surface)' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-1)' }}>Promotions Tracker</div>
          <div style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--text-3)', marginTop:2 }}>WeHo Flagship · Week of Apr 14</div>
        </div>
        <button onClick={() => showToast('Export downloaded')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:7, fontFamily:'var(--mono)', fontSize:10, color:'var(--text-1)', cursor:'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width:12, height:12 }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
        <button onClick={() => showToast('Opening price matrix...')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:'var(--accent)', border:'none', borderRadius:7, fontFamily:'var(--mono)', fontSize:10, color:'#fff', fontWeight:700, cursor:'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width:12, height:12 }}>
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Price matrix →
        </button>
      </div>

      {/* Controls */}
      <div style={{ padding:'8px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, flexShrink:0, background:'var(--surface)', flexWrap:'wrap' }}>
        {/* View toggle */}
        <div style={{ display:'flex', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
          {([['cal','Calendar',<svg key="c" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>],
            ['list','List',<svg key="l" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>],
            ['insights','Insights',<svg key="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:12,height:12}}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>],
          ] as [View, string, React.ReactNode][]).map(([v, label, icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                display:'flex', alignItems:'center', gap:5, padding:'5px 12px',
                background: view===v ? 'var(--accent)' : 'transparent',
                border:'none', cursor:'pointer',
                fontFamily:'var(--mono)', fontSize:10, fontWeight:700,
                color: view===v ? '#fff' : 'var(--text-2)',
                position:'relative',
              }}
            >
              {icon}{label}
              {v==='insights' && warningCount > 0 && (
                <span style={{ position:'absolute', top:1, right:2, minWidth:14, height:14, background:'var(--danger)', borderRadius:7, fontSize:8, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--mono)', padding:'0 2px' }}>{warningCount}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ width:1, height:20, background:'var(--border)' }}/>
        {/* Type dropdown */}
        <div data-pop-group="1">
          <Dd label="Type" value={activeType==='all'?'All types':activeType.replace('_',' ')} open={typePopOpen}
            onToggle={() => { closeAllPops(); setTypePopOpen(v => !v) }}>
            <DdOption selected={activeType==='all'} onClick={() => { setActiveType('all'); setTypePopOpen(false) }}>All types</DdOption>
            <div style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
            {([['flash','⚡ Flash sales'],['bogo','🔄 BOGO / Bundle'],['happy_hour','🕐 Happy Hour'],['early_bird','🌅 Early Bird'],['daily_deal','↺ Daily deal'],['weekly_deal','📅 Weekly deal'],['member_price','★ Member price']] as [FilterKey,string][]).map(([k,l]) => (
              <DdOption key={k} selected={activeType===k} onClick={() => { setActiveType(k); setTypePopOpen(false) }}>{l}</DdOption>
            ))}
            <div style={{ height:1, background:'var(--border)', margin:'4px 0' }}/>
            <DdOption selected={activeType==='shared'} onClick={() => { setActiveType('shared'); setTypePopOpen(false) }}>◆ Shared brand only</DdOption>
            <DdOption selected={activeType==='expiring'} onClick={() => { setActiveType('expiring'); setTypePopOpen(false) }}>⌛ Expiring soon</DdOption>
          </Dd>
        </div>
        <div style={{ width:1, height:20, background:'var(--border)' }}/>
        {/* Shared toggle */}
        <button
          onClick={() => setSharedOnly(v => !v)}
          style={{
            padding:'4px 10px', background: sharedOnly ? 'rgba(9,161,161,0.12)' : 'var(--surface-2)',
            border: `1px solid ${sharedOnly ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius:6, fontFamily:'var(--mono)', fontSize:10, color: sharedOnly ? 'var(--accent)' : 'var(--text-2)',
            cursor:'pointer', fontWeight: sharedOnly ? 700 : 400,
          }}
        >
          {sharedOnly ? '◆ Shared only' : 'All rivals'}
        </button>
        {/* Legend */}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          {[
            { label:'Flash/BOGO', bg:'rgba(224,90,106,0.25)', border:'var(--danger)' },
            { label:'HH/Early Bird', bg:'rgba(212,144,10,0.22)', border:'var(--warm)' },
            { label:'Recurring', bg:'rgba(84,132,164,0.18)', border:'var(--slate)' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>
              <div style={{ width:12, height:12, borderRadius:2, background:l.bg, border:`1.5px solid ${l.border}` }}/>
              {l.label}
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:4, fontFamily:'var(--mono)', fontSize:9, color:'var(--text-3)' }}>
            <div style={{ width:3, height:12, background:'var(--accent)', borderRadius:2 }}/>
            Shared brand
          </div>
        </div>
      </div>

      {/* Main scroll */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
        {/* Summary cards */}
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <SummaryCard id="sc-flash" filter="flash" count={flashCount} label="Flash & BOGO" sub="Limited-time deals" ico="⚡" numColor="var(--danger)" borderColor="var(--danger)" bgColor="224,90,106" />
          <SummaryCard id="sc-timed" filter="timed" count={timedCount} label="Happy Hour & Early Bird" sub="Time-restricted deals" ico="🕐" numColor="var(--warm)" borderColor="var(--warm)" bgColor="212,144,10" />
          <SummaryCard id="sc-rec" filter="recurring" count={recurCount} label="Daily & Weekly" sub="Standing recurring deals" ico="↺" numColor="var(--warm)" borderColor="var(--warm)" bgColor="212,144,10" />
          <SummaryCard id="sc-shared" filter="shared" count={sharedCount} label="Shared Brand Promos" sub="Direct pricing exposure" ico="◆" numColor="var(--accent)" borderColor="var(--accent)" bgColor="9,161,161" />
          <SummaryCard id="sc-exp" filter="expiring" count={expiringCount} label="Expiring This Week" sub="Ends Sun Apr 20" ico="⌛" numColor="var(--rose)" borderColor="var(--rose)" bgColor="212,148,166" />
        </div>

        {/* View panels */}
        {view === 'cal' && <CalView />}
        {view === 'list' && <ListView />}
        {view === 'insights' && <InsightsView />}
      </div>

      {/* Drawer */}
      <Drawer />

      {/* Toast */}
      {toastVisible && (
        <div style={{
          position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
          background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:8,
          padding:'9px 18px', fontFamily:'var(--mono)', fontSize:11, color:'var(--text-1)',
          boxShadow:'0 8px 24px rgba(0,0,0,0.4)', zIndex:400, whiteSpace:'nowrap',
        }}>{toastMsg}</div>
      )}
    </div>
  )
}
