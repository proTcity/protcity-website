import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync('src/components/home/urban-scene-model.ts', 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const { createUrbanBuildings, WALKING_ROUTE, PLACE_LOCATIONS, routeIntersectsBuilding } =
  await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('the fictional neighbourhood is deterministic and has non-overlapping building footprints', () => {
  const buildings = createUrbanBuildings();
  assert.deepEqual(buildings, createUrbanBuildings());
  assert.ok(buildings.length >= 24 && buildings.length <= 40);
  for (const [index, building] of buildings.entries()) {
    assert.ok(building.height > 8 && building.height < 32);
    for (const other of buildings.slice(index + 1)) {
      const overlapX = Math.abs(building.x - other.x) < (building.width + other.width) / 2;
      const overlapZ = Math.abs(building.z - other.z) < (building.depth + other.depth) / 2;
      assert.ok(!(overlapX && overlapZ), `Overlapping buildings at ${building.x},${building.z} and ${other.x},${other.z}`);
    }
  }
});

test('the complete walking route stays outside all buildings with clearance for its visible width', () => {
  for (const building of createUrbanBuildings()) {
    assert.equal(routeIntersectsBuilding(WALKING_ROUTE, building, 0.25), false,
      `Route enters the building at ${building.x},${building.z}`);
  }
  assert.ok(WALKING_ROUTE.every(point => point.every(Number.isFinite)));
});

test('place markers sit in public space, including the open civic square', () => {
  for (const [x, z] of PLACE_LOCATIONS) {
    for (const building of createUrbanBuildings()) {
      assert.ok(Math.abs(x - building.x) > building.width / 2 + 0.2 ||
        Math.abs(z - building.z) > building.depth / 2 + 0.2);
    }
  }
});

test('the intersection check detects a route through a building and rejects unsupported diagonals', () => {
  const building = createUrbanBuildings()[0];
  assert.equal(routeIntersectsBuilding([[building.x - 20, building.z], [building.x + 20, building.z]], building), true);
  assert.equal(routeIntersectsBuilding([[building.x, building.z - 20], [building.x, building.z + 20]], building), true);
  assert.throws(() => routeIntersectsBuilding([[0, 0], [1, 1]], building), /axis-aligned/);
});
