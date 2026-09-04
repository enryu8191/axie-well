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
    radius: 22,
    fill: 0xf7ecd8,
    stroke: 0xd9c4a0,
    ink: "#5a4a38",
    score: 0,
  },
  {
    id: 1,
    name: "hatchling",
    label: "H",
    radius: 32,
    fill: 0xb8e8c8,
    stroke: 0x7eb892,
    ink: "#2d4a38",
    score: 10,
  },
  {
    id: 2,
    name: "kid",
    label: "K",
    radius: 44,
    fill: 0xa8d8f0,
    stroke: 0x6ea8c8,
    ink: "#2a4a5c",
    score: 30,
  },
  {
    id: 3,
    name: "teen",
    label: "T",
    radius: 58,
    fill: 0xf0d48a,
    stroke: 0xd4b45a,
    ink: "#5a4a18",
    score: 90,
  },
  {
    id: 4,
    name: "adult",
    label: "A",
    radius: 76,
    fill: 0xf0b8c8,
    stroke: 0xd48aa0,
    ink: "#5c2a3a",
    score: 270,
  },
];

export const ADULT_BURST_SCORE = 800;
export const MAX_STAGE = STAGES.length - 1;

export function hexCss(n: number): string {
  return `#${n.toString(16).padStart(6, "0")}`;
}

export function titleCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
