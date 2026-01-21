// ========== GO FISH! ADVANCED WEATHER & ENVIRONMENT SYSTEM ==========
// Comprehensive weather simulation, day/night cycles, and environmental effects
// ~1500+ lines of environment simulation

// ========== WEATHER SYSTEM ==========

/**
 * Advanced weather simulation with realistic transitions
 */
class WeatherSystem {
  constructor() {
    this.currentWeather = 'sunny';
    this.targetWeather = 'sunny';
    this.transitionProgress = 1;
    this.transitionSpeed = 0.001;
    
    // Weather state
    this.state = {
      cloudCover: 0,
      rainIntensity: 0,
      windSpeed: 0,
      windDirection: 0,
      temperature: 20,
      humidity: 50,
      visibility: 1,
      pressure: 1013,
      fogDensity: 0,
      lightningChance: 0,
      snowIntensity: 0,
    };
    
    // Weather presets
    this.presets = {
      sunny: {
        cloudCover: 0.1,
        rainIntensity: 0,
        windSpeed: 5,
        temperature: 25,
        humidity: 40,
        visibility: 1,
        pressure: 1020,
        fogDensity: 0,
        lightningChance: 0,
        snowIntensity: 0,
      },
      cloudy: {
        cloudCover: 0.6,
        rainIntensity: 0,
        windSpeed: 10,
        temperature: 20,
        humidity: 60,
        visibility: 0.9,
        pressure: 1010,
        fogDensity: 0.1,
        lightningChance: 0,
        snowIntensity: 0,
      },
      overcast: {
        cloudCover: 0.9,
        rainIntensity: 0,
        windSpeed: 15,
        temperature: 18,
        humidity: 70,
        visibility: 0.8,
        pressure: 1005,
        fogDensity: 0.2,
        lightningChance: 0,
        snowIntensity: 0,
      },
      lightRain: {
        cloudCover: 0.8,
        rainIntensity: 0.3,
        windSpeed: 12,
        temperature: 16,
        humidity: 80,
        visibility: 0.7,
        pressure: 1000,
        fogDensity: 0.15,
        lightningChance: 0.05,
        snowIntensity: 0,
      },
      rain: {
        cloudCover: 0.95,
        rainIntensity: 0.6,
        windSpeed: 20,
        temperature: 14,
        humidity: 90,
        visibility: 0.5,
        pressure: 995,
        fogDensity: 0.3,
        lightningChance: 0.1,
        snowIntensity: 0,
      },
      heavyRain: {
        cloudCover: 1.0,
        rainIntensity: 1.0,
        windSpeed: 30,
        temperature: 12,
        humidity: 98,
        visibility: 0.3,
        pressure: 985,
        fogDensity: 0.4,
        lightningChance: 0.15,
        snowIntensity: 0,
      },
      storm: {
        cloudCover: 1.0,
        rainIntensity: 0.9,
        windSpeed: 50,
        temperature: 10,
        humidity: 95,
        visibility: 0.2,
        pressure: 975,
        fogDensity: 0.5,
        lightningChance: 0.4,
        snowIntensity: 0,
      },
      foggy: {
        cloudCover: 0.4,
        rainIntensity: 0,
        windSpeed: 3,
        temperature: 12,
        humidity: 95,
        visibility: 0.2,
        pressure: 1008,
        fogDensity: 0.9,
        lightningChance: 0,
        snowIntensity: 0,
      },
      lightSnow: {
        cloudCover: 0.8,
        rainIntensity: 0,
        windSpeed: 10,
        temperature: -2,
        humidity: 70,
        visibility: 0.6,
        pressure: 1015,
        fogDensity: 0.1,
        lightningChance: 0,
        snowIntensity: 0.3,
      },
      snow: {
        cloudCover: 0.9,
        rainIntensity: 0,
        windSpeed: 15,
        temperature: -5,
        humidity: 80,
        visibility: 0.4,
        pressure: 1010,
        fogDensity: 0.2,
        lightningChance: 0,
        snowIntensity: 0.7,
      },
      blizzard: {
        cloudCover: 1.0,
        rainIntensity: 0,
        windSpeed: 60,
        temperature: -15,
        humidity: 85,
        visibility: 0.1,
        pressure: 990,
        fogDensity: 0.6,
        lightningChance: 0,
        snowIntensity: 1.0,
      },
    };
    
    // Weather history for patterns
    this.history = [];
    this.maxHistory = 24;
    
    // Listeners
    this.listeners = [];
  }
  
