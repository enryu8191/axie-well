import './style.css';
import './keeper.css';
import { KEEPERS, keeperById } from './game/keepers';
import { STAGES, TITAN_BURST_SCORE } from './game/stages';

document.querySelector('.evolution')!.innerHTML = STAGES.map(stage =>
  `<li data-growth="${stage.id}" class="${stage.id === 0 ? 'reached' : ''}"><img data-stage="${stage.id}" src="axie/egg.png" alt="" /><span><b>${stage.title}</b><small>${stage.score ? stage.score.toLocaleString() + ' pts' : 'A small beginning'}</small></span><i>${stage.id + 1}</i></li>`).join('');

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const act = (action: string) => window.dispatchEvent(new CustomEvent('well:action', { detail: action }));
const safe = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

let images: string[] = [];
let keeperImages: Record<string, string> = {};
let selectedKeeperId = KEEPERS[0].id;
let started = false;
let paused = false;
let resumeAfterHelp = false;
let failed = false;
let assetsReady = false;

const keeperGrid = el('keeper-grid');
keeperGrid.innerHTML = KEEPERS.map(keeper => `
  <button class="keeper-card keeper-card--${keeper.axieClass.toLowerCase()}" type="button" role="radio" data-keeper-id="${safe(keeper.id)}" aria-checked="${keeper.id === selectedKeeperId}">
    <span class="keeper-card__top"><span class="keeper-card__portrait"><img data-keeper-avatar="${safe(keeper.id)}" data-stage-fallback="${keeper.stage}" src="axie/egg.png" alt="" /></span><span class="keeper-card__label"><small>${safe(keeper.axieClass)} Keeper</small><strong>${safe(keeper.name)}</strong><i>${safe(keeper.skill)} · ${keeper.chargeCost} merges</i></span><span class="keeper-check" aria-hidden="true">✓</span></span>
    <span class="keeper-card__description">${safe(keeper.description)}</span>
    <span class="keeper-traits"><span><b>Class trait</b>${safe(keeper.trait)}</span><span><b>Part</b>${safe(keeper.partName)}</span></span>
  </button>`).join('');

function updateKeeperSelection(id: string): void {
  selectedKeeperId = keeperById(id).id;
  document.querySelectorAll<HTMLButtonElement>('[data-keeper-id]').forEach(card => {
    const selected = card.dataset.keeperId === selectedKeeperId;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-checked', String(selected));
    card.tabIndex = selected ? 0 : -1;
  });
}

function refreshKeeperArtwork(): void {
  document.querySelectorAll<HTMLImageElement>('[data-keeper-avatar]').forEach(img => {
    const id = img.dataset.keeperAvatar!;
    const fallback = Number(img.dataset.stageFallback);
    img.src = keeperImages[id] || images[fallback] || 'axie/egg.png';
    const keeper = keeperById(id);
    img.alt = `${keeper.name}, ${keeper.axieClass} guest Keeper`;
  });
}

keeperGrid.addEventListener('click', event => {
  const card = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-keeper-id]');
  if (!card || started) return;
  const id = card.dataset.keeperId!;
  updateKeeperSelection(id);
  act(`keeper:${id}`);
});

