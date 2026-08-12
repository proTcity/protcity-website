export type ObservatoryCitySlug = "roma" | "milano";

export type ObservatoryCitySnapshot = {
  slug: ObservatoryCitySlug;
  istatCode: string;
  name: string;
  province: string | null;
  region: string | null;
  upstreamGeneratedAt: string | null;
  population: {
    value: number | null;
    reference: string | null;
    source: string;
  };
  weather: {
    validAt: string | null;
    run: string | null;
    description: string | null;
    temperatureC: number | null;
    min24hC: number | null;
    max24hC: number | null;
    precipitation24hMm: number | null;
    humidityPct: number | null;
    windKmh: number | null;
    maxGust24hKmh: number | null;
    source: string;
    license: string;
  };
  roadSafety: {
    year: number | null;
    incidents: number | null;
    deaths: number | null;
    injured: number | null;
    deathsPer10k: number | null;
    injuredPer10k: number | null;
    series: Array<{
      year: number | null;
      incidents: number | null;
      deaths: number | null;
      injured: number | null;
    }>;
    source: string;
  };
  airQuality: {
    year: number | null;
    pm10Average: number | null;
    pm25Average: number | null;
    no2Average: number | null;
    source: string;
  };
  healthServices: {
    pharmacies: number | null;
    paraPharmacies: number | null;
    hospitals: number | null;
    hospitalBeds: number | null;
    source: string;
  };
  tourism: {
    year: number | null;
    accommodationFacilities: number | null;
    beds: number | null;
    tourismIndexPer100Residents: number | null;
    source: string;
  };
};

export type ObservatorySnapshot = {
  schemaVersion: number;
  refreshedAt: string;
  attribution: {
    provider: string;
    providerUrl: string;
    sourceUrlTemplate: string;
    license: string;
  };
  cities: Record<ObservatoryCitySlug, ObservatoryCitySnapshot>;
};

type OfficialLink = {
  label: string;
  description: string;
  href: string;
  category: "alerts" | "mobility" | "events" | "data";
};

export type ObservatoryCityProfile = {
  slug: ObservatoryCitySlug;
  name: string;
  preposition: string;
  region: string;
  intro: string;
  municipalityUrl: string;
  civilProtectionUrl: string;
  officialLinks: OfficialLink[];
};

export const observatoryBasePath = "/osservatorio";

export const observatoryCityProfiles: ObservatoryCityProfile[] = [
  {
    slug: "roma",
    name: "Roma",
    preposition: "a Roma",
    region: "Lazio",
    intro:
      "Informazioni pratiche e dati ufficiali per leggere il contesto urbano di Roma senza allarmismi e senza classificare persone o quartieri.",
    municipalityUrl: "https://www.comune.roma.it/",
    civilProtectionUrl: "https://www.comune.roma.it/web/it/protezione-civile.page",
    officialLinks: [
      {
        label: "Avvisi e informazioni di servizio",
        description: "Aggiornamenti pubblicati da Roma Capitale su servizi, mobilità e Protezione Civile.",
        href: "https://www.comune.roma.it/web/it/informazioni-di-servizio.page",
        category: "alerts"
      },
      {
        label: "Roma Mobilita",
        description: "Informazioni ufficiali su trasporto pubblico, traffico e mobilità urbana.",
        href: "https://romamobilita.it/",
        category: "mobility"
      },
      {
        label: "Eventi ufficiali 060608",
        description: "Agenda turistica e culturale ufficiale di Roma Capitale.",
        href: "https://060608.it/",
        category: "events"
      },
      {
        label: "Open Data Roma Capitale",
        description: "Dataset pubblici del Comune, inclusi mobilità, territorio e sicurezza urbana.",
        href: "https://dati.comune.roma.it/",
        category: "data"
      }
    ]
  },
  {
    slug: "milano",
    name: "Milano",
    preposition: "a Milano",
    region: "Lombardia",
    intro:
      "Informazioni pratiche e dati ufficiali per leggere il contesto urbano di Milano senza allarmismi e senza classificare persone o quartieri.",
    municipalityUrl: "https://www.comune.milano.it/",
    civilProtectionUrl: "https://www.comune.milano.it/servizi/polizia-locale-e-sicurezza/sistema-di-allerta-della-protezione-civile",
    officialLinks: [
      {
        label: "Sistema di allerta",
        description: "Canale ufficiale della Protezione Civile del Comune di Milano.",
        href: "https://www.comune.milano.it/servizi/polizia-locale-e-sicurezza/sistema-di-allerta-della-protezione-civile",
        category: "alerts"
      },
      {
        label: "Infomobilita Milano",
        description: "Chiusure, cortei, manifestazioni e modifiche alla circolazione pubblicate dal Comune.",
        href: "https://www.comune.milano.it/it/home/infomobilita",
        category: "mobility"
      },
      {
        label: "Eventi ufficiali YesMilano",
        description: "Agenda della citta per residenti e visitatori.",
        href: "https://www.yesmilano.it/eventi/tutti-gli-eventi",
        category: "events"
      },
      {
        label: "Open Data Milano",
        description: "Dataset e API pubbliche del Comune di Milano.",
        href: "https://dati.comune.milano.it/",
        category: "data"
      }
    ]
  }
];

export const getObservatoryCityPath = (slug: ObservatoryCitySlug) =>
  `${observatoryBasePath}/${slug}`;

export const getObservatoryCityProfile = (slug: string) =>
  observatoryCityProfiles.find((profile) => profile.slug === slug);
