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
      className="card p-4 md:p-5 hover:border-zinc-300 dark:hover:border-slate-700 transition"
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
    weekday: 'long',
    day: '2-digit',
    month: 'long',
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

      {/* Grille des modules (même fond que le bandeau grâce à `card`) */}
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
    </div>
  )
}