keeperGrid.addEventListener('keydown', event => {
  if (started || !['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
  const index = KEEPERS.findIndex(keeper => keeper.id === selectedKeeperId);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? KEEPERS.length - 1
    : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + KEEPERS.length) % KEEPERS.length;
  const id = KEEPERS[next].id;
  updateKeeperSelection(id);
  act(`keeper:${id}`);
  keeperGrid.querySelector<HTMLButtonElement>(`[data-keeper-id="${id}"]`)!.focus();
});

el('start').onclick = () => { if (failed) location.reload(); else act('start'); };
el('resume').onclick = () => act('pause');
el('pause').onclick = () => act('pause');
el('mute').onclick = () => act('mute');
el('music').onclick = () => act('music');
el('keeper-skill').onclick = () => act(el('keeper-skill').dataset.targeting === 'true' ? 'cancel-skill' : 'skill');
el('choose-keeper').onclick = () => act('choose-keeper');

const dialog = el<HTMLDialogElement>('instructions');
el('help').onclick = () => {
  resumeAfterHelp = started && !paused;
  if (resumeAfterHelp) act('pause');
  dialog.showModal();
};
el('close-help').onclick = el('help-done').onclick = () => dialog.close();
dialog.addEventListener('close', () => { if (resumeAfterHelp) act('pause'); resumeAfterHelp = false; });
window.addEventListener('keydown', event => {
  if (dialog.open || ((event.target as HTMLElement)?.tagName === 'BUTTON' && [' ', 'Enter'].includes(event.key))) event.stopImmediatePropagation();
}, true);

window.addEventListener('well:loading', event => {
  if (!failed) el('start').textContent = `Preparing the garden… ${(event as CustomEvent<number>).detail}%`;
});
window.addEventListener('well:error', () => {
  failed = true;
  el('start').textContent = 'Assets couldn’t load. Try again';
  el<HTMLButtonElement>('start').disabled = false;
  el('status').textContent = 'Check your connection to load the Axie artwork.';
});
window.addEventListener('well:ready', event => {
  images = (event as CustomEvent<string[]>).detail;
  assetsReady = true;
  document.querySelectorAll<HTMLImageElement>('[data-stage]').forEach(img => { img.src = images[Number(img.dataset.stage)]; });
  refreshKeeperArtwork();
  el('start').textContent = 'Play with this Keeper  →';
  el<HTMLButtonElement>('start').disabled = false;
});
window.addEventListener('well:keepers', event => {
  keeperImages = { ...keeperImages, ...(event as CustomEvent<Record<string, string>>).detail };
  refreshKeeperArtwork();
  const selected = keeperById(selectedKeeperId);
  el<HTMLImageElement>('keeper-hud-image').src = keeperImages[selected.id] || images[selected.stage] || 'axie/egg.png';
});

interface State {
  score: number;
  best: number;
  stage: string;
  stageId: number;
  current: number;
  next: number;
  poolMax: number;
  started: boolean;
  paused: boolean;
  over: boolean;
  muted: boolean;
  musicMuted: boolean;
  canDrop: boolean;
  chain: number;
  pieces: number;
  keeperId: string;
  keeperCharge: number;
  keeperCost: number;
  keeperReady: boolean;
  keeperTargeting: boolean;
  keeperHint: string;
  afterNext: number | null;
}

window.addEventListener('well:state', event => {
  const s = (event as CustomEvent<State>).detail;
  started = s.started;
  paused = s.paused;
  updateKeeperSelection(s.keeperId);
  const keeper = keeperById(s.keeperId);

  el('score').textContent = s.score.toLocaleString();
  el('best').textContent = s.best.toLocaleString();
  el('welcome').hidden = s.started;
  el('keeper-hud').hidden = !s.started || s.paused;
  el('paused').hidden = !s.paused || s.over;
  el('pause').textContent = s.paused ? 'Resume' : 'Pause';
  el<HTMLButtonElement>('pause').disabled = !s.started || s.over;
  el('mute').textContent = s.muted ? 'SFX off' : 'SFX on';
  el('mute').setAttribute('aria-pressed', String(!s.muted));
  el('mute').setAttribute('aria-label', s.muted ? 'Sound effects off' : 'Sound effects on');
  el('music').textContent = s.musicMuted ? 'Music off' : 'Music on';
  el('music').setAttribute('aria-pressed', String(!s.musicMuted));
  el('next-name').textContent = STAGES[s.next].title;
  if (images[s.next]) el<HTMLImageElement>('next-image').src = images[s.next];
  el<HTMLImageElement>('next-image').alt = `Next drop: ${STAGES[s.next].title}`;
  document.querySelectorAll<HTMLElement>('[data-growth]').forEach(item => item.classList.toggle('reached', Number(item.dataset.growth) <= s.stageId));
  el('drop-pool').textContent = `Random pool: ${STAGES[0].name} → ${STAGES[s.poolMax].name}`;
  el('status').textContent = s.over ? 'A full garden. A fresh beginning awaits.' : s.paused ? 'Take your time. The garden is paused.' : !s.started ? 'Choose a guest Keeper, then climb all 10 merge tiers.' : s.chain > 1 ? `Merge rush! ×${s.chain} points.` : s.canDrop ? `Ready to drop: ${STAGES[s.current].title}.` : 'Let the pieces settle.';

  el('keeper-name').textContent = keeper.name;
  el('keeper-class').textContent = `${keeper.axieClass.toUpperCase()} KEEPER`;
  el('keeper-skill-name').textContent = keeper.name;
  const keeperImage = el<HTMLImageElement>('keeper-hud-image');
  keeperImage.src = keeperImages[keeper.id] || images[keeper.stage] || 'axie/egg.png';
  keeperImage.alt = `${keeper.name}, ${keeper.axieClass} guest Keeper`;

  const cost = Math.max(1, s.keeperCost ?? keeper.chargeCost);
  const charge = Math.max(0, Math.min(cost, s.keeperCharge ?? cost));
  const progress = charge / cost;
  el('keeper-charge-fill').style.width = `${progress * 100}%`;
  const chargeBar = document.querySelector<HTMLElement>('.keeper-charge')!;
  chargeBar.setAttribute('aria-valuemax', String(cost));
  chargeBar.setAttribute('aria-valuenow', String(charge));
  el('keeper-charge-label').textContent = s.keeperTargeting ? 'Choose an egg' : charge === cost ? (s.keeperReady ? 'Ready' : 'Charged') : `${charge} / ${cost} merges`;
  el('keeper-hint').textContent = s.keeperHint || keeper.trait;

  const skill = el<HTMLButtonElement>('keeper-skill');
  skill.dataset.targeting = String(s.keeperTargeting);
  skill.classList.toggle('targeting', s.keeperTargeting);
  skill.classList.toggle('ready', s.keeperReady);
  skill.querySelector('span')!.textContent = s.keeperTargeting ? 'Cancel target' : keeper.skill;
  skill.disabled = !s.started || s.paused || s.over || (!s.keeperTargeting && (!s.canDrop || !s.keeperReady));
  skill.title = s.keeperHint || keeper.description;
  el<HTMLButtonElement>('choose-keeper').disabled = !s.started;

  const swapPreview = el('keeper-swap-preview');
  const isAquatic = keeper.axieClass === 'Aquatic';
  swapPreview.hidden = !isAquatic;
  if (isAquatic) {
    if (images[s.current]) el<HTMLImageElement>('keeper-current-image').src = images[s.current];
    if (images[s.next]) el<HTMLImageElement>('keeper-next-image').src = images[s.next];
    el<HTMLImageElement>('keeper-current-image').alt = `Current drop: ${STAGES[s.current].title}`;
    el<HTMLImageElement>('keeper-next-image').alt = `Next drop: ${STAGES[s.next].title}`;
  }
  let scoutPreview = el('keeper-after-next');
  if (!scoutPreview) {
    scoutPreview = document.createElement('span');
    scoutPreview.id = 'keeper-after-next';
    scoutPreview.className = 'keeper-after-next';
    scoutPreview.innerHTML = '<small>LATER</small><img id="keeper-after-next-image" src="axie/egg.png" alt="Later drop" />';
    swapPreview.append(scoutPreview);
  }
  const showExtra = keeper.extraPreview && s.afterNext !== null;
  scoutPreview.hidden = !showExtra;
  if (showExtra && s.afterNext !== null && images[s.afterNext]) {
    el<HTMLImageElement>('keeper-after-next-image').src = images[s.afterNext];
    el<HTMLImageElement>('keeper-after-next-image').alt = `Later drop: ${STAGES[s.afterNext].title}`;
  }

  if (assetsReady && !failed) {
    el('start').textContent = `Play with ${keeper.name}  →`;
    el<HTMLButtonElement>('start').disabled = false;
  }
  if (import.meta.env.DEV && el('qa-state')) el('qa-state').textContent = JSON.stringify(s);
});

if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) {
  const panel = document.createElement('div');
  panel.id = 'qa-panel';
  for (const action of ['merge', 'egg', 'adult', 'bird', 'giant', 'titan', 'burst', 'overflow', 'pile', 'hitboxes']) {
    const button = document.createElement('button');
    button.textContent = `Seed ${action}`;
    button.onclick = () => act(`qa-${action}`);
    panel.append(button);
  }
  const restart = document.createElement('button');
  restart.textContent = 'QA restart';
  restart.onclick = () => act('restart');
  panel.append(restart);
  const state = document.createElement('output');
  state.id = 'qa-state';
  panel.append(state);
  document.body.append(panel);
}

updateKeeperSelection(selectedKeeperId);
el('burst-points').textContent = TITAN_BURST_SCORE.toLocaleString();
