export const legalMeta = {
  lastUpdated: "19 maggio 2026",
  disclaimer:
    "Queste pagine sono mantenute allineate alle funzioni effettive di proTcity, ai fornitori attivi e agli aggiornamenti normativi. In caso di modifiche sostanziali il testo viene aggiornato e comunicato con modalita proporzionate."
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
    href: "/account-deletion",
    description: "Procedura per richiedere la cancellazione di account e dati collegati."
  }
] as const;