  /**
   * Update weather state
   */
  update(deltaTime) {
    // Progress transition
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + this.transitionSpeed * deltaTime);
      this.interpolateWeather();
    }
    
    // Add natural variation
    this.addNaturalVariation(deltaTime);
    
    // Check for lightning
    if (this.state.lightningChance > 0 && Math.random() < this.state.lightningChance * deltaTime * 0.001) {
      this.triggerLightning();
    }
    
    // Random weather changes
    if (Math.random() < 0.0001 * deltaTime) {
      this.randomWeatherChange();
    }
    
    return this.getState();
  }
  
  /**
   * Interpolate between weather states
   */
  interpolateWeather() {
    const current = this.presets[this.currentWeather];
    const target = this.presets[this.targetWeather];
    const t = this.easeInOutCubic(this.transitionProgress);
    
    Object.keys(this.state).forEach(key => {
      if (current[key] !== undefined && target[key] !== undefined) {
        this.state[key] = current[key] + (target[key] - current[key]) * t;
      }
    });
  }
  
  /**
   * Add natural variation to weather
   */
  addNaturalVariation(deltaTime) {
    const variation = deltaTime * 0.0001;
    
    // Wind gusts
    this.state.windSpeed += (Math.random() - 0.5) * variation * 10;
    this.state.windDirection += (Math.random() - 0.5) * variation * 5;
    
    // Temperature fluctuation
    this.state.temperature += (Math.random() - 0.5) * variation * 0.5;
    
    // Cloud movement
    this.state.cloudCover = Math.max(0, Math.min(1, 
      this.state.cloudCover + (Math.random() - 0.5) * variation
    ));
    
    // Rain variation
    if (this.state.rainIntensity > 0) {
      this.state.rainIntensity = Math.max(0, Math.min(1,
        this.state.rainIntensity + (Math.random() - 0.5) * variation * 2
      ));
    }
  }
  
  /**
   * Set weather with transition
   */
  setWeather(weatherType, instant = false) {
    if (!this.presets[weatherType]) return;
    
    this.currentWeather = this.targetWeather;
    this.targetWeather = weatherType;
    this.transitionProgress = instant ? 1 : 0;
    
    if (instant) {
      this.interpolateWeather();
    }
    
    // Record in history
    this.history.push({
      weather: weatherType,
      timestamp: Date.now(),
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Notify listeners
    this.notifyListeners('weatherChange', { from: this.currentWeather, to: weatherType });
  }
  
  /**
   * Trigger lightning effect
   */
  triggerLightning() {
    const lightning = {
      intensity: 0.5 + Math.random() * 0.5,
      duration: 100 + Math.random() * 200,
      position: {
        x: Math.random() * 1000 - 500,
        y: 200 + Math.random() * 300,
      },
      branches: Math.floor(Math.random() * 5) + 1,
    };
    
    // Thunder delay based on "distance"
    const thunderDelay = Math.random() * 3000 + 500;
    
    this.notifyListeners('lightning', { lightning, thunderDelay });
  }
  
  /**
   * Random weather change based on patterns
   */
  randomWeatherChange() {
    const transitions = {
      sunny: ['sunny', 'sunny', 'cloudy', 'foggy'],
      cloudy: ['sunny', 'cloudy', 'overcast', 'lightRain'],
      overcast: ['cloudy', 'overcast', 'lightRain', 'rain'],
      lightRain: ['cloudy', 'overcast', 'rain'],
      rain: ['lightRain', 'rain', 'heavyRain', 'storm'],
      heavyRain: ['rain', 'heavyRain', 'storm'],
      storm: ['heavyRain', 'rain', 'storm'],
      foggy: ['sunny', 'cloudy', 'foggy'],
      lightSnow: ['cloudy', 'lightSnow', 'snow'],
      snow: ['lightSnow', 'snow', 'blizzard'],
      blizzard: ['snow', 'blizzard'],
    };
    
    const options = transitions[this.targetWeather] || ['sunny'];
    const nextWeather = options[Math.floor(Math.random() * options.length)];
    
    if (nextWeather !== this.targetWeather) {
      this.setWeather(nextWeather);
    }
  }
  
  /**
   * Get current weather state
   */
  getState() {
    return {
      ...this.state,
      type: this.targetWeather,
      transitioning: this.transitionProgress < 1,
      transitionProgress: this.transitionProgress,
    };
  }
  
  /**
   * Get weather effects on fishing
   */
  getFishingEffects() {
    return {
      biteMultiplier: this.calculateBiteMultiplier(),
      rarityBonus: this.calculateRarityBonus(),
      tensionMultiplier: this.calculateTensionMultiplier(),
      visibilityFactor: this.state.visibility,
      soundDampening: this.state.rainIntensity * 0.5,
    };
  }
  
  calculateBiteMultiplier() {
    let mult = 1.0;
    
    // Light rain is best
    if (this.state.rainIntensity > 0.2 && this.state.rainIntensity < 0.5) {
      mult *= 1.3;
    }
    
    // Overcast is good
    if (this.state.cloudCover > 0.6 && this.state.cloudCover < 0.9) {
      mult *= 1.15;
    }
    
    // Storms are bad
    if (this.state.windSpeed > 40) {
      mult *= 0.6;
    }
    
    // Fog can be good
    if (this.state.fogDensity > 0.5) {
      mult *= 1.1;
    }
    
    // Pressure changes
    if (this.state.pressure < 1000) {
      mult *= 1.2; // Low pressure = fish more active
    }
    
    return mult;
  }
  
  calculateRarityBonus() {
    let bonus = 0;
    
    // Storms bring rare fish
    if (this.targetWeather === 'storm') bonus += 0.3;
    if (this.targetWeather === 'blizzard') bonus += 0.4;
    
    // Night rain
    if (this.state.rainIntensity > 0.5) bonus += 0.15;
    
    // Fog
    if (this.state.fogDensity > 0.7) bonus += 0.2;
    
    return bonus;
  }
  
  calculateTensionMultiplier() {
    let mult = 1.0;
    
    // Wind increases difficulty
    mult += this.state.windSpeed * 0.01;
    
    // Rain makes fish stronger
    mult += this.state.rainIntensity * 0.2;
    
    return mult;
  }
  
  // Event system
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(l => l(event, data));
  }
  
  // Easing function
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

// ========== DAY/NIGHT CYCLE SYSTEM ==========

/**
 * Realistic day/night cycle with sun/moon positioning
 */
class DayNightCycle {
  constructor(startHour = 12) {
    this.currentHour = startHour;
    this.timeSpeed = 1; // Real-time by default
    this.paused = false;
    
    // Celestial bodies
    this.sun = {
      angle: 0,
      elevation: 0,
      intensity: 1,
      color: { r: 255, g: 255, b: 220 },
    };
    
    this.moon = {
      angle: 0,
      elevation: 0,
      intensity: 0,
      phase: 0, // 0-1 (new to full)
      color: { r: 200, g: 210, b: 255 },
    };
    
    // Lighting state
    this.lighting = {
      ambient: { r: 1, g: 1, b: 1 },
      directional: { r: 1, g: 1, b: 1 },
      intensity: 1,
      shadowStrength: 0.5,
    };
    
    // Sky colors for different times
    this.skyGradients = {
      night: [
        { pos: 0, color: '#0a0a1a' },
        { pos: 0.5, color: '#101030' },
        { pos: 1, color: '#151540' },
      ],
      dawn: [
        { pos: 0, color: '#1a1a3a' },
        { pos: 0.3, color: '#4a2a5a' },
        { pos: 0.6, color: '#8a4a6a' },
        { pos: 1, color: '#ffa080' },
      ],
      sunrise: [
        { pos: 0, color: '#4080c0' },
        { pos: 0.4, color: '#ff9060' },
        { pos: 0.7, color: '#ffb080' },
        { pos: 1, color: '#ffe0b0' },
      ],
      day: [
        { pos: 0, color: '#2080e0' },
        { pos: 0.5, color: '#40a0f0' },
        { pos: 1, color: '#80c0ff' },
      ],
      noon: [
        { pos: 0, color: '#1070d0' },
        { pos: 0.5, color: '#2090f0' },
        { pos: 1, color: '#60b0ff' },
      ],
      afternoon: [
        { pos: 0, color: '#3090e0' },
        { pos: 0.5, color: '#50a0e0' },
        { pos: 1, color: '#90c0f0' },
      ],
      sunset: [
        { pos: 0, color: '#4060a0' },
        { pos: 0.3, color: '#a06080' },
        { pos: 0.6, color: '#e08060' },
        { pos: 1, color: '#ffb080' },
      ],
      dusk: [
        { pos: 0, color: '#202050' },
        { pos: 0.3, color: '#403060' },
        { pos: 0.6, color: '#604070' },
        { pos: 1, color: '#a06080' },
      ],
    };
    
    // Stars
    this.stars = this.generateStars(200);
    
    this.listeners = [];
  }
  
  /**
   * Generate random star positions
   */
  generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random() * 0.6,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 2 + 1,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
    return stars;
  }
  
  /**
   * Update time and celestial positions
   */
  update(deltaTime) {
    if (this.paused) return this.getState();
    
    // Advance time
    const hoursPerMs = this.timeSpeed / (60 * 60 * 1000);
    this.currentHour = (this.currentHour + deltaTime * hoursPerMs) % 24;
    
    // Update celestial bodies
    this.updateSun();
    this.updateMoon();
    
    // Update lighting
    this.updateLighting();
    
    return this.getState();
  }
  
  /**
   * Update sun position and properties
   */
  updateSun() {
    // Sun angle (0 = midnight, 0.5 = noon)
    const dayProgress = this.currentHour / 24;
    this.sun.angle = dayProgress * Math.PI * 2 - Math.PI / 2;
    
    // Elevation (-1 to 1, 0 at horizon)
    this.sun.elevation = Math.sin(this.sun.angle);
    
    // Intensity based on elevation
    this.sun.intensity = Math.max(0, this.sun.elevation);
    
    // Color shifts during sunrise/sunset
    const horizonProximity = 1 - Math.abs(this.sun.elevation);
    if (this.sun.elevation > -0.2 && this.sun.elevation < 0.3) {
      // Sunrise/sunset colors
      this.sun.color = {
        r: 255,
        g: Math.floor(200 + horizonProximity * 55),
        b: Math.floor(150 - horizonProximity * 80),
      };
    } else {
      // Normal daylight
      this.sun.color = { r: 255, g: 255, b: 220 };
    }
  }
  
  /**
   * Update moon position and phase
   */
  updateMoon() {
    // Moon is opposite to sun, roughly
    this.moon.angle = this.sun.angle + Math.PI;
    this.moon.elevation = Math.sin(this.moon.angle);
    
    // Intensity when above horizon and sun is down
    this.moon.intensity = Math.max(0, this.moon.elevation) * (1 - Math.max(0, this.sun.elevation));
    
    // Moon phase changes slowly (full cycle ~29.5 days)
    // Simulated faster for game
    this.moon.phase = (Date.now() / (1000 * 60 * 60 * 24 * 7)) % 1;
  }
  
  /**
   * Update environmental lighting
   */
  updateLighting() {
    const sunUp = this.sun.elevation > 0;
    const moonUp = this.moon.elevation > 0;
    
    if (sunUp) {
      // Daytime lighting
      const sunIntensity = Math.pow(this.sun.intensity, 0.5);
      this.lighting.intensity = 0.3 + sunIntensity * 0.7;
      this.lighting.ambient = {
        r: 0.8 + sunIntensity * 0.2,
        g: 0.85 + sunIntensity * 0.15,
        b: 0.9 + sunIntensity * 0.1,
      };
      this.lighting.shadowStrength = sunIntensity * 0.6;
    } else if (moonUp) {
      // Moonlight
      const moonIntensity = this.moon.intensity * (0.5 + this.moon.phase * 0.5);
      this.lighting.intensity = 0.1 + moonIntensity * 0.2;
      this.lighting.ambient = {
        r: 0.3 + moonIntensity * 0.2,
        g: 0.35 + moonIntensity * 0.2,
        b: 0.5 + moonIntensity * 0.3,
      };
      this.lighting.shadowStrength = moonIntensity * 0.2;
    } else {
      // Deep night
      this.lighting.intensity = 0.08;
      this.lighting.ambient = { r: 0.2, g: 0.22, b: 0.35 };
      this.lighting.shadowStrength = 0;
    }
  }
  
  /**
   * Get current time period
   */
  getTimePeriod() {
    const hour = this.currentHour;
    
    if (hour >= 5 && hour < 6) return 'dawn';
    if (hour >= 6 && hour < 8) return 'sunrise';
    if (hour >= 8 && hour < 11) return 'day';
    if (hour >= 11 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 19) return 'sunset';
    if (hour >= 19 && hour < 21) return 'dusk';
    return 'night';
  }
  
  /**
   * Get sky gradient for current time
   */
  getSkyGradient() {
    const period = this.getTimePeriod();
    return this.skyGradients[period] || this.skyGradients.day;
  }
  
  /**
   * Get star visibility
   */
  getStarVisibility() {
    // Stars visible when sun is below horizon
    return Math.max(0, -this.sun.elevation);
  }
  
  /**
   * Get fishing effects based on time
   */
  getFishingEffects() {
    const period = this.getTimePeriod();
    const effects = {
      dawn: { biteMultiplier: 1.4, rarityBonus: 0.15 },
      sunrise: { biteMultiplier: 1.2, rarityBonus: 0.1 },
      day: { biteMultiplier: 1.0, rarityBonus: 0 },
      noon: { biteMultiplier: 0.8, rarityBonus: 0 },
      afternoon: { biteMultiplier: 1.0, rarityBonus: 0 },
      sunset: { biteMultiplier: 1.5, rarityBonus: 0.2 },
      dusk: { biteMultiplier: 1.3, rarityBonus: 0.15 },
      night: { biteMultiplier: 1.1, rarityBonus: 0.25 },
    };
    return effects[period] || effects.day;
  }
  
  /**
   * Set time directly
   */
  setTime(hour) {
    this.currentHour = hour % 24;
    this.updateSun();
    this.updateMoon();
    this.updateLighting();
    this.notifyListeners('timeChange', { hour: this.currentHour, period: this.getTimePeriod() });
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      hour: this.currentHour,
      period: this.getTimePeriod(),
      sun: { ...this.sun },
      moon: { ...this.moon },
      lighting: { ...this.lighting },
      skyGradient: this.getSkyGradient(),
      starVisibility: this.getStarVisibility(),
      stars: this.stars,
    };
  }
  
  // Event system
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }
  
  notifyListeners(event, data) {
    this.listeners.forEach(l => l(event, data));
  }
}

