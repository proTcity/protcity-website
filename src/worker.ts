export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.hostname === "protcity.com") {
      url.hostname = "www.protcity.com";
      return Response.redirect(url.toString(), 301);
    }

    if (url.pathname === "/googleca8852126a17d04f.html") {
      return new Response("google-site-verification: googleca8852126a17d04f.html", {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
