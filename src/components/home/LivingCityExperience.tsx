import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import "./living-city-experience.css";

type ExperienceVariant = "hero" | "journey" | "partner" | "guestsafe";
type PartnerMode = "studio" | "municipality" | "business";

type Props = {
  variant: ExperienceVariant;
  appStoreUrl?: string;
  playStoreUrl?: string;
  studioUrl?: string;
};

type SceneProps = {
  phase: number;
  mode: PartnerMode | "guestsafe" | "home";
  paused: boolean;
  active: boolean;
  compact: boolean;
  fullscreen?: boolean;
};

const phases = [
  {
    number: "01",
    eyebrow: "La città si attiva",
    title: "Strade, quartieri e punti utili diventano leggibili.",
    text: "La rete urbana si illumina progressivamente e mette in relazione ciò che accade sul territorio."
  },
  {
    number: "02",
    eyebrow: "Nasce una segnalazione",
    title: "Un punto luminoso porta un nuovo elemento nel contesto.",
    text: "La segnalazione viene rappresentata come un segnale da leggere, verificare e contestualizzare."
  },
  {
    number: "03",
    eyebrow: "Entra in gioco Studio",
    title: "Un contenuto parte dalla regia web e raggiunge l’app.",
    text: "Avvisi, eventi e servizi autorizzati vengono organizzati da Studio e distribuiti al pubblico pertinente."
  },
  {
    number: "04",
    eyebrow: "WalkGuard traccia il percorso",
    title: "La linea ciano attraversa la città e rende visibile il tragitto.",
    text: "Il percorso evita il punto critico evidenziato in rosso e mantiene i controlli essenziali a portata di mano."
  },
  {
    number: "05",
    eyebrow: "L’ecosistema si completa",
    title: "Comuni, attività e GuestSafe diventano nodi della stessa rete.",
    text: "Ogni soggetto conserva ruolo e finalità, mentre le informazioni utili raggiungono la comunità senza mostrare profili individuali."
  },
  {
    number: "06",
    eyebrow: "Una visione condivisa",
    title: "Una piattaforma. Un territorio connesso. Una comunità più consapevole.",
    text: "La telecamera si allontana e le luci della città ricompongono il simbolo proTcity."
  }
] as const;

const partnerModes: Array<{ id: PartnerMode; label: string; title: string; text: string }> = [
  {
    id: "studio",
    label: "Studio",
    title: "Dalla creazione alla notifica",
    text: "Ruoli, calendario, campagne e insight lavorano come moduli collegati alla distribuzione nell’app."
  },
  {
    id: "municipality",
    label: "Comuni ed enti",
    title: "Il territorio comunale in miniatura",
    text: "Il municipio coordina avvisi ed eventi che raggiungono quartieri diversi e rendono visibile l’impatto sulla comunità."
  },
  {
    id: "business",
    label: "Attività commerciali",
    title: "Una campagna che incontra il pubblico giusto",
    text: "L’attività si illumina, la copertura si espande e i risultati restano aggregati, senza esporre persone o percorsi individuali."
  }
];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), {
      rootMargin: "160px"
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, active };
}

function useCompactMode() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px), (max-resolution: 1dppx) and (max-width: 980px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return compact;
}

function useLowPowerDevice() {
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const device = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean };
    };
    const verySmallScreen = window.matchMedia("(max-width: 420px) and (max-resolution: 1dppx)").matches;
    setLowPower(Boolean(device.connection?.saveData) || (device.deviceMemory ?? 8) <= 2 || navigator.hardwareConcurrency <= 2 || verySmallScreen);
  }, []);

  return lowPower;
}

function SceneRig({ phase, mode, paused }: Pick<SceneProps, "phase" | "mode" | "paused">) {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const positions: Array<[number, number, number]> = [
      [10.8, 8.4, 12.8],
      [8.6, 6.4, 10.2],
      [12.3, 7.2, 9.6],
      [7.2, 5.1, 8.1],
      [11.8, 9.1, 14.4],
      [0.2, 14.8, 20.5]
    ];
    const modeOffset = mode === "municipality" ? -1.2 : mode === "business" ? 1.2 : mode === "guestsafe" ? 0.6 : 0;
    const selected = positions[Math.min(phase, positions.length - 1)];
    target.set(
      selected[0] + (paused ? 0 : pointer.x * 0.75) + modeOffset,
      selected[1] + (paused ? 0 : pointer.y * 0.34),
      selected[2]
    );
    camera.position.lerp(target, Math.min(1, delta * 2.4));
    camera.lookAt(0, phase === 5 ? 1.5 : 0.2, 0);
    state.scene.rotation.y = THREE.MathUtils.lerp(
      state.scene.rotation.y,
      paused ? 0 : pointer.x * 0.025,
      Math.min(1, delta * 1.8)
    );
  });

  return null;
}

