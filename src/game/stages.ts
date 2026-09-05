/** Life stages in the well. Drop-merge raise: egg → hatchling → kid → teen → adult. Feed is the drop. */

export interface StageDef {
  id: number;
  name: string;
  label: string;
  radius: number;
  fill: number;
  stroke: number;
  ink: string;
  score: number;
}

export const STAGES: readonly StageDef[] = [
  {
    id: 0,
    name: "egg",
    label: "E",
    radius: 24,
    fill: 0xe8e6a0,
    stroke: 0x7dae4a,
    ink: "#3a4a28",
    score: 0,
  },
  {
    id: 1,
    name: "hatchling",
    label: "H",
    radius: 34,
    fill: 0x99ff73,
    stroke: 0x6ada00,
    ink: "#3a4a28",
    score: 10,
  },
  {
    id: 2,
    name: "kid",
    label: "K",
    radius: 46,
    fill: 0x00b8ff,
    stroke: 0x008de7,
    ink: "#2d4a38",
    score: 30,
  },
  {
    id: 3,
    name: "teen",
    label: "T",
    radius: 60,
    fill: 0xfdb014,
    stroke: 0xeb7e00,
    ink: "#2d4a38",
    score: 90,
  },
  {
    id: 4,
    name: "adult",
    label: "A",
    radius: 78,
    fill: 0xff78b4,
    stroke: 0xf358a1,
    ink: "#2d4a38",
    score: 270,
  },
];

export const ADULT_BURST_SCORE = 800;
export const MAX_STAGE = STAGES.length - 1;

export function stageKey(id: number): string {
  return `stage-${id}`;
}

export function titleCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
