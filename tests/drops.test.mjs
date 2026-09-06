import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

async function loadModule(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
  } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { DropQueue, dropWeights } = await loadModule('../src/game/drops.ts');
const { STAGES, MAX_STAGE } = await loadModule('../src/game/stages.ts');
function seeded(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

test('starts with three weighted choices and expands only at the intended milestones', () => {
  assert.deepEqual([0, 3, 4, 5, 6, 7, 8, 9].map(tier => dropWeights(tier).length), [3, 3, 4, 4, 5, 5, 6, 6]);
  const q = new DropQueue(seeded(42));
  const counts = [0, 0, 0];
  for (let i = 0; i < 20000; i++) { counts[q.current]++; q.advance(0); }
  assert.equal(counts.length, 3);
  assert.ok(counts[0] > counts[1] && counts[1] > counts[2]);
  assert.ok(counts.every(count => count > 2500), `Opening variety: ${counts}`);
});

test('shown next becomes the next actual drop, including across unlocks', () => {
  const q = new DropQueue(seeded(123));
  for (let i = 0; i < 1000; i++) {
    const displayed = q.next;
    const current = q.current;
    for (let frame = 0; frame < 60; frame++) assert.equal(q.current, current);
    q.advance(i < 20 ? 0 : 9);
    assert.equal(q.current, displayed);
  }
});

test('all unlocked drops occur, none are giants, and no streak exceeds three', () => {
  for (const tier of [0, 4, 6, 8, 9]) {
    const q = new DropQueue(seeded(87));
    const seen = new Set();
    let last = -1, streak = 0;
    for (let i = 0; i < 10000; i++) {
      const drop = q.current;
      seen.add(drop);
      assert.ok(drop >= 0 && drop < dropWeights(tier).length);
      streak = drop === last ? streak + 1 : 1;
      assert.ok(streak <= 3);
      last = drop;
      q.advance(tier);
    }
    assert.equal(seen.size, dropWeights(tier).length);
  }
});

test('even repeated RNG values cannot get stuck on one tier; new runs reset the pool', () => {
  const q = new DropQueue(() => 0);
  const drops = [];
  for (let i = 0; i < 12; i++) { drops.push(q.current); q.advance(9); }
  assert.deepEqual(drops.slice(0, 8), [0, 0, 0, 1, 0, 0, 0, 1]);
  const fresh = new DropQueue(() => 0.99999);
  assert.equal(fresh.current, 2);
  assert.equal(fresh.next, 2);
});

test('ten increasing tiers end in a jar-filling titan while still fitting the walls', () => {
  assert.equal(STAGES.length, 10);
  assert.equal(MAX_STAGE, 9);
  assert.equal(new Set(STAGES.map(s => s.title)).size, 10);
  STAGES.forEach((stage, i) => {
    assert.equal(stage.id, i);
    assert.ok(stage.radius * 2 < 544);
    if (i) { assert.ok(stage.radius > STAGES[i - 1].radius); assert.ok(stage.score > STAGES[i - 1].score); }
  });
  assert.ok(STAGES[MAX_STAGE].radius * 2 > 544 * 0.75);
  assert.ok(STAGES[MAX_STAGE].radius * 4 < 1118 - 274);
});
