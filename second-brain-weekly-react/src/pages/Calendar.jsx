// src/pages/Calendar.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'

/* ---------- Utils dates ---------- */
const pad = (n) => String(n).padStart(2, '0')
const isoFrom = (y,m,d) => `${y}-${pad(m)}-${pad(d)}`
const toISODate = (d) => { const t=new Date(d); t.setHours(0,0,0,0); return t.toISOString().slice(0,10) }
const fromISO = (iso) => new Date(iso+'T00:00:00')
const firstDayInfo = (y, m) => {
  // m: 1..12
  const first = new Date(y, m-1, 1)
  const dow = (first.getDay()+6)%7 // 0=Mon .. 6=Sun
  const days = new Date(y, m, 0).getDate()
  return { first, dow, days }
}
const frMonth = (y,m) => new Date(y,m-1,1).toLocaleDateString('fr-FR',{month:'long', year:'numeric'})
const isSameDay = (a,b) => toISODate(a) === toISODate(b)
const weekdayIdx = (d) => (d.getDay()+6)%7 // 0=Mon..6=Sun
const daysFR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

/* ---------- Storage ---------- */
const STORAGE_KEY = 'cal:events'
const loadEvents = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
const saveEvents = (arr) => localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))

/* ---------- Labels ---------- */
const LABELS = [
  { id:'work',   name:'Travail',     dot:'#60a5fa' },
  { id:'perso',  name:'Perso',       dot:'#f472b6' },
  { id:'sante',  name:'Santé',       dot:'#34d399' },
  { id:'sport',  name:'Sport',       dot:'#f59e0b' },
]
const labelInfo = (id) => LABELS.find(l=>l.id===id)

/* ---------- Recurrence helpers ---------- */
const matchRecur = (evt, dateISO) => {
  if (!evt.recur || evt.recur==='none') return false
  const d = fromISO(dateISO)
  const a = fromISO(evt.date) // date “ancre” de l’événement
  if (evt.recur==='weekly') {
    return weekdayIdx(d) === weekdayIdx(a)
  }
  if (evt.recur==='monthly') {
    return d.getDate() === a.getDate()
  }
  if (evt.recur==='yearly') {
    return d.getDate()===a.getDate() && d.getMonth()===a.getMonth()
  }
  return false
}

const occursOn = (evt, dateISO) => {
  if (evt.date === dateISO) return true
  return matchRecur(evt, dateISO)
}

/* ---------- Expand events for a whole month (for counters & .ics) ---------- */
const expandMonth = (events, y, m) => {
  const { days } = firstDayInfo(y,m)
  const out = []
  for (let d=1; d<=days; d++){
    const iso = isoFrom(y,m,d)
    events.forEach(e=>{
      if (occursOn(e, iso)) out.push({ ...e, date: iso })
    })
  }
  return out
}

