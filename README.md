# The Well

A browser drop-and-merge puzzle for Axie Infinity Vibeathon. Aim, release a random small Axie, and merge matching pairs through 10 increasingly large tiers. Bird adult is the midpoint; the final Dawn titan fills over three quarters of the jar's width. Two titans burst to clear room. Includes a separate next-piece preview, instruction screen, pause/resume, sound toggle, saved personal best, growth tracker, and touch/keyboard controls.

Each grown tier has a distinct official [`@axieinfinity/mixer`](https://www.npmjs.com/package/@axieinfinity/mixer) identity: green Plant, blue Aquatic, orange Beast, pink Bird, red Bug, purple Reptile, white Mech, deep teal Dusk, and golden Dawn. Classes, colors, body shapes, and parts differ per tier. This is a puzzle progression, not a claim that canonical Axies change class as they age. The egg is the original feed art.

Portrait well. Canvas is 720x1280. Phaser Scale.FIT + CENTER_BOTH letterboxes on a landscape monitor.

The garden environment, HUD frames, and action buttons use generated illustration assets. Scores and labels remain live text; the official Axie mixer sprites and game physics are unchanged. See `ASSETS.md` and `docs/art-prompts.md` for the artwork provenance.

## Play online (GitHub Pages)

Public link after deploy: **https://enryu8191.github.io/axie-well/**

One-time setup (if Pages is not on yet):

1. Open [Settings → Pages](https://github.com/enryu8191/axie-well/settings/pages)
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Push to `main` (or run the **Deploy GitHub Pages** workflow from the Actions tab)

Every later push to `main` rebuilds and republishes automatically.

## Run locally

npm install && npm run dev

Open http://localhost:3000

## Controls

- Move: mouse / A D / arrow keys
- Drop: click and release / Space. On touch, drag to aim and release to drop.
- Restart: R, or the Restart button on the HUD and the game-over overlay
- Pause/resume: P or the top toolbar. Switching away from the window pauses the game.
- Sound: M or the top toolbar. Best score and sound preference are saved in this browser; storage is optional.

## Build and preview

`npm ci` installs the locked dependencies. `npm run build` runs TypeScript checks and creates `dist/`. Serve that folder with an HTTP server, or use `npm run preview` (port 3000 by default). For a different port: `npm run preview -- --port 4173`.

Use a current browser. An internet connection is needed on first load for official Axie mixer textures and optional Google Fonts. Failed texture loading shows a retry button rather than starting a game with missing art. No wallet, account, API key, or backend is required.

## Development checks

`npm test` checks weighted drop variety, milestone unlocks, the three-repeat limit, preview stability, queue reset, and the ten-tier size ladder. Run the dev server and open `/?qa` for colliding eggs, teens, Birds, Dusk pairs, titans, and a settled overflow piece. The panel shows current and queued drops, unlocked pool, score, tier, pieces, pause, and game-over state. QA controls are excluded from production builds; QA scores use separate browser storage.

Check Space/click drops, Bird-to-Bug growth, Dusk-to-Dawn growth, titan burst, overflow, restart, mute, pause, and phone layout. Visual squash is applied only to rendered images; physics circles keep their configured radius. Larger merged bodies are clamped inside the side walls and above the floor.

## Sources and AI assistance

Based on [enryu8191/axie-well](https://github.com/enryu8191/axie-well), with gameplay repairs and UI implemented with OpenAI Codex. Official Axie mixer art is used without AI replacement. The original egg and existing source assets were inherited from the repository. See `ASSETS.md` for provenance.

Design guidance read: [Get Started with Axie Vibeathon](https://skymavis.notion.site/Get-Started-with-Axie-Vibeathon-3cec48ae3fdd81d6ba74d9b193aa8f4a) and [Builder Resource Kit](https://skymavis.notion.site/Builder-Resource-Kit-39ec48ae3fdd81449b68d1c361d319a5).

## Scoring

- two eggs -> hatchling: 10
- two hatchlings -> kid: 30
- two kids -> teen: 90
- two teens -> adult: 270
- two adults -> Bug elder: 810
- two elders -> Reptile guardian: 2,430
- two guardians -> Mech sentinel: 7,290
- two sentinels -> Dusk colossus: 21,870
- two colossi -> Dawn titan: 65,610
- two titans -> burst: 200,000

Merges within 0.5s of the previous merge chain (growth spurt): first merge of a run is x1, next x2, then x3. Show xN on the +score popup if N>1. Reset if 0.5s elapses. Multiplier applies to merge points including titan bursts.

## Next drop

Drops are randomly selected with the following base weights (egg, hatchling, kid, teen, adult, elder):

| Highest tier reached this run | Pool weights |
| --- | --- |
| Start | 50, 32, 18 |
| Bird adult | 35, 30, 23, 12 |
| Reptile guardian | 22, 28, 25, 17, 8 |
| Dusk colossus | 15, 23, 25, 19, 12, 6 |

After three identical selections, that tier is temporarily excluded for one roll and the remaining weights are renormalized. This slightly changes the long-run frequencies from the base percentages. Mech, Reptile, Dusk, and Dawn remain merge-only. Unlocks use the highest tier ever reached in the current run and reset on restart.

The aimed Axie is the current drop; UP NEXT shows the following drop. Both choices remain fixed until a successful drop. New unlocks apply when refilling the queue, never by changing an already shown preview.

Overflow the red TOP-OUT line long enough and the well is lost.
