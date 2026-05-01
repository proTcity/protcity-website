const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? "https://www.protcity.com";

export const site = {
  name: "proTcity",
  title: "proTcity | Sicurezza urbana collaborativa",
  url: siteUrl,
  locale: "it_IT",
  language: "it",
  defaultDescription:
    "proTcity aiuta persone, Comuni e partner locali a leggere meglio la sicurezza urbana, segnalare situazioni critiche e muoversi con piu consapevolezza.",
  defaultOgImage: "/og-image.jpg",
  emails: {
    general: "hello@protcity.com",
    support: "support@protcity.com",
    business: "partners@protcity.com",
    press: "press@protcity.com",
    privacy: "privacy@protcity.com"
  },
  company: {
    legalName: "proTcity",
    country: "Italia",
    city: "Roma",
    vat: "Dati societari da completare"
  }
} as const;
