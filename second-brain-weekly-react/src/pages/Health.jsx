// src/pages/Health.jsx
import React, { useEffect, useMemo, useState } from 'react'
// --- hydratation: conversions
const ML_PER_GLASS = 250; // 1 verre = 250 ml
const toLiters = (ml) => (ml / 1000).toFixed(2);


/* ========= Utils dates ========= */
const pad = (n) => String(n).padStart(2, '0')
const toISO = (d = new Date()) => { const t=new Date(d); t.setHours(0,0,0,0); return t.toISOString().slice(0,10) }
const fromISO = (iso) => new Date(iso+'T00:00:00')
const startOfWeekISO = (d = new Date()) => {
  const t = new Date(d); t.setHours(0,0,0,0)
  const w = (t.getDay()+6)%7; t.setDate(t.getDate()-w)
  return toISO(t)
}
const addDays = (iso, k) => { const d = fromISO(iso); d.setDate(d.getDate()+k); return toISO(d) }
const daysFR = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche']
const wdIdx = (date) => (date.getDay()+6)%7 // 0=lundi

/* ========= Storage helpers ========= */
const dayKey = (iso) => `health:${iso}`
const loadDay = (iso) => JSON.parse(localStorage.getItem(dayKey(iso)) || 'null')
const saveDay = (iso, obj) => localStorage.setItem(dayKey(iso), JSON.stringify(obj))

/* ========= Defaults ========= */
const DEFAULT_WATER_GOAL = 8
const DEFAULT_STEPS_GOAL = 8000
const defaultDay = () => ({
  weight: null,
  water: { count: 0, goal: DEFAULT_WATER_GOAL },
  steps: { count: 0, goal: DEFAULT_STEPS_GOAL },
  sleep: { hours: null, bed: '', wake: '', note: '' },
  swim: { plan: true, sessions: { Mon:false, Tue:false, Wed:false, Fri:false, Sat:false } },
})

/* ========= Mini charts (sparklines) ========= */
const SparkBars = ({ data, max, height=36, title }) => {
  const safeMax = Math.max(1, max || Math.max(...data, 1))
  return (
    <div className="space-y-1">
      <div className="text-sm font-semibold opacity-80">{title}</div>
      <div className="flex items-end gap-1 h-[36px]">
        {data.map((v,i)=>(
          <div key={i} className="w-2 rounded bg-zinc-300 dark:bg-slate-700" style={{height: `${(v/safeMax)*height}px`}} />
        ))}
      </div>
    </div>
  )
}

