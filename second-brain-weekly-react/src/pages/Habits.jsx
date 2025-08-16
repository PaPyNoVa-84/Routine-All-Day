import React, { useEffect, useMemo, useState, useCallback } from 'react'

/* ========= Helpers date & storage ========= */
const todayKey = () => new Date().toISOString().slice(0,10)
const load = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } }
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

/* Temps restant jusqu’à minuit (reset quotidien des habitudes) */
function msUntilMidnight() {
  const now = new Date()
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}

/* Temps restant jusqu’au prochain lundi 00:00 (reset hebdo routine) */
function msUntilNextMonday() {
  const now = new Date()
  const next = new Date(now)
  const day = now.getDay() // 0=dim, 1=lun, ...6=sam
  const add = (8 - day) % 7 || 7
  next.setDate(now.getDate() + add)
  next.setHours(0, 0, 0, 0)
  return next.getTime() - now.getTime()
}

/* ========= Habitudes par défaut ========= */
const defaultHabits = [
  { id:'h_water',   name:"Boire 1,5L d'eau" },
  { id:'h_sport',   name:'Sport 30–60 min' },
  { id:'h_work2h',  name:'2h travail' },
  { id:'h_family',  name:'Famille' },
  { id:'h_house',   name:'Tâches ménagères' },
  { id:'h_stretch', name:'Étirements' },
]

