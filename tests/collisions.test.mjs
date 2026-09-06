import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import Engine from '../node_modules/phaser/src/physics/matter-js/lib/core/Engine.js';
import Bodies from '../node_modules/phaser/src/physics/matter-js/lib/factory/Bodies.js';
import Body from '../node_modules/phaser/src/physics/matter-js/lib/body/Body.js';
import Composite from '../node_modules/phaser/src/physics/matter-js/lib/body/Composite.js';
import Events from '../node_modules/phaser/src/physics/matter-js/lib/core/Events.js';

const source = await readFile(new URL('../src/game/collisions.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { isTorsoLayer, ellipseVertices, cornerVertices, mergeScale, PHYSICS_STEP_MS, PIECE_MATERIAL } =
  await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('all four official body shapes are fitted without including patterns or appendages', () => {
  for (const path of ['body-normal/body/plant-04.png', 'body-curly/body-curly/aquatic-04.png',
    'body-fuzzy/body-fuzzy/bug-03.png', 'body-sumo/body-sumo/dawn-03.png']) assert.ok(isTorsoLayer(path));
  for (const path of ['body-sumo/body-pattern/dawn-03.png', 'body-normal/sumo-leg-front-left/dawn-03.png',
    'bird-12-lv2/back/dawn-03.png']) assert.equal(isTorsoLayer(path), false);
});

function world() {
  const engine = Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 6 });
  engine.gravity.y = 1.45;
  const walls = [Bodies.rectangle(66, 675, 44, 990, { isStatic: true }),
    Bodies.rectangle(654, 675, 44, 990, { isStatic: true }),
    Bodies.rectangle(360, 1144, 632, 52, { isStatic: true })];
  for (const [edge, direction] of [[88, 1], [632, -1]]) {
    walls.push(Bodies.fromVertices(edge + direction * 40 / 3, 1118 - 40 / 3,
      cornerVertices(edge, 1118, 40, direction), { isStatic: true }));
  }
  Composite.add(engine.world, walls);
  return engine;
}
function piece(x, y, rx, ry) {
  return Bodies.fromVertices(x, y, ellipseVertices(rx, ry), PIECE_MATERIAL);
}
function step(engine, count) { for (let i = 0; i < count; i++) Engine.update(engine, PHYSICS_STEP_MS); }

test('small fast drops collide with a giant and cannot pass through its body', () => {
  const engine = world();
  const giant = piece(360, 940, 208, 165);
  const egg = piece(360, 220, 19, 24);
  Composite.add(engine.world, [giant, egg]);
  let touched = false;
  Events.on(engine, 'collisionStart', ({ pairs }) => {
    if (pairs.some(p => [p.bodyA.id, p.bodyB.id].includes(egg.id) && [p.bodyA.id, p.bodyB.id].includes(giant.id))) touched = true;
  });
  Body.setVelocity(egg, { x: 0, y: 20 });
  for (let i = 0; i < 600; i++) {
    step(engine, 1);
    const dx = egg.position.x - giant.position.x, dy = egg.position.y - giant.position.y;
    const x = dx * Math.cos(giant.angle) + dy * Math.sin(giant.angle);
    const y = -dx * Math.sin(giant.angle) + dy * Math.cos(giant.angle);
    assert.ok((x / 208) ** 2 + (y / 165) ** 2 > 0.94, 'egg never crosses the giant core');
  }
  assert.ok(touched, 'fast egg should contact the giant');
  assert.ok(egg.bounds.max.y <= 1119, 'egg may roll around the giant but stays above the floor');
  assert.ok(giant.bounds.max.y <= 1119);
});

test('mixed sizes stay inside the jar and settle, including its beveled corners', () => {
  const engine = world();
  const pile = [piece(116, 800, 24, 20), piece(178, 750, 34, 27),
    piece(280, 680, 60, 44), piece(500, 640, 98, 75), piece(360, 380, 120, 85)];
  Composite.add(engine.world, pile);
  step(engine, 1800);
  for (const p of pile) {
    assert.ok(p.bounds.min.x >= 87 && p.bounds.max.x <= 633, 'side containment');
    assert.ok(p.bounds.max.y <= 1119, 'floor containment');
    assert.ok(p.isSleeping || Math.hypot(p.velocity.x, p.velocity.y) < 0.22, 'pile settles');
  }
});

test('a growing merge lifts its neighbor without launching it or losing contact', () => {
  const engine = world();
  const merged = piece(360, 998, 146, 120);
  const neighbor = piece(360, 862, 34, 27);
  Body.scale(merged, mergeScale(0), mergeScale(0));
  Composite.add(engine.world, [merged, neighbor]);
  let scale = mergeScale(0), peakSpeed = 0;
  for (let i = 1; i <= 600; i++) {
    const next = mergeScale(i * PHYSICS_STEP_MS);
    if (next !== scale) {
      Body.scale(merged, next / scale, next / scale);
      scale = next;
    }
    Engine.update(engine, PHYSICS_STEP_MS);
    peakSpeed = Math.max(peakSpeed, Math.hypot(neighbor.velocity.x, neighbor.velocity.y));
  }
  assert.equal(scale, 1);
  assert.ok(peakSpeed < 12, `neighbor peak speed: ${peakSpeed}`);
  assert.ok(neighbor.position.y < merged.position.y);
  assert.ok(merged.bounds.max.y <= 1119);
  assert.ok(neighbor.isSleeping || Math.hypot(neighbor.velocity.x, neighbor.velocity.y) < 0.22);
});

