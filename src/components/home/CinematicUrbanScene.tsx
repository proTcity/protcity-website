import { createRoot, events, extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createUrbanBuildings, PLACE_LOCATIONS, seededRandom, WALKING_ROUTE, type FacadeStyle } from "./urban-scene-model";

type Props = { step: number; paused: boolean; active: boolean; compact: boolean; onUnavailable?: () => void };
type Triple = [number, number, number];
type Instance = { position: Triple; scale: Triple; rotation?: Triple; color?: string };
type Layer = {
  name: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  instances: Instance[];
  castShadow?: boolean;
};

const BACKGROUND = "#0b1929";
const PHOTOGRAPH_FACADE = "/images/home/facade-stone.webp";
const STYLES: FacadeStyle[] = ["limestone", "plaster", "brick", "slate", "glass"];
const CAMERA = { position: [48, 39, 57] as Triple, fov: 43, near: 0.4, far: 320 };

function canvasContext(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas is required to prepare the city materials.");
  return { canvas, context };
}

function textureFrom(canvas: HTMLCanvasElement, repeat = 1) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  if (repeat !== 1) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
  }
  return texture;
}

function facadeTextures(style: FacadeStyle) {
  const { canvas, context } = canvasContext(512, 768);
  const { canvas: lightCanvas, context: light } = canvasContext(512, 768);
  const index = STYLES.indexOf(style);
  const random = seededRandom(613 + index * 901);
  const palette = [[184, 177, 157], [185, 165, 136], [124, 88, 74], [150, 160, 166], [71, 93, 109]];
  const [red, green, blue] = palette[index];
  const pixels = context.createImageData(512, 768);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const noise = (random() - 0.5) * 15;
    pixels.data[i] = red + noise;
    pixels.data[i + 1] = green + noise;
    pixels.data[i + 2] = blue + noise;
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  light.fillStyle = "#000000";
  light.fillRect(0, 0, 512, 768);

  // Mortar courses and individually lit, recessed windows give facades scale.
  if (style === "brick") {
    context.strokeStyle = "rgba(207,184,157,.26)";
    context.lineWidth = 1.2;
    for (let row = 0; row < 96; row++) {
      context.beginPath();
      context.moveTo(0, row * 8);
      context.lineTo(512, row * 8);
      for (let x = (row % 2) * 12; x < 512; x += 24) {
        context.moveTo(x, row * 8);
        context.lineTo(x, row * 8 + 8);
      }
      context.stroke();
    }
  }

  for (let floor = 0; floor < 5; floor++) {
    const y = 46 + floor * 118;
    if (style !== "glass") {
      context.fillStyle = "rgba(242,230,204,.24)";
      context.fillRect(0, y + 87, 512, 5);
      context.fillStyle = "rgba(30,34,37,.25)";
      context.fillRect(0, y + 92, 512, 3);
    }
    for (let column = 0; column < 4; column++) {
      const x = 24 + column * 124;
      const width = style === "glass" ? 107 : 69;
      const height = style === "glass" ? 103 : 77;
      const isLit = random() > 0.52;
      context.fillStyle = style === "glass" ? "#485e6b" : "#d3c9b2";
      context.fillRect(x - 5, y - 5, width + 10, height + 11);
      context.fillStyle = "#24343f";
      context.fillRect(x, y, width, height);
      const gradient = context.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, isLit ? "#c8a77a" : "#506777");
      gradient.addColorStop(0.45, isLit ? "#7c6953" : "#283c4c");
      gradient.addColorStop(1, "#172631");
      context.fillStyle = gradient;
      context.fillRect(x + 4, y + 4, width - 8, height - 8);
      if (isLit) {
        const warm = ["#f9d7a0", "#dcb879", "#f3e0b8", "#c7d0ce"][Math.floor(random() * 4)];
        light.fillStyle = warm;
        light.fillRect(x + 5, y + 5, width - 10, height - 10);
        // Curtain edges and a partially lowered blind break up repeated windows.
        context.fillStyle = "rgba(223,207,165,.42)";
        context.fillRect(x + 5, y + 4, 10 + random() * 15, height - 8);
        light.fillStyle = "rgba(0,0,0,.32)";
        light.fillRect(x + 5, y + 5, width - 10, 10 + random() * 22);
      }
      context.fillStyle = style === "glass" ? "#82949d" : "#b6b09e";
      context.fillRect(x + width / 2 - 2, y, 4, height);
      context.fillRect(x, y + height * 0.48, width, 3);
      light.fillStyle = "#000000";
      light.fillRect(x + width / 2 - 2, y, 4, height);
      light.fillRect(x, y + height * 0.48, width, 3);
      context.fillStyle = "rgba(244,242,221,.44)";
      context.fillRect(x + 4, y + 4, 2, height - 8);
      context.fillStyle = "#d8cbb1";
      if (style !== "glass") context.fillRect(x - 8, y + height + 1, width + 16, 7);
    }
  }

  // Stone shop fronts at street level. All architectural details are fictional.
  context.fillStyle = style === "glass" ? "#3b4f5c" : "#8a877b";
  context.fillRect(0, 642, 512, 126);
  context.fillStyle = "#c6bfa9";
  context.fillRect(0, 638, 512, 9);
  for (let bay = 0; bay < 4; bay++) {
    const x = 22 + bay * 126;
    context.fillStyle = "#1c2c35";
    context.fillRect(x, 665, 90, 103);
    context.fillStyle = "#8c8a77";
    context.fillRect(x + 4, 669, 82, 5);
    context.fillRect(x + 42, 669, 4, 99);
    light.fillStyle = bay % 3 === 0 ? "#ab8e60" : "#453e30";
    light.fillRect(x + 5, 675, 80, 79);
    light.fillStyle = "#000000";
    light.fillRect(x + 42, 669, 4, 99);
  }
  return { map: textureFrom(canvas), emissiveMap: textureFrom(lightCanvas) };
}

