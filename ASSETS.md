# Assets

Grown Axies are built at runtime with the official 2D mixer:

- Package: [`@axieinfinity/mixer`](https://www.npmjs.com/package/@axieinfinity/mixer) 1.4.9
- Part textures: `https://axiecdn.axieinfinity.com/mixer-stuffs/v6/`
- Hatchling: Plant, `plant-04` green, `body-normal`; eyes 02, ears 06, back 12, horn 04, mouth 10, tail 08
- Kid: Aquatic, `aquatic-04` blue, `body-curly`; eyes 04, ears 02, back 02, horn 06, mouth 02, tail 04
- Teen: Beast, `beast-03` orange, `body-fuzzy`, lv2 parts; eyes 08, ears 04, back 04, horn 02, mouth 08, tail 10
- Adult: Bird, `bird-04` pink, `body-sumo`, lv2 parts; eyes 02, ears 08, back 08, horn 08, mouth 04, tail 12
- Elder: Bug, `bug-03` red, `body-fuzzy`, lv2; eyes 04, ears 10, back 06, horn 12, mouth 10, tail 02
- Guardian: Reptile, `reptile-03` purple, `body-normal`, lv2; eyes 08, ears 12, back 04, horn 06, mouth 08, tail 12
- Sentinel: Mech, `mech-00` white, `body-sumo`, lv2 Bug parts; eyes 10, ears 04, back 12, horn 04, mouth 04, tail 08
- Colossus: Dusk, `dusk-03` teal, `body-curly`, lv2 Reptile parts; eyes 04, ears 06, back 08, horn 10, mouth 10, tail 04
- Titan: Dawn, `dawn-03` gold, `body-sumo`, lv2 Bird parts; eyes 10, ears 02, back 12, horn 12, mouth 02, tail 08
- Mech, Dusk, and Dawn use official class/color variants with base-class parts. The mixer catalog has parts for six base classes, and body/color variants for all nine classes.
- Appearance mapping lives in `src/game/mixerAxies.ts`. Color indices are resolved from the official gene catalog, and part keys are validated before loading.
- Use is for Axie Vibeathon and other Sky Mavis-approved programs

The plant-class egg is original feed art. Mixer part PNGs are loaded from Sky Mavis CDN, not vendored.

The egg and unused legacy sprite files are inherited unchanged from the source repository. No new AI-generated character art was added. The active game uses only the egg and the runtime mixer stages. Audio is synthesized with the browser Web Audio API.

## Garden interface artwork

The built-in OpenAI image generator created these decorative assets on 2026-09-06:

- `public/ui/garden-background.png`: illustrated garden environment used by the page and Phaser scene.
- `public/ui/garden-panel.png`: transparent stone-and-leaf frame used for scores, next-piece previews, growth trails, menus, and the game-over card. Nine-slice rendering preserves its corners at different sizes.
- `public/ui/garden-button.png`: transparent green action-button artwork used behind HTML labels and the in-game Restart control.

These are original decorative illustrations, separate from the official Axie character assets. All labels, scores, hit areas, physics walls, and merge particles remain code-driven. Generation prompts are recorded in `docs/art-prompts.md`.

Typography: DM Sans, Fredoka and Nunito from Google Fonts (SIL Open Font License); system-font fallbacks are included. Dependencies remain pinned by `package-lock.json`. The mixer package declares MIT for code; that declaration does not grant general rights to Axie media. This build retains the source project's Axie Vibeathon/Sky Mavis-approved-program use scope.

References: [Vibeathon guide](https://skymavis.notion.site/Get-Started-with-Axie-Vibeathon-3cec48ae3fdd81d6ba74d9b193aa8f4a), [Builder Resource Kit](https://skymavis.notion.site/Builder-Resource-Kit-39ec48ae3fdd81449b68d1c361d319a5).
