(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ReactionBlitzCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, t) {
    return start + (end - start) * clamp(t, 0, 1);
  }

  function roundProgress(now, roundStart, roundMs) {
    if (!Number.isFinite(roundMs) || roundMs <= 0) return 1;
    return clamp((now - roundStart) / roundMs, 0, 1);
  }

  function difficultyValue(start, end, progress) {
    return Math.round(lerp(start, end, progress));
  }

  // Retained as a generic helper for describing progression within any selected mode.
  function difficultyStage(progress) {
    const p = clamp(progress, 0, 1);
    if (p < 1 / 3) return 'Opening';
    if (p < 2 / 3) return 'Ramping';
    return 'Peak';
  }

  function randomPosition(areaWidth, areaHeight, size, randomX = Math.random(), randomY = Math.random(), inset = 0) {
    const availableX = Math.max(0, areaWidth - size);
    const availableY = Math.max(0, areaHeight - size);
    const safeInsetX = Math.max(0, Math.min(inset, availableX / 2));
    const safeInsetY = Math.max(0, Math.min(inset, availableY / 2));
    const minX = safeInsetX;
    const minY = safeInsetY;
    const maxX = Math.max(minX, availableX - safeInsetX);
    const maxY = Math.max(minY, availableY - safeInsetY);

    return {
      x: lerp(minX, maxX, clamp(randomX, 0, 1)),
      y: lerp(minY, maxY, clamp(randomY, 0, 1))
    };
  }

  function hitPoints(combo, basePoints = 100) {
    const comboBonus = Math.min(200, Math.max(0, combo - 1) * 10);
    return basePoints + comboBonus;
  }

  function penalize(score, amount) {
    return Math.max(0, score - amount);
  }

  function reactionStats(reactions) {
    if (!reactions.length) return { best: null, average: null };
    return {
      best: Math.min(...reactions),
      average: reactions.reduce((sum, value) => sum + value, 0) / reactions.length
    };
  }

  function accuracyPercent(hits, misses, decoysClicked) {
    const attempts = Math.max(0, hits) + Math.max(0, misses) + Math.max(0, decoysClicked);
    if (!attempts) return 0;
    return Math.round((Math.max(0, hits) / attempts) * 100);
  }

  function performanceRating(score) {
    const safeScore = Math.max(0, Number.isFinite(score) ? score : 0);
    if (safeScore >= 7000) return 'S';
    if (safeScore >= 5000) return 'A';
    if (safeScore >= 3000) return 'B';
    if (safeScore >= 1500) return 'C';
    return 'D';
  }

  return {
    clamp,
    lerp,
    roundProgress,
    difficultyValue,
    difficultyStage,
    randomPosition,
    hitPoints,
    penalize,
    reactionStats,
    accuracyPercent,
    performanceRating
  };
});
