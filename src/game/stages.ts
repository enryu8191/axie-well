/** Puzzle tiers, not canonical Axie aging. Each tier has a stable mixer identity. */

export interface StageDef {
  id: number;
  name: string;
  title: string;
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
    title: "Plant egg",
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
    title: "Plant hatchling",
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
    title: "Aquatic kid",
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
    title: "Beast teen",
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
    title: "Bird adult",
    label: "A",
    radius: 78,
    fill: 0xff78b4,
    stroke: 0xf358a1,
    ink: "#2d4a38",
    score: 270,
  },
  { id: 5, name: 'elder', title: 'Bug elder', label: 'B', radius: 98,
    fill: 0xff433e, stroke: 0xdc1244, ink: '#60322b', score: 810 },
  { id: 6, name: 'guardian', title: 'Reptile guardian', label: 'R', radius: 120,
    fill: 0x9967fb, stroke: 0x7d4ce7, ink: '#47325e', score: 2430 },
  { id: 7, name: 'sentinel', title: 'Mech sentinel', label: 'M', radius: 146,
    fill: 0xf6fbff, stroke: 0x929292, ink: '#3b4557', score: 7290 },
  { id: 8, name: 'colossus', title: 'Dusk colossus', label: 'D', radius: 174,
    fill: 0x007181, stroke: 0x005372, ink: '#124c54', score: 21870 },
  { id: 9, name: 'titan', title: 'Dawn titan', label: '★', radius: 208,
    fill: 0xffff8d, stroke: 0xffd200, ink: '#71571c', score: 65610 },
];

export const TITAN_BURST_SCORE = 200000;
export const MAX_STAGE = STAGES.length - 1;

export function stageKey(id: number): string {
  return `stage-${id}`;
}

export function titleCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
