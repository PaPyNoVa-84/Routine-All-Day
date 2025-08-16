// src/pages/Routine.jsx
import React, { useMemo, useState } from 'react'

/**
 * 🔒 Persistance
 * - Routine "Général" : par jour (clé date ISO du jour)
 * - Routine par JOUR de la semaine : par semaine → jour → id
 */
const GEN_KEY_PREFIX = 'rt:gen:'         // ex: rt:gen:2025-08-16
const WEEK_KEY       = 'rt:weekChecks'    // ex: { "2025-08-11": { "Lundi": { id:true } } }

const getGen = (iso) => JSON.parse(localStorage.getItem(GEN_KEY_PREFIX + iso) || '{}')
const setGen = (iso, v) => localStorage.setItem(GEN_KEY_PREFIX + iso, JSON.stringify(v))

const getWeek = () => JSON.parse(localStorage.getItem(WEEK_KEY) || '{}')
const setWeek = (v) => localStorage.setItem(WEEK_KEY, JSON.stringify(v))

// lundi de la semaine (YYYY-MM-DD)
const startOfWeekISO = (d = new Date()) => {
  const t = new Date(d); t.setHours(0,0,0,0)
  const w = (t.getDay() + 6) % 7 // 0..6 (lun=0)
  t.setDate(t.getDate() - w)
  return t.toISOString().slice(0,10)
}

const daysFR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']

/**
 * 🧩 Routine Généraliste (checklist quotidienne)
 * Tu peux ajuster ces items à ta guise.
 */
const generalRoutine = [
  { id:'g1', text:"Hydratation (1,5L)" },
  { id:'g2', text:"Étirements 10 min" },
  { id:'g3', text:"Skincare" },
  { id:'g4', text:"Sport/Marcher" },
  { id:'g5', text:"Travail/Verif Stats" },
]

/**
 * 📅 Routine Hebdo (ton emploi du temps jour par jour)
 * Copiée de ce que tu m’as donné pour rester autonome dans cette page.
 * (Si tu veux, on pourra la lire depuis Habits.jsx pour éviter la duplication.)
 */
