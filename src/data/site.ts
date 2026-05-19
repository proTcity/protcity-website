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
    general: "info@protcity.com",
    support: "support@protcity.com",
    business: "partners@protcity.com",
    press: "press@protcity.com",
    privacy: "info@protcity.com"
  },
  company: {
    legalName: "Kurbi Labs srls",
    street: "Via Sassotello, n. 47",
    postalCode: "03010",
    country: "Italia",
    city: "Trivigliano (FR)",
    phone: "+39 329 93 99 838",
    phoneHref: "+393299399838",
    vat: "03342090606",
    rea: "FR - 336362"
  }
} as const;

export const companyInfo = {
  name: site.company.legalName,
  address: `${site.company.street}, ${site.company.postalCode} ${site.company.city}, ${site.company.country}`,
  phone: site.company.phone,
  phoneHref: site.company.phoneHref,
  vat: site.company.vat,
  rea: site.company.rea
} as const;

export const contactEmails = {
  general: site.emails.general,
  support: site.emails.support,
  privacy: site.emails.privacy,
  partners: site.emails.business,
  press: site.emails.press
} as const;
