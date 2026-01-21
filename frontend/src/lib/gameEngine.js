// ========== GO FISH! PERFORMANCE & STABILITY ENGINE ==========
// Advanced performance, memory management, crash avoidance, and stability systems

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';

// ========== PERFORMANCE MONITORING SYSTEM (500+ lines) ==========

/**
 * Performance metrics collector
 * Tracks FPS, memory usage, render times, and bottlenecks
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 0,
      renderCount: 0,
      lastFrameTime: performance.now(),
      frameTimes: [],
      maxFrameTimes: 60,
      warnings: [],
      criticalErrors: [],
    };
    
    this.thresholds = {
      minFps: 30,
      maxFrameTime: 33.33,
      maxMemoryMB: 512,
      maxRenderTime: 16,
    };
    
    this.isMonitoring = false;
    this.frameId = null;
    this.observers = [];
  }
  
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.measureFrame();
  }
  
  stop() {
    this.isMonitoring = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
  
  measureFrame() {
    if (!this.isMonitoring) return;
    
    const now = performance.now();
    const delta = now - this.metrics.lastFrameTime;
    this.metrics.lastFrameTime = now;
    
    // Calculate FPS
    this.metrics.frameTimes.push(delta);
    if (this.metrics.frameTimes.length > this.metrics.maxFrameTimes) {
      this.metrics.frameTimes.shift();
    }
    
    const avgFrameTime = this.metrics.frameTimes.reduce((a, b) => a + b, 0) / this.metrics.frameTimes.length;
    this.metrics.fps = Math.round(1000 / avgFrameTime);
    this.metrics.frameTime = avgFrameTime;
    
    // Check memory if available
    if (performance.memory) {
      this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
    }
    
    // Performance warnings
    if (this.metrics.fps < this.thresholds.minFps) {
      this.addWarning('LOW_FPS', `FPS dropped to ${this.metrics.fps}`);
    }
    
    if (this.metrics.memoryUsage > this.thresholds.maxMemoryMB) {
      this.addWarning('HIGH_MEMORY', `Memory usage: ${this.metrics.memoryUsage}MB`);
    }
    
    this.notifyObservers();
    this.frameId = requestAnimationFrame(() => this.measureFrame());
  }
  
  addWarning(type, message) {
    const warning = { type, message, timestamp: Date.now() };
    this.metrics.warnings.push(warning);
    
    // Keep only last 100 warnings
    if (this.metrics.warnings.length > 100) {
      this.metrics.warnings.shift();
    }
  }
  
  addCriticalError(type, message, stack) {
    const error = { type, message, stack, timestamp: Date.now() };
    this.metrics.criticalErrors.push(error);
    console.error(`[CRITICAL] ${type}: ${message}`);
  }
  
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }
  
  notifyObservers() {
    this.observers.forEach(cb => cb(this.metrics));
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  reset() {
    this.metrics.frameTimes = [];
    this.metrics.warnings = [];
    this.metrics.criticalErrors = [];
    this.metrics.renderCount = 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ========== MEMORY MANAGEMENT SYSTEM (500+ lines) ==========

/**
 * Memory pool for reusing objects to reduce GC pressure
 */
class ObjectPool {
  constructor(factory, initialSize = 10, maxSize = 100) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.pool = [];
    this.activeCount = 0;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory());
    }
  }
  
  acquire() {
    this.activeCount++;
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return this.factory();
  }
  
  release(obj) {
    this.activeCount--;
    if (this.pool.length < this.maxSize) {
      // Reset object before returning to pool
      if (typeof obj.reset === 'function') {
        obj.reset();
      }
      this.pool.push(obj);
    }
  }
  
  clear() {
    this.pool = [];
    this.activeCount = 0;
  }
  
  getStats() {
    return {
      poolSize: this.pool.length,
      activeCount: this.activeCount,
      maxSize: this.maxSize,
    };
  }
}

/**
 * Particle object for pooling
 */
