import observatorySnapshot from "./data/generated/observatory.json";

export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  GOOGLE_FIRESTORE_API_KEY?: string;
  ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS?: string;
  OBSERVATORY_FEED_TOKEN?: string;
}

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

const PROJECT_ID = "protcity-8f1a9";
const OBSERVATORY_FEED_ENDPOINT =
  "https://europe-west1-protcity-8f1a9.cloudfunctions.net/publicObservatoryFeed";
const PUBLIC_SITE_ORIGIN = "https://www.protcity.com";
const GUESTSAFE_PUBLIC_PROPERTY_ID = /^gsp_[A-Za-z0-9_-]{22}$/;
const IOS_GUESTSAFE_APP_ID = "42F8436BBW.com.kurbilabs.protcity";
const ANDROID_GUESTSAFE_PACKAGE = "com.kurbilabs.protcity";
const ANDROID_SHA256_PATTERN = /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/;

type ObservatoryCitySlug = "roma" | "milano";
type ObservatoryPublicItem = {
  id: string;
  kind: "report" | "alert" | "event" | "studio" | "official";
  sourceType: "community" | "studio" | "official";
  sourceLabel: string;
  verified: boolean;
  title: string;
  summary: string | null;
  category: string;
  status: "active" | "scheduled";
  publishedAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  latitude: number | null;
  longitude: number | null;
  locationPrecision: "approximate" | "exact" | "citywide";
  ctaUrl: string | null;
};

type ObservatoryFeedPayload = {
  generatedAt: string;
  items: ObservatoryPublicItem[];
};

const normalizeSlug = (value: string) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "x-content-type-options": "nosniff",
      ...(init.headers || {})
    }
  });

const withHeaders = (response: Response, values: Record<string, string>) => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(values)) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};

const escapeXml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const observatoryCityName = (city: ObservatoryCitySlug) => city === "roma" ? "Roma" : "Milano";

async function fetchObservatoryPublicItems(
  city: ObservatoryCitySlug,
  token: string
): Promise<ObservatoryFeedPayload> {
  const upstream = await fetch(`${OBSERVATORY_FEED_ENDPOINT}?city=${city}`, {
    headers: {
      Accept: "application/json",
      "X-Protcity-Observatory-Token": token
    },
    signal: AbortSignal.timeout(15_000)
  });
  if (!upstream.ok) throw new Error(`observatory feed ${upstream.status}`);
  const payload = await upstream.json() as Partial<ObservatoryFeedPayload>;
  const liveItems = Array.isArray(payload.items) ? payload.items : [];
  const staticCity = observatorySnapshot.cities[city];
  const officialItems = Array.isArray(staticCity?.officialLive?.items)
    ? staticCity.officialLive.items as ObservatoryPublicItem[]
    : [];
  const merged = new Map<string, ObservatoryPublicItem>();
  for (const item of [...officialItems, ...liveItems]) {
    if (item?.id && item?.title) merged.set(item.id, item);
  }
  const items = [...merged.values()].sort((left, right) => {
    const leftDate = Date.parse(left.publishedAt || left.startsAt || "") || 0;
    const rightDate = Date.parse(right.publishedAt || right.startsAt || "") || 0;
    return rightDate - leftDate;
  });
  return {
    generatedAt: payload.generatedAt || staticCity?.officialLive?.refreshedAt || new Date().toISOString(),
    items
  };
}

