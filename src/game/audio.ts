type Cue = 'drop' | 'merge' | 'burst' | 'end';
const BEAT = 60 / 84;
// An original eight-bar garden theme: Cmaj7, Am7, Fmaj7, G6.
const CHORDS = [[48, 60, 64, 67], [45, 60, 64, 69], [41, 60, 64, 69], [43, 59, 62, 67]];
const MELODY = [76, 79, 81, 79, 76, 74, 72, null, 76, 79, 84, 83, 79, 76, 74, null,
  76, 81, 79, 76, 72, 74, 76, null, 79, 76, 74, 72, 69, 72, 76, null,
  77, 81, 79, 77, 76, 72, 69, null, 72, 76, 79, 81, 79, 76, 72, null,
  74, 79, 83, 81, 79, 76, 74, null, 71, 74, 79, 76, 74, 71, 72, null];
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class GardenAudio {
  private context?: AudioContext;
  private music?: GainNode;
  private effects?: GainNode;
  private timer?: ReturnType<typeof setInterval>;
  private voices = new Set<OscillatorNode>();
  private playing = false;
  private step = 0;
  private nextAt = 0;
  private notes = 0;
  private musicMuted = false;
  private effectsMuted = false;

  configure(musicMuted: boolean, effectsMuted: boolean): void {
    this.musicMuted = musicMuted;
    this.effectsMuted = effectsMuted;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.music!.gain.setTargetAtTime(musicMuted ? 0 : 0.32, now, 0.035);
    this.effects!.gain.setTargetAtTime(effectsMuted ? 0 : 0.6, now, 0.015);
  }

  // Called by Play, Resume, and sound buttons so browser audio unlock is intentional.
  start(): void {
    this.playing = true;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.music = this.context.createGain();
        this.effects = this.context.createGain();
        this.music.gain.value = this.musicMuted ? 0 : 0.32;
        this.effects.gain.value = this.effectsMuted ? 0 : 0.6;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.ratio.value = 4;
        this.music.connect(limiter);
        this.effects.connect(limiter);
        limiter.connect(this.context.destination);
      }
      void this.context.resume().then(() => {
        if (!this.playing || this.timer !== undefined) return;
        this.nextAt = this.context!.currentTime + 0.04;
        this.schedule();
        this.timer = setInterval(() => this.schedule(), 25);
      }).catch(() => {});
    } catch { /* Sound is optional when Web Audio is unavailable. */ }
  }

  pause(reset = false): void {
    this.playing = false;
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
    for (const voice of this.voices) { try { voice.stop(); } catch { /* Already stopped. */ } }
    this.voices.clear();
    if (reset) this.step = 0;
  }

  private schedule(): void {
    const ctx = this.context;
    if (!ctx || !this.playing || ctx.state !== 'running') return;
    // Skip stale time after a suspended device; never schedule a burst of missed notes.
    if (this.nextAt < ctx.currentTime) this.nextAt = ctx.currentTime + 0.02;
    while (this.nextAt < ctx.currentTime + 0.16) {
      const i = this.step % MELODY.length;
      const chord = CHORDS[Math.floor(i / 16)];
      if (!this.musicMuted) {
        const note = MELODY[i];
        if (note !== null) {
          this.tone(hz(note), this.nextAt, 0.65, 0.11, 'sine', true);
          this.tone(hz(note) * 2, this.nextAt, 0.19, 0.018, 'sine', true);
        }
        if (i % 8 === 0) {
          this.tone(hz(chord[0]), this.nextAt, BEAT * 3.7, 0.08, 'sine', true, 0.12);
          for (const n of chord.slice(1)) this.tone(hz(n), this.nextAt, BEAT * 3.7, 0.025, 'triangle', true, 0.18);
        }
        // A quiet, occasional bird-like ornament, kept below the melody.
        if (i === 15 || i === 47) this.tone(1700, this.nextAt, 0.14, 0.014, 'sine', true, 0.025, 2400);
        this.notes++;
      }
      this.step++;
      this.nextAt += BEAT / 2;
    }
  }

  play(cue: Cue, tier = 0): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running' || this.effectsMuted) return;
    const at = ctx.currentTime + 0.005;
    if (cue === 'drop') {
      this.tone(420, at, 0.13, 0.17, 'sine', false, 0.008, 160);
      return;
    }
    const notes = cue === 'burst' ? [72, 76, 79, 84, 88] : cue === 'end' ? [76, 72, 67, 60] : [60 + tier * 2, 64 + tier * 2, 67 + tier * 2];
    notes.forEach((note, i) => this.tone(hz(note), at + i * 0.075,
      cue === 'burst' ? 0.8 : 0.42, 0.1, 'sine', false));
  }

  private tone(frequency: number, at: number, duration: number, volume: number,
    type: OscillatorType, music: boolean, attack = 0.012, endFrequency?: number): void {
    const ctx = this.context!;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, at);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(envelope);
    envelope.connect(music ? this.music! : this.effects!);
    this.voices.add(osc);
    osc.onended = () => { osc.disconnect(); envelope.disconnect(); this.voices.delete(osc); };
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  status() {
    return { state: this.context?.state ?? 'locked', playing: this.playing,
      musicMuted: this.musicMuted, effectsMuted: this.effectsMuted,
      scheduledNotes: this.notes, activeVoices: this.voices.size };
  }
}