function surfaceTexture(kind: "asphalt" | "paving" | "roof") {
  const { canvas, context } = canvasContext(256, 256);
  const random = seededRandom(kind === "asphalt" ? 15 : kind === "roof" ? 19 : 21);
  const base = kind === "asphalt" ? 55 : kind === "paving" ? 146 : 85;
  const pixels = context.createImageData(256, 256);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = (random() - 0.5) * (kind === "asphalt" ? 24 : 14);
    pixels.data[i] = base + grain + (kind === "roof" ? 14 : 0);
    pixels.data[i + 1] = base + grain;
    pixels.data[i + 2] = base + grain + (kind === "asphalt" ? 6 : -7);
    pixels.data[i + 3] = 255;
  }
  context.putImageData(pixels, 0, 0);
  if (kind !== "asphalt") {
    const cell = kind === "paving" ? 64 : 32;
    context.strokeStyle = kind === "paving" ? "rgba(52,57,57,.22)" : "rgba(15,26,33,.3)";
    context.lineWidth = 2;
    for (let row = 0; row < 256 / cell; row++) {
      context.beginPath();
      context.moveTo(0, row * cell);
      context.lineTo(256, row * cell);
      for (let x = (row % 2) * cell / 2; x < 256; x += cell) {
        context.moveTo(x, row * cell);
        context.lineTo(x, row * cell + cell);
      }
      context.stroke();
    }
  }
  return textureFrom(canvas, kind === "asphalt" ? 70 : kind === "paving" ? 6 : 3);
}

function wallGeometry() {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const geometry = box.toNonIndexed();
  box.dispose();
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const uv = geometry.getAttribute("uv");
  const output = { position: [] as number[], normal: [] as number[], uv: [] as number[] };
  for (let index = 0; index < positions.count; index++) {
    if (Math.abs(normals.getY(index)) > 0.5) continue;
    output.position.push(positions.getX(index), positions.getY(index), positions.getZ(index));
    output.normal.push(normals.getX(index), normals.getY(index), normals.getZ(index));
    output.uv.push(uv.getX(index), uv.getY(index));
  }
  geometry.dispose();
  const walls = new THREE.BufferGeometry();
  walls.setAttribute("position", new THREE.Float32BufferAttribute(output.position, 3));
  walls.setAttribute("normal", new THREE.Float32BufferAttribute(output.normal, 3));
  walls.setAttribute("uv", new THREE.Float32BufferAttribute(output.uv, 2));
  return walls;
}

function roofGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.5, 0);
  shape.lineTo(0, 1);
  shape.lineTo(0.5, 0);
  shape.closePath();
  const roof = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
  roof.translate(0, 0, -0.5);
  roof.clearGroups();
  return roof;
}