// ========== WATER SIMULATION SYSTEM ==========

/**
 * Advanced water physics and appearance
 */
class WaterSimulation {
  constructor(config = {}) {
    this.config = {
      width: config.width || 1000,
      height: config.height || 500,
      resolution: config.resolution || 50,
      damping: config.damping || 0.98,
      tension: config.tension || 0.03,
      spread: config.spread || 0.25,
    };
    
    // Wave height field
    this.heights = [];
    this.velocities = [];
    this.initializeGrid();
    
    // Water properties
    this.properties = {
      clarity: 0.7,
      temperature: 20,
      salinity: 0,
      current: { x: 0, y: 0 },
      depth: 10,
      surfaceTension: 0.072,
      density: 1000,
    };
    
    // Active disturbances
    this.disturbances = [];
    
    // Reflections
    this.reflections = [];
    
    // Underwater visibility
    this.visibility = {
      range: 20,
      color: { r: 0.2, g: 0.4, b: 0.6 },
      caustics: true,
    };
  }
  
  /**
   * Initialize wave grid
   */
  initializeGrid() {
    const count = this.config.resolution;
    this.heights = new Array(count).fill(0);
    this.velocities = new Array(count).fill(0);
  }
  
  /**
   * Update water simulation
   */
  update(deltaTime) {
    const dt = deltaTime / 1000;
    
    // Update wave physics
    this.updateWaves(dt);
    
    // Process disturbances
    this.processDisturbances(dt);
    
    // Update current
    this.updateCurrent(dt);
    
    // Update visibility
    this.updateVisibility(dt);
    
    return this.getState();
  }
  
