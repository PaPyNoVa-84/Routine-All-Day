import React from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare,
  Target,
  CalendarDays,
  Dumbbell,
  Apple,
  Settings,
  ChevronRight,
  Wallet,
} from 'lucide-react'

function Tile({ to, icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="group relative block rounded-2xl border border-zinc-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 md:p-5 hover:border-zinc-300 dark:hover:border-slate-700 transition"
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-zinc-100 dark:bg-slate-900 grid place-items-center">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {subtitle && <div className="text-sm opacity-70 truncate">{subtitle}</div>}
        </div>
        <ChevronRight className="ml-auto w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  )
}

export default function Home() {
  const today = new Date()
  const dateLabel = today.toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long'
  })

  return (
    <div className="space-y-4">
      {/* Bandeau titre/date */}
      <div className="card p-5 md:p-6">
        <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
          AUJOURD’HUI — {dateLabel}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">Ton tableau de bord</h1>
      </div>

      {/* Grille des modules */}
      <div className="grid gap-4 md:grid-cols-2">
        <Tile
          to="/habits"
          icon={<CheckSquare className="icon-tile" />}
          title="Mes habitudes"
          subtitle="& ma to-do list"
        />
        <Tile
          to="/goals"
          icon={<Target className="icon-tile" />}
          title="To-do-list"
          subtitle="& mes notes"
        />
        <Tile
          to="/calendar"
          icon={<CalendarDays className="icon-tile" />}
          title="Calendrier"
          subtitle="plan de la semaine"
        />
        <Tile
          to="/training"
          icon={<Dumbbell className="icon-tile" />}
          title="Entraînement"
          subtitle="sport & progrès"
        />
        <Tile
          to="/health"
          icon={<Apple className="icon-tile" />}
          title="Santé"
          subtitle="sommeil & routine"
        />
        <Tile
          to="/settings"
          icon={<Settings className="icon-tile" />}
          title="Réglages"
          subtitle="thème & presets"
        />
        <Tile
          to="/finance"
          icon={<Wallet className="icon-tile" />}
          title="Finances"
          subtitle="perso • pro • rappels"
        />
      </div>

      {/* Raccourcis (visuel simple, tu peux lier où tu veux) */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Raccourcis</div>
          <span className="badge">Personnalisables</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/goals" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-800">+ Tâche rapide</Link>
          <Link to="/goals" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-800">+ Objectif</Link>
          <Link to="/calendar" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-800">Ouvrir calendrier</Link>
          <Link to="/goals" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-800">Notes du jour</Link>
          <Link to="/habits" className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-800">Routine soir</Link>
        </div>
      </div>

      {/* Astuce du jour (visuel) */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Astuce du jour</div>
          <span className="badge">Discipline</span>
        </div>
        <div className="text-sm">
          Commence par 3 micro-actions faciles que tu peux cocher en 10 minutes. L’élan → la motivation.
        </div>
      </div>
    </div>
  )
}
