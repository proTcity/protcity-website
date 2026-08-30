import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { campaignFromSearch, analyticsCampaign } from "../src/utils/attribution.mjs";

// Exercise the actual component script in an isolated fake DOM. No Google request.
function analyticsHarness(savedConsent) {
  const handlers = {};
  const scripts = [];
  const source = readFileSync("src/components/common/GoogleAnalytics.astro", "utf8")
    .match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/import[^;]+;/, "");
  const window = {
    location: { hostname: "www.protcity.com", pathname: "/en/download", origin: "https://www.protcity.com", search: "?ref=producthunt&email=private@example.com" },
    protcityCookieConsent: savedConsent,
    addEventListener: (name, handler) => { handlers[name] = handler; }
  };
  const document = { cookie: "", title: "Download proTcity", createElement: () => ({ dataset: {} }), head: { appendChild: (script) => scripts.push(script) } };
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  vm.runInNewContext(compiled, { window, document, campaignFromSearch, analyticsCampaign });
  return { window, scripts, consent: (analytics) => handlers["protcity:cookie-consent"]({ detail: { analytics } }), commands: () => window.dataLayer.map((args) => Array.from(args)) };
}

test("analytics loads only after opt-in, once, with sanitised campaign data", () => {
  const h = analyticsHarness();
  assert.equal(h.scripts.length, 0);
  assert.equal(h.commands().filter(([name]) => name === "event").length, 0);
  h.consent(false);
  assert.equal(h.scripts.length, 0);
  h.consent(true);
  assert.equal(h.scripts.length, 1);
  const config = h.commands().find(([name]) => name === "config")[2];
  assert.equal(config.campaign_source, "producthunt");
  assert.equal(config.campaign_medium, "referral");
  const pageView = h.commands().find(([name, event]) => name === "event" && event === "page_view")[2];
  assert.equal(pageView.page_location, "https://www.protcity.com/en/download");
  assert.ok(!JSON.stringify(h.commands()).includes("private@example.com"));
  h.consent(true);
  assert.equal(h.scripts.length, 1);
  h.consent(false);
  assert.equal(h.commands().at(-1)[2].analytics_storage, "denied");
  assert.equal(h.commands().at(-1)[2].ad_storage, "denied");
});
test("a consent choice set before module execution is respected", () => {
  assert.equal(analyticsHarness({ analytics: false }).scripts.length, 0);
  assert.equal(analyticsHarness({ analytics: true }).scripts.length, 1);
});
