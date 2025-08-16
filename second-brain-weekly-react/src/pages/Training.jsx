import React from "react";

/* ====== Utils ====== */
const loadJSON = (k, f) => {
  try { return JSON.parse(localStorage.getItem(k) || "") } catch { return f }
};
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const startOfWeekISO = (d = new Date()) => {
  const t = new Date(d); t.setHours(0,0,0,0);
  const w = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - w);
  return t.toISOString().slice(0,10);
};
const isSameWeek = (iso, ref = new Date()) => startOfWeekISO(new Date(iso)) === startOfWeekISO(ref);
const fmtDateShort = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR',{ weekday:'short', day:'2-digit', month:'2-digit' });

/* ====== Storage Keys ====== */
const SWIM_PREFS_KEY   = "train:swim:prefs";    // { poolLength: 25|50 }
const SWIM_SESSIONS_KEY= "train:swim:sessions"; // [{id,dateISO, poolLength, minutes, strokes:{crawl,dos,brasse?}, note? }]

const HOME_EXOS_KEY    = "train:home:exos";     // ['Pompes','Squats','Gainage',...]
const HOME_SESSIONS_KEY= "train:home:sessions"; // [{id,dateISO, minutes, items:[{exo, series, reps, secs}], note? }]

/* ====== Onglet Natation ====== */
function SwimTab() {
  const todayISO = new Date().toISOString().slice(0,10);
  const [prefs, setPrefs] = React.useState(() => loadJSON(SWIM_PREFS_KEY, { poolLength: 25 }));

  const [crawl, setCrawl] = React.useState(0);
  const [dos, setDos]     = React.useState(0);
  const [minutes, setMinutes] = React.useState(0);
  const [note, setNote]   = React.useState("");

  const [sessions, setSessions] = React.useState(() => loadJSON(SWIM_SESSIONS_KEY, []));

  React.useEffect(() => saveJSON(SWIM_PREFS_KEY, prefs), [prefs]);
  React.useEffect(() => saveJSON(SWIM_SESSIONS_KEY, sessions), [sessions]);

  const totalLengths = Number(crawl||0) + Number(dos||0);
  const distance = totalLengths * Number(prefs.poolLength || 25); // en mètres
  const secs = Number(minutes||0) * 60;
  const mPerMin = secs > 0 ? (distance / (secs/60)) : 0;
  const pacePer100m = distance > 0 && secs > 0 ? (secs / (distance/100)) : 0; // sec / 100m
  const paceLabel = secs > 0 && distance > 0
    ? `${String(Math.floor(pacePer100m/60)).padStart(2,'0')}:${String(Math.round(pacePer100m%60)).padStart(2,'0')} /100m`
    : "—";

  const saveSession = () => {
    const s = {
      id: newId(),
      dateISO: todayISO,
      poolLength: Number(prefs.poolLength || 25),
      minutes: Number(minutes||0),
      strokes: {
        crawl: Number(crawl||0),
        dos: Number(dos||0),
      },
      note: note.trim() || undefined,
    };
    setSessions(prev => [s, ...prev]);
    // reset
    setCrawl(0); setDos(0); setMinutes(0); setNote("");
  };

  const resetForm = () => {
    setCrawl(0); setDos(0); setMinutes(0); setNote("");
  };

  const delSession = (id) => setSessions(prev => prev.filter(s => s.id !== id));

  // Résumé hebdo
  const thisWeek = sessions.filter(s => isSameWeek(s.dateISO));
  const weekDist = thisWeek.reduce((a,b)=> a + ( (b.strokes.crawl + b.strokes.dos) * b.poolLength ),0);
  const weekMins = thisWeek.reduce((a,b)=> a + b.minutes, 0);
  const weekPaceSec =
    thisWeek.reduce((acc,s) => {
      const dist = (s.strokes.crawl + s.strokes.dos) * s.poolLength;
      const sec = s.minutes * 60;
      if (dist>0 && sec>0) { acc.totalSec += sec; acc.totalDist += dist; }
      return acc;
    }, { totalSec:0, totalDist:0 });
  const weekPace =
    (weekPaceSec.totalDist>0)
      ? `${String(Math.floor((weekPaceSec.totalSec/(weekPaceSec.totalDist/100))/60)).padStart(2,'0')}:${String(Math.round((weekPaceSec.totalSec/(weekPaceSec.totalDist/100))%60)).padStart(2,'0')} /100m`
      : "—";

  return (
    <div className="space-y-4">
      <div className="card p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Séance du jour — Natation</div>
          <div className="text-sm opacity-70">{new Date().toLocaleDateString('fr-FR',{weekday:'long', day:'2-digit', month:'long'})}</div>
        </div>

        {/* Préférences bassin */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <label className="col-span-2 md:col-span-1">
            <div className="text-xs opacity-70 mb-1">Longueur de bassin (m)</div>
            <select
              className="w-full px-3 py-2 rounded-lg border"
              value={prefs.poolLength}
              onChange={(e)=>setPrefs(p=>({ ...p, poolLength: Number(e.target.value) }))}
            >
              <option value={25}>25 m</option>
              <option value={50}>50 m</option>
            </select>
          </label>

          <label>
            <div className="text-xs opacity-70 mb-1">Crawl — longueurs</div>
            <input type="number" min="0" className="w-full px-3 py-2 rounded-lg border"
              value={crawl} onChange={(e)=>setCrawl(e.target.value)} />
          </label>

          <label>
            <div className="text-xs opacity-70 mb-1">Dos — longueurs</div>
            <input type="number" min="0" className="w-full px-3 py-2 rounded-lg border"
              value={dos} onChange={(e)=>setDos(e.target.value)} />
          </label>

          <label>
            <div className="text-xs opacity-70 mb-1">Temps dans l’eau (min)</div>
            <input type="number" min="0" className="w-full px-3 py-2 rounded-lg border"
              value={minutes} onChange={(e)=>setMinutes(e.target.value)} />
          </label>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs opacity-70">Distance totale</div>
            <div className="font-semibold">{distance.toLocaleString('fr-FR')} m</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs opacity-70">Vitesse moyenne</div>
            <div className="font-semibold">{mPerMin ? `${mPerMin.toFixed(1)} m/min` : '—'}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs opacity-70">Pace</div>
            <div className="font-semibold">{paceLabel}</div>
          </div>
        </div>

        {/* Note */}
        <textarea
          className="w-full px-3 py-2 rounded-lg border"
          placeholder="Note (optionnel) — ressenti, souffle, technique..."
          value={note}
          onChange={(e)=>setNote(e.target.value)}
        />

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={saveSession} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Enregistrer la séance</button>
          <button onClick={resetForm} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">Réinitialiser</button>
        </div>
      </div>

      {/* Historique */}
      <div className="card p-5 md:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Historique — Natation</div>
          <div className="text-xs opacity-70">
            Semaine — { (weekDist||0).toLocaleString('fr-FR') } m • {weekMins} min • {weekPace}
          </div>
        </div>

        {sessions.length === 0 && (
          <div className="text-sm opacity-70">Pas encore de séance enregistrée.</div>
        )}

        <div className="space-y-2">
          {sessions.map(s => {
            const dist = (s.strokes.crawl + s.strokes.dos) * s.poolLength;
            const paceS = (dist>0 && s.minutes>0) ? ( (s.minutes*60) / (dist/100) ) : 0;
            const pace = dist>0 && s.minutes>0
              ? `${String(Math.floor(paceS/60)).padStart(2,'0')}:${String(Math.round(paceS%60)).padStart(2,'0')} /100m`
              : "—";
            return (
              <div key={s.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{fmtDateShort(s.dateISO)}</div>
                  <div className="text-sm opacity-70">{dist.toLocaleString('fr-FR')} m • {s.minutes} min • {pace}</div>
                </div>
                <div className="text-sm opacity-80 mt-1">
                  Crawl {s.strokes.crawl} L • Dos {s.strokes.dos} L • Bassin {s.poolLength} m
                </div>
                {s.note && <div className="text-sm mt-2">{s.note}</div>}
                <div className="mt-2">
                  <button onClick={()=>delSession(s.id)} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">Supprimer</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ====== Onglet Sport à la maison (sans charge) ====== */
function HomeTab() {
  const todayISO = new Date().toISOString().slice(0,10);

  const [exos, setExos] = React.useState(() =>
    loadJSON(HOME_EXOS_KEY, ['Pompes','Squats','Gainage','Abdos','Fentes'])
  );
  const [sessions, setSessions] = React.useState(() =>
    loadJSON(HOME_SESSIONS_KEY, [])
  );

  // Form séance
  const [minutes, setMinutes] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [rows, setRows] = React.useState([
    { id: newId(), exo: 'Pompes', series: 3, reps: 10, secs: 0 },
  ]);
  React.useEffect(() => saveJSON(HOME_EXOS_KEY, exos), [exos]);
  React.useEffect(() => saveJSON(HOME_SESSIONS_KEY, sessions), [sessions]);

  const addRow = () => setRows(prev => [...prev, { id: newId(), exo: exos[0] || '', series: 3, reps: 10, secs: 0 }]);
  const delRow = (id) => setRows(prev => prev.filter(r => r.id !== id));
  const setRow = (id, patch) => setRows(prev => prev.map(r => r.id===id ? { ...r, ...patch } : r));

  const addExoName = () => {
    const name = prompt("Nom de l'exercice ?");
    if (!name) return;
    if (!exos.includes(name)) setExos(prev => [...prev, name]);
    setRows(prev => [...prev, { id: newId(), exo: name, series: 3, reps: 10, secs: 0 }]);
  };

  // KPI
  const totalSeries = rows.reduce((a,b)=> a + Number(b.series||0), 0);
  const totalReps   = rows.reduce((a,b)=> a + (Number(b.series||0) * Number(b.reps||0)), 0);
  const totalSecs   = rows.reduce((a,b)=> a + Number(b.secs||0) * Number(b.series||0), 0);

  const saveSession = () => {
    const clean = rows.filter(r => (r.exo && (Number(r.reps)>0 || Number(r.secs)>0)));
    if (clean.length === 0) return;
    const s = {
      id: newId(),
      dateISO: todayISO,
      minutes: Number(minutes||0),
      items: clean.map(r => ({
        exo: r.exo,
        series: Number(r.series||0),
        reps: Number(r.reps||0),
        secs: Number(r.secs||0),
      })),
      note: note.trim() || undefined,
    };
    setSessions(prev => [s, ...prev]);
    // reset
    setMinutes(0); setNote("");
    setRows([{ id: newId(), exo: exos[0] || 'Pompes', series: 3, reps: 10, secs: 0 }]);
  };

  const resetForm = () => {
    setMinutes(0); setNote("");
    setRows([{ id: newId(), exo: exos[0] || 'Pompes', series: 3, reps: 10, secs: 0 }]);
  };

  const delSession = (id) => setSessions(prev => prev.filter(s => s.id !== id));

  // Résumé hebdo
  const thisWeek = sessions.filter(s => isSameWeek(s.dateISO));
  const weekSessions = thisWeek.length;
  const weekSeries = thisWeek.reduce((a,b)=> a + b.items.reduce((x,y)=> x + y.series, 0), 0);
  const weekReps   = thisWeek.reduce((a,b)=> a + b.items.reduce((x,y)=> x + y.series * y.reps, 0), 0);
  const weekSecs   = thisWeek.reduce((a,b)=> a + b.items.reduce((x,y)=> x + y.series * y.secs, 0), 0);

  return (
    <div className="space-y-4">
      <div className="card p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Séance du jour — Maison</div>
          <div className="text-sm opacity-70">{new Date().toLocaleDateString('fr-FR',{weekday:'long', day:'2-digit', month:'long'})}</div>
        </div>

        {/* Lignes d'exercices */}
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.id} className="grid md:grid-cols-[1fr,100px,100px,120px,auto] gap-2 items-center">
              <select
                className="px-3 py-2 rounded-lg border"
                value={r.exo}
                onChange={(e)=>setRow(r.id,{ exo: e.target.value })}
              >
                {exos.map(name => <option key={name} value={name}>{name}</option>)}
              {/* Exercice (combobox) */}
<div className="relative w-full">
  <input
    list={`exos-${r.id}`}
    className="px-3 py-2 rounded-lg border w-full"
    value={r.exo}
    onChange={(e)=>setRow(r.id, { exo: e.target.value })}
    placeholder="Exercice"
  />
  <datalist id={`exos-${r.id}`}>
    {exos.map(name => <option key={name} value={name} />)}
  </datalist>
</div>


              <input type="number" min="0" className="px-3 py-2 rounded-lg border"
                     value={r.series} onChange={(e)=>setRow(r.id,{ series: Number(e.target.value) })} placeholder="Séries" />

              <input type="number" min="0" className="px-3 py-2 rounded-lg border"
                     value={r.reps} onChange={(e)=>setRow(r.id,{ reps: Number(e.target.value) })} placeholder="Reps" />

              <input type="number" min="0" className="px-3 py-2 rounded-lg border"
                     value={r.secs} onChange={(e)=>setRow(r.id,{ secs: Number(e.target.value) })} placeholder="Durée (sec)" />

              <div className="flex gap-2">
                <button onClick={()=>delRow(r.id)} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">Suppr.</button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions lignes */}
        <div className="flex gap-2">
          <button onClick={addRow} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">+ Ajouter une ligne</button>
          <button onClick={addExoName} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">+ Nouvel exercice</button>
        </div>

        {/* KPIs */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs opacity-70">Séries totales</div>
            <div className="font-semibold">{totalSeries}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs opacity-70">Répétitions totales</div>
            <div className="font-semibold">{totalReps}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs opacity-70">Durée cumulée (sec)</div>
            <div className="font-semibold">{totalSecs}</div>
          </div>
        </div>

        {/* Temps + note */}
        <div className="grid md:grid-cols-2 gap-2">
          <label>
            <div className="text-xs opacity-70 mb-1">Temps total séance (min)</div>
            <input type="number" min="0" className="w-full px-3 py-2 rounded-lg border"
              value={minutes} onChange={(e)=>setMinutes(e.target.value)} />
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-lg border"
            placeholder="Note (optionnel) — ressenti, difficulté, etc."
            value={note}
            onChange={(e)=>setNote(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={saveSession} className="px-3 py-2 rounded-lg bg-blue-600 text-white">Enregistrer la séance</button>
          <button onClick={resetForm} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">Réinitialiser</button>
        </div>
      </div>

      {/* Historique */}
      <div className="card p-5 md:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Historique — Maison</div>
          <div className="text-xs opacity-70">
            Semaine — {weekSessions} séance(s) • {weekSeries} séries • {weekReps} reps • {weekSecs} sec
          </div>
        </div>

        {sessions.length === 0 && (
          <div className="text-sm opacity-70">Pas encore de séance enregistrée.</div>
        )}

        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{fmtDateShort(s.dateISO)}</div>
                <div className="text-sm opacity-70">{s.minutes} min</div>
              </div>
              <div className="mt-2 space-y-1 text-sm">
                {s.items.map((it, idx) => (
                  <div key={idx} className="opacity-90">
                    • {it.exo} — {it.series} x {it.reps || 0}{it.secs ? ` (durée ${it.secs}s)` : '' }
                  </div>
                ))}
              </div>
              {s.note && <div className="text-sm mt-2">{s.note}</div>}
              <div className="mt-2">
                <button onClick={()=>delSession(s.id)} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====== Page Training (onglets) ====== */
export default function Training() {
  const [tab, setTab] = React.useState('swim'); // 'swim' | 'home'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">TRAINING</div>
            <h2 className="text-xl md:text-2xl font-bold">Natation & maison</h2>
          </div>
          <span className="badge">
            {startOfWeekISO()} — {new Date().toLocaleDateString('fr-FR',{ day:'2-digit', month:'2-digit' })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 text-sm">
        <button
          onClick={()=>setTab('swim')}
          className={`px-3 py-2 rounded-lg border ${tab==='swim' ? 'bg-black text-white dark:bg-white dark:text-black':''}`}
        >
          Natation
        </button>
        <button
          onClick={()=>setTab('home')}
          className={`px-3 py-2 rounded-lg border ${tab==='home' ? 'bg-black text-white dark:bg-white dark:text-black':''}`}
        >
          Maison
        </button>
      </div>

      {tab==='swim' && <SwimTab />}
      {tab==='home' && <HomeTab />}
    </div>
  );
}
