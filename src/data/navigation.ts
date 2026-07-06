export const primaryNavigation = [
  { label: "App", href: "/app" },
  { label: "Download", href: "/download" },
  { label: "WalkGuard", href: "/walkguard" },
  { label: "Citta", href: "/cities" },
  { label: "GuestSafe", href: "/guestsafe" },
  { label: "Partner", href: "/partner" },
  { label: "Tecnologia", href: "/technology" },
  { label: "Sicurezza", href: "/sicurezza-urbana-intelligente" },
  { label: "Supporto", href: "/support" }
] as const;

export const legalNavigation = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Geolocation Policy", href: "/geolocation-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Termini di utilizzo", href: "/terms" },
  { label: "Community Guidelines", href: "/community-guidelines" },
  { label: "Child Safety Standards", href: "/child-safety-standards" },
  { label: "Eliminazione dati", href: "/account-deletion" }
] as const;

export const footerGroups = [
  {
    title: "Prodotto",
    links: [
      { label: "App mobile", href: "/app" },
      { label: "Download", href: "/download" },
      { label: "WalkGuard", href: "/walkguard" },
      { label: "GuestSafe", href: "/guestsafe" },
      { label: "Diventa Partner", href: "/partner" },
      { label: "Tecnologia", href: "/technology" }
    ]
  },
  {
    title: "Istituzioni",
    links: [
      { label: "Citta e territori", href: "/cities" },
      { label: "Sicurezza urbana intelligente", href: "/sicurezza-urbana-intelligente" },
      { label: "Sicurezza", href: "/safety" },
      { label: "Contatti", href: "/contact" }
    ]
  },
  {
    title: "Assistenza",
    links: [
      { label: "Supporto", href: "/support" },
      { label: "Eliminazione dati", href: "/account-deletion" },
      { label: "Privacy", href: "/privacy" }
    ]
  },
  {
    title: "Legale",
    links: legalNavigation
  }
] as const;
