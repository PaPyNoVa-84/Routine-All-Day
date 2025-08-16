// src/pages/Habits.jsx
import React, { useMemo, useState } from 'react'

// ------------------------------------------------------------------
// 1) Données : ta semaine complète (exacte)
// ------------------------------------------------------------------
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

// Ordre FR
const daysFR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']

// ------------------------------------------------------------------
// 2) Persistance des coches (semaine -> jour -> id)
// ------------------------------------------------------------------
const CHECK_KEY = 'hb:weekChecks'

const getChecks = () => JSON.parse(localStorage.getItem(CHECK_KEY) || '{}')
const setChecks = (v) => localStorage.setItem(CHECK_KEY, JSON.stringify(v))

// clé = lundi de la semaine en ISO (YYYY-MM-DD)
const startOfWeekISO = (d = new Date()) => {
  const t = new Date(d); t.setHours(0,0,0,0)
  const w = (t.getDay() + 6) % 7 // 0..6 (lun=0)
  t.setDate(t.getDate() - w)
  return t.toISOString().slice(0,10)
}

// ------------------------------------------------------------------
// 3) Composant
// ------------------------------------------------------------------
export default function Habits() {
  const [tab, setTab] = useState('today') // 'today' | 'template' | 'weekly'

  // jour FR “aujourd’hui”
  const dayToday = useMemo(() => {
    const g = new Date().getDay() // 0..6 (dim=0)
    return daysFR[g === 0 ? 6 : g - 1] // map vers 0..6 (lun..dim)
  }, [])
  const weekKey = startOfWeekISO()

  const isChecked = (day, id) => !!getChecks()?.[weekKey]?.[day]?.[id]
  const toggleCheck = (day, id) => {
    const all = getChecks()
    all[weekKey] = all[weekKey] || {}
    all[weekKey][day] = all[weekKey][day] || {}
    all[weekKey][day][id] = !all[weekKey][day][id]
    setChecks(all)
    // petit trick: forcer un re-render léger
    setTick(t => t + 1)
  }
  const [tick, setTick] = useState(0) // pour refresh après toggle

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">HABITUDES</div>
            <h2 className="text-xl md:text-2xl font-bold">Ta routine & to-do</h2>
          </div>
          <span className="badge">Semaine du {weekKey}</span>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 text-sm">
        {[
          {k:'today',    label:"Aujourd’hui"},
          {k:'template', label:'Routine'},
          {k:'weekly',   label:'Hebdo'}
        ].map(b => (
          <button
            key={b.k}
            onClick={()=>setTab(b.k)}
            className={`px-3 py-2 rounded-lg border ${tab===b.k ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {tab === 'today' && (
        <div className="card p-5 md:p-6 space-y-2">
          <div className="font-semibold mb-2">{dayToday}</div>
          {(defaultTemplate[dayToday] || []).map(item => (
            <label key={item.id} className="flex items-center gap-2 rounded-lg border border-zinc-200/50 dark:border-slate-700/60 px-3 py-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={isChecked(dayToday, item.id)}
                onChange={() => toggleCheck(dayToday, item.id)}
              />
              <span className="text-sm">
                <span className="opacity-60 mr-2">{item.time}</span>{item.text}
              </span>
            </label>
          ))}
        </div>
      )}

      {tab === 'template' && (
        <div className="card p-5 md:p-6">
          {/* Routine du jour sélectionné (lecture seule, on ne touche pas au style) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {daysFR.map(day => (
              <div key={day} className="space-y-2">
                <div className="text-sm font-semibold opacity-80">{day}</div>
                {(defaultTemplate[day] || []).map(item => (
                  <div key={item.id} className="text-sm opacity-90">
                    <span className="opacity-60 mr-2">{item.time}</span>{item.text}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'weekly' && (
        <div className="card p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {daysFR.map(day => (
              <div key={day} className="space-y-2">
                <div className="text-sm font-semibold opacity-80">{day}</div>
                {(defaultTemplate[day] || []).map(item => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200/50 dark:border-slate-700/60 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={isChecked(day, item.id)}
                      onChange={() => toggleCheck(day, item.id)}
                    />
                    <span className="text-sm">
                      <span className="opacity-60 mr-2">{item.time}</span>{item.text}
                    </span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
