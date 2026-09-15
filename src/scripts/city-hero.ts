/** The image, projected route and labels share gentle camera movement. No scroll capture. */
export function initCityHero(hero: HTMLElement) {
  const button = hero.querySelector<HTMLButtonElement>("[data-city-pause]");
  const label = hero.querySelector<HTMLElement>("[data-motion-label]");
  const icon = hero.querySelector<HTMLElement>("[data-motion-icon]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let visible = true;
  let userPaused = false;
  let running = false;
  let frame = 0;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let previousTime = 0;

  const tick = (now: number) => {
    frame = 0;
    if (!running) return;
    const dt = Math.min((now - previousTime) / 1000 || 0.016, 0.05);
    previousTime = now;
    const ease = 1 - Math.exp(-dt * 3);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    hero.style.setProperty("--city-x", `${x.toFixed(3)}px`);
    hero.style.setProperty("--city-y", `${y.toFixed(3)}px`);
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.03) frame = requestAnimationFrame(tick);
  };
  const requestFrame = () => {
    if (!frame && running) { previousTime = performance.now(); frame = requestAnimationFrame(tick); }
  };
  const update = () => {
    running = visible && !document.hidden && !reduced.matches && !connection?.saveData && !userPaused;
    hero.dataset.motion = running ? "playing" : "paused";
    if (button) {
      button.hidden = reduced.matches || Boolean(connection?.saveData);
      button.setAttribute("aria-pressed", String(userPaused));
      const text = userPaused ? button.dataset.resumeLabel : button.dataset.pauseLabel;
      button.setAttribute("aria-label", text ?? "");
      if (label) label.textContent = text ?? "";
      if (icon) icon.textContent = userPaused ? "▷" : "Ⅱ";
    }
    if (!running && frame) { cancelAnimationFrame(frame); frame = 0; }
    if (running) requestFrame();
  };
  const pointer = (event: PointerEvent) => {
    if (!running || !finePointer.matches || event.pointerType !== "mouse") return;
    const bounds = hero.getBoundingClientRect();
    targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * -16;
    targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * -10;
    requestFrame();
  };
  const leave = () => { targetX = 0; targetY = 0; requestFrame(); };
  const toggle = () => { userPaused = !userPaused; update(); };
  const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); update(); });
  observer.observe(hero);
  hero.addEventListener("pointermove", pointer, { passive: true });
  hero.addEventListener("pointerleave", leave);
  button?.addEventListener("click", toggle);
  reduced.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  update();
  window.addEventListener("pagehide", (event) => {
    if (event.persisted) return;
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    hero.removeEventListener("pointermove", pointer);
    hero.removeEventListener("pointerleave", leave);
    button?.removeEventListener("click", toggle);
    reduced.removeEventListener("change", update);
    document.removeEventListener("visibilitychange", update);
  }, { once: true });
}
