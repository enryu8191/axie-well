export interface KeeperDef {
  id: string;
  name: string;
  axieClass: 'Plant' | 'Aquatic' | 'Bird';
  stage: number;
  skill: string;
  ability: 'sprout' | 'swap' | 'gust';
  description: string;
  trait: string;
  partName: string;
  partId: string;
  traits: readonly string[];
  chargeCost: number;
  extraPreview: boolean;
}

// Free guest builds. These rules belong to The Well, not Origins or native AXP.
export function rulesFromTraits(axieClass: KeeperDef['axieClass'], traits: readonly string[]) {
  if (axieClass === 'Aquatic') {
    const extraPreview = traits.includes('eyes-sleepless');
    return { chargeCost: extraPreview ? 5 : traits.includes('tail-nimo') ? 3 : 4, extraPreview };
  }
  return { chargeCost: 4, extraPreview: false };
}

export const KEEPERS: readonly KeeperDef[] = [
  { id: 'plant', name: 'Sprout', axieClass: 'Plant', stage: 1, skill: 'Sprout', ability: 'sprout',
    description: 'Turn a selected egg into a tier-2 Plant. Set up a match without taking another drop.',
    trait: 'A targeted upgrade for the smallest piece. Recharges in 4 merges.',
    partName: 'Yam tail', partId: 'tail-yam', traits: ['tail-yam'], chargeCost: 4, extraPreview: false },
  { id: 'aquatic-flow', name: 'Ripple', axieClass: 'Aquatic', stage: 2, skill: 'Swap', ability: 'swap',
    description: 'Exchange the current drop and the next one. Save the piece you need for later.',
    trait: 'Quick recharge: swap again after 3 merges.',
    partName: 'Nimo tail', partId: 'tail-nimo', traits: ['tail-nimo', 'eyes-clear'], chargeCost: 3, extraPreview: false },
  { id: 'aquatic-scout', name: 'Lookout', axieClass: 'Aquatic', stage: 2, skill: 'Swap', ability: 'swap',
    description: 'See two upcoming drops and exchange the current drop with the next one.',
    trait: 'Extra foresight, slower recharge: 5 merges per swap.',
    partName: 'Sleepless eyes', partId: 'eyes-sleepless', traits: ['eyes-sleepless', 'tail-koi'], chargeCost: 5, extraPreview: true },
  { id: 'bird', name: 'Breeze', axieClass: 'Bird', stage: 4, skill: 'Gust', ability: 'gust',
    description: 'Aim left or right, then nudge the pile that way. Bring matches together carefully.',
    trait: 'Small pieces move further than giants. Recharges in 4 merges.',
    partName: 'Pigeon Post back', partId: 'back-pigeon-post', traits: ['back-pigeon-post'], chargeCost: 4, extraPreview: false },
] .map(build => ({ ...build, ...rulesFromTraits(build.axieClass as KeeperDef['axieClass'], build.traits) })) as KeeperDef[];

export function keeperById(id: string): KeeperDef {
  return KEEPERS.find(keeper => keeper.id === id) ?? KEEPERS[0];
}

export class KeeperCharge {
  value: number;
  constructor(readonly cost: number) { this.value = cost; }
  get ready(): boolean { return this.value >= this.cost; }
  earn(): void { this.value = Math.min(this.cost, this.value + 1); }
  spend(): boolean {
    if (!this.ready) return false;
    this.value = 0;
    return true;
  }
}
