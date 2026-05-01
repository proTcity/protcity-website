export const primaryNavigation = [
  { label: "App", href: "/app" },
  { label: "WalkGuard", href: "/walkguard" },
  { label: "Citta", href: "/cities" },
  { label: "GuestSafe", href: "/guestsafe" },
  { label: "Tecnologia", href: "/technology" },
  { label: "Supporto", href: "/support" }
] as const;

export const footerGroups = [
  {
    title: "Prodotto",
    links: [
      { label: "App mobile", href: "/app" },
      { label: "WalkGuard", href: "/walkguard" },
      { label: "GuestSafe", href: "/guestsafe" },
      { label: "Tecnologia", href: "/technology" }
    ]
  },
  {
    title: "Istituzioni",
    links: [
      { label: "Citta e territori", href: "/cities" },
      { label: "Sicurezza", href: "/safety" },
      { label: "Contatti", href: "/contact" }
    ]
  },
  {
    title: "Assistenza",
    links: [
      { label: "Supporto", href: "/support" },
      { label: "Eliminazione dati", href: "/data-deletion" },
      { label: "Privacy", href: "/privacy" }
    ]
  },
  {
    title: "Legale",
    links: [
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Termini", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" }
    ]
  }
] as const;

export const legalNavigation = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Termini di utilizzo", href: "/terms" },
  { label: "Eliminazione dati", href: "/data-deletion" }
] as const;
