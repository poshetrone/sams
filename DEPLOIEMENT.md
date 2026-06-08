# Déploiement SAMS — GitHub + Vercel

Application **Next.js 14 + Supabase**, déployable sur **Vercel**.

## Prérequis

- Un compte **GitHub** et un compte **Vercel** (connecté à GitHub).
- Le projet **Supabase** déjà créé (schéma SQL exécuté).
- L'application **Discord** OAuth (Client ID / Secret) configurée dans Supabase.

## 1. Pousser le code sur GitHub

Le dépôt git local existe déjà (branche `master`) et le premier commit est fait.
Crée un dépôt **vide** sur GitHub (sans README), puis :

```bash
cd sams
git remote add origin https://github.com/<TON_USER>/<TON_REPO>.git
git branch -M main
git push -u origin main
```

> `.env.local` n'est **pas** poussé (ignoré par `.gitignore`). Les clés se renseignent sur Vercel.

## 2. Importer le projet sur Vercel

1. https://vercel.com → **Add New… → Project** → sélectionne le dépôt GitHub.
2. Framework détecté automatiquement : **Next.js**. Root Directory = `sams` (si le repo contient le dossier `sams/`) ou `.` si tu as poussé le contenu de `sams/` à la racine.
3. **Environment Variables** — ajoute les 3 (valeurs depuis ton `.env.local`) :

   | Nom | Portée |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview + Development |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production + Preview + Development |
   | `SUPABASE_SERVICE_ROLE_KEY` | Production + Preview (secret) |

4. **Deploy**. Vercel fournit une URL `https://<app>.vercel.app`.

## 3. Configurer les URLs d'authentification (IMPORTANT)

Après le 1er déploiement, autorise le domaine Vercel côté Supabase :

- **Supabase → Authentication → URL Configuration**
  - **Site URL** : `https://<app>.vercel.app`
  - **Redirect URLs** : ajoute `https://<app>.vercel.app/**` (garde aussi `http://localhost:3000/**` pour le dev)

- **Discord Developer Portal → OAuth2 → Redirects** : doit contenir
  `https://<projet>.supabase.co/auth/v1/callback` (inchangé — c'est Supabase qui gère le retour Discord, pas Vercel).

Le code utilise `window.location.origin` pour le `redirectTo`, donc le callback s'adapte automatiquement au domaine (localhost ou Vercel).

## 4. Base de données

- Schéma : `supabase_schema.sql` (déjà exécuté).
- Temps réel (optionnel) : exécuter `supabase_realtime.sql` (active Realtime sur calendrier/trombi/tombola/fusillades).
- Données de démo (optionnel) : `node scripts/seed-all.mjs` en local (utilise `.env.local`).
- Rattacher un compte Discord à un membre : via l'écran **Gestion des accès**, ou `node scripts/seed-member.mjs <discord_id> <pseudo> [grade] [nom]`.

## 5. Notes techniques

- `next.config.mjs` : `serverActions.bodySizeLimit = '10mb'` (les images transitent par les Server Actions ; elles sont aussi compressées côté navigateur avant envoi).
- Accès aux données : Server Components / Server Actions avec la **clé service-role** (jamais exposée au client) + contrôles de permission par grade. Le navigateur n'utilise l'anon key que pour l'auth et Realtime.
- Redéploiement : chaque `git push` sur `main` redéploie automatiquement.