/* ---------- ICS export ---------- */
const makeICS = (eventsMonth) => {
  // Minimal ICS generator; times optional → all-day events
  const lines = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//SecondBrain//Calendar//FR')
  eventsMonth.forEach((e)=>{
    const uid = e.id + '@secondbrain'
    const dt = e.date.replace(/-/g,'')
    const start = e.start ? (e.date+'T'+e.start.replace(':','')+'00').replace(/[-:]/g,'') : dt
    const end   = e.end ? (e.date+'T'+e.end.replace(':','')+'00').replace(/[-:]/g,'') : dt
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${dt}T000000Z`)
    if (e.start || e.end){
      lines.push(`DTSTART:${start}`)
      lines.push(`DTEND:${end}`)
    } else {
      lines.push(`DTSTART;VALUE=DATE:${dt}`)
      lines.push(`DTEND;VALUE=DATE:${dt}`)
    }
    lines.push(`SUMMARY:${escapeICS(e.title || 'Événement')}`)
    if (e.note) lines.push(`DESCRIPTION:${escapeICS(e.note)}`)
    lines.push('END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}
const escapeICS = (s) => String(s).replace(/\\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')

/* ---------- Main component ---------- */
export default function CalendarPage(){
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()+1) // 1..12
  const [selected, setSelected] = useState(toISODate(today)) // ISO date in current month (or today if visible)
  const [events, setEvents] = useState(loadEvents())
  const [form, setForm] = useState({ title:'', start:'', end:'', label:'', note:'', recur:'none' })
  const [editId, setEditId] = useState(null)

  // Keep selection in visible month when navigating
  useEffect(()=>{
    const sel = fromISO(selected)
    if (sel.getFullYear() !== year || (sel.getMonth()+1) !== month){
      setSelected(isoFrom(year,month,1))
    }
  }, [year, month])

  // Save on change
  useEffect(()=>{ saveEvents(events) }, [events])

  const { dow, days } = useMemo(()=>firstDayInfo(year,month), [year,month])
  const monthLabel = useMemo(()=>frMonth(year,month), [year,month])

  const eventsOfDay = useMemo(()=>{
    return events.filter(e=>occursOn(e, selected))
  }, [events, selected])

  const countsByDay = useMemo(()=>{
    const counts = {}
    for (let d=1; d<=days; d++){
      const iso = isoFrom(year,month,d)
      counts[iso] = events.reduce((acc,e)=> acc + (occursOn(e, iso) ? 1 : 0), 0)
    }
    return counts
  }, [events, year, month, days])

  const changeMonth = (delta) => {
    let y = year, m = month + delta
    if (m<1){ m=12; y-- }
    if (m>12){ m=1; y++ }
    setYear(y); setMonth(m)
  }

  /* ---- CRUD ---- */
  const resetForm = () => { setForm({ title:'', start:'', end:'', label:'', note:'', recur:'none' }); setEditId(null) }
  const addEvent = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const evt = { id: cryptoId(), date: selected, ...form }
    setEvents(prev => [...prev, evt])
    resetForm()
  }
  const updateEvent = (e) => {
    e.preventDefault()
    setEvents(prev => prev.map(ev => ev.id===editId ? { ...ev, ...form } : ev))
    resetForm()
  }
  const editEvent = (ev) => {
    setEditId(ev.id)
    setForm({ title:ev.title||'', start:ev.start||'', end:ev.end||'', label:ev.label||'', note:ev.note||'', recur:ev.recur||'none' })
  }
  const delEvent = (id) => setEvents(prev => prev.filter(e=>e.id!==id))

  const exportMonth = () => {
    const expanded = expandMonth(events, year, month)
    const ics = makeICS(expanded)
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calendar-${year}-${pad(month)}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr,400px]">
      {/* ----- Left: Month grid ----- */}
      <div className="card p-4 md:p-6">
        {/* Header month */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={()=>changeMonth(-1)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700">◀</button>
            <div className="text-lg font-bold capitalize">{monthLabel}</div>
            <button onClick={()=>changeMonth(1)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700">▶</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>{ setYear(today.getFullYear()); setMonth(today.getMonth()+1); setSelected(toISODate(today)) }} className="btn-ghost text-sm">Aujourd’hui</button>
            <button onClick={exportMonth} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Exporter .ics</button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-1">
          {daysFR.map(d => <div key={d} className="text-center uppercase tracking-wider">{d}</div>)}
        </div>

        {/* Grid days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before first day */}
          {Array.from({length:dow}).map((_,i)=><div key={'e'+i} className="opacity-0">.</div>)}
          {Array.from({length:days}).map((_,i)=>{
            const dayNum = i+1
            const iso = isoFrom(year,month,dayNum)
            const isToday = toISODate(today)===iso
            const isSelected = selected===iso
            const count = countsByDay[iso] || 0
            return (
              <button
                key={iso}
                onClick={()=>setSelected(iso)}
                className={`text-left rounded-xl border px-3 py-2 min-h-[74px] transition
                  ${isSelected ? 'border-zinc-900 dark:border-zinc-200' : 'border-zinc-200 dark:border-slate-700'}
                  ${isSelected ? 'bg-black/5 dark:bg-white/5' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`text-sm ${isToday ? 'font-bold' : 'opacity-80'}`}>{dayNum}</div>
                  {count>0 && <span className="badge">{count}</span>}
                </div>
                {/* mini dots preview (max 3) */}
                <div className="flex gap-1 flex-wrap">
                  {previewDots(events, iso)}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ----- Right: Selected day panel ----- */}
      <div className="card p-4 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">JOUR</div>
            <div className="font-semibold">{new Date(selected).toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })}</div>
          </div>
          <span className="badge">{eventsOfDay.length} évènement(s)</span>
        </div>

        {/* List of events */}
        <div className="space-y-2 mb-4">
          {eventsOfDay.length===0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Aucun événement. Ajoute un rappel ci-dessous.</div>
          )}
          {eventsOfDay.map(ev=>(
            <div key={ev.id} className="rounded-lg border border-zinc-200 dark:border-slate-700 p-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {ev.label && <span className="inline-block w-2.5 h-2.5 rounded-full" style={{background:labelInfo(ev.label)?.dot}}/>}
                    <div className="font-medium">{ev.title || 'Sans titre'}</div>
                  </div>
                  <div className="text-xs opacity-70">
                    {ev.start || ev.end ? `${ev.start || ''}${ev.end ? ' – '+ev.end : ''}` : 'Toute la journée'}
                    {ev.recur && ev.recur!=='none' ? ` • Récurrence: ${recurLabel(ev.recur)}` : ''}
                  </div>
                  {!!ev.note && <div className="text-sm opacity-85 whitespace-pre-wrap">{ev.note}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>editEvent(ev)} className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-slate-900 text-sm">Éditer</button>
                  <button onClick={()=>delEvent(ev.id)} className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-slate-900 text-sm">Suppr.</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add / Edit form */}
        <form onSubmit={editId?updateEvent:addEvent} className="space-y-2">
          <div className="font-semibold">{editId ? 'Modifier l’événement' : 'Ajouter un événement'}</div>
          <input
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            placeholder="Titre (ex: Natation, Appel client…) "
            value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              value={form.start} onChange={e=>setForm(f=>({...f, start:e.target.value}))}
            />
            <input
              type="time"
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              value={form.end} onChange={e=>setForm(f=>({...f, end:e.target.value}))}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              value={form.label} onChange={e=>setForm(f=>({...f, label:e.target.value}))}
            >
              <option value="">Étiquette</option>
              {LABELS.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <select
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              value={form.recur} onChange={e=>setForm(f=>({...f, recur:e.target.value}))}
            >
              <option value="none">Sans récurrence</option>
              <option value="weekly">Chaque semaine (même jour)</option>
              <option value="monthly">Chaque mois (même date)</option>
              <option value="yearly">Chaque année (même date)</option>
            </select>
          </div>

          <textarea
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            placeholder="Note (facultatif)"
            value={form.note} onChange={e=>setForm(f=>({...f, note:e.target.value}))}
          />
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              {editId ? 'Sauvegarder' : 'Ajouter'}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700">
                Annuler
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---------- Helpers render ---------- */
const previewDots = (events, iso) => {
  // show up to 3 colored dots from labels for that day
  const list = []
  for (let i=0;i<events.length;i++){
    const e = events[i]
    if (occursOn(e, iso)){
      const c = labelInfo(e.label)?.dot || '#a1a1aa'
      list.push(<span key={e.id} className="inline-block w-2 h-2 rounded-full" style={{background:c}} />)
      if (list.length>=3) break
    }
  }
  return list
}
const recurLabel = (r) => r==='weekly' ? 'Hebdo' : r==='monthly' ? 'Mensuelle' : r==='yearly' ? 'Annuelle' : '—'
const cryptoId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
