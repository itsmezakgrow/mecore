/**
 * Web Audio API synthesizer for clean, pleasant UI sound effects.
 * Requires zero external audio assets or network requests.
 */

class SoundEffectManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private volume: number = 0.5; // 0 to 1

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app_sound_enabled');
        this.soundEnabled = saved !== null ? saved === 'true' : true;
        const savedVol = localStorage.getItem('app_sound_volume');
        if (savedVol !== null) {
          this.volume = Math.max(0, Math.min(1, parseFloat(savedVol)));
        }
      } catch {}
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_sound_enabled', enabled ? 'true' : 'false');
      } catch {}
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_sound_volume', this.volume.toString());
      } catch {}
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  /**
   * Crisp, soft bell chime for habit / task check
   */
  public playCheck(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

      const peakGain = 0.2 * this.volume;
      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Audio context might be restricted
    }
  }

  public playTaskComplete(): void {
    this.playCheck();
  }

  /**
   * Ascending 3-note chime for streak celebration
   */
  public playStreak(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const noteStart = startTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        const peakGain = 0.15 * this.volume;
        gain.gain.setValueAtTime(peakGain, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.3);
      });
    } catch (e) {
      // Audio fallback
    }
  }

  /**
   * Warm triumphant routine completion fanfare
   */
  public playRoutineComplete(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const noteStart = startTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        const peakGain = 0.2 * this.volume;
        gain.gain.setValueAtTime(peakGain, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.35);
      });
    } catch (e) {
      // Audio fallback
    }
  }

  /**
   * Cool crystalline shimmer for streak freeze application
   */
  public playFreeze(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);

      const peakGain = 0.12 * this.volume;
      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {
      // Audio fallback
    }
  }

  /**
   * Fanfare for unlocking and claiming a reward milestone
   */
  public playRewardClaim(): void {
    if (!this.soundEnabled || this.volume <= 0) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C major arpeggio
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const noteStart = startTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        const peakGain = 0.22 * this.volume;
        gain.gain.setValueAtTime(peakGain, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
      });
    } catch (e) {
      // Audio fallback
    }
  }

  public play(name: 'check' | 'streak' | 'routine' | 'freeze' | 'celebrate' | 'reward' | string): void {
    if (name === 'check') this.playCheck();
    else if (name === 'streak') this.playStreak();
    else if (name === 'routine') this.playRoutineComplete();
    else if (name === 'freeze') this.playFreeze();
    else if (name === 'celebrate' || name === 'reward') this.playRewardClaim();
    else this.playCheck();
  }
}

export const soundManager = new SoundEffectManager();
