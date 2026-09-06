const KEY = 'axie-well-v1' + (import.meta.env.DEV && new URLSearchParams(location.search).has('qa') ? '-qa' : '');
export interface Preferences { best: number; muted: boolean; musicMuted: boolean }
export function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { best: Number.isSafeInteger(value.best) && value.best > 0 ? value.best : 0, muted: value.muted === true, musicMuted: value.musicMuted === true || (value.musicMuted === undefined && value.muted === true) };
  } catch { return { best: 0, muted: false, musicMuted: false }; }
}
export function savePreferences(value: Preferences): void {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* Play remains available without storage. */ }
}
