import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://www.protcity.com",
  trailingSlash: "never",
  integrations: [react()]
});