function RoadNetwork({ phase, paused }: { phase: number; paused: boolean }) {
  const materials = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const roads = useMemo(() => {
    const entries: Array<{ position: [number, number, number]; scale: [number, number, number]; delay: number }> = [];
    [-5, -2.5, 0, 2.5, 5].forEach((offset, index) => {
      entries.push({ position: [0, 0.025, offset], scale: [13.8, 0.035, offset === 0 ? 0.12 : 0.055], delay: index * 0.42 });
      entries.push({ position: [offset, 0.026, 0], scale: [offset === 0 ? 0.12 : 0.055, 0.035, 13.8], delay: index * 0.42 + 0.2 });
    });
    return entries;
  }, []);

  useFrame((state) => {
    materials.current.forEach((material, index) => {
      if (!material) return;
      const wave = paused ? 0.7 : (Math.sin(state.clock.elapsedTime * 1.35 - roads[index].delay) + 1) / 2;
      material.opacity = phase === 0 ? 0.12 + wave * 0.66 : 0.58 + wave * 0.22;
      material.emissiveIntensity = phase === 0 ? 0.35 + wave * 2.2 : 1.3 + wave;
    });
  });

  return (
    <group>
      {roads.map((road, index) => (
        <mesh key={`${road.position.join("-")}-${index}`} position={road.position} scale={road.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            ref={(material: THREE.MeshStandardMaterial | null) => {
              materials.current[index] = material;
            }}
            color="#39bde9"
            emissive="#2fb6eb"
            emissiveIntensity={1.4}
            transparent
            opacity={0.48}
          />
        </mesh>
      ))}
    </group>
  );
}

function CityBuildings({ phase, compact }: { phase: number; compact: boolean }) {
  const group = useRef<THREE.Group>(null);
  const buildings = useMemo(() => {
    let seed = 3719;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const items: Array<{ x: number; z: number; width: number; depth: number; height: number; glow: boolean }> = [];
    const extent = compact ? 5 : 6;
    const step = compact ? 1.6 : 1.35;
    for (let x = -extent; x <= extent; x += step) {
      for (let z = -extent; z <= extent; z += step) {
        if (Math.abs(x) < 0.7 || Math.abs(z) < 0.7) continue;
        if ((x > 2 && x < 3.3) || (z < -2 && z > -3.4)) continue;
        items.push({
          x: x + (random() - 0.5) * 0.18,
          z: z + (random() - 0.5) * 0.18,
          width: step * (0.55 + random() * 0.18),
          depth: step * (0.55 + random() * 0.18),
          height: 0.65 + random() * 2.8,
          glow: random() > 0.72
        });
      }
    }
    return items;
  }, [compact]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const targetScale = phase === 5 ? 0.7 : 1;
    group.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), Math.min(1, delta * 1.5));
    group.current.rotation.y += phase === 5 ? delta * 0.025 : delta * 0.006;
  });

  return (
    <group ref={group}>
      <mesh position={[0, -0.11, 0]}>
        <boxGeometry args={[14.4, 0.18, 14.4]} />
        <meshStandardMaterial color="#06182a" metalness={0.35} roughness={0.72} />
      </mesh>
      {buildings.map((building, index) => {
        const lit = building.glow || phase >= 4;
        return (
          <mesh key={`${building.x}-${building.z}-${index}`} position={[building.x, building.height / 2, building.z]}>
            <boxGeometry args={[building.width, building.height, building.depth]} />
            <meshStandardMaterial
              color={lit ? "#123f59" : "#0a2438"}
              emissive={lit ? "#2ec7f2" : "#071a2a"}
              emissiveIntensity={lit ? (phase >= 4 ? 0.68 : 0.28) : 0.08}
              metalness={0.48}
              roughness={0.48}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function PulsePin({ position, color = "#55ddff", delay = 0 }: { position: [number, number, number]; color?: string; delay?: number }) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime + delay;
    if (group.current) group.current.position.y = position[1] + Math.sin(time * 1.4) * 0.1;
    if (ring.current) {
      const pulse = ((time * 0.42) % 1 + 1) % 1;
      ring.current.scale.setScalar(0.7 + pulse * 1.45);
      const material = ring.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.58 * (1 - pulse);
    }
  });

  return (
    <group ref={group} position={position}>
      <mesh>
        <sphereGeometry args={[0.13, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.025, 0.045, 0.6, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AlertPulse({ visible }: { visible: boolean }) {
  const outer = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!outer.current || !visible) return;
    const pulse = (state.clock.elapsedTime * 0.5) % 1;
    outer.current.scale.setScalar(0.7 + pulse * 2.1);
    const material = outer.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.72 * (1 - pulse);
  });

  if (!visible) return null;
  return (
    <group position={[2.2, 0.16, 0.15]}>
      <mesh>
        <sphereGeometry args={[0.18, 18, 18]} />
        <meshStandardMaterial color="#ff405d" emissive="#ff2748" emissiveIntensity={3.2} />
      </mesh>
      <mesh ref={outer} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.34, 40]} />
        <meshBasicMaterial color="#ff405d" transparent opacity={0.62} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function AnimatedPath({ visible, paused }: { visible: boolean; paused: boolean }) {
  const traveler = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-5.7, 0.16, 0),
        new THREE.Vector3(-3.3, 0.17, -0.2),
        new THREE.Vector3(-1.2, 0.18, 1.2),
        new THREE.Vector3(0.25, 0.19, 2.35),
        new THREE.Vector3(3.2, 0.19, 2.55),
        new THREE.Vector3(5.6, 0.18, 0.3)
      ]),
    []
  );

  useFrame((state) => {
    if (!visible) return;
    const progress = paused ? 0.58 : (state.clock.elapsedTime * 0.09) % 1;
    const point = curve.getPointAt(progress);
    traveler.current?.position.copy(point);
    if (material.current) material.current.emissiveIntensity = 1.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
  });

  if (!visible) return null;
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 96, 0.055, 8, false]} />
        <meshStandardMaterial
          ref={material}
          color="#48ddff"
          emissive="#24c8ff"
          emissiveIntensity={2}
          transparent
          opacity={0.94}
        />
      </mesh>
      <mesh ref={traveler}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#ffffff" emissive="#52e1ff" emissiveIntensity={4} />
      </mesh>
    </group>
  );
}

