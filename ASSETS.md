# Assets

Grown Axies are built at runtime with the official 2D mixer:

- Package: [`@axieinfinity/mixer`](https://www.npmjs.com/package/@axieinfinity/mixer) 1.4.9
- Part textures: `https://axiecdn.axieinfinity.com/mixer-stuffs/v6/`
- Hatchling: Plant, `plant-04` green, `body-normal`; eyes 02, ears 06, back 12, horn 04, mouth 10, tail 08
- Kid: Aquatic, `aquatic-04` blue, `body-curly`; eyes 04, ears 02, back 02, horn 06, mouth 02, tail 04
- Teen: Beast, `beast-03` orange, `body-fuzzy`, lv2 parts; eyes 08, ears 04, back 04, horn 02, mouth 08, tail 10
- Adult: Bird, `bird-04` pink, `body-sumo`, lv2 parts; eyes 02, ears 08, back 08, horn 08, mouth 04, tail 12
- Appearance mapping lives in `src/game/mixerAxies.ts`. Color indices are resolved from the official gene catalog, and part keys are validated before loading.
- Use is for Axie Vibeathon and other Sky Mavis-approved programs

The plant-class egg is original feed art. Mixer part PNGs are loaded from Sky Mavis CDN, not vendored.

The egg and unused legacy sprite files are inherited unchanged from the source repository. No new AI-generated character art was added. The active game uses only the egg and the runtime mixer stages. Background, interface, growth trail, and particle effects are drawn with code. Audio is synthesized with the browser Web Audio API.

Typography: DM Sans, Fredoka and Nunito from Google Fonts (SIL Open Font License); system-font fallbacks are included. Dependencies remain pinned by `package-lock.json`. The mixer package declares MIT for code; that declaration does not grant general rights to Axie media. This build retains the source project's Axie Vibeathon/Sky Mavis-approved-program use scope.

References: [Vibeathon guide](https://skymavis.notion.site/Get-Started-with-Axie-Vibeathon-3cec48ae3fdd81d6ba74d9b193aa8f4a), [Builder Resource Kit](https://skymavis.notion.site/Builder-Resource-Kit-39ec48ae3fdd81449b68d1c361d319a5).
