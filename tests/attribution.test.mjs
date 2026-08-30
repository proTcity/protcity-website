import test from "node:test";
import assert from "node:assert/strict";
import { campaignFromSearch, campaignHref, analyticsCampaign, storeForHref } from "../src/utils/attribution.mjs";

const origin = "https://www.protcity.com";
const apple = "https://apps.apple.com/it/app/protcity/id6776195391";
const play = "https://play.google.com/store/apps/details?id=com.kurbilabs.protcity";
const ph = campaignFromSearch("?ref=producthunt");

test("direct and untagged visits keep store links neutral", () => {
  for (const search of ["", "?ref=unknown", "?utm_campaign=orphan", "?gclid=ad-click", "?fbclid=click"]) {
    assert.equal(campaignFromSearch(search).size, 0);
    assert.equal(campaignHref(play, origin, campaignFromSearch(search)), play);
    assert.equal(campaignHref(apple, origin, campaignFromSearch(search)), apple);
  }
});
test("Product Hunt source survives home, English switch and download", () => {
  assert.equal(ph.toString(), "utm_source=producthunt&utm_medium=referral");
  let href = campaignHref("/en", origin, ph);
  href = campaignHref("/en/download", origin, campaignFromSearch(new URL(href, origin).search));
  const store = new URL(campaignHref(play, origin, campaignFromSearch(new URL(href, origin).search)));
  assert.equal(store.searchParams.get("id"), "com.kurbilabs.protcity");
  assert.equal(store.searchParams.get("referrer"), ph.toString());
  assert.ok(!store.href.includes("meta"));
});
test("explicit campaign tags win and Meta is used only when supplied", () => {
  const campaign = campaignFromSearch("?ref=producthunt&utm_source=meta&utm_medium=paid_social&utm_campaign=launch_v1&utm_content=video-1");
  assert.deepEqual(analyticsCampaign(campaign), { campaign_source: "meta", campaign_medium: "paid_social", campaign_name: "launch_v1", campaign_content: "video-1" });
});
test("reject malformed, oversized and identity-like labels without forwarding unrelated query data", () => {
  assert.equal(campaignFromSearch("?utm_source=person%40example.com&ref=producthunt").size, 0);
  assert.equal(campaignFromSearch("?utm_source=" + "x".repeat(101)).size, 0);
  const safe = campaignFromSearch("?ref=producthunt&email=person@example.com&fbclid=secret&utm_content=https%3A%2F%2Fevil.example&utm_term=private");
  assert.equal(safe.toString(), ph.toString());
});
test("internal anchors and destination campaign labels are preserved", () => {
  assert.equal(campaignHref("#features", origin, ph), "#features");
  assert.equal(campaignHref("/en/download?mode=app#stores", origin, ph), "/en/download?mode=app&utm_source=producthunt&utm_medium=referral#stores");
  assert.equal(campaignHref("/download?utm_source=newsletter", origin, ph), "/download?utm_source=newsletter");
});
test("do not send campaign labels to unrelated sites, mail, files or GuestSafe stay URLs", () => {
  for (const href of ["mailto:support@protcity.com", "tel:+39123", "https://studio.protcity.com/registrazione", "https://example.com", "/images/app.png", "/api/guestsafe-hotel/demo", "/guestsafe/p/gsp_example", apple]) {
    assert.equal(campaignHref(href, origin, ph), href);
  }
});
test("only the actual proTcity listings are recognised as store clicks", () => {
  assert.equal(storeForHref(apple), "app_store");
  assert.equal(storeForHref(play), "google_play");
  for (const href of ["https://apps.apple.com/app/id123", "https://play.google.com/store/apps/details?id=other.app", "https://apps.apple.com.evil.example/app/id6776195391", "/download"]) assert.equal(storeForHref(href), null);
});
test("rewriting a link repeatedly does not duplicate campaign labels", () => {
  for (const href of [play, "/en/download"]) {
    const first = campaignHref(href, origin, ph);
    assert.equal(campaignHref(first, origin, ph), first);
  }
});

test("store-click handler sends nothing before consent or after revocation", async () => {
  const events = [];
  const handlers = {};
  class FakeElement { closest() { return { href: play }; } }
  globalThis.Element = FakeElement;
  globalThis.window = { location: { origin, pathname: "/en/download", search: "?ref=producthunt" }, gtag: (...args) => events.push(args) };
  globalThis.document = { querySelectorAll: () => [], documentElement: { lang: "en" }, addEventListener: (name, handler) => { handlers[name] = handler; } };
  try {
    await import("../src/scripts/marketing.mjs");
    const click = () => handlers.click({ target: new FakeElement() });
    click();
    assert.equal(events.length, 0);
    window.protcityCookieConsent = { analytics: true };
    click();
    assert.equal(events.length, 0);
    window.protcityAnalyticsLoaded = true;
    click();
    assert.equal(events.length, 1);
    assert.equal(events[0][1], "store_click");
    assert.equal(events[0][2].acquisition_source, "producthunt");
    assert.equal(events[0][2].page_language, "en");
    window.protcityCookieConsent.analytics = false;
    click();
    assert.equal(events.length, 1);
  } finally { delete globalThis.Element; delete globalThis.window; delete globalThis.document; }
});