  /**
   * Update wave propagation
   */
  updateWaves(dt) {
    const count = this.heights.length;
    const { damping, tension, spread } = this.config;
    
    // Calculate forces
    const forces = new Array(count).fill(0);
    
    for (let i = 0; i < count; i++) {
      // Spring force (toward equilibrium)
      forces[i] = -tension * this.heights[i];
      
      // Neighbor influence
      if (i > 0) {
        forces[i] += spread * (this.heights[i - 1] - this.heights[i]);
      }
      if (i < count - 1) {
        forces[i] += spread * (this.heights[i + 1] - this.heights[i]);
      }
    }
    
    // Apply forces
    for (let i = 0; i < count; i++) {
      this.velocities[i] += forces[i] * dt * 60;
      this.velocities[i] *= damping;
      this.heights[i] += this.velocities[i] * dt * 60;
    }
    
    // Add ambient waves
    const time = Date.now() * 0.001;
    for (let i = 0; i < count; i++) {
      const x = i / count;
      const ambientWave = 
        Math.sin(time * 2 + x * 10) * 0.5 +
        Math.sin(time * 1.5 + x * 8 + 1) * 0.3 +
        Math.sin(time * 3 + x * 15 + 2) * 0.2;
      this.heights[i] += ambientWave * 0.01;
    }
  }
  
