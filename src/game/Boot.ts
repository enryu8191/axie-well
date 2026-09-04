import Phaser from "phaser";
import { MIXER_CDN, mixerStageJobs, type MixerStageJob } from "./mixerPlant";
import { stageKey } from "./stages";

export class Boot extends Phaser.Scene {
  private jobs: MixerStageJob[] = [];

  constructor() {
    super("Boot");
  }

  preload(): void {
    this.cameras.main.setBackgroundColor("#b8e4f5");
    this.jobs = mixerStageJobs();
    this.load.setCORS("anonymous");
    this.load.image(stageKey(0), "axie/egg.png");
    const seen = new Set<string>();
    for (const job of this.jobs) {
      for (const layer of job.layers) {
        if (seen.has(layer.imagePath)) continue;
        seen.add(layer.imagePath);
        this.load.image(layer.imagePath, MIXER_CDN + layer.imagePath);
      }
    }
  }

  create(): void {
    for (const job of this.jobs) {
      this.textures.addCanvas(stageKey(job.stage), this.stamp(job));
    }
    this.scene.start("Game");
  }

  private stamp(job: MixerStageJob): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;
    for (const layer of job.layers) {
      if (!this.textures.exists(layer.imagePath)) continue;
      const src = this.textures.get(layer.imagePath).getSourceImage() as CanvasImageSource;
      ctx.drawImage(src, layer.px, layer.py);
    }
    return trimCanvas(canvas);
  }
}

function trimCanvas(src: HTMLCanvasElement, pad = 12): HTMLCanvasElement {
  const ctx = src.getContext("2d");
  if (!ctx) return src;
  const { width, height } = src;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 8) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) return src;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const side = Math.max(w, h);
  const out = document.createElement("canvas");
  out.width = side;
  out.height = side;
  const octx = out.getContext("2d");
  if (!octx) return src;
  octx.drawImage(src, minX, minY, w, h, Math.floor((side - w) / 2), Math.floor((side - h) / 2), w, h);
  return out;
}
