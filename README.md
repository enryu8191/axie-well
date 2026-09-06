# The Well

A browser drop-and-merge puzzle for Axie Infinity Vibeathon. Aim, release an egg, and merge matching stages: egg → hatchling → kid → teen → adult. Two adults burst to clear room. Includes an instruction screen, pause/resume, sound toggle, saved personal best, growth tracker, and touch/keyboard controls.

Each grown stage has a distinct official [`@axieinfinity/mixer`](https://www.npmjs.com/package/@axieinfinity/mixer) identity: green Plant hatchling, blue Aquatic kid, orange Beast teen, and pink Bird adult. Classes, color variants, body shapes, and parts differ per tier. This is a puzzle progression, not a claim that canonical Axies change class as they age. The egg is the original feed art.

Portrait well. Canvas is 720x1280. Phaser Scale.FIT + CENTER_BOTH letterboxes on a landscape monitor.

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

Run the dev server and open `/?qa`. The developer panel can seed colliding eggs, teens, adults, and a settled overflow piece. It shows current score, stage, piece count, drop availability, pause state, and game-over state. The QA panel and seed handlers are excluded from production builds; QA scores use separate browser storage.

Check normal Space/click drops, merge points, adult unlock, adult burst, overflow, restart repeatedly, mute, pause, and phone layout. Visual squash is applied only to rendered images; physics circles keep their configured radius.

## Sources and AI assistance

Based on [enryu8191/axie-well](https://github.com/enryu8191/axie-well), with gameplay repairs and UI implemented with OpenAI Codex. Official Axie mixer art is used without AI replacement. The original egg and existing source assets were inherited from the repository. See `ASSETS.md` for provenance.

Design guidance read: [Get Started with Axie Vibeathon](https://skymavis.notion.site/Get-Started-with-Axie-Vibeathon-3cec48ae3fdd81d6ba74d9b193aa8f4a) and [Builder Resource Kit](https://skymavis.notion.site/Builder-Resource-Kit-39ec48ae3fdd81449b68d1c361d319a5).

## Scoring

- two eggs -> hatchling: 10
- two hatchlings -> kid: 30
- two kids -> teen: 90
- two teens -> adult: 270
- two adults -> burst: 800 (no 6th stage)

Merges within 0.5s of the previous merge chain (growth spurt): first merge of a run is x1, next x2, then x3. Show xN on the +score popup if N>1. Reset if 0.5s elapses. Multiplier applies to merge points including adult pop.

## Next drop

Next drop is always an egg until you create your first adult this run. After the first adult, next drop is a hatchling. Never random sizes.

Overflow the red TOP-OUT line long enough and the well is lost.
