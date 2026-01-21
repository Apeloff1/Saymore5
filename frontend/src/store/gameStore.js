import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const FISH_PER_LEVEL = 200;

// ========== TACKLEBOX ITEM SYSTEM ==========
// Each fish item has: id, name, size, rarity, points, color, caughtAt, stage, isPerfect

export const useGameStore = create(
  persist(
    (set, get) => ({
      // User & Progress
      userId: null,
      deviceId: null,
      username: 'Angler',
      score: 0,
      highScore: 0,
      level: 1,
      remaining: FISH_PER_LEVEL,
      totalCatches: 0,
      prestige: 0,
      
      // ========== TACKLEBOX ITEM SYSTEM ==========
      tacklebox: {
        items: [],           // Array of fish items
        capacity: 10000,     // Max items
        totalFishCaught: 0,  // Lifetime fish caught
        rareFishCount: 0,    // Legendary fish count
        largestFish: null,   // Biggest fish caught
        smallestFish: null,  // Smallest fish caught
        fishByType: {},      // Count by fish type { Minnow: 5, Bass: 3, ... }
        fishByStage: {},     // Count by stage { 0: 10, 1: 5, ... }
        totalValue: 0,       // Sum of all fish points
      },
      
      // Equipment
      selectedRod: 0,
      selectedLure: 0,
      unlockedLures: [0],
      rodDurability: 100,
      
      // Game State
      gameState: 'menu',
      fishingState: 'idle',
      currentStage: 0,
      difficulty: 2,
      fishPerLevel: FISH_PER_LEVEL,
      
      // Fishing Mechanics
      currentFish: null,
      tension: 0,
      castDistance: 0,
      
      // Environment
      weather: null,
      timeOfDay: 'day',
      
      // Stats & Progress
      combo: 0,
      maxCombo: 0,
      perfectCatches: 0,
      sessionCatches: 0,
      sessionScore: 0,
      whalesSeen: 0,
      stormCatches: 0,
      achievements: [],
      
      // Daily Challenge
      dailyChallenge: null,
      dailyChallengeProgress: 0,
      dailyChallengeCompleted: false,
      
      // Animations & Events
      showWhale: false,
      showBoat: false,
      boatType: 0,
      showLightning: false,
      showParticles: false,
      particleType: null,
      
      // Settings
      soundEnabled: true,
      musicEnabled: false,
      vibrationEnabled: true,
      
      // ========== TACKLEBOX ACTIONS ==========
      
      // Add fish to tacklebox item system
      addFishToTacklebox: (fish) => set((state) => {
        const newItem = {
          id: `fish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: fish.name,
          size: fish.actualSize || fish.size,
          rarity: fish.rarity,
          points: fish.points,
          color: fish.color,
          caughtAt: new Date().toISOString(),
          stage: state.currentStage,
          isPerfect: fish.isPerfect || false,
          weather: state.weather?.condition || 'clear',
          timeOfDay: state.timeOfDay,
        };
        
        // Limit items to capacity (keep most recent)
        const newItems = [...state.tacklebox.items, newItem].slice(-state.tacklebox.capacity);
        
        // Update fish counts by type
        const newFishByType = { ...state.tacklebox.fishByType };
        newFishByType[fish.name] = (newFishByType[fish.name] || 0) + 1;
        
        // Update fish counts by stage
        const newFishByStage = { ...state.tacklebox.fishByStage };
        newFishByStage[state.currentStage] = (newFishByStage[state.currentStage] || 0) + 1;
        
        // Track largest/smallest fish
        let largestFish = state.tacklebox.largestFish;
        let smallestFish = state.tacklebox.smallestFish;
        
        if (!largestFish || newItem.size > largestFish.size) {
          largestFish = newItem;
        }
        if (!smallestFish || newItem.size < smallestFish.size) {
          smallestFish = newItem;
        }
        
        // Count rare fish (rarity >= 3)
        const rareFishCount = fish.rarity >= 3 
          ? state.tacklebox.rareFishCount + 1 
          : state.tacklebox.rareFishCount;
        
        return {
          tacklebox: {
            ...state.tacklebox,
            items: newItems,
            totalFishCaught: state.tacklebox.totalFishCaught + 1,
            rareFishCount,
            largestFish,
            smallestFish,
            fishByType: newFishByType,
            fishByStage: newFishByStage,
            totalValue: state.tacklebox.totalValue + fish.points,
          }
        };
      }),
      
      // Get tacklebox items (with optional filters)
      getTackleboxItems: (filters = {}) => {
        const state = get();
        let items = [...state.tacklebox.items];
        
        // Filter by fish type
        if (filters.fishType) {
          items = items.filter(item => item.name === filters.fishType);
        }
        
        // Filter by rarity
        if (filters.rarity !== undefined) {
          items = items.filter(item => item.rarity >= filters.rarity);
        }
        
        // Filter by stage
        if (filters.stage !== undefined) {
          items = items.filter(item => item.stage === filters.stage);
        }
        
        // Sort options
        if (filters.sortBy === 'size') {
          items.sort((a, b) => b.size - a.size);
        } else if (filters.sortBy === 'points') {
          items.sort((a, b) => b.points - a.points);
        } else if (filters.sortBy === 'rarity') {
          items.sort((a, b) => b.rarity - a.rarity);
        } else if (filters.sortBy === 'recent') {
          items.sort((a, b) => new Date(b.caughtAt) - new Date(a.caughtAt));
        }
        
        // Limit results
        if (filters.limit) {
          items = items.slice(0, filters.limit);
        }
        
        return items;
      },
      
      // Get tacklebox stats
      getTackleboxStats: () => {
        const state = get();
        return {
          totalItems: state.tacklebox.items.length,
          capacity: state.tacklebox.capacity,
          totalFishCaught: state.tacklebox.totalFishCaught,
          rareFishCount: state.tacklebox.rareFishCount,
          largestFish: state.tacklebox.largestFish,
          smallestFish: state.tacklebox.smallestFish,
          fishByType: state.tacklebox.fishByType,
          fishByStage: state.tacklebox.fishByStage,
          totalValue: state.tacklebox.totalValue,
          uniqueTypes: Object.keys(state.tacklebox.fishByType).length,
        };
      },
      
      // Clear tacklebox (for prestige)
      clearTacklebox: () => set((state) => ({
        tacklebox: {
          items: [],
          capacity: state.tacklebox.capacity,
          totalFishCaught: state.tacklebox.totalFishCaught, // Keep lifetime stats
          rareFishCount: state.tacklebox.rareFishCount,
          largestFish: state.tacklebox.largestFish,
          smallestFish: state.tacklebox.smallestFish,
          fishByType: {},
          fishByStage: {},
          totalValue: 0,
        }
      })),
      
      // ========== USER ACTIONS ==========
      setUserId: (id) => set({ userId: id }),
      setDeviceId: (id) => set({ deviceId: id }),
      setUsername: (name) => set({ username: name }),
      setScore: (score) => set({ score }),
      setHighScore: (score) => set({ highScore: score }),
      addScore: (points) => set((state) => ({ 
        score: state.score + points,
        sessionScore: state.sessionScore + points
      })),
      setLevel: (level) => set({ level }),
      setRemaining: (count) => set({ remaining: count }),
      incrementCatches: () => set((state) => ({ 
        totalCatches: state.totalCatches + 1,
        sessionCatches: state.sessionCatches + 1
      })),
      
      selectRod: (rod) => set({ selectedRod: rod }),
      selectLure: (lure) => set({ selectedLure: lure }),
      unlockLure: (lure) => set((state) => ({
        unlockedLures: state.unlockedLures.includes(lure) 
          ? state.unlockedLures 
          : [...state.unlockedLures, lure]
      })),
      
      setGameState: (state) => set({ gameState: state }),
      setFishingState: (state) => set({ fishingState: state }),
      setCurrentStage: (stage) => set({ currentStage: stage }),
      setDifficulty: (diff) => {
        const fishCounts = [100, 150, 200, 250];
        set({ difficulty: diff, fishPerLevel: fishCounts[diff], remaining: fishCounts[diff] });
      },
      
      setCurrentFish: (fish) => set({ currentFish: fish }),
      setTension: (tension) => set({ tension }),
      setCastDistance: (distance) => set({ castDistance: distance }),
      
      setWeather: (weather) => set({ weather }),
      setTimeOfDay: (tod) => set({ timeOfDay: tod }),
      
      // Combo system
      incrementCombo: () => set((state) => ({
        combo: state.combo + 1,
        maxCombo: Math.max(state.maxCombo, state.combo + 1)
      })),
      resetCombo: () => set({ combo: 0 }),
      
      // Perfect catches
      incrementPerfectCatches: () => set((state) => ({
        perfectCatches: state.perfectCatches + 1
      })),
      
      // Rod durability
      decreaseRodDurability: (amount = 1) => set((state) => ({
        rodDurability: Math.max(0, state.rodDurability - amount)
      })),
      repairRod: () => set({ rodDurability: 100 }),
      
      // Achievements
      addAchievement: (achievementId) => set((state) => ({
        achievements: state.achievements.includes(achievementId)
          ? state.achievements
          : [...state.achievements, achievementId]
      })),
      
      // Whale & Storm stats
      incrementWhalesSeen: () => set((state) => ({
        whalesSeen: state.whalesSeen + 1
      })),
      incrementStormCatches: () => set((state) => ({
        stormCatches: state.stormCatches + 1
      })),
      
      // Visual events
      setShowWhale: (show) => set({ showWhale: show }),
      setShowBoat: (show, type = 0) => set({ showBoat: show, boatType: type }),
      setShowLightning: (show) => set({ showLightning: show }),
      triggerParticles: (type) => set({ showParticles: true, particleType: type }),
      clearParticles: () => set({ showParticles: false, particleType: null }),
      
      // Daily challenge
      setDailyChallenge: (challenge) => set({ dailyChallenge: challenge }),
      updateDailyChallengeProgress: (progress) => set({ dailyChallengeProgress: progress }),
      completeDailyChallenge: () => set({ dailyChallengeCompleted: true }),
      
      // Settings
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      toggleVibration: () => set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),
      
      // Prestige system
      prestige: () => set((state) => {
        // Clear tacklebox items but keep stats
        return {
          prestige: state.prestige + 1,
          level: 1,
          score: 0,
          remaining: state.fishPerLevel,
          sessionCatches: 0,
          sessionScore: 0,
          combo: 0,
          tacklebox: {
            ...state.tacklebox,
            items: [],
            fishByType: {},
            fishByStage: {},
            totalValue: 0,
          }
        };
      }),
      
      resetGame: () => {
        const { difficulty, fishPerLevel } = get();
        set({
          score: 0,
          level: 1,
          remaining: fishPerLevel,
          sessionCatches: 0,
          sessionScore: 0,
          fishingState: 'idle',
          currentFish: null,
          tension: 0,
          castDistance: 0,
          combo: 0,
        });
      },
      
      // Full reset
      fullReset: () => set({
        score: 0,
        highScore: 0,
        level: 1,
        remaining: FISH_PER_LEVEL,
        totalCatches: 0,
        prestige: 0,
        combo: 0,
        maxCombo: 0,
        perfectCatches: 0,
        sessionCatches: 0,
        sessionScore: 0,
        whalesSeen: 0,
        stormCatches: 0,
        achievements: [],
        rodDurability: 100,
        tacklebox: {
          items: [],
          capacity: 10000,
          totalFishCaught: 0,
          rareFishCount: 0,
          largestFish: null,
          smallestFish: null,
          fishByType: {},
          fishByStage: {},
          totalValue: 0,
        },
      }),
      
      // ========== DEV/TEST HELPERS ==========
      // Simulate catching fish (for testing)
      simulateCatch: (fishData) => {
        const state = get();
        const fish = {
          ...fishData,
          actualSize: fishData.size + Math.floor(Math.random() * 30),
          isPerfect: Math.random() < 0.3,
        };
        
        // Add to tacklebox
        state.addFishToTacklebox(fish);
        
        // Update stats
        set((s) => ({
          score: s.score + fish.points,
          totalCatches: s.totalCatches + 1,
          sessionCatches: s.sessionCatches + 1,
          remaining: s.remaining - 1,
        }));
        
        // Check level up
        if (state.remaining <= 1) {
          set((s) => ({
            level: s.level + 1,
            remaining: s.fishPerLevel,
          }));
        }
      },
      
      // Fast forward to level (for testing)
      setLevelForTesting: (targetLevel) => {
        const state = get();
        set({
          level: targetLevel,
          remaining: state.fishPerLevel,
        });
      },
    }),
    {
      name: 'fishing-game-storage',
      partialize: (state) => ({
        deviceId: state.deviceId,
        userId: state.userId,
        username: state.username,
        highScore: state.highScore,
        totalCatches: state.totalCatches,
        unlockedLures: state.unlockedLures,
        achievements: state.achievements,
        prestige: state.prestige,
        whalesSeen: state.whalesSeen,
        stormCatches: state.stormCatches,
        perfectCatches: state.perfectCatches,
        maxCombo: state.maxCombo,
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        tacklebox: state.tacklebox,
      }),
    }
  )
);

export default useGameStore;
