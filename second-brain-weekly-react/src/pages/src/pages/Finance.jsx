// src/pages/Finance.jsx
import React, { useEffect, useMemo, useState } from 'react'

/* ===========================
   Utils dates / storage keys
=========================== */
const pad = (n) => String(n).padStart(2, '0')
const toISO = (d=new Date()) => { const t=new Date(d); t.setHours(0,0,0,0); return t.toISOString().slice(0,10) }
const monthKey = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}` // YYYY-MM
const frMonthLabel = (d) => d.toLocaleDateString('fr-FR', { month:'long', year:'numeric' })

const expKey = (scope, mk) => `fin:${scope}:${mk}`                // array of expenses
const budgetKey = (scope, mk) => `fin:budget:${scope}:${mk}`      // number
const settingsKey = () => `fin:settings`                          // object: {urssafPeriod, tva, ft}
const monthlyTodoKey = (mk) => `fin:todo:${mk}`                   // object of booleans

const loadJSON = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback } catch { return fallback }
}
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v))

/* ===========================
   Domain data
=========================== */
const CATS_PERSO = ['logement','transports','courses','restos','abonnements','santé','shopping','loisirs','services','autre']
const CATS_PRO   = ['ads','saas','fournisseurs','frais','equipement','impots','autre']
const PAY_MODES  = ['CB','Cash','PayPal']

const catLabel = (scope, c) => {
  const map = {
    logement:'Logement', transports:'Transports', courses:'Courses', restos:'Restos',
    abonnements:'Abonnements', santé:'Santé', shopping:'Shopping', loisirs:'Loisirs', services:'Services', autre:'Autre',
    ads:'Pub (Ads)', saas:'Outils / SaaS', fournisseurs:'Fournisseurs', frais:'Frais', equipement:'Équipement', impots:'Impôts & taxes'
  }
  return map[c] || c
}

/* ===========================
   Helpers
=========================== */
const sum = (arr, get) => arr.reduce((a,b)=>a+(get?get(b):b),0)
const fmtEUR = (n) => (Number(n)||0).toLocaleString('fr-FR', { style:'currency', currency:'EUR' })
const csvEscape = (s) => `"${String(s??'').replace(/"/g,'""')}"`

