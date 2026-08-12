export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  GOOGLE_FIRESTORE_API_KEY?: string;
  OBSERVATORY_FEED_TOKEN?: string;
}

type WorkerExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

const PROJECT_ID = "protcity-8f1a9";
const OBSERVATORY_FEED_ENDPOINT =
  "https://europe-west1-protcity-8f1a9.cloudfunctions.net/publicObservatoryFeed";

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

  const docId = `guestsafe-hotel-${slug}`;
  const endpoint =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/appContent/${docId}?key=${apiKey}`;
  const upstream = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      Referer: `${url.origin}/guestsafe/${slug}`
    }
  });
  const body = request.method === "HEAD" ? null : await upstream.text();
  const response = new Response(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json; charset=UTF-8",
      "cache-control": upstream.ok
        ? "public, max-age=60, s-maxage=300"
        : "public, max-age=30, s-maxage=60",
      "x-content-type-options": "nosniff"
    }
  });

  return withHeaders(response, { "x-robots-tag": "noindex, nofollow" });
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

    if (/^\/api\/osservatorio\/(roma|milano)\/?$/.test(url.pathname)) {
      return handleObservatoryFeedApi(request, env, context);
    }

    if (/^\/guestsafe\/[^/]+\/?$/.test(url.pathname)) {
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