  /**
   * Add disturbance to water
   */
  addDisturbance(x, magnitude, radius = 5) {
    this.disturbances.push({
      x: x / this.config.width * this.config.resolution,
      magnitude,
      radius,
      age: 0,
    });
    
    // Immediate effect on heights
    const gridX = Math.floor(x / this.config.width * this.config.resolution);
    for (let i = Math.max(0, gridX - radius); i < Math.min(this.heights.length, gridX + radius); i++) {
      const dist = Math.abs(i - gridX);
      const factor = 1 - (dist / radius);
      this.heights[i] += magnitude * factor * factor;
      this.velocities[i] += magnitude * factor * 0.5;
    }
  }
  
  /**
   * Process active disturbances
   */
  processDisturbances(dt) {
    // Age and remove old disturbances
    this.disturbances = this.disturbances.filter(d => {
      d.age += dt;
      return d.age < 5; // Remove after 5 seconds
    });
  }
  
  /**
   * Update water current
   */
  updateCurrent(dt) {
    // Gentle current variation
    this.properties.current.x += (Math.random() - 0.5) * 0.01 * dt;
    this.properties.current.y += (Math.random() - 0.5) * 0.01 * dt;
    
    // Clamp current speed
    const maxCurrent = 2;
    const currentSpeed = Math.sqrt(
      this.properties.current.x ** 2 + 
      this.properties.current.y ** 2
    );
    if (currentSpeed > maxCurrent) {
      this.properties.current.x *= maxCurrent / currentSpeed;
      this.properties.current.y *= maxCurrent / currentSpeed;
    }
  }
  