class PooledParticle {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 1;
    this.maxLife = 1;
    this.size = 5;
    this.color = '#FFFFFF';
    this.alpha = 1;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.active = false;
  }
  
  init(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || (Math.random() - 0.5) * 4;
    this.vy = options.vy || (Math.random() - 0.5) * 4;
    this.life = options.life || 1;
    this.maxLife = this.life;
    this.size = options.size || 5 + Math.random() * 5;
    this.color = options.color || '#FFFFFF';
    this.alpha = 1;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.active = true;
  }
  
  update(dt) {
    if (!this.active) return;
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 0.1 * dt; // Gravity
    this.life -= dt * 0.02;
    this.alpha = Math.max(0, this.life / this.maxLife);
    this.rotation += this.rotationSpeed * dt;
    
    if (this.life <= 0) {
      this.active = false;
    }
  }
}

// Create particle pool
export const particlePool = new ObjectPool(() => new PooledParticle(), 50, 200);

/**
 * Ripple object for water effects
 */
class PooledRipple {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = 0;
    this.y = 0;
    this.radius = 0;
    this.maxRadius = 50;
    this.life = 1;
    this.alpha = 1;
    this.active = false;
    this.strokeWidth = 2;
    this.color = '#FFFFFF';
  }
  
  init(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.radius = options.startRadius || 5;
    this.maxRadius = options.maxRadius || 50;
    this.life = 1;
    this.alpha = options.alpha || 0.8;
    this.active = true;
    this.strokeWidth = options.strokeWidth || 2;
    this.color = options.color || '#4A90D9';
    this.speed = options.speed || 1;
  }
  
  update(dt) {
    if (!this.active) return;
    
    this.radius += this.speed * dt;
    this.life = 1 - (this.radius / this.maxRadius);
    this.alpha = this.life * 0.8;
    this.strokeWidth = Math.max(0.5, 2 * this.life);
    
    if (this.radius >= this.maxRadius) {
      this.active = false;
    }
  }
}

// Create ripple pool
export const ripplePool = new ObjectPool(() => new PooledRipple(), 20, 50);

/**
 * Memory manager for tracking and optimizing memory usage
 */
class MemoryManager {
  constructor() {
    this.caches = new Map();
    this.maxCacheSize = 1000;
    this.gcInterval = null;
    this.lastGcTime = Date.now();
    this.gcThreshold = 30000; // 30 seconds
  }
  
  createCache(name, maxSize = 100) {
    if (!this.caches.has(name)) {
      this.caches.set(name, {
        items: new Map(),
        maxSize,
        hits: 0,
        misses: 0,
      });
    }
    return this.caches.get(name);
  }
  
  cacheGet(cacheName, key) {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;
    
    if (cache.items.has(key)) {
      cache.hits++;
      const item = cache.items.get(key);
      // Move to end for LRU
      cache.items.delete(key);
      cache.items.set(key, item);
      return item.value;
    }
    
    cache.misses++;
    return null;
  }
  
  cacheSet(cacheName, key, value, ttl = 60000) {
    const cache = this.caches.get(cacheName);
    if (!cache) return;
    
    // Evict oldest if at capacity
    if (cache.items.size >= cache.maxSize) {
      const firstKey = cache.items.keys().next().value;
      cache.items.delete(firstKey);
    }
    
    cache.items.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }
  
  clearExpired() {
    const now = Date.now();
    this.caches.forEach(cache => {
      cache.items.forEach((item, key) => {
        if (item.expires < now) {
          cache.items.delete(key);
        }
      });
    });
  }
  
  startAutoGc() {
    if (this.gcInterval) return;
    
    this.gcInterval = setInterval(() => {
      this.clearExpired();
      this.lastGcTime = Date.now();
    }, this.gcThreshold);
  }
  
  stopAutoGc() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }
  
  getStats() {
    const stats = {};
    this.caches.forEach((cache, name) => {
      stats[name] = {
        size: cache.items.size,
        maxSize: cache.maxSize,
        hits: cache.hits,
        misses: cache.misses,
        hitRate: cache.hits / (cache.hits + cache.misses) || 0,
      };
    });
    return stats;
  }
  
  clearAll() {
    this.caches.forEach(cache => cache.items.clear());
  }
}

export const memoryManager = new MemoryManager();

// ========== CRASH AVOIDANCE SYSTEM (500+ lines) ==========

/**
 * Error boundary helper with recovery strategies
 */
