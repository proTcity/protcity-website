import { site } from "../data/site";

export function composeTitle(title?: string) {
  if (!title) return site.title;
  if (title.includes(site.name)) return title;
  return `${title} | ${site.name}`;
}

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = site.url.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
