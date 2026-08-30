import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const routes = [["/", "/en"], ["/download", "/en/download"], ["/partner", "/en/partner"], ["/guestsafe", "/en/guestsafe"], ["/contact", "/en/contact"]];
const htmlFor = (route) => readFileSync(resolve("dist", "." + route, "index.html"), "utf8");
test("all five English pages have canonical URLs, reciprocal alternates and a translated shell", () => {
  for (const [it, en] of routes) {
    for (const [route, language] of [[it, "it"], [en, "en"]]) {
      const html = htmlFor(route);
      assert.ok(html.includes(`<html lang="${language}">`), route);
      assert.ok(html.includes(`rel="canonical" href="https://www.protcity.com${route}"`), route);
      assert.ok(html.includes(`hreflang="it" href="https://www.protcity.com${it}"`), route);
      assert.ok(html.includes(`hreflang="en" href="https://www.protcity.com${en}"`), route);
      assert.ok(html.includes(`hreflang="x-default" href="https://www.protcity.com${it}"`), route);
    }
    const english = htmlFor(en);
    assert.equal([...english.matchAll(/<h1[\s>]/g)].length, 1, en);
    for (const label of ["Skip to content", "Review your cookie preferences", "Manage cookies and similar technologies", "Reject optional", "Italiano"]) assert.ok(english.includes(label), `${en}: ${label}`);
    assert.ok(english.includes('content="en_GB"'), en);
  }
});
test("English internal destinations and images exist in the build", () => {
  for (const [, route] of routes) {
    const html = htmlFor(route);
    for (const [, path] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"?#]*)[^\"]*"/g)) {
      const file = resolve("dist", "." + path);
      assert.ok(existsSync(file) || existsSync(resolve(file, "index.html")), `${route}: ${path}`);
    }
  }
});
test("static Italian and English download links contain no forced campaign", () => {
  for (const route of ["/", "/download", "/en", "/en/download"]) {
    const html = htmlFor(route);
    assert.ok(!html.includes("meta_it_download_landing_v1"), route);
    assert.ok(!html.includes("utm_source=meta"), route);
  }
});
test("English routes are listed in the sitemap", () => {
  const sitemap = readFileSync("dist/sitemap.xml", "utf8");
  for (const [, route] of routes) assert.ok(sitemap.includes(`<loc>https://www.protcity.com${route}</loc>`), route);
});
