import L from "leaflet";

type LiveKind = "report" | "alert" | "event" | "studio" | "official";
type LiveItem = {
  id: string;
  kind: LiveKind;
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

type ApiPayload = {
  generatedAt?: string;
  items?: LiveItem[];
};

const kindMeta: Record<LiveKind, { label: string; short: string }> = {
  report: { label: "Segnalazione", short: "S" },
  alert: { label: "Avviso", short: "!" },
  event: { label: "Evento community", short: "E" },
  studio: { label: "Da Studio", short: "ST" },
  official: { label: "Fonte ufficiale", short: "UF" },
};

const dateTimeFormatter = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Rome",
});

function timestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatWhen(item: LiveItem): string {
  const value = item.status === "scheduled"
    ? item.startsAt
    : item.publishedAt || item.startsAt;
  const parsed = timestamp(value);
  if (!parsed) return item.status === "scheduled" ? "Programmato" : "Orario non disponibile";
  return `${item.status === "scheduled" ? "Dal " : ""}${dateTimeFormatter.format(new Date(parsed))}`;
}

function isMappable(item: LiveItem): item is LiveItem & { latitude: number; longitude: number } {
  return Number.isFinite(item.latitude) && Number.isFinite(item.longitude);
}

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

document.querySelectorAll<HTMLElement>("[data-observatory-live]").forEach((root) => {
  const mapElement = root.querySelector<HTMLElement>("[data-live-map]");
  const listElement = root.querySelector<HTMLElement>("[data-live-list]");
  const messageElement = root.querySelector<HTMLElement>("[data-live-message]");
  const mapCountElement = root.querySelector<HTMLElement>("[data-live-map-count]");
  const protcityCountElement = root.querySelector<HTMLElement>("[data-live-protcity-count]");
  const shownCountElement = root.querySelector<HTMLElement>("[data-live-shown-count]");
  const updatedElement = root.querySelector<HTMLElement>("[data-live-updated]");
  const initialElement = root.querySelector<HTMLScriptElement>("[data-live-initial]");
  if (!mapElement || !listElement || !initialElement) return;
  const liveList = listElement;

  const city = root.dataset.city || "";
  const centerLat = Number(root.dataset.centerLat);
  const centerLng = Number(root.dataset.centerLng);
  let officialItems: LiveItem[] = [];
  try {
    const parsed = JSON.parse(initialElement.textContent || "{}") as ApiPayload;
    officialItems = Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    officialItems = [];
  }

  let protcityItems: LiveItem[] = [];
  let activeFilter: LiveKind | "all" = "all";
  let hasLoadedProtcity = false;
  const markerLayer = L.layerGroup();
  const markerById = new Map<string, L.Marker>();
  const map = L.map(mapElement, {
    center: [centerLat, centerLng],
    zoom: city === "roma" ? 11 : 12,
    minZoom: 9,
    maxZoom: 18,
    zoomControl: true,
    scrollWheelZoom: false,
  });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
  }).addTo(map);
  markerLayer.addTo(map);

  const allItems = () => {
    const merged = new Map<string, LiveItem>();
    for (const item of [...officialItems, ...protcityItems]) merged.set(item.id, item);
    return [...merged.values()].sort((left, right) => {
      if (left.status !== right.status) return left.status === "active" ? -1 : 1;
      return timestamp(right.publishedAt || right.startsAt) - timestamp(left.publishedAt || left.startsAt);
    });
  };

  const filteredItems = () => allItems().filter((item) =>
    activeFilter === "all" || item.kind === activeFilter,
  );

  function createPopup(item: LiveItem): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className = "observatory-popup";
    const meta = document.createElement("span");
    meta.textContent = `${kindMeta[item.kind].label} · ${item.sourceLabel}`;
    const title = document.createElement("strong");
    title.textContent = item.title;
    const when = document.createElement("small");
    when.textContent = formatWhen(item);
    wrapper.append(meta, title, when);
    return wrapper;
  }

  function createFeedCard(item: LiveItem): HTMLElement {
    const card = document.createElement("article");
    card.className = `observatory-stream-card observatory-stream-card--${item.kind}`;
    card.dataset.itemId = item.id;

    const top = document.createElement("div");
    top.className = "observatory-stream-card__top";
    const kind = document.createElement("span");
    kind.className = "observatory-stream-card__kind";
    kind.textContent = kindMeta[item.kind].label;
    const time = document.createElement("time");
    time.dateTime = item.publishedAt || item.startsAt || "";
    time.textContent = formatWhen(item);
    top.append(kind, time);

    const title = document.createElement("h3");
    title.textContent = item.title;
    const summary = document.createElement("p");
    summary.textContent = item.summary || `${item.category} · Apri il dettaglio per saperne di più.`;

    const foot = document.createElement("div");
    foot.className = "observatory-stream-card__foot";
    const source = document.createElement("span");
    source.textContent = `${item.verified ? "✓ " : ""}${item.sourceLabel}`;
    foot.append(source);

    if (isMappable(item)) {
      const locate = document.createElement("button");
      locate.type = "button";
      locate.textContent = "Mostra sulla mappa";
      locate.addEventListener("click", () => {
        const marker = markerById.get(item.id);
        map.flyTo([item.latitude, item.longitude], Math.max(map.getZoom(), 15), { duration: 0.7 });
        marker?.openPopup();
      });
      foot.append(locate);
    }
    const url = safeExternalUrl(item.ctaUrl);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.sourceType === "official" ? "Apri la fonte" : "Apri il dettaglio";
      foot.append(link);
    }
    card.append(top, title, summary, foot);
    return card;
  }

  function render() {
    const items = filteredItems();
    const mappable = items.filter(isMappable);
    markerLayer.clearLayers();
    markerById.clear();
    for (const item of mappable) {
      const icon = L.divIcon({
        className: "observatory-leaflet-icon",
        html: `<span class="observatory-map-marker observatory-map-marker--${item.kind}" aria-hidden="true"><b>${kindMeta[item.kind].short}</b></span>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -18],
      });
      const marker = L.marker([item.latitude, item.longitude], { icon, title: item.title })
        .bindPopup(createPopup(item), { maxWidth: 300 });
      marker.addTo(markerLayer);
      markerById.set(item.id, marker);
    }

    liveList.replaceChildren();
    const visible = items.slice(0, 18);
    if (!visible.length) {
      const empty = document.createElement("div");
      empty.className = "observatory-stream-empty";
      empty.textContent = "Nessun aggiornamento attivo per questo filtro. Prova un altro livello.";
      liveList.append(empty);
    } else {
      visible.forEach((item) => liveList.append(createFeedCard(item)));
    }
    if (mapCountElement) mapCountElement.textContent = String(mappable.length);
    if (protcityCountElement) {
      protcityCountElement.textContent = hasLoadedProtcity ? String(protcityItems.length) : "…";
    }
    if (shownCountElement) {
      shownCountElement.textContent = `${visible.length} di ${items.length} aggiornamenti`;
    }
  }

  async function refreshProtcity() {
    if (document.visibilityState === "hidden") return;
    if (messageElement) messageElement.textContent = "Aggiornamento dei contenuti proTcity…";
    try {
      const response = await fetch(`/api/osservatorio/${encodeURIComponent(city)}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`feed ${response.status}`);
      const payload = await response.json() as ApiPayload;
      protcityItems = Array.isArray(payload.items) ? payload.items : [];
      hasLoadedProtcity = true;
      if (updatedElement && payload.generatedAt) {
        updatedElement.textContent = dateTimeFormatter.format(new Date(payload.generatedAt));
      }
      if (messageElement) {
        messageElement.textContent = "Dati proTcity e fonti ufficiali aggiornati";
      }
      render();
    } catch {
      if (messageElement) {
        messageElement.textContent = officialItems.length
          ? "Fonti ufficiali disponibili; collegamento proTcity in aggiornamento"
          : "Aggiornamenti temporaneamente non disponibili";
      }
    }
  }

  root.querySelectorAll<HTMLButtonElement>("[data-live-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const requested = button.dataset.liveFilter as LiveKind | "all" | undefined;
      if (!requested) return;
      activeFilter = requested;
      root.querySelectorAll<HTMLButtonElement>("[data-live-filter]").forEach((item) => {
        const pressed = item === button;
        item.setAttribute("aria-pressed", String(pressed));
      });
      render();
    });
  });

  render();
  window.setTimeout(() => map.invalidateSize(), 0);
  void refreshProtcity();
  window.setInterval(() => void refreshProtcity(), 60_000);
});