function createResources(facadeSource: THREE.Texture) {
  const textures: THREE.Texture[] = [];
  const materials: THREE.Material[] = [];
  const standard = (parameters: THREE.MeshStandardMaterialParameters) => {
    const material = new THREE.MeshStandardMaterial(parameters);
    materials.push(material);
    return material;
  };
  const facade = Object.fromEntries(STYLES.map((style) => {
    if (style !== "glass") {
      const photograph = facadeSource.clone();
      photograph.colorSpace = THREE.SRGBColorSpace;
      photograph.anisotropy = 8;
      photograph.needsUpdate = true;
      textures.push(photograph);
      return [style, standard({
        map: photograph,
        color: { limestone: "#eee7dc", plaster: "#d9c3a8", brick: "#caa28c", slate: "#c0c8cd" }[style],
        // The same image preserves the correspondence of lit interiors and
        // windows. An unrelated procedural emission grid would slide over it.
        emissiveMap: photograph,
        emissive: "#ffffff",
        emissiveIntensity: 0.085,
        roughness: 0.88,
        metalness: 0.025,
        envMapIntensity: 0.35
      })];
    }
    const maps = facadeTextures(style);
    textures.push(maps.map, maps.emissiveMap);
    return [style, standard({
      ...maps,
      bumpMap: style === "glass" ? null : maps.map,
      bumpScale: 0.025,
      emissive: "#ffffff",
      emissiveIntensity: 0.42,
      roughness: style === "glass" ? 0.2 : 0.88,
      metalness: style === "glass" ? 0.58 : 0.025,
      envMapIntensity: style === "glass" ? 1.15 : 0.35
    })];
  })) as Record<FacadeStyle, THREE.MeshStandardMaterial>;
  const asphalt = surfaceTexture("asphalt");
  const paving = surfaceTexture("paving");
  const roof = surfaceTexture("roof");
  textures.push(asphalt, paving, roof);

  const { canvas: glowCanvas, context: glowContext } = canvasContext(128, 128);
  const gradient = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(250,202,128,.30)");
  gradient.addColorStop(0.35, "rgba(238,181,93,.12)");
  gradient.addColorStop(1, "rgba(225,155,65,0)");
  glowContext.fillStyle = gradient;
  glowContext.fillRect(0, 0, 128, 128);
  const glowTexture = textureFrom(glowCanvas);
  textures.push(glowTexture);
  const glow = new THREE.MeshBasicMaterial({ map: glowTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  materials.push(glow);

  const crown = new THREE.IcosahedronGeometry(1, 2);
  const crownPositions = crown.getAttribute("position");
  for (let index = 0; index < crownPositions.count; index++) {
    const x = crownPositions.getX(index);
    const y = crownPositions.getY(index);
    const z = crownPositions.getZ(index);
    const distortion = 1 + Math.sin(x * 9 + y * 7) * Math.cos(z * 8 - y * 3) * 0.1;
    crownPositions.setXYZ(index, x * distortion, y * distortion, z * distortion);
  }
  crown.computeVertexNormals();

  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    walls: wallGeometry(),
    roof: roofGeometry(),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 8),
    crown,
    head: new THREE.SphereGeometry(1, 8, 6),
    torso: new THREE.CapsuleGeometry(0.18, 0.55, 3, 6),
    plane: new THREE.PlaneGeometry(1, 1),
    ground: new THREE.PlaneGeometry(450, 450)
  };
  return {
    geometries,
    facade,
    asphalt: standard({ map: asphalt, roughness: 0.83, metalness: 0.04 }),
    pavement: standard({ map: paving, roughness: 0.95 }),
    stone: standard({ color: "#b0ada0", roughness: 0.9 }),
    roof: standard({ map: roof, roughness: 0.84 }),
    roofFlat: standard({ color: "#4b5357", roughness: 0.86 }),
    metal: standard({ color: "#3e4d50", metalness: 0.58, roughness: 0.48 }),
    wood: standard({ color: "#655b42", roughness: 0.89 }),
    foliage: standard({ color: "#ffffff", roughness: 0.93 }),
    paint: standard({ color: "#bbb8a3", roughness: 0.93 }),
    car: standard({ color: "#ffffff", roughness: 0.33, metalness: 0.4 }),
    glass: standard({ color: "#233b49", roughness: 0.2, metalness: 0.72 }),
    rubber: standard({ color: "#17202a", roughness: 0.95 }),
    people: standard({ color: "#ffffff", roughness: 0.86 }),
    lamp: standard({ color: "#fff0c4", emissive: "#ffd19a", emissiveIntensity: 2.5, roughness: 0.45 }),
    glow,
    dispose() {
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      Object.values(geometries).forEach((geometry) => geometry.dispose());
    }
  };
}

type Resources = ReturnType<typeof createResources>;

