const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const elements = new Map();
const handlers = new Map();
let rect = {left: 0, top: 0, width: 960, height: 608};
let nextFrame;
let now = 0;
const noOp = () => {};
const context2d = new Proxy({}, {get: (target, key) => target[key] || noOp});
const canvas = {
  getContext: () => context2d,
  getBoundingClientRect: () => rect,
  setPointerCapture: noOp,
  addEventListener: (name, fn) => handlers.set(name, fn)
};
function element(id) {
  if (id === 'game') return canvas;
  if (!elements.has(id)) elements.set(id, {
    textContent: '', disabled: false, style: {},
    firstElementChild: {style: {}},
    classList: {add: noOp, remove: noOp, toggle: noOp},
    click() { this.onclick?.(); }
  });
  return elements.get(id);
}
const document = {getElementById: element, addEventListener: noOp};
const sandbox = {document, Math, Int16Array, setTimeout: noOp, clearTimeout: noOp,
  requestAnimationFrame: fn => { nextFrame = fn; }};
vm.createContext(sandbox);
const source = fs.readFileSync('game.js', 'utf8').replace(/\}\)\(\);\s*$/, 'globalThis.inspect = () => g;})();');
vm.runInContext(source, sandbox);
const state = () => sandbox.inspect();
const click = id => element(id).click();
function tick(seconds) {
  const count = Math.ceil(seconds / 0.05);
  for (let i = 0; i < count; i++) {
    now += 50;
    const fn = nextFrame;
    fn(now);
  }
}
function pointer(name, x, y, type = 'mouse') {
  handlers.get(name)({button: 0, pointerId: 1, pointerType: type,
    clientX: rect.left + x * rect.width / 960,
    clientY: rect.top + y * rect.height / 608});
}
function tap(x, y, type = 'mouse') {
  pointer('pointerdown', x, y, type);
  pointer('pointerup', x, y, type);
}
function drag(x1, y1, x2, y2) {
  pointer('pointerdown', x1, y1);
  pointer('pointermove', x2, y2);
  pointer('pointerup', x2, y2);
}

assert.equal(state().credits, 470);
assert.equal(state().enemies.length, 5);
click('build-btn');
tap(384, 128);
assert.equal(state().barracks.length, 0, 'obstacle blocks construction');
assert.match(element('toast').textContent, /无法建造/);
tap(256, 304);
assert.equal(state().barracks.length, 1);
assert.equal(state().credits, 290);
click('train-btn'); click('train-btn'); click('train-btn'); click('train-btn');
assert.equal(state().barracks[0].queue, 4);
assert.equal(state().credits, 10);
click('train-btn');
assert.equal(state().barracks[0].queue, 4, 'insufficient resources blocks training');
const creditsBeforePause = state().credits;
const progressBeforePause = state().barracks[0].progress;
click('pause-btn');
tick(5);
assert.equal(state().credits, creditsBeforePause);
assert.equal(state().barracks[0].progress, progressBeforePause);
click('pause-btn');
tick(11);
assert.equal(state().soldiers.length, 4, 'four soldiers spawn');
assert.equal(state().barracks[0].queue, 0);
assert.equal(new Set(state().soldiers.map(s => `${s.x},${s.y}`)).size, 4, 'spawns are dispersed');

drag(280, 220, 440, 420);
assert.ok(state().selection.length >= 2, 'drag selects multiple soldiers');
const selected = [...state().selection];
const prior = selected.map(s => [s.x, s.y]);
click('move-btn');
rect = {left: 31, top: 49, width: 480, height: 304};
tap(510, 300, 'touch');
assert.equal(state().mode, 'select');
assert.ok(selected.some(s => s.path.length), 'touch move command sets a route after resize');
tick(1.5);
assert.ok(selected.some((s, i) => Math.hypot(s.x - prior[i][0], s.y - prior[i][1]) > 20), 'units move');

click('attack-btn');
tap(783, 110, 'touch');
assert.equal(state().mode, 'select');
assert.ok(selected.some(s => s.target?.kind === 'turret'), 'touch attack command targets turret');
const turret = state().enemies.find(e => e.x === 783);
const oldHp = turret.hp;
tick(7);
assert.ok(turret.hp < oldHp, 'combat damages neutral target');

click('restart-btn');
assert.equal(state().credits, 470);
assert.equal(state().enemies.length, 5);
assert.equal(state().soldiers.length, 0);
state().hq.hp = 0;
tick(0.05);
assert.equal(state().state, 'defeat');
const frozenCredits = state().credits;
tick(5);
assert.equal(state().credits, frozenCredits, 'defeat stops simulation');
click('overlay-restart');
assert.equal(state().state, 'playing');
for (const enemy of state().enemies) enemy.hp = 0;
tick(0.05);
assert.equal(state().state, 'victory');
assert.equal(element('overlay-title').textContent, '作战胜利');

click('overlay-restart');
rect = {left: 0, top: 0, width: 960, height: 608};
click('build-btn');
tap(256, 304);
for (let i = 0; i < 4; i++) click('train-btn');
tick(11);
for (const [x, y] of [[783, 110], [840, 295], [792, 520]]) {
  for (let wave = 0; wave < 4 && state().enemies.some(e => e.x === x && e.y === y); wave++) {
    drag(5, 5, 950, 600);
    if (state().selection.length) {
      click('attack-btn');
      tap(x, y, 'touch');
      tick(18);
    }
    if (state().enemies.some(e => e.x === x && e.y === y)) {
      tap(230, 280);
      for (let i = 0; i < 5; i++) click('train-btn');
      tick(14);
    }
  }
}
for (let wave = 0; wave < 12 && state().state === 'playing' && state().enemies.length; wave++) {
  drag(5, 5, 950, 600);
  if (state().selection.length) {
    const target = state().enemies[0];
    click('attack-btn');
    tap(target.x, target.y, 'touch');
    tick(12);
  }
  if (state().enemies.length) {
    tap(230, 280);
    for (let i = 0; i < 5; i++) click('train-btn');
    tick(14);
  }
}
assert.equal(state().state, 'victory', 'input-driven playthrough reaches victory');
assert.equal(state().enemies.length, 0);
click('overlay-restart');
assert.equal(state().state, 'playing', 'victory restart works');
console.log('smoke passed');
