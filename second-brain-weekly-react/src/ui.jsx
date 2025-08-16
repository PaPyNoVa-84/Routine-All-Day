// src/ui.jsx
import React, { useEffect, useState } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain,
  SunMedium,
  Moon,
  CheckSquare,
  Target,
  CalendarDays,
  Dumbbell,
  Apple,
  Settings,
  ChevronRight,
} from 'lucide-react'

// Pages
import Habits from './pages/Habits.jsx'
import Goals from './pages/Goals.jsx'
import Calendar from './pages/Calendar.jsx'
import Training from './pages/Training.jsx'
import Health from './pages/Health.jsx'
import SettingsPage from './pages/Settings.jsx'
import HomePage from './pages/Home.jsx' // si tu as une Home dédiée; sinon on utilise Home ci-dessous

// --- Dark mode (identique esprit d’avant)
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return JSON.parse(localStorage.getItem('darkMode') || 'false') } catch { return false }
  })
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(dark))
    const el = document.documentElement
    if (dark) el.classList.add('dark'); else el.classList.remove('dark')
  }, [dark])
  return [dark, setDark]
}

// --- Petite tuile réutilisable (garde ton esthétique)
function Tile({ to, icon, title, subtitle }) {
  return (
    <Link to={to} className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl">
      <div className="card p-5 md:p-6 hover:shadow-soft transition">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 grid place-items-center">
              {icon}
            </div>
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300">{subtitle}</div>
            </div>
          </div>
          <ChevronRight className="opacity-60 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
    </Link>
  )
}

// --- Home inline (si tu n’utilises pas src/pages/Home.jsx, sinon supprime ce composant)
function Home() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="card p-6 md:p-8">
        <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">AUJOURD’HUI — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}</div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Ton tableau de bord</h1>
      </div>

      {/* Grille de tuiles — EXACT rendu, juste cliquables */}
      <div className="grid gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Tile
          to="/habits"
          icon={<CheckSquare className="icon-tile" />}
          title="Mes habitudes"
          subtitle="& ma to-do list"
        />
        <Tile
          to="/goals"
          icon={<Target className="icon-tile" />}
          title="Mes objectifs"
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
      </div>

      {/* Raccourcis + Astuce du jour (inchangés, purement visuels) */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Raccourcis</div>
            <span className="badge">Personnalisables</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost">+ Tâche rapide</button>
            <button className="btn-ghost">+ Objectif</button>
            <Link to="/calendar" className="btn-ghost">Ouvrir calendrier</Link>
            <button className="btn-ghost">Notes du jour</button>
            <button className="btn-ghost">Routine soir</button>
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Astuce du jour</div>
            <span className="badge">Discipline</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Commence par 3 micro-actions faciles que tu peux cocher en 10 minutes. L’élan &gt; la motivation.
          </p>
        </div>
      </div>
    </div>
  )
}

// --- App shell + Routes (identique à ton esprit d’avant)
export default function App() {
  const [dark, setDark] = useDarkMode()

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0b0f14] text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/60 dark:bg-[#0b0f14]/60 border-b border-zinc-200 dark:border-slate-800">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-extrabold">
            <span className="inline-grid place-items-center w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-fuchsia-400">
              <Brain size={16} />
            </span>
            <span>2ᵉ CERVEAU</span>
          </Link>
          <button
            onClick={() => setDark(v => !v)}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-slate-700 text-sm"
            aria-label="Basculer le thème"
          >
            {dark ? <SunMedium size={16} /> : <Moon size={16} />} <span className="ml-1 hidden sm:inline">{dark ? 'Clair' : 'Sombre'}</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <Routes>
          {/* Si tu veux utiliser ta page Home.jsx existante, remplace <Home /> par <HomePage /> */}
          <Route path="/" element={<Home />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/training" element={<Training />} />
          <Route path="/health" element={<Health />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}
