import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const js = ts.transpileModule(readFileSync('src/scripts/city-hero.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;

function setup({ reduced = false, saveData = false } = {}) {
  class Events {
    listeners = new Map();
    addEventListener(name, callback) { this.listeners.set(name, callback); }
    removeEventListener(name) { this.listeners.delete(name); }
    emit(name, value) { this.listeners.get(name)?.(value); }
  }
  const media = Object.assign(new Events(), { matches: reduced });
  const window = Object.assign(new Events(), { matchMedia: query => query.includes('reduced') ? media : { matches: true } });
  const document = Object.assign(new Events(), { hidden: false });
  const button = Object.assign(new Events(), { dataset: { pauseLabel: 'Pause', resumeLabel: 'Resume' }, attrs: {}, hidden: false, setAttribute(key, value) { this.attrs[key] = value; } });
  const label = { textContent: '' };
  const icon = { textContent: '' };
  const properties = {};
  const hero = Object.assign(new Events(), { dataset: {}, style: { setProperty: (key, value) => properties[key] = value }, querySelector: key => key === '[data-city-pause]' ? button : key === '[data-motion-label]' ? label : icon, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }) });
  let observe;
  let disconnected = false;
  let id = 0;
  const frames = new Map();
  const exports = {};
  const context = vm.createContext({ exports, window, document, navigator: { connection: { saveData } }, performance: { now: () => 0 }, requestAnimationFrame: callback => { frames.set(++id, callback); return id; }, cancelAnimationFrame: id => frames.delete(id), IntersectionObserver: class { constructor(callback) { observe = callback; } observe() {} disconnect() { disconnected = true; } } });
  vm.runInContext(js, context);
  exports.initCityHero(hero);
  return { hero, button, label, window, document, media, frames, observe: value => observe([{ isIntersecting: value }]), disconnected: () => disconnected };
}

test('hero motion pauses offscreen, while hidden and at explicit user request', () => {
  const state = setup();
  assert.equal(state.hero.dataset.motion, 'playing');
  state.observe(false);
  assert.equal(state.hero.dataset.motion, 'paused');
  assert.equal(state.frames.size, 0);
  state.observe(true);
  assert.equal(state.hero.dataset.motion, 'playing');
  state.button.emit('click');
  assert.equal(state.hero.dataset.motion, 'paused');
  assert.equal(state.button.attrs['aria-pressed'], 'true');
  assert.equal(state.label.textContent, 'Resume');
  state.document.hidden = true;
  state.document.emit('visibilitychange');
  state.document.hidden = false;
  state.document.emit('visibilitychange');
  assert.equal(state.hero.dataset.motion, 'paused', 'returning to the tab must not override user pause');
  state.button.emit('click');
  assert.equal(state.hero.dataset.motion, 'playing');
});

test('reduced motion and data saving start with static imagery and no animation frame', () => {
  for (const preference of [{ reduced: true }, { saveData: true }]) {
    const state = setup(preference);
    assert.equal(state.hero.dataset.motion, 'paused');
    assert.equal(state.button.hidden, true);
    assert.equal(state.frames.size, 0);
  }
  const state = setup();
  state.media.matches = true;
  state.media.emit('change');
  assert.equal(state.hero.dataset.motion, 'paused');
  assert.equal(state.frames.size, 0);
});

test('leaving the document releases listeners, observers and scheduled animation work', () => {
  const state = setup();
  state.window.emit('pagehide', { persisted: false });
  assert.equal(state.frames.size, 0);
  assert.equal(state.disconnected(), true);
  assert.equal(state.hero.listeners.size, 0);
  assert.equal(state.document.listeners.size, 0);
  assert.equal(state.media.listeners.size, 0);
});