  /**
   * Update visibility based on conditions
   */
  updateVisibility(dt) {
    // Visibility affected by disturbances (sediment)
    const disturbanceCount = this.disturbances.length;
    const sedimentFactor = Math.min(1, disturbanceCount * 0.1);
    
    this.visibility.range = this.properties.depth * this.properties.clarity * (1 - sedimentFactor * 0.5);
  }
  
  /**
   * Get water height at position
   */
  getHeightAt(x) {
    const gridX = (x / this.config.width) * this.config.resolution;
    const i = Math.floor(gridX);
    const t = gridX - i;
    
    if (i < 0) return this.heights[0] || 0;
    if (i >= this.heights.length - 1) return this.heights[this.heights.length - 1] || 0;
    
    // Linear interpolation
    return this.heights[i] * (1 - t) + this.heights[i + 1] * t;
  }
  
  /**
   * Get water normal at position (for reflections)
   */
  getNormalAt(x) {
    const dx = 1;
    const h1 = this.getHeightAt(x - dx);
    const h2 = this.getHeightAt(x + dx);
    const slope = (h2 - h1) / (dx * 2);
    
    // Return normalized normal vector
    const len = Math.sqrt(slope * slope + 1);
    return { x: -slope / len, y: 1 / len };
  }
  
  /**
   * Calculate caustics pattern
   */
  getCaustics(time) {
    const caustics = [];
    const count = 20;
    
    for (let i = 0; i < count; i++) {
      caustics.push({
        x: Math.sin(time * 0.5 + i * 0.7) * 50 + Math.sin(time * 0.3 + i * 1.2) * 30,
        y: Math.cos(time * 0.4 + i * 0.5) * 40 + Math.cos(time * 0.6 + i * 0.8) * 25,
        intensity: 0.3 + Math.sin(time * 2 + i) * 0.2,
        size: 20 + Math.sin(time + i * 0.5) * 10,
      });
    }
    
    return caustics;
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      heights: [...this.heights],
      properties: { ...this.properties },
      visibility: { ...this.visibility },
      disturbances: this.disturbances.length,
    };
  }
  
  /**
   * Apply weather effects
   */
  applyWeather(weather) {
    // Wind affects waves
    if (weather.windSpeed > 20) {
      for (let i = 0; i < this.heights.length; i++) {
        const windEffect = Math.sin(Date.now() * 0.001 * weather.windSpeed * 0.1 + i * 0.5);
        this.heights[i] += windEffect * weather.windSpeed * 0.001;
      }
    }
    
    // Rain affects clarity
    if (weather.rainIntensity > 0) {
      this.properties.clarity = Math.max(0.3, 0.7 - weather.rainIntensity * 0.3);
      
      // Rain drops create disturbances
      if (Math.random() < weather.rainIntensity * 0.1) {
        const dropX = Math.random() * this.config.width;
        this.addDisturbance(dropX, weather.rainIntensity * 2, 3);
      }
    }
  }
}

// ========== ENVIRONMENT EFFECTS SYSTEM ==========

/**
 * Manages all environmental visual effects
 */
