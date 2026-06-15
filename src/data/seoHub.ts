export type SeoHubPage = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  lead: string;
  intent: string;
  heroClass: string;
  image: string;
  imageAlt: string;
  stats: Array<{
    label: string;
    title: string;
    text: string;
  }>;
  sections: Array<{
    kicker: string;
    title: string;
    text: string;
    image: string;
    imageAlt: string;
    reverse?: boolean;
    bullets?: string[];
    metrics?: string[];
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const seoHubPath = "/sicurezza-urbana-intelligente";
export const seoResourceBasePath = "/risorse";

export const seoHubPages: SeoHubPage[] = [
  {
    slug: "sicurezza-urbana",
    eyebrow: "Sicurezza urbana",
    title: "Sicurezza urbana intelligente: segnali, dati e collaborazione locale",
    description:
      "Guida proTcity alla sicurezza urbana intelligente: segnalazioni, alert, Safety Score, AI responsabile e collaborazione tra cittadini, Comuni e partner locali.",
    lead:
      "La sicurezza urbana non vive in un solo dato. Nasce dall'incontro tra percezione, contesto, segnalazioni, orario, luoghi sicuri e risposta del territorio.",
    intent:
      "Per chi cerca informazioni su sicurezza urbana, smart city, prevenzione locale e strumenti digitali per leggere meglio una città.",
    heroClass: "feature-hero--seo-urban",
    image: "/images/app-real/optimized/walkguard6.png",
    imageAlt: "Schermata reale proTcity con mappa e strumenti di sicurezza urbana",
    stats: [
      {
        label: "Persone",
        title: "Più contesto prima di muoversi",
        text: "L'utente non riceve promesse assolute, ma indicazioni comprensibili su zone, percorsi e segnali vicini."
      },
      {
        label: "Territori",
        title: "Segnali più ordinati",
        text: "Le segnalazioni diventano categorie, priorità, stati e timeline leggibili per chi deve intervenire."
      },
      {
        label: "AI",
        title: "Prudenza e spiegabilità",
        text: "L'intelligenza artificiale aiuta a sintetizzare il contesto, con limiti chiari e tono non allarmistico."
      }
    ],
    sections: [
      {
        kicker: "Scenario",
        title: "La sicurezza urbana è una rete di segnali, non una classifica dei quartieri.",
        text:
          "Una città può essere percepita come sicura o insicura per motivi diversi: illuminazione, affollamento, orario, lavori, eventi, segnalazioni recenti o assenza di punti di riferimento. proTcity lavora su questa complessità per offrire una lettura più utile del contesto.",
        image: "/images/features/optimized/city-pulse.webp",
        imageAlt: "City Pulse proTcity con segnali urbani e alert locali",
        metrics: ["Contesto", "Zone", "Percorsi", "Segnalazioni"]
      },
      {
        kicker: "Collaborazione",
        title: "Cittadini, Comuni e partner vedono parti diverse dello stesso territorio.",
        text:
          "Il valore nasce quando questi segnali non restano frammentati. Le persone possono segnalare, la community può confermare, gli enti possono leggere pattern aggregati e i partner locali possono contribuire con punti utili e servizi sul territorio.",
        image: "/images/features/optimized/segnalazioni-enti.webp",
        imageAlt: "Dashboard proTcity per segnalazioni e presa in carico",
        reverse: true,
        bullets: [
          "Segnalazioni geolocalizzate con categoria e stato.",
          "Alert di zona pensati per essere pertinenti.",
          "Dati aggregati per ridurre rumore, bias e panico."
        ]
      }
    ],
    faqs: [
      {
        question: "proTcity garantisce la sicurezza di una zona?",
        answer:
          "No. proTcity non garantisce sicurezza assoluta e non sostituisce autorità o servizi di emergenza. Offre segnali e suggerimenti basati sui dati disponibili."
      },
      {
        question: "La sicurezza urbana intelligente usa dati personali?",
        answer:
          "Il principio è lavorare su aree, percorsi e segnali aggregati, non su profili personali o giudizi sulle persone."
      }
    ]
  },
  {
    slug: "app-sicurezza-personale",
    eyebrow: "App sicurezza personale",
    title: "App per sicurezza personale: orientamento, contatti fidati e supporto AI",
    description:
      "Come un'app per sicurezza personale può aiutare negli spostamenti urbani con WalkGuard, SOS, contatti fidati, alert e assistente AI.",
    lead:
      "Una buona app di sicurezza personale non deve spaventare l'utente. Deve ridurre incertezza, rendere più chiaro il contesto e semplificare le azioni nei momenti importanti.",
    intent:
      "Per chi cerca app sicurezza personale, app per muoversi sicuri, SOS, contatti fidati e strumenti digitali per spostamenti urbani.",
    heroClass: "feature-hero--seo-personal-app",
    image: "/images/app-real/optimized/sos.png",
    imageAlt: "Schermata reale della modalita SOS proTcity",
    stats: [
      {
        label: "Prima",
        title: "Capire il contesto",
        text: "La mappa e il Safety Score aiutano a leggere la zona prima di iniziare uno spostamento."
      },
      {
        label: "Durante",
        title: "Rimanere collegati",
        text: "WalkGuard, contatti fidati e check-in riducono la sensazione di isolamento."
      },
      {
        label: "Dopo",
        title: "Chiudere il percorso",
        text: "La conferma di arrivo e gli aggiornamenti rendono lo spostamento più tracciabile per l'utente."
      }
    ],
    sections: [
      {
        kicker: "Uso quotidiano",
        title: "La sicurezza personale in città è fatta di piccoli momenti.",
        text:
          "Un rientro serale, una zona nuova, una deviazione improvvisa o la necessità di avvisare qualcuno. proTcity mette queste funzioni nello stesso ecosistema, evitando di disperdere l'utente tra strumenti diversi.",
        image: "/images/features/optimized/rientro-sicuro.webp",
        imageAlt: "Rientro sicuro con proTcity e WalkGuard",
        metrics: ["WalkGuard", "SOS", "Check-in", "Alert"]
      },
      {
        kicker: "Supporto",
        title: "L'assistente AI aiuta a usare l'app, non decide al posto dell'utente.",
        text:
          "L'Help AI risponde sulle funzioni di proTcity, guida chi ha dubbi e può aprire un ticket quando il problema richiede supporto umano. Il tono resta pratico, chiaro e non allarmistico.",
        image: "/images/features/optimized/assistente-ai.webp",
        imageAlt: "Assistente AI proTcity dentro l'app",
        reverse: true,
        bullets: [
          "Risposte sulle funzioni disponibili nell'app.",
          "Apertura ticket quando serve assistenza umana.",
          "Storico degli aggiornamenti per seguire la richiesta."
        ]
      }
    ],
    faqs: [
      {
        question: "Un'app può sostituire i numeri di emergenza?",
        answer:
          "No. Un'app come proTcity può aiutare a orientarsi e comunicare, ma in emergenza bisogna usare sempre i canali ufficiali previsti dalla legge."
      },
      {
        question: "A cosa servono i contatti fidati?",
        answer:
          "Servono a rendere più semplice condividere posizione, percorso o richiesta di supporto con persone scelte dall'utente."
      }
    ]
  },
  {
    slug: "percorsi-sicuri",
    eyebrow: "Percorsi sicuri",
    title: "Percorsi sicuri a piedi: come WalkGuard aiuta a scegliere tragitti più prudenti",
    description:
      "Percorsi sicuri a piedi con proTcity WalkGuard: analisi del contesto, punti sicuri, alert di zona, contatti fidati e ricalcolo prudente.",
    lead:
      "Il percorso migliore non è sempre quello più breve. Orario, illuminazione, area, eventi e segnali recenti possono cambiare la scelta più prudente.",
    intent:
      "Per chi cerca percorsi sicuri, rientro sicuro, app per camminare in sicurezza e tragitti più prudenti in città.",
    heroClass: "feature-hero--seo-routes",
    image: "/images/app-real/optimized/walkguard5.png",
    imageAlt: "Schermata reale del timer WalkGuard e dei controlli di sicurezza",
    stats: [
      {
        label: "Route",
        title: "Il tragitto ha un contesto",
        text: "La distanza conta, ma contano anche esposizione, safe point, orario e segnali recenti."
      },
      {
        label: "Alert",
        title: "Avvisi vicini al percorso",
        text: "Gli avvisi devono essere pertinenti e comprensibili, non generare rumore inutile."
      },
      {
        label: "Scelta",
        title: "L'utente resta al centro",
        text: "proTcity può suggerire alternative, ma la decisione finale resta sempre alla persona."
      }
    ],
    sections: [
      {
        kicker: "WalkGuard",
        title: "Un tragitto più prudente nasce dalla combinazione di più segnali.",
        text:
          "WalkGuard considera ciò che accade intorno al percorso e lo traduce in indicazioni comprensibili. Non etichetta una strada come sicura o pericolosa in modo assoluto: aiuta a capire se esistono alternative più adatte al momento.",
        image: "/images/features/optimized/walkguard-ai-route.webp",
        imageAlt: "WalkGuard con analisi AI del percorso urbano",
        metrics: ["Orario", "Safe Points", "Segnali", "Ricalcolo"]
      },
      {
        kicker: "Rientro",
        title: "La conferma di arrivo chiude il flusso e riduce l'incertezza.",
        text:
          "Nei rientri serali o negli spostamenti in una zona nuova, sapere che il percorso è seguito dall'app e che i contatti fidati sono vicini può fare la differenza nella percezione di controllo.",
        image: "/images/features/optimized/rientro-sicuro.webp",
        imageAlt: "Rientro più sicuro con proTcity",
        reverse: true,
        bullets: [
          "Avvio rapido del percorso.",
          "Condivisione con contatti fidati.",
          "Check-in e conferma di arrivo."
        ]
      }
    ],
    faqs: [
      {
        question: "WalkGuard sceglie sempre la strada più sicura?",
        answer:
          "WalkGuard suggerisce tragitti più prudenti in base ai dati disponibili, ma non può garantire che una strada sia sicura in senso assoluto."
      },
      {
        question: "I percorsi sicuri sono utili anche ai turisti?",
        answer:
          "Sì, soprattutto quando una persona si muove in una città che non conosce e ha bisogno di contesto, punti utili e indicazioni più chiare."
      }
    ]
  },
  {
    slug: "segnalazioni-cittadini",
    eyebrow: "Segnalazioni cittadini",
    title: "Segnalazioni dei cittadini: dalla foto alla presa in carico",
    description:
      "Come proTcity organizza segnalazioni dei cittadini, conferme community, categorie, stati e timeline per rendere più leggibili i problemi urbani.",
    lead:
      "Una segnalazione utile non è solo un messaggio. Deve avere contesto, categoria, posizione, stato e un modo chiaro per seguirne l'evoluzione.",
    intent:
      "Per chi cerca app segnalazioni cittadini, segnalazioni al Comune, problemi urbani, degrado, illuminazione, sicurezza e presa in carico.",
    heroClass: "feature-hero--seo-reports",
    image: "/images/app-real/optimized/segnalazione.png",
    imageAlt: "Schermata reale di una segnalazione proTcity",
    stats: [
      {
        label: "Invio",
        title: "Contesto geolocalizzato",
        text: "Foto, posizione e categoria aiutano a rendere la segnalazione più comprensibile."
      },
      {
        label: "Community",
        title: "Conferme e qualità",
        text: "La community può rafforzare un segnale senza trasformarlo in rumore."
      },
      {
        label: "Stato",
        title: "Timeline leggibile",
        text: "L'utente può capire se una segnalazione è stata ricevuta, presa in carico o chiusa."
      }
    ],
    sections: [
      {
        kicker: "Workflow",
        title: "Le segnalazioni funzionano quando diventano processi, non solo post.",
        text:
          "proTcity separa le segnalazioni dai ticket di supporto, dalla moderazione e dal monitoraggio abusi. Questo evita confusione e permette a ogni flusso di avere regole, priorità e responsabilità diverse.",
        image: "/images/features/optimized/segnalazioni-enti.webp",
        imageAlt: "Dashboard Enti proTcity per segnalazioni territoriali",
        metrics: ["Categoria", "Posizione", "Priorità", "Stato"]
      },
      {
        kicker: "Responsabilità",
        title: "Una piattaforma civica deve proteggere persone e qualità delle informazioni.",
        text:
          "Le segnalazioni non devono diventare accuse verso persone identificabili. Il loro scopo è rendere più leggibile un problema urbano e favorire una risposta ordinata.",
        image: "/images/features/optimized/community-cane-smarrito.webp",
        imageAlt: "Community proTcity con segnalazioni locali geolocalizzate",
        reverse: true,
        bullets: [
          "Categorie chiare e linguaggio non accusatorio.",
          "Moderazione per contenuti sensibili o impropri.",
          "Stati di avanzamento comprensibili agli utenti."
        ]
      }
    ],
    faqs: [
      {
        question: "Le segnalazioni sostituiscono una denuncia?",
        answer:
          "No. Le segnalazioni proTcity aiutano a descrivere problemi urbani e contesto locale, ma non sostituiscono denunce o comunicazioni ufficiali alle autorità."
      },
      {
        question: "Che differenza c'è tra ticket e segnalazione?",
        answer:
          "La segnalazione riguarda il territorio. Il ticket nasce dall'Help AI quando un utente ha bisogno di assistenza sull'app o sul servizio."
      }
    ]
  },
  {
    slug: "sicurezza-comuni",
    eyebrow: "Sicurezza per Comuni",
    title: "Sicurezza urbana per Comuni: dati aggregati, segnalazioni e comunicazione locale",
    description:
      "proTcity per Comuni ed enti pubblici: segnalazioni urbane, dashboard, alert, dati aggregati e strumenti per leggere meglio il territorio.",
    lead:
      "Un Comune non ha bisogno di più rumore. Ha bisogno di segnali organizzati, stati chiari, priorità leggibili e comunicazioni utili ai cittadini.",
    intent:
      "Per amministratori, enti e territori che cercano strumenti digitali per sicurezza urbana, segnalazioni cittadini e smart city.",
    heroClass: "feature-hero--partner",
    image: "/images/features/optimized/partner-console.webp",
    imageAlt: "Console proTcity per partner ed enti pubblici",
    stats: [
      {
        label: "Ascolto",
        title: "Segnali dal territorio",
        text: "Le segnalazioni diventano una base ordinata per leggere ricorrenze e priorità."
      },
      {
        label: "Dashboard",
        title: "Stati e competenze",
        text: "Ogni flusso può essere seguito da ruoli diversi, senza confondere utenti, enti e partner."
      },
      {
        label: "Fiducia",
        title: "Comunicazione trasparente",
        text: "Timeline e stati visibili aiutano a mostrare che una richiesta non è sparita nel vuoto."
      }
    ],
    sections: [
      {
        kicker: "Enti",
        title: "La sicurezza urbana digitale deve aiutare le decisioni, non sostituirle.",
        text:
          "proTcity può offrire ai Comuni una lettura più ordinata delle segnalazioni e del contesto urbano. I dati aggregati servono come supporto operativo, mantenendo chiari limiti, responsabilità e canali ufficiali.",
        image: "/images/features/optimized/segnalazioni-enti.webp",
        imageAlt: "Segnalazioni per Enti e Comuni in proTcity",
        metrics: ["Segnalazioni", "Priorità", "Timeline", "Report"]
      },
      {
        kicker: "Territorio",
        title: "Dalla percezione individuale a una mappa più leggibile.",
        text:
          "Quando più segnali convergono nello stesso punto, un'amministrazione può capire meglio dove intervenire, cosa comunicare e quali aree richiedono attenzione.",
        image: "/images/features/optimized/citta-si-accende.webp",
        imageAlt: "proTcity rende più leggibile il territorio urbano",
        reverse: true,
        bullets: [
          "Lettura aggregata, non sorveglianza individuale.",
          "Ruoli e permessi separati per operatori diversi.",
          "Comunicazioni locali con tono chiaro e misurato."
        ]
      }
    ],
    faqs: [
      {
        question: "proTcity è pensata anche per enti pubblici?",
        answer:
          "Sì. La piattaforma prevede flussi per Comuni, enti e territori, separati dai partner commerciali e dai ticket di supporto."
      },
      {
        question: "I dati aggregati possono etichettare un quartiere?",
        answer:
          "No. L'obiettivo è supportare letture operative e prudenti, non creare giudizi definitivi su aree o comunità."
      }
    ]
  },
  {
    slug: "sicurezza-turisti",
    eyebrow: "Sicurezza turisti",
    title: "Sicurezza per turisti: orientarsi meglio in una città nuova",
    description:
      "proTcity aiuta turisti e visitatori con percorsi prudenti, punti utili, alert locali, GuestSafe e supporto multilingua.",
    lead:
      "Chi visita una città non conosce abitudini, zone, percorsi e riferimenti locali. La sicurezza percepita nasce spesso dalla qualità delle informazioni disponibili.",
    intent:
      "Per chi cerca sicurezza turisti, app per viaggiatori, città sicure, rientro in hotel e orientamento urbano.",
    heroClass: "feature-hero--guestsafe",
    image: "/images/features/optimized/tourist-safe-mode.webp",
    imageAlt: "Tourist Safe Mode proTcity per visitatori e turisti",
    stats: [
      {
        label: "Arrivo",
        title: "Capire dove ci si trova",
        text: "La mappa aiuta a individuare punti utili, aree e servizi vicini."
      },
      {
        label: "Spostamento",
        title: "Percorsi più prudenti",
        text: "WalkGuard può aiutare nei rientri a piedi e nelle zone meno conosciute."
      },
      {
        label: "Hotel",
        title: "GuestSafe",
        text: "Le strutture ricettive possono offrire un livello aggiuntivo di orientamento e supporto."
      }
    ],
    sections: [
      {
        kicker: "Visitatori",
        title: "Una città nuova richiede indicazioni semplici, non messaggi allarmistici.",
        text:
          "proTcity punta a dare contesto: dove sono, cosa ho intorno, quali punti possono essermi utili, come torno in hotel, quali alert sono davvero vicini e pertinenti.",
        image: "/images/features/optimized/ovunque-tu-sia.webp",
        imageAlt: "proTcity accompagna utenti e turisti in città diverse",
        metrics: ["Mappa", "Safe Points", "Alert", "Rientro"]
      },
      {
        kicker: "GuestSafe",
        title: "Hotel e strutture ricettive possono diventare punti di orientamento urbano.",
        text:
          "GuestSafe collega ospitalità e sicurezza urbana in modo pratico: informazioni locali, percorsi più prudenti, punti utili e comunicazioni dedicate agli ospiti.",
        image: "/images/features/optimized/guest-safe-hotel.webp",
        imageAlt: "GuestSafe proTcity per hotel e ospiti",
        reverse: true,
        bullets: [
          "Esperienza pensata per chi non conosce la città.",
          "Percorsi e punti utili vicini alla struttura.",
          "Comunicazione più chiara tra ospite, hotel e territorio."
        ]
      }
    ],
    faqs: [
      {
        question: "proTcity è utile anche fuori dalla propria città?",
        answer:
          "Sì. Il modello è pensato per accompagnare utenti e turisti in città diverse, quando sono disponibili dati e servizi locali."
      },
      {
        question: "GuestSafe è solo per hotel?",
        answer:
          "GuestSafe nasce per hotel e hospitality, ma il concetto può essere utile anche per strutture ricettive e reti locali."
      }
    ]
  },
  {
    slug: "sicurezza-hotel",
    eyebrow: "Sicurezza hotel",
    title: "Sicurezza per hotel e ospiti: GuestSafe, percorsi e informazioni locali",
    description:
      "GuestSafe porta proTcity nell'hospitality: sicurezza per hotel, ospiti, turisti, percorsi prudenti, punti utili e comunicazioni locali.",
    lead:
      "Per una struttura ricettiva, la sicurezza dell'ospite non è solo emergenza. È orientamento, fiducia, informazione locale e capacità di accompagnare chi non conosce il territorio.",
    intent:
      "Per hotel, B&B e strutture che cercano strumenti digitali per sicurezza ospiti, turismo, hospitality e informazioni locali.",
    heroClass: "feature-hero--guestsafe",
    image: "/images/features/optimized/guest-safe-hotel.webp",
    imageAlt: "GuestSafe proTcity per hotel, ospiti e strutture ricettive",
    stats: [
      {
        label: "Ospite",
        title: "Meno domande critiche",
        text: "L'app può aiutare l'ospite a orientarsi con più autonomia."
      },
      {
        label: "Struttura",
        title: "Valore percepito",
        text: "GuestSafe aggiunge un servizio digitale utile e coerente con l'esperienza di accoglienza."
      },
      {
        label: "Territorio",
        title: "Rete locale",
        text: "Safe Points, partner e informazioni locali rendono la città più leggibile."
      }
    ],
    sections: [
      {
        kicker: "Hospitality",
        title: "Un ospite informato vive meglio la città e chiede aiuto prima.",
        text:
          "GuestSafe può trasformare informazioni sparse in un'esperienza più ordinata: rientro in struttura, punti utili, avvisi di zona, contatti e supporto dentro l'ecosistema proTcity.",
        image: "/images/features/optimized/guest-safe-hotel.webp",
        imageAlt: "Esperienza GuestSafe per hotel e turisti",
        metrics: ["Hotel", "Ospiti", "Percorsi", "Safe Points"]
      },
      {
        kicker: "Servizio",
        title: "La sicurezza diventa parte dell'accoglienza, non una pagina nascosta.",
        text:
          "L'obiettivo è dare all'ospite strumenti immediati senza sovraccaricarlo: indicazioni chiare, funzioni essenziali e comunicazioni pertinenti.",
        image: "/images/features/optimized/tourist-safe-mode.webp",
        imageAlt: "Modalità turisti proTcity per città nuove",
        reverse: true,
        bullets: [
          "Informazioni locali accessibili dall'app.",
          "Percorsi prudenti per il rientro.",
          "Possibile integrazione con partner e servizi vicini."
        ]
      }
    ],
    faqs: [
      {
        question: "GuestSafe sostituisce le procedure dell'hotel?",
        answer:
          "No. GuestSafe è uno strumento digitale aggiuntivo che può affiancare informazioni, procedure e personale della struttura."
      },
      {
        question: "Gli ospiti devono conoscere proTcity prima del viaggio?",
        answer:
          "No. L'esperienza è pensata per essere comprensibile anche a chi scopre il servizio durante il soggiorno."
      }
    ]
  },
  {
    slug: "ai-sicurezza-urbana",
    eyebrow: "AI sicurezza urbana",
    title: "AI per sicurezza urbana: spiegazioni prudenti, dati aggregati e limiti chiari",
    description:
      "Come proTcity usa AI, Safety Score e dati aggregati per supportare la sicurezza urbana senza profilazione personale e senza allarmismo.",
    lead:
      "L'AI nella sicurezza urbana deve essere spiegabile, prudente e limitata. Il suo compito non è giudicare persone, ma aiutare a leggere segnali e contesto.",
    intent:
      "Per chi cerca AI sicurezza urbana, intelligenza artificiale smart city, Safety Score, privacy e dati aggregati.",
    heroClass: "feature-hero--technology",
    image: "/images/features/optimized/ia-predittiva.webp",
    imageAlt: "AI predittiva proTcity per analisi prudente del contesto urbano",
    stats: [
      {
        label: "Spiegabilità",
        title: "Ogni suggerimento deve avere un motivo",
        text: "L'utente deve capire perché l'app consiglia attenzione o un'alternativa."
      },
      {
        label: "Privacy",
        title: "Aree e percorsi, non profili",
        text: "Il modello lavora sul contesto urbano e sui segnali disponibili."
      },
      {
        label: "Fallback",
        title: "Funzioni utili anche senza AI",
        text: "Le parti essenziali dell'app devono restare comprensibili anche quando una fonte non risponde."
      }
    ],
    sections: [
      {
        kicker: "Safety Intelligence",
        title: "L'AI non deve predire il crimine. Deve aiutare a interpretare il contesto.",
        text:
          "proTcity usa l'AI per rendere più leggibili segnali, percorsi e alert. Le risposte devono essere caute, spiegabili e progettate per non generare panico o discriminazioni.",
        image: "/images/features/optimized/ia-predittiva.webp",
        imageAlt: "Motore AI proTcity per Safety Intelligence",
        metrics: ["Confidence", "Spiegazioni", "Fallback", "Privacy"]
      },
      {
        kicker: "Limiti",
        title: "La parte intelligente deve dichiarare cosa sa e cosa non sa.",
        text:
          "Un sistema serio non trasforma dati incompleti in certezze. Per questo proTcity lavora con Confidence Score, messaggi misurati e fallback statici quando il contesto non è sufficiente.",
        image: "/images/features/optimized/safety-score.webp",
        imageAlt: "Safety Score proTcity con indicatore sintetico",
        reverse: true,
        bullets: [
          "Nessuna promessa di sicurezza assoluta.",
          "Nessuna profilazione di persone o gruppi.",
          "Output pensati per essere spiegabili e verificabili."
        ]
      }
    ],
    faqs: [
      {
        question: "proTcity usa l'AI per prevedere crimini?",
        answer:
          "No. proTcity non deve prevedere crimini né accusare persone. Usa l'AI per sintetizzare segnali urbani e suggerire prudenza quando il contesto lo richiede."
      },
      {
        question: "Che cos'è il Safety Score?",
        answer:
          "È un indicatore sintetico sul contesto di un'area o di un percorso, utile solo se accompagnato da spiegazioni e limiti chiari."
      }
    ]
  }
];

export function getSeoResourcePath(slug: string) {
  return `${seoResourceBasePath}/${slug}`;
}
