export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  GOOGLE_FIRESTORE_API_KEY?: string;
}

const PROJECT_ID = "protcity-8f1a9";

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

  return response;
}

export default {
  fetch(request: Request, env: Env) {
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

    if (/^\/guestsafe\/[^/]+\/?$/.test(url.pathname)) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/guestsafe-hotel";
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
};
