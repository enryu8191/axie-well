import {
  exportAvatarLayers,
  getAxieColorPartShift,
  getAxieSpineFromCombo,
  getVariantAttachmentPath,
  initAxieMixer,
} from "@axieinfinity/mixer";
import animationsData from "@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-animations_lite.json";
import genesData from "@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-genes.json";
import samplesData from "@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-samples.json";
import variantsData from "@axieinfinity/mixer/dist/data/axie-2d-v3-stuff-variant.json";

export const MIXER_CDN = "https://axiecdn.axieinfinity.com/mixer-stuffs/v6/";
export const PLANT_COLOR_VARIANT = 6;

export const AVATAR = {
  width: 1024,
  height: 1024,
  offsetX: 0,
  offsetY: 0,
  scale: 0.45,
};

export interface MixerLayer {
  imagePath: string;
  px: number;
  py: number;
}

export interface MixerStageJob {
  stage: number;
  layers: MixerLayer[];
}

const PARTS = {
  back: "plant-12",
  ears: "plant-06",
  eyes: "plant-02",
  horn: "plant-04",
  mouth: "plant-10",
  tail: "plant-08",
} as const;

let ready = false;

export function initMixer(): void {
  if (ready) return;
  initAxieMixer(genesData, samplesData, variantsData, animationsData);
  ready = true;
}

function plantCombo(body: string, evolved: boolean): Map<string, string> {
  const combo = new Map<string, string>([
    ["body", body],
    ["body-class", "plant"],
    ["back", PARTS.back],
    ["ears", PARTS.ears],
    ["eyes", PARTS.eyes],
    ["horn", PARTS.horn],
    ["mouth", PARTS.mouth],
    ["tail", PARTS.tail],
  ]);
  if (evolved) {
    for (const part of ["back", "ears", "eyes", "horn", "mouth", "tail"]) {
      combo.set(`${part}.stage`, "1");
    }
  }
  return combo;
}

const GROWTH: { stage: number; body: string; evolved: boolean }[] = [
  { stage: 1, body: "body-normal", evolved: false },
  { stage: 2, body: "body-fuzzy", evolved: false },
  { stage: 3, body: "body-wetdog", evolved: true },
  { stage: 4, body: "body-sumo", evolved: true },
];

export function mixerStageJobs(): MixerStageJob[] {
  initMixer();
  return GROWTH.map(({ stage, body, evolved }) => {
    const combo = plantCombo(body, evolved);
    const built = getAxieSpineFromCombo(combo, PLANT_COLOR_VARIANT, true);
    if (built.error || !built.skeletonDataAsset) {
      throw new Error(`Mixer failed for stage ${stage}: ${built.error || "no skeleton"}`);
    }
    const layers = exportAvatarLayers(
      built.skeletonDataAsset,
      built.combo,
      built.variant,
      getAxieColorPartShift(built.variant),
      getVariantAttachmentPath,
      AVATAR,
    );
    return { stage, layers };
  });
}
