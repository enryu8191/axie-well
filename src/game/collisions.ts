export interface BodyFit {
  originX: number;
  originY: number;
  diameter: number;
  widthRatio: number;
  heightRatio: number;
}

// Boot measures the official torso layer, excluding horns, wings and tails.
export const bodyFits = new Map<number, BodyFit>();
export function isTorsoLayer(path: string): boolean {
  return /^body-[^/]+\/body(?:-(?:curly|fuzzy|sumo))?\//.test(path);
}
export const MERGE_GROW_MS = 180;
export const SETTLE_MS = 260;
export const PHYSICS_STEP_MS = 1000 / 120;
export const PIECE_MATERIAL = {
  restitution: 0.04, friction: 0.28, frictionAir: 0.018,
  frictionStatic: 0.5, density: 0.002, slop: 0.03, label: 'piece',
};

export function ellipseVertices(rx: number, ry: number) {
  return Array.from({ length: 32 }, (_, i) => {
    const angle = i * Math.PI * 2 / 32;
    return { x: Math.cos(angle) * rx, y: Math.sin(angle) * ry };
  });
}

export function mergeScale(age: number): number {
  const t = Math.min(1, Math.max(0, age / MERGE_GROW_MS));
  return 0.8 + 0.2 * (t * t * (3 - 2 * t));
}

// Small bevels stop pieces lodging in the painted jar's lower corners.
export function cornerVertices(left: number, floor: number, radius: number, direction: 1 | -1) {
  return [{ x: left, y: floor }, { x: left, y: floor - radius },
    { x: left + direction * radius, y: floor }];
}
