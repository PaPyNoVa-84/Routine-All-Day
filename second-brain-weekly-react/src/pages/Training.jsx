// src/pages/Training.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";

/* =============== Utils dates + storage =============== */
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d = new Date()) => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t.toISOString().slice(0, 10);
};
const mondayISO = (d = new Date()) => {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  const w = (t.getDay() + 6) % 7; // Lundi=0
  t.setDate(t.getDate() - w);
  return t.toISOString().slice(0, 10);
};
const sundayISO = (d = new Date()) => {
  const m = new Date(mondayISO(d));
  const s = new Date(m);
  s.setDate(m.getDate() + 6);
  return s.toISOString().slice(0, 10);
};
const fmtFR = (iso) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

const load = (k, fb) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fb;
  } catch {
    return fb;
  }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/* =============== Keys par jour =============== */
const swimKey = (iso) => `training:swim:${iso}`;
const homeKey = (iso) => `training:home:${iso}`;

/* =============== Propositions exercices (Maison) =============== */
const EXOS = [
  "Pompes",
  "Squats",
  "Fentes",
  "Tractions",
  "Dips",
  "Gainage (planche)",
  "Gainage latéral",
  "Crunchs",
  "Mountain climbers",
  "Burpees",
  "Jumping jacks",
  "Soulevé de hanches",
  "Abdos ciseaux",
  "Superman",
];

/* =========================================================
   Combobox “Exercice” (garde l’input, ajoute une liste flottante)
   ======================================================= */
