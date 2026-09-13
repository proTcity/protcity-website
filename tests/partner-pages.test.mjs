import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
for (const [lang, route] of [['it','/partner-network'],['en','/en/partner-network']]) {
  test(`${lang}: built page, SEO, links, form and language switch`, () => {
    const html = readFileSync(resolve('dist', '.' + route, 'index.html'), 'utf8');
    assert.ok(html.includes(`<html lang="${lang}">`));
    assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
    assert.ok(html.includes(`rel="canonical" href="https://www.protcity.com${route}"`));
    for (const [l,r] of [['it','/partner-network'],['en','/en/partner-network']]) assert.ok(html.includes(`hreflang="${l}" href="https://www.protcity.com${r}"`));
    assert.ok(html.includes('action="/api/partner-applications"')); assert.ok(html.includes('method="post"'));
    assert.ok(html.includes('name="privacyAcknowledged"')); assert.ok(!html.includes('name="marketing"'));
    assert.ok(!html.includes('<canvas')); assert.ok(!html.includes('LivingCityExperience'));
    for (const [, path] of html.matchAll(/(?:href|src)="(\/(?!\/)[^"?#]*)[^\"]*"/g)) {
      assert.ok(existsSync(resolve('dist', '.' + path)) || existsSync(resolve('dist', '.' + path, 'index.html')), `${route}: ${path}`);
    }
    assert.ok(readFileSync('dist/sitemap.xml','utf8').includes(`<loc>https://www.protcity.com${route}</loc>`));
  });
}

test('published privacy notice covers the live application data lifecycle',()=>{
  const html=readFileSync('dist/privacy/index.html','utf8');
  assert.ok(html.includes('id="partner-applications"'));
  assert.ok(html.includes('Cloudflare Workers'));
  assert.ok(html.includes('giurisdizione UE'));
  assert.ok(html.includes('180 giorni'));
  assert.ok(html.includes('ulteriori 30 giorni'));
  assert.ok(!html.includes('non mette a disposizione moduli di contatto web'));
});