function createNeighbourhood(resources: Resources, compact: boolean) {
  const layers: Layer[] = [];
  const batch = (name: string, geometry: THREE.BufferGeometry, material: THREE.Material, castShadow = true) => {
    const layer: Layer = { name, geometry, material, instances: [], castShadow };
    layers.push(layer);
    return (position: Triple, scale: Triple, rotation?: Triple, color?: string) => layer.instances.push({ position, scale, rotation, color });
  };
  const { box, walls, roof, cylinder, crown, head, torso, plane } = resources.geometries;
  const facades = Object.fromEntries(STYLES.map((style) => [style, batch(style, walls, resources.facade[style])])) as Record<FacadeStyle, ReturnType<typeof batch>>;
  const pitched = batch("pitched roofs", roof, resources.roof);
  const flat = batch("flat roofs", box, resources.roofFlat);
  const trim = batch("stone detailing", box, resources.stone);
  const rail = batch("balcony ironwork", box, resources.metal);
  const timber = batch("benches and awnings", box, resources.wood);
  const paving = batch("paved blocks", box, resources.pavement, false);
  const markings = batch("road markings", box, resources.paint, false);
  const trunk = batch("tree trunks", cylinder, resources.wood);
  const leaves = batch("tree canopies", crown, resources.foliage);
  const lampPole = batch("street furniture", cylinder, resources.metal);
  const lampLight = batch("warm street lights", box, resources.lamp, false);
  const lampGlow = batch("street light pools", plane, resources.glow, false);
  const carBody = batch("parked cars", box, resources.car);
  const carGlass = batch("car windows", box, resources.glass);
  const wheels = batch("car wheels", cylinder, resources.rubber);
  const personBody = batch("pedestrian coats", torso, resources.people);
  const personHead = batch("pedestrians", head, resources.people);
  const random = seededRandom(7201);

  for (const building of createUrbanBuildings()) {
    const { x, z, width, depth, style } = building;
    const photographed = style !== "glass";
    // The photograph contains four residential floors above a retail floor.
    // Preserve its architectural proportions rather than stretching it into a tower.
    const height = photographed ? width * 1.55 : building.height;
    facades[style]([x, height / 2 + 0.19, z], [width, height, depth]);
    flat([x, height + 0.2, z], [width + 0.16, 0.22, depth + 0.16]);
    trim([x, height + 0.12, z], [width + 0.48, 0.32, depth + 0.48]);
    if (!photographed) trim([x, 2.95, z], [width + 0.12, 0.15, depth + 0.12]);
    if (building.pitched) {
      pitched([x, height + 0.33, z], [width + 0.6, 1.6, depth + 0.6]);
      trim([x + width * 0.25, height + 1.15, z - depth * 0.22], [0.55, 2, 0.65]);
      flat([x + width * 0.25, height + 2.15, z - depth * 0.22], [0.75, 0.15, 0.85]);
    } else {
      flat([x - width * 0.15, height + 0.85, z], [width * 0.3, 1.35, depth * 0.27]);
      for (let panel = 0; panel < 3; panel++) {
        carGlass([x + width * 0.25, height + 0.7, z + panel * 1.2 - 1.2], [2.2, 0.1, 0.95], [-0.22, 0, 0]);
      }
    }
    if (Math.abs(z) < 30) {
      const front = z > 0 ? -1 : 1;
      // Photographic balcony bases align with the four actual floors in the
      // source image. Their projecting slabs create real parallax and shadows.
      for (let floor = 1; floor <= 4; floor++) {
        const y = height * (photographed ? [0.262, 0.45, 0.637, 0.817][floor - 1] : 0.16 + floor * 0.154) + 0.19;
        for (let column = 0; column < 4; column++) {
          const localX = photographed ? [-0.371, -0.124, 0.114, 0.379][column] * width : (column - 1.5) * width * 0.242;
          if (!photographed) trim([x + localX, y, z + front * (depth / 2 + 0.09)], [width * 0.165, 0.11, 0.24]);
          if (building.balconies && column % 2 === (photographed ? 1 : 0) && floor < 4 && !compact) {
            const edge = z + front * (depth / 2 + 0.68);
            trim([x + localX, y, z + front * (depth / 2 + 0.38)], [1.9, 0.14, 0.82]);
            rail([x + localX, y + 0.83, edge], [1.85, 0.065, 0.065]);
            rail([x + localX, y + 0.23, edge], [1.85, 0.045, 0.045]);
            for (let bar = -2; bar <= 2; bar++) rail([x + localX + bar * 0.42, y + 0.48, edge], [0.038, 0.75, 0.038]);
          }
        }
      }
      if (!photographed) timber([x, 2.7, z + front * (depth / 2 + 0.52)], [width * 0.6, 0.13, 1.2], [front * -0.15, 0, 0]);
    }
  }

  for (const x of [-16, 16]) {
    for (const z of [-16, 16]) {
      paving([x, 0.075, z], [24.6, 0.2, 24.6]);
      // Pale kerbstones catch grazing light around each real street block.
      trim([x - 12.3, 0.14, z], [0.16, 0.22, 24.6]);
      trim([x + 12.3, 0.14, z], [0.16, 0.22, 24.6]);
      trim([x, 0.14, z - 12.3], [24.6, 0.22, 0.16]);
      trim([x, 0.14, z + 12.3], [24.6, 0.22, 0.16]);
    }
  }
  for (const side of [-1, 1]) {
    paving([side * 43, 0.04, 0], [15, 0.15, 97]);
    paving([0, 0.04, side * 43], [71, 0.15, 15]);
  }
  for (let offset = -68; offset <= 68; offset += 5) {
    if (Math.abs(offset) < 7 || Math.abs(Math.abs(offset) - 31) < 5) continue;
    markings([0, 0.019, offset], [0.09, 0.015, 2.1]);
    markings([offset, 0.019, 0], [2.1, 0.015, 0.09]);
  }
  for (const sign of [-1, 1]) {
    for (let line = -2; line <= 2; line++) {
      markings([line * 1.1, 0.022, sign * 5.7], [0.57, 0.019, 1.8]);
      markings([sign * 5.7, 0.022, line * 1.1], [1.8, 0.019, 0.57]);
    }
  }

  const tree = (x: number, z: number, size = 1) => {
    trunk([x, 1.8 * size, z], [0.15 * size, 3.6 * size, 0.15 * size]);
    const shades = ["#405e46", "#4e674a", "#65784e", "#3b5644"];
    for (let cluster = 0; cluster < 5; cluster++) {
      const angle = cluster * 2.399;
      leaves([x + Math.cos(angle) * size * 0.9, (3.8 + random() * 0.65) * size, z + Math.sin(angle) * size * 0.9],
        [size * (1.15 + random() * 0.4), size * (1.3 + random() * 0.4), size * (1 + random() * 0.35)],
        [random() * 0.3, random() * 6, 0], shades[cluster % shades.length]);
    }
    trim([x, 0.18, z], [1.8 * size, 0.22, 1.8 * size]);
  };
  for (const side of [-1, 1]) {
    for (const offset of [-24, -16, -8, 9, 18, 26]) tree(side * 3.15, offset, 0.75 + random() * 0.2);
    for (const offset of [-24, -14, 14, 24]) tree(offset, side * 3.15, 0.78);
  }
  for (const [x, z] of [[8, -8], [14, -7], [8, -15], [15, -15]] as const) tree(x, z, 1);
  // Square benches, low planting beds and people provide a familiar human scale.
  for (const [x, z] of [[8, -12], [13, -12], [10.5, -5.2]] as const) {
    timber([x, 0.62, z], [2.4, 0.16, 0.54]);
    timber([x, 1.03, z - 0.24], [2.4, 0.55, 0.1], [-0.08, 0, 0]);
    rail([x - 0.85, 0.3, z], [0.1, 0.55, 0.5]);
    rail([x + 0.85, 0.3, z], [0.1, 0.55, 0.5]);
  }
  const lamp = (x: number, z: number, rotation = 0) => {
    lampPole([x, 2.2, z], [0.055, 4.4, 0.055]);
    rail([x + Math.cos(rotation) * 0.32, 4.33, z + Math.sin(rotation) * 0.32], [0.7, 0.07, 0.09], [0, -rotation, 0]);
    lampLight([x + Math.cos(rotation) * 0.6, 4.27, z + Math.sin(rotation) * 0.6], [0.42, 0.085, 0.22], [0, -rotation, 0]);
    lampGlow([x + Math.cos(rotation) * 0.7, 0.21, z + Math.sin(rotation) * 0.7], [8, 8, 1], [-Math.PI / 2, 0, 0]);
  };
  for (const offset of [-24, -12, 12, 24]) {
    lamp(-3.32, offset);
    lamp(3.32, offset, Math.PI);
    lamp(offset, -3.32, Math.PI / 2);
    lamp(offset, 3.32, -Math.PI / 2);
  }
  const carColors = ["#b7b5a7", "#4b6676", "#a5917b", "#576466", "#bbbcb5", "#645555"];
  for (const side of [-1, 1]) {
    for (const offset of [-23, -12, 13, 24]) {
      const x = side * 2.5;
      const z = offset;
      carBody([x, 0.56, z], [1.48, 0.6, 3.7], undefined, carColors[Math.floor(random() * carColors.length)]);
      carGlass([x, 1.03, z - 0.22], [1.3, 0.56, 1.95]);
      carBody([x, 1.35, z - 0.22], [1.29, 0.065, 1.68], undefined, "#899598");
      for (const wheelX of [-0.76, 0.76]) {
        for (const wheelZ of [-1.14, 1.14]) wheels([x + wheelX, 0.36, z + wheelZ], [0.29, 0.19, 0.29], [0, 0, Math.PI / 2]);
      }
    }
  }
  const pedestrians: Array<[number, number]> = [[-3.9, -16], [-4, 12], [3.9, 17], [-14, 3.9], [17, -3.9], [11, -11], [12, -11.5], [7, -5], [-12, -28.5], [21, 3.9]];
  pedestrians.forEach(([x, z], index) => {
    personBody([x, 0.94, z], [1, 1, 1], undefined, ["#a2997e", "#5a7281", "#907366", "#c6b89b"][index % 4]);
    personHead([x, 1.65, z], [0.135, 0.16, 0.135], undefined, "#bca48e");
    rail([x - 0.11, 0.4, z], [0.1, 0.62, 0.11]);
    rail([x + 0.11, 0.4, z], [0.1, 0.62, 0.11]);
  });
  return layers.filter((layer) => layer.instances.length);
}

