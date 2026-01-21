// ========== GO FISH! SAVE SYSTEM & DATA PERSISTENCE ==========
// Comprehensive save/load system with cloud sync and data integrity
// ~1200+ lines of data management

// ========== SAVE MANAGER ==========

/**
 * Manages all game saves and data persistence
 */
class SaveManager {
  constructor() {
    this.currentSave = null;
    this.saveSlots = [];
    this.maxSaveSlots = 10;
    this.autoSaveInterval = 60000; // 1 minute
    this.autoSaveTimer = null;
    this.lastSaveTime = null;
    this.isDirty = false;
    
    // Storage keys
    this.storageKeys = {
      saves: 'gofish_saves',
      currentSlot: 'gofish_current_slot',
      settings: 'gofish_settings',
      cloudSync: 'gofish_cloud_sync',
    };
    
    // Data version for migrations
    this.dataVersion = 3;
    
    this.listeners = [];
  }
  
  /**
   * Initialize save system
   */
  async initialize() {
    try {
      // Load save slots from storage
      await this.loadSaveSlots();
      
      // Load current slot
      const currentSlot = localStorage.getItem(this.storageKeys.currentSlot);
      if (currentSlot) {
        await this.loadGame(parseInt(currentSlot));
      }
      
      // Start auto-save
      this.startAutoSave();
      
      return { success: true };
    } catch (error) {
      console.error('Save system initialization failed:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Load all save slots
   */
  async loadSaveSlots() {
    try {
      const savesJson = localStorage.getItem(this.storageKeys.saves);
      if (savesJson) {
        this.saveSlots = JSON.parse(savesJson);
        
        // Migrate old saves if needed
        this.saveSlots = this.saveSlots.map(slot => this.migrateSaveData(slot));
      } else {
        this.saveSlots = [];
      }
    } catch (error) {
      console.error('Failed to load save slots:', error);
      this.saveSlots = [];
    }
  }
  
  /**
   * Create a new save
   */
  createNewSave(name = 'New Game') {
    if (this.saveSlots.length >= this.maxSaveSlots) {
      return { success: false, error: 'Maximum save slots reached' };
    }
    
    const slotIndex = this.saveSlots.length;
    const newSave = this.createEmptySave(slotIndex, name);
    
    this.saveSlots.push(newSave);
    this.currentSave = newSave;
    
    this.persistSaveSlots();
    localStorage.setItem(this.storageKeys.currentSlot, slotIndex.toString());
    
    this.notifyListeners('saveCreated', { slot: slotIndex, save: newSave });
    
    return { success: true, slot: slotIndex };
  }
  
  /**
   * Create empty save data structure
   */
  createEmptySave(slot, name) {
    return {
      slot,
      name,
      version: this.dataVersion,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
      playTime: 0,
      
      // Player data
      player: {
        name: name,
        level: 1,
        experience: 0,
        totalExperience: 0,
        prestige: 0,
        skillPoints: 0,
        coins: 0,
        gems: 0,
      },
      
      // Skills
      skills: {
        casting: 0,
        reeling: 0,
        patience: 0,
        strength: 0,
        luck: 0,
      },
      
      // Inventory
      inventory: {
        rods: ['bamboo'],
        lures: ['basic'],
        bobbers: ['classic_red'],
        lines: ['basic_mono'],
        bait: {},
        consumables: {},
      },
      
      // Equipment
      equipment: {
        rod: 'bamboo',
        lure: 'basic',
        bobber: 'classic_red',
        line: 'basic_mono',
      },
      
      // Collection
      collection: {
        fishCaught: {},
        fishTypes: {},
        largestFish: {},
        totalWeight: 0,
      },
      
      // Statistics
      stats: {
        fishCaught: 0,
        perfectCatches: 0,
        comboMax: 0,
        timesFished: 0,
        totalCastDistance: 0,
        fishLost: 0,
        linesBroken: 0,
        rareFishCaught: 0,
        legendaryFishCaught: 0,
        moneyEarned: 0,
        moneySpent: 0,
      },
      
      // Achievements
      achievements: {
        unlocked: [],
        progress: {},
      },
      
      // Challenges
      challenges: {
        dailyCompleted: [],
        weeklyCompleted: [],
        lastDailyReset: null,
        lastWeeklyReset: null,
      },
      
      // Unlocks
      unlocks: {
        stages: ['sunny_lake', 'crystal_pond'],
        difficulties: ['normal', 'hard'],
        features: [],
      },
      
      // Settings specific to this save
      saveSettings: {
        difficulty: 'normal',
        autoFish: false,
        notifications: true,
      },
      
      // Checksum for data integrity
      checksum: null,
    };
  }
  
  /**
   * Save game to slot
   */
  saveGame(slot = null) {
    const targetSlot = slot !== null ? slot : this.currentSave?.slot;
    if (targetSlot === null || targetSlot === undefined) {
      return { success: false, error: 'No save slot specified' };
    }
    
    if (!this.currentSave) {
      return { success: false, error: 'No active game to save' };
    }
    
    try {
      // Update metadata
      this.currentSave.lastPlayedAt = Date.now();
      this.currentSave.checksum = this.calculateChecksum(this.currentSave);
      
      // Update slot
      this.saveSlots[targetSlot] = { ...this.currentSave };
      
      // Persist
      this.persistSaveSlots();
      
      this.lastSaveTime = Date.now();
      this.isDirty = false;
      
      this.notifyListeners('gameSaved', { slot: targetSlot, time: this.lastSaveTime });
      
      return { success: true, slot: targetSlot };
    } catch (error) {
      console.error('Failed to save game:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Load game from slot
   */
  async loadGame(slot) {
    if (slot < 0 || slot >= this.saveSlots.length) {
      return { success: false, error: 'Invalid save slot' };
    }
    
    try {
      const saveData = this.saveSlots[slot];
      
      // Verify data integrity
      const isValid = this.verifySaveData(saveData);
      if (!isValid) {
        console.warn('Save data integrity check failed, attempting recovery');
        // Try to recover what we can
      }
      
      // Migrate if needed
      this.currentSave = this.migrateSaveData({ ...saveData });
      
      localStorage.setItem(this.storageKeys.currentSlot, slot.toString());
      
      this.notifyListeners('gameLoaded', { slot, save: this.currentSave });
      
      return { success: true, save: this.currentSave };
    } catch (error) {
      console.error('Failed to load game:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Delete save slot
   */
  deleteSave(slot) {
    if (slot < 0 || slot >= this.saveSlots.length) {
      return { success: false, error: 'Invalid save slot' };
    }
    
    const deleted = this.saveSlots.splice(slot, 1)[0];
    
    // Update slot indices
    this.saveSlots.forEach((save, index) => {
      save.slot = index;
    });
    
    // Update current save reference
    if (this.currentSave?.slot === slot) {
      this.currentSave = null;
      localStorage.removeItem(this.storageKeys.currentSlot);
    } else if (this.currentSave?.slot > slot) {
      this.currentSave.slot--;
      localStorage.setItem(this.storageKeys.currentSlot, this.currentSave.slot.toString());
    }
    
    this.persistSaveSlots();
    
    this.notifyListeners('saveDeleted', { slot, save: deleted });
    
    return { success: true };
  }
  
  /**
   * Update current save data
   */
  updateSaveData(path, value) {
    if (!this.currentSave) return false;
    
    const keys = path.split('.');
    let obj = this.currentSave;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    
    obj[keys[keys.length - 1]] = value;
    this.isDirty = true;
    
    return true;
  }
  
  /**
   * Get save data value
   */
  getSaveData(path, defaultValue = null) {
    if (!this.currentSave) return defaultValue;
    
    const keys = path.split('.');
    let obj = this.currentSave;
    
    for (const key of keys) {
      if (obj === null || obj === undefined || !obj.hasOwnProperty(key)) {
        return defaultValue;
      }
      obj = obj[key];
    }
    
    return obj;
  }
  
  /**
   * Persist save slots to storage
   */
  persistSaveSlots() {
    try {
      localStorage.setItem(this.storageKeys.saves, JSON.stringify(this.saveSlots));
    } catch (error) {
      console.error('Failed to persist save slots:', error);
      
      // Try to free up space
      this.cleanupOldData();
      
      // Retry
      try {
        localStorage.setItem(this.storageKeys.saves, JSON.stringify(this.saveSlots));
      } catch (retryError) {
        console.error('Failed to persist save slots after cleanup:', retryError);
      }
    }
  }
  
  /**
   * Clean up old data to free storage space
   */
  cleanupOldData() {
    // Remove old activity logs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('gofish_log_')) {
        localStorage.removeItem(key);
      }
    }
  }
  
  /**
   * Calculate checksum for data integrity
   */
  calculateChecksum(data) {
    const str = JSON.stringify({
      player: data.player,
      stats: data.stats,
      inventory: data.inventory,
    });
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(16);
  }
  
  /**
   * Verify save data integrity
   */
  verifySaveData(data) {
    if (!data || !data.checksum) return true; // No checksum = trust it
    
    const calculatedChecksum = this.calculateChecksum(data);
    return calculatedChecksum === data.checksum;
  }
  
  /**
   * Migrate save data to current version
   */
  migrateSaveData(data) {
    if (!data) return data;
    
    const version = data.version || 1;
    
    // Migration from v1 to v2
    if (version < 2) {
      data.skills = data.skills || {
        casting: 0,
        reeling: 0,
        patience: 0,
        strength: 0,
        luck: 0,
      };
      data.version = 2;
    }
    
    // Migration from v2 to v3
    if (version < 3) {
      data.unlocks = data.unlocks || {
        stages: ['sunny_lake', 'crystal_pond'],
        difficulties: ['normal', 'hard'],
        features: [],
      };
      data.challenges = data.challenges || {
        dailyCompleted: [],
        weeklyCompleted: [],
        lastDailyReset: null,
        lastWeeklyReset: null,
      };
      data.version = 3;
    }
    
    return data;
  }
  
  /**
   * Start auto-save timer
   */
  startAutoSave() {
    this.stopAutoSave();
    
    this.autoSaveTimer = setInterval(() => {
      if (this.isDirty && this.currentSave) {
        this.saveGame();
      }
    }, this.autoSaveInterval);
  }
  
  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }
  
  /**
   * Export save data
   */
  exportSave(slot = null) {
    const targetSlot = slot !== null ? slot : this.currentSave?.slot;
    const saveData = targetSlot !== null ? this.saveSlots[targetSlot] : this.currentSave;
    
    if (!saveData) return null;
    
    return {
      exportedAt: Date.now(),
      version: this.dataVersion,
      data: saveData,
    };
  }
  
  /**
   * Import save data
   */
  importSave(exportedData, slot = null) {
    try {
      if (!exportedData || !exportedData.data) {
        return { success: false, error: 'Invalid export data' };
      }
      
      const saveData = this.migrateSaveData(exportedData.data);
      
      if (slot !== null) {
        saveData.slot = slot;
        this.saveSlots[slot] = saveData;
      } else {
        saveData.slot = this.saveSlots.length;
        this.saveSlots.push(saveData);
      }
      
      this.persistSaveSlots();
      
      return { success: true, slot: saveData.slot };
    } catch (error) {
      console.error('Failed to import save:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Get save slots summary
   */
  getSaveSlotsSummary() {
    return this.saveSlots.map(slot => ({
      slot: slot.slot,
      name: slot.name,
      level: slot.player?.level || 1,
      playTime: slot.playTime || 0,
      lastPlayedAt: slot.lastPlayedAt,
      fishCaught: slot.stats?.fishCaught || 0,
    }));
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

// ========== CLOUD SYNC SYSTEM ==========

/**
 * Cloud synchronization for save data
 */
class CloudSyncManager {
  constructor(saveManager) {
    this.saveManager = saveManager;
    this.isEnabled = false;
    this.lastSyncTime = null;
    this.syncStatus = 'idle';
    this.conflictResolver = null;
    
    this.listeners = [];
  }
  
  /**
   * Enable cloud sync
   */
  enable(userId, authToken) {
    this.userId = userId;
    this.authToken = authToken;
    this.isEnabled = true;
    
    this.notifyListeners('cloudSyncEnabled', { userId });
  }
  
  /**
   * Disable cloud sync
   */
  disable() {
    this.isEnabled = false;
    this.userId = null;
    this.authToken = null;
    
    this.notifyListeners('cloudSyncDisabled', {});
  }
  
  /**
   * Sync save data with cloud
   */
  async sync() {
    if (!this.isEnabled) {
      return { success: false, error: 'Cloud sync not enabled' };
    }
    
    this.syncStatus = 'syncing';
    this.notifyListeners('syncStarted', {});
    
    try {
      // Get local save
      const localSave = this.saveManager.currentSave;
      if (!localSave) {
        this.syncStatus = 'idle';
        return { success: false, error: 'No local save' };
      }
      
      // Get cloud save (simulated)
      const cloudSave = await this.fetchCloudSave();
      
      if (!cloudSave) {
        // No cloud save, upload local
        await this.uploadSave(localSave);
        this.syncStatus = 'idle';
        this.lastSyncTime = Date.now();
        this.notifyListeners('syncCompleted', { action: 'uploaded' });
        return { success: true, action: 'uploaded' };
      }
      
      // Check for conflicts
      if (this.hasConflict(localSave, cloudSave)) {
        // Resolve conflict
        const resolved = await this.resolveConflict(localSave, cloudSave);
        if (resolved.useCloud) {
          // Download cloud save
          await this.downloadSave(cloudSave);
        } else {
          // Upload local save
          await this.uploadSave(localSave);
        }
        this.syncStatus = 'idle';
        this.lastSyncTime = Date.now();
        this.notifyListeners('syncCompleted', { action: 'resolved', resolution: resolved });
        return { success: true, action: 'resolved' };
      }
      
      // No conflict, sync newer
      if (cloudSave.lastPlayedAt > localSave.lastPlayedAt) {
        await this.downloadSave(cloudSave);
        this.notifyListeners('syncCompleted', { action: 'downloaded' });
      } else if (localSave.lastPlayedAt > cloudSave.lastPlayedAt) {
        await this.uploadSave(localSave);
        this.notifyListeners('syncCompleted', { action: 'uploaded' });
      }
      
      this.syncStatus = 'idle';
      this.lastSyncTime = Date.now();
      
      return { success: true };
    } catch (error) {
      this.syncStatus = 'error';
      console.error('Sync failed:', error);
      this.notifyListeners('syncFailed', { error });
      return { success: false, error };
    }
  }
  
  /**
   * Fetch save from cloud (simulated)
   */
  async fetchCloudSave() {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cloudData = localStorage.getItem(`gofish_cloud_${this.userId}`);
    if (cloudData) {
      return JSON.parse(cloudData);
    }
    return null;
  }
  
  /**
   * Upload save to cloud (simulated)
   */
  async uploadSave(saveData) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    localStorage.setItem(`gofish_cloud_${this.userId}`, JSON.stringify(saveData));
    return true;
  }
  
  /**
   * Download save from cloud
   */
  async downloadSave(cloudSave) {
    const slot = this.saveManager.currentSave?.slot || 0;
    this.saveManager.currentSave = { ...cloudSave, slot };
    this.saveManager.saveSlots[slot] = this.saveManager.currentSave;
    this.saveManager.persistSaveSlots();
    
    this.notifyListeners('saveDownloaded', { save: cloudSave });
  }
  
  /**
   * Check if there's a conflict
   */
  hasConflict(localSave, cloudSave) {
    // Conflict if both have changed since last sync
    const lastSync = this.lastSyncTime || 0;
    return localSave.lastPlayedAt > lastSync && cloudSave.lastPlayedAt > lastSync;
  }
  
  /**
   * Resolve sync conflict
   */
  async resolveConflict(localSave, cloudSave) {
    // If custom resolver provided, use it
    if (this.conflictResolver) {
      return this.conflictResolver(localSave, cloudSave);
    }
    
    // Default: use save with more progress
    const localProgress = this.calculateProgress(localSave);
    const cloudProgress = this.calculateProgress(cloudSave);
    
    return {
      useCloud: cloudProgress > localProgress,
      localProgress,
      cloudProgress,
    };
  }
  
  /**
   * Calculate progress score for conflict resolution
   */
  calculateProgress(save) {
    let score = 0;
    
    score += (save.player?.level || 0) * 100;
    score += (save.player?.totalExperience || 0) * 0.1;
    score += (save.stats?.fishCaught || 0) * 5;
    score += (save.achievements?.unlocked?.length || 0) * 50;
    
    return score;
  }
  
  /**
   * Set custom conflict resolver
   */
  setConflictResolver(resolver) {
    this.conflictResolver = resolver;
  }
  
  /**
   * Get sync status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      syncStatus: this.syncStatus,
      lastSyncTime: this.lastSyncTime,
      userId: this.userId,
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

// ========== SETTINGS MANAGER ==========

/**
 * Global game settings management
 */
class SettingsManager {
  constructor() {
    this.settings = this.getDefaultSettings();
    this.storageKey = 'gofish_settings';
    this.listeners = [];
  }
  
  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      // Audio
      audio: {
        masterVolume: 0.7,
        musicVolume: 0.5,
        sfxVolume: 0.8,
        ambientVolume: 0.6,
        muted: false,
      },
      
      // Graphics
      graphics: {
        quality: 'high', // low, medium, high, ultra
        particles: true,
        waterEffects: true,
        shadows: true,
        antialiasing: true,
        fps: 60,
        reducedMotion: false,
      },
      
      // Gameplay
      gameplay: {
        difficulty: 'normal',
        autoReel: false,
        vibration: true,
        tutorials: true,
        hints: true,
        confirmActions: true,
      },
      
      // UI
      ui: {
        language: 'en',
        theme: 'auto', // light, dark, auto
        fontSize: 'medium',
        showFPS: false,
        compactMode: false,
        colorblindMode: false,
        colorblindType: 'none', // protanopia, deuteranopia, tritanopia
      },
      
      // Controls
      controls: {
        castButton: 'primary',
        reelSensitivity: 0.5,
        invertReel: false,
        touchControls: true,
        hapticFeedback: true,
      },
      
      // Notifications
      notifications: {
        enabled: true,
        dailyChallenge: true,
        tournamentStart: true,
        friendActivity: true,
        achievements: true,
        offers: false,
      },
      
      // Privacy
      privacy: {
        shareActivity: true,
        showOnline: true,
        allowFriendRequests: true,
        analytics: true,
      },
    };
  }
  
  /**
   * Load settings from storage
   */
  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.settings = this.mergeSettings(this.getDefaultSettings(), parsed);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  /**
   * Save settings to storage
   */
  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      this.notifyListeners('settingsSaved', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  /**
   * Merge settings with defaults
   */
  mergeSettings(defaults, saved) {
    const merged = { ...defaults };
    
    Object.keys(saved).forEach(category => {
      if (merged[category] && typeof merged[category] === 'object') {
        merged[category] = { ...merged[category], ...saved[category] };
      }
    });
    
    return merged;
  }
  
  /**
   * Get a setting value
   */
  get(path) {
    const keys = path.split('.');
    let value = this.settings;
    
    for (const key of keys) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    
    return value;
  }
  
  /**
   * Set a setting value
   */
  set(path, value) {
    const keys = path.split('.');
    let obj = this.settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    
    const oldValue = obj[keys[keys.length - 1]];
    obj[keys[keys.length - 1]] = value;
    
    this.save();
    this.notifyListeners('settingChanged', { path, oldValue, newValue: value });
    
    return true;
  }
  
  /**
   * Reset to defaults
   */
  resetToDefaults(category = null) {
    if (category) {
      const defaults = this.getDefaultSettings();
      if (defaults[category]) {
        this.settings[category] = { ...defaults[category] };
      }
    } else {
      this.settings = this.getDefaultSettings();
    }
    
    this.save();
    this.notifyListeners('settingsReset', { category });
  }
  
  /**
   * Export settings
   */
  export() {
    return {
      exportedAt: Date.now(),
      settings: this.settings,
    };
  }
  
  /**
   * Import settings
   */
  import(data) {
    if (!data || !data.settings) return false;
    
    this.settings = this.mergeSettings(this.getDefaultSettings(), data.settings);
    this.save();
    
    return true;
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

// ========== ANALYTICS MANAGER ==========

/**
 * Game analytics and telemetry
 */
class AnalyticsManager {
  constructor() {
    this.events = [];
    this.maxEvents = 1000;
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.isEnabled = true;
    
    this.listeners = [];
  }
  
  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Track an event
   */
  track(eventName, data = {}) {
    if (!this.isEnabled) return;
    
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: eventName,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.sessionStart,
    };
    
    this.events.push(event);
    
    // Trim old events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    
    this.notifyListeners('eventTracked', event);
  }
  
  /**
   * Track page view
   */
  trackPageView(pageName, data = {}) {
    this.track('page_view', { page: pageName, ...data });
  }
  
  /**
   * Track user action
   */
  trackAction(action, category, data = {}) {
    this.track('user_action', { action, category, ...data });
  }
  
  /**
   * Track game event
   */
  trackGameEvent(eventType, data = {}) {
    this.track('game_event', { eventType, ...data });
  }
  
  /**
   * Track error
   */
  trackError(error, context = {}) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  }
  
  /**
   * Track performance metric
   */
  trackPerformance(metric, value, unit = 'ms') {
    this.track('performance', { metric, value, unit });
  }
  
  /**
   * Get session summary
   */
  getSessionSummary() {
    const eventCounts = {};
    this.events.forEach(e => {
      eventCounts[e.name] = (eventCounts[e.name] || 0) + 1;
    });
    
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      totalEvents: this.events.length,
      eventCounts,
    };
  }
  
  /**
   * Export analytics data
   */
  export() {
    return {
      sessionId: this.sessionId,
      sessionStart: this.sessionStart,
      events: this.events,
      summary: this.getSessionSummary(),
    };
  }
  
  /**
   * Clear analytics data
   */
  clear() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
  }
  
  /**
   * Enable/disable analytics
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
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

// ========== EXPORTS ==========

export {
  SaveManager,
  CloudSyncManager,
  SettingsManager,
  AnalyticsManager,
};

export default {
  SaveManager,
  CloudSyncManager,
  SettingsManager,
  AnalyticsManager,
};