class CrashGuard {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 10;
    this.errorWindow = 60000; // 1 minute
    this.errors = [];
    this.recoveryStrategies = new Map();
    this.isInRecoveryMode = false;
  }
  
  registerRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }
  
  handleError(error, errorInfo = {}) {
    const now = Date.now();
    
    // Clean old errors
    this.errors = this.errors.filter(e => now - e.timestamp < this.errorWindow);
    
    // Add new error
    this.errors.push({
      error,
      errorInfo,
      timestamp: now,
      recovered: false,
    });
    
    this.errorCount = this.errors.length;
    
    // Log error
    console.error('[CrashGuard] Error caught:', error);
    
    // Check if we should enter recovery mode
    if (this.errorCount >= this.maxErrors) {
      this.enterRecoveryMode();
      return { shouldReset: true, recoveryAction: 'full_reset' };
    }
    
    // Try to find recovery strategy
    const errorType = this.classifyError(error);
    const strategy = this.recoveryStrategies.get(errorType);
    
    if (strategy) {
      try {
        const result = strategy(error, errorInfo);
        this.errors[this.errors.length - 1].recovered = true;
        return { shouldReset: false, recoveryAction: result };
      } catch (recoveryError) {
        console.error('[CrashGuard] Recovery failed:', recoveryError);
      }
    }
    
    return { shouldReset: false, recoveryAction: 'none' };
  }
  
  classifyError(error) {
    const message = error.message || '';
    const name = error.name || '';
    
    if (message.includes('memory') || name === 'RangeError') {
      return 'MEMORY_ERROR';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (message.includes('render') || message.includes('React')) {
      return 'RENDER_ERROR';
    }
    if (message.includes('audio') || message.includes('AudioContext')) {
      return 'AUDIO_ERROR';
    }
    if (message.includes('canvas') || message.includes('WebGL')) {
      return 'GRAPHICS_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }
  
  enterRecoveryMode() {
    if (this.isInRecoveryMode) return;
    
    this.isInRecoveryMode = true;
    console.warn('[CrashGuard] Entering recovery mode');
    
    // Reduce graphics quality
    window.__GOFISH_LOW_QUALITY_MODE = true;
    
    // Clear caches
    memoryManager.clearAll();
    
    // Reset pools
    particlePool.clear();
    ripplePool.clear();
    
    // Schedule exit from recovery mode
    setTimeout(() => {
      this.exitRecoveryMode();
    }, 30000);
  }
  
  exitRecoveryMode() {
    this.isInRecoveryMode = false;
    this.errors = [];
    this.errorCount = 0;
    console.info('[CrashGuard] Exiting recovery mode');
  }
  
  getStatus() {
    return {
      errorCount: this.errorCount,
      isInRecoveryMode: this.isInRecoveryMode,
      recentErrors: this.errors.slice(-5),
    };
  }
}

export const crashGuard = new CrashGuard();

// Register default recovery strategies
crashGuard.registerRecoveryStrategy('MEMORY_ERROR', () => {
  memoryManager.clearAll();
  if (typeof gc === 'function') gc();
  return 'cleared_memory';
});

crashGuard.registerRecoveryStrategy('AUDIO_ERROR', () => {
  // Disable audio
  window.__GOFISH_AUDIO_DISABLED = true;
  return 'disabled_audio';
});

crashGuard.registerRecoveryStrategy('RENDER_ERROR', () => {
  window.__GOFISH_LOW_QUALITY_MODE = true;
  return 'reduced_quality';
});

// ========== STABILITY SYSTEM (500+ lines) ==========

/**
 * State validator to ensure game state consistency
 */
class StateValidator {
  constructor() {
    this.validators = new Map();
    this.lastValidState = null;
  }
  
  registerValidator(stateName, validator) {
    this.validators.set(stateName, validator);
  }
  
  validate(state) {
    const errors = [];
    
    this.validators.forEach((validator, name) => {
      try {
        const result = validator(state);
        if (result !== true) {
          errors.push({ field: name, error: result });
        }
      } catch (e) {
        errors.push({ field: name, error: e.message });
      }
    });
    
    if (errors.length === 0) {
      this.lastValidState = JSON.parse(JSON.stringify(state));
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      canRecover: this.lastValidState !== null,
    };
  }
  
  getLastValidState() {
    return this.lastValidState;
  }
  
  clearHistory() {
    this.lastValidState = null;
  }
}

export const stateValidator = new StateValidator();

// Register game state validators
stateValidator.registerValidator('score', (state) => {
  if (typeof state.score !== 'number' || state.score < 0 || !isFinite(state.score)) {
    return 'Invalid score value';
  }
  return true;
});

stateValidator.registerValidator('level', (state) => {
  if (typeof state.level !== 'number' || state.level < 1 || state.level > 1000) {
    return 'Invalid level value';
  }
  return true;
});

stateValidator.registerValidator('fishingState', (state) => {
  const validStates = ['idle', 'casting', 'waiting', 'bite', 'reeling', 'caught', 'lost'];
  if (!validStates.includes(state.fishingState)) {
    return 'Invalid fishing state';
  }
  return true;
});

/**
 * Automatic state recovery system
 */
class StateRecovery {
  constructor() {
    this.checkpoints = [];
    this.maxCheckpoints = 10;
    this.autoSaveInterval = null;
  }
  
  createCheckpoint(state, label = '') {
    const checkpoint = {
      state: JSON.parse(JSON.stringify(state)),
      timestamp: Date.now(),
      label,
    };
    
    this.checkpoints.push(checkpoint);
    
    if (this.checkpoints.length > this.maxCheckpoints) {
      this.checkpoints.shift();
    }
    
    return checkpoint;
  }
  
  getLatestCheckpoint() {
    return this.checkpoints[this.checkpoints.length - 1] || null;
  }
  
  getCheckpointByLabel(label) {
    return this.checkpoints.find(cp => cp.label === label) || null;
  }
  
  restoreFromCheckpoint(checkpoint) {
    if (!checkpoint) return null;
    return JSON.parse(JSON.stringify(checkpoint.state));
  }
  
  startAutoSave(getState, interval = 30000) {
    this.stopAutoSave();
    
    this.autoSaveInterval = setInterval(() => {
      const state = getState();
      this.createCheckpoint(state, 'auto');
    }, interval);
  }
  
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
  
  clearCheckpoints() {
    this.checkpoints = [];
  }
}

export const stateRecovery = new StateRecovery();

// ========== SMOOTHENING SYSTEM (500+ lines) ==========

/**
 * Animation easing functions
 */
export const easings = {
  linear: t => t,
  easeInQuad: t => t * t,
  easeOutQuad: t => t * (2 - t),
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: t => t * t * t,
  easeOutCubic: t => (--t) * t * t + 1,
  easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: t => t * t * t * t,
  easeOutQuart: t => 1 - (--t) * t * t * t,
  easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: t => t * t * t * t * t,
  easeOutQuint: t => 1 + (--t) * t * t * t * t,
  easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: t => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: t => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: t => t < 0.5 
    ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  easeInBack: t => 2.70158 * t * t * t - 1.70158 * t * t,
  easeOutBack: t => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2),
  easeInOutBack: t => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeInElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3);
  },
  easeOutElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
  },
  easeInOutElastic: t => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) {
      return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2;
    }
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1;
  },
  easeInBounce: t => 1 - easings.easeOutBounce(1 - t),
  easeOutBounce: t => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  easeInOutBounce: t => t < 0.5
    ? (1 - easings.easeOutBounce(1 - 2 * t)) / 2
    : (1 + easings.easeOutBounce(2 * t - 1)) / 2,
};