class EnvironmentEffects {
  constructor() {
    // Particle systems
    this.particles = {
      rain: [],
      snow: [],
      leaves: [],
      bubbles: [],
      dust: [],
      fireflies: [],
    };
    
    // Effect limits
    this.limits = {
      rain: 500,
      snow: 300,
      leaves: 50,
      bubbles: 100,
      dust: 200,
      fireflies: 30,
    };
    
    // Active effects
    this.activeEffects = new Set();
  }
  
  /**
   * Update all effects
   */
  update(deltaTime, weather, dayNight) {
    // Rain particles
    if (weather.rainIntensity > 0) {
      this.updateRain(deltaTime, weather.rainIntensity, weather.windSpeed);
    }
    
    // Snow particles
    if (weather.snowIntensity > 0) {
      this.updateSnow(deltaTime, weather.snowIntensity, weather.windSpeed);
    }
    
    // Falling leaves (autumn)
    if (this.activeEffects.has('leaves')) {
      this.updateLeaves(deltaTime, weather.windSpeed);
    }
    
    // Underwater bubbles
    if (this.activeEffects.has('bubbles')) {
      this.updateBubbles(deltaTime);
    }
    
    // Fireflies (night)
    if (dayNight && dayNight.period === 'night') {
      this.updateFireflies(deltaTime);
    }
    
    return this.getState();
  }
  
  /**
   * Update rain particles
   */
  updateRain(deltaTime, intensity, windSpeed) {
    const dt = deltaTime / 16;
    const targetCount = Math.floor(intensity * this.limits.rain);
    
    // Spawn new drops
    while (this.particles.rain.length < targetCount) {
      this.particles.rain.push(this.createRaindrop(windSpeed));
    }
    
    // Update existing
    this.particles.rain = this.particles.rain.filter(drop => {
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
      drop.life -= 0.02 * dt;
      
      // Reset if off screen or dead
      if (drop.y > 1 || drop.life <= 0) {
        return Math.random() > 0.1; // 90% chance to respawn
      }
      return true;
    });
  }
  
  createRaindrop(windSpeed) {
    return {
      x: Math.random(),
      y: -Math.random() * 0.2,
      vx: windSpeed * 0.0005 + (Math.random() - 0.5) * 0.002,
      vy: 0.02 + Math.random() * 0.01,
      length: 10 + Math.random() * 20,
      opacity: 0.3 + Math.random() * 0.4,
      life: 1,
    };
  }
  
  /**
   * Update snow particles
   */
  updateSnow(deltaTime, intensity, windSpeed) {
    const dt = deltaTime / 16;
    const targetCount = Math.floor(intensity * this.limits.snow);
    
    // Spawn new flakes
    while (this.particles.snow.length < targetCount) {
      this.particles.snow.push(this.createSnowflake(windSpeed));
    }
    
    // Update existing
    this.particles.snow = this.particles.snow.filter(flake => {
      // Gentle swaying motion
      flake.x += Math.sin(flake.phase + Date.now() * 0.001) * 0.001 * dt;
      flake.x += flake.vx * dt;
      flake.y += flake.vy * dt;
      flake.rotation += flake.rotationSpeed * dt;
      flake.phase += 0.02 * dt;
      
      // Reset if off screen
      if (flake.y > 1 || flake.x < -0.1 || flake.x > 1.1) {
        return Math.random() > 0.1;
      }
      return true;
    });
  }
  
  createSnowflake(windSpeed) {
    return {
      x: Math.random(),
      y: -Math.random() * 0.1,
      vx: windSpeed * 0.0002 + (Math.random() - 0.5) * 0.001,
      vy: 0.003 + Math.random() * 0.002,
      size: 2 + Math.random() * 4,
      opacity: 0.6 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      phase: Math.random() * Math.PI * 2,
    };
  }
  
  /**
   * Update falling leaves
   */
  updateLeaves(deltaTime, windSpeed) {
    const dt = deltaTime / 16;
    
    // Spawn new leaves occasionally
    if (this.particles.leaves.length < this.limits.leaves && Math.random() < 0.02 * dt) {
      this.particles.leaves.push(this.createLeaf(windSpeed));
    }
    
    // Update existing
    this.particles.leaves = this.particles.leaves.filter(leaf => {
      // Complex tumbling motion
      leaf.x += Math.sin(leaf.phase) * 0.002 * dt + leaf.vx * dt;
      leaf.y += leaf.vy * dt;
      leaf.rotation += leaf.rotationSpeed * dt;
      leaf.phase += leaf.tumbleSpeed * dt;
      leaf.vy += 0.0001 * dt; // Gravity
      
      // Reset if off screen
      if (leaf.y > 1) {
        return Math.random() > 0.3;
      }
      return true;
    });
  }
  
