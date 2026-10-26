// ============================================================================
// SKOR+ CalcQuest: Web Audio API Retro Sound & Ambience Synthesizer
// Subtle, non-intrusive educational game audio with mute and volume controls.
// ============================================================================

class CalcQuestSoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sfxVolume = 0.5;
    this.musicVolume = 0.25;
    this.lastFootstepAt = 0;
  }

  ensureContext() {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setSettings({ muted, sfxVolume, musicVolume }) {
    if (typeof muted === 'boolean') this.muted = muted;
    if (typeof sfxVolume === 'number') this.sfxVolume = Math.max(0, Math.min(1, sfxVolume));
    if (typeof musicVolume === 'number') this.musicVolume = Math.max(0, Math.min(1, musicVolume));
  }

  playTone(freq, duration = 0.12, type = 'triangle', delay = 0, gainScale = 0.2) {
    const ctx = this.ensureContext();
    if (!ctx || this.muted || this.sfxVolume <= 0) return;

    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      const peak = Math.max(0.001, this.sfxVolume * gainScale);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore audio errors on restricted devices
    }
  }

  playFootstep() {
    const now = Date.now();
    if (now - this.lastFootstepAt < 230) return;
    this.lastFootstepAt = now;
    this.playTone(140, 0.045, 'sine', 0, 0.08);
  }

  playInteract() {
    this.playTone(523.25, 0.08, 'triangle', 0, 0.18);
    this.playTone(659.25, 0.1, 'triangle', 0.06, 0.18);
  }

  playQuestAccepted() {
    this.playTone(440, 0.09, 'triangle', 0, 0.2);
    this.playTone(554.37, 0.09, 'triangle', 0.08, 0.2);
    this.playTone(659.25, 0.16, 'triangle', 0.16, 0.22);
  }

  playCorrectAnswer() {
    this.playTone(523.25, 0.1, 'triangle', 0, 0.22);
    this.playTone(659.25, 0.1, 'triangle', 0.09, 0.22);
    this.playTone(783.99, 0.12, 'triangle', 0.18, 0.24);
    this.playTone(1046.5, 0.22, 'triangle', 0.27, 0.25);
  }

  playWrongAnswer() {
    this.playTone(260, 0.14, 'sawtooth', 0, 0.14);
    this.playTone(210, 0.18, 'sawtooth', 0.12, 0.14);
  }

  playBridgeRepair() {
    [330, 392, 493.88, 587.33, 659.25, 783.99].forEach((f, idx) => {
      this.playTone(f, 0.12, 'triangle', idx * 0.07, 0.22);
    });
  }

  playBossStageClear() {
    [440, 554.37, 659.25, 880].forEach((f, idx) => {
      this.playTone(f, 0.14, 'square', idx * 0.08, 0.16);
    });
  }

  playWorldRestored() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, idx) => {
      this.playTone(f, 0.18, 'triangle', idx * 0.09, 0.26);
    });
  }
}

export const soundEngine = new CalcQuestSoundEngine();
