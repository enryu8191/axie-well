import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { KeeperCharge, KEEPERS, keeperById } = await load('../src/game/keepers.ts');
const { DropQueue } = await load('../src/game/drops.ts');

test('guest builds offer three abilities and a meaningful same-class tradeoff', () => {
  assert.equal(new Set(KEEPERS.map(k => k.ability)).size, 3);
  const flow = keeperById('aquatic-flow'), scout = keeperById('aquatic-scout');
  assert.equal(flow.axieClass, scout.axieClass);
  assert.notEqual(flow.partId, scout.partId);
  assert.ok(flow.chargeCost < scout.chargeCost);
  assert.equal(flow.extraPreview, false);
  assert.equal(scout.extraPreview, true);
  assert.equal(keeperById('untrusted-input').id, 'plant');
});

test('one starting skill, capped merge charge, and no double spending', () => {
  for (const keeper of KEEPERS) {
    const charge = new KeeperCharge(keeper.chargeCost);
    assert.ok(charge.spend());
    assert.equal(charge.spend(), false);
    for (let i = 0; i < keeper.chargeCost - 1; i++) charge.earn();
    assert.equal(charge.ready, false);
    assert.equal(charge.spend(), false);
    charge.earn();
    assert.ok(charge.ready);
    for (let i = 0; i < 100; i++) charge.earn();
    assert.equal(charge.value, keeper.chargeCost);
    assert.ok(charge.spend());
    assert.equal(charge.value, 0);
  }
});

test('third preview is stable and moves forward exactly as shown across unlocks and swaps', () => {
  let calls = 0;
  const queue = new DropQueue(() => (++calls % 10) / 10);
  for (let i = 0; i < 100; i++) {
    const [a, b, c] = [queue.current, queue.next, queue.afterNext];
    const before = calls;
    for (let frame = 0; frame < 30; frame++) assert.equal(queue.afterNext, c);
    assert.equal(queue.swap(), a !== b);
    assert.deepEqual([queue.current, queue.next, queue.afterNext], [b, a, c]);
    assert.equal(calls, before, 'reading and swapping never roll random drops');
    queue.advance(i > 40 ? 9 : 0);
    assert.equal(queue.current, a);
    assert.equal(queue.next, c);
    assert.equal(calls, before + 1);
  }
});
