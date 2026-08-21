const origin = "https://www.protcity.com";
const key = "2c7bb2c6fc874f94a5e08f742b38f58a";
const keyLocation = `${origin}/${key}.txt`;

try {
  const sitemapResponse = await fetch(`${origin}/sitemap.xml?indexnow=${Date.now()}`, {
    headers: { Accept: "application/xml,text/xml" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!sitemapResponse.ok) throw new Error(`sitemap HTTP ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (!urlList.length) throw new Error("sitemap senza URL");
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(origin).host, key, keyLocation, urlList }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok && response.status !== 202) {
    throw new Error(`IndexNow HTTP ${response.status}`);
  }
  console.log(`IndexNow notificato: ${urlList.length} URL proTcity.`);
} catch (error) {
  console.warn(`IndexNow non disponibile, deploy non interrotto: ${error instanceof Error ? error.message : error}`);
}
