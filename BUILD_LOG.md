# ReactionBlitz — AI / Build Log

This log summarizes the major prompts, revisions, and verification completed during development.

## 1. Core playable loop

**Prompt / goal:** Build a small browser reaction game with a clear Ready → Start → Gameplay → Results → Restart loop.

**Changes:** Added a 30-second round, moving targets, score, combo, reaction-time tracking, results, and working Restart using vanilla HTML, CSS, and JavaScript.

**Verification:** Browser tests cover starting, playing, ending, viewing results, and restarting; duplicate Start/Restart input is guarded.

## 2. Scoring rules

**Prompt / goal:** Make normal misses cost 0 points while keeping decoys as a penalty.

**Changes:** Real targets start at 100 points with a +10 combo bonus per consecutive hit, capped at 300 points per target. Empty-space clicks and expired real targets count as misses, reset combo, and subtract 0 points. Striped decoys subtract 75 points and reset combo. Immediate feedback shows hits, combos, MISS, and −75 DECOY.

**Verification:** Tests cover normal hits, combos, empty-space misses, expired targets, decoys, duplicate activation protection, and score locking after time expires.

## 3. Accessibility and input

**Prompt / goal:** Support mouse, touch, and keyboard while improving focus behavior and accessibility.

**Changes:** Targets and decoys are native buttons; Enter and Space work for keyboard play. Real targets are solid/circular and decoys are striped/square so the distinction is not color-only. Focus, screen-reader announcements, reduced motion, resizing, and stale-timer edge cases were addressed.

**Verification:** Browser tests cover keyboard, mouse, touch, focus, resizing/orientation, and storage failure cases.

## 4. Results and persistence

**Prompt / goal:** Improve the end state and retain useful progress.

**Changes:** Results show final score, best/average reaction, hits, best combo, accuracy, misses, decoys clicked, and performance rating. Per-mode high scores persist with validation and storage fallbacks.

**Verification:** Tests cover result calculations, focus, persistence, malformed storage, and blocked storage.

## 5. Difficulty modes

**Prompt / goal:** Add Easy, Medium, and Hard and make the differences obvious.

**Changes:** Added a native difficulty chooser. Easy uses larger/slower targets and fewer decoys; Medium is balanced; Hard uses smaller/faster targets and more decoys. Each mode still ramps within the 30-second round.

**Presets:**
- Easy: 96→76 px, 2000→1350 ms, ~10% decoys
- Medium: 76→50 px, 1250→650 ms, ~22% decoys
- Hard: 60→44 px, 850→360 ms, ~35% decoys

**Verification:** Tests confirm sizes, lifetimes, mode locking, difficulty changes after results, and separate high scores.

## 6. Start placement and leaderboard

**Prompt / goal:** Keep the play area in view after Start and add a Top-25 leaderboard.

**Observed friction:** The previous Start location required extra scrolling before gameplay.

**Changes:** Moved the player-name field and Start button directly above the play area and auto-positioned the play area when a round begins. Added a local Top-25 leaderboard with player, score, difficulty, and date.

**Verification:** Responsive tests cover Start placement, viewport positioning, leaderboard sorting/truncation, persistence, player-name sanitization, and empty state.

## 7. Rename to ReactionBlitz

**Prompt / goal:** Rename the finished game from Reflex Rush to ReactionBlitz and keep existing saved data where possible.

**Changes:** Updated branding, document titles, JavaScript namespace, tests, README, and storage keys. Added migration reads for prior Reflex Rush high-score, leaderboard, and player-name keys.

**Verification:** The full test suite passed after the rename, including legacy storage migration.

## 8. GitHub publishing and public deployment

**Prompt / goal:** Publish the complete source and make the game publicly playable.

**Changes:** Pushed the project to `mberrios10/ReactionBlitz`, merged it into `main`, added a GitHub Pages workflow, and enabled deployment.

**Verification:** GitHub Pages deployment completed successfully. Public URL: `https://mberrios10.github.io/ReactionBlitz/`.

## 9. First-use usability revision

**Prompt / goal:** Complete a first-use usability walkthrough and make one small revision based on a concrete friction point.

**Observed friction:** The **Player name** field sat directly before Start and looked required even though the game already accepts a blank name.

**Diagnosis:** The UI did not communicate the existing optional behavior, creating an unnecessary decision before the first round.

**Changes:** Relabeled the field as **Player name (optional)** while preserving the blank-name fallback to **Player**.

**Verification:** A second first-use walkthrough confirmed the control now communicates that no name is required. The full automated test suite was rerun after the revision and passed. The observation, diagnosis, revision, verification, and outcome are documented in `USER_TEST.md`.