# ReactionBlitz — Unfamiliar-User Test Note

## Test setup

**Version tested:** https://mberrios10.github.io/ReactionBlitz/

**Tester:** First-use reviewer with no prior gameplay instructions used during the walkthrough.

**Instruction:** Open the game and try to begin a round using only the information visible on the page.

## Observed friction

The **Player name** field appeared directly before the Start button and looked like a required form field. Because the game already allows a blank name and automatically uses **Player**, the interface was creating an unnecessary decision before the first round.

## Diagnosis

The field label did not communicate that entering a name was optional. On a first visit, a player could reasonably stop to decide what to type instead of immediately starting the game. The underlying behavior was already forgiving; the problem was that the UI did not explain it.

## Revision made

Changed the label from **Player name** to **Player name (optional)** while keeping the existing blank-name fallback to **Player**. The Start button remains directly above the play area.

## Verification attempt

A second first-use walkthrough confirmed that the control now communicates that no name is required before starting. The full automated browser test suite was rerun after the change and continued to pass, including player-name handling, Start behavior, the complete round lifecycle, results, Restart, storage, and responsive checks.

## Outcome

The revision removes an avoidable first-step ambiguity without adding extra instructions or changing the core game loop. A new player can choose a difficulty and press Start immediately, while players who want their name on the local leaderboard can still enter one.