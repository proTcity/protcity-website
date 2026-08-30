export const languageRoutes = [
  { it: "/", en: "/en" },
  { it: "/download", en: "/en/download" },
  { it: "/partner", en: "/en/partner" },
  { it: "/guestsafe", en: "/en/guestsafe" },
  { it: "/contact", en: "/en/contact" }
] as const;

export function languagePair(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return languageRoutes.find((route) => route.it === path || route.en === path);
}

export const englishNavigation = [
  { label: "App", href: "/en" },
  { label: "Download", href: "/en/download" },
  { label: "Studio", href: "/en/partner" },
  { label: "GuestSafe", href: "/en/guestsafe" }
];

export const englishFooterGroups = [
  { title: "Product", links: [...englishNavigation, { label: "Contact & support", href: "/en/contact" }] },
  { title: "Explore in Italian", links: [
    { label: "WalkGuard (Italian)", href: "/walkguard" },
    { label: "Cities (Italian)", href: "/cities" },
    { label: "Urban observatory (Italian)", href: "/osservatorio" },
    { label: "Technology (Italian)", href: "/technology" }
  ] },
  { title: "Legal · Italian documents", links: [
    { label: "Privacy policy (Italian)", href: "/privacy" },
    { label: "Terms of use (Italian)", href: "/terms" },
    { label: "Cookie policy (Italian)", href: "/cookie-policy" },
    { label: "Account & data deletion (Italian)", href: "/account-deletion" },
    { label: "Community guidelines (Italian)", href: "/community-guidelines" },
    { label: "Child safety standards (Italian)", href: "/child-safety-standards" },
    { label: "Geolocation policy (Italian)", href: "/geolocation-policy" }
  ] }
];