function ExoField({ value, onChange, placeholder = "Exercice" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || "");
  const wrapRef = useRef(null);

  useEffect(() => setQ(value || ""), [value]);

  // ferme au clic dehors
  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const list = EXOS.filter((name) =>
    name.toLowerCase().includes(q.trim().toLowerCase())
  );

  const pick = (name) => {
    onChange(name);
    setQ(name);
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapRef}>
      <input
        className="px-3 py-2 rounded-lg border w-full"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] w-full z-50 rounded-lg border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-60 overflow-auto">
          {list.length === 0 ? (
            <div className="px-3 py-2 text-sm opacity-60">Aucune suggestion</div>
          ) : (
            list.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => pick(name)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-slate-800"
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

/* =========================================================
   Onglet NATATION
   ======================================================= */
function SwimTab({ iso, onSaved }) {
  const init = load(swimKey(iso), {});
  const [crawl, setCrawl] = useState(init.crawl ?? 0);
  const [back, setBack] = useState(init.back ?? 0);
  const [sec, setSec] = useState(init.sec ?? 0);
  const [note, setNote] = useState(init.note ?? "");

  const reset = () => {
    setCrawl(0);
    setBack(0);
    setSec(0);
    setNote("");
  };

  const saveDay = () => {
    save(swimKey(iso), {
      crawl: Number(crawl) || 0,
      back: Number(back) || 0,
      sec: Number(sec) || 0,
      note,
    });
    onSaved?.();
  };

  const totalLen = (Number(crawl) || 0) + (Number(back) || 0);

  return (
    <div className="card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold opacity-80">
          Séance du jour — Natation <span className="opacity-60">({fmtFR(iso)})</span>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_1fr_1fr] gap-3">
        <div>
          <label className="block text-xs opacity-60 mb-1">Dos crawlé (longueurs)</label>
          <input
            type="number"
            min="0"
            className="px-3 py-2 rounded-lg border w-full"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs opacity-60 mb-1">Crawl (longueurs)</label>
          <input
            type="number"
            min="0"
            className="px-3 py-2 rounded-lg border w-full"
            value={crawl}
            onChange={(e) => setCrawl(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs opacity-60 mb-1">Temps total (sec)</label>
          <input
            type="number"
            min="0"
            className="px-3 py-2 rounded-lg border w-full"
            value={sec}
            onChange={(e) => setSec(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs opacity-60 mb-1">Note (optionnel)</label>
        <textarea
          className="px-3 py-2 rounded-lg border w-full min-h-[80px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ressenti, technique, difficultés…"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">
          Total longueurs : <span className="font-semibold">{totalLen}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={saveDay} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
            Enregistrer la séance
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Onglet MAISON
   ======================================================= */
function HomeTab({ iso, onSaved }) {
  const day = load(homeKey(iso), { rows: [], totalMin: 0, note: "" });

  const [rows, setRows] = useState(() =>
    (day.rows || []).map((r) => ({ ...r, id: r.id ?? crypto.randomUUID() }))
  );
  const [totalMin, setTotalMin] = useState(day.totalMin || 0);
  const [note, setNote] = useState(day.note || "");

  const addRow = () =>
    setRows((p) => [
      ...p,
      { id: crypto.randomUUID(), exo: "", sets: 0, reps: 0, sec: 0 },
    ]);

  const delRow = (id) => setRows((p) => p.filter((x) => x.id !== id));
  const setRow = (id, patch) =>
    setRows((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const reset = () => {
    setRows([]);
    setTotalMin(0);
    setNote("");
  };

  const saveDay = () => {
    const clean = {
      rows: rows.map(({ id, exo, sets, reps, sec }) => ({
        id,
        exo: exo || "",
        sets: Number(sets) || 0,
        reps: Number(reps) || 0,
        sec: Number(sec) || 0,
      })),
      totalMin: Number(totalMin) || 0,
      note,
    };
    save(homeKey(iso), clean);
    onSaved?.();
  };

  const totalSec = rows.reduce((s, r) => s + (Number(r.sec) || 0), 0);

  return (
    <div className="card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold opacity-80">
          Séance du jour — Maison <span className="opacity-60">({fmtFR(iso)})</span>
        </div>
      </div>

      {/* Lignes */}
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="grid md:grid-cols-[minmax(220px,1fr)_110px_110px_110px_90px] gap-2 items-center"
          >
            {/* Exercice (combobox custom) */}
            <ExoField
              value={r.exo}
              onChange={(val) => setRow(r.id, { exo: val })}
            />

            {/* Séries */}
            <input
              type="number"
              min="0"
              className="px-3 py-2 rounded-lg border w-full"
              value={r.sets ?? 0}
              onChange={(e) => setRow(r.id, { sets: Number(e.target.value) })}
              placeholder="Séries"
            />

            {/* Reps */}
            <input
              type="number"
              min="0"
              className="px-3 py-2 rounded-lg border w-full"
              value={r.reps ?? 0}
              onChange={(e) => setRow(r.id, { reps: Number(e.target.value) })}
              placeholder="Reps"
            />

            {/* Durée (sec) */}
            <input
              type="number"
              min="0"
              className="px-3 py-2 rounded-lg border w-full"
              value={r.sec ?? 0}
              onChange={(e) => setRow(r.id, { sec: Number(e.target.value) })}
              placeholder="Sec"
            />

            {/* Supprimer */}
            <button
              onClick={() => delRow(r.id)}
              className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900"
            >
              Suppr.
            </button>
          </div>
        ))}

        {/* Actions lignes */}
        <div className="flex gap-2">
          <button
            onClick={addRow}
            className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900"
          >
            + Ajouter une ligne
          </button>
        </div>
      </div>

      {/* Totaux / note */}
      <div className="grid md:grid-cols-[1fr_1fr] gap-3">
        <div>
          <label className="block text-xs opacity-60 mb-1">Temps total séance (min)</label>
          <input
            type="number"
            min="0"
            className="px-3 py-2 rounded-lg border w-full"
            value={totalMin}
            onChange={(e) => setTotalMin(e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-xs opacity-60 mb-1">Durée cumulée (sec)</label>
          <div className="px-3 py-2 rounded-lg border w-full bg-transparent">
            {totalSec}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs opacity-60 mb-1">
          Note (optionnel) — ressenti, difficulté, etc.
        </label>
        <textarea
          className="px-3 py-2 rounded-lg border w-full min-h-[80px]"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ton commentaire…"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">
          Semaine — {rows.length} ligne(s) • {totalSec} sec cumulés
        </div>
        <div className="flex gap-2">
          <button onClick={saveDay} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
            Enregistrer la séance
          </button>
          <button onClick={reset} className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-slate-900">
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Historique semaine
   ======================================================= */
function WeeklyHistory() {
  const monday = mondayISO();
  const sunday = sundayISO();

  let swim = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const iso = toISO(d);
    const v = load(swimKey(iso), null);
    if (v) swim.push({ iso, ...v });
  }

  let home = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const iso = toISO(d);
    const v = load(homeKey(iso), null);
    if (v) home.push({ iso, ...v });
  }

  const sum = (arr, prop) => arr.reduce((s, x) => s + (Number(x[prop]) || 0), 0);
  const crawlTotal = sum(swim, "crawl");
  const backTotal = sum(swim, "back");
  const swimSecTotal = sum(swim, "sec");
  const homeSecTotal = home.reduce(
    (s, x) => s + (x.rows || []).reduce((a, r) => a + (Number(r.sec) || 0), 0),
    0
  );

  return (
    <div className="card p-5 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold opacity-80">
          Historique — semaine du {monday} au {sunday}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Natation */}
        <div>
          <div className="font-semibold mb-2">Natation</div>
          {swim.length === 0 ? (
            <div className="text-sm opacity-60">Pas encore de séance enregistrée.</div>
          ) : (
            <div className="space-y-2">
              {swim.map((s) => (
                <div key={s.iso} className="rounded-lg border p-3">
                  <div className="text-sm font-medium">{fmtFR(s.iso)}</div>
                  <div className="text-xs opacity-75">
                    Dos crawlé: {s.back} • Crawl: {s.crawl} • Temps: {s.sec} sec
                  </div>
                  {s.note && <div className="text-xs mt-1 opacity-80">“{s.note}”</div>}
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 text-sm opacity-80">
            <span className="font-semibold">Total semaine :</span>{" "}
            Dos crawlé {backTotal} • Crawl {crawlTotal} • {swimSecTotal} sec
          </div>
        </div>

        {/* Maison */}
        <div>
          <div className="font-semibold mb-2">Maison</div>
          {home.length === 0 ? (
            <div className="text-sm opacity-60">Pas encore de séance enregistrée.</div>
          ) : (
            <div className="space-y-2">
              {home.map((h) => {
                const txt = (h.rows || [])
                  .map((r) => `${r.exo || "?"} — ${r.sets}x${r.reps} (${r.sec}s)`)
                  .join(" • ");
                const secCum = (h.rows || []).reduce(
                  (s, r) => s + (Number(r.sec) || 0),
                  0
                );
                return (
                  <div key={h.iso} className="rounded-lg border p-3">
                    <div className="text-sm font-medium">{fmtFR(h.iso)}</div>
                    <div className="text-xs opacity-75">{txt || "Aucun détail"}</div>
                    <div className="text-xs opacity-75">Durée cumulée : {secCum} sec</div>
                    {h.note && <div className="text-xs mt-1 opacity-80">“{h.note}”</div>}
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-3 text-sm opacity-80">
            <span className="font-semibold">Total semaine :</span> {homeSecTotal} sec cumulés
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Page TRAINING
   ======================================================= */
export default function Training() {
  const [tab, setTab] = useState("swim"); // 'swim' | 'home'
  const iso = toISO();
  const monday = mondayISO();
  const sunday = sundayISO();
  const [, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
              TRAINING
            </div>
            <h2 className="text-xl md:text-2xl font-bold">Natation & maison</h2>
          </div>
          <span className="badge">
            {monday} — {sunday}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("swim")}
          className={`px-3 py-2 rounded-lg border ${
            tab === "swim" ? "bg-black text-white dark:bg-white dark:text-black" : ""
          }`}
        >
          Natation
        </button>
        <button
          onClick={() => setTab("home")}
          className={`px-3 py-2 rounded-lg border ${
            tab === "home" ? "bg-black text-white dark:bg-white dark:text-black" : ""
          }`}
        >
          Maison
        </button>
      </div>

      {/* Contenu */}
      {tab === "swim" && <SwimTab iso={iso} onSaved={refresh} />}
      {tab === "home" && <HomeTab iso={iso} onSaved={refresh} />}

      {/* Historique */}
      <WeeklyHistory />
    </div>
  );
}
