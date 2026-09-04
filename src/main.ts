import Phaser from "phaser";
import { Boot } from "./game/Boot";
import { Game } from "./game/Game";

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
      positionIterations: 8,
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

new Phaser.Game(config);
