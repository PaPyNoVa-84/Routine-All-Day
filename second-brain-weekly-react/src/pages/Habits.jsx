import React, { useEffect, useMemo, useState } from 'react'

// Helpers
const todayKey = () => new Date().toISOString().slice(0,10)
const load = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f } catch { return f } }
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

const defaultHabits = [
  { id:'h_water', name:"Boire 1,5L d'eau" },
  { id:'h_focus', name:'1 session focus (Pomodoro)' },
  { id:'h_walk', name:'Marche 20 min' },
  { id:'h_learning', name:'Formation 30 min' },
]

const defaultTemplate = {
  Mon: [
    { id:'mon-0800', time:'08:00', text:"Hydratation + routine soin" },
    { id:'mon-0900', time:'09:00', text:"Deep Work — Produit/Pubs" },
    { id:'mon-1115', time:'11:15', text:"Créa visuels / copies" },
    { id:'mon-1400', time:'14:00', text:"Analyse KPI / itérations" },
    { id:'mon-1800', time:'18:00', text:"Sport" }
  ],
  Tue: [
    { id:'tue-0800', time:'08:00', text:"Hydratation + marche 10 min" },
    { id:'tue-0900', time:'09:00', text:"Deep Work — Offre" },
    { id:'tue-1100', time:'11:00', text:"UGC / Créa publicités" },
    { id:'tue-1600', time:'16:00', text:"Admin / mails" },
    { id:'tue-1830', time:'18:30', text:"Marche 20 min" }
  ],
  Wed: [],
  Thu: [],
  Fri: [],
  Sat: [],
  Sun: [
    { id:'sun-1030', time:'10:30', text:"Réveil + hydratation + étirements + fruits" },
    { id:'sun-1130', time:'11:30', text:"Natation / repas" },
    { id:'sun-1400', time:'14:00', text:"Famille" },
    { id:'sun-2000', time:'20:00', text:"Repas" },
    { id:'sun-2230', time:'22:30', text:"Douche chaude" },
    { id:'sun-2300', time:'23:00', text:"Film" },
    { id:'sun-0000', time:'00:00', text:"Coucher" }
  ]
}

const wd =  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const wdLabel = { Mon:'Lundi', Tue:'Mardi', Wed:'Mercredi', Thu:'Jeudi', Fri:'Vendredi', Sat:'Samedi', Sun:'Dimanche' }