const defaultTemplate = {
  Lundi: [
    { id: 'lu1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'lu2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'lu3', time: '10:00', text: 'Sport (natation/muscu maison)' },
    { id: 'lu4', time: '11:30', text: 'Douche + skincare' },
    { id: 'lu5', time: '12:00', text: 'Repas healthy' },
    { id: 'lu6', time: '13:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'lu7', time: '16:00', text: 'Pause / Gaming' },
    { id: 'lu8', time: '19:00', text: 'Repas' },
    { id: 'lu9', time: '22:30', text: 'Douche chaude' },
    { id: 'lu10', time: '23:00', text: 'Film' },
    { id: 'lu11', time: '00:00', text: 'Coucher' },
  ],
  Mardi: [
    { id: 'ma1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'ma2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'ma3', time: '10:00', text: 'Stats Pinterest' },
    { id: 'ma4', time: '11:00', text: 'Natation' },
    { id: 'ma5', time: '12:30', text: 'Repas healthy' },
    { id: 'ma6', time: '14:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'ma7', time: '16:30', text: 'Gaming' },
    { id: 'ma8', time: '19:00', text: 'Repas' },
    { id: 'ma9', time: '22:30', text: 'Douche chaude' },
    { id: 'ma10', time: '23:00', text: 'Film' },
    { id: 'ma11', time: '00:00', text: 'Coucher' },
  ],
  Mercredi: [
    { id: 'me1', time: '10:30', text: 'Réveil + hydratation + étirements + fruits' },
    { id: 'me2', time: '11:30', text: 'Natation / repas' },
    { id: 'me3', time: '14:00', text: 'Famille' },
    { id: 'me4', time: '20:00', text: 'Repas' },
    { id: 'me5', time: '22:30', text: 'Douche chaude' },
    { id: 'me6', time: '23:00', text: 'Film' },
    { id: 'me7', time: '00:00', text: 'Coucher' },
  ],
  Jeudi: [
    { id: 'je1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 'je2', time: '09:30', text: 'Étirements + fruits' },
    { id: 'je3', time: '10:00', text: 'Sport (natation/muscu maison)' },
    { id: 'je4', time: '11:30', text: 'Douche + skincare' },
    { id: 'je5', time: '12:00', text: 'Repas healthy' },
    { id: 'je6', time: '13:00', text: 'Deep work Pinterest/Shopify' },
    { id: 'je7', time: '15:30', text: 'Gaming' },
    { id: 'je8', time: '19:00', text: 'Repas' },
    { id: 'je9', time: '22:30', text: 'Douche chaude' },
    { id: 'je10', time: '23:00', text: 'Film' },
    { id: 'je11', time: '00:00', text: 'Coucher' },
  ],
  Vendredi: [
    { id: 've1', time: '09:00', text: 'Réveil + hydratation' },
    { id: 've2', time: '09:30', text: 'Étirements + fruits' },
    { id: 've3', time: '10:00', text: 'Sport (natation/muscu maison)' },
    { id: 've4', time: '11:30', text: 'Douche + skincare' },
    { id: 've5', time: '12:00', text: 'Repas healthy' },
    { id: 've6', time: '13:00', text: 'Deep work Pinterest/Shopify' },
    { id: 've7', time: '15:30', text: 'Gaming' },
    { id: 've8', time: '19:00', text: 'Repas' },
    { id: 've9', time: '22:30', text: 'Douche chaude' },
    { id: 've10', time: '23:00', text: 'Film' },
    { id: 've11', time: '00:00', text: 'Coucher' },
  ],
  Samedi: [
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
  Dimanche: [
    { id: 'di1', time: '10:30', text: 'Réveil + hydratation + étirements + fruits' },
    { id: 'di2', time: '11:30', text: 'Natation / repas' },
    { id: 'di3', time: '14:00', text: 'Famille' },
    { id: 'di4', time: '20:00', text: 'Repas' },
    { id: 'di5', time: '22:30', text: 'Douche chaude' },
    { id: 'di6', time: '23:00', text: 'Film' },
    { id: 'di7', time: '00:00', text: 'Coucher' },
  ],
}

export default function Routine() {
  const [tab, setTab] = useState('general') // 'general' | 'weekly'
  const [currentDay, setCurrentDay] = useState(() => {
    const g = new Date().getDay() // 0..6 (dim=0)
    return daysFR[g === 0 ? 6 : g - 1] // map vers 0..6 (lun..dim)
  })
  const weekKey = startOfWeekISO()
  const todayISO = useMemo(() => {
    const t = new Date(); t.setHours(0,0,0,0)
    return t.toISOString().slice(0,10)
  }, [])

  // --- Actions génériques (par jour calendrier)
  const genChecked = (id) => !!getGen(todayISO)[id]
  const genToggle  = (id) => {
    const obj = getGen(todayISO)
    obj[id] = !obj[id]
    setGen(todayISO, obj)
    setTick(t=>t+1)
  }

  // --- Actions hebdo (par semaine → jour → id)
  const dayChecked = (day, id) => !!getWeek()?.[weekKey]?.[day]?.[id]
  const dayToggle  = (day, id) => {
    const wk = getWeek()
    wk[weekKey] = wk[weekKey] || {}
    wk[weekKey][day] = wk[weekKey][day] || {}
    wk[weekKey][day][id] = !wk[weekKey][day][id]
    setWeek(wk)
    setTick(t=>t+1)
  }

  const [tick, setTick] = useState(0) // force re-render minimal

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">ROUTINE</div>
            <h2 className="text-xl md:text-2xl font-bold">Routine généraliste & hebdo</h2>
          </div>
          <span className="badge">Semaine du {weekKey}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 text-sm">
        <button
          onClick={()=>setTab('general')}
          className={`px-3 py-2 rounded-lg border ${tab==='general' ? 'bg-black text-white dark:bg-white dark:text-black':''}`}
        >
          Général
        </button>
        <button
          onClick={()=>setTab('weekly')}
          className={`px-3 py-2 rounded-lg border ${tab==='weekly' ? 'bg-black text-white dark:bg-white dark:text-black':''}`}
        >
          Hebdo
        </button>
      </div>

      {/* GENERAL — checklist du jour (indépendante des jours de la semaine) */}
      {tab==='general' && (
        <div className="card p-5 md:p-6 space-y-2">
          <div className="text-sm font-semibold opacity-80 mb-1">
            Aujourd’hui — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </div>
          {generalRoutine.map(item => (
            <label key={item.id} className="flex items-center gap-2 rounded-lg border border-zinc-200/50 dark:border-slate-700/60 px-3 py-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={genChecked(item.id)}
                onChange={()=>genToggle(item.id)}
              />
              <span className="text-sm">{item.text}</span>
            </label>
          ))}
        </div>
      )}

      {/* HEBDO — un seul jour visible à la fois + nav jours */}
      {tab==='weekly' && (
        <div className="card p-5 md:p-6 space-y-4">
          {/* Navigation jours */}
          <div className="flex flex-wrap gap-2">
            {daysFR.map(d => (
              <button
                key={d}
                onClick={()=>setCurrentDay(d)}
                className={`px-3 py-2 rounded-lg border ${currentDay===d ? 'bg-black text-white dark:bg-white dark:text-black':''}`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Liste cochable du jour sélectionné */}
          <div className="space-y-2">
            <div className="text-sm font-semibold opacity-80">{currentDay}</div>
            {(defaultTemplate[currentDay] || []).map(item => (
              <label
                key={item.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-200/50 dark:border-slate-700/60 px-3 py-2"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={dayChecked(currentDay, item.id)}
                  onChange={()=>dayToggle(currentDay, item.id)}
                />
                <span className="text-sm">
                  <span className="opacity-60 mr-2">{item.time}</span>{item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