  createLeaf(windSpeed) {
    const colors = ['#8B4513', '#D2691E', '#CD853F', '#A0522D', '#B8860B', '#DAA520'];
    return {
      x: Math.random(),
      y: -0.05,
      vx: windSpeed * 0.0003 + (Math.random() - 0.5) * 0.002,
      vy: 0.002 + Math.random() * 0.002,
      size: 8 + Math.random() * 12,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      phase: Math.random() * Math.PI * 2,
      tumbleSpeed: 0.05 + Math.random() * 0.05,
    };
  }
  
  /**
   * Update bubbles
   */
  updateBubbles(deltaTime) {
    const dt = deltaTime / 16;
    
    // Spawn new bubbles
    if (this.particles.bubbles.length < this.limits.bubbles && Math.random() < 0.1 * dt) {
      this.particles.bubbles.push(this.createBubble());
    }
    
    // Update existing
    this.particles.bubbles = this.particles.bubbles.filter(bubble => {
      bubble.x += Math.sin(bubble.phase) * 0.001 * dt;
      bubble.y -= bubble.vy * dt;
      bubble.phase += 0.1 * dt;
      bubble.size *= 1 + 0.001 * dt; // Grow slightly
      
      // Pop at surface or grow too big
      if (bubble.y < 0.3 || bubble.size > 15) {
        return false;
      }
      return true;
    });
  }
  
  createBubble() {
    return {
      x: 0.3 + Math.random() * 0.4,
      y: 0.9 + Math.random() * 0.1,
      vy: 0.002 + Math.random() * 0.003,
      size: 2 + Math.random() * 5,
      opacity: 0.3 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    };
  }
  
  /**
   * Update fireflies
   */
  updateFireflies(deltaTime) {
    const dt = deltaTime / 16;
    
    // Spawn new fireflies
    if (this.particles.fireflies.length < this.limits.fireflies && Math.random() < 0.05 * dt) {
      this.particles.fireflies.push(this.createFirefly());
    }
    
    // Update existing
    this.particles.fireflies = this.particles.fireflies.filter(fly => {
      // Random wandering motion
      fly.vx += (Math.random() - 0.5) * 0.0005 * dt;
      fly.vy += (Math.random() - 0.5) * 0.0005 * dt;
      
      // Limit speed
      fly.vx = Math.max(-0.002, Math.min(0.002, fly.vx));
      fly.vy = Math.max(-0.002, Math.min(0.002, fly.vy));
      
      fly.x += fly.vx * dt;
      fly.y += fly.vy * dt;
      
      // Glow pulsing
      fly.glowPhase += fly.glowSpeed * dt;
      fly.glow = 0.3 + Math.sin(fly.glowPhase) * 0.7;
      
      fly.life -= 0.0001 * dt;
      
      // Boundaries
      if (fly.x < 0 || fly.x > 1 || fly.y < 0.3 || fly.y > 0.8 || fly.life <= 0) {
        return Math.random() > 0.2;
      }
      return true;
    });
  }
  
  createFirefly() {
    return {
      x: Math.random(),
      y: 0.4 + Math.random() * 0.3,
      vx: (Math.random() - 0.5) * 0.001,
      vy: (Math.random() - 0.5) * 0.001,
      size: 3 + Math.random() * 2,
      glow: Math.random(),
      glowPhase: Math.random() * Math.PI * 2,
      glowSpeed: 0.1 + Math.random() * 0.1,
      color: Math.random() > 0.5 ? '#FFFF00' : '#00FF00',
      life: 1,
    };
  }
  
  /**
   * Enable/disable effect
   */
  setEffect(name, enabled) {
    if (enabled) {
      this.activeEffects.add(name);
    } else {
      this.activeEffects.delete(name);
      this.particles[name] = [];
    }
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      rain: [...this.particles.rain],
      snow: [...this.particles.snow],
      leaves: [...this.particles.leaves],
      bubbles: [...this.particles.bubbles],
      fireflies: [...this.particles.fireflies],
    };
  }
}

// ========== EXPORTS ==========

export {
  WeatherSystem,
  DayNightCycle,
  WaterSimulation,
  EnvironmentEffects,
};

export default {
  WeatherSystem,
  DayNightCycle,
  WaterSimulation,
  EnvironmentEffects,
};
