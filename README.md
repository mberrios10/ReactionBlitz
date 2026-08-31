# ReactionBlitz

ReactionBlitz is a one-page, dependency-free 30-second reaction game built with vanilla HTML, CSS, and JavaScript. Hit solid targets quickly, avoid striped decoys, build a combo, and choose Easy, Medium, or Hard before each round.

## Name and data migration

The game was renamed from **Reflex Rush** to **ReactionBlitz**. ReactionBlitz uses new `reactionBlitz*` local-storage keys, but it reads the prior Reflex Rush keys as a migration fallback so existing per-mode high scores, local leaderboard entries, and the saved player name can carry forward in the same browser.

## Difficulty modes

Each mode still gets harder as its 30-second round progresses, but the overall challenge is deliberately different:

- **Easy:** targets shrink from **96px to 76px**, stay visible for about **2000ms to 1350ms**, and decoys appear about **10%** of the time.
- **Medium:** targets shrink from **76px to 50px**, stay visible for about **1250ms to 650ms**, and decoys appear about **22%** of the time.
- **Hard:** targets shrink from **60px to 44px**, stay visible for about **850ms to 360ms**, and decoys appear about **35%** of the time.

The selected mode is locked during a round and can be changed again after results are shown. High scores are stored separately for Easy, Medium, and Hard. A legacy high score from the earlier single-difficulty version is treated as a Medium high score.

## How to play and scoring

- Start a 30-second round and hit each solid target with mouse, touch, Enter, or Space.
- A target starts at **100 points**. Each consecutive hit adds **10 bonus points**, capped at a **200-point combo bonus** (**300 points maximum per target**).
- Clicking a striped decoy subtracts **75 points** and resets the combo.
- Clicking empty play-area space or allowing a real target to expire is a **miss**. A miss subtracts **0 points** but resets the combo.

Accuracy is calculated as `targets hit / (targets hit + misses + decoys clicked) × 100`. A miss is either an empty-space click/tap or an expired real target; untouched decoys are not counted.

Performance ratings are deterministic: **S ≥ 7000**, **A ≥ 5000**, **B ≥ 3000**, **C ≥ 1500**, otherwise **D**.

## Local all-time leaderboard

The page keeps the **top 25 scores recorded on the current browser/device**. Each qualifying result stores the player name, raw score, selected difficulty, and date, then re-sorts the table immediately. The leaderboard uses `localStorage` when available and falls back to an in-memory leaderboard for the current page session if storage is blocked. Because the project is a static site with no backend, this leaderboard is not shared across different devices or visitors. A truly global leaderboard would require a writable server/database service.

## Accessibility

The difficulty selector uses native radio controls. Targets and decoys are native buttons with visible focus states. Starting with the keyboard lets focus follow newly spawned objects; pointer play does not steal focus, and Tab can leave the active game control. Real targets are circular/solid and decoys are square/striped, so the distinction is not color-only. The visual timer updates continuously but is not a live region; status announcements are limited to round start, 10/5/3/2/1 seconds remaining, and round completion. Results receive programmatic focus when the round ends. Reduced-motion preferences remove the feedback movement.

## Files

- `index.html` — one-page interface, difficulty chooser, player name/start controls directly above the play area, HUD, results, and Top-25 leaderboard.
- `styles.css` — responsive dark theme, difficulty/start controls, leaderboard table, visual hierarchy, targets/decoys, focus states, and temporary gameplay feedback.
- `game-core.js` — reusable positioning, progression, scoring, reaction-stat, accuracy, and rating helpers.
- `script.js` — difficulty presets, round lifecycle, inputs, target spawning, scoring, feedback, countdown announcements, results, per-mode high scores, local Top-25 leaderboard persistence, play-area auto-positioning, resize/tab handling, and stale-timer protection.
- `BUILD_LOG.md` — template for documenting incremental AI-assisted development and personal verification.
- `USER_TEST.md` — blank unfamiliar-user silent-test template.
- `test-core.js` — Node tests for pure game rules.
- `test_reactionblitz.py` — browser interaction tests, including all three difficulty modes.

## Run locally

Open `index.html` directly or serve this folder with any static HTTP server. All production paths are relative and there are no runtime dependencies.

## Verify

```sh
node --check game-core.js
node --check script.js
node test-core.js
python test_reactionblitz.py
```

## Deployment

The project can be deployed unchanged to a static host such as GitHub Pages.

**Deployment URL:** _Add the final public URL here after deployment._
