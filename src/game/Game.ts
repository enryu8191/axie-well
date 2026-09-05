import Phaser from "phaser";
import { readPreferences, savePreferences } from "./storage";
import {
  ADULT_BURST_SCORE,
  MAX_STAGE,
  STAGES,
  stageKey,
  titleCase,
} from "./stages";

const WIDTH = 720;
const HEIGHT = 1280;
const WELL_CX = 360;
const WELL_W = 544;
const WALL_T = 44;
const FLOOR_Y = 1144;
const FLOOR_H = 52;
const WALL_TOP = 180;
const KILL_Y = 274;
const DROP_Y = 220;
const PREVIEW_SPEED = 520;
const SETTLE_SPEED = 0.22;
const SETTLE_FRAMES = 16;
const OVERFLOW_MS = 1000;
const INPUT_GRACE_MS = 280;
const CHAIN_WINDOW_MS = 500;

const FONT_UI = "Nunito, ui-rounded, ui-sans-serif, system-ui, sans-serif";
const FONT_DISPLAY = "Fredoka, Nunito, ui-rounded, ui-sans-serif, system-ui, sans-serif";
const INK = "#3a4a38";
const MUTE = "#5a6a50";

type MatterBody = {
  id: number;
  velocity: { x: number; y: number };
  angularVelocity: number;
  isSleeping: boolean;
  position: { x: number; y: number };
  gameObject?: Phaser.GameObjects.GameObject;
  parent?: { gameObject?: Phaser.GameObjects.GameObject };
};

interface Piece {
  id: number;
  stage: number;
  img: Phaser.GameObjects.Image;
  physics: Phaser.Physics.Matter.Image;
  merging: boolean;
  born: number;
}

export class Game extends Phaser.Scene {
  private pieces = new Map<number, Piece>();
  private nextId = 1;
  private score = 0;
  private bestReached = 0;
  private madeAdult = false;
  private chain = 0;
  private lastMergeAt = -99999;
  private canDrop = true;
  private over = false;
  private currentDrop: Piece | null = null;
  private settleFrames = 0;
  private overflowMs = 0;
  private previewX = WELL_CX;
  private mergeQueue: [Piece, Piece][] = [];
  private ignoreUntil = 0;
  private audio?: AudioContext;
  private restarting = false;
  private started = false;
  private paused = false;
  private preferences = readPreferences();
  private aim!: Phaser.GameObjects.Graphics;
  private danger!: Phaser.GameObjects.Text;
  private growthIcons: Phaser.GameObjects.Image[] = [];
  private lastUiState = '';
  private pointerArmed = false;

  private preview!: Phaser.GameObjects.Image;
  private guide!: Phaser.GameObjects.Ellipse;
  private hudScore!: Phaser.GameObjects.Text;
  private hudAxie!: Phaser.GameObjects.Text;
  private hudNext!: Phaser.GameObjects.Image;
  private overlay!: Phaser.GameObjects.Container;
  private ovTitle!: Phaser.GameObjects.Text;
  private ovScore!: Phaser.GameObjects.Text;

