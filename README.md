# proTcity Website

Sito istituzionale proTcity costruito con Astro, pensato per Cloudflare Pages e pubblicazione tramite GitHub.

## Stack

- Astro
- TypeScript strict
- Cloudflare Pages
- GitHub repository dedicato

## Struttura

```text
public/
src/
  pages/
  layouts/
  components/
  data/
  styles/
  utils/
```

Le rotte sono generate dai file in `src/pages`. Per esempio `src/pages/privacy.astro` diventa `/privacy`.

## Comandi

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Cloudflare Pages

Impostazioni consigliate:

- Framework preset: `Astro`
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Environment variable: `NODE_VERSION=22.12.0`

Per cambiare dominio canonico e URL SEO, impostare:

```bash
PUBLIC_SITE_URL=https://www.protcity.com
```

## GitHub

Questo progetto deve restare separato dall'app mobile. La cartella corretta è:

```text
~/Developer/protcity-website
```

Il repository GitHub va creato e collegato da questa cartella, non dalla cartella dell'app.

Il progetto include una GitHub Action in `.github/workflows/ci.yml` che esegue `npm ci` e `npm run build` su push e pull request.

Guida dettagliata: `docs/deployment.md`.

## Cloudflare Workers Static Assets

Se Cloudflare propone il nuovo flusso "Crea un Worker", il progetto include anche `wrangler.jsonc`.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

## Note editoriali

Le pagine legali sono bozze operative e devono essere validate prima della pubblicazione definitiva.
