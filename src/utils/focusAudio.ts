// Offline-first Web Audio API Focus Sound Synthesizer
// Precision math-synthesized ambient soundscapes, binaural focus beats, ticks, and chimes.

export type AmbientSoundType = 'none' | 'lofi' | 'white-noise' | 'rain' | 'binaural' | 'cafe';

let audioCtx: AudioContext | null = null;
let whiteNoiseNode: AudioScheduledSourceNode | null = null;
let brownNoiseNode: AudioScheduledSourceNode | null = null;
let pinkNoiseNode: AudioScheduledSourceNode | null = null;
let lofiOscillatorNode1: OscillatorNode | null = null;
let lofiOscillatorNode2: OscillatorNode | null = null;
let cafeOscillatorNode: OscillatorNode | null = null;
let mainGainNode: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function startAmbientSound(type: AmbientSoundType, volume: number = 0.35) {
  try {
    stopAmbientSound();
    if (type === 'none') return;

    const ctx = getAudioContext();
    mainGainNode = ctx.createGain();
    mainGainNode.gain.setValueAtTime(Math.min(1, Math.max(0.01, volume)), ctx.currentTime);
    mainGainNode.connect(ctx.destination);

    if (type === 'white-noise') {
      // 1. Pure Soft White Noise
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(mainGainNode);
      whiteNoise.start(0);
      whiteNoiseNode = whiteNoise;
    } else if (type === 'rain') {
      // 2. Heavy Cozy Rain (Brown noise with random raindrops modulation)
      const bufferSize = 3 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.015 * white)) / 1.015;
        lastOut = output[i];
        output[i] *= 4.2;
      }

      const rainNoise = ctx.createBufferSource();
      rainNoise.buffer = noiseBuffer;
      rainNoise.loop = true;

      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(650, ctx.currentTime);

      const highpassFilter = ctx.createBiquadFilter();
      highpassFilter.type = 'highpass';
      highpassFilter.frequency.setValueAtTime(90, ctx.currentTime);

      rainNoise.connect(highpassFilter);
      highpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(mainGainNode);
      rainNoise.start(0);
      brownNoiseNode = rainNoise;
    } else if (type === 'binaural') {
      // 3. Alpha-Theta Neural Focus (120Hz Base + 128Hz Right = 8Hz Alpha Frequency)
      const oscLeft = ctx.createOscillator();
      oscLeft.type = 'sine';
      oscLeft.frequency.setValueAtTime(120, ctx.currentTime);

      const oscRight = ctx.createOscillator();
      oscRight.type = 'sine';
      oscRight.frequency.setValueAtTime(128, ctx.currentTime);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.4, ctx.currentTime);

      const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      if (pannerLeft && pannerRight) {
        pannerLeft.pan.setValueAtTime(-1, ctx.currentTime);
        pannerRight.pan.setValueAtTime(1, ctx.currentTime);
        oscLeft.connect(pannerLeft);
        pannerLeft.connect(subGain);
        oscRight.connect(pannerRight);
        pannerRight.connect(subGain);
      } else {
        oscLeft.connect(subGain);
        oscRight.connect(subGain);
      }

      subGain.connect(mainGainNode);
      oscLeft.start(0);
      oscRight.start(0);

      lofiOscillatorNode1 = oscLeft;
      lofiOscillatorNode2 = oscRight;
    } else if (type === 'cafe') {
      // 4. Cafe / Coffee Shop Resonance: Warm pink murmur with resonant bandpass
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const pinkNoise = ctx.createBufferSource();
      pinkNoise.buffer = noiseBuffer;
      pinkNoise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(420, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.8, ctx.currentTime);

      pinkNoise.connect(bandpass);
      bandpass.connect(mainGainNode);
      pinkNoise.start(0);
      pinkNoiseNode = pinkNoise;
    } else if (type === 'lofi') {
      // 5. Classic Lo-Fi Focus: Deep Brown Noise + Alpha Waves (80Hz & 84Hz)
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const brownNoise = ctx.createBufferSource();
      brownNoise.buffer = noiseBuffer;
      brownNoise.loop = true;

      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(450, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, ctx.currentTime);

      brownNoise.connect(lowpassFilter);
      lowpassFilter.connect(noiseGain);
      noiseGain.connect(mainGainNode);
      brownNoise.start(0);
      brownNoiseNode = brownNoise;

      const oscLeft = ctx.createOscillator();
      oscLeft.type = 'sine';
      oscLeft.frequency.setValueAtTime(80, ctx.currentTime);

      const pannerLeft = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pannerLeft) {
        pannerLeft.pan.setValueAtTime(-1, ctx.currentTime);
        oscLeft.connect(pannerLeft);
        pannerLeft.connect(mainGainNode);
      } else {
        oscLeft.connect(mainGainNode);
      }

      const oscRight = ctx.createOscillator();
      oscRight.type = 'sine';
      oscRight.frequency.setValueAtTime(84, ctx.currentTime);

      const pannerRight = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      if (pannerRight) {
        pannerRight.pan.setValueAtTime(1, ctx.currentTime);
        oscRight.connect(pannerRight);
        pannerRight.connect(mainGainNode);
      } else {
        oscRight.connect(mainGainNode);
      }

      oscLeft.start(0);
      oscRight.start(0);

      lofiOscillatorNode1 = oscLeft;
      lofiOscillatorNode2 = oscRight;
    }
  } catch (error) {
    console.warn('Failed to play ambient focus sound:', error);
  }
}

export function stopAmbientSound() {
  try {
    if (whiteNoiseNode) {
      whiteNoiseNode.stop();
      whiteNoiseNode = null;
    }
    if (brownNoiseNode) {
      brownNoiseNode.stop();
      brownNoiseNode = null;
    }
    if (pinkNoiseNode) {
      pinkNoiseNode.stop();
      pinkNoiseNode = null;
    }
    if (lofiOscillatorNode1) {
      lofiOscillatorNode1.stop();
      lofiOscillatorNode1 = null;
    }
    if (lofiOscillatorNode2) {
      lofiOscillatorNode2.stop();
      lofiOscillatorNode2 = null;
    }
    if (cafeOscillatorNode) {
      cafeOscillatorNode.stop();
      cafeOscillatorNode = null;
    }
    if (mainGainNode) {
      mainGainNode.disconnect();
      mainGainNode = null;
    }
  } catch (error) {
    console.warn('Focus ambient sound teardown:', error);
  }
}

// Gentle mechanical wooden tick sound
export function playTickSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.025);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.025);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.025);
  } catch (e) {}
}

export function playStartSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

export function playPauseSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
}

export function playTaskCompleteSound() {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.35);
    });
  } catch (e) {}
}

// Synthesize an elegant Zen arpeggio bell chime when deep focus sprint is accomplished
export function playCelebrationChime() {
  try {
    const ctx = getAudioContext();
    const chimeGain = ctx.createGain();
    chimeGain.gain.setValueAtTime(0, ctx.currentTime);
    chimeGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.08);
    chimeGain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 3.2);
    chimeGain.connect(ctx.destination);

    // E Major pentatonic bell resonance (E4, G#4, B4, E5, G#5)
    const notes = [329.63, 415.30, 493.88, 659.25, 830.61];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.16);
      osc.connect(chimeGain);
      osc.start(ctx.currentTime + index * 0.16);
      osc.stop(ctx.currentTime + index * 0.16 + 2.5);
    });
  } catch (error) {
    console.warn('Failed to play focus chime:', error);
  }
}
