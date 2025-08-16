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
  Wallet, // icône Finance
} from 'lucide-react'

// --- Pages (tes pages existantes)
import Habits from './pages/Habits.jsx'
import Goals from './pages/Goals.jsx'
import Calendar from './pages/Calendar.jsx'
import Training from './pages/Training.jsx'
import Health from './pages/Health.jsx'
import SettingsPage from './pages/Settings.jsx'
import HomePage from './pages/Home.jsx'     // 👈 on garde TA Home
import Finance from './pages/Finance.jsx'   // 👈 nouvelle page

/* ---------------------------------------
   Dark mode (identique à avant)
----------------------------------------*/
function useDarkMode() {
  const [dark, setDark] = useState(() => {
    try { return JSON.parse(localStorage.getItem('darkMode') || 'false') } catch { return false }
  })
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(dark))
  }, [dark])
  return [dark, setDark]
}

/* ---------------------------------------
   Tuile réutilisable (inchangée)
----------------------------------------*/
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

/* ---------------------------------------
   App shell + Routes
----------------------------------------*/
export default function App() {
  const [dark, setDark] = useDarkMode()

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-white text-black dark:bg-[#0b0d10] dark:text-white">
        {/* Header */}
        <header className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Brain className="w-5 h-5" />
              <span>2ᵉ CERVEAU</span>
            </Link>
            <button
              onClick={() => setDark(v => !v)}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700"
              aria-label="Basculer le thème"
            >
              {dark ? <SunMedium className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Routes>
            {/* 👇 on utilise ta page Home.jsx */}
            <Route path="/" element={<HomePage />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/training" element={<Training />} />
            <Route path="/health" element={<Health />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/finance" element={<Finance />} /> {/* nouvelle page */}
          </Routes>
        </main>
      </div>
    </div>
  )
}
