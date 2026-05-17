export const legalMeta = {
  lastUpdated: "17 maggio 2026",
  disclaimer:
    "Queste pagine sono predisposte in base alle funzioni attuali e tecnicamente previste di proTcity. Non sostituiscono la verifica finale di un consulente privacy, legale o DPO prima della pubblicazione definitiva."
} as const;

export const legalCards = [
  {
    title: "Privacy Policy",
    href: "/privacy",
    description: "Come proTcity raccoglie, usa e protegge i dati personali."
  },
  {
    title: "Cookie Policy",
    href: "/cookie-policy",
    description: "Uso di cookie tecnici, preferenze e strumenti di misurazione."
  },
  {
    title: "Termini di utilizzo",
    href: "/terms",
    description: "Regole di accesso, responsabilita e uso corretto dei servizi."
  },
  {
    title: "Eliminazione dati",
    href: "/data-deletion",
    description: "Procedura per richiedere la cancellazione di account e dati collegati."
  }
] as const;