function jsonFeedResponse(
  payloads: Array<{ city: ObservatoryCitySlug; payload: ObservatoryFeedPayload }>,
  requestUrl: URL,
  method: string
) {
  const items = payloads.flatMap(({ city, payload }) => payload.items.map((item) => {
    const itemUrl = `${PUBLIC_SITE_ORIGIN}/osservatorio/${city}#aggiornamento-${encodeURIComponent(item.id)}`;
    return {
      id: `${city}:${item.id}`,
      url: itemUrl,
      external_url: item.ctaUrl || undefined,
      title: item.title,
      content_text: [item.summary, item.category, `Fonte: ${item.sourceLabel}`].filter(Boolean).join(" · "),
      date_published: item.publishedAt || item.startsAt || undefined,
      date_modified: item.publishedAt || item.startsAt || undefined,
      tags: [observatoryCityName(city), item.kind, item.category, item.sourceType],
      authors: [{ name: item.sourceLabel }],
      _proTcity: {
        city,
        kind: item.kind,
        source_type: item.sourceType,
        verified: item.verified,
        status: item.status,
        starts_at: item.startsAt,
        ends_at: item.endsAt,
        location_precision: item.locationPrecision
      }
    };
  }));
  const city = payloads.length === 1 ? payloads[0].city : null;
  const title = city
    ? `Osservatorio proTcity · ${observatoryCityName(city)}`
    : "Osservatorio urbano proTcity";
  const body = JSON.stringify({
    version: "https://jsonfeed.org/version/1.1",
    title,
    home_page_url: city
      ? `${PUBLIC_SITE_ORIGIN}/osservatorio/${city}`
      : `${PUBLIC_SITE_ORIGIN}/osservatorio`,
    feed_url: requestUrl.toString(),
    description: "Aggiornamenti urbani con fonte, data, stato e collegamento canonico.",
    language: "it-IT",
    items
  });
  return new Response(method === "HEAD" ? null : body, {
    headers: {
      "content-type": "application/feed+json; charset=UTF-8",
      "cache-control": "public, max-age=60, s-maxage=180, stale-while-revalidate=600",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "index, follow"
    }
  });
}