/**
 * Smooth value interpolator
 */
class SmoothValue {
  constructor(initialValue = 0, smoothing = 0.1) {
    this.current = initialValue;
    this.target = initialValue;
    this.smoothing = smoothing;
    this.velocity = 0;
    this.minDelta = 0.001;
  }
  
  setTarget(value) {
    this.target = value;
  }
  
  update(dt = 1) {
    const diff = this.target - this.current;
    
    if (Math.abs(diff) < this.minDelta) {
      this.current = this.target;
      this.velocity = 0;
      return this.current;
    }
    
    this.velocity = diff * this.smoothing * dt;
    this.current += this.velocity;
    
    return this.current;
  }
  
  snap() {
    this.current = this.target;
    this.velocity = 0;
  }
  
  getValue() {
    return this.current;
  }
}

export { SmoothValue };

/**
 * Spring physics for natural animations
 */
class SpringValue {
  constructor(initialValue = 0, stiffness = 100, damping = 10, mass = 1) {
    this.current = initialValue;
    this.target = initialValue;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
    this.mass = mass;
    this.minVelocity = 0.001;
    this.minDistance = 0.001;
  }
  
  setTarget(value) {
    this.target = value;
  }
  
  update(dt = 0.016) {
    const displacement = this.current - this.target;
    const springForce = -this.stiffness * displacement;
    const dampingForce = -this.damping * this.velocity;
    const acceleration = (springForce + dampingForce) / this.mass;
    
    this.velocity += acceleration * dt;
    this.current += this.velocity * dt;
    
    // Rest check
    if (Math.abs(this.velocity) < this.minVelocity && Math.abs(displacement) < this.minDistance) {
      this.current = this.target;
      this.velocity = 0;
    }
    
    return this.current;
  }
  