function TexturedPanel({
  image,
  position,
  rotation,
  size,
  visible,
  glow = "#39c7f2"
}: {
  image: string;
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  visible: boolean;
  glow?: string;
}) {
  const texture = useLoader(THREE.TextureLoader, image);
  const group = useRef<THREE.Group>(null);
  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((state, delta) => {
    if (!group.current) return;
    const target = visible ? 1 : 0.001;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, delta * 3.1));
    group.current.position.y = position[1] + (visible ? Math.sin(state.clock.elapsedTime * 0.7) * 0.08 : -1.2);
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={visible ? 1 : 0.001}>
      <mesh position={[0, 0, -0.07]}>
        <boxGeometry args={[size[0] + 0.18, size[1] + 0.18, 0.13]} />
        <meshStandardMaterial color="#07121f" emissive={glow} emissiveIntensity={0.24} metalness={0.62} roughness={0.34} />
      </mesh>
      <mesh>
        <planeGeometry args={size} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CivicBuilding({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[-0.4, 0, -0.1]}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[2.7, 1.6, 1.8]} />
        <meshStandardMaterial color="#18465c" emissive="#3ac8ee" emissiveIntensity={0.34} metalness={0.42} />
      </mesh>
      <mesh position={[0, 2.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.55, 0.65, 4]} />
        <meshStandardMaterial color="#55d7f8" emissive="#1e9fc9" emissiveIntensity={0.55} />
      </mesh>
      {[-0.85, -0.28, 0.28, 0.85].map((x) => (
        <mesh key={x} position={[x, 0.63, 0.96]}>
          <cylinderGeometry args={[0.085, 0.1, 1.2, 12]} />
          <meshStandardMaterial color="#9bdff3" emissive="#48c8ee" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function HotelBuilding({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current && visible) group.current.position.y = Math.sin(state.clock.elapsedTime * 0.55) * 0.05;
  });
  if (!visible) return null;
  return (
    <group ref={group} position={[-0.5, 0, 0]}>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[3.1, 3.1, 2.2]} />
        <meshStandardMaterial color="#123957" emissive="#1aa6d3" emissiveIntensity={0.32} metalness={0.44} roughness={0.4} />
      </mesh>
      {[-0.92, -0.3, 0.32, 0.94].flatMap((x) =>
        [0.72, 1.42, 2.12].map((y) => (
          <mesh key={`${x}-${y}`} position={[x, y, 1.115]}>
            <planeGeometry args={[0.28, 0.28]} />
            <meshBasicMaterial color="#8ceaff" toneMapped={false} />
          </mesh>
        ))
      )}
      <mesh position={[0, 3.42, 0]}>
        <boxGeometry args={[2.1, 0.34, 0.72]} />
        <meshStandardMaterial color="#52dfff" emissive="#37c9ef" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

function BusinessNode({ visible, paused }: { visible: boolean; paused: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!visible || !ring.current) return;
    const pulse = paused ? 0.55 : (state.clock.elapsedTime * 0.22) % 1;
    ring.current.scale.setScalar(1 + pulse * 4.2);
    const material = ring.current.material as THREE.MeshBasicMaterial;
    material.opacity = 0.58 * (1 - pulse);
  });
  if (!visible) return null;
  return (
    <group position={[0, 0.12, 0]}>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[2.2, 1.7, 1.7]} />
        <meshStandardMaterial color="#16445d" emissive="#4be0ff" emissiveIntensity={0.78} metalness={0.55} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.69, 64]} />
        <meshBasicMaterial color="#5fe2ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function FlowLine({ from, to, color = "#55ddff", delay = 0 }: { from: THREE.Vector3; to: THREE.Vector3; color?: string; delay?: number }) {
  const traveler = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const middle = from.clone().lerp(to, 0.5);
    middle.y += 1.25;
    return new THREE.CatmullRomCurve3([from, middle, to]);
  }, [from, to]);

  useFrame((state) => {
    const progress = (state.clock.elapsedTime * 0.16 + delay) % 1;
    traveler.current?.position.copy(curve.getPointAt(progress));
  });

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 48, 0.025, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.34} />
      </mesh>
      <mesh ref={traveler}>
        <sphereGeometry args={[0.075, 14, 14]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function CitizenFigure({ position, color = "#84e8ff" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.58, 0]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <capsuleGeometry args={[0.1, 0.28, 5, 10]} />
        <meshStandardMaterial color="#17445b" emissive={color} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function NetworkActors({ phase, mode, paused }: { phase: number; mode: SceneProps["mode"]; paused: boolean }) {
  const showNetwork = phase >= 4 || mode !== "home";
  const anchors = useMemo(
    () => [
      new THREE.Vector3(-4.5, 0.3, -3.4),
      new THREE.Vector3(4.3, 0.3, -3.2),
      new THREE.Vector3(-4.2, 0.3, 3.5),
      new THREE.Vector3(4.5, 0.3, 3.2)
    ],
    []
  );

  return (
    <group>
      <CivicBuilding visible={showNetwork && (mode === "municipality" || (mode === "home" && phase >= 4))} />
      <BusinessNode visible={mode === "business"} paused={paused} />
      <HotelBuilding visible={mode === "guestsafe" || (mode === "home" && showNetwork && phase >= 4)} />
      {showNetwork &&
        anchors.map((anchor, index) => (
          <group key={index}>
            <PulsePin position={[anchor.x, 0.72 + index * 0.12, anchor.z]} color={index === 2 ? "#79efc7" : "#61ddff"} delay={index} />
            <FlowLine from={anchor} to={new THREE.Vector3(0, 1.2, 0)} delay={index * 0.22} />
          </group>
        ))}
      {showNetwork && (
        <group aria-label="Cittadini rappresentati in forma anonima">
          <CitizenFigure position={[-2.1, 0.08, -4.2]} />
          <CitizenFigure position={[2.5, 0.08, -3.9]} color="#7aefc8" />
          <CitizenFigure position={[3.35, 0.08, 3.75]} />
        </group>
      )}
    </group>
  );
}

function BrandConstellation({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const entries: Array<[number, number, number, string]> = [];
    for (let x = -2.8; x <= 2.8; x += 0.55) entries.push([x, 4.5, 0, "#51d8ff"]);
    for (let y = 0.2; y <= 4.5; y += 0.48) entries.push([0, y, 0, "#51d8ff"]);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 9) {
      entries.push([Math.cos(angle) * 0.48, -0.35 + Math.sin(angle) * 0.48, 0, "#ff3d5b"]);
    }
    entries.push([0, -1.1, 0, "#ff3d5b"]);
    return entries;
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const target = visible ? 1 : 0.001;
    group.current.scale.lerp(new THREE.Vector3(target, target, target), Math.min(1, delta * 2.2));
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.26) * 0.08;
  });

  return (
    <group ref={group} position={[3.4, 2.25, -1.8]} scale={visible ? 1.05 : 0.001}>
      {points.map(([x, y, z, color], index) => (
        <mesh key={index} position={[x, y, z]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}

function GuestSafeTransfer({ visible }: { visible: boolean }) {
  const qrGroup = useRef<THREE.Group>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    if (!context) return new THREE.CanvasTexture(canvas);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 128, 128);
    context.fillStyle = "#07111e";
    let seed = 81;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const cell = 8;
    for (let y = 1; y < 15; y += 1) {
      for (let x = 1; x < 15; x += 1) {
        if (random() > 0.46) context.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    [[1, 1], [10, 1], [1, 10]].forEach(([x, y]) => {
      context.fillRect(x * cell, y * cell, cell * 4, cell * 4);
      context.fillStyle = "#ffffff";
      context.fillRect((x + 1) * cell, (y + 1) * cell, cell * 2, cell * 2);
      context.fillStyle = "#07111e";
      context.fillRect((x + 1.5) * cell, (y + 1.5) * cell, cell, cell);
    });
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);

  useFrame((state) => {
    if (!visible || !qrGroup.current) return;
    const pulse = (Math.sin(state.clock.elapsedTime * 0.8) + 1) / 2;
    qrGroup.current.rotation.y = -0.3 + pulse * 0.36;
    qrGroup.current.scale.setScalar(0.86 + pulse * 0.12);
  });

  if (!visible) return null;
  return (
    <group>
      <group ref={qrGroup} position={[-4.2, 2.4, 1.1]} rotation={[0.06, -0.2, 0]}>
        <mesh position={[0, 0, -0.07]}>
          <boxGeometry args={[2.25, 2.25, 0.12]} />
          <meshStandardMaterial color="#ffffff" emissive="#59dbff" emissiveIntensity={0.28} />
        </mesh>
        <mesh>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
      <TexturedPanel
        image="/images/app-real/optimized/hotel.png"
        position={[4.15, 2.7, 1.3]}
        rotation={[0.03, 0.34, 0]}
        size={[2.25, 4.65]}
        visible
        glow="#5de9c5"
      />
      <FlowLine from={new THREE.Vector3(-3, 2.4, 1.1)} to={new THREE.Vector3(2.9, 2.7, 1.3)} color="#75efca" />
    </group>
  );
}

function SceneContent({ phase, mode, paused, compact }: SceneProps) {
  const showStudio = mode === "studio" || (mode === "home" && phase >= 2);
  const showPhone = mode === "studio" || (mode === "home" && phase >= 1 && phase < 5);
  const showPins = phase >= 0 && phase < 5;

  return (
    <>
      <color attach="background" args={["#020812"]} />
      <fog attach="fog" args={["#020812", 15, 34]} />
      <ambientLight intensity={0.72} color="#7dcaf0" />
      <directionalLight position={[8, 13, 7]} intensity={1.45} color="#c8efff" />
      <pointLight position={[-7, 5, -5]} intensity={26} distance={17} color="#1abff5" />
      <pointLight position={[7, 4, 5]} intensity={18} distance={14} color="#ff3152" />
      <SceneRig phase={phase} mode={mode} paused={paused} />
      <CityBuildings phase={phase} compact={compact} />
      <RoadNetwork phase={phase} paused={paused} />
      {showPins && (
        <group>
          <PulsePin position={[-4.2, 2.4, -0.2]} delay={0.3} />
          <PulsePin position={[0.2, 3.7, 2.6]} color="#72edc7" delay={1.4} />
          <PulsePin position={[4.25, 2.8, 0.45]} color="#ff5570" delay={2.6} />
        </group>
      )}
      <AlertPulse visible={mode === "municipality" || (mode === "home" && phase >= 1 && phase < 5)} />
      <AnimatedPath visible={mode === "home" && phase >= 3 && phase < 5} paused={paused} />
      <TexturedPanel
        image="/images/app-real/optimized/home-mappa.png"
        position={[4.55, 3.2, 2.15]}
        rotation={[-0.04, -0.46, 0.02]}
        size={[2.35, 4.9]}
        visible={showPhone}
      />
      <TexturedPanel
        image="/images/studio/studio-dashboard.webp"
        position={[-4.2, 3.15, 1.4]}
        rotation={[-0.03, 0.42, -0.02]}
        size={[5.15, 3.2]}
        visible={showStudio && phase < 5}
        glow="#ff4260"
      />
      {showStudio && (mode === "home" || mode === "studio") && phase < 5 && (
        <FlowLine from={new THREE.Vector3(-1.55, 3.1, 1.4)} to={new THREE.Vector3(3.25, 3.2, 2.1)} delay={0.15} />
      )}
      <NetworkActors phase={phase} mode={mode} paused={paused} />
      <GuestSafeTransfer visible={mode === "guestsafe"} />
      <BrandConstellation visible={phase >= 5 && mode === "home"} />
    </>
  );
}

function SceneCanvas(props: SceneProps) {
  const fallback = (
    <div className="lce__fallback" role="img" aria-label="Città digitale proTcity">
      <img src="/images/features/optimized/city-pulse.webp" alt="" />
    </div>
  );

  return (
    <Canvas
      className="lce__canvas"
      camera={{ position: [10.8, 8.4, 12.8], fov: props.fullscreen ? 48 : 52, near: 0.1, far: 80 }}
      dpr={props.compact ? 1 : [1, 1.5]}
      frameloop={props.active && !props.paused ? "always" : "demand"}
      gl={{ antialias: !props.compact, alpha: false, powerPreference: "high-performance" }}
      fallback={fallback}
    >
      <Suspense fallback={null}>
        <SceneContent {...props} />
      </Suspense>
    </Canvas>
  );
}

function MotionButton({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <button className="lce__motion" type="button" onClick={onToggle} aria-pressed={paused}>
      <span aria-hidden="true">{paused ? "▶" : "Ⅱ"}</span>
      {paused ? "Riprendi" : "Pausa"}
    </button>
  );
}

function ExplorationModal({ onClose, compact, reduced }: { onClose: () => void; compact: boolean; reduced: boolean }) {
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(reduced);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setPhase((value) => Math.min(5, value + 1));
      if (event.key === "ArrowLeft") setPhase((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", keydown);
      previousFocus?.focus();
    };
  }, [onClose]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setPhase((value) => (value >= 5 ? 0 : value + 1));
    }, 4200);
    return () => window.clearInterval(timer);
  }, [paused]);

  return createPortal(
    <div className="lce-explore" role="dialog" aria-modal="true" aria-labelledby="lce-explore-title">
      <SceneCanvas phase={phase} mode="home" paused={paused} active compact={compact} fullscreen />
      <div className="lce-explore__shade" aria-hidden="true" />
      <header className="lce-explore__header">
        <span>ESPLORA PROTCITY · 25 SECONDI</span>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Chiudi Esplora proTcity">×</button>
      </header>
      <div className="lce-explore__story">
        <span>{phases[phase].number} · {phases[phase].eyebrow}</span>
        <h2 id="lce-explore-title">{phases[phase].title}</h2>
        <p>{phases[phase].text}</p>
      </div>
      <div className="lce-explore__controls">
        <button type="button" onClick={() => setPhase((value) => Math.max(0, value - 1))} disabled={phase === 0} aria-label="Fase precedente">←</button>
        <button type="button" onClick={() => setPaused((value) => !value)}>{paused ? "Riprendi" : "Pausa"}</button>
        <button type="button" onClick={() => setPhase((value) => Math.min(5, value + 1))} disabled={phase === 5} aria-label="Fase successiva">→</button>
      </div>
      <div className="lce-explore__progress" aria-label={`Fase ${phase + 1} di 6`}>
        {phases.map((item, index) => <i key={item.number} className={index <= phase ? "is-active" : ""} />)}
      </div>
    </div>,
    document.body
  );
}

