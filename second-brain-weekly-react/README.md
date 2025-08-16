# 2ᵉ CERVEAU — UI (React/Vite) — Étape “Semaine hebdo”

Version répliquée **jusqu’au moment où l’on a intégré ta semaine hebdo** dans `Habits.jsx`.
Pas de bouton “2ème cerveau”. Prête pour **GitHub + Netlify**.

## Démarrage local
```bash
npm install
npm run dev
```

## Déploiement Netlify (repo connecté)
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Environment** : `NODE_VERSION=20`
- SPA fallback déjà inclus via `_redirects` et `netlify.toml`.

Astuce : en cas de changement de Node ou de lockfile → **Clear cache and deploy site**.

## Fichiers clés
- `src/pages/Habits.jsx` → contient `defaultTemplate` (ta semaine).
- `netlify.toml`, `_redirects`, `.node-version` → config Netlify OK.
- `package.json` (React 18, Vite 5, Tailwind 3).

## Routes
`/` (Home), `/habits`, `/todo`, `/goals`, `/calendar`, `/training`, `/health`, `/settings`.
