// ========== GO FISH! PROGRESSION & ACHIEVEMENT SYSTEM ==========
// Comprehensive player progression, achievements, challenges, and rewards
// ~1500+ lines of progression systems

// ========== EXPERIENCE & LEVELING SYSTEM ==========

/**
 * Player experience and level management
 */
class ExperienceSystem {
  constructor() {
    this.level = 1;
    this.experience = 0;
    this.totalExperience = 0;
    this.prestige = 0;
    
    // XP requirements per level
    this.levelCurve = this.generateLevelCurve(100);
    
    // Skill points
    this.skillPoints = 0;
    this.totalSkillPoints = 0;
    
    // Stats tracking
    this.stats = {
      fishCaught: 0,
      totalWeight: 0,
      largestFish: 0,
      perfectCatches: 0,
      comboMax: 0,
      timesFished: 0,
      luresUsed: {},
      rodsUsed: {},
      stagesCompleted: {},
      weatherFished: {},
      timeFished: {},
      fishTypes: {},
      rareFishCaught: 0,
      legendaryFishCaught: 0,
      moneyEarned: 0,
      moneySpent: 0,
    };
    
    // Multipliers
    this.multipliers = {
      xp: 1.0,
      coins: 1.0,
      rarity: 1.0,
      luck: 1.0,
    };
    
    this.listeners = [];
  }
  
  /**
   * Generate XP requirements for each level
   */
  generateLevelCurve(maxLevel) {
    const curve = [0];
    for (let i = 1; i <= maxLevel; i++) {
      // Exponential curve with diminishing returns
      const xpRequired = Math.floor(100 * Math.pow(i, 1.5) + i * 50);
      curve.push(curve[i - 1] + xpRequired);
    }
    return curve;
  }
  
  /**
   * Add experience points
   */
  addExperience(amount, source = 'unknown') {
    const multipliedAmount = Math.floor(amount * this.multipliers.xp);
    this.experience += multipliedAmount;
    this.totalExperience += multipliedAmount;
    
    // Check for level up
    while (this.level < this.levelCurve.length - 1 && 
           this.experience >= this.getXPForNextLevel()) {
      this.levelUp();
    }
    
    this.notifyListeners('xpGained', { 
      amount: multipliedAmount, 
      source, 
      total: this.experience,
      level: this.level,
    });
    
    return multipliedAmount;
  }
  
  /**
   * Get XP needed for next level
   */
  getXPForNextLevel() {
    if (this.level >= this.levelCurve.length - 1) return Infinity;
    return this.levelCurve[this.level];
  }
  
  /**
   * Get XP progress to next level (0-1)
   */
  getLevelProgress() {
    const currentLevelXP = this.level > 1 ? this.levelCurve[this.level - 1] : 0;
    const nextLevelXP = this.getXPForNextLevel();
    const progress = (this.experience - currentLevelXP) / (nextLevelXP - currentLevelXP);
    return Math.max(0, Math.min(1, progress));
  }
  
  /**
   * Level up
   */
  levelUp() {
    this.level++;
    this.skillPoints += this.getSkillPointsForLevel(this.level);
    this.totalSkillPoints += this.getSkillPointsForLevel(this.level);
    
    // Unlock rewards
    const rewards = this.getLevelRewards(this.level);
    
    this.notifyListeners('levelUp', {
      newLevel: this.level,
      skillPoints: this.skillPoints,
      rewards,
    });
    
    return { level: this.level, rewards };
  }
  
  /**
   * Get skill points awarded for a level
   */
  getSkillPointsForLevel(level) {
    if (level % 10 === 0) return 3; // Milestone levels
    if (level % 5 === 0) return 2;  // Every 5 levels
    return 1;
  }
  
