import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cinematicHome, type HomeLocale } from "../../data/cinematicHome";
import "./cinematic-home.css";

const UrbanScene = lazy(() => import("./CinematicUrbanScene"));

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onUnavailable: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function CinematicCityStory({ lang = "it" }: { lang?: HomeLocale }) {
  const copy = cinematicHome[lang];
  const section = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [compact, setCompact] = useState(true);
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const markUnavailable = useCallback(() => setUnavailable(true), []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 760px)");
    const device = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const update = () => { setReduced(motion.matches); setCompact(small.matches); };
    const visibility = () => setHidden(document.hidden);
    update();
    visibility();
    setHydrated(true);
    if (!motion.matches && !small.matches && !device.connection?.saveData && (device.deviceMemory ?? 8) > 2) setEnabled(true);
    motion.addEventListener("change", update);
    small.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { rootMargin: "80px" });
    if (section.current) observer.observe(section.current);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", update);
      small.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => { if (enabled && active) setMounted(true); }, [enabled, active]);
  const item = copy.steps[step];
  const poster = <img className="city-story__poster" src="/images/home/city-evening-1672.webp" width="1672" height="941" alt="" loading="lazy" decoding="async" />;
  const fallback = <span className="city-story__status">{copy.sceneFallback}</span>;

  return (
    <section className="city-story" id="city-experience" ref={section} aria-labelledby="city-story-title">
      <div className="city-story__intro">
        <div><p className="city-story__eyebrow">{copy.intro}</p><h2 id="city-story-title">{copy.heading}<br /><span>{copy.headingAccent}</span></h2></div>
        <p>{copy.description}</p>
      </div>
      <div className="city-story__stage">
        <div className="city-story__visual" aria-hidden="true">
          {poster}
          {mounted && !unavailable && <SceneBoundary fallback={fallback} onUnavailable={markUnavailable}>
            <Suspense fallback={<span className="city-story__status">{copy.sceneLoading}</span>}>
              <UrbanScene step={step} paused={paused || reduced || hidden} compact={compact} active={active && !hidden} onUnavailable={markUnavailable} />
            </Suspense>
          </SceneBoundary>}
        </div>
        <div className="city-story__topline">
          <span>{copy.illustration}</span>
          {mounted && !unavailable && !reduced && <button className="city-motion-control" type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}><span aria-hidden="true">{paused ? "▷" : "Ⅱ"}</span>{paused ? copy.resume : copy.pause}</button>}
        </div>
        {hydrated && !enabled && <button type="button" className="city-story__activate" onClick={() => setEnabled(true)}>{copy.sceneActivate}<span aria-hidden="true"> ↗</span></button>}
        {unavailable && <span className="city-story__status" role="status">{copy.sceneFallback}</span>}
        <div className="city-story__panel" id="city-story-panel" aria-live="polite" aria-atomic="true">
          <span className="city-story__number">0{step + 1} / 03 · {item.label}</span>
          <h3>{item.title}</h3><p>{item.text}</p><a href={item.link}>{item.action}<span aria-hidden="true">↗</span></a>
        </div>
        <div className="city-story__detail" data-color={item.color}><i aria-hidden="true" />{item.detail}</div>
        <div className="city-story__tabs" role="group" aria-label={copy.stepsLabel}>
          {copy.steps.map((entry, index) => <button type="button" key={entry.icon} aria-pressed={step === index} aria-controls="city-story-panel" onClick={() => setStep(index)}><span>0{index + 1}</span>{entry.label}</button>)}
        </div>
      </div>
      <div className="city-story__caption"><p>{copy.explanation}</p><span>{copy.sceneHint}</span></div>
    </section>
  );
}
