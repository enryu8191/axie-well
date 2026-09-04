/** Life stages in the well. Drop-merge raise: egg → hatchling → kid → teen → adult. Feed is the drop. */

export interface StageDef {
  id: number;
  name: string;
  label: string;
  sprite: string;
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
    sprite: "axie/egg.png",
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
    sprite: "axie/blossom.png",
    radius: 34,
    fill: 0xf3efe0,
    stroke: 0xe8a0b4,
    ink: "#5a4a38",
    score: 10,
  },
  {
    id: 2,
    name: "kid",
    label: "K",
    sprite: "axie/puffy.png",
    radius: 46,
    fill: 0x6ed0d4,
    stroke: 0x3aa0b8,
    ink: "#1a4a5c",
    score: 30,
  },
  {
    id: 3,
    name: "teen",
    label: "T",
    sprite: "axie/pomodoro.png",
    radius: 60,
    fill: 0xf0b45a,
    stroke: 0xd48a28,
    ink: "#5a3a10",
    score: 90,
  },
  {
    id: 4,
    name: "adult",
    label: "A",
    sprite: "axie/buba.png",
    radius: 78,
    fill: 0x8ed67a,
    stroke: 0x5eaa52,
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
