export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
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

    if (/^\/guestsafe\/[^/]+\/?$/.test(url.pathname)) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = "/guestsafe-hotel";
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
};
