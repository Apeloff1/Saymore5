// ========== AMBIENT MUSIC & SOUND EFFECTS ==========
// Web Audio API based retro sound effects and ambient music

class AmbientMusicGenerator {
  constructor() {
    this.audioContext = null;
    this.isPlaying = false;
    this.initialized = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.musicNodes = [];
    this.volume = 0.3;
  }

  init() {
    if (this.initialized) return true;
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
      
      this.ambientGain = this.audioContext.createGain();
      this.ambientGain.connect(this.masterGain);
      this.ambientGain.gain.value = 0.4;
      
      this.initialized = true;
      return true;
    } catch (e) {
      console.log('Web Audio API not supported');
      return false;
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  // ========== AMBIENT MUSIC BY SEASON ==========
  
  startAmbientMusic(season = 'summer') {
    if (!this.init() || this.isPlaying) return;
    this.isPlaying = true;
    
    // Different ambient patterns per season
    const patterns = {
      spring: {
        notes: [523, 587, 659, 698, 784, 698, 659, 587], // C5 major scale
        tempo: 0.4,
        waveType: 'sine',
      },
      summer: {
        notes: [392, 440, 494, 523, 587, 523, 494, 440], // G4 major
        tempo: 0.35,
        waveType: 'triangle',
      },
      autumn: {
        notes: [349, 392, 440, 466, 523, 466, 440, 392], // F4 minor feel
        tempo: 0.45,
        waveType: 'sine',
      },
      winter: {
        notes: [262, 294, 330, 349, 392, 349, 330, 294], // C4 gentle
        tempo: 0.5,
        waveType: 'sine',
      },
    };
    
    const pattern = patterns[season] || patterns.summer;
    this.playAmbientLoop(pattern);
    this.playWaterAmbient();
    this.playBirdAmbient(season);
  }

  playAmbientLoop(pattern) {
    if (!this.isPlaying || !this.audioContext) return;
    
    let noteIndex = 0;
    const playNote = () => {
      if (!this.isPlaying) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.ambientGain);
      
      osc.type = pattern.waveType;
      osc.frequency.value = pattern.notes[noteIndex];
      
      const now = this.audioContext.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + pattern.tempo);
      
      osc.start(now);
      osc.stop(now + pattern.tempo);
      
      this.musicNodes.push({ osc, gain });
      
      noteIndex = (noteIndex + 1) % pattern.notes.length;
      setTimeout(playNote, pattern.tempo * 1000);
    };
    
    playNote();
  }

  playWaterAmbient() {
    if (!this.isPlaying || !this.audioContext) return;
    
    // Create water/wave sounds using noise
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate filtered noise for water
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    // Low pass filter for water sound
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;
    
    const waterGain = this.audioContext.createGain();
    waterGain.gain.value = 0.03;
    
    noise.connect(filter);
    filter.connect(waterGain);
    waterGain.connect(this.ambientGain);
    
    noise.start();
    this.musicNodes.push({ source: noise, filter, gain: waterGain });
    
    // Modulate water sound
    const modulateWater = () => {
      if (!this.isPlaying) return;
      const mod = 0.02 + Math.sin(Date.now() * 0.001) * 0.01;
      waterGain.gain.value = mod;
      setTimeout(modulateWater, 100);
    };
    modulateWater();
  }

  playBirdAmbient(season) {
    if (!this.isPlaying || !this.audioContext) return;
    if (season === 'winter') return; // No birds in winter
    
    const chirp = () => {
      if (!this.isPlaying) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.ambientGain);
      
      osc.type = 'sine';
      const baseFreq = 1800 + Math.random() * 800;
      
      const now = this.audioContext.currentTime;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, now + 0.05);
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + 0.1);
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, now + 0.15);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
      
      // Random interval for next chirp
      const nextChirp = 3000 + Math.random() * 8000;
      setTimeout(chirp, nextChirp);
    };
    
    // Start birds after a random delay
    setTimeout(chirp, 2000 + Math.random() * 3000);
  }

  stopAmbientMusic() {
    this.isPlaying = false;
    
    // Fade out and stop all nodes
    this.musicNodes.forEach(node => {
      try {
        if (node.gain) {
          node.gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
        }
        if (node.osc) node.osc.stop(this.audioContext.currentTime + 0.5);
        if (node.source) node.source.stop(this.audioContext.currentTime + 0.5);
      } catch (e) {}
    });
    
    this.musicNodes = [];
  }

  // ========== SOUND EFFECTS ==========

  playBeep(frequency = 440, duration = 0.1, type = 'square') {
    if (!this.init()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = type;
    osc.frequency.value = frequency;
    
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    osc.start(now);
    osc.stop(now + duration);
  }

  playCast() {
    if (!this.init()) return;
    
    // Whoosh sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    
    const now = this.audioContext.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.4);
    
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.linearRampToValueAtTime(2000, now + 0.2);
    filter.frequency.linearRampToValueAtTime(400, now + 0.4);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playBite() {
    // Alert beeps
    [0, 100, 200].forEach((delay, i) => {
      setTimeout(() => this.playBeep(800 + i * 100, 0.08, 'square'), delay);
    });
  }

  playCatch() {
    // Victory arpeggio
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.15, 'square'), i * 80);
    });
  }

  playMiss() {
    if (!this.init()) return;
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.type = 'sawtooth';
    
    const now = this.audioContext.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.4);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playSelect() {
    this.playBeep(600, 0.08, 'square');
  }

  playLevelUp() {
    const notes = [523, 659, 784, 880, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.18, 'square'), i * 100);
    });
  }

  playPerfect() {
    const notes = [784, 988, 1175, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.1, 'triangle'), i * 60);
    });
  }

  playAchievement() {
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playBeep(freq, 0.12, 'square'), i * 80);
    });
  }

  playSplash() {
    if (!this.init()) return;
    
    // Create noise burst for splash
    const bufferSize = this.audioContext.sampleRate * 0.3;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;
    
    const gain = this.audioContext.createGain();
    gain.gain.value = 0.15;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start();
  }
}

// Singleton instance
export const ambientMusic = new AmbientMusicGenerator();

// Legacy API compatibility
export const retroSounds = {
  cast: () => ambientMusic.playCast(),
  bite: () => ambientMusic.playBite(),
  catch: () => ambientMusic.playCatch(),
  miss: () => ambientMusic.playMiss(),
  select: () => ambientMusic.playSelect(),
  levelUp: () => ambientMusic.playLevelUp(),
  perfect: () => ambientMusic.playPerfect(),
  achievement: () => ambientMusic.playAchievement(),
  splash: () => ambientMusic.playSplash(),
  beep: (freq) => ambientMusic.playBeep(freq),
  startMusic: (season) => ambientMusic.startAmbientMusic(season),
  stopMusic: () => ambientMusic.stopAmbientMusic(),
  setVolume: (vol) => ambientMusic.setVolume(vol),
};

export default ambientMusic;