function rssFeedResponse(
  payloads: Array<{ city: ObservatoryCitySlug; payload: ObservatoryFeedPayload }>,
  requestUrl: URL,
  method: string
) {
  const city = payloads.length === 1 ? payloads[0].city : null;
  const title = city
    ? `Osservatorio proTcity · ${observatoryCityName(city)}`
    : "Osservatorio urbano proTcity";
  const homeUrl = city
    ? `${PUBLIC_SITE_ORIGIN}/osservatorio/${city}`
    : `${PUBLIC_SITE_ORIGIN}/osservatorio`;
  const items = payloads.flatMap(({ city: itemCity, payload }) => payload.items.map((item) => {
    const itemUrl = `${PUBLIC_SITE_ORIGIN}/osservatorio/${itemCity}#aggiornamento-${encodeURIComponent(item.id)}`;
    const itemDate = item.publishedAt || item.startsAt;
    const description = [item.summary, item.category, `Fonte: ${item.sourceLabel}`].filter(Boolean).join(" · ");
    return `<item><guid isPermaLink="true">${escapeXml(itemUrl)}</guid><link>${escapeXml(itemUrl)}</link><title>${escapeXml(item.title)}</title><description>${escapeXml(description)}</description>${itemDate ? `<pubDate>${escapeXml(new Date(itemDate).toUTCString())}</pubDate>` : ""}<category>${escapeXml(item.kind)}</category><category>${escapeXml(observatoryCityName(itemCity))}</category></item>`;
  })).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeXml(title)}</title><link>${escapeXml(homeUrl)}</link><atom:link href="${escapeXml(requestUrl.toString())}" rel="self" type="application/rss+xml"/><description>Aggiornamenti urbani con fonte, data, stato e collegamento canonico.</description><language>it-IT</language><lastBuildDate>${escapeXml(new Date().toUTCString())}</lastBuildDate>${items}</channel></rss>`;
  return new Response(method === "HEAD" ? null : xml, {
    headers: {
      "content-type": "application/rss+xml; charset=UTF-8",
      "cache-control": "public, max-age=60, s-maxage=180, stale-while-revalidate=600",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
      "x-robots-tag": "index, follow"
    }
  });
}

async function handleObservatorySyndication(request: Request, env: Env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405 });
  }
  const token = String(env.OBSERVATORY_FEED_TOKEN || "");
  if (!token) {
    return jsonResponse({ error: "observatory_feed_not_configured" }, {
      status: 503,
      headers: { "cache-control": "no-store" }
    });
  }
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/osservatorio(?:\/(roma|milano))?\/feed\.(json|xml)\/?$/);
  if (!match) return jsonResponse({ error: "unsupported_feed" }, { status: 404 });
  const requestedCities: ObservatoryCitySlug[] = match[1]
    ? [match[1] as ObservatoryCitySlug]
    : ["roma", "milano"];
  try {
    const payloads = await Promise.all(requestedCities.map(async (city) => ({
      city,
      payload: await fetchObservatoryPublicItems(city, token)
    })));
    return match[2] === "json"
      ? jsonFeedResponse(payloads, url, request.method)
      : rssFeedResponse(payloads, url, request.method);
  } catch {
    return jsonResponse({ error: "observatory_feed_temporarily_unavailable" }, {
      status: 503,
      headers: { "cache-control": "no-store" }
    });
  }
}

async function handleGuestSafeHotelApi(
  request: Request,
  env: Env
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const slug = normalizeSlug(url.pathname.replace(/^\/api\/guestsafe-hotel\/?/, ""));
  if (!slug) {
    return jsonResponse({ error: "missing_hotel_slug" }, { status: 400 });
  }

  const apiKey = env.GOOGLE_FIRESTORE_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "guest_safe_not_configured" }, { status: 503 });
  }

  const decodeFirestoreValue = (value: unknown): unknown => {
    if (!value || typeof value !== "object") return null;
    const field = value as Record<string, unknown>;
    if ("stringValue" in field) return field.stringValue;
    if ("booleanValue" in field) return field.booleanValue;
    if ("integerValue" in field) return Number(field.integerValue);
    if ("doubleValue" in field) return Number(field.doubleValue);
    if ("timestampValue" in field) return field.timestampValue;
    if ("nullValue" in field) return null;
    const arrayValue = field.arrayValue as { values?: unknown[] } | undefined;
    if (arrayValue) return (arrayValue.values || []).map(decodeFirestoreValue);
    const mapValue = field.mapValue as { fields?: Record<string, unknown> } | undefined;
    if (mapValue) {
      return Object.fromEntries(Object.entries(mapValue.fields || {}).map(([key, entry]) => [
        key,
        decodeFirestoreValue(entry),
      ]));
    }
    return null;
  };
  const decodeFirestoreDocument = (document: unknown): Record<string, unknown> => {
    const fields = document && typeof document === "object"
      ? (document as { fields?: Record<string, unknown> }).fields || {}
      : {};
    return Object.fromEntries(Object.entries(fields).map(([key, value]) => [
      key,
      decodeFirestoreValue(value),
    ]));
  };
  const fetchDocument = async (documentId: string) => {
    const endpoint =
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/appContent/${encodeURIComponent(documentId)}?key=${apiKey}`;
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Referer: `${PUBLIC_SITE_ORIGIN}/guestsafe/${slug}`
      },
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) return { response, raw: null, data: null };
    const raw = await response.json() as Record<string, unknown>;
    return { response, raw, data: decodeFirestoreDocument(raw) };
  };
  const unavailable = (status: number, error: string) => withHeaders(
    jsonResponse({ error }, {
      status,
      headers: { "cache-control": "no-store" }
    }),
    { "x-robots-tag": "noindex, nofollow" },
  );

  try {
    const alias = await fetchDocument(`guestsafe-alias-${slug}`);
    if (!alias.response.ok) {
      return unavailable(alias.response.status === 404 ? 404 : 503, "guest_safe_not_found");
    }
    const aliasData = alias.data || {};
    const publicPropertyId = String(aliasData.publicPropertyId || "").trim();
    const organizationId = String(aliasData.organizationId || "").trim();
    if (
      aliasData.kind !== "guest_safe_alias" ||
      aliasData.status !== "published" ||
      aliasData.source !== "studio_guestsafe" ||
      aliasData.environment !== "production" ||
      aliasData.schemaVersion !== 2 ||
      aliasData.projectionVersion !== 2 ||
      aliasData.slug !== slug ||
      !organizationId ||
      !GUESTSAFE_PUBLIC_PROPERTY_ID.test(publicPropertyId)
    ) {
      return unavailable(404, "guest_safe_not_found");
    }

    const profile = await fetchDocument(`guestsafe-property-${publicPropertyId}`);
    if (!profile.response.ok || !profile.raw || !profile.data) {
      return unavailable(profile.response.status === 404 ? 404 : 503, "guest_safe_not_found");
    }
    const profileData = profile.data;
    const guestSafe = profileData.guestSafe && typeof profileData.guestSafe === "object"
      ? profileData.guestSafe as Record<string, unknown>
      : null;
    if (
      profileData.kind !== "guest_safe_public" ||
      profileData.status !== "published" ||
      profileData.source !== "studio_guestsafe" ||
      profileData.environment !== "production" ||
      profileData.schemaVersion !== 2 ||
      profileData.projectionVersion !== 2 ||
      profileData.organizationId !== organizationId ||
      profileData.publicPropertyId !== publicPropertyId ||
      guestSafe?.enabled !== true ||
      guestSafe.publicPropertyId !== publicPropertyId ||
      guestSafe.slug !== slug
    ) {
      return unavailable(404, "guest_safe_not_found");
    }

    return withHeaders(new Response(
      request.method === "HEAD" ? null : JSON.stringify(profile.raw),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "public, max-age=60, s-maxage=300",
          "x-content-type-options": "nosniff"
        }
      },
    ), { "x-robots-tag": "noindex, nofollow" });
  } catch {
    return unavailable(503, "guest_safe_temporarily_unavailable");
  }
}

