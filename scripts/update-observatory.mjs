import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputPath = resolve(projectRoot, "src/data/generated/observatory.json");
const sitemapPath = resolve(projectRoot, "public/sitemap.xml");
const sourceBaseUrl = "https://cruscotto-italia.dati.gov.it/data/dashboard";
const romeAlertsUrl = "https://www.comune.roma.it/web/it/informazioni-di-servizio.page?struttura=str_lt";
const milanDatasetApi = "https://dati.comune.milano.it/api/3/action/package_show?id=ds925_avvisi-di-manomissione";
const milanDatasetPage = "https://dati.comune.milano.it/dataset/ds925_avvisi-di-manomissione";

const cities = [
  { slug: "roma", istatCode: "058091", expectedName: "Roma" },
  { slug: "milano", istatCode: "015146", expectedName: "Milano" }
];

const asNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
};
const asString = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);
const itemId = (namespace, value) =>
  createHash("sha256").update(`${namespace}:${value}`).digest("hex").slice(0, 20);

const cleanText = (value, max = 500) => String(value ?? "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&agrave;/gi, "à")
  .replace(/&egrave;/gi, "è")
  .replace(/&eacute;/gi, "é")
  .replace(/&igrave;/gi, "ì")
  .replace(/&ograve;/gi, "ò")
  .replace(/&ugrave;/gi, "ù")
  .replace(/&rsquo;|&apos;/gi, "’")
  .replace(/&quot;/gi, '"')
  .replace(/&amp;/gi, "&")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, max);

const italianMonths = new Map([
  ["gennaio", 0], ["febbraio", 1], ["marzo", 2], ["aprile", 3],
  ["maggio", 4], ["giugno", 5], ["luglio", 6], ["agosto", 7],
  ["settembre", 8], ["ottobre", 9], ["novembre", 10], ["dicembre", 11]
]);

function italianDateToIso(value) {
  const match = cleanText(value, 80).toLowerCase().match(/(\d{1,2})\s+([a-zà]+)\s+(\d{4})/i);
  if (!match || !italianMonths.has(match[2])) return null;
  return new Date(Date.UTC(Number(match[3]), italianMonths.get(match[2]), Number(match[1]), 10)).toISOString();
}

