import Phaser from "phaser";
import { MIXER_CDN, mixerStageJobs, type MixerStageJob } from "./mixerAxies";
import { STAGES, stageKey } from "./stages";
import { bodyFits, isTorsoLayer } from './collisions';

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
    const egg = this.textures.get(stageKey(0)).getSourceImage() as HTMLImageElement;
    const eggCanvas = document.createElement('canvas');
    eggCanvas.width = egg.width;
    eggCanvas.height = egg.height;
    eggCanvas.getContext('2d')!.drawImage(egg, 0, 0);
    this.textures.remove(stageKey(0));
    this.textures.addCanvas(stageKey(0), trimCanvas(eggCanvas, 0));
    for (const job of this.jobs) {
      this.textures.addCanvas(stageKey(job.stage), this.stamp(job));
    }
    const images = STAGES.map(({ id: i }) => {
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
    const torso = document.createElement('canvas');
    torso.width = canvas.width;
    torso.height = canvas.height;
    for (const layer of job.layers) {
      if (!this.textures.exists(layer.imagePath)) continue;
      const src = this.textures.get(layer.imagePath).getSourceImage() as CanvasImageSource;
      ctx.drawImage(src, layer.px, layer.py);
      if (isTorsoLayer(layer.imagePath)) torso.getContext('2d')!.drawImage(src, layer.px, layer.py);
    }
    return trimCanvas(canvas, job.stage, torso);
  }
}

function alphaBounds(src: HTMLCanvasElement) {
  const ctx = src.getContext("2d");
  if (!ctx) throw new Error('Canvas unavailable');
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
  return maxX < minX ? null : { minX, minY, maxX, maxY };
}

function trimCanvas(src: HTMLCanvasElement, stage: number, torso = src, pad = 12): HTMLCanvasElement {
  const bounds = alphaBounds(src);
  if (!bounds) return src;
  const core = alphaBounds(torso) ?? bounds;
  let { minX, minY, maxX, maxY } = bounds;
  const { width, height } = src;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const side = Math.max(w, h);
  const bodyWidth = core.maxX - core.minX + 1;
  const bodyHeight = core.maxY - core.minY + 1;
  const diameter = Math.max(bodyWidth, bodyHeight);
  bodyFits.set(stage, {
    originX: ((core.minX + core.maxX) / 2 - minX + Math.floor((side - w) / 2)) / side,
    originY: ((core.minY + core.maxY) / 2 - minY + Math.floor((side - h) / 2)) / side,
    diameter: diameter / side,
    widthRatio: bodyWidth / diameter,
    heightRatio: bodyHeight / diameter,
  });
  const out = document.createElement("canvas");
  out.width = side;
  out.height = side;
  const octx = out.getContext("2d");
  if (!octx) return src;
  octx.drawImage(src, minX, minY, w, h, Math.floor((side - w) / 2), Math.floor((side - h) / 2), w, h);
  return out;
}
