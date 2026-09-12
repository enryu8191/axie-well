# Garden Keeper Axie-core research

## Scope and source of truth

Garden Keeper uses free, game-local "guest builds." It does not read a wallet,
mint an Axie, transfer a token, award AXP, or submit a part-evolution request.
`Sprout`, `Swap`, and `Gust` are mechanics invented for The Well; they are not
Origins card effects or native Axie abilities. The puzzle's egg-to-tier change
is presentation and progression for this game, not a claim that an Axie
naturally ages, changes class, or evolves a part.

The render identities are pinned in
[`src/game/mixerAxies.ts`](../src/game/mixerAxies.ts). The installed
`@axieinfinity/mixer` gene catalogue verifies the renderer's exact class,
part type, `partValue`, and skin key (for example, an Aquatic tail with value
4 renders as `aquatic-04`). The mixer deliberately contains no display-name
field, so names below are resolved from the Axie gene decoder's public trait
table and its marketplace-style trait IDs, then checked against official Axie
metadata where an available sample exposes the same renderer keys.

Useful references:

- [Axie Mixer package](https://www.npmjs.com/package/@axieinfinity/mixer) and
  the repository's pinned data import in `mixerAxies.ts` are the rendering
  source.
- [Official Axie metadata sample #4200042](https://metadata.axieinfinity.com/axie/4200042)
  confirms the naming shape (`eyes-clear`, `tail-nimo`, `back-goldfish`,
  `horn-oranda`, and `mouth-risky-fish`) and cross-checks values 4, 6, 8, and
  10 against the mixer catalogue.
- [Axie gene parser trait table](https://github.com/shanemaglangit/agp/blob/master/assets/traits.json)
  supplies the value-to-canonical-name translation. This is a public decoder,
  not an official Sky Mavis product, so it must not be cited as game-rule
  authority.

## Keeper mapping

| Guest build | Well mechanic | Trait shown as its anchor | Render key / numeric value | Marketplace-style trait ID | Why it is a reliable image mapping |
| --- | --- | --- | --- | --- | --- |
| Plant **Sprout** | Upgrade a selected egg in the Well | **Yam** tail | `plant-08` / 8 | `tail-yam` | The keeper image is the Plant tier identity with its existing tail value 8. |
| Aquatic **Ripple** | Swap the current and next drop; 3-merge recharge | **Nimo** tail | `aquatic-04` / 4 | `tail-nimo` | The image keeps the base Aquatic eye value 4 and tail value 4. |
| Aquatic **Lookout** | Show two upcoming drops, then swap; 5-merge recharge | **Sleepless** eyes | `aquatic-02` / 2 | `eyes-sleepless` | Its rendered build changes the Aquatic eyes from value 4 to value 2. |
| Bird **Breeze** | Nudge the pile left or right | **Pigeon Post** back | `bird-08` / 8 | `back-pigeon-post` | The keeper image uses the Bird tier's existing back value 8. |

The two Aquatic options are deliberately distinct in the actual art as well
as their local balance rules: **Ripple** has Clear eyes (`aquatic-04`) and a
Nimo tail (`aquatic-04`); **Lookout** has Sleepless eyes (`aquatic-02`) and a
Koi tail (`aquatic-02`). These parts are explicitly mapped to local rules by The Well: Sleepless eyes grant an extra preview with a five-merge recharge, while Nimo tail without Sleepless eyes grants a three-merge recharge. These are custom puzzle effects, not native Axie or Origins abilities. The code resolves these bonuses from trait identifiers rather than the Keeper's display name.

## Exact traits present in the shown keeper art

These rows reflect the current build code, which is the narrowest defensible
claim about what a player can see.

| Build | Eyes | Ears | Back | Horn | Mouth | Tail |
| --- | --- | --- | --- | --- | --- | --- |
| Plant Sprout | Papi `plant-02` | Rosa `plant-06` | Pumpkin `plant-12` | Beech `plant-04` | Silence Whisper `plant-10` | Yam `plant-08` |
| Aquatic Ripple | Clear `aquatic-04` | Nimo `aquatic-02` | Hermit `aquatic-02` | Clamshell `aquatic-06` | Lam `aquatic-02` | Nimo `aquatic-04` |
| Aquatic Lookout | Sleepless `aquatic-02` | Nimo `aquatic-02` | Hermit `aquatic-02` | Clamshell `aquatic-06` | Lam `aquatic-02` | Koi `aquatic-02` |
| Bird Breeze | Mavis `bird-02` | Peace Maker `bird-08` | Pigeon Post `bird-08` | Kestrel `bird-08` | Peace Maker `bird-04` | Post Fight `bird-12` |

Use the trait name plus its slot when naming an image: “Nimo tail” and “Nimo
ears” are different slots that happen to share the same canonical name. Avoid
calling `plant-08`, `aquatic-04`, or `bird-08` universal part IDs: they are
mixer skin keys whose meaning depends on class and slot. The stable,
human-facing identifiers are `tail-yam`, `tail-nimo`, `eyes-sleepless`, and
`back-pigeon-post`.
