'use strict';
const assert = require('node:assert/strict');
const core = require('./game-core.js');

// Progression helpers.
assert.equal(core.roundProgress(1000, 1000, 30000), 0);
assert.equal(core.roundProgress(16000, 1000, 30000), 0.5);
assert.equal(core.roundProgress(40000, 1000, 30000), 1);
assert.equal(core.difficultyValue(96, 76, 0), 96);
assert.equal(core.difficultyValue(96, 76, 1), 76);
assert.equal(core.difficultyValue(2000, 1350, 0.5), 1675);
assert.equal(core.difficultyStage(0), 'Opening');
assert.equal(core.difficultyStage(0.5), 'Ramping');
assert.equal(core.difficultyStage(0.9), 'Peak');

// Target positioning remains fully inside the area with an edge inset when possible.
for (const [w, h, size] of [[320, 340, 96], [700, 320, 60], [1200, 620, 44], [40, 40, 72]]) {
  for (const rx of [0, 0.2, 0.5, 0.999, 1]) {
    for (const ry of [0, 0.3, 0.75, 1]) {
      const inset = 10;
      const { x, y } = core.randomPosition(w, h, size, rx, ry, inset);
      const availableX = Math.max(0, w - size);
      const availableY = Math.max(0, h - size);
      const safeInsetX = Math.max(0, Math.min(inset, availableX / 2));
      const safeInsetY = Math.max(0, Math.min(inset, availableY / 2));
      assert.ok(x >= safeInsetX && x <= Math.max(safeInsetX, availableX - safeInsetX));
      assert.ok(y >= safeInsetY && y <= Math.max(safeInsetY, availableY - safeInsetY));
    }
  }
}

// Scoring and decoy penalty.
assert.equal(core.hitPoints(1), 100);
assert.equal(core.hitPoints(2), 110);
assert.equal(core.hitPoints(5), 140);
assert.equal(core.hitPoints(50), 300);
assert.equal(core.penalize(100, 75), 25);
assert.equal(core.penalize(20, 75), 0);

// Results math.
assert.deepEqual(core.reactionStats([]), { best: null, average: null });
assert.deepEqual(core.reactionStats([240, 180, 300]), { best: 180, average: 240 });
assert.equal(core.accuracyPercent(0, 0, 0), 0);
assert.equal(core.accuracyPercent(8, 1, 1), 80);
assert.equal(core.performanceRating(7000), 'S');
assert.equal(core.performanceRating(5000), 'A');
assert.equal(core.performanceRating(3000), 'B');
assert.equal(core.performanceRating(1500), 'C');
assert.equal(core.performanceRating(1499), 'D');

console.log('PASS core: progression, positioning, scoring, accuracy, ratings');
