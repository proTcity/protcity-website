# Rilascio home cinematografica — 15 settembre 2026

## 1. Esito
Home italiana https://www.protcity.com/ e inglese https://www.protcity.com/en/ pubblicate e verificate.
Commit applicativo: `6688b5813f67730f638a8776717f51c16857693b`.
Worker Cloudflare `protcity-website`, account `47e82e07c982373e5d7f6a428b46abea`.
Versione pubblicata: `958f194b-679f-4c7c-912b-e1d9419c207f`.
CI: https://github.com/proTcity/protcity-website/actions/runs/35023888269 — completata con successo.

## 2. Analisi iniziale
La home italiana montava due scene LivingCityExperience con edifici schematici e un lungo percorso legato allo scroll. La home inglese aveva una composizione separata. La nuova presentazione rende leggibili tre concetti: segnalazioni territoriali, percorso WalkGuard, luoghi e servizi.

Istruzioni applicate: `/Users/gianfilipposcirerisichella/Developer/ProtCityApp/ProtCity/AGENTS.md`, letto integralmente; nessun AGENTS più vicino nel repository del sito. Rischio medio per interazione e rendering web. Skill imagegen e Cloudflare Wrangler utilizzate. Pubblicazione autorizzata esplicitamente dal proprietario.

## 3. Modifiche
Apertura con città fotorealistica illustrativa, profondità atmosferica, movimento lento della camera e annotazioni. Quartiere 3D separato con facciate originali, dettagli architettonici, luci, prospettive e tre passaggi selezionabili. Pausa, gestione del movimento ridotto, sospensione fuori vista e caricamento progressivo. Sui piccoli schermi la scena 3D si attiva su richiesta. In caso di WebGL non disponibile rimangono immagine, testi e comandi. Contenuti condivisi e tradotti in italiano e inglese.

## 4. File interessati
Repository: `/Users/gianfilipposcirerisichella/Developer/protcity-website`. Percorsi relativi a questa radice:
- `src/pages/index.astro`, `src/pages/en/index.astro`: composizione home.
- `src/components/home/CinematicHero.astro`, `cinematic-home.css`: apertura e layout responsive.
- `src/components/home/CinematicCityStory.tsx`: passaggi, caricamento e fallback.
- `src/components/home/CinematicUrbanScene.tsx`, `urban-scene-model.ts`: quartiere e rendering.
- `src/data/cinematicHome.ts`: testi nelle due lingue.
- `src/scripts/city-hero.ts`: ciclo delle animazioni.
- `public/images/home/city-evening-{960,1672}.{avif,webp}`, `public/images/home/facade-stone.webp`: immagini originali ottimizzate.
- `tests/city-hero-motion.test.mjs`, `tests/urban-scene-model.test.mjs`: sette controlli nuovi.
- `docs/CINEMATIC_HOME_EXECPLAN.md`, questo documento: piano e prove.

## 5. Sicurezza e privacy
Nessuna modifica a mobile iOS/Android, Firebase, API, autorizzazioni, D1, candidature, segreti o configurazione Cloudflare. Nessuna query a dati personali di produzione, invio di push o email di prova. Asset sintetici; nessuna geolocalizzazione richiesta. Le scene sono dichiarate illustrative e non promettono sicurezza garantita. Binding e variabili del Worker conservati.

## 6. Verifiche eseguite
- `npm run build`: typecheck Astro, 0 errori/0 warning del checker, 43 pagine generate.
- `npm test`: 82/82 superati; CI remota verde sul commit applicativo.
- `git diff --check` e controllo del diff in stage: superati.
- `./node_modules/.bin/wrangler deploy --dry-run`: superato.
- `./node_modules/.bin/wrangler deploy --keep-vars --message ...`: completato sui domini esistenti.
- Revisione indipendente: corretti namespace CSS, contrasto inglese e fallback di inizializzazione WebGL; nessun P1/P2 residuo individuato.
- Browser su build di produzione: 320px/390px tramite iframe locale e viewport desktop ordinario; nessun overflow orizzontale verificato, menu, tre passaggi, collegamenti, pausa e attivazione 3D mobile funzionanti.
- WebGL assente simulato localmente: fallback funzionante e comandi disponibili. Preferenza JS di movimento ridotto simulata: animazione ferma e attivazione 3D esplicita; regole CSS e test dedicati verificati.
- Dopo deploy: home IT/EN aggiornate; canvas italiano effettivamente renderizzato, nessun errore console nella sessione live; cambio del passaggio inglese verificato.
- HTTP pubblico: redirect apex verso www corretto; asset facciata e pagina partner-network restituiscono 200.