function HeroExperience({ appStoreUrl, playStoreUrl }: Pick<Props, "appStoreUrl" | "playStoreUrl">) {
  const reduced = useReducedMotion();
  const compact = useCompactMode();
  const { ref, active } = useVisibility<HTMLDivElement>();
  const [paused, setPaused] = useState(false);
  const [exploring, setExploring] = useState(false);

  return (
    <div className="lce lce--hero" ref={ref}>
      <SceneCanvas phase={3} mode="home" paused={paused || reduced} active={active} compact={compact} />
      <div className="lce__vignette" aria-hidden="true" />
      <div className="lce__topline" aria-hidden="true">
        <span><i /> Città attiva</span>
        <span>Studio <b>→</b> app</span>
      </div>
      <div className="lce__float lce__float--alert"><span>SEGNALAZIONE</span><strong>Nuovo contesto locale</strong></div>
      <div className="lce__float lce__float--route"><span>WALKGUARD</span><strong>Percorso in movimento</strong></div>
      <div className="lce__float lce__float--event"><span>EVENTO</span><strong>Una città da vivere</strong></div>
      <div className="lce__float lce__float--service"><span>SERVIZIO</span><strong>Informazione utile vicina</strong></div>
      <div className="lce__stats" aria-label="Elementi rappresentati nella città digitale">
        <div><strong>Live</strong><span>segnali territoriali</span></div>
        <div><strong>1 rete</strong><span>app e Studio</span></div>
        <div><strong>Privacy</strong><span>dati aggregati</span></div>
      </div>
      <div className="lce__actions">
        {!reduced && <MotionButton paused={paused} onToggle={() => setPaused((value) => !value)} />}
        <button className="lce__explore-button" type="button" onClick={() => setExploring(true)}>
          <span aria-hidden="true">◎</span> Esplora proTcity
        </button>
      </div>
      <div className="lce__stores" aria-label="Scarica proTcity">
        {appStoreUrl && <a href={appStoreUrl} target="_blank" rel="noreferrer">iOS</a>}
        {playStoreUrl && <a href={playStoreUrl} target="_blank" rel="noreferrer">Android</a>}
      </div>
      {exploring && <ExplorationModal onClose={() => setExploring(false)} compact={compact} reduced={reduced} />}
    </div>
  );
}

