import Phaser from "phaser";
import { MIXER_CDN, mixerStageJobs, type MixerStageJob } from "./mixerAxies";
import { stageKey } from "./stages";

export class Boot extends Phaser.Scene {
  private jobs: MixerStageJob[] = [];
  private failed = false;

  constructor() {
    super("Boot");
  }

  preload(): void {
    this.cameras.main.setBackgroundColor("#b8e4f5");
    try { this.jobs = mixerStageJobs(); }
    catch { this.fail(); return; }
    this.load.on('loaderror', () => this.fail());
    this.load.on('progress', (progress: number) => window.dispatchEvent(new CustomEvent('well:loading', { detail: Math.round(progress * 100) })));
    this.load.setCORS("anonymous");
    this.load.image('garden-background', 'ui/garden-background.png');
    this.load.image('garden-panel', 'ui/garden-panel.png');
    this.load.image('garden-button', 'ui/garden-button.png');
    this.load.image({ key: stageKey(0), url: "axie/egg.png", xhrSettings: { responseType: 'blob', timeout: 15000 } });
    const seen = new Set<string>();
    for (const job of this.jobs) {
      for (const layer of job.layers) {
        if (seen.has(layer.imagePath)) continue;
        seen.add(layer.imagePath);
        this.load.image({ key: layer.imagePath, url: MIXER_CDN + layer.imagePath, xhrSettings: { responseType: 'blob', timeout: 15000 } });
      }
    }
  }

  create(): void {
    if (this.failed) return;
    for (const job of this.jobs) {
      this.textures.addCanvas(stageKey(job.stage), this.stamp(job));
    }
    const images = [0, 1, 2, 3, 4].map(i => {
      if (i === 0) return 'axie/egg.png';
      const source = this.textures.get(stageKey(i)).getSourceImage() as HTMLCanvasElement | HTMLImageElement;
      return source instanceof HTMLCanvasElement ? source.toDataURL() : source.src;
    });
    window.dispatchEvent(new CustomEvent('well:ready', { detail: images }));
    this.scene.start("Game");
  }

  private fail(): void {
    this.failed = true;
    window.dispatchEvent(new CustomEvent('well:error'));
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
