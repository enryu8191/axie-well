import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/game/audio.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { GardenAudio } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

class Param {
  value = 0;
  setValueAtTime(value) { this.value = value; }
  setTargetAtTime(value) { this.value = value; }
  linearRampToValueAtTime(value) { this.value = value; }
  exponentialRampToValueAtTime(value) { assert.ok(value > 0); this.value = value; }
}
class Node {
  gain = new Param(); frequency = new Param(); threshold = new Param(); ratio = new Param();
  connect() {} disconnect() {} start() {} stop() {}
}
class Context {
  static latest;
  state = 'suspended'; currentTime = 0; destination = new Node();
  constructor() { Context.latest = this; }
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() { return new Node(); }
  createOscillator() { return new Node(); }
  createDynamicsCompressor() { return new Node(); }
}

test('audio unlock, independent mutes, pause, restart, and stale scheduler recovery', async t => {
  const original = globalThis.AudioContext;
  globalThis.AudioContext = Context;
  t.after(() => { globalThis.AudioContext = original; });
  const timers = new Map(); let id = 0;
  t.mock.method(globalThis, 'setInterval', fn => { timers.set(++id, fn); return id; });
  t.mock.method(globalThis, 'clearInterval', key => timers.delete(key));
  const audio = new GardenAudio();
  assert.equal(audio.status().state, 'locked');
  audio.start(); audio.start();
  await Promise.resolve();
  assert.equal(timers.size, 1, 'repeated gestures must not layer music schedulers');
  assert.equal(audio.status().state, 'running');
  assert.ok(audio.status().scheduledNotes > 0);

  audio.configure(true, false);
  const mutedNotes = audio.status().scheduledNotes;
  Context.latest.currentTime = 1;
  [...timers.values()][0]();
  assert.equal(audio.status().scheduledNotes, mutedNotes);
  const before = audio.status().activeVoices;
  audio.play('merge', 4);
  assert.ok(audio.status().activeVoices > before, 'effects remain available with music muted');
  audio.configure(false, true);
  const effectsOff = audio.status().activeVoices;
  audio.play('burst');
  assert.equal(audio.status().activeVoices, effectsOff);
  Context.latest.currentTime = 120;
  [...timers.values()][0]();
  assert.equal(audio.status().scheduledNotes, mutedNotes + 1, 'missed time does not cause an audio burst');

  audio.pause();
  assert.equal(timers.size, 0);
  assert.equal(audio.status().activeVoices, 0);
  audio.start(); audio.pause(true);
  await Promise.resolve();
  assert.equal(timers.size, 0, 'late audio resume must not restart a paused game');
  audio.start();
  await Promise.resolve();
  assert.equal(timers.size, 1);
  assert.ok(audio.status().activeVoices > 0);
  audio.pause(true);
});
