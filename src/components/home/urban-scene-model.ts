/** A fictional neighbourhood, measured in metres. No real location or user data. */
export type FacadeStyle = "limestone" | "plaster" | "brick" | "slate" | "glass";

export type UrbanBuilding = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  style: FacadeStyle;
  pitched: boolean;
  balconies: boolean;
};

export type GroundPoint = readonly [x: number, z: number];

export const WALKING_ROUTE: readonly GroundPoint[] = [
  [-36, 3.92],
  [-3.92, 3.92],
  [-3.92, -28.28],
  [19, -28.28]
];

export const PLACE_LOCATIONS: readonly GroundPoint[] = [
  [10.4, -10.4],
  [19, -28.28],
  [-21, 3.92]
];

export function seededRandom(initialSeed: number) {
  let seed = initialSeed >>> 0;
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function createUrbanBuildings(): UrbanBuilding[] {
  const random = seededRandom(20260915);
  const buildings: UrbanBuilding[] = [];
  const styles: FacadeStyle[] = ["limestone", "plaster", "brick", "slate"];

  for (const x of [-23, -10, 10, 23]) {
    for (const z of [-23, -10, 10, 23]) {
      // The north-east corner opens into a planted civic square.
      if (x === 10 && z === -10) continue;
      const style = styles[Math.floor(random() * styles.length)];
      buildings.push({
        x,
        z,
        width: 9.2 + random() * 0.9,
        depth: 9.3 + random() * 0.7,
        height: z > 0 ? 12.2 + random() * 5.4 : 16 + random() * 7,
        style,
        pitched: style !== "slate",
        balconies: style !== "brick"
      });
    }
  }

  // The surrounding streets continue beyond the central block: this is a
  // neighbourhood within a city, rather than a model on a floating platform.
  for (const offset of [-43, -29, -15, 0, 15, 29, 43]) {
    for (const side of [-1, 1]) {
      buildings.push({
        x: offset,
        z: side * 42,
        width: offset === 0 ? 10 : 10.5 + random() * 1.3,
        depth: 11,
        height: side === -1 ? 18 + random() * 11 : 10 + random() * 7,
        style: offset === 15 && side === -1 ? "glass" : styles[Math.floor(random() * styles.length)],
        pitched: offset !== 15,
        balconies: false
      });
    }
  }
  for (const z of [-17, 0, 17]) {
    for (const side of [-1, 1]) {
      buildings.push({
        x: side * 43,
        z,
        width: 10.5,
        depth: 12,
        height: 13 + random() * 11,
        style: side === -1 && z === -17 ? "glass" : styles[Math.floor(random() * styles.length)],
        pitched: z !== -17,
        balconies: false
      });
    }
  }
  return buildings;
}

export function routeIntersectsBuilding(
  route: readonly GroundPoint[],
  building: UrbanBuilding,
  clearance = 0
): boolean {
  const minX = building.x - building.width / 2 - clearance;
  const maxX = building.x + building.width / 2 + clearance;
  const minZ = building.z - building.depth / 2 - clearance;
  const maxZ = building.z + building.depth / 2 + clearance;
  return route.slice(1).some(([x, z], index) => {
    const [previousX, previousZ] = route[index];
    if (previousX === x) return x > minX && x < maxX && Math.max(previousZ, z) > minZ && Math.min(previousZ, z) < maxZ;
    if (previousZ === z) return z > minZ && z < maxZ && Math.max(previousX, x) > minX && Math.min(previousX, x) < maxX;
    throw new Error("Walking-route validation requires axis-aligned street segments.");
  });
}