  /**
   * Get rewards for reaching a level
   */
  getLevelRewards(level) {
    const rewards = [];
    
    // Coins every level
    rewards.push({
      type: 'coins',
      amount: level * 100,
    });
    
    // Milestone rewards
    if (level === 5) {
      rewards.push({ type: 'rod', id: 'fiberglass' });
    }
    if (level === 10) {
      rewards.push({ type: 'lure', id: 'spinner' });
      rewards.push({ type: 'title', id: 'novice_angler' });
    }
    if (level === 15) {
      rewards.push({ type: 'bobber', id: 'neon_orange' });
    }
    if (level === 20) {
      rewards.push({ type: 'rod', id: 'carbon' });
      rewards.push({ type: 'title', id: 'skilled_fisher' });
    }
    if (level === 25) {
      rewards.push({ type: 'stage', id: 'deep_ocean' });
    }
    if (level === 30) {
      rewards.push({ type: 'xp_boost', multiplier: 1.1, duration: 'permanent' });
      rewards.push({ type: 'title', id: 'expert_angler' });
    }
    if (level === 40) {
      rewards.push({ type: 'rod', id: 'graphite_pro' });
      rewards.push({ type: 'title', id: 'master_fisher' });
    }
    if (level === 50) {
      rewards.push({ type: 'legendary_lure', id: 'golden_minnow' });
      rewards.push({ type: 'title', id: 'legendary_angler' });
      rewards.push({ type: 'prestige_unlock' });
    }
    if (level === 75) {
      rewards.push({ type: 'rod', id: 'dragon_slayer' });
      rewards.push({ type: 'title', id: 'mythic_fisher' });
    }
    if (level === 100) {
      rewards.push({ type: 'rod', id: 'poseidons_trident' });
      rewards.push({ type: 'title', id: 'god_of_fishing' });
      rewards.push({ type: 'exclusive_fish', id: 'the_one_fish' });
    }
    
    return rewards;
  }
  
  /**
   * Prestige system - reset for bonuses
   */
  prestige() {
    if (this.level < 50) return null;
    
    const prestigeBonus = {
      xpMultiplier: 0.05,
      coinMultiplier: 0.05,
      rarityBonus: 0.02,
    };
    
    this.prestige++;
    this.multipliers.xp += prestigeBonus.xpMultiplier;
    this.multipliers.coins += prestigeBonus.coinMultiplier;
    this.multipliers.rarity += prestigeBonus.rarityBonus;
    
    // Reset level but keep some progress
    this.level = 1;
    this.experience = 0;
    this.skillPoints = Math.floor(this.totalSkillPoints * 0.1); // Keep 10% skill points
    
    this.notifyListeners('prestige', {
      prestigeLevel: this.prestige,
      bonuses: prestigeBonus,
    });
    
    return { prestige: this.prestige, bonuses: prestigeBonus };
  }
  
  /**
   * Track a stat
   */
  trackStat(stat, value = 1) {
    if (typeof this.stats[stat] === 'number') {
      this.stats[stat] += value;
    } else if (typeof this.stats[stat] === 'object') {
      // For object stats (like fishTypes)
      if (!this.stats[stat][value]) {
        this.stats[stat][value] = 0;
      }
      this.stats[stat][value]++;
    }
  }
  