function JourneyExperience() {
  const reduced = useReducedMotion();
  const compact = useCompactMode();
  const { ref, active } = useVisibility<HTMLElement>();
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = section.getBoundingClientRect();
      const travel = Math.max(1, bounds.height - window.innerHeight);
      const progress = Math.max(0, Math.min(0.999, -bounds.top / travel));
      setPhase(Math.min(5, Math.floor(progress * 6)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref]);

  return (
    <section className="lce-journey" ref={ref} aria-labelledby="living-city-journey-title">
      <div className="lce-journey__sticky">
        <SceneCanvas phase={phase} mode="home" paused={paused || reduced} active={active} compact={compact} fullscreen />
        <div className="lce-journey__shade" aria-hidden="true" />
        <div className="lce-journey__brand">
          <span>THE LIVING CITY</span>
          <strong>La città cambia. proTcity la rende visibile.</strong>
        </div>
        <div className="lce-journey__story">
          <span>{phases[phase].number} · {phases[phase].eyebrow}</span>
          <h2 id="living-city-journey-title">{phases[phase].title}</h2>
          <p>{phases[phase].text}</p>
        </div>
        {phase >= 1 && phase <= 4 && (
          <div className="lce-journey__cards" aria-label="Contenuti territoriali rappresentati">
            <span><i /> AVVISO · viabilità locale</span>
            <span><i /> EVENTO · quartiere attivo</span>
            <span><i /> SERVIZIO · punto utile</span>
          </div>
        )}
        {phase === 4 && (
          <div className="lce-journey__metrics" aria-label="Nodi dell’ecosistema proTcity">
            <span>COMUNI</span><span>ATTIVITÀ</span><span>GUESTSAFE</span><span>COMUNITÀ</span>
          </div>
        )}
        {!reduced && <MotionButton paused={paused} onToggle={() => setPaused((value) => !value)} />}
        <div className="lce-journey__rail" aria-label={`Fase ${phase + 1} di 6`}>
          {phases.map((item, index) => (
            <span key={item.number} className={index === phase ? "is-active" : ""}>{item.number}</span>
          ))}
        </div>
        <div className="lce-journey__scroll" aria-hidden="true">SCORRI <i /></div>
      </div>
    </section>
  );
}

