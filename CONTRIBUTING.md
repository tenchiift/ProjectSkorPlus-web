# Contributing to SkorPlus

Thanks for your interest in contributing! This project is a student study companion web app (React + Vite + Supabase).

## Quick setup

```bash
npm install
cp .env.example .env   # then fill in your keys (never commit .env)
npm run dev
```

You need a Supabase project with the migrations in `supabase/` applied (see README → Database).

## Branches & commits

- Branch from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`
- Keep PRs small and focused — one feature/fix per PR
- Commit messages: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:` prefix (e.g. `feat: add streak badge`)

## Pull requests

1. `npm run build` must pass locally before you push
2. Fill in the PR template (what changed, how to test, screenshots for UI changes)
3. One reviewer approval required for `main`

## Code style

- React 19 + CSS Modules with theme-aware variables (`src/styles/theme.css`)
- Icons via `lucide-react` — do not add raw SVG icon files, use the library
- No secrets in code — AI keys live in server-side `api/` functions only
- Do not commit: `node_modules/`, `dist/`, `.env`, local reference folders (see `.gitignore`)

## Reporting bugs

Use the Bug Report issue template and include: route/URL, steps to reproduce, expected vs actual, browser + screenshots.
