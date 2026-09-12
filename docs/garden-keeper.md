# Garden Keeper prototype

Choose a free guest Keeper before each run. The Keeper stays separate from the ten merge tiers; merging does not change an Axie's native class or level.

| Build | Part | Local puzzle rule | Recharge |
| --- | --- | --- | --- |
| Plant Sprout | Yam tail | Upgrade one settled egg into a Plant bud | 4 merges |
| Aquatic Ripple | Nimo tail | Swap current and next drops | 3 merges |
| Aquatic Lookout | Sleepless eyes | Swap and reveal a second upcoming drop | 5 merges |
| Bird Breeze | Pigeon Post back | Nudge the pile toward your aim; small pieces move farther | 4 merges |

These are game-specific abilities, not native Axie ability descriptions. Portraits are assembled from official mixer layers. See axie-core-research.md for trait mappings and sources.

Every run starts with a full charge. Each successful natural merge adds one charge, capped at the build's cost. A direct Sprout upgrade earns neither points nor charge. Swapping identical drops costs nothing. Skills wait for the pile to settle and are blocked while paused or after game over. Gust and Sprout lock dropping until the affected bodies settle. Restart retains your Keeper; Change Keeper starts a new selection and discards the current run.

The UI supports touch buttons, keyboard selection, E for skills, and Escape to cancel targeting. Lookout's additional preview is materialized once and advances with the same queue used for actual drops. A swap exchanges only the first two entries.

## Product vision

The prototype gives players a reason to choose particular class/part combinations: fast intervention versus extra information, targeted upgrades versus pile movement. A later version could let players preview these same transparent rules using their own verified Axie traits, while retaining free guest builds. Level and evolved-part modifiers require separate balance work and explicit provenance. There is no ownership verification, native AXP, treasury contribution, or token integration in this prototype.

## Verification

Production build and 13 automated tests pass, covering charge accounting, queue ordering, collision behavior, spawn pools, and audio lifecycle. Browser checks cover mobile and desktop layout, keyboard selection, Plant targeting and spending, Lookout swapping and stable extra preview, pause/resume, and Gust charge spending and settle-lock release. Independent Astra review covered the initial core guards; its final review was interrupted by a usage limit.
