// ========== RODS ==========
export const RODS = [
  { name: 'Basic Rod', castDistance: 180, reelSpeed: 1.2, color: '#8B4513', durability: 100 },
  { name: 'Carbon Rod', castDistance: 240, reelSpeed: 1.6, color: '#404040', durability: 150 },
  { name: 'Pro Rod', castDistance: 300, reelSpeed: 2.0, color: '#FFD700', durability: 200 },
];

// ========== LURES ==========
export const LURES = [
  { name: 'Bobber', attraction: 1.0, wobble: 0.5, price: 0, unlockLevel: 0, color: '#FF6B6B', stageBonus: [0] },
  { name: 'Spoon', attraction: 1.6, wobble: 2.0, price: 500, unlockLevel: 5, color: '#C0C0C0', stageBonus: [2, 3] },
  { name: 'Worm', attraction: 2.2, wobble: 1.2, price: 1000, unlockLevel: 10, color: '#8B4513', stageBonus: [0, 1] },
];

// ========== FISH TYPES ==========
export const FISH_TYPES = [
  { name: 'Minnow', size: 30, rarity: 0, points: 10, color: '#8B5A2B', timePreference: 'any' },
  { name: 'Perch', size: 50, rarity: 1, points: 25, color: '#4CAF50', timePreference: 'day' },
  { name: 'Bass', size: 70, rarity: 1, points: 40, color: '#FF5722', timePreference: 'any' },
  { name: 'Catfish', size: 90, rarity: 2, points: 80, color: '#795548', timePreference: 'night' },
  { name: 'Pike', size: 110, rarity: 2, points: 120, color: '#2196F3', timePreference: 'dusk' },
  { name: 'Golden Koi', size: 130, rarity: 3, points: 300, color: '#FFD700', timePreference: 'any' },
];

// ========== BOAT TYPES ==========
export const BOAT_TYPES = [
  { name: 'Rowboat', width: 60, height: 40, points: 50 },
  { name: 'Sailboat', width: 80, height: 60, points: 100 },
  { name: 'Steamship', width: 120, height: 80, points: 200 },
  { name: 'Battleship', width: 160, height: 100, points: 500 },
  { name: 'Super Carrier', width: 220, height: 140, points: 1000 },
];

// ========== STAGES ==========
export const STAGES = [
  {
    name: 'Sunny Lake Pier',
    skyColors: ['#87CEEB', '#E0F6FF'],
    waterColors: ['#4682B4', '#1E3A5F'],
    timeOfDay: 'day',
    features: { lily: true, boat: false, rain: false, lightning: false },
  },
  {
    name: 'Twilight River Boat',
    skyColors: ['#FF6B35', '#2A4D69'],
    waterColors: ['#2A4D69', '#0D1B2A'],
    timeOfDay: 'dusk',
    features: { lily: false, boat: true, rain: false, lightning: false },
  },
  {
    name: 'Deep Ocean Night',
    skyColors: ['#0a2b5c', '#001122'],
    waterColors: ['#003366', '#000814'],
    timeOfDay: 'night',
    features: { lily: false, boat: false, rain: false, lightning: false },
  },
  {
    name: 'Stormy Sea Wreck',
    skyColors: ['#1a1a2e', '#0a2b5c'],
    waterColors: ['#16213e', '#0f3460'],
    timeOfDay: 'night',
    features: { lily: false, boat: false, rain: true, lightning: true },
  },
];

// ========== DIFFICULTY LEVELS ==========
export const DIFFICULTY_LEVELS = [
  { name: 'Beginner', fishPerLevel: 100, tensionMultiplier: 0.7 },
  { name: 'Casual', fishPerLevel: 150, tensionMultiplier: 1.0 },
  { name: 'Pro', fishPerLevel: 200, tensionMultiplier: 1.3 },
  { name: 'Master', fishPerLevel: 250, tensionMultiplier: 1.6 },
];

// ========== WEATHER MODIFIERS ==========
export const getWeatherModifiers = (weather) => {
  if (!weather) return { castMult: 1, biteMult: 1, resistMult: 0, visMult: 1 };
  
  return {
    castMult: Math.max(0.5, 1 - weather.wind_speed / 30),
    biteMult: weather.condition === 'rain' ? 1.6 : weather.condition === 'storm' ? 0.5 : 1,
    resistMult: weather.wind_speed / 25 + (weather.precipitation > 40 ? 0.4 : 0),
    visMult: Math.max(0.4, 1 - weather.cloud_cover / 120),
  };
};

// ========== ACHIEVEMENTS ==========
export const ACHIEVEMENTS = [
  { id: 'first_catch', name: 'First Catch', description: 'Catch your first fish', icon: '🐟' },
  { id: 'catch_100', name: 'Century Fisher', description: 'Catch 100 fish', icon: '💯' },
  { id: 'catch_1000', name: 'Master Angler', description: 'Catch 1000 fish', icon: '🏆' },
  { id: 'golden_koi', name: 'Legendary Hunter', description: 'Catch a Golden Koi', icon: '⭐' },
  { id: 'level_10', name: 'Rising Star', description: 'Reach level 10', icon: '🌟' },
  { id: 'level_50', name: 'Pro Angler', description: 'Reach level 50', icon: '🎖️' },
  { id: 'level_100', name: 'Fishing Legend', description: 'Reach level 100', icon: '👑' },
  { id: 'prestige_1', name: 'Reborn', description: 'Prestige for the first time', icon: '♻️' },
  { id: 'all_lures', name: 'Collector', description: 'Unlock all lures', icon: '🎣' },
  { id: 'perfect_10', name: 'Perfectionist', description: 'Get 10 perfect catches', icon: '✨' },
  { id: 'whale_watcher', name: 'Whale Watcher', description: 'See the whale 10 times', icon: '🐋' },
  { id: 'storm_fisher', name: 'Storm Chaser', description: 'Catch 50 fish in storms', icon: '⛈️' },
];

// ========== LEVEL MILESTONES ==========
export const LEVEL_MILESTONES = {
  10: { reward: 1000, title: 'Rising Star' },
  50: { reward: 5000, title: 'Pro Angler' },
  100: { reward: 10000, title: 'Master Fisher' },
  200: { reward: 25000, title: 'Legendary Angler' },
};

// ========== HELPER FUNCTIONS ==========
export const selectRandomFish = (selectedLure, timeOfDay) => {
  const lure = LURES[selectedLure];
  const rand = Math.random();
  
  // Golden Koi: 1/1000 chance (0.1%)
  if (rand < 0.001) {
    return FISH_TYPES[5];
  }
  
  // Filter fish by time preference
  const availableFish = FISH_TYPES.filter(fish => 
    fish.timePreference === 'any' || fish.timePreference === timeOfDay
  );
  
  const weightedRand = Math.random() * lure.attraction * 2;
  
  if (weightedRand > 2.8) return FISH_TYPES[4]; // Pike
  if (weightedRand > 2.0) return FISH_TYPES[3]; // Catfish
  if (weightedRand > 1.2) return FISH_TYPES[2]; // Bass
  if (weightedRand > 0.6) return FISH_TYPES[1]; // Perch
  return FISH_TYPES[0]; // Minnow
};

export const calculateFishSize = (baseSize) => {
  // Random size variation: 80% to 150% of base size
  const multiplier = 0.8 + Math.random() * 0.7;
  return Math.round(baseSize * multiplier);
};

export const isPerfectCatch = (tension) => {
  return tension < 0.3;
};