/* ========= Routine hebdo par défaut (planning simplifié) ========= */
/* IMPORTANT: clés en anglais (Mon..Sun) pour le code, libellés FR pour l’affichage */
const defaultTemplate = {
  Mon: [
    { id: 'mo1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'mo2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'mo3', time: '10:00', text: 'Sport (natation/muscu maison)' },
    { id: 'mo4', time: '11:30', text: 'Douche + skincare' },
    { id: 'mo5', time: '12:00', text: 'Repas healthy' },
    { id: 'mo6', time: '13:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'mo7', time: '16:00', text: 'Pause / Gaming' },
    { id: 'mo8', time: '19:00', text: 'Repas' },
    { id: 'mo9', time: '22:30', text: 'Douche chaude' },
    { id: 'mo10', time: '23:00', text: 'Film' },
    { id: 'mo11', time: '00:00', text: 'Coucher' },
  ],
  Tue: [
    { id: 'tu1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'tu2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'tu3', time: '10:00', text: 'Stats Pinterest' },
    { id: 'tu4', time: '11:00', text: 'Natation' },
    { id: 'tu5', time: '12:30', text: 'Repas healthy' },
    { id: 'tu6', time: '14:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'tu7', time: '16:30', text: 'Gaming' },
    { id: 'tu8', time: '19:00', text: 'Repas' },
    { id: 'tu9', time: '22:30', text: 'Douche chaude' },
    { id: 'tu10', time: '23:00', text: 'Film' },
    { id: 'tu11', time: '00:00', text: 'Coucher' },
  ],
  Wed: [
    { id: 'we1', time: '10:30', text: 'Réveil + hydratation + étirements + fruits' },
    { id: 'we2', time: '11:30', text: 'Natation / repas' },
    { id: 'we3', time: '14:00', text: 'Famille' },
    { id: 'we4', time: '20:00', text: 'Repas' },
    { id: 'we5', time: '22:30', text: 'Douche chaude' },
    { id: 'we6', time: '23:00', text: 'Film' },
    { id: 'we7', time: '00:00', text: 'Coucher' },
  ],
  Thu: [
    { id: 'th1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'th2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'th3', time: '10:00', text: 'Sport (natation/muscu maison)' },
    { id: 'th4', time: '11:30', text: 'Douche + skincare' },
    { id: 'th5', time: '12:00', text: 'Repas healthy' },
    { id: 'th6', time: '13:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'th7', time: '15:30', text: 'Gaming' },
    { id: 'th8', time: '19:00', text: 'Repas' },
    { id: 'th9', time: '22:30', text: 'Douche chaude' },
    { id: 'th10', time: '23:00', text: 'Film' },
    { id: 'th11', time: '00:00', text: 'Coucher' },
  ],
  Fri: [
    { id: 'fr1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'fr2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'fr3', time: '10:00', text: 'Sport (natation/muscu maison)' },
    { id: 'fr4', time: '11:30', text: 'Douche + skincare' },
    { id: 'fr5', time: '12:00', text: 'Repas healthy' },
    { id: 'fr6', time: '13:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'fr7', time: '15:30', text: 'Gaming' },
    { id: 'fr8', time: '19:00', text: 'Repas' },
    { id: 'fr9', time: '22:30', text: 'Douche chaude' },
    { id: 'fr10', time: '23:00', text: 'Film' },
    { id: 'fr11', time: '00:00', text: 'Coucher' },
  ],
  Sat: [
    { id: 'sa1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'sa2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'sa3', time: '10:00', text: 'Sport (natation/muscu maison)' },
    { id: 'sa4', time: '11:30', text: 'Douche + skincare' },
    { id: 'sa5', time: '12:00', text: 'Repas healthy' },
    { id: 'sa6', time: '13:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'sa7', time: '15:30', text: 'Gaming (long)' },
    { id: 'sa8', time: '19:00', text: 'Repas' },
    { id: 'sa9', time: '22:30', text: 'Douche chaude' },
    { id: 'sa10', time: '23:00', text: 'Film' },
    { id: 'sa11', time: '00:00', text: 'Coucher' },
  ],
  Sun: [
    { id: 'su1', time: '10:30', text: 'Réveil + hydratation + étirements + fruits' },
    { id: 'su2', time: '11:30', text: 'Natation / repas' },
    { id: 'su3', time: '14:00', text: 'Famille' },
    { id: 'su4', time: '20:00', text: 'Repas' },
    { id: 'su5', time: '22:30', text: 'Douche chaude' },
    { id: 'su6', time: '23:00', text: 'Film' },
    { id: 'su7', time: '00:00', text: 'Coucher' },
  ],
}

/* Ordre des jours & libellés FR */
const wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const wdLabel = { Mon:'Lundi', Tue:'Mardi', Wed:'Mercredi', Thu:'Jeudi', Fri:'Vendredi', Sat:'Samedi', Sun:'Dimanche' }

/* ========= UI helpers ========= */
function Section({ title, right, children }) {
  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{title}</div>
        <div>{right}</div>
      </div>
      {children}
    </div>
  )
}

function ProgressRing({ value=0, size=84, stroke=10 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const o = c * (1 - Math.min(Math.max(value,0),1))
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#e5e7eb" className="dark:stroke-zinc-800" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--accent)" strokeWidth={stroke} fill="none"
              style={{transform:'rotate(-90deg)', transformOrigin:'50% 50%'}}
              strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round"/>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" className="text-sm font-semibold">
        {Math.round(value*100)}%
      </text>
    </svg>
  )
}

/* ========= composant principal ========= */
export default function Habits(){
  const [tab, setTab] = useState('daily') // daily | week

  /* --- HABITUDES (liste + reset quotidien) --- */
  const HABITS_KEY = 'habits:list:v2'
  const [habits, setHabits] = useState(()=> load(HABITS_KEY, defaultHabits))
  const [done, setDone] = useState(()=> load('habits:done:'+todayKey(), {}))
  const [newHabit, setNewHabit] = useState('')

  useEffect(()=> save(HABITS_KEY, habits), [habits])
  useEffect(()=> save('habits:done:'+todayKey(), done), [done])

  const toggleHabit = id => setDone(d => ({ ...d, [id]: !d[id] }))
  const addHabit = ()=>{
    const n = newHabit.trim(); if(!n) return
    setHabits(h => [...h, { id: crypto.randomUUID(), name:n }]); setNewHabit('')
  }
  const removeHabit = id => setHabits(h => h.filter(x => x.id!==id))
  const progress = useMemo(()=> habits.length ? Object.values(done).filter(Boolean).length / habits.length : 0, [done, habits])

  /* --- ROUTINE HEBDO (reset chaque lundi 00:00) --- */
  const ROUTINE_KEY = 'routine:template:v3' // bump -> charge ces nouveaux defaults
  const [tmpl, setTmpl] = useState(()=> load(ROUTINE_KEY, defaultTemplate))
  useEffect(()=> save(ROUTINE_KEY, tmpl), [tmpl])

  // garde-fou : si rien en storage, recharge les defaults
  useEffect(() => {
    if (!tmpl || Object.keys(tmpl).length === 0 || !tmpl.Mon) setTmpl(defaultTemplate)
  }, []) // une seule fois

  const todayWd = wd[new Date().getDay()]
  const [currentDay, setCurrentDay] = useState(todayWd)

  const addStep = day => setTmpl(t => ({ ...t, [day]: [...(t[day]||[]), { id:crypto.randomUUID(), time:'09:00', text:'Nouvelle étape' }] }))
  const rmStep = (day,id) => setTmpl(t => ({ ...t, [day]: (t[day]||[]).filter(x => x.id!==id) }))
  const updStep = (day,id,patch) => setTmpl(t => ({ ...t, [day]: (t[day]||[]).map(x => x.id===id ? { ...x, ...patch } : x) }))

  // cases cochées "Aujourd’hui" (issues de la routine)
  const [todayCheck, setTodayCheck] = useState(()=> load('routine:done:'+todayKey(), {}))
  useEffect(()=> save('routine:done:'+todayKey(), todayCheck), [todayCheck])
  const todayList = (tmpl[todayWd]||[]).sort((a,b)=> a.time.localeCompare(b.time))

  /* ======= REMISES À ZÉRO ======= */

  // 1) Habitudes : reset QUOTIDIEN à 00:00
  const resetDailyHabits = useCallback(() => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('habits:done:')) localStorage.removeItem(k)
    })
    setDone({})
    localStorage.setItem('habits:lastDate', todayKey())
  }, [])

  useEffect(() => {
    const today = todayKey()
    const last = localStorage.getItem('habits:lastDate')
    if (last !== today) resetDailyHabits()
    const t = setTimeout(() => resetDailyHabits(), msUntilMidnight())
    return () => clearTimeout(t)
  }, [resetDailyHabits])

  // 2) Routine : reset HEBDOMADAIRE chaque LUNDI 00:00
  const resetWeeklyRoutine = useCallback(() => {
    // supprime toutes les coches de routine (pour tous les jours)
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('routine:done:')) localStorage.removeItem(k)
    })
    // remet la liste du jour (UI) à vide
    setTodayCheck({})
    // mémorise la date du dernier lundi pour ne pas boucler
    localStorage.setItem('routine:lastMonday', new Date().toISOString().slice(0,10))
  }, [])

  useEffect(() => {
    // Au chargement : si on est lundi ET que ce n'est pas déjà fait aujourd'hui -> reset
    const now = new Date()
    const isMonday = now.getDay() === 1
    const lastMonday = localStorage.getItem('routine:lastMonday')
    const today = todayKey()
    if (isMonday && lastMonday !== today) resetWeeklyRoutine()

    // Programme le prochain reset pour le prochain lundi 00:00
    const t = setTimeout(() => resetWeeklyRoutine(), msUntilNextMonday())
    return () => clearTimeout(t)
  }, [resetWeeklyRoutine])

  /* ========= rendu ========= */
  return (
    <div className="container py-6 space-y-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wider">Mes habitudes & routine</div>
      <h1 className="text-2xl font-bold">Habitudes</h1>

      {/* Onglets sticky */}
      <div className="sticky-tabs mt-2">
        <div className="sticky-tabs-inner inline-flex gap-1">
          <button onClick={()=>setTab('daily')}  className={`px-3 py-1.5 rounded-xl ${tab==='daily' ? 'text-white' : 'border border-transparent'}`} style={tab==='daily'?{background:'var(--accent)'}:{}} >
            Habitudes quotidiennes
          </button>
          <button onClick={()=>setTab('week')} className={`px-3 py-1.5 rounded-xl ${tab==='week' ? 'text-white' : 'border border-transparent'}`} style={tab==='week'?{background:'var(--accent)'}:{}} >
            Routine hebdo
          </button>
        </div>
      </div>

      {tab==='daily' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Section
            title="Checklist du jour"
            right={
              <div className="flex items-center gap-3">
                <span className="badge">{Object.values(done).filter(Boolean).length}/{habits.length}</span>
                <ProgressRing value={progress}/>
                <button
                  onClick={resetDailyHabits}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm"
                  title="Remettre à zéro les coches d’habitudes"
                >
                  Réinitialiser
                </button>
              </div>
            }
          >
            <div className="space-y-2">
              {habits.map(h => (
                <label key={h.id} className="flex items-center justify-between rounded-xl border p-3 dark:border-zinc-800 hover:shadow">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="h-5 w-5" checked={!!done[h.id]} onChange={()=>toggleHabit(h.id)} />
                    <span>{h.name}</span>
                  </div>
                  <button onClick={()=>removeHabit(h.id)} className="text-zinc-400 hover:text-red-500">Supprimer</button>
                </label>
              ))}
              {habits.length===0 && <div className="text-sm text-zinc-500">Aucune habitude pour l’instant.</div>}
            </div>
          </Section>

          <Section title="Ajouter / éditer">
            <div className="flex gap-2">
              <input value={newHabit} onChange={e=>setNewHabit(e.target.value)} placeholder="Nouvelle habitude"
                     className="border rounded-xl px-3 py-2 w-full dark:border-zinc-800"/>
              <button onClick={addHabit} className="px-3 py-2 rounded-xl text-white" style={{background:'var(--accent)'}}>Ajouter</button>
            </div>
          </Section>

          <Section title={`Aujourd’hui — ${wdLabel[wd[new Date().getDay()]]}`} right={<span className="badge">{todayList.length} étapes</span>}>
            <div className="space-y-2">
              {todayList.map(it => (
                <label key={it.id} className="flex items-center gap-3 rounded-xl border p-3 dark:border-zinc-800">
                  <input type="checkbox" className="h-5 w-5" checked={!!todayCheck[it.id]}
                         onChange={()=>setTodayCheck(s=>({...s, [it.id]: !s[it.id]}))}/>
                  <span className="font-medium tabular-nums">{it.time}</span>
                  <span>{it.text}</span>
                </label>
              ))}
              {todayList.length===0 && <div className="text-sm text-zinc-500">Aucune étape prévue.</div>}
            </div>
          </Section>
        </div>
      )}

      {tab==='week' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <button key={d} onClick={()=>setCurrentDay(d)}
                className={`px-3 py-1.5 rounded-xl border ${currentDay===d?'text-white':''}`}
                style={currentDay===d?{background:'var(--accent)'}:{}} >
                {wdLabel[d]}
              </button>
            ))}
          </div>

          <Section title={`Routine — ${wdLabel[currentDay]}`} right={
            <button onClick={()=>addStep(currentDay)} className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">+ Étape</button>
          }>
            <div className="space-y-2">
              {(tmpl[currentDay]||[]).sort((a,b)=>a.time.localeCompare(b.time)).map(it => (
                <div key={it.id} className="flex items-center gap-2 border rounded-xl p-2 dark:border-zinc-800">
                  <input type="time" value={it.time} onChange={e=>updStep(currentDay, it.id, { time:e.target.value })} className="border rounded-xl px-2 py-1 dark:border-zinc-800"/>
                  <input value={it.text} onChange={e=>updStep(currentDay, it.id, { text:e.target.value })} className="border rounded-xl px-3 py-1 w-full dark:border-zinc-800"/>
                  <button onClick={()=>rmStep(currentDay, it.id)} className="px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800">Suppr</button>
                </div>
              ))}
              {(!tmpl[currentDay] || tmpl[currentDay].length===0) && <div className="text-sm text-zinc-500">Aucune étape — ajoute ta première avec “+ Étape”.</div>}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
