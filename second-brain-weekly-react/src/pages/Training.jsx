// src/pages/Training.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

/* =======================
   Utils dates — sans date-fns
   ======================= */
// YYYY-MM-DD
const pad2 = (n) => String(n).padStart(2, "0");
const toISO = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// lundi de la semaine courante
const startOfISOWeek = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // 0=dimanche → on veut lundi=0
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
};
// dimanche de la même semaine
const endOfISOWeek = (date = new Date()) => {
  const start = startOfISOWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
};

/* =======================
   Données d’autocomplétion
   ======================= */
const EXOS = [
  "Pompes",
  "Squats",
  "Fentes",
  "Abdos",
  "Gainage",
  "Burpees",
  "Mountain climbers",
  "Jumping jacks",
  "Tractions",
  "Dips",
];

/* =======================
   Champ Exercice (autocomplete)
   ======================= */
function ExoField({ value, onChange, placeholder = "Exercice" }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(value || "");
  const wrapRef = useRef(null);

  useEffect(() => setV(value || ""), [value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = EXOS.filter((exo) =>
    exo.toLowerCase().includes((v || "").trim().toLowerCase())
  );

  const pick = (name) => {
    onChange(name);
    setV(name);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapRef}>
      <input
        className="px-3 py-2 rounded-lg border w-full
                   bg-white dark:bg-slate-900
                   text-black dark:text-white
                   placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
        value={v}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setV(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-full z-50 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-60 overflow-auto text-black dark:text-white">
          {list.length === 0 ? (
            <div className="px-3 py-2 text-sm opacity-60">Aucune suggestion</div>
          ) : (
            list.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => pick(name)}
                className="block w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-slate-800"
              >
                {name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =======================
   Page Training
   ======================= */
export default function Training() {
  const [tab, setTab] = useState("natation"); // "natation" | "maison"

  // Maison — lignes d’exos
  const [rows, setRows] = useState([
    { id: Date.now(), exo: "", sets: "", reps: "", time: "" },
  ]);
  const addRow = () =>
    setRows((r) => [...r, { id: Date.now() + Math.random(), exo: "", sets: "", reps: "", time: "" }]);
  const delRow = (id) => setRows((r) => r.filter((x) => x.id !== id));
  const updateRow = (id, field, val) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [field]: val } : x)));

  const [note, setNote] = useState("");
  const [totalMin, setTotalMin] = useState("");
  const totalSec = useMemo(
    () => rows.reduce((acc, r) => acc + (parseInt(r.time) || 0), 0),
    [rows]
  );

  // Badge semaine — ISO
  const weekFrom = startOfISOWeek();
  const weekTo = endOfISOWeek();
  const badge = `${toISO(weekFrom)} — ${toISO(weekTo)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Training</div>
            <h2 className="text-xl md:text-2xl font-bold">Natation & maison</h2>
          </div>
          <span className="badge">{badge}</span>
        </div>

        {/* Onglets */}
        <div className="mt-4 flex gap-2">
          <button
            className={`px-3 py-1 rounded ${tab === "natation" ? "bg-zinc-200 dark:bg-slate-800" : ""}`}
            onClick={() => setTab("natation")}
          >
            Natation
          </button>
          <button
            className={`px-3 py-1 rounded ${tab === "maison" ? "bg-zinc-200 dark:bg-slate-800" : ""}`}
            onClick={() => setTab("maison")}
          >
            Maison
          </button>
        </div>
      </div>

      {/* ========== Onglet Maison ========== */}
      {tab === "maison" && (
        <div className="card space-y-4">
          <div className="text-sm font-semibold">
            Séance du jour — <span className="opacity-80">Maison</span>
          </div>

          {/* Lignes d’exercices */}
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <ExoField
                value={r.exo}
                onChange={(v) => updateRow(r.id, "exo", v)}
                placeholder="Exercice"
              />
              <input
                type="number"
                className="px-3 py-2 rounded-lg border w-24
                           bg-white dark:bg-slate-900
                           text-black dark:text-white
                           placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                placeholder="Séries"
                value={r.sets}
                onChange={(e) => updateRow(r.id, "sets", e.target.value)}
              />
              <input
                type="number"
                className="px-3 py-2 rounded-lg border w-24
                           bg-white dark:bg-slate-900
                           text-black dark:text-white
                           placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                placeholder="Reps"
                value={r.reps}
                onChange={(e) => updateRow(r.id, "reps", e.target.value)}
              />
              <input
                type="number"
                className="px-3 py-2 rounded-lg border w-28
                           bg-white dark:bg-slate-900
                           text-black dark:text-white
                           placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                placeholder="Sec"
                value={r.time}
                onChange={(e) => updateRow(r.id, "time", e.target.value)}
              />
              <button
                className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900"
                onClick={() => delRow(r.id)}
              >
                Suppr.
              </button>
            </div>
          ))}

          <button onClick={addRow} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">
            + Ajouter une ligne
          </button>

          {/* Totaux & commentaire – mêmes champs/visuels */}
          <div className="grid md:grid-cols-2 gap-2">
            <input
              type="number"
              className="px-3 py-2 rounded-lg border w-full
                         bg-white dark:bg-slate-900
                         text-black dark:text-white
                         placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
              placeholder="Temps total séance (min)"
              value={totalMin}
              onChange={(e) => setTotalMin(e.target.value)}
            />
            <div
              className="px-3 py-2 rounded-lg border w-full
                         bg-white dark:bg-slate-900
                         text-black dark:text-white"
            >
              {totalSec}
            </div>
          </div>

          <textarea
            className="px-3 py-2 rounded-lg border w-full min-h-[80px]
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Note (optionnel) — ressenti, difficulté, etc."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {/* Boutons (visuels seulement) */}
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Enregistrer la séance
            </button>
            <button className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">
              Réinitialiser
            </button>
          </div>
        </div>
      )}

      {/* ========== Onglet Natation ========== */}
      {tab === "natation" && (
        <div className="card space-y-4">
          <div className="text-sm font-semibold">
            Séance du jour — <span className="opacity-80">Natation</span>
          </div>

          {/* Ici, on garde exactement la même interface d’inputs simples */}
          <input
            type="number"
            className="px-3 py-2 rounded-lg border w-full
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Longueurs — crawl"
          />
          <input
            type="number"
            className="px-3 py-2 rounded-lg border w-full
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Longueurs — dos crawlé"
          />
          <input
            type="number"
            className="px-3 py-2 rounded-lg border w-full
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Temps total dans l’eau (minutes)"
          />

          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">
              Enregistrer la séance
            </button>
            <button className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