function externalDateToIso(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().replace(" ", "T");
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

async function fetchText(url, maxBytes = 5_000_000) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/json,application/geo+json;q=0.9,*/*;q=0.8",
      "User-Agent": "proTcity-observatory/1.1 (+https://www.protcity.com/osservatorio)"
    },
    signal: AbortSignal.timeout(45_000)
  });
  if (!response.ok) throw new Error(`upstream HTTP ${response.status}: ${url}`);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxBytes) throw new Error(`upstream payload too large: ${url}`);
  const text = await response.text();
  if (text.length > maxBytes) throw new Error(`upstream body too large: ${url}`);
  return text;
}

async function fetchRomeOfficialLive() {
  const html = await fetchText(romeAlertsUrl);
  const pattern = /<p\s+class="List-date"[^>]*>([\s\S]*?)<\/p>[\s\S]{0,1200}?<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const now = Date.now();
  const items = [];
  let match;
  while ((match = pattern.exec(html)) && items.length < 14) {
    const publishedAt = italianDateToIso(match[1]);
    const title = cleanText(match[3], 260);
    if (!publishedAt || !title || Date.parse(publishedAt) < now - 21 * 24 * 60 * 60 * 1000) continue;
    const href = new URL(match[2], "https://www.comune.roma.it").toString();
    items.push({
      id: itemId("roma-official", `${publishedAt}:${href}`),
      kind: "official",
      sourceType: "official",
      sourceLabel: "Roma Capitale",
      verified: true,
      title,
      summary: "Avviso ufficiale per il territorio comunale. Apri la fonte per durata, aree interessate e indicazioni complete.",
      category: /calore/i.test(title) ? "Caldo e salute" : /meteo|vento|pioggia|tempor/i.test(title) ? "Allerta meteo" : "Avviso cittadino",
      status: "active",
      publishedAt,
      startsAt: publishedAt,
      endsAt: null,
      latitude: null,
      longitude: null,
      locationPrecision: "citywide",
      ctaUrl: href
    });
  }
  if (!items.length) throw new Error("roma official feed returned no recent items");
  return { refreshedAt: new Date().toISOString(), sourceStatus: "live", items };
}

async function fetchMilanOfficialLive() {
  const metadata = JSON.parse(await fetchText(milanDatasetApi));
  const resources = Array.isArray(metadata?.result?.resources) ? metadata.result.resources : [];
  const resource = resources.find((item) => String(item?.format || "").toLowerCase() === "geojson");
  if (!resource?.url) throw new Error("milan GeoJSON resource unavailable");
  const geojson = JSON.parse(await fetchText(resource.url));
  const features = Array.isArray(geojson?.features) ? geojson.features : [];
  const now = Date.now();
  const items = features.flatMap((feature) => {
    const properties = feature?.properties && typeof feature.properties === "object" ? feature.properties : {};
    const coordinates = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);
    const startsAt = externalDateToIso(properties["Data prevista inizio lavori"]);
    const endsAt = externalDateToIso(properties["Data prevista fine lavori"]);
    const startMs = startsAt ? Date.parse(startsAt) : 0;
    const endMs = endsAt ? Date.parse(endsAt) : 0;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        !endMs || endMs < now - 12 * 60 * 60 * 1000 ||
        startMs > now + 45 * 24 * 60 * 60 * 1000) return [];
    const street = cleanText(properties["Nome via"], 100);
    const civic = cleanText(properties["Civico o descrizione di Punto Inizio intervento"], 70);
    const utility = cleanText(properties["Tipo di utility/attività"], 90) || "servizi urbani";
    const area = cleanText(properties["Tipologia area coinvolta"], 90);
    const neighborhood = cleanText(properties.NIL, 80);
    const featureId = cleanText(properties.Feature_ID, 160) || `${latitude}:${longitude}:${startsAt}`;
    return [{
      id: itemId("milano-lavori", featureId),
      kind: "official",
      sourceType: "official",
      sourceLabel: "Comune di Milano · Open Data",
      verified: true,
      title: `${utility} · ${street}${civic ? ` ${civic}` : ""}`.slice(0, 180),
      summary: [area, neighborhood ? `Zona ${neighborhood}` : ""].filter(Boolean).join(" · ") || "Intervento su suolo o sottosuolo comunicato al Comune di Milano.",
      category: "Lavori e servizi",
      status: startMs > now ? "scheduled" : "active",
      publishedAt: externalDateToIso(properties["Data protocollo ingresso"]),
      startsAt,
      endsAt,
      latitude,
      longitude,
      locationPrecision: "exact",
      ctaUrl: milanDatasetPage
    }];
  }).sort((left, right) => {
    if (left.status !== right.status) return left.status === "active" ? -1 : 1;
    return Date.parse(left.endsAt) - Date.parse(right.endsAt);
  }).slice(0, 120);
  if (!items.length) throw new Error("milan official feed returned no active items");
  return {
    refreshedAt: asString(metadata?.result?.metadata_modified) || new Date().toISOString(),
    sourceStatus: "live",
    items
  };
}

async function fetchDashboard(city) {
  const response = await fetch(`${sourceBaseUrl}/${city.istatCode}.json`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "proTcity-observatory/1.0 (+https://www.protcity.com/osservatorio)"
    },
    signal: AbortSignal.timeout(45_000)
  });

  if (!response.ok) {
    throw new Error(`${city.slug}: upstream HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 15_000_000) {
    throw new Error(`${city.slug}: upstream payload too large`);
  }

  const dashboard = await response.json();
  const actualName = asString(dashboard?.anagrafica?.denominazione);
  const actualIstat = asString(dashboard?.anagrafica?.istat_code);
  if (actualName !== city.expectedName || actualIstat !== city.istatCode) {
    throw new Error(`${city.slug}: upstream identity mismatch`);
  }

  return dashboard;
}

function projectCity(city, dashboard) {
  const summary = dashboard.kpi_summary || {};
  const road = dashboard.veicoli?.incidenti?.ultimo_anno || {};
  const roadSeries = dashboard.veicoli?.incidenti?.serie_storica || {};
  const weather = dashboard.meteo || summary.meteo_italiameteo || {};
  const air = summary.aria_ispra || {};
  const health = summary.sanita_mds || {};
  const tourism = summary.turismo || {};
  const population = summary.demografia || {};

  return {
    slug: city.slug,
    istatCode: city.istatCode,
    name: city.expectedName,
    province: asString(dashboard.anagrafica.provincia),
    region: asString(dashboard.anagrafica.regione),
    upstreamGeneratedAt: asString(dashboard._generated_at),
    population: {
      value: asNumber(population.popolazione ?? dashboard.demografia?.popolazione_totale),
      reference: asString(population.riferimento ?? dashboard.demografia?._riferimento),
      source: "ISTAT POSAS"
    },
    weather: {
      validAt: asString(weather.valid_time_utc),
      run: asString(weather.run_utc),
      description: asString(weather.ww_desc),
      temperatureC: asNumber(weather.t2m_c),
      min24hC: asNumber(weather.t2m_min24h_c),
      max24hC: asNumber(weather.t2m_max24h_c),
      precipitation24hMm: asNumber(weather.prec_24h_mm),
      humidityPct: asNumber(weather.umidita_pct),
      windKmh: asNumber(weather.vento_kmh),
      maxGust24hKmh: asNumber(weather.raffica_max24h_kmh),
      source: "ItaliaMeteo ICON-2I",
      license: "CC BY 4.0"
    },
    roadSafety: {
      year: asNumber(road.anno),
      incidents: asNumber(road.incidenti),
      deaths: asNumber(road.morti),
      injured: asNumber(road.feriti),
      deathsPer10k: asNumber(road.morti_per_10k_ab),
      injuredPer10k: asNumber(road.feriti_per_10k_ab),
      series: Array.isArray(roadSeries.anni)
        ? roadSeries.anni.map((year, index) => ({
            year: asNumber(year),
            incidents: asNumber(roadSeries.incidenti?.[index]),
            deaths: asNumber(roadSeries.morti?.[index]),
            injured: asNumber(roadSeries.feriti?.[index])
          }))
        : [],
      source: "ISTAT 41_983"
    },
    airQuality: {
      year: asNumber(air.anno),
      pm10Average: asNumber(air.pm10_media),
      pm25Average: asNumber(air.pm25_media),
      no2Average: asNumber(air.no2_media),
      source: "ISPRA SNPA"
    },
    healthServices: {
      pharmacies: asNumber(health.n_farmacie),
      paraPharmacies: asNumber(health.n_parafarmacie),
      hospitals: asNumber(health.n_ospedali),
      hospitalBeds: asNumber(health.posti_letto_ospedalieri),
      source: "Ministero della Salute"
    },
    tourism: {
      year: asNumber(tourism.anno),
      accommodationFacilities: asNumber(tourism.totale_strutture),
      beds: asNumber(tourism.totale_letti),
      tourismIndexPer100Residents: asNumber(tourism.indice_turisticita_per_100ab),
      source: "ISTAT"
    }
  };
}

async function readPrevious() {
  try {
    return JSON.parse(await readFile(outputPath, "utf8"));
  } catch {
    return { cities: {} };
  }
}

function mostRecentTimestamp(projectedCities) {
  return projectedCities
    .map((city) => city.upstreamGeneratedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || new Date(0).toISOString();
}

async function updateSitemap(lastModified) {
  let sitemap = await readFile(sitemapPath, "utf8");
  const day = lastModified.slice(0, 10);
  const paths = ["/osservatorio", "/osservatorio/roma", "/osservatorio/milano"];

  for (const path of paths) {
    const escapedUrl = `https://www.protcity.com${path}`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const block = new RegExp(`(<loc>${escapedUrl}<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`);
    sitemap = sitemap.replace(block, `$1${day}$2`);
  }

  await writeFile(sitemapPath, sitemap, "utf8");
}

const previous = await readPrevious();
const results = await Promise.allSettled(cities.map(fetchDashboard));
const officialResults = await Promise.allSettled([
  fetchRomeOfficialLive(),
  fetchMilanOfficialLive()
]);
const projectedCities = [];
const failures = [];
let dashboardFailureCount = 0;

for (let index = 0; index < cities.length; index += 1) {
  const city = cities[index];
  const result = results[index];
  if (result.status === "fulfilled") {
    const projected = projectCity(city, result.value);
    const officialResult = officialResults[index];
    if (officialResult.status === "fulfilled") {
      projected.officialLive = officialResult.value;
    } else if (previous.cities?.[city.slug]?.officialLive?.items?.length) {
      projected.officialLive = {
        ...previous.cities[city.slug].officialLive,
        sourceStatus: "last_known_good"
      };
      failures.push(`${city.slug} official: ${officialResult.reason?.message || "unknown upstream error"}`);
    } else {
      projected.officialLive = {
        refreshedAt: new Date(0).toISOString(),
        sourceStatus: "last_known_good",
        items: []
      };
      failures.push(`${city.slug} official: ${officialResult.reason?.message || "unknown upstream error"}`);
    }
    projectedCities.push(projected);
    continue;
  }

  const fallback = previous.cities?.[city.slug];
  if (!fallback) {
    throw result.reason;
  }

  projectedCities.push(fallback);
  dashboardFailureCount += 1;
  failures.push(`${city.slug}: ${result.reason?.message || "unknown upstream error"}`);
}

if (dashboardFailureCount === cities.length) {
  throw new Error(`All observatory sources failed: ${failures.join("; ")}`);
}

const refreshedAt = mostRecentTimestamp(projectedCities);
const output = {
  schemaVersion: 1,
  refreshedAt,
  attribution: {
    provider: "AgID - Cruscotto Italia",
    providerUrl: "https://cruscotto-italia.dati.gov.it/",
    sourceUrlTemplate: `${sourceBaseUrl}/{istat}.json`,
    license: "Fonti pubbliche con licenze aperte indicate nei singoli dataset"
  },
  cities: Object.fromEntries(projectedCities.map((city) => [city.slug, city]))
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
await updateSitemap(refreshedAt);

if (failures.length) {
  console.warn(`Observatory updated with last-known-good fallbacks: ${failures.join("; ")}`);
}

console.log(`Observatory updated from official sources: ${projectedCities.map((city) => city.name).join(", ")}`);