/* ========= Main ========= */
export default function HealthPage(){
  const todayISO = toISO()
  const [tab, setTab] = useState('today') // 'today' | 'week' | 'trends'
  const [dateISO, setDateISO] = useState(todayISO) // pour éditer un autre jour si besoin (onglet semaine)
  const [stateTick, setStateTick] = useState(0) // re-render soft

  /* ---- Jour actuel (Aujourd’hui) ---- */
  const [day, setDay] = useState(()=> loadDay(todayISO) || defaultDay())
  useEffect(()=>{ saveDay(todayISO, day) }, [day])

  const setField = (path, value) => {
    setDay(prev => {
      const clone = JSON.parse(JSON.stringify(prev))
      const segs = path.split('.')
      let o = clone
      for (let i=0;i<segs.length-1;i++){ o = o[segs[i]] }
      o[segs[segs.length-1]] = value
      return clone
    })
  }
  const inc = (path, delta) => {
    setDay(prev => {
      const clone = JSON.parse(JSON.stringify(prev))
      const segs = path.split('.')
      let o = clone
      for (let i=0;i<segs.length-1;i++){ o = o[segs[i]] }
      o[segs[segs.length-1]] = Math.max(0, (o[segs[segs.length-1]] || 0) + delta)
      return clone
    })
  }

  /* ---- Semaine en cours ---- */
  const weekStart = startOfWeekISO()
  const weekDates = useMemo(()=> Array.from({length:7},(_,i)=> addDays(weekStart,i)), [weekStart])
  const weekDays = useMemo(()=> weekDates.map(k => loadDay(k) || defaultDay()), [stateTick]) // refresh on tick

  const editWeekValue = (iso, updater) => {
    const obj = loadDay(iso) || defaultDay()
    const next = updater(obj)
    saveDay(iso, next)
    setStateTick(x=>x+1)
  }

  /* ---- Stats semaine ---- */
  const weekStats = useMemo(()=>{
    const vals = weekDates.map(k => loadDay(k) || defaultDay())
    const sum = (arr, get) => arr.reduce((a,b)=>a+(get(b)||0),0)
    const avg = (arr, get) => arr.length ? sum(arr, get)/arr.length : 0

    const sleepAvg = avg(vals, v => Number(v.sleep.hours)||0)
    const waterGoal = vals.reduce((a,v)=> a + (v.water?.goal || DEFAULT_WATER_GOAL), 0)
    const waterCount = sum(vals, v => Number(v.water?.count)||0)
    const waterPct = waterGoal ? Math.round((waterCount / waterGoal) * 100) : 0
    const stepsTotal = sum(vals, v => Number(v.steps?.count)||0)

    const monWeight = vals[0]?.weight ?? null
    const sunWeight = vals[6]?.weight ?? null
    const deltaWeight = (sunWeight!=null && monWeight!=null) ? (sunWeight - monWeight) : null

    return { sleepAvg, waterPct, stepsTotal, deltaWeight }
  }, [stateTick, weekStart])

  /* ---- Tendances 30 jours ---- */
  const lastNDays = (n=30) => {
    const out = []
    const end = fromISO(todayISO)
    for (let i=n-1;i>=0;i--){
      const d = new Date(end); d.setDate(d.getDate()-i)
      const iso = toISO(d)
      const entry = loadDay(iso) || null
      out.push({ iso, entry })
    }
    return out
  }
  const trendData = useMemo(()=>{
    const rows = lastNDays(30)
    const weights = rows.map(r => r.entry?.weight!=null ? Number(r.entry.weight) : 0)
    const sleeps  = rows.map(r => r.entry?.sleep?.hours!=null ? Number(r.entry.sleep.hours) : 0)
    // max for bars
    return {
      weights,
      sleeps,
      maxW: Math.max(...weights, 1),
      maxS: Math.max(...sleeps, 1),
      deltaW7: (() => {
        const idxNow = rows.length-1, idxPrev = Math.max(0, idxNow-7)
        const a = rows[idxPrev].entry?.weight, b = rows[idxNow].entry?.weight
        if (a!=null && b!=null) return (b - a).toFixed(1)
        return null
      })()
    }
  }, [stateTick])

  /* ---- Natation : jours planifiés (Lun, Mar, Mer, Ven, Sam) ---- */
  const swimKeys = ['Mon','Tue','Wed','Fri','Sat']
  const swimNames = { Mon:'Lun', Tue:'Mar', Wed:'Mer', Fri:'Ven', Sat:'Sam' }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">SANTÉ</div>
            <h2 className="text-xl md:text-2xl font-bold">Poids • Hydratation • Pas • Sommeil</h2>
          </div>
          <span className="badge">{new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 text-sm">
        {[
          {k:'today', label:'Aujourd’hui'},
          {k:'week',  label:'Semaine'},
          {k:'trends',label:'Tendances'},
        ].map(b=>(
          <button
            key={b.k}
            onClick={()=>setTab(b.k)}
            className={`px-3 py-2 rounded-lg border ${tab===b.k ? 'bg-black text-white dark:bg-white dark:text-black':''}`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* ========= AUJOURD’HUI ========= */}
      {tab==='today' && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* À gauche : poids / hydratation / pas */}
          <div className="card p-5 md:p-6 space-y-4">
            {/* Poids */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Poids</div>
                <span className="badge">kg</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.1" placeholder="73.2"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  value={day.weight ?? ''} onChange={e=>setField('weight', e.target.value === '' ? null : Number(e.target.value))}
                />
                <button onClick={()=>setStateTick(t=>t+1)} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Sauver</button>
              </div>
            </div>

            {/* Hydratation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Hydratation</div>
                <span className="badge">
  {day.water.count}/{day.water.goal} verres · {toLiters(day.water.count * ML_PER_GLASS)} / {toLiters(day.water.goal * ML_PER_GLASS)} L
</span>

              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>inc('water.count', -1)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700">-1</button>
                <button onClick={()=>inc('water.count', 1)}  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700">+1</button>
                <input
                  type="number" min="1" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700"
                  value={day.water.goal} onChange={e=>setField('water.goal', Math.max(1, Number(e.target.value)||DEFAULT_WATER_GOAL))}
                />
              </div>
              {/* progress */}
              <div className="mt-2 h-2 rounded bg-zinc-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-blue-600" style={{width: `${Math.min(100, (day.water.count/day.water.goal)*100)}%`}} />
              </div>
            </div>

            {/* Pas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Pas</div>
                <span className="badge">{day.steps.count}/{day.steps.goal}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="100"
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  value={day.steps.count} onChange={e=>setField('steps.count', Math.max(0, Number(e.target.value)||0))}
                />
                <input
                  type="number" step="100"
                  className="w-28 px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700"
                  value={day.steps.goal} onChange={e=>setField('steps.goal', Math.max(1000, Number(e.target.value)||DEFAULT_STEPS_GOAL))}
                />
              </div>
              <div className="mt-2 h-2 rounded bg-zinc-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-green-500" style={{width: `${Math.min(100, (day.steps.count/day.steps.goal)*100)}%`}} />
              </div>
            </div>
          </div>

          {/* À droite : sommeil / natation */}
          <div className="card p-5 md:p-6 space-y-4">
            {/* Sommeil */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Sommeil</div>
                <span className="badge">{day.sleep.hours ?? 0} h</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number" step="0.25" placeholder="7.5"
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  value={day.sleep.hours ?? ''} onChange={e=>setField('sleep.hours', e.target.value===''? null : Number(e.target.value))}
                />
                <input
                  type="time"
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  value={day.sleep.bed} onChange={e=>setField('sleep.bed', e.target.value)}
                />
                <input
                  type="time"
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  value={day.sleep.wake} onChange={e=>setField('sleep.wake', e.target.value)}
                />
              </div>
              <textarea
                rows={2}
                placeholder="Note (facultatif)"
                className="mt-2 w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                value={day.sleep.note} onChange={e=>setField('sleep.note', e.target.value)}
              />
            </div>

            {/* Plan Natation (Lun, Mar, Mer, Ven, Sam) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Natation — Plan</div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!day.swim.plan}
                    onChange={e=>setField('swim.plan', e.target.checked)}
                  />
                  Activer (5× / semaine)
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {swimKeys.map(k => (
                  <label key={k} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 text-sm flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!day.swim.sessions[k]}
                      onChange={()=> setField(`swim.sessions.${k}`, !day.swim.sessions[k])}
                      disabled={!day.swim.plan}
                    />
                    {swimNames[k]}
                  </label>
                ))}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Jours ciblés : Lun · Mar · Mer · Ven · Sam</div>
            </div>
          </div>
        </div>
      )}

      {/* ========= SEMAINE ========= */}
      {tab==='week' && (
        <div className="grid gap-4 md:grid-cols-[1fr,360px]">
          {/* Tableau semaine */}
          <div className="card p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Semaine du {weekStart}</div>
              <div className="flex gap-2">
                <button
                  onClick={()=>{ const prev = addDays(weekStart, -7); setDateISO(prev); setStateTick(t=>t+1)}}
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700"
                >◀</button>
                <button
                  onClick={()=>{ const next = addDays(weekStart, 7); setDateISO(next); setStateTick(t=>t+1)}}
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700"
                >▶</button>
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full text-sm border border-zinc-200 dark:border-slate-700 rounded-lg">
                <thead>
                  <tr className="bg-zinc-100 dark:bg-slate-900">
                    <th className="p-2 text-left">Jour</th>
                    <th className="p-2 text-left">Poids (kg)</th>
                    <th className="p-2 text-left">Verres</th>
                    <th className="p-2 text-left">Pas</th>
                    <th className="p-2 text-left">Sommeil (h)</th>
                  </tr>
                </thead>
                <tbody>
                  {weekDates.map((iso, idx) => {
                    const d = loadDay(iso) || defaultDay()
                    const name = daysFR[idx]
                    return (
                      <tr key={iso} className="border-t border-zinc-200 dark:border-slate-700">
                        <td className="p-2">{name} <span className="opacity-60 text-xs ml-1">{iso}</span></td>
                        <td className="p-2">
                          <input type="number" step="0.1" value={d.weight ?? ''} onChange={e=>editWeekValue(iso, x=>({...x, weight: e.target.value===''? null : Number(e.target.value)}))}
                            className="w-24 px-2 py-1 rounded border border-zinc-200 dark:border-slate-700 bg-transparent" />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <input type="number" value={d.water.count} onChange={e=>editWeekValue(iso, x=>({ ...x, water:{...x.water, count: Math.max(0, Number(e.target.value)||0)} }))}
                              className="w-20 px-2 py-1 rounded border border-zinc-200 dark:border-slate-700 bg-transparent" />
                            <span className="opacity-60">/</span>
                            <input type="number" value={d.water.goal} onChange={e=>editWeekValue(iso, x=>({ ...x, water:{...x.water, goal: Math.max(1, Number(e.target.value)||DEFAULT_WATER_GOAL)} }))}
                              className="w-16 px-2 py-1 rounded border border-zinc-200 dark:border-slate-700 bg-transparent" />
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <input type="number" value={d.steps.count} onChange={e=>editWeekValue(iso, x=>({ ...x, steps:{...x.steps, count: Math.max(0, Number(e.target.value)||0)} }))}
                              className="w-24 px-2 py-1 rounded border border-zinc-200 dark:border-slate-700 bg-transparent" />
                            <span className="opacity-60">/</span>
                            <input type="number" value={d.steps.goal} onChange={e=>editWeekValue(iso, x=>({ ...x, steps:{...x.steps, goal: Math.max(1000, Number(e.target.value)||DEFAULT_STEPS_GOAL)} }))}
                              className="w-20 px-2 py-1 rounded border border-zinc-200 dark:border-slate-700 bg-transparent" />
                          </div>
                        </td>
                        <td className="p-2">
                          <input type="number" step="0.25" value={d.sleep.hours ?? ''} onChange={e=>editWeekValue(iso, x=>({ ...x, sleep:{...x.sleep, hours: e.target.value===''? null : Number(e.target.value)} }))}
                            className="w-24 px-2 py-1 rounded border border-zinc-200 dark:border-slate-700 bg-transparent" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats semaine */}
          <div className="card p-5 md:p-6 space-y-3">
            <div className="font-semibold mb-1">Stats de la semaine</div>
            <div className="text-sm">Sommeil moyen : <strong>{weekStats.sleepAvg.toFixed(2)} h</strong></div>
            <div className="text-sm">% hydratation atteint : <strong>{weekStats.waterPct}%</strong></div>
            <div className="text-sm">Total pas : <strong>{weekStats.stepsTotal.toLocaleString('fr-FR')}</strong></div>
            <div className="text-sm">Δ Poids (Lun → Dim) : <strong>{weekStats.deltaWeight!=null ? `${weekStats.deltaWeight.toFixed(1)} kg` : '—'}</strong></div>
          </div>
        </div>
      )}

      {/* ========= TENDANCES ========= */}
      {tab==='trends' && (
        <div className="card p-5 md:p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SparkBars title={`Poids (Δ 7j: ${trendData.deltaW7 ?? '—'} kg)`} data={trendData.weights} max={trendData.maxW} />
            <SparkBars title="Sommeil (heures / 30j)" data={trendData.sleeps} max={trendData.maxS} />
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
            Astuce : vise ≥ 8h de moyenne et 8 verres/jour. Les barres vides indiquent des jours non saisis.
          </div>
        </div>
      )}
    </div>
  )
}