function InstanceLayer({ layer }: { layer: Layer }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const object = new THREE.Object3D();
    const color = new THREE.Color();
    layer.instances.forEach((instance, index) => {
      object.position.set(...instance.position);
      object.scale.set(...instance.scale);
      object.rotation.set(...(instance.rotation ?? [0, 0, 0]));
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
      mesh.setColorAt(index, color.set(instance.color ?? "#ffffff"));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [layer]);
  return <instancedMesh ref={ref} args={[layer.geometry, layer.material, layer.instances.length]} castShadow={layer.castShadow} receiveShadow dispose={null} />;
}

function UrbanArchitecture({ compact }: Pick<Props, "compact">) {
  const facadeSource = useLoader(THREE.TextureLoader, PHOTOGRAPH_FACADE);
  const resources = useMemo(() => createResources(facadeSource), [facadeSource]);
  const layers = useMemo(() => createNeighbourhood(resources, compact), [resources, compact]);
  useEffect(() => () => {
    resources.dispose();
    facadeSource.dispose();
    useLoader.clear(THREE.TextureLoader, PHOTOGRAPH_FACADE);
  }, [resources, facadeSource]);
  return (
    <group dispose={null}>
      <mesh geometry={resources.geometries.ground} material={resources.asphalt} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow />
      {layers.map((layer) => <InstanceLayer key={layer.name} layer={layer} />)}
    </group>
  );
}

function RouteAndPlaces({ step, paused, active }: Omit<Props, "compact">) {
  const moving = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  const route = useMemo(() => {
    const curve = new THREE.CurvePath<THREE.Vector3>();
    WALKING_ROUTE.slice(1).forEach(([x, z], index) => {
      const [previousX, previousZ] = WALKING_ROUTE[index];
      curve.add(new THREE.LineCurve3(new THREE.Vector3(previousX, 0.31, previousZ), new THREE.Vector3(x, 0.31, z)));
    });
    return curve;
  }, []);
  const routeGeometry = useMemo(() => new THREE.TubeGeometry(route, 120, 0.22, 8, false), [route]);
  useEffect(() => () => routeGeometry.dispose(), [routeGeometry]);
  const point = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    if (paused || !active) return;
    elapsed.current += Math.min(delta, 0.05);
    if (moving.current) {
      route.getPointAt((elapsed.current * 0.065 + 0.18) % 1, point);
      moving.current.position.copy(point);
      moving.current.position.y = 0.55;
    }
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(elapsed.current * 1.35) * 0.1);
  });
  return (
    <group>
      <group visible={step === 1}>
        <mesh geometry={routeGeometry}>
          <meshBasicMaterial color="#69dded" toneMapped={false} />
        </mesh>
        <mesh ref={moving} position={[-20, 0.55, 3.92]}>
          <sphereGeometry args={[0.36, 14, 12]} />
          <meshBasicMaterial color="#f0ffff" toneMapped={false} />
        </mesh>
        {[WALKING_ROUTE[0], WALKING_ROUTE[WALKING_ROUTE.length - 1]].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 0.32, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.58, 0.76, 36]} />
            <meshBasicMaterial color="#8aeeef" side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <group visible={step === 0} position={[-12, 0.33, 3.92]}>
        <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.2, 48]} />
          <meshBasicMaterial color="#eab477" transparent opacity={0.85} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 2.1, 8]} />
          <meshBasicMaterial color="#eac394" toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.3, 0]}>
          <octahedronGeometry args={[0.38]} />
          <meshBasicMaterial color="#ffe0ab" toneMapped={false} />
        </mesh>
      </group>
      <group visible={step === 2}>
        {PLACE_LOCATIONS.map(([x, z], index) => (
          <group key={`${x}-${z}`} position={[x, 0.32, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.05, 1.22, 40]} />
              <meshBasicMaterial color={index === 1 ? "#e8bf83" : "#81dcd0"} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            <mesh position={[0, 1, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 1.9, 8]} />
              <meshBasicMaterial color="#9cdace" toneMapped={false} />
            </mesh>
            <mesh position={[0, 2.15, 0]}>
              <sphereGeometry args={[0.26, 12, 10]} />
              <meshBasicMaterial color={index === 1 ? "#e8bf83" : "#b4e6d8"} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

const VIEWS = [
  { camera: [48, 39, 57] as Triple, target: [0, 4, -3] as Triple },
  { camera: [8, 21, 36] as Triple, target: [-5, 1.6, -14] as Triple },
  { camera: [28, 23, 31] as Triple, target: [7, 2.5, -9] as Triple }
];

function CameraRig({ step, paused, active, compact }: Props) {
  const { camera, pointer, invalidate, size } = useThree();
  const time = useRef(0);
  const initialized = useRef(false);
  const previousStep = useRef(step);
  const lookAt = useMemo(() => new THREE.Vector3(...VIEWS[0].target), []);
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(), []);
  const selected = VIEWS[Math.max(0, Math.min(2, step))];

  useLayoutEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      // An off-axis composition leaves space for the desktop story panel while
      // keeping the street itself in natural, undistorted perspective.
      camera.setViewOffset(size.width, size.height, compact ? 0 : -size.width * 0.13, 0, size.width, size.height);
      camera.updateProjectionMatrix();
    }
  }, [camera, compact, size.width, size.height]);

  useEffect(() => {
    // Reduced motion still honours an explicit step change, without any tween.
    if (!initialized.current || (paused && previousStep.current !== step)) {
      camera.position.set(...selected.camera);
      if (compact && step !== 1) camera.position.multiplyScalar(1.18);
      lookAt.set(...selected.target);
      camera.lookAt(lookAt);
      initialized.current = true;
    }
    previousStep.current = step;
    if (active) invalidate();
  }, [camera, compact, selected, step, paused, active, invalidate, lookAt]);

  useFrame((_, delta) => {
    if (paused || !active) return;
    const dt = Math.min(delta, 0.05);
    time.current += dt;
    const travel = time.current * 0.075;
    targetPosition.set(...selected.camera);
    if (compact && step !== 1) targetPosition.multiplyScalar(1.18);
    const sway = step === 1 ? 0.42 : 1.3;
    targetPosition.x += Math.sin(travel) * sway + pointer.x * 0.55;
    targetPosition.z += Math.cos(travel) * sway;
    targetPosition.y += Math.sin(travel * 0.8) * 0.3 + pointer.y * 0.24;
    targetLookAt.set(...selected.target);
    const blend = 1 - Math.exp(-dt * 1.8);
    camera.position.lerp(targetPosition, blend);
    lookAt.lerp(targetLookAt, blend);
    camera.lookAt(lookAt);
  });
  return null;
}