  private leftKey?: Phaser.Input.Keyboard.Key;
  private rightKey?: Phaser.Input.Keyboard.Key;
  private aKey?: Phaser.Input.Keyboard.Key;
  private dKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super("Game");
  }

  create(data: { playing?: boolean } = {}): void {
    this.pieces = new Map();
    this.nextId = 1;
    this.score = 0;
    this.bestReached = 0;
    this.madeAdult = false;
    this.chain = 0;
    this.lastMergeAt = -99999;
    this.canDrop = true;
    this.over = false;
    this.currentDrop = null;
    this.settleFrames = 0;
    this.overflowMs = 0;
    this.previewX = WELL_CX;
    this.mergeQueue = [];
    this.restarting = false;
    this.paused = false;
    this.pointerArmed = false;
    this.started = Boolean(data.playing);
    this.growthIcons = [];
    this.lastUiState = '';
    this.ignoreUntil = this.time.now + INPUT_GRACE_MS;
    this.drawWorld();
    this.buildWalls();
    this.buildHud();
    this.buildOverlay();
    this.bindInput();
    this.bindPhysics();
    this.syncNextDropVisuals();
    this.preview.setPosition(this.previewX, DROP_Y);
    this.connectShell();
    if (this.started) this.matter.world.resume();
    else this.matter.world.pause();
    this.refreshHud();
    if (import.meta.env.DEV && new URLSearchParams(location.search).has("preview")) {
      this.spawn(1, WELL_CX - 90, 720, 0, 0, 0);
      this.spawn(2, WELL_CX + 90, 760, 0, 0, 0);
      this.spawn(3, WELL_CX - 40, 900, 0, 0, 0);
      this.spawn(4, WELL_CX + 70, 980, 0, 0, 0);
      this.canDrop = true;
    }
  }

  update(_t: number, delta: number): void {
    const dt = Math.min(delta, 50);
    for (const p of this.pieces.values()) {
      p.img.setPosition(p.physics.x, p.physics.y).setRotation(p.physics.rotation);
    }
    if (!this.started || this.paused) return;
    this.steerPreview(dt);
    this.preview.setPosition(this.previewX, DROP_Y);
    this.preview.setAlpha(this.over ? 0 : this.canDrop ? 1 : 0.42);
    const pr = STAGES[this.nextDropStage()].radius;
    this.guide.setPosition(this.previewX, DROP_Y + pr * 0.95 + 10);
    this.guide.setSize(Math.max(40, pr * 1.9), Math.max(16, pr * 0.48));
    this.guide.setAlpha(this.over ? 0 : this.canDrop ? 0.5 : 0.22);

    this.aim.clear();
    if (this.canDrop && !this.over) {
      this.aim.lineStyle(2, 0x6b8d63, 0.25);
      for (let y = DROP_Y + 48; y < FLOOR_Y - 30; y += 22) this.aim.lineBetween(this.previewX, y, this.previewX, y + 8);
    }
    if (this.over) return;

    this.tickSettle();
    this.tickOverflow(dt);
    this.refreshHud();
  }

  private fitSprite(img: Phaser.GameObjects.Image, stage: number): void {
    const fit = STAGES[stage].radius * 2 * 1.28;
    img.setDisplaySize(fit, fit);
  }

  private drawWorld(): void {
    const g = this.add.graphics().setDepth(0);

    g.fillStyle(0xa8d8f0, 1);
    g.fillRect(0, 0, WIDTH, HEIGHT);
    g.fillStyle(0xcfeaf8, 1);
    g.fillEllipse(WELL_CX, 310, 820, 520);

    g.fillStyle(0xf7ecd8, 0.78);
    g.fillEllipse(WELL_CX, 8, 980, 248);

    const cloud = (x: number, y: number, s: number) => {
      g.fillStyle(0xffffff, 0.7);
      g.fillEllipse(x, y, 110 * s, 42 * s);
      g.fillEllipse(x - 34 * s, y + 6 * s, 64 * s, 30 * s);
      g.fillEllipse(x + 36 * s, y + 4 * s, 70 * s, 32 * s);
    };
    cloud(84, 48, 1);
    cloud(640, 42, 0.92);

    g.fillStyle(0x6fbe5e, 1);
    g.fillEllipse(WELL_CX, 1264, 1080, 340);
    g.fillStyle(0x8ed67a, 1);
    g.fillEllipse(WELL_CX - 70, 1228, 620, 200);
    g.fillStyle(0x5eaa52, 0.7);
    g.fillEllipse(WELL_CX + 140, 1284, 540, 180);

    const innerLeft = WELL_CX - WELL_W / 2;
    const innerRight = WELL_CX + WELL_W / 2;
    const outerW = WELL_W + WALL_T * 2;
    const outerX = WELL_CX - outerW / 2;
    const tankTop = WALL_TOP;
    const tankBot = FLOOR_Y + FLOOR_H / 2;
    const restY = FLOOR_Y - FLOOR_H / 2;
    const outerR = 96;
    const innerR = 72;

    g.fillStyle(0xe8d5b0, 1);
    g.fillRoundedRect(outerX, tankTop - 8, outerW, tankBot - tankTop + 28, outerR);
    g.fillStyle(0xd9c4a0, 1);
    g.fillRoundedRect(outerX + 10, tankTop + 2, outerW - 20, tankBot - tankTop + 8, outerR - 10);
    g.lineStyle(10, 0xcbb892, 1);
    g.strokeRoundedRect(outerX + 4, tankTop - 4, outerW - 8, tankBot - tankTop + 20, outerR - 4);

    g.fillStyle(0xf7ecd8, 1);
    g.fillRoundedRect(innerLeft, tankTop, WELL_W, tankBot - tankTop, innerR);

    g.fillStyle(0xa8d8f0, 0.34);
    g.fillRoundedRect(innerLeft + 4, tankTop + 4, WELL_W - 8, 128, { tl: innerR - 8, tr: innerR - 8, bl: 28, br: 28 });
    g.fillStyle(0xffffff, 0.16);
    g.fillEllipse(innerLeft + 90, tankTop + 90, 120, 220);

    g.fillStyle(0x8ed67a, 1);
    g.fillEllipse(WELL_CX, restY + 34, WELL_W - 28, 68);
    g.fillStyle(0x7ec86a, 1);
    g.fillEllipse(WELL_CX, restY + 44, WELL_W - 64, 56);
    g.fillStyle(0x5eaa52, 0.9);
    g.fillEllipse(WELL_CX, restY + 12, WELL_W - 80, 16);

    const rimW = outerW + 28;
    const rimH = 62;
    g.fillStyle(0xe8d5b0, 1);
    g.fillEllipse(WELL_CX, tankTop + 6, rimW, rimH);
    g.fillStyle(0xcbb892, 1);
    g.fillEllipse(WELL_CX, tankTop + 12, rimW - 18, rimH - 14);
    g.fillStyle(0xfff6e8, 1);
    g.fillEllipse(WELL_CX, tankTop + 4, rimW - 22, rimH - 18);
    g.fillStyle(0xf7ecd8, 1);
    g.fillEllipse(WELL_CX, tankTop + 12, WELL_W + 6, 34);
    g.lineStyle(6, 0xfff6e8, 0.65);
    g.strokeEllipse(WELL_CX, tankTop + 2, rimW - 30, 40);

    g.fillStyle(0xe07a5f, 0.28);
    g.fillRoundedRect(innerLeft + 36, KILL_Y - 5, WELL_W - 72, 10, 5);

    this.add
      .text(innerRight - 28, KILL_Y - 14, "TOP-OUT", {
        fontFamily: FONT_UI,
        fontSize: "18px",
        color: "#c45c48",
        fontStyle: "800",
      })
      .setOrigin(1, 1)
      .setDepth(4);

    this.guide = this.add
      .ellipse(WELL_CX, DROP_Y + 36, 48, 20, 0xfff6e8, 0.55)
      .setStrokeStyle(4, 0xd9c4a0, 0.4)
      .setDepth(8);

    this.preview = this.add
      .image(WELL_CX, DROP_Y, stageKey(0))
      .setAlpha(0.92)
      .setDepth(20);
    this.fitSprite(this.preview, 0);
    this.aim = this.add.graphics().setDepth(5);
    this.danger = this.add.text(WELL_CX, KILL_Y + 28, '', {
      fontFamily: FONT_UI, fontSize: '22px', color: '#a43f30', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(25);
  }

  private buildWalls(): void {
    const innerLeft = WELL_CX - WELL_W / 2;
    const innerRight = WELL_CX + WELL_W / 2;
    const wallH = FLOOR_Y + FLOOR_H / 2 - WALL_TOP;
    const wallCy = WALL_TOP + wallH / 2;
    const opts = { isStatic: true, friction: 0.45, frictionStatic: 0.7, restitution: 0.02, label: "wall" };
    this.matter.add.rectangle(innerLeft - WALL_T / 2, wallCy, WALL_T, wallH, opts);
    this.matter.add.rectangle(innerRight + WALL_T / 2, wallCy, WALL_T, wallH, opts);
    this.matter.add.rectangle(WELL_CX, FLOOR_Y, WELL_W + WALL_T * 2, FLOOR_H, {
      ...opts,
      label: "floor",
      friction: 0.55,
    });
  }

  private buildHud(): void {
    const pillY = 112;
    const g = this.add.graphics().setDepth(29);

    this.add
      .text(WELL_CX, 32, "THE WELL  /  AXIE MERGE", {
        fontFamily: FONT_DISPLAY,
        fontSize: "28px",
        color: INK,
        fontStyle: "700",
        stroke: "#fff6e8",
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.drawPill(g, 102, pillY, 168, 58, 0xf7ecd8, 0xd9c4a0);
    this.add
      .text(102, pillY - 12, "SCORE", {
        fontFamily: FONT_UI,
        fontSize: "18px",
        color: MUTE,
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.hudScore = this.add
      .text(102, pillY + 13, "0", {
        fontFamily: FONT_DISPLAY,
        fontSize: "22px",
        color: INK,
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.drawPill(g, 292, pillY, 196, 58, 0xf7ecd8, 0xb8e8c8);
    this.add
      .text(292, pillY - 12, "YOUR AXIE", {
        fontFamily: FONT_UI,
        fontSize: "18px",
        color: MUTE,
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(30);
    this.hudAxie = this.add
      .text(292, pillY + 13, "—", {
        fontFamily: FONT_DISPLAY,
        fontSize: "20px",
        color: INK,
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.drawPill(g, 458, pillY, 116, 58, 0xf7ecd8, 0xa8d8f0);
    this.add
      .text(458, pillY - 16, "NEXT", {
        fontFamily: FONT_UI,
        fontSize: "18px",
        color: MUTE,
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(30);
    g.fillStyle(0xfff6e8, 1);
    g.fillCircle(458, pillY + 12, 18);
    g.lineStyle(4, 0xd9c4a0, 1);
    g.strokeCircle(458, pillY + 12, 18);
    this.hudNext = this.add.image(458, pillY + 12, stageKey(0)).setDepth(30);
    this.fitHudNext();

    this.addRestartButton(624, pillY, 30, 152, 58);

    STAGES.forEach((st, i) => {
      const x = 136 + i * 112;
      this.growthIcons.push(this.add.image(x, 1190, stageKey(i)).setDisplaySize(50, 50).setDepth(30).setAlpha(i === 0 ? 1 : 0.35));
      this.add.text(x, 1220, titleCase(st.name), { fontFamily: FONT_UI, fontSize: '15px', color: INK }).setOrigin(0.5).setDepth(30);
      if (i < MAX_STAGE) this.add.text(x + 56, 1190, '›', { fontFamily: FONT_UI, fontSize: '26px', color: MUTE }).setOrigin(0.5).setDepth(30);
    });
    this.add
      .text(WELL_CX, HEIGHT - 26, "aim & release  ·  Space drop  ·  P pause", {
        fontFamily: FONT_UI,
        fontSize: "18px",
        color: INK,
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0.72);
  }

  private drawPill(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    w: number,
    h: number,
    fill: number,
    stroke: number,
  ): void {
    g.fillStyle(fill, 1);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, h / 2);
    g.lineStyle(5, stroke, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  }

  private fitHudNext(): void {
    this.hudNext.setDisplaySize(34, 34);
  }

  private buildOverlay(): void {
    const veil = this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xb8e4f5, 0.55);
    const card = this.add.graphics();
    const cw = 560;
    const ch = 380;
    const cx = WIDTH / 2 - cw / 2;
    const cy = HEIGHT / 2 - ch / 2 - 10;
    card.fillStyle(0xf7ecd8, 1);
    card.fillRoundedRect(cx, cy, cw, ch, 48);
    card.lineStyle(8, 0xd9c4a0, 1);
    card.strokeRoundedRect(cx, cy, cw, ch, 48);
    card.fillStyle(0xffffff, 0.28);
    card.fillEllipse(WIDTH / 2, cy + 70, 360, 90);
    this.ovTitle = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 86, "YOUR AXIE reached Egg", {
        fontFamily: FONT_DISPLAY,
        fontSize: "36px",
        color: INK,
        align: "center",
        fontStyle: "700",
        wordWrap: { width: 500 },
      })
      .setOrigin(0.5);
    this.ovScore = this.add
      .text(WIDTH / 2, HEIGHT / 2 - 10, "Score 0", {
        fontFamily: FONT_UI,
        fontSize: "26px",
        color: MUTE,
        fontStyle: "800",
      })
      .setOrigin(0.5);
    const ovBtn = this.addRestartButton(WIDTH / 2, HEIGHT / 2 + 78, 51, 220, 64);
    this.overlay = this.add.container(0, 0, [veil, card, this.ovTitle, this.ovScore, ovBtn]).setDepth(50);
    this.overlay.setVisible(false);
  }

  private addRestartButton(
    x: number,
    y: number,
    depth: number,
    w = 148,
    h = 56,
  ): Phaser.GameObjects.Container {
    const bg = this.add.graphics();
    const paint = (fill: number) => {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      bg.lineStyle(5, 0x5eaa52, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    };
    paint(0x8ed67a);
    const txt = this.add
      .text(0, 0, "Restart", {
        fontFamily: FONT_DISPLAY,
        fontSize: h >= 60 ? "26px" : "20px",
        color: INK,
        fontStyle: "700",
      })
      .setOrigin(0.5);
    const c = this.add.container(x, y, [bg, txt]).setDepth(depth);
    c.setSize(w, h);
    c.setInteractive({ useHandCursor: true });
    c.setData("ui", "restart");
    c.on("pointerover", () => paint(0x7ec86a));
    c.on("pointerout", () => paint(0x8ed67a));
    c.on("pointerdown", () => this.restart());
    return c;
  }

  private bindInput(): void {
    const kb = this.input.keyboard;
    if (kb) {
      kb.addCapture("SPACE,LEFT,RIGHT,A,D,R,P,M,ENTER");
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.leftKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this.rightKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
      this.aKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.dKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      kb.on("keydown-R", () => { if (this.started) this.restart(); });
      kb.on("keydown-P", () => this.togglePause());
      kb.on("keydown-M", () => this.toggleMute());
      kb.on("keydown-ENTER", () => { if (!this.started) this.begin(); });
      kb.on("keydown-SPACE", () => this.tryDrop());
    }
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      document.getElementById('game')?.focus({ preventScroll: true });
      if (p.button !== 0 && p.button !== -1) return;
      if (this.restarting || !this.started || this.paused) return;
      const hits = this.input.hitTestPointer(p);
      if (hits.some((o) => o.getData("ui") === "restart")) return;
      if (this.over || p.worldY < WALL_TOP || p.worldY > FLOOR_Y) return;
      this.previewX = this.clampX(p.worldX, this.nextDropStage());
      this.pointerArmed = true;
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.pointerArmed) return;
      this.pointerArmed = false;
      this.previewX = this.clampX(p.worldX, this.nextDropStage());
      this.tryDrop();
    });
    this.input.on('pointerupoutside', () => { this.pointerArmed = false; });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (this.keyHeld()) return;
      this.previewX = this.clampX(p.worldX, this.nextDropStage());
    });
  }

  private bindPhysics(): void {
    this.matter.world.on("collisionstart", (event: { pairs: { bodyA: MatterBody; bodyB: MatterBody }[] }) => {
      for (const pair of event.pairs) {
        this.tryQueueMerge(pair.bodyA, pair.bodyB);
      }
    });
    this.matter.world.on("afterupdate", () => this.flushMerges());
  }

  private keyHeld(): boolean {
    return Boolean(
      this.leftKey?.isDown || this.rightKey?.isDown || this.aKey?.isDown || this.dKey?.isDown,
    );
  }

  private nextDropStage(): number {
    return this.madeAdult ? 1 : 0;
  }

  private syncNextDropVisuals(): void {
    const stage = this.nextDropStage();
    const key = stageKey(stage);
    this.preview.setTexture(key);
    this.fitSprite(this.preview, stage);
    this.hudNext.setTexture(key);
    this.fitHudNext();
    this.previewX = this.clampX(this.previewX, stage);
  }

  private steerPreview(dt: number): void {
    const stage = this.nextDropStage();
    const dir =
      (this.rightKey?.isDown || this.dKey?.isDown ? 1 : 0) -
      (this.leftKey?.isDown || this.aKey?.isDown ? 1 : 0);
    if (dir !== 0) {
      this.previewX = this.clampX(this.previewX + dir * PREVIEW_SPEED * (dt / 1000), stage);
      return;
    }

  }

  private clampX(x: number, stage: number): number {
    const r = STAGES[stage].radius;
    const min = WELL_CX - WELL_W / 2 + r + 2;
    const max = WELL_CX + WELL_W / 2 - r - 2;
    return Phaser.Math.Clamp(x, min, max);
  }

  private tryDrop(): void {
    if (this.over || this.restarting || !this.started || this.paused) return;
    if (!this.canDrop) return;
    if (this.time.now < this.ignoreUntil) return;
    this.unlockAudio();
    const stage = this.nextDropStage();
    const x = this.clampX(this.previewX, stage);
    const piece = this.spawn(stage, x, DROP_Y, 0, 1.2, 0.04 * (Math.random() - 0.5));
    const sx = piece.img.scaleX;
    const sy = piece.img.scaleY;
    piece.img.setScale(sx * 1.2, sy * 0.8);
    this.tweens.add({
      targets: piece.img,
      scaleX: sx,
      scaleY: sy,
      duration: 180,
      ease: "Back.out",
    });
    this.beep(240);
    this.canDrop = false;
    this.currentDrop = piece;
    this.settleFrames = 0;
  }

  private spawn(
    stage: number,
    x: number,
    y: number,
    vx: number,
    vy: number,
    spin: number,
  ): Piece {
    const st = STAGES[stage];
    const physics = this.matter.add.image(x, y, stageKey(stage), undefined, {
      shape: { type: "circle", radius: st.radius },
      restitution: 0.08,
      friction: 0.38,
      frictionAir: 0.018,
      frictionStatic: 0.55,
      density: 0.002,
      slop: 0.05,
      label: "piece",
    });
    // Physics uses a fixed circle; visual squash never resizes the body.
    physics.setVisible(false);
    physics.setSleepThreshold(16);
    physics.setVelocity(vx, vy);
    physics.setAngularVelocity(spin);
    const img = this.add.image(x, y, stageKey(stage)).setDepth(10);
    this.fitSprite(img, stage);
    const id = this.nextId++;
    physics.setData("pid", id);
    const piece: Piece = { id, stage, img, physics, merging: false, born: this.time.now };
    this.pieces.set(id, piece);
    this.noteStage(stage);
    return piece;
  }

  private tryQueueMerge(a: MatterBody, b: MatterBody): void {
    const pa = this.pieceFromBody(a);
    const pb = this.pieceFromBody(b);
    if (!pa || !pb) return;
    if (pa.id === pb.id) return;
    if (pa.merging || pb.merging) return;
    if (pa.stage !== pb.stage) return;
    pa.merging = true;
    pb.merging = true;
    this.mergeQueue.push([pa, pb]);
  }

  private flushMerges(): void {
    if (this.mergeQueue.length === 0) return;
    const queued = this.mergeQueue;
    this.mergeQueue = [];
    for (const [a, b] of queued) {
      this.resolveMerge(a, b);
    }
  }

  private resolveMerge(a: Piece, b: Piece): void {
    if (!this.pieces.has(a.id) || !this.pieces.has(b.id)) return;

    const x = (a.physics.x + b.physics.x) * 0.5;
    const y = (a.physics.y + b.physics.y) * 0.5;
    const va = this.vel(a.physics);
    const vb = this.vel(b.physics);
    const vx = (va.x + vb.x) * 0.5;
    const vy = (va.y + vb.y) * 0.5;
    const stage = a.stage;
    const wasDrop = this.currentDrop === a || this.currentDrop === b;

    this.popRing(x, y, STAGES[stage].fill);
    this.destroyPiece(a);
    this.destroyPiece(b);

    if (stage >= MAX_STAGE) {
      this.addScore(ADULT_BURST_SCORE, x, y);
      this.burstFx(x, y);
      this.beep(720);
      if (wasDrop) {
        this.currentDrop = null;
        this.canDrop = true;
        this.settleFrames = 0;
      }
      this.wakePile();
      return;
    }

    const next = stage + 1;
    this.addScore(STAGES[next].score, x, y);
    const spawned = this.spawn(next, x, y, vx * 0.4, vy * 0.4, 0);
    const sx = spawned.img.scaleX;
    const sy = spawned.img.scaleY;
    spawned.img.setScale(sx * 0.55, sy * 0.55);
    this.tweens.add({
      targets: spawned.img,
      scaleX: sx,
      scaleY: sy,
      duration: 220,
      ease: "Back.out",
    });
    this.beep(300 + next * 80);
    if (wasDrop) {
      this.currentDrop = spawned;
      this.canDrop = false;
      this.settleFrames = 0;
    }
    this.wakePile();
  }

  private destroyPiece(p: Piece): void {
    this.pieces.delete(p.id);
    if (this.currentDrop === p) this.currentDrop = null;
    p.merging = true;
    this.tweens.killTweensOf(p.img);
    if (p.img.active) p.img.destroy();
    if (p.physics.active) p.physics.destroy();
  }

  private wakePile(): void {
    for (const p of this.pieces.values()) {
      if (p.merging) continue;
      p.physics.setAwake();
    }
  }

  private tickSettle(): void {
    if (this.canDrop || this.currentDrop === null) {
      if (this.currentDrop === null && !this.canDrop) {
        this.canDrop = true;
      }
      return;
    }
    const p = this.currentDrop;
    if (!this.pieces.has(p.id) || p.merging) {
      this.settleFrames = 0;
      return;
    }
    if (this.isResting(p)) {
      this.settleFrames += 1;
      if (this.settleFrames >= SETTLE_FRAMES) {
        this.canDrop = true;
        this.currentDrop = null;
        this.settleFrames = 0;
      }
    } else {
      this.settleFrames = 0;
    }
  }

  private tickOverflow(dt: number): void {
    let overflowing = false;
    for (const p of this.pieces.values()) {
      if (p.merging) continue;
      if (this.time.now - p.born < 240) continue;
      if (!this.isResting(p)) continue;
      const top = p.physics.y - STAGES[p.stage].radius;
      if (top < KILL_Y) {
        overflowing = true;
        break;
      }
    }
    this.danger.setText(overflowing ? "Too full! Make room…" : "");
    if (overflowing) {
      this.overflowMs += dt;
      if (this.overflowMs >= OVERFLOW_MS) this.gameOver();
    } else {
      this.overflowMs = 0;
    }
  }

  private isResting(p: Piece): boolean {
    const body = p.physics.body as unknown as MatterBody | undefined;
    if (!body) return false;
    if (body.isSleeping) return true;
    const sp = Math.hypot(body.velocity.x, body.velocity.y);
    return sp < SETTLE_SPEED && Math.abs(body.angularVelocity) < 0.05;
  }

  private vel(img: Phaser.Physics.Matter.Image): { x: number; y: number } {
    const body = img.body as unknown as MatterBody | undefined;
    if (!body) return { x: 0, y: 0 };
    return { x: body.velocity.x, y: body.velocity.y };
  }

  private pieceFromBody(body: MatterBody): Piece | undefined {
    const go = body.gameObject ?? body.parent?.gameObject;
    if (!go) return undefined;
    const id = go.getData("pid") as number | undefined;
    if (id === undefined || id === null) return undefined;
    return this.pieces.get(id);
  }

  private noteStage(stage: number): void {
    if (stage > this.bestReached) this.bestReached = stage;
    if (stage >= MAX_STAGE && !this.madeAdult) {
      this.madeAdult = true;
      this.syncNextDropVisuals();
    }
  }

  private livingBest(): number {
    let best = -1;
    for (const p of this.pieces.values()) {
      if (p.merging) continue;
      if (p.stage > best) best = p.stage;
    }
    return best;
  }

  private addScore(base: number, x: number, y: number): void {
    const now = this.time.now;
    if (now - this.lastMergeAt <= CHAIN_WINDOW_MS) {
      this.chain += 1;
    } else {
      this.chain = 1;
    }
    this.lastMergeAt = now;
    const n = base * this.chain;
    this.score += n;
    if (this.score > this.preferences.best) {
      this.preferences.best = this.score;
      savePreferences(this.preferences);
    }
    const label = this.chain > 1 ? `+${n} ×${this.chain}` : `+${n}`;
    const t = this.add
      .text(x, y - 10, label, {
        fontFamily: FONT_DISPLAY,
        fontSize: n >= 90 || this.chain > 1 ? "28px" : "20px",
        color: n >= 90 || this.chain > 1 ? "#c9892a" : INK,
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.tweens.add({
      targets: t,
      y: y - 46,
      alpha: 0,
      duration: 700,
      ease: "Quad.out",
      onComplete: () => t.destroy(),
    });
  }
  private popRing(x: number, y: number, color: number): void {
    const ring = this.add.circle(x, y, 8, color, 0).setStrokeStyle(5, color, 0.9).setDepth(16);
    this.tweens.add({
      targets: ring,
      scale: 3.2,
      alpha: 0,
      duration: 240,
      ease: "Quad.out",
      onComplete: () => ring.destroy(),
    });
  }

  private burstFx(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
      const d = 40 + Math.random() * 50;
      const c = this.add.circle(x, y, 5 + Math.random() * 5, 0xf0d48a, 0.9).setDepth(16);
      this.tweens.add({
        targets: c,
        x: x + Math.cos(ang) * d,
        y: y + Math.sin(ang) * d,
        alpha: 0,
        scale: 0.2,
        duration: 380,
        ease: "Quad.out",
        onComplete: () => c.destroy(),
      });
    }
  }

  private refreshHud(): void {
    this.hudScore.setText(String(this.score));
    const best = this.livingBest();
    this.hudAxie.setText(best < 0 ? "Egg" : titleCase(STAGES[best].name));
    this.growthIcons.forEach((icon, i) => icon.setAlpha(i <= this.bestReached ? 1 : 0.35));
    const state = {
      score: this.score, best: this.preferences.best, stage: titleCase(STAGES[this.bestReached].name),
      next: this.nextDropStage(), started: this.started, paused: this.paused, over: this.over,
      muted: this.preferences.muted, canDrop: this.canDrop,
      chain: this.time.now - this.lastMergeAt <= CHAIN_WINDOW_MS ? this.chain : 0,
      pieces: this.pieces.size,
    };
    const key = JSON.stringify(state);
    if (key !== this.lastUiState) {
      this.lastUiState = key;
      window.dispatchEvent(new CustomEvent('well:state', { detail: state }));
    }
  }

  private gameOver(): void {
    if (this.over) return;
    this.over = true;
    this.canDrop = false;
    this.matter.world.pause();
    const reached = titleCase(STAGES[this.bestReached].name);
    this.ovTitle.setText(`Garden full!\nYour Axie reached ${reached}`);
    this.ovScore.setText(`Score ${this.score}  ·  Best ${this.preferences.best}`);
    this.overlay.setVisible(true);
    this.refreshHud();
  }

  private restart(): void {
    if (this.restarting) return;
    this.restarting = true;
    this.scene.restart({ playing: true });
  }

  private begin(): void {
    this.started = true;
    this.paused = false;
    this.ignoreUntil = this.time.now + INPUT_GRACE_MS;
    this.matter.world.resume();
    this.unlockAudio();
    document.getElementById('game')?.focus({ preventScroll: true });
    this.refreshHud();
  }

  private togglePause(): void {
    if (!this.started || this.over) return;
    this.paused = !this.paused;
    this.pointerArmed = false;
    if (this.paused) { this.matter.world.pause(); this.tweens.pauseAll(); }
    else { this.matter.world.resume(); this.tweens.resumeAll(); this.ignoreUntil = this.time.now + INPUT_GRACE_MS; document.getElementById('game')?.focus({ preventScroll: true }); }
    this.refreshHud();
  }

  private toggleMute(): void {
    this.preferences.muted = !this.preferences.muted;
    savePreferences(this.preferences);
    this.refreshHud();
  }

  private connectShell(): void {
    const onAction = (event: Event) => {
      const action = (event as CustomEvent<string>).detail;
      if (action === 'start') this.begin();
      if (action === 'restart') this.restart();
      if (action === 'pause') this.togglePause();
      if (action === 'mute') this.toggleMute();
      if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) {
        if (action === 'qa-merge') {
          this.spawn(0, 330, 900, 0, 0, 0);
          this.spawn(0, 372, 900, 0, 0, 0);
        }
        if (action === 'qa-adult') {
          this.spawn(3, 300, 930, 0, 0, 0);
          this.spawn(3, 406, 930, 0, 0, 0);
        }
        if (action === 'qa-burst') {
          this.spawn(4, 285, 930, 0, 0, 0);
          this.spawn(4, 430, 930, 0, 0, 0);
        }
        if (action === 'qa-overflow') {
          const piece = this.spawn(2, WELL_CX, KILL_Y, 0, 0, 0);
          piece.physics.setStatic(true);
        }
      }
    };
    const onBlur = () => { if (this.started && !this.paused && !this.over) this.togglePause(); };
    window.addEventListener('well:action', onAction);
    window.addEventListener('blur', onBlur);
    this.events.once('shutdown', () => {
      window.removeEventListener('well:action', onAction);
      window.removeEventListener('blur', onBlur);
      this.input.keyboard?.removeAllListeners();
      // Phaser shuts down the world and destroys scene objects before this listener.
      this.pieces.clear();
      if (this.audio) void this.audio.close().catch(() => {});
      this.audio = undefined;
    });
  }

  private unlockAudio(): void {
    try {
      if (!this.audio) this.audio = new AudioContext();
      if (this.audio.state === "suspended") void this.audio.resume();
    } catch {
      /* ignore */
    }
  }

  private beep(freq: number): void {
    if (this.preferences.muted) return;
    try {
      this.unlockAudio();
      const ctx = this.audio;
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      /* ignore */
    }
  }
}
