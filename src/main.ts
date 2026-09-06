import './shell';
import './garden.css';
import Phaser from "phaser";
import { Boot } from "./game/Boot";
import { Game } from "./game/Game";
import { PHYSICS_STEP_MS } from "./game/collisions";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 720,
  height: 1280,
  parent: "game",
  backgroundColor: "#b8e4f5",
  title: "The Well",
  banner: false,
  antialias: true,
  scene: [Boot, Game],
  physics: {
    default: "matter",
    matter: {
      gravity: { x: 0, y: 1.45 },
      enableSleeping: true,
      runner: { delta: PHYSICS_STEP_MS, maxUpdates: 6 },
      positionIterations: 10,
      velocityIterations: 6,
      constraintIterations: 2,
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Use the same font metrics for the canvas and surrounding interface.
void Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2500))])
  .then(() => new Phaser.Game(config));
