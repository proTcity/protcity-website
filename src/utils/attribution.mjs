/** URL labels only: no cookies, storage, click IDs, identity or referrer scraping. */
export const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

/** @param {string} search */
export function campaignFromSearch(search) {
  const input = new URLSearchParams(search);
  const result = new URLSearchParams();
  for (const key of campaignKeys) {
    const value = input.get(key);
    // Campaign slugs, not arbitrary URLs, email addresses or free-form text.
    if (value && /^[a-zA-Z0-9][a-zA-Z0-9._~-]{0,99}$/.test(value)) result.set(key, value);
  }
  if (!input.has("utm_source") && input.get("ref")?.toLowerCase() === "producthunt") {
    result.set("utm_source", "producthunt");
    if (!result.has("utm_medium")) result.set("utm_medium", "referral");
  }
  // Incomplete or invalid campaigns must not be attributed to an invented source.
  return result.has("utm_source") ? result : new URLSearchParams();
}

/** @param {string} href @param {string} origin @param {URLSearchParams} campaign */
export function campaignHref(href, origin, campaign) {
  if (!campaign.size || href.startsWith("#")) return href;
  let url;
  try { url = new URL(href, origin); } catch { return href; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return href;
  if (url.origin === origin && !/\.[^/]+$/.test(url.pathname) && !/^\/(api|\.well-known|guestsafe\/)/.test(url.pathname)) {
    // A link explicitly tagged for another campaign keeps its own labels.
    if (campaignKeys.some((key) => url.searchParams.has(key))) return href;
    campaign.forEach((value, key) => url.searchParams.set(key, value));
    return `${url.pathname}${url.search}${url.hash}`;
  }
  if (url.origin === "https://play.google.com" && url.pathname === "/store/apps/details" && url.searchParams.get("id") === "com.kurbilabs.protcity") {
    url.searchParams.set("referrer", campaign.toString());
    return url.toString();
  }
  // App Store campaigns require a real App Store Connect provider token.
  // Until configured, keep Apple's URL neutral and measure consented site clicks.
  return href;
}

/** @param {URLSearchParams} campaign */
export function analyticsCampaign(campaign) {
  const names = { utm_source: "campaign_source", utm_medium: "campaign_medium", utm_campaign: "campaign_name", utm_content: "campaign_content" };
  return Object.fromEntries([...campaign].map(([key, value]) => [names[key], value]));
}

/** @param {string} href */
export function storeForHref(href) {
  let url;
  try { url = new URL(href); } catch { return null; }
  if (url.origin === "https://apps.apple.com" && /\/id6776195391\/?$/.test(url.pathname)) return "app_store";
  if (url.origin === "https://play.google.com" && url.pathname === "/store/apps/details" && url.searchParams.get("id") === "com.kurbilabs.protcity") return "google_play";
  return null;
}
