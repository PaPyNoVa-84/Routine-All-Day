import { useState, useEffect, useRef } from "react";
import { format, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";

const exos = [
  "Pompes",
  "Squats",
  "Fentes",
  "Abdos",
  "Gainage",
  "Burpees",
  "Mountain climbers",
  "Jumping jacks",
  "Tractions",
  "Dips"
];

// ---- Champ exercice avec autocomplétion ----
function ExoField({ value, onChange, placeholder = "Exercice" }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(value || "");
  const wrapRef = useRef(null);

  useEffect(() => setV(value || ""), [value]);

  // fermer au clic dehors
  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = exos.filter((exo) =>
    exo.toLowerCase().includes(v.trim().toLowerCase())
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

// ---- Page Training ----
export default function Training() {
  const [tab, setTab] = useState("natation");
  const [rows, setRows] = useState([{ id: Date.now(), exo: "", reps: "", sets: "", time: "" }]);
  const [note, setNote] = useState("");
  const [totalMin, setTotalMin] = useState("");
  const [totalSec, setTotalSec] = useState(0);

  const addRow = () => setRows([...rows, { id: Date.now(), exo: "", reps: "", sets: "", time: "" }]);
  const delRow = (id) => setRows(rows.filter(r => r.id !== id));

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  useEffect(() => {
    const sec = rows.reduce((acc, r) => acc + (parseInt(r.time) || 0), 0);
    setTotalSec(sec);
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold">Training</h2>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setTab("natation")}
            className={`px-3 py-1 rounded ${tab === "natation" ? "bg-zinc-200 dark:bg-slate-800" : ""}`}
          >
            Natation
          </button>
          <button
            onClick={() => setTab("maison")}
            className={`px-3 py-1 rounded ${tab === "maison" ? "bg-zinc-200 dark:bg-slate-800" : ""}`}
          >
            Maison
          </button>
        </div>
      </div>

      {/* ----- Maison ----- */}
      {tab === "maison" && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Séance du jour — Maison</h3>

          {rows.map((r) => (
            <div key={r.id} className="flex gap-2 items-center">
              <ExoField value={r.exo} onChange={(v) => updateRow(r.id, "exo", v)} />
              <input
                type="number"
                className="px-3 py-2 rounded-lg border w-20
                           bg-white dark:bg-slate-900
                           text-black dark:text-white
                           placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                placeholder="Séries"
                value={r.sets}
                onChange={(e) => updateRow(r.id, "sets", e.target.value)}
              />
              <input
                type="number"
                className="px-3 py-2 rounded-lg border w-20
                           bg-white dark:bg-slate-900
                           text-black dark:text-white
                           placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                placeholder="Reps"
                value={r.reps}
                onChange={(e) => updateRow(r.id, "reps", e.target.value)}
              />
              <input
                type="number"
                className="px-3 py-2 rounded-lg border w-24
                           bg-white dark:bg-slate-900
                           text-black dark:text-white
                           placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                placeholder="Sec"
                value={r.time}
                onChange={(e) => updateRow(r.id, "time", e.target.value)}
              />
              <button onClick={() => delRow(r.id)} className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-slate-900">Suppr.</button>
            </div>
          ))}

          <button onClick={addRow} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">
            + Ajouter une ligne
          </button>

          <div className="flex gap-2 items-center">
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
            <div className="px-3 py-2 rounded-lg border w-32
                            bg-white dark:bg-slate-900
                            text-black dark:text-white">
              {totalSec}
            </div>
          </div>

          <textarea
            className="px-3 py-2 rounded-lg border w-full min-h-[80px]
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Ton commentaire…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      )}

      {/* ----- Natation ----- */}
      {tab === "natation" && (
        <div className="card space-y-4">
          <h3 className="font-semibold">Séance du jour — Natation</h3>

          <input
            type="number"
            className="px-3 py-2 rounded-lg border w-full
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Nombre de longueurs crawl"
          />
          <input
            type="number"
            className="px-3 py-2 rounded-lg border w-full
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Nombre de longueurs dos"
          />
          <input
            type="number"
            className="px-3 py-2 rounded-lg border w-full
                       bg-white dark:bg-slate-900
                       text-black dark:text-white
                       placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            placeholder="Temps total (minutes)"
          />
        </div>
      )}
    </div>
  );
}
