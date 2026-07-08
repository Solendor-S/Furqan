# Deploying Furqan (Cloudflare Pages)

Furqan is a static Vite build — no server. Cloudflare Pages serves it free
(unlimited bandwidth) and auto-redeploys on every push to `main`.

## One-time setup (you do this in the browser)

1. Sign in at <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git**.
2. Authorize GitHub and pick the **`Solendor-S/Furqan`** repo.
3. Build settings:
   | Field | Value |
   |-------|-------|
   | Production branch | `main` |
   | Framework preset | `Vite` (or None) |
   | **Root directory** | `Furqan` |
   | Build command | `npm run build` |
   | Build output directory | `dist` |

   The repo root is `QuranApp/`; the app lives in `Furqan/`, so the **root
   directory must be `Furqan`**. Node version is pinned by `Furqan/.nvmrc` (20) —
   Vite 8 needs Node ≥ 20.19.
4. **Save and Deploy.** You get a `https://<project>.pages.dev` URL. Every later
   `git push` to `main` redeploys automatically.

## What ships with the repo

- `public/_headers` — security headers (CSP, `X-Frame-Options`, no-referrer) +
  long cache on hashed assets. Cloudflare copies it from the build output.
- No SPA `_redirects` needed: navigation is in-page state, not URL routes.

## Custom domain (optional)

Pages project → **Custom domains** → add your domain and follow the DNS steps.
Cloudflare fronts it (hides the origin, absorbs DDoS) — worth having given the
content.

## Verify after first deploy

- Open the `.pages.dev` URL; toggle **+ Abū ʿAmr / + Ibn Kathīr** and confirm the
  Arabic fonts load (if a font 404s, the `/fonts/` path or `_headers` is wrong).
- DevTools console should be clean — a CSP error there means a header needs
  loosening in `public/_headers`.