function PartnerExperience({ studioUrl }: Pick<Props, "studioUrl">) {
  const reduced = useReducedMotion();
  const compact = useCompactMode();
  const { ref, active } = useVisibility<HTMLDivElement>();
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState<PartnerMode>("studio");

  useEffect(() => {
    if (paused || reduced || !active) return;
    const timer = window.setInterval(() => {
      setMode((value) => value === "studio" ? "municipality" : value === "municipality" ? "business" : "studio");
    }, 5200);
    return () => window.clearInterval(timer);
  }, [paused, reduced, active]);

  const selected = partnerModes.find((item) => item.id === mode) ?? partnerModes[0];
  return (
    <div className="lce lce--partner" ref={ref}>
      <SceneCanvas phase={mode === "studio" ? 2 : 4} mode={mode} paused={paused || reduced} active={active} compact={compact} />
      <div className="lce__vignette" aria-hidden="true" />
      <div className="lce-feature__tabs" role="tablist" aria-label="Scenari proTcity Studio">
        {partnerModes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="lce-feature__copy">
        <span>{selected.label}</span>
        <h3>{selected.title}</h3>
        <p>{selected.text}</p>
        {mode === "business" && <small>Copertura aggregata · nessun profilo individuale</small>}
        {mode === "studio" && studioUrl && <a href={studioUrl} target="_blank" rel="noreferrer">Apri Studio ↗</a>}
      </div>
      {mode === "studio" && (
        <div className="lce-feature__modules" aria-label="Moduli Studio collegati">
          <span>RUOLI</span><span>CALENDARIO</span><span>CAMPAGNE</span><span>INSIGHT</span>
        </div>
      )}
      {mode === "studio" && (
        <div className="lce-studio-flow" aria-label="Flusso di pubblicazione da Studio all’app">
          <span>CREAZIONE</span><i>→</i><span>TERRITORIO</span><i>→</i><span>DESTINATARI</span><i>→</i><span>NOTIFICA</span>
        </div>
      )}
      {!reduced && <MotionButton paused={paused} onToggle={() => setPaused((value) => !value)} />}
    </div>
  );
}

function GuestSafeExperience({ studioUrl }: Pick<Props, "studioUrl">) {
  const reduced = useReducedMotion();
  const compact = useCompactMode();
  const { ref, active } = useVisibility<HTMLDivElement>();
  const [paused, setPaused] = useState(false);

  return (
    <div className="lce lce--guestsafe" ref={ref}>
      <SceneCanvas phase={4} mode="guestsafe" paused={paused || reduced} active={active} compact={compact} />
      <div className="lce__vignette" aria-hidden="true" />
      <div className="lce-feature__copy">
        <span>GUESTSAFE · DAL QR ALL’ESPERIENZA</span>
        <h3>L’hotel accoglie. La città continua il soggiorno.</h3>
        <p>Camera verificata, messaggi, City Guide e servizi locali diventano un’unica esperienza nell’app proTcity.</p>
        {studioUrl && <a href={studioUrl} target="_blank" rel="noreferrer">Gestisci GuestSafe in Studio ↗</a>}
      </div>
      <div className="lce-feature__modules lce-feature__modules--guestsafe" aria-label="Funzioni GuestSafe rappresentate">
        <span>CAMERA VERIFICATA</span><span>MESSAGGI</span><span>CITY GUIDE</span><span>SERVIZI LOCALI</span>
      </div>
      <div className="lce-guestsafe__orbit" aria-hidden="true">
        <span>ATTRAZIONI</span><span>MUSEI</span><span>TRASPORTI</span><span>UTILITY</span>
      </div>
      {!reduced && <MotionButton paused={paused} onToggle={() => setPaused((value) => !value)} />}
    </div>
  );
}

function StaticExperience({ variant, optimized = false }: { variant: ExperienceVariant; optimized?: boolean }) {
  if (optimized && variant === "journey") {
    return (
      <section className="lce-lowpower" aria-labelledby="living-city-fallback-title">
        <img src="/images/features/optimized/city-pulse.webp" alt="Città digitale proTcity collegata a Studio" />
        <div>
          <span>THE LIVING CITY · VERSIONE OTTIMIZZATA</span>
          <h2 id="living-city-fallback-title">Una piattaforma. Un territorio connesso. Una comunità più consapevole.</h2>
          <p>Segnalazioni, Studio, WalkGuard, Comuni, attività e GuestSafe diventano nodi della stessa rete territoriale.</p>
        </div>
      </section>
    );
  }
  return (
    <div className={`lce lce--${variant} lce--static`} aria-label="Esperienza proTcity in caricamento">
      <div className="lce__fallback"><img src="/images/features/optimized/city-pulse.webp" alt="Città digitale proTcity" /></div>
      <div className="lce__loading"><span /> {optimized ? "Esperienza visiva ottimizzata" : "Caricamento esperienza 3D"}</div>
    </div>
  );
}

export default function LivingCityExperience(props: Props) {
  const [mounted, setMounted] = useState(false);
  const lowPower = useLowPowerDevice();
  useEffect(() => setMounted(true), []);
  if (!mounted) return <StaticExperience variant={props.variant} />;
  if (lowPower) return <StaticExperience variant={props.variant} optimized />;

  if (props.variant === "hero") return <HeroExperience appStoreUrl={props.appStoreUrl} playStoreUrl={props.playStoreUrl} />;
  if (props.variant === "journey") return <JourneyExperience />;
  if (props.variant === "partner") return <PartnerExperience studioUrl={props.studioUrl} />;
  return <GuestSafeExperience studioUrl={props.studioUrl} />;
}
