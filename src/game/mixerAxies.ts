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

const PART_TYPES = ['back', 'ears', 'eyes', 'horn', 'mouth', 'tail'] as const;
type PartType = typeof PART_TYPES[number];
interface Appearance {
  stage: number;
  axieClass: 'plant' | 'aquatic' | 'beast' | 'bird' | 'bug' | 'reptile' | 'mech' | 'dusk' | 'dawn';
  partClass?: 'plant' | 'aquatic' | 'beast' | 'bird' | 'bug' | 'reptile';
  body: string;
  color: string;
  parts: Record<PartType, number>;
  evolved: boolean;
}

// One stable identity per merge tier. Distinct classes, colors and silhouettes
// make matching readable even when the well is crowded.
const GROWTH: Appearance[] = [
  { stage: 1, axieClass: 'plant', body: 'body-normal', color: 'plant-04', evolved: false,
    parts: { eyes: 2, ears: 6, back: 12, horn: 4, mouth: 10, tail: 8 } },
  { stage: 2, axieClass: 'aquatic', body: 'body-curly', color: 'aquatic-04', evolved: false,
    parts: { eyes: 4, ears: 2, back: 2, horn: 6, mouth: 2, tail: 4 } },
  { stage: 3, axieClass: 'beast', body: 'body-fuzzy', color: 'beast-03', evolved: true,
    parts: { eyes: 8, ears: 4, back: 4, horn: 2, mouth: 8, tail: 10 } },
  { stage: 4, axieClass: 'bird', body: 'body-sumo', color: 'bird-04', evolved: true,
    parts: { eyes: 2, ears: 8, back: 8, horn: 8, mouth: 4, tail: 12 } },
  { stage: 5, axieClass: 'bug', body: 'body-fuzzy', color: 'bug-03', evolved: true,
    parts: { eyes: 4, ears: 10, back: 6, horn: 12, mouth: 10, tail: 2 } },
  { stage: 6, axieClass: 'reptile', body: 'body-normal', color: 'reptile-03', evolved: true,
    parts: { eyes: 8, ears: 12, back: 4, horn: 6, mouth: 8, tail: 12 } },
  { stage: 7, axieClass: 'mech', partClass: 'bug', body: 'body-sumo', color: 'mech-00', evolved: true,
    parts: { eyes: 10, ears: 4, back: 12, horn: 4, mouth: 4, tail: 8 } },
  { stage: 8, axieClass: 'dusk', partClass: 'reptile', body: 'body-curly', color: 'dusk-03', evolved: true,
    parts: { eyes: 4, ears: 6, back: 8, horn: 10, mouth: 10, tail: 4 } },
  { stage: 9, axieClass: 'dawn', partClass: 'bird', body: 'body-sumo', color: 'dawn-03', evolved: true,
    parts: { eyes: 10, ears: 2, back: 12, horn: 12, mouth: 2, tail: 8 } },
];

let ready = false;

export function initMixer(): void {
  if (ready) return;
  initAxieMixer(genesData, samplesData, variantsData, animationsData);
  ready = true;
}

function stageCombo(appearance: Appearance): Map<string, string> {
  const { body, axieClass, parts, evolved } = appearance;
  // Secret classes have official body/color variants and use the six base classes' parts.
  const partClass = appearance.partClass ?? axieClass;
  const combo = new Map<string, string>([
    ["body", body],
    ["body-class", axieClass],
  ]);
  for (const part of PART_TYPES) {
    const key = `${partClass}-${String(parts[part]).padStart(2, '0')}`;
    const valid = genesData.items.parts.some(p => p.class === partClass && p.partType === part && p.skins.includes(key));
    if (!valid) throw new Error(`Unknown official ${part}: ${key}`);
    combo.set(part, key);
  }
  if (evolved) {
    for (const part of ["back", "ears", "eyes", "horn", "mouth", "tail"]) {
      combo.set(`${part}.stage`, "1");
    }
  }
  return combo;
}

export function mixerStageJobs(): MixerStageJob[] {
  initMixer();
  return GROWTH.map(appearance => {
    const { stage, color } = appearance;
    const combo = stageCombo(appearance);
    const variant = genesData.items.colors.find(c => c.key === color);
    if (!variant) throw new Error(`Unknown official color: ${color}`);
    const built = getAxieSpineFromCombo(combo, variant.index, true);
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
