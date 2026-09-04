# The Well

Greybox for Axie Infinity Vibeathon. One well, one Axie. Drop-merge raise: egg to hatchling to kid to teen to adult. Feed is the drop, not Suika fruit.

Pieces use official 2D starter Axie art from Sky Mavis (`cc-axie-gtk2d`): blossom hatchling, Puffy kid, Pomodoro teen, Buba adult.

Portrait well. Canvas is 720x1280. Phaser Scale.FIT + CENTER_BOTH letterboxes on a landscape monitor.

## Run

npm install && npm run dev

Open http://localhost:3000

## Controls

- Move: mouse / A D / arrow keys
- Drop: click / Space
- Restart: R, or the Restart button on the HUD and the game-over overlay

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