const exportCSV = (scope, mk, items) => {
  const header = ['date','montant','categorie','note','paiement']
  const rows = items.map(x => [x.date, String(x.amount ?? ''), x.category || '', x.note || '', x.pay || ''])
  const lines = [header.join(','), ...rows.map(r => r.map(csvEscape).join(','))]
  const blob = new Blob([lines.join('\r\n')], { type:'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `finances-${scope}-${mk}.csv`; a.click()
  URL.revokeObjectURL(url)
}

const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

/* ===========================
   Main component
=========================== */
export default function FinancePage(){
  const [tab, setTab] = useState('perso') // 'perso' | 'pro' | 'rappels'
  const [now, setNow] = useState(new Date()) // mois courant (on pourrait ajouter la nav mois +/- si tu veux)
  const mk = useMemo(()=>monthKey(now), [now])

  // Settings rappels
  const [settings, setSettings] = useState(()=> loadJSON(settingsKey(), { urssafPeriod:'monthly', tva:false, ft:false }))
  useEffect(()=> saveJSON(settingsKey(), settings), [settings])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">FINANCES</div>
            <h2 className="text-xl md:text-2xl font-bold">Dépenses & rappels • {frMonthLabel(now)}</h2>
          </div>
          <div className="flex gap-2">
            {/* Nav mois (facultatif mais pratique) */}
            <button
              onClick={()=> setNow(d => { const n=new Date(d); n.setMonth(n.getMonth()-1); return n })}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700"
            >◀</button>
            <button
              onClick={()=> setNow(d => { const n=new Date(d); n.setMonth(n.getMonth()+1); return n })}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700"
            >▶</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
<div className="flex gap-2 text-sm">
  {[
    {k:'perso', label:'Perso'},
    {k:'pro', label:'Pro'},
    {k:'rappels', label:'Rappels'},
    {k:'auto', label:'Sortie auto'},          // 👈 AJOUT
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
      <div className="flex gap-2 text-sm">
        {[
          {k:'perso', label:'Perso'},
          {k:'pro', label:'Pro'},
          {k:'rappels', label:'Rappels'},
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

      {tab==='perso' && <ExpensesSection scope="perso" mk={mk} cats={CATS_PERSO} />}
      {tab==='pro'   && <ExpensesSection scope="pro"   mk={mk} cats={CATS_PRO}   />}
      {tab==='rappels' && <RemindersSection mk={mk} settings={settings} setSettings={setSettings} />}
    </div>
  )
}

/* ===========================
   ExpensesSection (Perso/Pro)
=========================== */
function ExpensesSection({ scope, mk, cats }){
  const [list, setList] = useState(()=> loadJSON(expKey(scope, mk), []))
  const [budget, setBudget] = useState(()=> loadJSON(budgetKey(scope, mk), 0))
  const [filterCat, setFilterCat] = useState('')
  const [filterPay, setFilterPay] = useState('')

  // form ajout
  const [form, setForm] = useState({ amount:'', category:'', date: toISO(), note:'', pay:'CB' })
  // édition inline (par id)
  const [editId, setEditId] = useState(null)
  const [editRow, setEditRow] = useState({ amount:'', category:'', date: toISO(), note:'', pay:'CB' })

  // persist à chaque changement + reset si on change de mois
  useEffect(()=>{ saveJSON(expKey(scope, mk), list) }, [list, scope, mk])
  useEffect(()=>{ saveJSON(budgetKey(scope, mk), budget) }, [budget, scope, mk])
  useEffect(()=>{
    setList(loadJSON(expKey(scope, mk), []))
    setBudget(loadJSON(budgetKey(scope, mk), 0))
    setFilterCat(''); setFilterPay('')
  }, [mk, scope])

  const total = useMemo(()=> sum(list, x => Number(x.amount)||0), [list])
  const filtered = useMemo(()=>{
    return list
      .filter(x => !filterCat || x.category===filterCat)
      .filter(x => !filterPay || x.pay===filterPay)
      .sort((a,b)=> b.date.localeCompare(a.date))
  }, [list, filterCat, filterPay])

  const addExpense = (e) => {
    e.preventDefault()
    const amt = Number(form.amount)
    if (!form.category || !amt) return
    const row = { id:newId(), amount: amt, category: form.category, date: form.date || toISO(), note: form.note?.trim() || '', pay: form.pay || 'CB' }
    setList(prev => [row, ...prev])
    setForm({ amount:'', category:'', date: toISO(), note:'', pay:'CB' })
  }

  const startEdit = (row) => {
    setEditId(row.id)
    setEditRow({ amount:String(row.amount), category:row.category, date:row.date, note:row.note||'', pay:row.pay||'CB' })
  }
  const saveEdit = () => {
    const amt = Number(editRow.amount)
    if (!editRow.category || !amt) return
    setList(prev => prev.map(x => x.id===editId ? { ...x, amount:amt, category:editRow.category, date:editRow.date, note:editRow.note, pay:editRow.pay } : x))
    setEditId(null)
  }
  const del = (id) => setList(prev => prev.filter(x => x.id!==id))

  // par catégorie (totaux)
  const totalsByCat = useMemo(()=>{
    const obj = {}
    list.forEach(x => {
      obj[x.category] = (obj[x.category]||0) + (Number(x.amount)||0)
    })
    return obj
  }, [list])

  const pct = budget > 0 ? Math.min(100, Math.round((total / budget) * 100)) : 0

  return (
    <div className="grid gap-4 md:grid-cols-[1fr,360px]">
      {/* Liste & ajout */}
      <div className="card p-5 md:p-6 space-y-4">
        {/* En-tête : Total + Budget */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-semibold">Total du mois</div>
            <span className="badge">{fmtEUR(total)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-70">Budget global</span>
            <input
              type="number" step="0.01"
              className="w-28 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              value={budget || ''} onChange={e=>setBudget(e.target.value===''?0:Number(e.target.value))}
              placeholder="0"
            />
          </div>
        </div>
        <div className="h-2 rounded bg-zinc-200 dark:bg-slate-800 overflow-hidden">
          <div className={`h-full ${pct>=90?'bg-red-500':'bg-blue-600'}`} style={{width:`${pct}%`}} />
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Dépensé: {fmtEUR(total)} {budget>0 && <>• {pct}% du budget</>}</div>

        {/* Filtres + Export */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCat} onChange={e=>setFilterCat(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">Toutes catégories</option>
            {cats.map(c => <option key={c} value={c}>{catLabel(scope, c)}</option>)}
          </select>
          <select
            value={filterPay} onChange={e=>setFilterPay(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            <option value="">Tous paiements</option>
            {PAY_MODES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={()=>exportCSV(scope, mk, filtered)} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">
            Exporter CSV
          </button>
        </div>

        {/* Form ajout */}
        <form onSubmit={addExpense} className="grid md:grid-cols-5 gap-2">
          <input
            type="number" step="0.01" placeholder="Montant (€)"
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            value={form.amount} onChange={e=>setForm(f=>({...f, amount:e.target.value}))}
          />
          <select
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            value={form.category} onChange={e=>setForm(f=>({...f, category:e.target.value}))}
          >
            <option value="">Catégorie</option>
            {cats.map(c => <option key={c} value={c}>{catLabel(scope, c)}</option>)}
          </select>
          <input
            type="date"
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            value={form.date} onChange={e=>setForm(f=>({...f, date:e.target.value}))}
          />
          <input
            placeholder="Note"
            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            value={form.note} onChange={e=>setForm(f=>({...f, note:e.target.value}))}
          />
          <div className="flex gap-2">
            <select
              className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              value={form.pay} onChange={e=>setForm(f=>({...f, pay:e.target.value}))}
            >
              {PAY_MODES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button className="px-3 py-2 rounded-lg bg-green-600 text-white">Ajouter</button>
          </div>
        </form>

        {/* Liste */}
        <div className="space-y-2">
          {filtered.length===0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Aucune dépense pour ce filtre / mois.</div>
          )}
          {filtered.map(row => (
            <div key={row.id} className="rounded-lg border border-zinc-200 dark:border-slate-700 p-3">
              {editId===row.id ? (
                <div className="grid md:grid-cols-5 gap-2 items-center">
                  <input type="number" step="0.01" className="px-3 py-2 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900"
                    value={editRow.amount} onChange={e=>setEditRow(r=>({...r, amount:e.target.value}))} />
                  <select className="px-3 py-2 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900"
                    value={editRow.category} onChange={e=>setEditRow(r=>({...r, category:e.target.value}))}>
                    {cats.map(c => <option key={c} value={c}>{catLabel(scope, c)}</option>)}
                  </select>
                  <input type="date" className="px-3 py-2 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900"
                    value={editRow.date} onChange={e=>setEditRow(r=>({...r, date:e.target.value}))} />
                  <input className="px-3 py-2 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900"
                    value={editRow.note} onChange={e=>setEditRow(r=>({...r, note:e.target.value}))} />
                  <div className="flex gap-2">
                    <select className="flex-1 px-3 py-2 rounded-lg border dark:border-slate-700 bg-white dark:bg-slate-900"
                      value={editRow.pay} onChange={e=>setEditRow(r=>({...r, pay:e.target.value}))}>
                      {PAY_MODES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <button onClick={saveEdit} className="px-3 py-2 rounded-lg bg-blue-600 text-white">OK</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{fmtEUR(row.amount)}</div>
                      <span className="badge">{catLabel(scope, row.category)}</span>
                      <span className="badge">{row.pay || 'CB'}</span>
                    </div>
                    <div className="text-xs opacity-70">{row.date}</div>
                    {row.note && <div className="text-sm opacity-85">{row.note}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>startEdit(row)} className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-slate-900 text-sm">Éditer</button>
                    <button onClick={()=>del(row.id)} className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-slate-900 text-sm">Suppr.</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Totaux par catégorie */}
        {Object.keys(totalsByCat).length>0 && (
          <div className="pt-2 border-t border-zinc-200 dark:border-slate-700">
            <div className="font-semibold mb-1">Par catégorie</div>
            <div className="grid md:grid-cols-2 gap-2">
              {Object.entries(totalsByCat).map(([c,v])=>(
                <div key={c} className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-slate-700 px-3 py-2">
                  <div className="text-sm">{catLabel(scope, c)}</div>
                  <div className="text-sm font-medium">{fmtEUR(v)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panneau droit : astuces / résumé */}
      <div className="card p-5 md:p-6 space-y-3">
        <div className="font-semibold">Résumé</div>
        <div className="text-sm">Mois : <strong>{mk}</strong></div>
        <div className="text-sm">Nombre d’entrées : <strong>{list.length}</strong></div>
        <div className="text-sm">Total : <strong>{fmtEUR(total)}</strong></div>
        {!!budget && <div className="text-sm">Reste sur budget : <strong>{fmtEUR(Math.max(0, budget - total))}</strong></div>}
        <div className="pt-2 border-t border-zinc-200 dark:border-slate-700 text-xs text-zinc-500 dark:text-zinc-400">
          Astuce : garde une catégorie “Autre” pour les dépenses exceptionnelles, puis re-classe si tu les vois revenir.
        </div>
      </div>
    </div>
  )
}

/* ===========================
   RemindersSection (Rappels)
=========================== */
function RemindersSection({ mk, settings, setSettings }){
  // cases cochées pour le mois
  const [checks, setChecks] = useState(()=> loadJSON(monthlyTodoKey(mk), {}))
  useEffect(()=> saveJSON(monthlyTodoKey(mk), checks), [checks, mk])
  useEffect(()=>{ setChecks(loadJSON(monthlyTodoKey(mk), {})) }, [mk]) // reset auto quand mois change

  const toggle = (k) => setChecks(prev => ({ ...prev, [k]: !prev[k] }))

  const monthNum = Number(mk.split('-')[1]) // 01..12
  const isQuarterMonth = [3,6,9,12].includes(monthNum)

  // liste des rappels (filtrée selon settings)
  const base = [
    { key:'urssaf',   label:'Déclaration URSSAF', show: settings.urssafPeriod==='monthly' || (settings.urssafPeriod==='quarterly' && isQuarterMonth) },
    { key:'book',     label:'Livre des recettes à jour', show:true },
    { key:'invoices', label:'Factures conformes (numérotation / mentions)', show:true },
    { key:'bank',     label:'Rapprochement bancaire (encaissements)', show:true },
    { key:'backup',   label:'Sauvegarde justificatifs (cloud/dossier)', show:true },
    { key:'provision',label:'Provision impôts & CFE', show:true },
    { key:'tva',      label:'Déclaration TVA', show: !!settings.tva },
    { key:'ft',       label:'Actualisation France Travail', show: !!settings.ft },
  ]
  const items = base.filter(x => x.show)

  return (
    <div className="grid gap-4 md:grid-cols-[1fr,360px]">
      {/* Check-list */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Rappels du mois — {mk}</div>
          <span className="badge">Se réinitialise le 1ᵉʳ</span>
        </div>

        <div className="space-y-2">
          {items.length===0 && (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">Aucun rappel ce mois-ci selon tes paramètres.</div>
          )}
          {items.map(it => (
            <label key={it.key} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-slate-700 px-3 py-2">
              <input type="checkbox" className="w-4 h-4" checked={!!checks[it.key]} onChange={()=>toggle(it.key)} />
              <span className="text-sm">{it.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Paramètres */}
      <div className="card p-5 md:p-6 space-y-3">
        <div className="font-semibold">Paramètres</div>
        <div className="text-sm">URSSAF — périodicité</div>
        <select
          value={settings.urssafPeriod}
          onChange={e=>setSettings(s=>({...s, urssafPeriod:e.target.value}))}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="monthly">Mensuelle</option>
          <option value="quarterly">Trimestrielle</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!settings.tva} onChange={e=>setSettings(s=>({...s, tva:e.target.checked}))} />
          Je déclare la TVA
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!settings.ft} onChange={e=>setSettings(s=>({...s, ft:e.target.checked}))} />
          Je suis inscrit à France Travail (actualisation mensuelle)
        </label>

        <div className="pt-2 border-t border-zinc-200 dark:border-slate-700 text-xs text-zinc-500 dark:text-zinc-400">
          Ces rappels sont indicatifs et ne remplacent pas des conseils fiscaux/juridiques.
        </div>
      </div>
    </div>
  )
}
