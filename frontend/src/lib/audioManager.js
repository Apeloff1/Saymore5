// ========== ENHANCED AUDIO MANAGER - ADDICTIVE SOUND DESIGN ==========
// 70 Steps of Neuron Activation through Audio

class EnhancedAudioManager {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.currentMusic = null;
    this.volume = 0.5;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.7;
    this.initialized = false;
    this.comboMultiplier = 1;
    
    // Preloaded oscillator pools for instant response
    this.oscillatorPool = [];
  }

  init() {
    if (this.initialized) return;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
      
      // Music channel
      this.musicGain = this.audioContext.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);
      
      // SFX channel
      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);
      
      // Compressor for punchy sound
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      this.sfxGain.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.audioContext.currentTime, 0.1);
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(this.musicVolume, this.audioContext.currentTime, 0.1);
    }
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVolume, this.audioContext.currentTime, 0.1);
    }
  }

  // ========== NEURON ACTIVATION SOUND #1-5: SATISFYING CAST ==========
  cast() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Whoosh sound - satisfying air movement
    const noise = this.createNoise(0.15);
    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
    noiseFilter.Q.value = 1;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    // Line release click
    this.playTone(1200, 0.02, 'sine', 0.2, now);
    this.playTone(800, 0.03, 'sine', 0.15, now + 0.01);
    
    // Reel spin
    for (let i = 0; i < 5; i++) {
      this.playTone(400 + i * 50, 0.02, 'square', 0.05, now + 0.02 + i * 0.015);
    }
  }

  // ========== NEURON ACTIVATION #6-10: IMMERSIVE SPLASH ==========
  splash() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Water impact - satisfying plop
    const noise = this.createNoise(0.3);
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.25);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    // Bubble sounds
    for (let i = 0; i < 3; i++) {
      const bubbleFreq = 600 + Math.random() * 400;
      this.playTone(bubbleFreq, 0.08, 'sine', 0.1, now + 0.1 + i * 0.05);
    }
    
    // Sub-bass impact for weight
    this.playTone(60, 0.15, 'sine', 0.3, now);
  }

  // ========== NEURON ACTIVATION #11-20: EXCITING BITE ==========
  bite() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Urgent alert tone - triggers attention
    const frequencies = [880, 1100, 880, 1100];
    frequencies.forEach((freq, i) => {
      this.playTone(freq, 0.08, 'square', 0.25, now + i * 0.1);
    });
    
    // Tension building sub
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.4);
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.setValueAtTime(0.3, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
    
    // Vibration pattern for haptic sync
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50, 30, 100]);
    }
  }

  // ========== NEURON ACTIVATION #21-35: DOPAMINE CATCH ==========
  catch() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Victory fanfare - major chord arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 'sine', 0.3, now + i * 0.08);
      // Add harmonics for richness
      this.playTone(freq * 2, 0.15, 'sine', 0.1, now + i * 0.08);
    });
    
    // Coin/reward sound
    this.playTone(1800, 0.05, 'sine', 0.2, now + 0.35);
    this.playTone(2200, 0.1, 'sine', 0.25, now + 0.4);
    
    // Satisfying pop
    const noise = this.createNoise(0.05);
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    const popGain = this.audioContext.createGain();
    popGain.gain.setValueAtTime(0.3, now + 0.3);
    popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    
    noise.connect(filter);
    filter.connect(popGain);
    popGain.connect(this.sfxGain);
    
    // Haptic success
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 200]);
    }
  }

  // ========== NEURON ACTIVATION #36-45: PERFECT CATCH EUPHORIA ==========
  perfect() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Magical shimmer
    for (let i = 0; i < 8; i++) {
      const freq = 1000 + i * 200 + Math.random() * 100;
      this.playTone(freq, 0.3 - i * 0.03, 'sine', 0.15, now + i * 0.04);
    }
    
    // Power chord
    this.playTone(261.63, 0.4, 'sawtooth', 0.2, now); // C4
    this.playTone(329.63, 0.4, 'sawtooth', 0.15, now); // E4
    this.playTone(392.00, 0.4, 'sawtooth', 0.15, now); // G4
    
    // Rising sweep
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    
    const sweepGain = this.audioContext.createGain();
    sweepGain.gain.setValueAtTime(0.2, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
    
    // Star sparkle
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        this.playTone(2000 + Math.random() * 1000, 0.05, 'sine', 0.1, this.audioContext.currentTime + i * 0.06);
      }
    }, 200);
    
    // Strong haptic
    if (navigator.vibrate) {
      navigator.vibrate([50, 50, 100, 50, 200]);
    }
  }

  // ========== NEURON ACTIVATION #46-50: LEVEL UP RUSH ==========
  levelUp() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Epic ascending scale
    const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
    scale.forEach((freq, i) => {
      this.playTone(freq, 0.15, 'sine', 0.25 - i * 0.02, now + i * 0.07);
      this.playTone(freq * 1.5, 0.12, 'sine', 0.1, now + i * 0.07);
    });
    
    // Triumphant chord
    setTimeout(() => {
      const t = this.audioContext.currentTime;
      this.playTone(523.25, 0.6, 'sine', 0.3, t); // C5
      this.playTone(659.25, 0.6, 'sine', 0.25, t); // E5
      this.playTone(783.99, 0.6, 'sine', 0.25, t); // G5
      this.playTone(1046.50, 0.6, 'sine', 0.2, t); // C6
    }, 560);
    
    // Cymbal crash
    const noise = this.createNoise(0.8);
    const crashFilter = this.audioContext.createBiquadFilter();
    crashFilter.type = 'highpass';
    crashFilter.frequency.value = 3000;
    
    const crashGain = this.audioContext.createGain();
    crashGain.gain.setValueAtTime(0.2, now + 0.56);
    crashGain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
    
    noise.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(this.sfxGain);
    
    // Long haptic celebration
    if (navigator.vibrate) {
      navigator.vibrate([100, 30, 100, 30, 100, 30, 300]);
    }
  }

  // ========== NEURON ACTIVATION #51-55: ACHIEVEMENT UNLOCK ==========
  achievement() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Treasure chest open
    this.playTone(400, 0.1, 'sine', 0.3, now);
    this.playTone(500, 0.1, 'sine', 0.3, now + 0.1);
    this.playTone(600, 0.1, 'sine', 0.3, now + 0.2);
    
    // Magical reveal
    for (let i = 0; i < 6; i++) {
      this.playTone(800 + i * 150, 0.2, 'sine', 0.2 - i * 0.02, now + 0.3 + i * 0.05);
    }
    
    // Golden shimmer
    setTimeout(() => {
      for (let i = 0; i < 10; i++) {
        const t = this.audioContext.currentTime;
        this.playTone(1500 + Math.random() * 1500, 0.08, 'sine', 0.1, t + i * 0.03);
      }
    }, 500);
    
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 400]);
    }
  }

  // ========== NEURON ACTIVATION #56-60: COMBO BUILDING ==========
  combo(multiplier) {
    this.init();
    if (!this.audioContext) return;
    
    this.comboMultiplier = multiplier;
    const now = this.audioContext.currentTime;
    
    // Rising pitch with combo
    const baseFreq = 400 + (multiplier - 1) * 100;
    this.playTone(baseFreq, 0.1, 'sine', 0.2, now);
    this.playTone(baseFreq * 1.25, 0.08, 'sine', 0.15, now + 0.05);
    
    // Intensity increases with combo
    if (multiplier >= 3) {
      this.playTone(baseFreq * 1.5, 0.08, 'sine', 0.15, now + 0.1);
    }
    if (multiplier >= 5) {
      // Fire mode!
      this.playTone(baseFreq * 2, 0.1, 'sawtooth', 0.1, now + 0.15);
    }
    
    // Quick haptic
    if (navigator.vibrate) {
      navigator.vibrate(20 + multiplier * 10);
    }
  }

  // ========== NEURON ACTIVATION #61-65: MISS/FAIL (Motivating) ==========
  miss() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    
    // Descending "aww" - not too punishing
    this.playTone(400, 0.15, 'sine', 0.2, now);
    this.playTone(350, 0.15, 'sine', 0.2, now + 0.1);
    this.playTone(300, 0.2, 'sine', 0.15, now + 0.2);
    
    // Soft thud
    this.playTone(80, 0.1, 'sine', 0.2, now);
    
    // Quick sad haptic
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  }

  // ========== NEURON ACTIVATION #66-68: UI SOUNDS ==========
  select() {
    this.init();
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    this.playTone(800, 0.05, 'sine', 0.15, now);
    this.playTone(1000, 0.05, 'sine', 0.1, now + 0.02);
    
    if (navigator.vibrate) navigator.vibrate(10);
  }

  hover() {
    this.init();
    if (!this.audioContext) return;
    
    this.playTone(600, 0.03, 'sine', 0.08, this.audioContext.currentTime);
  }

  // ========== NEURON ACTIVATION #69-70: AMBIENT UPBEAT MUSIC ==========
  startMusic(season = 'summer') {
    this.init();
    if (!this.audioContext || this.currentMusic) return;
    
    this.currentMusic = { playing: true };
    
    // Upbeat tempo configurations by season
    const seasonConfigs = {
      spring: { baseNote: 293.66, mode: 'major', tempo: 1.2, energy: 'upbeat' },   // D4 - cheerful
      summer: { baseNote: 329.63, mode: 'major', tempo: 1.4, energy: 'upbeat' },   // E4 - energetic
      autumn: { baseNote: 261.63, mode: 'major', tempo: 1.0, energy: 'mellow' },   // C4 - warm
      winter: { baseNote: 246.94, mode: 'major', tempo: 0.9, energy: 'cozy' },     // B3 - cozy
    };
    
    const config = seasonConfigs[season] || seasonConfigs.summer;
    
    // Start upbeat ambient pad
    this.playUpbeatAmbient(config);
    
    // Catchy melodic patterns
    this.playUpbeatMelody(config);
    
    // Rhythmic bass
    this.playUpbeatBass(config);
    
    // Nature ambience
    this.playNatureSounds(season);
  }

  playUpbeatAmbient(config) {
    if (!this.currentMusic?.playing) return;
    
    const now = this.audioContext.currentTime;
    const { baseNote } = config;
    
    // Bright chord pad - major triad
    const chordNotes = [baseNote, baseNote * 1.25, baseNote * 1.5]; // Root, Major 3rd, 5th
    
    chordNotes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
      gain.gain.setValueAtTime(0.04, now + 3.5);
      gain.gain.linearRampToValueAtTime(0, now + 4);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start(now);
      osc.stop(now + 4);
    });
    
    // Loop with chord progression
    setTimeout(() => {
      if (this.currentMusic?.playing) {
        this.playUpbeatAmbient(config);
      }
    }, 3800);
  }

  playUpbeatMelody(config) {
    if (!this.currentMusic?.playing) return;
    
    const { baseNote, tempo } = config;
    
    // Pentatonic scale for catchy melodies (always sounds good)
    const pentatonic = [1, 1.125, 1.25, 1.5, 1.667, 2]; // Major pentatonic ratios
    
    const now = this.audioContext.currentTime;
    const noteCount = 4 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < noteCount; i++) {
      const scaleIndex = Math.floor(Math.random() * pentatonic.length);
      const octave = Math.random() > 0.6 ? 2 : 1;
      const freq = baseNote * pentatonic[scaleIndex] * octave;
      const duration = (0.2 + Math.random() * 0.3) / tempo;
      const delay = i * (0.25 / tempo);
      
      // Brighter, more present melody
      this.playMelodyNote(freq, duration, now + delay);
    }
    
    // Quick loop for upbeat feel
    const loopTime = (noteCount * 0.3 / tempo + 1) * 1000;
    setTimeout(() => {
      if (this.currentMusic?.playing) {
        this.playUpbeatMelody(config);
      }
    }, loopTime);
  }

  playMelodyNote(freq, duration, startTime) {
    const osc = this.audioContext.createOscillator();
    osc.type = 'triangle'; // Brighter than sine
    osc.frequency.value = freq;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
    gain.gain.setValueAtTime(0.06, startTime + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.musicGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  }

  playUpbeatBass(config) {
    if (!this.currentMusic?.playing) return;
    
    const { baseNote, tempo } = config;
    const now = this.audioContext.currentTime;
    
    // Simple bass pattern - root and fifth
    const bassNotes = [baseNote / 2, baseNote / 2, baseNote * 0.75, baseNote / 2];
    const beatDuration = 0.4 / tempo;
    
    bassNotes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const gain = this.audioContext.createGain();
      const startTime = now + i * beatDuration;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.1, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + beatDuration * 0.8);
      
      osc.connect(gain);
      gain.connect(this.musicGain);
      
      osc.start(startTime);
      osc.stop(startTime + beatDuration);
    });
    
    // Loop bass
    const loopTime = bassNotes.length * beatDuration * 1000;
    setTimeout(() => {
      if (this.currentMusic?.playing) {
        this.playUpbeatBass(config);
      }
    }, loopTime);
  }

  playMusicNote(freq, duration, startTime) {
    const osc = this.audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.06, startTime + 0.1);
    gain.gain.setValueAtTime(0.06, startTime + duration - 0.2);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    // Add reverb-like effect
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.3;
    const delayGain = this.audioContext.createGain();
    delayGain.gain.value = 0.3;
    
    osc.connect(gain);
    gain.connect(this.musicGain);
    gain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.musicGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration + 0.5);
  }

  playNatureSounds(season) {
    if (!this.currentMusic?.playing) return;
    
    const now = this.audioContext.currentTime;
    
    // Water lapping
    if (Math.random() > 0.5) {
      const noise = this.createNoise(1.5);
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.linearRampToValueAtTime(200, now + 1.5);
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.3);
      gain.gain.linearRampToValueAtTime(0.03, now + 1.2);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
    }
    
    // Bird chirp (spring/summer)
    if ((season === 'spring' || season === 'summer') && Math.random() > 0.7) {
      const chirpTime = now + Math.random() * 2;
      for (let i = 0; i < 3; i++) {
        const freq = 2000 + Math.random() * 1500;
        this.playTone(freq, 0.05, 'sine', 0.04, chirpTime + i * 0.08);
      }
    }
    
    // Wind (autumn/winter)
    if ((season === 'autumn' || season === 'winter') && Math.random() > 0.6) {
      const noise = this.createNoise(3);
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(500, now + 1.5);
      filter.frequency.linearRampToValueAtTime(300, now + 3);
      filter.Q.value = 2;
      
      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.5);
      gain.gain.linearRampToValueAtTime(0.02, now + 2.5);
      gain.gain.linearRampToValueAtTime(0, now + 3);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
    }
    
    // Loop nature sounds
    setTimeout(() => {
      if (this.currentMusic?.playing) {
        this.playNatureSounds(season);
      }
    }, 2000 + Math.random() * 3000);
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.playing = false;
      this.currentMusic = null;
    }
  }

  // ========== HELPER FUNCTIONS ==========
  playTone(frequency, duration, type = 'sine', volume = 0.2, startTime = null) {
    if (!this.audioContext) return;
    
    const now = startTime || this.audioContext.currentTime;
    
    const osc = this.audioContext.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  createNoise(duration) {
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.start(this.audioContext.currentTime);
    
    return noise;
  }
}

// Export singleton
export const retroSounds = new EnhancedAudioManager();

export default retroSounds;
