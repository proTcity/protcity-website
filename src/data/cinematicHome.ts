export type HomeLocale = "it" | "en";

export const cinematicHome = {
  it: {
    eyebrow: "LA TUA CITTÀ. UNA NUOVA PROSPETTIVA.",
    title: "La città cambia.",
    titleAccent: "Impara a leggerla.",
    lead: "Con proTcity, segnalazioni, percorsi e luoghi utili diventano informazioni per muoverti con più consapevolezza.",
    download: "Scarica l’app gratuita",
    explore: "Entra nella città",
    availability: "Disponibile per iPhone e Android",
    illustration: "Scenario illustrativo · città e segnali simulati",
    pause: "Pausa animazioni",
    resume: "Riprendi animazioni",
    heroLabels: ["Una segnalazione da conoscere", "Il tuo percorso, più chiaro", "Un punto utile, vicino a te"],
    heroKinds: ["SEGNALAZIONI", "WALKGUARD", "LUOGHI E SERVIZI"],
    sequence: ["Osserva", "Orientati", "Scopri"],
    intro: "DALLA CITTÀ AL TUO PROSSIMO PASSO",
    heading: "Non solo una mappa.",
    headingAccent: "Il contesto che ti serve.",
    description: "Esplora tre modi in cui proTcity ti aiuta a leggere il territorio. Scegli un passaggio e guarda come cambia la scena.",
    sceneLabel: "Esplorazione illustrativa di un quartiere urbano",
    sceneLoading: "Preparazione della città…",
    sceneFallback: "Esplora i tre passaggi nella versione illustrata.",
    sceneActivate: "Esplora la scena 3D",
    sceneHint: "Muovi il puntatore per cambiare prospettiva",
    stepsLabel: "Cosa puoi fare con proTcity",
    explanation: "Le immagini spiegano le funzioni: non mostrano dati live. Le informazioni nell’app dipendono dalle fonti disponibili e non garantiscono la sicurezza di un luogo o di un percorso.",
    steps: [
      { label: "Leggi i segnali", title: "Sai cosa è stato segnalato.", text: "Avvisi e segnalazioni aiutano a capire cosa succede in una zona. Consulta i dettagli e valuta il contesto prima di muoverti.", detail: "Segnalazioni e avvisi sulla mappa", color: "coral", link: "/app", action: "Scopri la mappa", icon: "signal" },
      { label: "Segui il percorso", title: "Il prossimo passo è più chiaro.", text: "Con WalkGuard visualizzi il tragitto, le indicazioni e i controlli rapidi. Puoi condividere lo spostamento con le persone che autorizzi.", detail: "Percorso illustrativo WalkGuard", color: "cyan", link: "/walkguard", action: "Scopri WalkGuard", icon: "route" },
      { label: "Scopri i luoghi", title: "Entri in una città, trovi un contesto.", text: "Eventi, servizi e punti utili collegano chi vive un territorio a chi lo visita. Anche le informazioni di enti e strutture diventano più facili da trovare.", detail: "Luoghi, eventi e informazioni locali", color: "mint", link: "/guestsafe", action: "Scopri GuestSafe", icon: "place" }
    ]
  },
  en: {
    eyebrow: "YOUR CITY. A NEW PERSPECTIVE.",
    title: "The city changes.",
    titleAccent: "Learn to read it.",
    lead: "With proTcity, local reports, walking routes and useful places become information to help you explore with more awareness.",
    download: "Get the free app",
    explore: "Step into the city",
    availability: "Available for iPhone and Android",
    illustration: "Illustrative scene · simulated city and signals",
    pause: "Pause animations",
    resume: "Resume animations",
    heroLabels: ["A local report to understand", "A clearer view of your route", "A useful place, nearby"],
    heroKinds: ["LOCAL REPORTS", "WALKGUARD", "PLACES & SERVICES"],
    sequence: ["Observe", "Navigate", "Discover"],
    intro: "FROM THE CITY TO YOUR NEXT STEP",
    heading: "More than a map.",
    headingAccent: "The context you need.",
    description: "Explore three ways proTcity helps you understand your surroundings. Choose a step and see how the scene changes.",
    sceneLabel: "Illustrative exploration of an urban neighbourhood",
    sceneLoading: "Preparing the city…",
    sceneFallback: "Explore the three steps in the illustrated view.",
    sceneActivate: "Explore the 3D scene",
    sceneHint: "Move your pointer to change perspective",
    stepsLabel: "What you can do with proTcity",
    explanation: "These visuals explain features and do not show live data. Information in the app depends on available sources and does not guarantee the safety of a place or route.",
    steps: [
      { label: "Read the signals", title: "Know what has been reported.", text: "Alerts and community reports help you understand a neighbourhood. Review the details and consider the context before you move.", detail: "Community reports and alerts on the map", color: "coral", link: "/en/download", action: "Explore the app", icon: "signal" },
      { label: "Follow your route", title: "A clearer next step.", text: "WalkGuard brings your route, directions and quick controls into view. You can share your journey with people you authorise.", detail: "Illustrative WalkGuard walking route", color: "cyan", link: "/en/download", action: "Get the app", icon: "route" },
      { label: "Discover places", title: "Arrive somewhere. Find your bearings.", text: "Events, services and useful places connect residents and visitors. Information from local organisations and accommodation becomes easier to find.", detail: "Places, events and local information", color: "mint", link: "/en/guestsafe", action: "Discover GuestSafe", icon: "place" }
    ]
  }
} as const;