async function handleGuestSafePropertyApi(request: Request, env: Env) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const publicPropertyId = String(
    url.pathname.replace(/^\/api\/guestsafe-property\/?/, ""),
  ).trim();
  if (!GUESTSAFE_PUBLIC_PROPERTY_ID.test(publicPropertyId)) {
    return jsonResponse({ error: "invalid_public_property_id" }, {
      status: 400,
      headers: { "cache-control": "no-store" },
    });
  }

  const apiKey = env.GOOGLE_FIRESTORE_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: "guest_safe_not_configured" }, {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }

  const unavailable = (status: number, error: string) => withHeaders(
    jsonResponse({ error }, {
      status,
      headers: { "cache-control": "no-store" },
    }),
    { "x-robots-tag": "noindex, nofollow" },
  );

  try {
    const endpoint =
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/appContent/${encodeURIComponent(`guestsafe-property-${publicPropertyId}`)}?key=${apiKey}`;
    const upstream = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        Referer: `${PUBLIC_SITE_ORIGIN}/guestsafe/p/${publicPropertyId}`,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) {
      return unavailable(upstream.status === 404 ? 404 : 503, "guest_safe_not_found");
    }

    const raw = await upstream.json() as {
      fields?: Record<string, {
        stringValue?: string;
        integerValue?: string;
        mapValue?: { fields?: Record<string, {
          stringValue?: string;
          booleanValue?: boolean;
        }> };
      }>;
    };
    const fields = raw.fields || {};
    const guestSafe = fields.guestSafe?.mapValue?.fields || {};
    const organizationId = String(fields.organizationId?.stringValue || "").trim();
    const slug = String(guestSafe.slug?.stringValue || "").trim();
    if (
      fields.kind?.stringValue !== "guest_safe_public" ||
      fields.status?.stringValue !== "published" ||
      fields.source?.stringValue !== "studio_guestsafe" ||
      fields.environment?.stringValue !== "production" ||
      Number(fields.schemaVersion?.integerValue) !== 2 ||
      Number(fields.projectionVersion?.integerValue) !== 2 ||
      fields.publicPropertyId?.stringValue !== publicPropertyId ||
      guestSafe.publicPropertyId?.stringValue !== publicPropertyId ||
      guestSafe.enabled?.booleanValue !== true ||
      !organizationId ||
      !slug
    ) {
      return unavailable(404, "guest_safe_not_found");
    }

    return withHeaders(new Response(
      request.method === "HEAD" ? null : JSON.stringify(raw),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=UTF-8",
          "cache-control": "public, max-age=60, s-maxage=300",
          "x-content-type-options": "nosniff",
        },
      },
    ), { "x-robots-tag": "noindex, nofollow" });
  } catch {
    return unavailable(503, "guest_safe_temporarily_unavailable");
  }
}

function appleAppSiteAssociationResponse() {
  return jsonResponse({
    applinks: {
      apps: [],
      details: [
        {
          appIDs: [IOS_GUESTSAFE_APP_ID],
          components: [
            {
              "/": "/guestsafe/p/*",
              comment: "Apre esclusivamente un profilo pubblico GuestSafe.",
            },
          ],
        },
      ],
    },
  }, {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=3600",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function androidAssetLinksResponse(env: Env) {
  const fingerprints = String(env.ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS || "")
    .split(/[\n,]+/)
    .map((value) => value.trim().toUpperCase())
    .filter((value) => ANDROID_SHA256_PATTERN.test(value));
  if (fingerprints.length === 0) {
    return jsonResponse({ error: "android_app_links_not_configured" }, {
      status: 503,
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow",
      },
    });
  }
  return jsonResponse([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_GUESTSAFE_PACKAGE,
        sha256_cert_fingerprints: [...new Set(fingerprints)],
      },
    },
  ], {
    headers: {
      "cache-control": "public, max-age=300, s-maxage=3600",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

async function handleObservatoryFeedApi(
  request: Request,
  env: Env,
  context: WorkerExecutionContext
) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonResponse({ error: "method_not_allowed" }, { status: 405 });
  }
  const token = String(env.OBSERVATORY_FEED_TOKEN || "");
  if (!token) {
    return jsonResponse({ error: "observatory_feed_not_configured" }, {
      status: 503,
      headers: { "cache-control": "no-store" }
    });
  }
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/api\/osservatorio\/(roma|milano)\/?$/);
  if (!match) return jsonResponse({ error: "unsupported_city" }, { status: 400 });
  const edgeCache = (caches as CacheStorage & { default: Cache }).default;
  const cacheKey = new Request(`${url.origin}/api/osservatorio/${match[1]}`, {
    method: "GET"
  });

  if (request.method === "GET") {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  }

  try {
    const upstream = await fetch(`${OBSERVATORY_FEED_ENDPOINT}?city=${match[1]}`, {
      method: request.method,
      headers: {
        Accept: "application/json",
        "X-Protcity-Observatory-Token": token
      },
      signal: AbortSignal.timeout(15_000)
    });
    const body = request.method === "HEAD" ? null : await upstream.text();
    const response = new Response(body, {
      status: upstream.status,
      headers: {
        "content-type": "application/json; charset=UTF-8",
        "cache-control": upstream.ok
          ? "public, max-age=30, s-maxage=90, stale-while-revalidate=300"
          : "no-store",
        "x-content-type-options": "nosniff",
        "x-robots-tag": "noindex, nofollow",
        "referrer-policy": "no-referrer"
      }
    });
    if (request.method === "GET" && upstream.ok) {
      context.waitUntil(edgeCache.put(cacheKey, response.clone()));
    }
    return response;
  } catch {
    return jsonResponse({ error: "observatory_feed_temporarily_unavailable" }, {
      status: 503,
      headers: {
        "cache-control": "no-store",
        "x-robots-tag": "noindex, nofollow"
      }
    });
  }
}

export default {
  async fetch(request: Request, env: Env, context: WorkerExecutionContext) {
    const url = new URL(request.url);

    if (
      url.pathname === "/.well-known/apple-app-site-association" ||
      url.pathname === "/apple-app-site-association"
    ) {
      return appleAppSiteAssociationResponse();
    }

    if (url.pathname === "/.well-known/assetlinks.json") {
      return androidAssetLinksResponse(env);
    }

    if (url.pathname === "/googleca8852126a17d04f.html") {
      return new Response("google-site-verification: googleca8852126a17d04f.html", {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });
    }

    if (url.hostname === "protcity.com") {
      url.hostname = "www.protcity.com";
      return Response.redirect(url.toString(), 301);
    }

    if (
      url.pathname === "/data-deletion" ||
      url.pathname === "/data-deletion/" ||
      url.pathname === "/delete-account" ||
      url.pathname === "/delete-account/"
    ) {
      url.pathname = "/account-deletion";
      return Response.redirect(url.toString(), 301);
    }

    if (/^\/api\/guestsafe-hotel\/[^/]+\/?$/.test(url.pathname)) {
      return handleGuestSafeHotelApi(request, env);
    }

    if (/^\/api\/guestsafe-property\/gsp_[A-Za-z0-9_-]{22}\/?$/.test(url.pathname)) {
      return handleGuestSafePropertyApi(request, env);
    }

    if (/^\/api\/osservatorio\/(roma|milano)\/?$/.test(url.pathname)) {
      return handleObservatoryFeedApi(request, env, context);
    }

    if (/^\/osservatorio(?:\/(roma|milano))?\/feed\.(json|xml)\/?$/.test(url.pathname)) {
      return handleObservatorySyndication(request, env);
    }

    if (
      /^\/guestsafe\/[^/]+\/?$/.test(url.pathname) ||
      /^\/guestsafe\/p\/gsp_[A-Za-z0-9_-]{22}\/?$/.test(url.pathname) ||
      /^\/guestsafe\/h\/[^/]+\/?$/.test(url.pathname)
    ) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/guestsafe-hotel";
      const response = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
      return withHeaders(response, { "x-robots-tag": "noindex, follow" });
    }

    const response = await env.ASSETS.fetch(request);
    if (url.pathname === "/meta-oembed-review" || url.pathname === "/guestsafe-hotel") {
      return withHeaders(response, { "x-robots-tag": "noindex, nofollow" });
    }

    return response;
  }
};