## 7. Verifiche non eseguite
Nessuna certificazione su dispositivi fisici iOS/Android o su tutte le GPU/browser. Non eseguiti benchmark FPS/Core Web Vitals o test con preferenza di accessibilità impostata nel sistema operativo. Nessun invio di candidature o comunicazioni di produzione: fuori dallo scopo.

## 8. Compatibilità e regressioni
Dipendenze e lockfile invariati. Contratti server e client mobile invariati. Navigazione, store, pagine Studio/GuestSafe e candidature conservate. Le scene preesistenti di altre pagine non sono state riscritte. Integrati prima del rilascio gli aggiornamenti Observatory già presenti su origin/main (`c96e43d`).

## 9. Limiti e rischi residui
La resa è cinematografica per il web: non è un filmato 8K né una scansione di una città reale. Immagine originale 1672×941, facciata 1024×1536; nessun finto upscale o dichiarazione di risoluzione superiore. Qualità e fluidità del 3D dipendono dal dispositivo. Resta l'avviso Vite sulla dimensione del chunk Three/R3F, caricato in modo differito.

Un'esecuzione locale ha rilevato un flake preesistente in `tests/partner-admin.test.mjs:32`: il timestamp futuro +61s può diventare +60s fra più await e risultare correttamente accettato. Prova separata: stessa firma 401 a T e 200 a T+1. Test isolati 14/14, suite successiva 82/82 e CI remota superati senza modificare backend o test.

## 10. Rollback
Versione Cloudflare precedente verificata: `ec3e9b35-f1b4-4757-b778-6d2ae4b1cdf2`.
Se si rilevano route rotte, errori di rendering non gestiti o layout illeggibile, ripristinare questa versione dal deployment history del Worker `protcity-website`. Per rendere permanente il ripristino nelle future pubblicazioni, revertire il solo commit applicativo `6688b5813f67730f638a8776717f51c16857693b`, rieseguire build/test e pubblicare. Nessuna migrazione dati da invertire.

## Provenienza visiva
Generazione originale con imagegen. Originali di lavorazione:
- `/Users/gianfilipposcirerisichella/.codex/generated_images/01a0709b-5698-78a2-bac8-d572bfcf8fde/exec-5c7df0e9-8758-447c-a938-b489610389ac.png`
- `/Users/gianfilipposcirerisichella/.codex/generated_images/01a0709b-5698-78a2-bac8-d572bfcf8fde/exec-c491d2bb-e1a0-4146-b0dd-3f381f06937f.png`

Prompt dell'apertura:
> Use case: photorealistic-natural. Asset type: cinematic full-bleed homepage background for proTcity, an Italian urban information app. Generate one ultra-photorealistic architectural city photograph, widescreen 16:9, highest useful resolution. Camera: elevated aerial drone view just above rooftops, 35mm architectural lens looking down a long diagonal boulevard into deep perspective, not a top-down map or miniature. A believable contemporary European/Italian city at blue hour immediately after sunset: detailed 5-8 storey stone and warm plaster apartment buildings with individual windows, shutters, balconies, terracotta roofs and weathered cornices; a few refined glass office towers in the distant right skyline. Shops glow softly at street level. Warm apartment windows, restrained white headlights on dark slightly reflective roads, lush street trees, a small planted piazza in the right lower middle. Architecture crisp with real materials, layered distance and atmospheric haze, warm amber practical lights against cool slate-blue sky and natural navy shadows. Composition: broad city panorama across frame, main architectural detail and boulevard vanishing point in center-right at x70%; left third remains naturally darker, less busy, suitable for white website headline, but is still real architecture rather than blank black. Foreground buildings in bottom-right visibly detailed, midground streets readable, distant skyline fading into blue atmospheric depth. Sophisticated cinematic grading, physically plausible exposure, premium large-format architectural photography, immersive real city scale. NO text, NO logos, NO graphic overlays or light trails in sky, NO holograms, NO neon cyberpunk, NO glowing building outlines, NO blocks or low-poly buildings, NO isometric toy city, NO tilt-shift blur, NO fantasy monuments, no dramatic disaster scene. Entire image should be realistic and calm, inviting exploration. Synthetic illustrative city, not identified as an actual named place.

Brief della facciata: prospetto ortogonale frontale di edificio italiano ottocentesco, pietra e intonaco realistici, quattro colonne di finestre, persiane, balconi, infissi e negozi; luce uniforme dell'ora blu, nessun cielo, persone o testo. Il risultato ha quattro piani residenziali e piano commerciale; geometria adattata al risultato. Ottimizzazione AVIF/WebP e dimensioni responsive senza nuove dipendenze.
