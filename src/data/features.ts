export const homeStats = [
  { value: "24/7", label: "Presidio digitale pensato per la mobilita quotidiana" },
  { value: "3", label: "Pubblici principali: utenti, Comuni e hospitality" },
  { value: "AI", label: "Supporto alla lettura del contesto urbano, con supervisione umana" }
] as const;

export const coreFeatures = [
  {
    title: "Segnalazioni urbane",
    description:
      "Gli utenti possono condividere alert geolocalizzati, prove e contesto utile per aiutare la comunita a muoversi meglio.",
    tone: "red"
  },
  {
    title: "WalkGuard",
    description:
      "Un accompagnamento digitale per percorsi a piedi, con contatti fidati, check-in e strumenti rapidi in caso di necessita.",
    tone: "blue"
  },
  {
    title: "Safety Score",
    description:
      "Una lettura sintetica e trasparente del rischio urbano, pensata per orientare decisioni e non per sostituire le autorita.",
    tone: "mint"
  },
  {
    title: "GuestSafe",
    description:
      "Un canale B2B per hotel, residence e strutture ricettive che vogliono offrire informazioni di sicurezza ai propri ospiti.",
    tone: "amber"
  }
] as const;

export const productPillars = [
  {
    title: "Per le persone",
    text: "Strumenti semplici per orientarsi, chiedere aiuto e restare connessi con persone fidate."
  },
  {
    title: "Per i Comuni",
    text: "Insight aggregati e una narrativa piu chiara delle criticita sul territorio."
  },
  {
    title: "Per hotel e partner",
    text: "Informazioni operative per accogliere ospiti e visitatori con maggiore consapevolezza."
  }
] as const;

export const appCapabilities = [
  "Mappa con alert, filtri e contesto territoriale",
  "Percorsi e check-in con contatti fidati",
  "Strumenti SOS, audio di sicurezza e raccolta prove",
  "Modalita pensate per turismo, community e vita quotidiana"
] as const;

export const walkguardSteps = [
  {
    title: "Scegli il percorso",
    text: "La persona imposta il tragitto e decide quali contatti possono seguirne l'avanzamento."
  },
  {
    title: "Resta visibile ai fidati",
    text: "Check-in, stato del percorso e segnali rapidi aiutano a non restare soli nelle situazioni delicate."
  },
  {
    title: "Agisci rapidamente",
    text: "In caso di disagio, l'app concentra strumenti utili: SOS, prove, audio e condivisione posizione."
  }
] as const;

export const cityBenefits = [
  "Canale ordinato per raccogliere segnali ricorrenti dal territorio",
  "Quadro aggregato per individuare zone, fasce orarie e pattern",
  "Comunicazione piu chiara con cittadini, visitatori e operatori locali"
] as const;

export const guestsafeBenefits = [
  "Informazioni di sicurezza localizzate per ospiti e turisti",
  "Materiali digitali per reception, camere e comunicazioni pre-arrivo",
  "Dashboard e reportistica pensate per strutture e network hospitality"
] as const;

export const supportTopics = [
  {
    title: "Account e accesso",
    text: "Aiuto per registrazione, login, modifica dati e gestione dell'account."
  },
  {
    title: "Sicurezza personale",
    text: "Indicazioni sull'uso corretto di SOS, WalkGuard, contatti fidati e raccolta prove."
  },
  {
    title: "Segnalazioni",
    text: "Supporto per alert, moderazione, contenuti sensibili e richieste di revisione."
  },
  {
    title: "Partner",
    text: "Canale dedicato a Comuni, hotel, enti territoriali, stampa e collaborazioni."
  }
] as const;