function RendererLifecycle({ compact }: Pick<Props, "compact">) {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    // Geometry and light positions are static. Reusing the shadow map avoids
    // drawing the whole neighbourhood a second time for every camera frame.
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [gl, compact, invalidate]);
  useEffect(() => {
    const room = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(gl);
    const environment = (() => {
      try { return generator.fromScene(room, 0.065); }
      finally {
        room.dispose();
        generator.dispose();
      }
    })();
    const previousEnvironment = scene.environment;
    const previousIntensity = scene.environmentIntensity;
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.35;
    invalidate();
    return () => {
      scene.environment = previousEnvironment;
      scene.environmentIntensity = previousIntensity;
      environment.dispose();
    };
  }, [gl, scene, invalidate]);
  return null;
}

function Scene({ onReady, ...props }: Props & { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return (
    <>
      <color attach="background" args={[BACKGROUND]} />
      <fog attach="fog" args={[BACKGROUND, 65, 150]} />
      <hemisphereLight color="#8eaec9" groundColor="#3a332d" intensity={0.76} />
      <directionalLight position={[-32, 48, -22]} color="#d9c7af" intensity={1.75} castShadow
        shadow-mapSize-width={props.compact ? 1024 : 2048} shadow-mapSize-height={props.compact ? 1024 : 2048}
        shadow-camera-left={-65} shadow-camera-right={65} shadow-camera-top={65} shadow-camera-bottom={-65}
        shadow-camera-near={1} shadow-camera-far={145} shadow-normalBias={0.08} shadow-bias={-0.0002} />
      <directionalLight position={[24, 12, 28]} color="#e1b383" intensity={0.24} />
      <pointLight position={[7, 5, -9]} color="#ffd0a0" intensity={38} distance={17} decay={2} />
      <UrbanArchitecture compact={props.compact} />
      <RouteAndPlaces step={props.step} paused={props.paused} active={props.active} />
      <CameraRig {...props} />
      <RendererLifecycle compact={props.compact} />
    </>
  );
}

class SceneBoundary extends Component<{ onUnavailable: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onUnavailable(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function CinematicUrbanScene(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latestProps = useRef(props);
  const updateScene = useRef<(() => void) | null>(null);
  latestProps.current = props;

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    // R3F Canvas runs configure() asynchronously without a rejection handler.
    // Owning the canvas lets us catch WebGL construction synchronously, then
    // explicitly handle every configure rejection before it reaches the page.
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%;opacity:0;touch-action:pan-y";
    canvas.setAttribute("aria-hidden", "true");
    element.appendChild(canvas);
    let disposed = false;
    let failed = false;
    let renderer: THREE.WebGLRenderer;
    const unavailable = () => {
      if (disposed || failed) return;
      failed = true;
      canvas.style.opacity = "0";
      latestProps.current.onUnavailable?.();
    };
    const attributes: WebGLContextAttributes = { antialias: true, alpha: true, powerPreference: "low-power" };
    const context = (() => {
      try { return canvas.getContext("webgl2", attributes); }
      catch { return null; }
    })();
    if (!context) {
      unavailable();
      canvas.remove();
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({ canvas, context, ...attributes });
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(BACKGROUND, 0);
    } catch {
      unavailable();
      context.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
      return;
    }
    extend({
      Group: THREE.Group,
      Mesh: THREE.Mesh,
      InstancedMesh: THREE.InstancedMesh,
      CylinderGeometry: THREE.CylinderGeometry,
      SphereGeometry: THREE.SphereGeometry,
      RingGeometry: THREE.RingGeometry,
      OctahedronGeometry: THREE.OctahedronGeometry,
      MeshBasicMaterial: THREE.MeshBasicMaterial,
      Color: THREE.Color,
      Fog: THREE.Fog,
      HemisphereLight: THREE.HemisphereLight,
      DirectionalLight: THREE.DirectionalLight,
      PointLight: THREE.PointLight
    });
    const root = createRoot(canvas);
    const ready = () => { if (!disposed && !failed) canvas.style.opacity = "1"; };
    const lost = () => unavailable();
    canvas.addEventListener("webglcontextlost", lost);
    let requested = false;
    let configuring = false;
    const update = () => {
      if (disposed || failed) return;
      requested = true;
      if (configuring) return;
      configuring = true;
      const configure = async () => {
        while (requested && !disposed && !failed) {
          requested = false;
          const current = latestProps.current;
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;
          await root.configure({
            gl: renderer,
            events,
            camera: CAMERA,
            size: { width: rect.width, height: rect.height, top: rect.top, left: rect.left },
            dpr: current.compact ? [1, 1.25] : [1, 1.65],
            shadows: { type: THREE.PCFShadowMap },
            frameloop: current.active ? current.paused ? "demand" : "always" : "never"
          });
          if (disposed || failed) return;
          root.render(
            <SceneBoundary onUnavailable={unavailable}>
              <Suspense fallback={null}>
                <Scene {...current} onReady={ready} />
              </Suspense>
            </SceneBoundary>
          );
        }
      };
      void configure().catch(unavailable).finally(() => {
        configuring = false;
        if (requested && !disposed && !failed) update();
      });
    };
    updateScene.current = update;
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => {
      disposed = true;
      updateScene.current = null;
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      root.unmount();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  useEffect(() => {
    updateScene.current?.();
  }, [props.step, props.paused, props.active, props.compact]);

  return <div ref={host} style={{ width: "100%", height: "100%", overflow: "hidden" }} />;
}
