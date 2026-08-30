/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
  protcityAnalyticsLoaded?: boolean;
  protcityCookieConsent?: { analytics?: boolean };
}