function Section({ title, right, children }){
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

export default function Habits(){
  // Habitudes quotidiennes
  const [habits, setHabits] = useState(()=> load('habits:list', defaultHabits))
  const [done, setDone] = useState(()=> load('habits:done:'+todayKey(), {}) )
  const [newHabit, setNewHabit] = useState('')
  const doneCount = Object.values(done).filter(Boolean).length

  useEffect(()=> save('habits:list', habits), [habits])
  useEffect(()=> save('habits:done:'+todayKey(), done), [done])

  const addHabit = ()=>{
    if(!newHabit.trim()) return
    setHabits(h=> [...h, { id: crypto.randomUUID(), name:newHabit.trim() } ])
    setNewHabit('')
  }
  const removeHabit = (id)=> setHabits(h=> h.filter(x=>x.id!==id))
  const toggle = (id)=> setDone(d=> ({ ...d, [id]: !d[id] }))

  // Routine Hebdo (template + checklist du jour)
  const [tmpl, setTmpl] = useState(()=> load('routine:template', defaultTemplate))
  const [tab, setTab] = useState('daily') // 'daily' | 'week'
  const today = new Date()
  const todayWd = wd[today.getDay()]
  const [currentDay, setCurrentDay] = useState(todayWd)
  useEffect(()=> save('routine:template', tmpl), [tmpl])

  const addItem = (day)=> setTmpl(t=> ({ ...t, [day]: [...(t[day]||[]), { id: crypto.randomUUID(), time:'09:00', text:'Nouvelle action' }] }))
  const removeItem = (day, id)=> setTmpl(t=> ({ ...t, [day]: (t[day]||[]).filter(x=>x.id!==id) }))
  const updateItem = (day, id, patch)=> setTmpl(t=> ({ ...t, [day]: (t[day]||[]).map(x=> x.id===id ? { ...x, ...patch } : x ) }))

  // Checklist “Aujourd’hui” basée sur le template du jour
  const [todayCheck, setTodayCheck] = useState(()=> load('routine:done:'+todayKey(), {}))
  useEffect(()=> save('routine:done:'+todayKey(), todayCheck), [todayCheck])
  const todayList = (tmpl[todayWd]||[]).sort((a,b)=> a.time.localeCompare(b.time))

  return (
    <div className="container py-6 space-y-4">
      <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Mes habitudes & routine</div>
      <h1 className="text-2xl font-bold mb-2">Habitudes</h1>

      {/* Onglets */}
      <div className="flex gap-2 text-sm mb-2">
        <button onClick={()=>setTab('daily')} className={`px-3 py-1.5 rounded-xl border ${tab==='daily' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'border-zinc-200 dark:border-zinc-800'}`}>Habitudes quotidiennes</button>
        <button onClick={()=>setTab('week')} className={`px-3 py-1.5 rounded-xl border ${tab==='week' ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'border-zinc-200 dark:border-zinc-800'}`}>Routine hebdo</button>
      </div>

      {tab==='daily' && (
        <div className="grid md:grid-cols-2 gap-4">
          <Section title="Checklist du jour" right={<span className="badge">{doneCount}/{habits.length}</span>}>
            <div className="space-y-2">
              {habits.map(h=> (
                <label key={h.id} className="flex items-center justify-between rounded-xl border p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={!!done[h.id]} onChange={()=>toggle(h.id)} className="h-5 w-5"/>
                    <span>{h.name}</span>
                  </div>
                  <button onClick={()=>removeHabit(h.id)} className="text-zinc-400 hover:text-red-500">Supprimer</button>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Ajouter / éditer" right={<span className="badge">Personnalise</span>}>
            <div className="flex gap-2 mb-3">
              <input value={newHabit} onChange={e=>setNewHabit(e.target.value)} placeholder="Nouvelle habitude" className="border rounded-xl px-3 py-2 w-full"/>
              <button onClick={addHabit} className="px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black">Ajouter</button>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">Astuce : garde 4–6 habitudes max. L’objectif est la régularité, pas la perfection.</p>
          </Section>

          <Section title="Checklist d'aujourd'hui (à partir de la routine)" right={<span className="badge">{todayList.length} étapes</span>}>
            <div className="space-y-2">
              {todayList.map(it => (
                <label key={it.id} className="flex items-center justify-between rounded-xl border p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={!!todayCheck[it.id]} onChange={()=> setTodayCheck(s=> ({...s, [it.id]: !s[it.id]})) } className="h-5 w-5"/>
                    <span className="font-medium tabular-nums">{it.time}</span>
                    <span>{it.text}</span>
                  </div>
                </label>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab==='week' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <button key={d} onClick={()=>setCurrentDay(d)} className={`px-3 py-1.5 rounded-xl border ${currentDay===d ? 'bg-zinc-900 text-white dark:bg-white dark:text-black' : 'border-zinc-200 dark:border-zinc-800'}`}>{wdLabel[d]}</button>
            ))}
          </div>

          <Section title={`Routine — ${wdLabel[currentDay]}`} right={<button onClick={()=>addItem(currentDay)} className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">+ Étape</button>}>
            <div className="space-y-2">
              {(tmpl[currentDay]||[]).sort((a,b)=> a.time.localeCompare(b.time)).map(it => (
                <div key={it.id} className="flex items-center gap-2 border rounded-xl p-2 dark:border-zinc-800">
                  <input type="time" value={it.time} onChange={e=>updateItem(currentDay, it.id, { time: e.target.value })} className="border rounded-xl px-2 py-1"/>
                  <input value={it.text} onChange={e=>updateItem(currentDay, it.id, { text: e.target.value })} className="border rounded-xl px-3 py-1 w-full"/>
                  <button onClick={()=>removeItem(currentDay, it.id)} className="px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800">Suppr</button>
                </div>
              ))}
              {(!tmpl[currentDay] || tmpl[currentDay].length===0) && <div className="text-sm text-zinc-500">Aucune étape — ajoute ta première avec “+ Étape”.</div>}
            </div>
          </Section>

          <Section title="Exporter / Importer" right={<span className="badge">Sauvegarde</span>}>
            <div className="flex flex-wrap gap-2 text-sm">
              <button onClick={()=>{
                const data = { habits, tmpl }
                const blob = new Blob([JSON.stringify(data,null,2)], { type:'application/json' })
                const url = URL.createObjectURL(blob); const a=document.createElement('a')
                a.href = url; a.download = 'habitudes-routine.json'; a.click(); URL.revokeObjectURL(url)
              }} className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">Exporter</button>
              <label className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 cursor-pointer">
                Importer
                <input type="file" accept="application/json" className="hidden" onChange={async (e)=>{
                  const f=e.target.files?.[0]; if(!f) return; const txt=await f.text(); try{ const p=JSON.parse(txt); if(p.habits) setHabits(p.habits); if(p.tmpl) setTmpl(p.tmpl);}catch{ alert('Fichier invalide') }
                }}/>
              </label>
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