  /**
   * Get state
   */
  getState() {
    return {
      level: this.level,
      experience: this.experience,
      totalExperience: this.totalExperience,
      prestige: this.prestige,
      skillPoints: this.skillPoints,
      totalSkillPoints: this.totalSkillPoints,
      xpForNextLevel: this.getXPForNextLevel(),
      levelProgress: this.getLevelProgress(),
      multipliers: { ...this.multipliers },
      stats: { ...this.stats },
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

// ========== ACHIEVEMENT SYSTEM ==========

/**
 * Comprehensive achievement tracking
 */
class AchievementSystem {
  constructor() {
    this.achievements = this.initializeAchievements();
    this.unlockedAchievements = new Set();
    this.achievementProgress = {};
    this.listeners = [];
  }
  
  /**
   * Initialize all achievements
   */
  initializeAchievements() {
    return {
      // ========== CATCHING ACHIEVEMENTS ==========
      first_catch: {
        id: 'first_catch',
        name: 'First Catch!',
        description: 'Catch your first fish',
        icon: '🐟',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 1 },
        reward: { coins: 100, xp: 50 },
        rarity: 'common',
      },
      catch_10: {
        id: 'catch_10',
        name: 'Getting Started',
        description: 'Catch 10 fish',
        icon: '🎣',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 10 },
        reward: { coins: 200, xp: 100 },
        rarity: 'common',
      },
      catch_50: {
        id: 'catch_50',
        name: 'Hobby Fisher',
        description: 'Catch 50 fish',
        icon: '🐠',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 50 },
        reward: { coins: 500, xp: 250 },
        rarity: 'uncommon',
      },
      catch_100: {
        id: 'catch_100',
        name: 'Century Club',
        description: 'Catch 100 fish',
        icon: '💯',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 100 },
        reward: { coins: 1000, xp: 500, item: { type: 'lure', id: 'silver_spinner' } },
        rarity: 'uncommon',
      },
      catch_500: {
        id: 'catch_500',
        name: 'Dedicated Angler',
        description: 'Catch 500 fish',
        icon: '🏆',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 500 },
        reward: { coins: 5000, xp: 2500 },
        rarity: 'rare',
      },
      catch_1000: {
        id: 'catch_1000',
        name: 'Master Angler',
        description: 'Catch 1,000 fish',
        icon: '👑',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 1000 },
        reward: { coins: 10000, xp: 5000, title: 'Master Angler' },
        rarity: 'epic',
      },
      catch_5000: {
        id: 'catch_5000',
        name: 'Legendary Fisher',
        description: 'Catch 5,000 fish',
        icon: '⭐',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 5000 },
        reward: { coins: 50000, xp: 25000, title: 'Legendary Fisher' },
        rarity: 'legendary',
      },
      catch_10000: {
        id: 'catch_10000',
        name: 'God of Fishing',
        description: 'Catch 10,000 fish',
        icon: '🔱',
        category: 'catching',
        requirement: { type: 'fishCaught', count: 10000 },
        reward: { coins: 100000, xp: 50000, title: 'God of Fishing', exclusive: true },
        rarity: 'mythic',
      },
      
      // ========== PERFECT CATCH ACHIEVEMENTS ==========
      perfect_first: {
        id: 'perfect_first',
        name: 'Perfect!',
        description: 'Get your first perfect catch',
        icon: '✨',
        category: 'skill',
        requirement: { type: 'perfectCatches', count: 1 },
        reward: { coins: 200, xp: 100 },
        rarity: 'common',
      },
      perfect_10: {
        id: 'perfect_10',
        name: 'Precision Fisher',
        description: 'Get 10 perfect catches',
        icon: '🎯',
        category: 'skill',
        requirement: { type: 'perfectCatches', count: 10 },
        reward: { coins: 500, xp: 250 },
        rarity: 'uncommon',
      },
      perfect_50: {
        id: 'perfect_50',
        name: 'Perfectionist',
        description: 'Get 50 perfect catches',
        icon: '💫',
        category: 'skill',
        requirement: { type: 'perfectCatches', count: 50 },
        reward: { coins: 2000, xp: 1000 },
        rarity: 'rare',
      },
      perfect_100: {
        id: 'perfect_100',
        name: 'Flawless Technique',
        description: 'Get 100 perfect catches',
        icon: '🌟',
        category: 'skill',
        requirement: { type: 'perfectCatches', count: 100 },
        reward: { coins: 5000, xp: 2500, title: 'The Perfectionist' },
        rarity: 'epic',
      },
      
      // ========== COMBO ACHIEVEMENTS ==========
      combo_3: {
        id: 'combo_3',
        name: 'Combo Starter',
        description: 'Get a 3x combo',
        icon: '🔥',
        category: 'skill',
        requirement: { type: 'comboMax', count: 3 },
        reward: { coins: 100, xp: 50 },
        rarity: 'common',
      },
      combo_5: {
        id: 'combo_5',
        name: 'On Fire!',
        description: 'Get a 5x combo',
        icon: '🔥🔥',
        category: 'skill',
        requirement: { type: 'comboMax', count: 5 },
        reward: { coins: 300, xp: 150 },
        rarity: 'uncommon',
      },
      combo_10: {
        id: 'combo_10',
        name: 'Unstoppable',
        description: 'Get a 10x combo',
        icon: '⚡',
        category: 'skill',
        requirement: { type: 'comboMax', count: 10 },
        reward: { coins: 1000, xp: 500 },
        rarity: 'rare',
      },
      combo_20: {
        id: 'combo_20',
        name: 'Combo Master',
        description: 'Get a 20x combo',
        icon: '💥',
        category: 'skill',
        requirement: { type: 'comboMax', count: 20 },
        reward: { coins: 5000, xp: 2500, title: 'Combo King' },
        rarity: 'epic',
      },
      combo_50: {
        id: 'combo_50',
        name: 'Inhuman Reflexes',
        description: 'Get a 50x combo',
        icon: '🌈',
        category: 'skill',
        requirement: { type: 'comboMax', count: 50 },
        reward: { coins: 20000, xp: 10000, title: 'The Untouchable' },
        rarity: 'legendary',
      },
      
      // ========== RARE FISH ACHIEVEMENTS ==========
      rare_first: {
        id: 'rare_first',
        name: 'Rare Find',
        description: 'Catch your first rare fish',
        icon: '💎',
        category: 'discovery',
        requirement: { type: 'rareFishCaught', count: 1 },
        reward: { coins: 500, xp: 250 },
        rarity: 'uncommon',
      },
      rare_10: {
        id: 'rare_10',
        name: 'Treasure Hunter',
        description: 'Catch 10 rare fish',
        icon: '💰',
        category: 'discovery',
        requirement: { type: 'rareFishCaught', count: 10 },
        reward: { coins: 2000, xp: 1000 },
        rarity: 'rare',
      },
      legendary_first: {
        id: 'legendary_first',
        name: 'Legend Spotted',
        description: 'Catch your first legendary fish',
        icon: '🐉',
        category: 'discovery',
        requirement: { type: 'legendaryFishCaught', count: 1 },
        reward: { coins: 5000, xp: 2500 },
        rarity: 'epic',
      },
      legendary_10: {
        id: 'legendary_10',
        name: 'Legend Collector',
        description: 'Catch 10 legendary fish',
        icon: '👑',
        category: 'discovery',
        requirement: { type: 'legendaryFishCaught', count: 10 },
        reward: { coins: 25000, xp: 12500, title: 'Legend Hunter' },
        rarity: 'legendary',
      },
      all_fish_types: {
        id: 'all_fish_types',
        name: 'Completionist',
        description: 'Catch every type of fish',
        icon: '📚',
        category: 'discovery',
        requirement: { type: 'uniqueFishTypes', count: 100 },
        reward: { coins: 100000, xp: 50000, title: 'The Collector', exclusive: true },
        rarity: 'mythic',
      },
      
      // ========== SIZE ACHIEVEMENTS ==========
      big_fish: {
        id: 'big_fish',
        name: 'Big One',
        description: 'Catch a fish over 50cm',
        icon: '📏',
        category: 'size',
        requirement: { type: 'largestFish', count: 50 },
        reward: { coins: 300, xp: 150 },
        rarity: 'common',
      },
      huge_fish: {
        id: 'huge_fish',
        name: 'Monster Catch',
        description: 'Catch a fish over 100cm',
        icon: '🦈',
        category: 'size',
        requirement: { type: 'largestFish', count: 100 },
        reward: { coins: 1000, xp: 500 },
        rarity: 'uncommon',
      },
      giant_fish: {
        id: 'giant_fish',
        name: 'Whale of a Tale',
        description: 'Catch a fish over 200cm',
        icon: '🐋',
        category: 'size',
        requirement: { type: 'largestFish', count: 200 },
        reward: { coins: 5000, xp: 2500, title: 'Giant Slayer' },
        rarity: 'rare',
      },
      record_fish: {
        id: 'record_fish',
        name: 'World Record',
        description: 'Catch a fish over 500cm',
        icon: '🏅',
        category: 'size',
        requirement: { type: 'largestFish', count: 500 },
        reward: { coins: 25000, xp: 12500, title: 'Record Holder' },
        rarity: 'legendary',
      },
      
      // ========== EXPLORATION ACHIEVEMENTS ==========
      first_stage: {
        id: 'first_stage',
        name: 'Explorer',
        description: 'Complete your first stage',
        icon: '🗺️',
        category: 'exploration',
        requirement: { type: 'stagesCompleted', count: 1 },
        reward: { coins: 200, xp: 100 },
        rarity: 'common',
      },
      stages_10: {
        id: 'stages_10',
        name: 'Adventurer',
        description: 'Complete 10 different stages',
        icon: '🧭',
        category: 'exploration',
        requirement: { type: 'stagesCompleted', count: 10 },
        reward: { coins: 2000, xp: 1000 },
        rarity: 'uncommon',
      },
      all_stages: {
        id: 'all_stages',
        name: 'World Traveler',
        description: 'Complete all 50 stages',
        icon: '🌍',
        category: 'exploration',
        requirement: { type: 'stagesCompleted', count: 50 },
        reward: { coins: 50000, xp: 25000, title: 'Globe Trotter' },
        rarity: 'epic',
      },
      
      // ========== WEATHER ACHIEVEMENTS ==========
      rain_fisher: {
        id: 'rain_fisher',
        name: 'Rain Dancer',
        description: 'Catch 50 fish in the rain',
        icon: '🌧️',
        category: 'weather',
        requirement: { type: 'weatherFished', weather: 'rain', count: 50 },
        reward: { coins: 1000, xp: 500 },
        rarity: 'uncommon',
      },
      storm_chaser: {
        id: 'storm_chaser',
        name: 'Storm Chaser',
        description: 'Catch 20 fish during a storm',
        icon: '⛈️',
        category: 'weather',
        requirement: { type: 'weatherFished', weather: 'storm', count: 20 },
        reward: { coins: 3000, xp: 1500, title: 'Storm Rider' },
        rarity: 'rare',
      },
      snow_angler: {
        id: 'snow_angler',
        name: 'Ice Fisher',
        description: 'Catch 30 fish in the snow',
        icon: '❄️',
        category: 'weather',
        requirement: { type: 'weatherFished', weather: 'snow', count: 30 },
        reward: { coins: 2000, xp: 1000 },
        rarity: 'uncommon',
      },
      
      // ========== TIME ACHIEVEMENTS ==========
      night_owl: {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Catch 50 fish at night',
        icon: '🌙',
        category: 'time',
        requirement: { type: 'timeFished', time: 'night', count: 50 },
        reward: { coins: 1500, xp: 750 },
        rarity: 'uncommon',
      },
      early_bird: {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Catch 30 fish at dawn',
        icon: '🌅',
        category: 'time',
        requirement: { type: 'timeFished', time: 'dawn', count: 30 },
        reward: { coins: 1000, xp: 500 },
        rarity: 'uncommon',
      },
      golden_hour: {
        id: 'golden_hour',
        name: 'Golden Hour',
        description: 'Catch 30 fish at sunset',
        icon: '🌇',
        category: 'time',
        requirement: { type: 'timeFished', time: 'sunset', count: 30 },
        reward: { coins: 1000, xp: 500 },
        rarity: 'uncommon',
      },
      
      // ========== SPECIAL ACHIEVEMENTS ==========
      speed_demon: {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Catch 5 fish in under 1 minute',
        icon: '⚡',
        category: 'special',
        requirement: { type: 'special', condition: 'speed_catch' },
        reward: { coins: 2000, xp: 1000 },
        rarity: 'rare',
      },
      patient_fisher: {
        id: 'patient_fisher',
        name: 'Patient Fisher',
        description: 'Fish for 10 hours total',
        icon: '⏰',
        category: 'special',
        requirement: { type: 'timesFished', count: 600 },
        reward: { coins: 3000, xp: 1500 },
        rarity: 'uncommon',
      },
      millionaire: {
        id: 'millionaire',
        name: 'Millionaire',
        description: 'Earn 1,000,000 total coins',
        icon: '💵',
        category: 'special',
        requirement: { type: 'moneyEarned', count: 1000000 },
        reward: { coins: 100000, xp: 50000, title: 'The Millionaire' },
        rarity: 'legendary',
      },
      
      // ========== SECRET ACHIEVEMENTS ==========
      secret_1: {
        id: 'secret_1',
        name: '???',
        description: 'Discover this secret achievement',
        icon: '❓',
        category: 'secret',
        requirement: { type: 'special', condition: 'catch_at_midnight' },
        reward: { coins: 5000, xp: 2500 },
        rarity: 'rare',
        hidden: true,
        revealedName: 'Midnight Mystery',
        revealedDescription: 'Catch a fish exactly at midnight',
      },
      secret_2: {
        id: 'secret_2',
        name: '???',
        description: 'Discover this secret achievement',
        icon: '❓',
        category: 'secret',
        requirement: { type: 'special', condition: 'full_moon_legendary' },
        reward: { coins: 10000, xp: 5000 },
        rarity: 'epic',
        hidden: true,
        revealedName: 'Lunar Legend',
        revealedDescription: 'Catch a legendary fish during a full moon',
      },
      secret_3: {
        id: 'secret_3',
        name: '???',
        description: 'Discover this secret achievement',
        icon: '❓',
        category: 'secret',
        requirement: { type: 'special', condition: 'lightning_catch' },
        reward: { coins: 7500, xp: 3750 },
        rarity: 'rare',
        hidden: true,
        revealedName: 'Lightning Rod',
        revealedDescription: 'Catch a fish the moment lightning strikes',
      },
    };
  }
  
  /**
   * Check if achievement should unlock
   */
  checkAchievement(id, stats) {
    const achievement = this.achievements[id];
    if (!achievement || this.unlockedAchievements.has(id)) return null;
    
    const { requirement } = achievement;
    let progress = 0;
    let target = requirement.count || 1;
    let unlocked = false;
    
    switch (requirement.type) {
      case 'fishCaught':
      case 'perfectCatches':
      case 'comboMax':
      case 'rareFishCaught':
      case 'legendaryFishCaught':
      case 'largestFish':
      case 'timesFished':
      case 'moneyEarned':
        progress = stats[requirement.type] || 0;
        unlocked = progress >= target;
        break;
        
      case 'stagesCompleted':
        progress = Object.keys(stats.stagesCompleted || {}).length;
        unlocked = progress >= target;
        break;
        
      case 'uniqueFishTypes':
        progress = Object.keys(stats.fishTypes || {}).length;
        unlocked = progress >= target;
        break;
        
      case 'weatherFished':
        progress = (stats.weatherFished || {})[requirement.weather] || 0;
        unlocked = progress >= target;
        break;
        
      case 'timeFished':
        progress = (stats.timeFished || {})[requirement.time] || 0;
        unlocked = progress >= target;
        break;
        
      case 'special':
        // Special conditions are checked elsewhere
        break;
    }
    
    // Update progress
    this.achievementProgress[id] = { progress, target };
    
    if (unlocked) {
      return this.unlockAchievement(id);
    }
    
    return null;
  }
  
  /**
   * Check all achievements
   */
  checkAllAchievements(stats) {
    const newlyUnlocked = [];
    
    Object.keys(this.achievements).forEach(id => {
      const result = this.checkAchievement(id, stats);
      if (result) {
        newlyUnlocked.push(result);
      }
    });
    
    return newlyUnlocked;
  }
  
  /**
   * Unlock an achievement
   */
  unlockAchievement(id) {
    if (this.unlockedAchievements.has(id)) return null;
    
    const achievement = this.achievements[id];
    if (!achievement) return null;
    
    this.unlockedAchievements.add(id);
    
    this.notifyListeners('achievementUnlocked', achievement);
    
    return achievement;
  }
  
  /**
   * Get achievement display info
   */
  getAchievementDisplay(id) {
    const achievement = this.achievements[id];
    if (!achievement) return null;
    
    const unlocked = this.unlockedAchievements.has(id);
    const progress = this.achievementProgress[id] || { progress: 0, target: 1 };
    
    // Handle hidden achievements
    if (achievement.hidden && !unlocked) {
      return {
        ...achievement,
        name: '???',
        description: 'Discover this secret achievement',
        icon: '❓',
        unlocked: false,
        progress: 0,
        target: 1,
      };
    }
    
    // Reveal hidden achievement info if unlocked
    if (achievement.hidden && unlocked) {
      return {
        ...achievement,
        name: achievement.revealedName,
        description: achievement.revealedDescription,
        unlocked: true,
        progress: progress.progress,
        target: progress.target,
      };
    }
    
    return {
      ...achievement,
      unlocked,
      progress: progress.progress,
      target: progress.target,
    };
  }
  
  /**
   * Get all achievements by category
   */
  getAchievementsByCategory() {
    const categories = {};
    
    Object.values(this.achievements).forEach(ach => {
      if (!categories[ach.category]) {
        categories[ach.category] = [];
      }
      categories[ach.category].push(this.getAchievementDisplay(ach.id));
    });
    
    return categories;
  }
  
  /**
   * Get achievement stats
   */
  getStats() {
    const total = Object.keys(this.achievements).length;
    const unlocked = this.unlockedAchievements.size;
    
    const byRarity = {
      common: { total: 0, unlocked: 0 },
      uncommon: { total: 0, unlocked: 0 },
      rare: { total: 0, unlocked: 0 },
      epic: { total: 0, unlocked: 0 },
      legendary: { total: 0, unlocked: 0 },
      mythic: { total: 0, unlocked: 0 },
    };
    
    Object.values(this.achievements).forEach(ach => {
      byRarity[ach.rarity].total++;
      if (this.unlockedAchievements.has(ach.id)) {
        byRarity[ach.rarity].unlocked++;
      }
    });
    
    return {
      total,
      unlocked,
      percentage: Math.round((unlocked / total) * 100),
      byRarity,
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

// ========== DAILY CHALLENGE SYSTEM ==========

/**
 * Daily and weekly challenges
 */
class ChallengeSystem {
  constructor() {
    this.dailyChallenges = [];
    this.weeklyChallenges = [];
    this.completedChallenges = new Set();
    this.lastDailyReset = null;
    this.lastWeeklyReset = null;
    
    // Challenge templates
    this.challengeTemplates = {
      daily: [
        { type: 'catch_fish', target: 10, reward: { coins: 500, xp: 250 } },
        { type: 'catch_fish', target: 20, reward: { coins: 1000, xp: 500 } },
        { type: 'perfect_catches', target: 3, reward: { coins: 300, xp: 150 } },
        { type: 'perfect_catches', target: 5, reward: { coins: 500, xp: 250 } },
        { type: 'combo', target: 5, reward: { coins: 400, xp: 200 } },
        { type: 'combo', target: 10, reward: { coins: 800, xp: 400 } },
        { type: 'rare_fish', target: 1, reward: { coins: 750, xp: 375 } },
        { type: 'specific_stage', reward: { coins: 300, xp: 150 } },
        { type: 'weather_fish', reward: { coins: 400, xp: 200 } },
        { type: 'time_fish', reward: { coins: 350, xp: 175 } },
      ],
      weekly: [
        { type: 'catch_fish', target: 100, reward: { coins: 5000, xp: 2500 } },
        { type: 'perfect_catches', target: 20, reward: { coins: 3000, xp: 1500 } },
        { type: 'legendary_fish', target: 1, reward: { coins: 10000, xp: 5000 } },
        { type: 'all_stages', target: 10, reward: { coins: 7500, xp: 3750 } },
        { type: 'total_weight', target: 1000, reward: { coins: 4000, xp: 2000 } },
      ],
    };
    
    this.listeners = [];
  }
  
  /**
   * Generate daily challenges
   */
  generateDailyChallenges() {
    this.dailyChallenges = [];
    const templates = [...this.challengeTemplates.daily];
    
    // Select 3 random challenges
    for (let i = 0; i < 3; i++) {
      const index = Math.floor(Math.random() * templates.length);
      const template = templates.splice(index, 1)[0];
      
      this.dailyChallenges.push({
        id: `daily_${Date.now()}_${i}`,
        ...template,
        progress: 0,
        completed: false,
        claimed: false,
        expiresAt: this.getNextDailyReset(),
      });
    }
    
    this.lastDailyReset = Date.now();
    this.notifyListeners('dailyChallengesGenerated', this.dailyChallenges);
  }
  
  /**
   * Generate weekly challenges
   */
  generateWeeklyChallenges() {
    this.weeklyChallenges = [];
    const templates = [...this.challengeTemplates.weekly];
    
    // Select 2 random challenges
    for (let i = 0; i < 2; i++) {
      const index = Math.floor(Math.random() * templates.length);
      const template = templates.splice(index, 1)[0];
      
      this.weeklyChallenges.push({
        id: `weekly_${Date.now()}_${i}`,
        ...template,
        progress: 0,
        completed: false,
        claimed: false,
        expiresAt: this.getNextWeeklyReset(),
      });
    }
    
    this.lastWeeklyReset = Date.now();
    this.notifyListeners('weeklyChallengesGenerated', this.weeklyChallenges);
  }
  
  /**
   * Get next daily reset time
   */
  getNextDailyReset() {
    const now = new Date();
    const reset = new Date(now);
    reset.setHours(24, 0, 0, 0);
    return reset.getTime();
  }
  
  /**
   * Get next weekly reset time (Monday)
   */
  getNextWeeklyReset() {
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const reset = new Date(now);
    reset.setDate(reset.getDate() + daysUntilMonday);
    reset.setHours(0, 0, 0, 0);
    return reset.getTime();
  }
  
  /**
   * Check if reset needed
   */
  checkResets() {
    const now = Date.now();
    
    if (!this.lastDailyReset || now >= this.getNextDailyReset()) {
      this.generateDailyChallenges();
    }
    
    if (!this.lastWeeklyReset || now >= this.getNextWeeklyReset()) {
      this.generateWeeklyChallenges();
    }
  }
  
  /**
   * Update challenge progress
   */
  updateProgress(type, amount = 1, context = {}) {
    const allChallenges = [...this.dailyChallenges, ...this.weeklyChallenges];
    const updated = [];
    
    allChallenges.forEach(challenge => {
      if (challenge.completed || challenge.type !== type) return;
      
      // Check context conditions
      if (challenge.type === 'specific_stage' && context.stage !== challenge.stage) return;
      if (challenge.type === 'weather_fish' && context.weather !== challenge.weather) return;
      if (challenge.type === 'time_fish' && context.time !== challenge.time) return;
      
      challenge.progress += amount;
      
      if (challenge.progress >= challenge.target) {
        challenge.completed = true;
        updated.push(challenge);
        this.notifyListeners('challengeCompleted', challenge);
      }
    });
    
    return updated;
  }
  
  /**
   * Claim challenge reward
   */
  claimReward(challengeId) {
    const allChallenges = [...this.dailyChallenges, ...this.weeklyChallenges];
    const challenge = allChallenges.find(c => c.id === challengeId);
    
    if (!challenge || !challenge.completed || challenge.claimed) {
      return null;
    }
    
    challenge.claimed = true;
    this.completedChallenges.add(challengeId);
    
    this.notifyListeners('rewardClaimed', challenge);
    return challenge.reward;
  }
  
  /**
   * Get all active challenges
   */
  getActiveChallenges() {
    return {
      daily: this.dailyChallenges.map(c => ({ ...c })),
      weekly: this.weeklyChallenges.map(c => ({ ...c })),
      dailyResetIn: this.getNextDailyReset() - Date.now(),
      weeklyResetIn: this.getNextWeeklyReset() - Date.now(),
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

// ========== EXPORTS ==========

export {
  ExperienceSystem,
  AchievementSystem,
  ChallengeSystem,
};

export default {
  ExperienceSystem,
  AchievementSystem,
  ChallengeSystem,
};
