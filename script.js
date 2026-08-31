(() => {
  'use strict';

  const ROUND_MS = 30_000;
  const HIT_BASE_POINTS = 100;
  const DECOY_PENALTY = 75;
  const TARGET_INSET = 10;
  const HIGH_SCORES_KEY = 'reactionBlitzHighScoresV1';
  const LEGACY_HIGH_SCORES_KEY = 'reflexRushHighScoresV2';
  const LEGACY_HIGH_SCORE_KEY = 'reflexRushHighScore';
  const LEADERBOARD_KEY = 'reactionBlitzLeaderboardV1';
  const LEGACY_LEADERBOARD_KEY = 'reflexRushLeaderboardV1';
  const PLAYER_NAME_KEY = 'reactionBlitzPlayerName';
  const LEGACY_PLAYER_NAME_KEY = 'reflexRushPlayerName';
  const MAX_LEADERBOARD_ENTRIES = 25;

  const DIFFICULTY_PRESETS = Object.freeze({
    easy: Object.freeze({
      label: 'Easy',
      startSize: 96,
      endSize: 76,
      startLifetime: 2000,
      endLifetime: 1350,
      decoyChance: 0.10,
      spawnDelay: 120
    }),
    medium: Object.freeze({
      label: 'Medium',
      startSize: 76,
      endSize: 50,
      startLifetime: 1250,
      endLifetime: 650,
      decoyChance: 0.22,
      spawnDelay: 80
    }),
    hard: Object.freeze({
      label: 'Hard',
      startSize: 60,
      endSize: 44,
      startLifetime: 850,
      endLifetime: 360,
      decoyChance: 0.35,
      spawnDelay: 55
    })
  });

  const els = {
    playArea: document.getElementById('playArea'),
    readyMessage: document.getElementById('readyMessage'),
    startButton: document.getElementById('startButton'),
    restartButton: document.getElementById('restartButton'),
    playerName: document.getElementById('playerName'),
    difficultyChooser: document.getElementById('difficultyChooser'),
    difficultyInputs: Array.from(document.querySelectorAll('input[name="difficultyMode"]')),
    timer: document.getElementById('timer'),
    score: document.getElementById('score'),
    combo: document.getElementById('combo'),
    lastReaction: document.getElementById('lastReaction'),
    difficulty: document.getElementById('difficulty'),
    highScore: document.getElementById('highScore'),
    gameStatus: document.getElementById('gameStatus'),
    results: document.getElementById('results'),
    resultsTitle: document.getElementById('resultsTitle'),
    highScoreMessage: document.getElementById('highScoreMessage'),
    leaderboardMessage: document.getElementById('leaderboardMessage'),
    leaderboardBody: document.getElementById('leaderboardBody'),
    finalScore: document.getElementById('finalScore'),
    bestReaction: document.getElementById('bestReaction'),
    averageReaction: document.getElementById('averageReaction'),
    targetsHit: document.getElementById('targetsHit'),
    bestCombo: document.getElementById('bestCombo'),
    accuracy: document.getElementById('accuracy'),
    misses: document.getElementById('misses'),
    decoysClicked: document.getElementById('decoysClicked'),
    performanceRating: document.getElementById('performanceRating')
  };

  const core = window.ReactionBlitzCore;
  if (!core) throw new Error('ReactionBlitzCore failed to load.');

  const state = {
    running: false,
    selectedMode: 'easy',
    roundMode: 'easy',
    score: 0,
    combo: 0,
    bestCombo: 0,
    hits: 0,
    misses: 0,
    decoysClicked: 0,
    reactions: [],
    roundStart: 0,
    roundEnd: 0,
    activeTarget: null,
    targetShownAt: 0,
    targetExpiresAt: 0,
    targetTimeoutId: null,
    spawnTimeoutId: null,
    frameId: null,
    generation: 0,
    announcedCountdowns: new Set(),
    keyboardFollow: false,
    pendingTabEntry: false,
    highScores: { easy: 0, medium: 0, hard: 0 },
    playerName: 'Player',
    leaderboard: []
  };

  function preset(mode = state.roundMode) {
    return DIFFICULTY_PRESETS[mode] || DIFFICULTY_PRESETS.easy;
  }

  function formatMs(ms) {
    return `${Math.round(ms)} ms`;
  }

  function strictNonNegativeInteger(value) {
    if (typeof value === 'number') {
      return Number.isSafeInteger(value) && value >= 0 ? value : null;
    }
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
      const parsed = Number(value.trim());
      return Number.isSafeInteger(parsed) ? parsed : null;
    }
    return null;
  }

  function loadHighScores() {
    const scores = { easy: 0, medium: 0, hard: 0 };
    try {
      const raw = window.localStorage.getItem(HIGH_SCORES_KEY)
        || window.localStorage.getItem(LEGACY_HIGH_SCORES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          for (const mode of Object.keys(scores)) {
            const safe = strictNonNegativeInteger(parsed[mode]);
            if (safe !== null) scores[mode] = safe;
          }
        }
      } else {
        const legacy = strictNonNegativeInteger(window.localStorage.getItem(LEGACY_HIGH_SCORE_KEY));
        if (legacy !== null) scores.medium = legacy;
      }
    } catch (_) {
      // Storage is optional. Keep the game playable with in-memory scores.
    }
    return scores;
  }

  function saveHighScores() {
    try {
      window.localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(state.highScores));
    } catch (_) {
      // Storage is optional. The in-memory score still works for this page session.
    }
  }


  function sanitizePlayerName(value) {
    const cleaned = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 18);
    return cleaned || 'Player';
  }

  function loadPlayerName() {
    try {
      return sanitizePlayerName(
        window.localStorage.getItem(PLAYER_NAME_KEY)
        || window.localStorage.getItem(LEGACY_PLAYER_NAME_KEY)
      );
    } catch (_) {
      return 'Player';
    }
  }

  function savePlayerName() {
    state.playerName = sanitizePlayerName(els.playerName.value);
    els.playerName.value = state.playerName;
    try {
      window.localStorage.setItem(PLAYER_NAME_KEY, state.playerName);
    } catch (_) {
      // Storage is optional. Keep the name for this page session.
    }
  }

  function normalizeLeaderboardEntry(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const score = strictNonNegativeInteger(entry.score);
    const mode = DIFFICULTY_PRESETS[entry.mode] ? entry.mode : null;
    const name = sanitizePlayerName(entry.name);
    const createdAt = typeof entry.createdAt === 'string' ? entry.createdAt : '';
    if (score === null || !mode || !createdAt || Number.isNaN(Date.parse(createdAt))) return null;
    return { name, score, mode, createdAt };
  }

  function sortLeaderboard(entries) {
    return entries.sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt));
  }

  function loadLeaderboard() {
    try {
      const raw = window.localStorage.getItem(LEADERBOARD_KEY)
        || window.localStorage.getItem(LEGACY_LEADERBOARD_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return sortLeaderboard(parsed.map(normalizeLeaderboardEntry).filter(Boolean)).slice(0, MAX_LEADERBOARD_ENTRIES);
    } catch (_) {
      return [];
    }
  }

  function saveLeaderboard() {
    try {
      window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(state.leaderboard));
    } catch (_) {
      // Storage is optional. Keep the leaderboard for this page session.
    }
  }

  function formatLeaderboardDate(isoDate) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function renderLeaderboard() {
    els.leaderboardBody.replaceChildren();
    if (!state.leaderboard.length) {
      const row = document.createElement('tr');
      row.className = 'leaderboard-empty';
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.textContent = 'No scores yet. Finish a round to set the first score.';
      row.appendChild(cell);
      els.leaderboardBody.appendChild(row);
      return;
    }

    state.leaderboard.forEach((entry, index) => {
      const row = document.createElement('tr');
      const cells = [
        String(index + 1),
        entry.name,
        String(entry.score),
        preset(entry.mode).label,
        formatLeaderboardDate(entry.createdAt)
      ];
      cells.forEach((text, cellIndex) => {
        const cell = document.createElement(cellIndex === 1 ? 'th' : 'td');
        if (cellIndex === 1) cell.scope = 'row';
        cell.textContent = text;
        row.appendChild(cell);
      });
      els.leaderboardBody.appendChild(row);
    });
  }

  function addLeaderboardScore() {
    if (state.score <= 0) return null;
    const entry = {
      name: state.playerName,
      score: state.score,
      mode: state.roundMode,
      createdAt: new Date().toISOString()
    };
    const ranked = sortLeaderboard([...state.leaderboard, entry]).slice(0, MAX_LEADERBOARD_ENTRIES);
    const rankIndex = ranked.indexOf(entry);
    if (rankIndex === -1) return null;
    state.leaderboard = ranked;
    saveLeaderboard();
    renderLeaderboard();
    return rankIndex + 1;
  }

  function selectedModeFromControls() {
    const selected = els.difficultyInputs.find((input) => input.checked);
    return selected && DIFFICULTY_PRESETS[selected.value] ? selected.value : 'easy';
  }

  function setDifficultyControlsDisabled(disabled) {
    for (const input of els.difficultyInputs) input.disabled = disabled;
  }

  function updateModeDisplay() {
    const mode = state.running ? state.roundMode : state.selectedMode;
    const config = preset(mode);
    els.difficulty.textContent = config.label;
    els.highScore.textContent = String(state.highScores[mode] || 0);
    if (!state.running) els.startButton.textContent = `Start ${config.label} Round`;
  }

  function updateHud(remainingMs = ROUND_MS) {
    els.timer.textContent = (Math.max(0, remainingMs) / 1000).toFixed(1);
    els.score.textContent = String(state.score);
    els.combo.textContent = `${state.combo}×`;
    updateModeDisplay();
  }

  function progress(now = performance.now()) {
    return core.roundProgress(now, state.roundStart, ROUND_MS);
  }

  function desiredTargetSize(now = performance.now()) {
    const config = preset();
    return core.difficultyValue(config.startSize, config.endSize, progress(now));
  }

  function fitTargetSize(desiredSize) {
    const rect = els.playArea.getBoundingClientRect();
    const maxContained = Math.max(1, Math.min(rect.width, rect.height) - TARGET_INSET * 2);
    return Math.min(desiredSize, maxContained);
  }

  function targetLifetime(now = performance.now()) {
    const config = preset();
    return core.difficultyValue(config.startLifetime, config.endLifetime, progress(now));
  }

  function randomPosition(size) {
    const rect = els.playArea.getBoundingClientRect();
    return core.randomPosition(rect.width, rect.height, size, Math.random(), Math.random(), TARGET_INSET);
  }

  function clearTarget() {
    if (state.targetTimeoutId !== null) {
      window.clearTimeout(state.targetTimeoutId);
      state.targetTimeoutId = null;
    }
    if (state.activeTarget) {
      state.activeTarget.remove();
      state.activeTarget = null;
    }
    state.targetShownAt = 0;
    state.targetExpiresAt = 0;
  }

  function clearSpawnTimer() {
    if (state.spawnTimeoutId !== null) {
      window.clearTimeout(state.spawnTimeoutId);
      state.spawnTimeoutId = null;
    }
  }

  function clearRoundTimers() {
    clearSpawnTimer();
    if (state.frameId !== null) {
      window.cancelAnimationFrame(state.frameId);
      state.frameId = null;
    }
    clearTarget();
  }

  function feedbackPositionFromTarget(target) {
    const areaRect = els.playArea.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return {
      x: targetRect.left - areaRect.left + targetRect.width / 2,
      y: targetRect.top - areaRect.top + targetRect.height / 2
    };
  }

  function showFeedback(text, kind, position) {
    const feedback = document.createElement('span');
    feedback.className = `game-feedback game-feedback--${kind}`;
    feedback.textContent = text;
    feedback.setAttribute('aria-hidden', 'true');
    feedback.style.left = `${core.clamp(position.x, 28, Math.max(28, els.playArea.clientWidth - 28))}px`;
    feedback.style.top = `${core.clamp(position.y, 22, Math.max(22, els.playArea.clientHeight - 22))}px`;
    els.playArea.appendChild(feedback);
    window.setTimeout(() => feedback.remove(), 650);
  }

  function applyMiss(reason, position) {
    if (!state.running || performance.now() >= state.roundEnd) return false;
    state.misses += 1;
    state.combo = 0;
    els.lastReaction.textContent = 'Miss';
    updateHud(state.roundEnd - performance.now());
    showFeedback('MISS', 'miss', position || { x: els.playArea.clientWidth / 2, y: els.playArea.clientHeight / 2 });
    return true;
  }

  function scheduleSpawn(delay = preset().spawnDelay) {
    if (!state.running) return;
    clearSpawnTimer();
    const generation = state.generation;
    state.spawnTimeoutId = window.setTimeout(() => {
      state.spawnTimeoutId = null;
      if (!state.running || generation !== state.generation) return;
      spawnTarget();
    }, delay);
  }

  function expireActiveTarget(target, generation) {
    if (!state.running || generation !== state.generation || target !== state.activeTarget) return;
    const now = performance.now();
    if (now >= state.roundEnd) {
      endGame();
      return;
    }

    const position = feedbackPositionFromTarget(target);
    if (target.dataset.kind === 'real') {
      applyMiss('Target expired.', position);
    }
    clearTarget();
    scheduleSpawn();
  }

  function processTargetActivation(target, generation, event) {
    event.stopPropagation();
    if (!state.running || generation !== state.generation || target !== state.activeTarget || target.dataset.resolved === 'true') return;

    const now = performance.now();
    if (now >= state.roundEnd) {
      endGame();
      return;
    }
    if (now >= state.targetExpiresAt) {
      target.dataset.resolved = 'true';
      expireActiveTarget(target, generation);
      return;
    }

    target.dataset.resolved = 'true';
    const position = feedbackPositionFromTarget(target);

    if (target.dataset.kind === 'decoy') {
      state.score = core.penalize(state.score, DECOY_PENALTY);
      state.combo = 0;
      state.decoysClicked += 1;
      els.lastReaction.textContent = 'Decoy';
      showFeedback(`−${DECOY_PENALTY} DECOY`, 'decoy', position);
    } else {
      const reaction = now - state.targetShownAt;
      state.reactions.push(reaction);
      state.hits += 1;
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      const points = core.hitPoints(state.combo, HIT_BASE_POINTS);
      state.score += points;
      els.lastReaction.textContent = formatMs(reaction);
      showFeedback(`${points > HIT_BASE_POINTS ? `+${points} COMBO` : `+${points}`}`, 'hit', position);
    }

    updateHud(state.roundEnd - now);
    clearTarget();
    scheduleSpawn();
  }

  function spawnTarget() {
    if (!state.running) return;
    const now = performance.now();
    if (now >= state.roundEnd) {
      endGame();
      return;
    }

    clearTarget();
    const config = preset();
    const size = fitTargetSize(desiredTargetSize(now));
    const lifetime = targetLifetime(now);
    const isDecoy = Math.random() < config.decoyChance;
    const pos = randomPosition(size);
    const target = document.createElement('button');
    const generation = state.generation;

    target.type = 'button';
    target.className = `target ${isDecoy ? 'target--decoy' : 'target--real'}`;
    target.style.width = `${size}px`;
    target.style.height = `${size}px`;
    target.style.left = `${pos.x}px`;
    target.style.top = `${pos.y}px`;
    target.setAttribute('aria-label', isDecoy ? 'Decoy — avoid' : 'Target — activate now');
    target.dataset.kind = isDecoy ? 'decoy' : 'real';
    target.dataset.resolved = 'false';
    target.dataset.lifetime = String(lifetime);

    state.activeTarget = target;
    state.targetShownAt = now;
    state.targetExpiresAt = now + lifetime;
    els.playArea.appendChild(target);

    target.addEventListener('pointerdown', () => {
      state.keyboardFollow = false;
      state.pendingTabEntry = false;
    });
    target.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') state.keyboardFollow = true;
    });
    target.addEventListener('focus', () => {
      if (state.pendingTabEntry) {
        state.keyboardFollow = true;
        state.pendingTabEntry = false;
      }
    });
    target.addEventListener('click', (event) => processTargetActivation(target, generation, event));

    if (state.keyboardFollow) {
      target.focus({ preventScroll: true });
    }

    state.targetTimeoutId = window.setTimeout(() => {
      expireActiveTarget(target, generation);
    }, lifetime);
  }

  function announceCountdown(remainingMs) {
    const seconds = Math.ceil(Math.max(0, remainingMs) / 1000);
    if (![10, 5, 3, 2, 1].includes(seconds) || state.announcedCountdowns.has(seconds)) return;
    state.announcedCountdowns.add(seconds);
    els.gameStatus.textContent = seconds === 1 ? '1 second remaining.' : `${seconds} seconds remaining.`;
  }

  function tick(now) {
    if (!state.running) return;
    const remaining = state.roundEnd - now;
    updateHud(remaining);
    announceCountdown(remaining);
    if (remaining <= 0) {
      endGame();
      return;
    }
    state.frameId = window.requestAnimationFrame(tick);
  }

  function resetRoundState() {
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hits = 0;
    state.misses = 0;
    state.decoysClicked = 0;
    state.reactions = [];
    state.announcedCountdowns = new Set();
    els.lastReaction.textContent = '—';
  }

  function startGame() {
    if (state.running) return;

    state.selectedMode = selectedModeFromControls();
    state.roundMode = state.selectedMode;
    savePlayerName();
    state.generation += 1;
    clearRoundTimers();
    resetRoundState();

    const now = performance.now();
    state.running = true;
    state.roundStart = now;
    state.roundEnd = now + ROUND_MS;

    els.results.hidden = true;
    els.highScoreMessage.hidden = true;
    els.readyMessage.hidden = true;
    els.startButton.disabled = true;
    els.playerName.disabled = true;
    setDifficultyControlsDisabled(true);
    updateHud(ROUND_MS);
    els.gameStatus.textContent = `Round started on ${preset().label} difficulty.`;

    spawnTarget();
    if (typeof els.playArea.scrollIntoView === 'function') {
      window.requestAnimationFrame(() => els.playArea.scrollIntoView({ block: 'start', behavior: 'auto' }));
    }
    state.frameId = window.requestAnimationFrame(tick);
  }

  function endGame() {
    if (!state.running) return;
    state.running = false;
    state.generation += 1;
    clearRoundTimers();
    updateHud(0);

    const { best, average } = core.reactionStats(state.reactions);
    const accuracy = core.accuracyPercent(state.hits, state.misses, state.decoysClicked);
    const rating = core.performanceRating(state.score);
    const previousHigh = state.highScores[state.roundMode] || 0;
    const isNewHigh = state.score > previousHigh;

    if (isNewHigh) {
      state.highScores[state.roundMode] = state.score;
      saveHighScores();
    }

    els.finalScore.textContent = String(state.score);
    els.bestReaction.textContent = best === null ? '—' : formatMs(best);
    els.averageReaction.textContent = average === null ? '—' : formatMs(average);
    els.targetsHit.textContent = String(state.hits);
    els.bestCombo.textContent = `${state.bestCombo}×`;
    els.accuracy.textContent = `${accuracy}%`;
    els.misses.textContent = String(state.misses);
    els.decoysClicked.textContent = String(state.decoysClicked);
    els.performanceRating.textContent = rating;
    const leaderboardRank = addLeaderboardScore();

    els.highScoreMessage.hidden = !isNewHigh;
    els.leaderboardMessage.hidden = leaderboardRank === null;
    els.leaderboardMessage.textContent = leaderboardRank === null ? '' : `Leaderboard #${leaderboardRank}!`;
    els.results.hidden = false;

    state.selectedMode = selectedModeFromControls();
    setDifficultyControlsDisabled(false);
    els.playerName.disabled = false;
    els.startButton.disabled = false;
    els.readyMessage.hidden = false;
    els.readyMessage.innerHTML = '<strong>Time!</strong><span>See your results below, choose a mode, or start again.</span>';
    updateModeDisplay();
    els.gameStatus.textContent = `Round complete. Final score ${state.score}.`;
    els.resultsTitle.focus({ preventScroll: true });
  }

  function handleDifficultyChange(event) {
    if (state.running || !DIFFICULTY_PRESETS[event.target.value]) return;
    state.selectedMode = event.target.value;
    updateModeDisplay();
    els.gameStatus.textContent = `${preset(state.selectedMode).label} difficulty selected.`;
    els.readyMessage.innerHTML = `<strong>${preset(state.selectedMode).label} selected</strong><span>Hit solid. Avoid striped. Press Start.</span>`;
  }

  els.startButton.addEventListener('pointerdown', () => {
    state.keyboardFollow = false;
    state.pendingTabEntry = false;
  });
  els.startButton.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') state.keyboardFollow = true;
  });
  els.startButton.addEventListener('click', startGame);

  els.restartButton.addEventListener('pointerdown', () => {
    state.keyboardFollow = false;
    state.pendingTabEntry = false;
  });
  els.restartButton.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') state.keyboardFollow = true;
  });
  els.restartButton.addEventListener('click', startGame);

  for (const input of els.difficultyInputs) input.addEventListener('change', handleDifficultyChange);
  els.playerName.addEventListener('change', savePlayerName);

  els.playArea.addEventListener('pointerdown', (event) => {
    state.keyboardFollow = false;
    state.pendingTabEntry = false;
    if (!state.running || event.target !== els.playArea) return;
    if (performance.now() >= state.roundEnd) {
      endGame();
      return;
    }
    const rect = els.playArea.getBoundingClientRect();
    applyMiss('Missed the target.', {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }, { passive: true });

  document.addEventListener('keydown', (event) => {
    if (!state.running || event.key !== 'Tab') return;
    if (document.activeElement === state.activeTarget) {
      state.keyboardFollow = false;
      state.pendingTabEntry = false;
    } else {
      state.pendingTabEntry = true;
    }
  });

  window.addEventListener('resize', () => {
    if (!state.running || !state.activeTarget) return;
    const size = fitTargetSize(desiredTargetSize());
    const pos = randomPosition(size);
    state.activeTarget.style.width = `${size}px`;
    state.activeTarget.style.height = `${size}px`;
    state.activeTarget.style.left = `${pos.x}px`;
    state.activeTarget.style.top = `${pos.y}px`;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !state.running) return;
    const now = performance.now();
    if (now >= state.roundEnd) {
      endGame();
      return;
    }
    if (state.activeTarget && now >= state.targetExpiresAt) {
      expireActiveTarget(state.activeTarget, state.generation);
    }
  });

  state.highScores = loadHighScores();
  state.playerName = loadPlayerName();
  els.playerName.value = state.playerName;
  state.leaderboard = loadLeaderboard();
  renderLeaderboard();
  state.selectedMode = selectedModeFromControls();
  updateHud(ROUND_MS);
  updateModeDisplay();
})();
