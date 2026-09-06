import './style.css';
import { STAGES, TITAN_BURST_SCORE } from './game/stages';
document.querySelector('.evolution')!.innerHTML = STAGES.map(stage =>
  `<li data-growth="${stage.id}" class="${stage.id === 0 ? 'reached' : ''}"><img data-stage="${stage.id}" src="axie/egg.png" alt="" /><span><b>${stage.title}</b><small>${stage.score ? stage.score.toLocaleString() + ' pts' : 'A small beginning'}</small></span><i>${stage.id + 1}</i></li>`).join('');
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const act = (action: string) => window.dispatchEvent(new CustomEvent('well:action', { detail: action }));
let images: string[] = [];
let started = false;
let paused = false;
let resumeAfterHelp = false;
let failed = false;
el('start').onclick = () => { if (failed) location.reload(); else act('start'); };
el('resume').onclick = () => act('pause');
el('pause').onclick = () => act('pause');
el('mute').onclick = () => act('mute');
el('music').onclick = () => act('music');
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
  if (!failed) el('start').textContent = `Growing your garden… ${(event as CustomEvent<number>).detail}%`;
});
window.addEventListener('well:error', () => {
  failed = true;
  el('start').textContent = 'Assets couldn’t load. Try again';
  el<HTMLButtonElement>('start').disabled = false;
  el('status').textContent = 'Check your connection to load the Axie artwork.';
});
window.addEventListener('well:ready', event => {
  images = (event as CustomEvent<string[]>).detail;
  document.querySelectorAll<HTMLImageElement>('[data-stage]').forEach(img => { img.src = images[Number(img.dataset.stage)]; });
  el('start').textContent = 'Play the garden  →';
  el<HTMLButtonElement>('start').disabled = false;
});
interface State { score: number; best: number; stage: string; stageId: number; current: number; next: number; poolMax: number; started: boolean; paused: boolean; over: boolean; muted: boolean; musicMuted: boolean; canDrop: boolean; chain: number; pieces: number }
window.addEventListener('well:state', event => {
  const s = (event as CustomEvent<State>).detail;
  started = s.started;
  paused = s.paused;
  el('score').textContent = s.score.toLocaleString();
  el('best').textContent = s.best.toLocaleString();
  el('welcome').hidden = s.started;
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
  el('drop-pool').textContent = `Random pool: egg → ${STAGES[s.poolMax].name}`;
  el('status').textContent = s.over ? 'A full garden. A fresh beginning awaits.' : s.paused ? 'Take your time. The garden is paused.' : !s.started ? '10 tiers to discover. How big can you grow?' : s.chain > 1 ? `Growth spurt! ×${s.chain} merge points.` : s.canDrop ? `Ready to drop: ${STAGES[s.current].title}.` : 'Let your little Axie settle in.';
  if (import.meta.env.DEV && el('qa-state')) el('qa-state').textContent = JSON.stringify(s);
});
if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) {
  const panel = document.createElement('div');
  panel.id = 'qa-panel';
  for (const action of ['merge', 'adult', 'bird', 'giant', 'titan', 'burst', 'overflow', 'pile', 'hitboxes']) {
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
el('burst-points').textContent = TITAN_BURST_SCORE.toLocaleString();
