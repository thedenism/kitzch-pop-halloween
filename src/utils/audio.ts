// Web Audio Synthesizer with Procedural Music Box & Formant Speech

const FORMANT_VOWELS = [
  [800, 1150], // /a/
  [300, 2300], // /i/
  [330, 700],  // /u/
  [500, 900],  // /o/
  [550, 1800], // /e/
];

class KitzchSoundManager {
  private ac: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicEnabled: boolean = true;
  private musicTimer: number | null = null;
  private isMusicLooping: boolean = false;
  private musicGainNode: GainNode | null = null;

  private initContext() {
    if (!this.ac) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ac = new AudioCtx();
    }
    if (this.ac.state === 'suspended') {
      this.ac.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.musicGainNode && this.ac) {
      this.musicGainNode.gain.setValueAtTime(muted || !this.isMusicEnabled ? 0 : 0.08, this.ac.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMusicEnabled(enabled: boolean) {
    this.isMusicEnabled = enabled;
    if (this.musicGainNode && this.ac) {
      this.musicGainNode.gain.setValueAtTime(this.isMuted || !enabled ? 0 : 0.08, this.ac.currentTime);
    }
    if (enabled && !this.isMusicLooping) {
      this.startMusic();
    }
  }

  public getMusicEnabled(): boolean {
    return this.isMusicEnabled;
  }

  // Pure oscillator sfx
  public sfx(f: number, d: number = 0.09, ty: OscillatorType = 'triangle', v: number = 0.08) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ac) return;
      const o = this.ac.createOscillator();
      const g = this.ac.createGain();
      const n = this.ac.currentTime;

      o.type = ty;
      o.frequency.setValueAtTime(f, n);
      g.gain.setValueAtTime(v, n);
      g.gain.exponentialRampToValueAtTime(0.0001, n + d);

      o.connect(g);
      g.connect(this.ac.destination);

      o.start();
      o.stop(n + d);
    } catch {
      // Audio fallback ignore
    }
  }

  // Pinata Candy Rain Fanfare
  public playPinataExplosion() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.sfx(freq, 0.16, 'triangle', 0.12);
      }, idx * 60);
    });
  }

  // Formant filtered vocal synthesis
  public voice(
    f: number,
    vw: number[] = FORMANT_VOWELS[Math.floor(Math.random() * FORMANT_VOWELS.length)],
    d: number = 0.2,
    v: number = 0.4
  ) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ac) return;
      const n = this.ac.currentTime;
      const o = this.ac.createOscillator();
      const g = this.ac.createGain();

      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f * 0.8, n);
      o.frequency.exponentialRampToValueAtTime(f * 1.2, n + d * 0.45);
      o.frequency.exponentialRampToValueAtTime(f * 0.9, n + d);

      g.gain.setValueAtTime(0.0001, n);
      g.gain.exponentialRampToValueAtTime(v, n + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, n + d);

      vw.forEach((q) => {
        if (!this.ac) return;
        const b = this.ac.createBiquadFilter();
        b.type = 'bandpass';
        b.frequency.value = q;
        b.Q.value = 6;
        o.connect(b);
        b.connect(g);
      });

      g.connect(this.ac.destination);
      o.start(n);
      o.stop(n + d + 0.05);
    } catch {
      // Audio fallback ignore
    }
  }

  // Web Speech Utterance
  public say(text: string) {
    if (this.isMuted) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.pitch = 1.7;
        u.rate = 1.2;
        window.speechSynthesis.speak(u);
      }
    } catch {
      // Speech ignore
    }
  }

  public vibrate(ms: number = 70) {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {
      // Ignore
    }
  }

  // Procedural Spooky Halloween Music Box
  public startMusic() {
    if (this.isMusicLooping) return;
    this.isMusicLooping = true;
    this.initContext();

    if (!this.ac) return;
    this.musicGainNode = this.ac.createGain();
    this.musicGainNode.gain.setValueAtTime(this.isMuted || !this.isMusicEnabled ? 0 : 0.08, this.ac.currentTime);
    this.musicGainNode.connect(this.ac.destination);

    // Minor Halloween celesta arpeggios: D minor harmonic scale
    const melody = [293.66, 349.23, 440, 466.16, 587.33, 466.16, 440, 349.23, 311.13, 369.99, 440, 523.25];
    let step = 0;

    const playNext = () => {
      if (!this.isMusicLooping) return;
      if (this.ac && this.musicGainNode && !this.isMuted && this.isMusicEnabled) {
        const now = this.ac.currentTime;
        const note = melody[step % melody.length];

        const osc = this.ac.createOscillator();
        const gain = this.ac.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

        osc.connect(gain);
        gain.connect(this.musicGainNode);

        osc.start(now);
        osc.stop(now + 0.5);
      }

      step++;
      this.musicTimer = window.setTimeout(playNext, 240);
    };

    playNext();
  }

  public stopMusic() {
    this.isMusicLooping = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundManager = new KitzchSoundManager();
