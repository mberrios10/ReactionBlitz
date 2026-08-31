# ReactionBlitz Build Log

Use this file to document the project as a sequence of small AI-assisted changes. Record only work that actually happened. **Human verification fields are intentionally blank and must be completed by you after you personally test the game.**

Copy the entry template for each meaningful revision rather than pasting one giant prompt.

## Entry template

### Change

What I wanted to improve:

> _Fill in._

### Agent instruction

Concise summary of what I asked the AI agent to do:

> _Fill in._

### Inspection/diagnosis

What issue was found by inspection or testing:

> _Fill in only with findings that actually occurred._

### Implementation

What files or logic changed:

> _Fill in with the actual revision._

### Human verification

What I personally tested:

> _Complete this yourself after testing._

### Result

Did the change work? What did I adjust afterward?

> _Complete this yourself._

---

## Suggested incremental entries to document

These are **prompts/placeholders, not claims that you personally completed the tests**.

### Entry: Core playable loop

**Change:** Ready → Start → Gameplay → Results → Restart flow.

**Agent instruction:** _Summarize the request that produced or repaired the core loop._

**Inspection/diagnosis:** _Record the actual issue found._

**Implementation:** _Record the actual files/logic changed._

**Human verification:** _Personally run several full rounds and restarts; record what happened._

**Result:** _Fill in._

### Entry: Scoring and combo rules

**Change:** Target points, combo bonus/cap, zero-point misses, and decoy penalty.

**Agent instruction:** _Summarize the scoring request._

**Inspection/diagnosis:** _Record the actual scoring inconsistency or bug, if any._

**Implementation:** _Record the actual files/logic changed._

**Human verification:** _Check a first hit, several combo hits, an empty-space miss, an expired target, and a decoy._

**Result:** _Fill in._

### Entry: Accessibility and input modes

**Change:** Keyboard, mouse, touch, focus behavior, and screen-reader status announcements.

**Agent instruction:** _Summarize the accessibility request._

**Inspection/diagnosis:** _Record the actual issue found._

**Implementation:** _Record the actual files/logic changed._

**Human verification:** _Play using keyboard only, then mouse only, then touch on a phone if available._

**Result:** _Fill in._

### Entry: Results, high score, and persistence

**Change:** Result calculations, rating, accuracy, and local high score.

**Agent instruction:** _Summarize the results/persistence request._

**Inspection/diagnosis:** _Record the actual issue found._

**Implementation:** _Record the actual files/logic changed._

**Human verification:** _Check result values manually and reload the page to verify the high score persists._

**Result:** _Fill in._

### Entry: Unfamiliar-user revision

**Change:** Revision made after a genuine silent user test.

**Agent instruction:** _Only fill this after you have real observations from `USER_TEST.md`._

**Inspection/diagnosis:** _Describe the most consequential observed friction._

**Implementation:** _Describe the revision made in response._

**Human verification:** _Run a second genuine attempt and record the behavior._

**Result:** _Fill in._

### Entry: Player-selectable difficulty

**Change:** Add distinct Easy, Medium, and Hard modes without changing the 30-second scoring loop.

**Agent instruction:** _Summarize the request to add player-selectable difficulty and make Easy substantially easier._

**Inspection/diagnosis:** _Record what you observed about the previous single difficulty/progression system._

**Implementation:** _Record the actual mode differences (target size, lifetime, decoy rate), selector UI, and per-mode high-score behavior._

**Human verification:** _Personally play at least one full round on Easy, Medium, and Hard. Confirm Easy feels clearly more forgiving and Hard clearly more demanding._

**Result:** _Fill in after your own test._


### Entry: Start placement and Top-25 leaderboard

**Change:** Place Start directly above the play area and add an all-time Top-25 score table for the current browser/device.

**Agent instruction:** _Summarize the request to keep the play area in view after Start and add a leaderboard that updates when a score qualifies._

**Inspection/diagnosis:** _Record whether the previous Start placement caused scrolling/friction and what leaderboard persistence existed before this change._

**Implementation:** _Record the relocated Start control, automatic play-area positioning, player-name field, local Top-25 sorting/persistence, mode/date columns, and storage fallback._

**Human verification:** _Personally play enough rounds to confirm new scores appear in the correct order, reload the page to confirm persistence, and test Start on both desktop and phone._

**Result:** _Fill in after your own test._

## Rename to ReactionBlitz

- **Change:** Renamed the project from Reflex Rush to ReactionBlitz.
- **Agent instruction:** Rename the game and provide the complete updated outputs.
- **Inspection/diagnosis:** Used the latest saved ZIP as the source of truth so difficulty modes, zero-point misses, Start positioning, and the local Top-25 leaderboard were preserved.
- **Implementation:** Updated visible branding, the JavaScript core namespace, test names/paths, documentation, and storage keys. Added migration reads for the previous Reflex Rush high-score, leaderboard, and player-name keys so existing browser data can carry forward.
- **Human verification:** _Not yet recorded._
- **Result:** _Automated verification is recorded separately when run; human verification remains for the project owner._
