import React, {useEffect, useState} from 'react'
import { motion } from 'framer-motion'
import { Brain, SunMedium, Moon, CheckSquare, Target, CalendarDays, NotebookPen, BookOpen, Dumbbell, Apple, Settings, ChevronRight } from 'lucide-react'

function useDarkMode(){
  const [dark, setDark] = useState(()=>{
    try { return JSON.parse(localStorage.getItem('darkMode')||'false') } catch { return false }
  })
  useEffect(()=>{
    localStorage.setItem('darkMode', JSON.stringify(dark))
    const el = document.documentElement
    if(dark) el.classList.add('dark'); else el.classList.remove('dark')
  }, [dark])
  return [dark, setDark]
}

const tiles = [
  { id:'habits',   icon: <CheckSquare className='icon-tile' />,  title:'Mes habitudes',  subtitle:'& ma to-do list' },
  { id:'goals',    icon: <Target className='icon-tile' />,       title:'Mes objectifs',  subtitle:'& mes notes' },
  { id:'calendar', icon: <CalendarDays className='icon-tile' />, title:'Calendrier',     subtitle:'plan de la semaine' },
  { id:'training', icon: <Dumbbell className='icon-tile' />,     title:'Entraînement',   subtitle:'sport & progrès' },
  { id:'health',   icon: <Apple className='icon-tile' />,        title:'Santé',          subtitle:'sommeil & routine' },
  { id:'settings', icon: <Settings className='icon-tile' />,     title:'Réglages',       subtitle:'thème & presets' },
]


function Tile({icon, title, subtitle}){
  return (
    <motion.button whileHover={{ y: -2 }} className="card w-full p-5 md:p-6 text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="grid place-items-center h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800">{icon}</div>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-zinc-500">{subtitle}</div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-zinc-400" />
      </div>
    </motion.button>
  )
}

export default function App(){
  const [dark, setDark] = useDarkMode()
  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long' })

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2 font-semibold">
            <Brain className="h-5 w-5 text-pink-500" />
            <span>2ᵉ CERVEAU</span>
          </div>
          <button onClick={()=>setDark(d=>!d)} className="badge flex items-center gap-1">{dark ? <SunMedium className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}{dark ? 'Clair' : 'Sombre'}</button>
        </div>
      </div>

      {/* Header */}
      <header className="container py-8 md:py-10">
        <div className="rounded-3xl overflow-hidden relative">
          <div className="h-28 md:h-36 bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900" />
          <div className="absolute inset-0">
            <div className="container h-full flex items-end pb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-zinc-500">Aujourd’hui — {today}</div>
                <h1 className="text-2xl md:text-3xl font-bold">Ton tableau de bord</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tiles grid */}
      <main className="container pb-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {tiles.map(t => <Tile key={t.id} {...t} />)}
        </div>

        {/* Quick sections */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="card p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Raccourcis</div>
              <span className="badge">Personnalisables</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {['+ Tâche rapide','+ Objectif','Ouvrir calendrier','Notes du jour','Routine soir'].map(x=>(
                <button key={x} className="px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">{x}</button>
              ))}
            </div>
          </div>
          <div className="card p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Astuce du jour</div>
              <span className="badge">Discipline</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Commence par 3 micro‑actions faciles que tu peux cocher en 10 minutes. L’élan > la motivation.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
