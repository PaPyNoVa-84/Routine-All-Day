// src/pages/Goals.jsx
import React, { useMemo, useState } from 'react'

/** Helpers date */
const todayISO = () => {
  const d = new Date(); d.setHours(0,0,0,0)
  return d.toISOString().slice(0,10)
}

/** Storage keys (par jour) */
const tdKey   = (iso) => `td:${iso}`        // to-do list du jour
const noteKey = (iso) => `notes:${iso}`     // notes du jour

const loadTodos = (iso) => JSON.parse(localStorage.getItem(tdKey(iso)) || '[]')
const saveTodos = (iso, arr) => localStorage.setItem(tdKey(iso), JSON.stringify(arr))

const loadNotes = (iso) => localStorage.getItem(noteKey(iso)) ?? ''
const saveNotes = (iso, txt) => localStorage.setItem(noteKey(iso), txt)

export default function Goals() {
  const iso = useMemo(() => todayISO(), [])
  const [items, setItems] = useState(() => loadTodos(iso))
  const [text, setText] = useState('')
  const [notes, setNotes] = useState(() => loadNotes(iso))

  const addItem = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const next = [...items, { id: Date.now().toString(36), text: t, done: false }]
    setItems(next)
    saveTodos(iso, next)
    setText('')
  }

  const toggle = (id) => {
    const next = items.map(it => it.id === id ? { ...it, done: !it.done } : it)
    setItems(next); saveTodos(iso, next)
  }

  const edit = (id, newText) => {
    const next = items.map(it => it.id === id ? { ...it, text: newText } : it)
    setItems(next); saveTodos(iso, next)
  }

  const remove = (id) => {
    const next = items.filter(it => it.id !== id)
    setItems(next); saveTodos(iso, next)
  }

  const clearDone = () => {
    const next = items.filter(it => !it.done)
    setItems(next); saveTodos(iso, next)
  }

  const handleNotes = (e) => {
    const v = e.target.value
    setNotes(v)
    saveNotes(iso, v)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">TO-DO-LIST</div>
            <h2 className="text-xl md:text-2xl font-bold">Objectifs du jour</h2>
          </div>
          <span className="badge">{new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })}</span>
        </div>
      </div>

      {/* Grille : à gauche to-do, à droite carnet de notes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* To-Do du jour */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Ta to-do du jour</div>
            <button onClick={clearDone} className="btn-ghost text-sm">Supprimer les tâches cochées</button>
          </div>

          {/* Ajout rapide */}
          <form onSubmit={addItem} className="flex gap-2 mb-3">
            <input
              value={text}
              onChange={e=>setText(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              placeholder="Ajouter un objectif (ex: 5 visuels Pinterest)"
            />
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Ajouter</button>
          </form>

          {/* Liste */}
          <div className="space-y-2">
            {items.length === 0 && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Aucune tâche pour aujourd’hui. Ajoute ton premier objectif 👇</div>
            )}
            {items.map(it => (
              <div
                key={it.id}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-slate-700 px-3 py-2"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={it.done}
                  onChange={()=>toggle(it.id)}
                />
                <input
                  value={it.text}
                  onChange={e=>edit(it.id, e.target.value)}
                  className={`flex-1 bg-transparent outline-none text-sm ${it.done ? 'line-through opacity-60' : ''}`}
                />
                <button
                  onClick={()=>remove(it.id)}
                  className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-slate-900 text-sm"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Carnet de notes (libre) */}
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Carnet de notes</div>
            <span className="badge">Auto-sauvegarde</span>
          </div>
          <textarea
            value={notes}
            onChange={handleNotes}
            placeholder="Écris librement : idées, réflexions, plan d’action, bilan du jour…"
            className="w-full min-h-[260px] px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
      </div>
    </div>
  )
}
