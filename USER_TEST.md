# ReactionBlitz — Unfamiliar-User Test Note

> **Status:** One genuine unfamiliar-user test is still required before this can truthfully be submitted as a completed human test. The development record does not contain an unfamiliar tester's observations, so none are invented here.

## Test setup

**Version tested:** https://mberrios10.github.io/ReactionBlitz/

**Tester:** Tester A — a person who has not previously played or helped build ReactionBlitz.

**Instruction given:** “Please play this game. I won't explain how it works unless you become completely unable to continue.”

## First attempt

**Observed friction:** _After the test, replace this line with one concrete behavior you actually saw. Example format: “The tester ______ before/while trying to ______.”_

**Diagnosis:** _State what part of the interface or gameplay likely caused that behavior._

## Revision

**Change made in response:** _State the specific UI/gameplay change made because of that observed friction._

## Verification attempt

**What happened after the revision:** _Have the tester try again and record the concrete behavior._

**Outcome:** _State whether the friction was reduced and what, if anything, still needs work._

---

## Documented usability feedback already addressed during development

This section is **not** a substitute for the unfamiliar-user test above, but it records a genuine usability issue that did lead to a revision.

**Observed friction reported by the project owner:** The Start button's previous location meant the player had to scroll after pressing Start before reaching the play area.

**Revision:** The player-name field and Start button were moved directly above the play area. Starting a round now also positions the play area in view automatically.

**Verification:** Automated responsive browser tests confirm that Start is directly before the play area and that the play area is positioned near the top of the viewport after starting. A separate unfamiliar human tester still needs to verify the revision behavior for the assignment requirement.

## Fast completion checklist

1. Open the public URL for someone who has never played the game.
2. Give only the silent-test instruction above.
3. Watch one round without coaching.
4. Write down the single biggest point of confusion as a concrete behavior.
5. Make one small revision based on that behavior.
6. Have the same tester try again.
7. Replace the italicized placeholders above with what actually happened.

This preserves the assignment's requirement that the test note describe a real unfamiliar user's observed friction and a verified revision rather than a fabricated test.