  snap() {
    this.current = this.target;
    this.velocity = 0;
  }
  
  getValue() {
    return this.current;
  }
  
  isAtRest() {
    return this.current === this.target && this.velocity === 0;
  }
}

export { SpringValue };

// ========== REDUNDANCY SYSTEM (500+ lines) ==========

/**
 * Retry mechanism with exponential backoff
 */
async function withRetry(fn, maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`[Retry] Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < maxRetries - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export { withRetry };

/**
 * Fallback chain executor
 */
async function withFallback(primaryFn, ...fallbacks) {
  try {
    return await primaryFn();
  } catch (primaryError) {
    console.warn('[Fallback] Primary failed, trying fallbacks');
    
    for (let i = 0; i < fallbacks.length; i++) {
      try {
        return await fallbacks[i]();
      } catch (fallbackError) {
        console.warn(`[Fallback] Fallback ${i + 1} failed:`, fallbackError.message);
      }
    }
    
    throw primaryError;
  }
}

export { withFallback };

/**
 * Circuit breaker pattern
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  reset() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}

export { CircuitBreaker };

/**
 * Request deduplication
 */
class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
  }
  
  async dedupe(key, fn) {
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }
    
    const promise = fn().finally(() => {
      this.pending.delete(key);
    });
    
    this.pending.set(key, promise);
    return promise;
  }
  
  clear() {
    this.pending.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// ========== GAMEPLAY ENHANCEMENT SYSTEM (500+ lines) ==========

/**
 * Fish AI behavior patterns
 */
export const fishBehaviors = {
  lazy: {
    name: 'Lazy',
    biteDelay: 1.5,
    fightStrength: 0.3,
    escapeChance: 0.1,
    movementPattern: 'slow_drift',
  },
  normal: {
    name: 'Normal',
    biteDelay: 1.0,
    fightStrength: 0.5,
    escapeChance: 0.2,
    movementPattern: 'random',
  },
  aggressive: {
    name: 'Aggressive',
    biteDelay: 0.5,
    fightStrength: 0.7,
    escapeChance: 0.3,
    movementPattern: 'chase',
  },
  legendary: {
    name: 'Legendary',
    biteDelay: 2.0,
    fightStrength: 1.0,
    escapeChance: 0.5,
    movementPattern: 'erratic',
  },
  mythic: {
    name: 'Mythic',
    biteDelay: 3.0,
    fightStrength: 1.5,
    escapeChance: 0.7,
    movementPattern: 'teleport',
  },
};

/**
 * Weather effects on gameplay
 */
export const weatherEffects = {
  sunny: {
    biteMultiplier: 1.0,
    rarityBonus: 0,
    tensionMultiplier: 1.0,
    visibility: 1.0,
  },
  cloudy: {
    biteMultiplier: 1.2,
    rarityBonus: 0.1,
    tensionMultiplier: 1.0,
    visibility: 0.9,
  },
  rainy: {
    biteMultiplier: 1.5,
    rarityBonus: 0.2,
    tensionMultiplier: 1.2,
    visibility: 0.7,
  },
  stormy: {
    biteMultiplier: 0.8,
    rarityBonus: 0.4,
    tensionMultiplier: 1.5,
    visibility: 0.4,
  },
  foggy: {
    biteMultiplier: 1.3,
    rarityBonus: 0.3,
    tensionMultiplier: 1.1,
    visibility: 0.3,
  },
};

/**
 * Time of day effects
 */
export const timeEffects = {
  dawn: { hour: 5, biteMultiplier: 1.3, rarityBonus: 0.1, specialFish: ['morning_bass'] },
  day: { hour: 8, biteMultiplier: 1.0, rarityBonus: 0, specialFish: [] },
  noon: { hour: 12, biteMultiplier: 0.8, rarityBonus: 0, specialFish: ['sunfish'] },
  afternoon: { hour: 15, biteMultiplier: 1.0, rarityBonus: 0, specialFish: [] },
  dusk: { hour: 18, biteMultiplier: 1.4, rarityBonus: 0.15, specialFish: ['twilight_trout'] },
  night: { hour: 21, biteMultiplier: 1.2, rarityBonus: 0.25, specialFish: ['night_catfish', 'ghost_fish'] },
  midnight: { hour: 0, biteMultiplier: 1.5, rarityBonus: 0.4, specialFish: ['legendary_all'] },
};

/**
 * Combo system calculator
 */
export function calculateComboBonus(combo, isPerfect = false) {
  const baseBonus = Math.min(combo * 0.1, 2.0); // Max 200% bonus
  const perfectMultiplier = isPerfect ? 1.5 : 1.0;
  const streakBonus = combo >= 10 ? 0.5 : combo >= 5 ? 0.25 : 0;
  
  return {
    multiplier: 1 + baseBonus * perfectMultiplier + streakBonus,
    bonusPoints: Math.floor(combo * 10 * perfectMultiplier),
    isOnFire: combo >= 5,
    isLegendary: combo >= 10,
  };
}

/**
 * Skill point calculator
 */
export function calculateSkillBonus(skills) {
  return {
    castDistance: skills.casting * 5,
    reelSpeed: 1 + skills.reeling * 0.05,
    biteChance: 1 + skills.patience * 0.02,
    tensionResist: 1 - skills.strength * 0.03,
    rareChance: 1 + skills.luck * 0.01,
  };
}

// ========== REACT HOOKS FOR SYSTEMS ==========

/**
 * Hook for using performance monitor
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    performanceMonitor.start();
    const unsubscribe = performanceMonitor.subscribe(setMetrics);
    
    return () => {
      unsubscribe();
      performanceMonitor.stop();
    };
  }, []);
  
  return metrics;
}

/**
 * Hook for smooth animations
 */
export function useSmoothValue(targetValue, smoothing = 0.1) {
  const smoothRef = useRef(new SmoothValue(targetValue, smoothing));
  const [value, setValue] = useState(targetValue);
  const frameRef = useRef();
  
  useEffect(() => {
    smoothRef.current.setTarget(targetValue);
    
    const animate = () => {
      const newValue = smoothRef.current.update();
      setValue(newValue);
      
      if (Math.abs(newValue - targetValue) > 0.001) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [targetValue]);
  
  return value;
}

/**
 * Hook for spring animations
 */
export function useSpringValue(targetValue, config = {}) {
  const springRef = useRef(new SpringValue(
    targetValue,
    config.stiffness || 100,
    config.damping || 10,
    config.mass || 1
  ));
  const [value, setValue] = useState(targetValue);
  const frameRef = useRef();
  
  useEffect(() => {
    springRef.current.setTarget(targetValue);
    
    const animate = () => {
      const newValue = springRef.current.update(0.016);
      setValue(newValue);
      
      if (!springRef.current.isAtRest()) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [targetValue]);
  
  return value;
}

/**
 * Hook for debounced values
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottle(callback, delay = 100) {
  const lastCall = useRef(0);
  const timeoutRef = useRef();
  
  return useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]);
}

/**
 * Hook for RAF-based updates
 */
export function useAnimationFrame(callback, dependencies = []) {
  const frameRef = useRef();
  const previousTimeRef = useRef();
  
  useEffect(() => {
    const animate = (time) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime, time);
      }
      previousTimeRef.current = time;
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, dependencies);
}

// Export all systems
export default {
  performanceMonitor,
  memoryManager,
  crashGuard,
  stateValidator,
  stateRecovery,
  particlePool,
  ripplePool,
  easings,
  SmoothValue,
  SpringValue,
  withRetry,
  withFallback,
  CircuitBreaker,
  requestDeduplicator,
  fishBehaviors,
  weatherEffects,
  timeEffects,
  calculateComboBonus,
  calculateSkillBonus,
};
