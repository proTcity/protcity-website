# Deployment

Questa guida copre il flusso consigliato per pubblicare il sito proTcity con GitHub e Cloudflare Pages.

## 1. GitHub

Il repository locale è già inizializzato nella cartella:

```bash
cd ~/Developer/protcity-website
```

Il remote previsto è:

```bash
https://github.com/proTcity/protcity-website.git
```

Creare su GitHub un nuovo repository vuoto con queste impostazioni:

- Owner: `proTcity`
- Repository name: `protcity-website`
- Visibility: privata o pubblica, a scelta del team
- README: non aggiungere, esiste già nel progetto
- .gitignore: non aggiungere, esiste già nel progetto
- License: non aggiungere in questa fase

Poi pubblicare il commit iniziale:

```bash
git push -u origin main
```

## 2. Cloudflare Pages

In Cloudflare Pages creare un nuovo progetto collegato al repository GitHub `proTcity/protcity-website`.

Configurazione build:

- Framework preset: `Astro`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: lasciare vuoto

Variabili ambiente consigliate:

```text
NODE_VERSION=22.12.0
PUBLIC_SITE_URL=https://www.protcity.com
```

## 3. Dominio

Quando il progetto Pages è online:

1. Collegare `www.protcity.com` come custom domain.
2. Impostare il dominio canonico in `PUBLIC_SITE_URL`.
3. Aggiornare `public/robots.txt` e `public/sitemap.xml` se il dominio finale cambia.
4. Verificare anteprime social con `public/og-image.jpg`.

## 4. Verifiche prima della pubblicazione

```bash
npm audit --audit-level=moderate
npm run build
```

Controllare inoltre:

- testi legali validati;
- dati societari aggiornati in `src/data/site.ts`;
- email reali attive;
- immagini definitive per hero e Open Graph;
- dominio e redirect `www`/apex.
