import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const outputPath = resolve(projectRoot, "src/data/generated/observatory.json");
const sitemapPath = resolve(projectRoot, "public/sitemap.xml");
const sourceBaseUrl = "https://cruscotto-italia.dati.gov.it/data/dashboard";

const cities = [
  { slug: "roma", istatCode: "058091", expectedName: "Roma" },
  { slug: "milano", istatCode: "015146", expectedName: "Milano" }
];

const asNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return Number.isFinite(Number(value)) ? Number(value) : null;
};
const asString = (value) => (typeof value === "string" && value.trim() ? value.trim() : null);

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
const projectedCities = [];
const failures = [];

for (let index = 0; index < cities.length; index += 1) {
  const city = cities[index];
  const result = results[index];
  if (result.status === "fulfilled") {
    projectedCities.push(projectCity(city, result.value));
    continue;
  }

  const fallback = previous.cities?.[city.slug];
  if (!fallback) {
    throw result.reason;
  }

  projectedCities.push(fallback);
  failures.push(`${city.slug}: ${result.reason?.message || "unknown upstream error"}`);
}

if (failures.length === cities.length) {
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
