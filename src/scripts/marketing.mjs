import { campaignFromSearch, campaignHref, storeForHref } from "../utils/attribution.mjs";

const campaign = campaignFromSearch(window.location.search);
document.querySelectorAll("a[href]").forEach((link) => {
  const original = link.getAttribute("href");
  if (!original || link.hasAttribute("download")) return;
  const updated = campaignHref(original, window.location.origin, campaign);
  if (updated !== original) link.setAttribute("href", updated);
});

document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const link = event.target.closest("a[href]");
  if (!link) return;
  const store = storeForHref(link.href);
  // A click is not an install. Nothing is queued before consent or after revocation.
  if (!store || !window.protcityCookieConsent?.analytics || !window.protcityAnalyticsLoaded) return;
  window.gtag?.("event", "store_click", {
    store,
    page_path: window.location.pathname,
    page_language: document.documentElement.lang,
    ...(campaign.get("utm_source") ? { acquisition_source: campaign.get("utm_source") } : {}),
    ...(campaign.get("utm_medium") ? { acquisition_medium: campaign.get("utm_medium") } : {}),
    ...(campaign.get("utm_campaign") ? { acquisition_campaign: campaign.get("utm_campaign") } : {})
  });
});
