# ReactionBlitz — AI / Build Log

This log records the major prompts, revisions, and verification that actually occurred while building ReactionBlitz. It does not invent unfamiliar-user observations or unperformed human tests.

## 1. Core playable loop

**Prompt / goal:** Build and refine a small browser reaction game with a clear Ready → Start → Gameplay → Results → Restart loop.

**Changes made:** Implemented a 30-second round, moving targets, score, combo, reaction-time tracking, end-of-round results, and a working restart flow using vanilla HTML, CSS, and JavaScript.

**Verification:** Automated browser tests exercise starting, playing, ending, viewing results, and restarting. Repeated Start/Restart input during an active round is ignored to prevent duplicate rounds.

## 2. Scoring and miss behavior

**Prompt / goal:** Make normal misses cost 0 points. Empty-space clicks and expired real targets should count as misses, reset the combo, and leave the score unchanged. Decoys should remain a penalty.

**Changes made:** Real targets begin at 100 points with a +10 combo bonus per consecutive hit, capped at a 200-point bonus. Normal misses subtract 0 points and reset the combo. Clicking a striped decoy subtracts 75 points and resets the combo. Immediate feedback shows hit points, combo feedback, MISS, or −75 DECOY.

**Verification:** Automated tests check a normal hit, combo scoring, an empty-space miss, an expired target, a decoy penalty, duplicate activation protection, and score locking after the round ends.

## 3. Accessibility, input, and reliability

**Prompt / goal:** Make the game usable with mouse, touch, and keyboard; improve focus behavior and accessibility; prevent timer/input race conditions.

**Changes made:** Targets and decoys are native buttons. Enter and Space work for keyboard play. Keyboard-started rounds allow focus to follow new targets, while pointer play does not steal focus. Real targets are circular/solid and decoys are square/striped so the distinction is not color-only. Screen-reader announcements are limited to useful countdown and round-status messages. Reduced-motion preferences are respected. Stale target timers, duplicate clicks, re-entrant starts, and visibility/resume edge cases are guarded.

**Verification:** Automated browser tests cover keyboard, mouse, touch, focus behavior, resizing/orientation containment, reduced race conditions, and blocked/malformed storage behavior.

## 4. Results, high scores, and persistence

**Prompt / goal:** Improve the results screen and retain useful player progress.

**Changes made:** Results include final score, best reaction, average reaction, targets hit, best combo, accuracy, misses, decoys clicked, and a performance rating. High scores persist in localStorage with validation and safe fallback behavior if storage is unavailable.

**Verification:** Tests check result focus, accuracy calculations, rating rules, persistence shape, malformed storage rejection, and blocked-storage fallback.

## 5. Easy / Medium / Hard difficulty modes

**Prompt / goal:** Add player-selectable Easy, Medium, and Hard modes, with Easy substantially easier and the differences obvious.

**Changes made:** Added a native radio difficulty chooser. Easy uses larger, slower targets and fewer decoys; Medium is the baseline; Hard uses smaller, faster targets and more decoys. Each mode still ramps within the 30-second round. High scores are stored separately by mode.

**Current presets:**
- **Easy:** 96→76 px targets, 2000→1350 ms lifetime, about 10% decoys.
- **Medium:** 76→50 px targets, 1250→650 ms lifetime, about 22% decoys.
- **Hard:** 60→44 px targets, 850→360 ms lifetime, about 35% decoys.

**Verification:** Automated tests confirm all three starting sizes/lifetimes, obvious mode differences, mode locking during play, mode changes after results, and per-mode high-score behavior.

## 6. Start placement and Top-25 leaderboard

**Prompt / goal:** Move Start directly above the play area so the player does not have to scroll after pressing it, and add a Top-25 all-time leaderboard.

**Human feedback that led to the change:** The project owner explicitly reported the Start-button friction: they did not want to scroll down after pressing Start.

**Changes made:** Moved the player-name field and Start button directly above the play area and automatically position the play area in view when a round begins. Added a Top-25 leaderboard showing player, score, difficulty, and date. Scores are sorted highest-first and saved locally on the current browser/device.

**Important scope note:** The leaderboard is local to the browser/device because the project is a static site with no shared writable backend.

**Verification:** Automated responsive tests check Start placement, play-area positioning, leaderboard ordering/truncation, persistence, player-name sanitization, and the empty-state fallback.

## 7. Rename from Reflex Rush to ReactionBlitz

**Prompt / goal:** Rename the finished game to ReactionBlitz and provide all updated outputs.

**Changes made:** Updated visible branding, document titles, JavaScript namespace, test filenames/paths, README, and storage keys. Added migration reads for the previous Reflex Rush player-name, leaderboard, and high-score keys so existing data can carry forward in the same browser.

**Verification:** The full Node/browser test suite passed after the rename, including a migration check for the old storage keys.

## 8. GitHub publishing and public deployment

**Prompt / goal:** Upload the complete project to GitHub and make the playable game publicly accessible.

**Changes made:** Published the full source to `mberrios10/ReactionBlitz`, merged the finished project into `main`, added a GitHub Pages Actions workflow, and enabled public deployment.

**Verification:** GitHub Actions completed the Pages deployment successfully. Public game URL: `https://mberrios10.github.io/ReactionBlitz/`.

## Human verification status

The development record includes genuine project-owner feedback about the Start-button scrolling friction, but no separate unfamiliar-user test observation has been supplied yet. Before submission, the owner should open the public URL while signed out, complete one full round, confirm results and Restart, and run one short silent test with a person unfamiliar with the game. Those observations belong in `USER_TEST.md`; they should not be invented.