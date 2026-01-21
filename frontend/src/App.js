import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { apiService } from './lib/api';
import { retroSounds } from './lib/audioManager';
import { 
  STAGES, RODS, LURES, FISH_TYPES, 
  getWeatherModifiers, selectRandomFish, calculateFishSize, isPerfectCatch,
  ACHIEVEMENTS, LEVEL_MILESTONES
} from './lib/gameData';
import {
  RetroBackground,
  PixelFish,
  PixelBobber,
  WaterSplash,
  ParticleEffects,
  WhaleSprite,
  BoatSprite,
  FlyingBirds,
  AnimatedIsland,
  AnimatedBoats,
} from './components/GameSprites';
import { toast, Toaster } from 'sonner';
import './App.css';

// ========== SEASONS ==========
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_ICONS = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const SEASON_COLORS = {
  spring: 'from-pink-400 to-green-400',
  summer: 'from-yellow-400 to-blue-400',
  autumn: 'from-orange-400 to-amber-600',
  winter: 'from-blue-200 to-gray-400',
};

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

// Device ID
const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('fishing_device_id');
  if (!deviceId) {
    deviceId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('fishing_device_id', deviceId);
  }
  return deviceId;
};

function App() {
  const store = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [castProgress, setCastProgress] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const [bobberY, setBobberY] = useState(0);
  const [fishSwim, setFishSwim] = useState(0);
  const [showTacklebox, setShowTacklebox] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [flyingFish, setFlyingFish] = useState(null);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  
  // New: Season & visuals
  const [currentSeason, setCurrentSeason] = useState(getCurrentSeason());
  const [showBoat, setShowBoat] = useState(false);
  const [boatType, setBoatType] = useState(0);
  const [showWhale, setShowWhale] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  const biteTimeoutRef = useRef(null);
  const bobberAnimRef = useRef(null);
  const fishAnimRef = useRef(null);
  const boatTimerRef = useRef(null);
  const whaleTimerRef = useRef(null);

  useEffect(() => {
    initializeGame();
    return () => clearAllTimers();
  }, []);

  // Boat timer
  useEffect(() => {
    if (store.gameState === 'playing') {
      boatTimerRef.current = setInterval(() => {
        setBoatType(prev => (prev + 1) % 5);
        setShowBoat(true);
        setTimeout(() => setShowBoat(false), 25000);
      }, 60000); // Every minute
      
      // Show first boat after 10 seconds
      setTimeout(() => {
        setShowBoat(true);
        setTimeout(() => setShowBoat(false), 25000);
      }, 10000);
    }
    return () => clearInterval(boatTimerRef.current);
  }, [store.gameState]);

  // Whale timer (ocean/storm stages)
  useEffect(() => {
    if (store.gameState === 'playing' && store.currentStage >= 2) {
      whaleTimerRef.current = setInterval(() => {
        setShowWhale(true);
        setTimeout(() => setShowWhale(false), 20000);
      }, 180000); // Every 3 minutes
    }
    return () => clearInterval(whaleTimerRef.current);
  }, [store.gameState, store.currentStage]);

  // Music toggle
  useEffect(() => {
    if (musicEnabled && store.gameState === 'playing') {
      retroSounds.startMusic(currentSeason);
    } else {
      retroSounds.stopMusic();
    }
    return () => retroSounds.stopMusic();
  }, [musicEnabled, store.gameState, currentSeason]);

  // Volume control
  useEffect(() => {
    retroSounds.setVolume(volume);
  }, [volume]);

  const clearAllTimers = () => {
    clearTimeout(biteTimeoutRef.current);
    cancelAnimationFrame(bobberAnimRef.current);
    cancelAnimationFrame(fishAnimRef.current);
    clearInterval(boatTimerRef.current);
    clearInterval(whaleTimerRef.current);
    retroSounds.stopMusic();
  };

  const initializeGame = async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      store.setDeviceId(deviceId);
      
      try {
        const user = await apiService.createOrGetUser(deviceId, store.username);
        store.setUserId(user.id);
        store.setHighScore(user.high_score || 0);
        (user.unlocked_lures || []).forEach(lure => store.unlockLure(lure));
        (user.achievements || []).forEach(ach => store.addAchievement(ach));
      } catch (e) {}
      
      try {
        const weather = await apiService.getWeather();
        store.setWeather(weather);
      } catch (e) {}
      
      const hour = new Date().getHours();
      store.setTimeOfDay(hour >= 7 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night');
      
      setTimeout(() => setIsLoading(false), 1000);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const showMessage = (msg, duration = 2000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  };

  const animateScore = () => {
    setScoreAnimation(true);
    setTimeout(() => setScoreAnimation(false), 300);
  };

  const checkAchievements = useCallback(() => {
    const { totalCatches, level, unlockedLures, perfectCatches, achievements, addAchievement } = store;
    const unlock = (id) => {
      if (!achievements.includes(id)) {
        addAchievement(id);
        retroSounds.achievement();
        toast.success(`🏆 ${ACHIEVEMENTS.find(a => a.id === id)?.name}!`);
      }
    };
    if (totalCatches >= 1) unlock('first_catch');
    if (totalCatches >= 100) unlock('catch_100');
    if (level >= 10) unlock('level_10');
    if (level >= 50) unlock('level_50');
    if (unlockedLures.length >= 3) unlock('all_lures');
    if (perfectCatches >= 10) unlock('perfect_10');
  }, [store]);

  const animateFishToTacklebox = (fish) => {
    setFlyingFish({ ...fish });
    setTimeout(() => setFlyingFish(null), 800);
  };

  // ========== FISHING ==========
  const handleCast = () => {
    if (store.fishingState !== 'idle') return;
    clearTimeout(biteTimeoutRef.current);
    retroSounds.cast();
    store.setFishingState('casting');
    
    let progress = 0;
    const castInterval = setInterval(() => {
      progress += 0.06;
      setCastProgress(progress);
      if (progress >= 1) {
        clearInterval(castInterval);
        setShowSplash(true);
        retroSounds.splash();
        setTimeout(() => setShowSplash(false), 500);
        store.setFishingState('waiting');
        
        let bobberFrame = 0;
        const animateBobber = () => {
          bobberFrame++;
          setBobberY(Math.sin(bobberFrame * 0.04) * 6);
          bobberAnimRef.current = requestAnimationFrame(animateBobber);
        };
        animateBobber();
        
        const lure = LURES[store.selectedLure];
        const biteDelay = (Math.random() * 2500 + 1500) / lure.attraction;
        biteTimeoutRef.current = setTimeout(triggerBite, biteDelay);
      }
    }, 40);
  };

  const triggerBite = () => {
    if (store.vibrationEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    store.setFishingState('bite');
    retroSounds.bite();
    showMessage('⚡ TAP REEL! ⚡', 1500);
    
    cancelAnimationFrame(bobberAnimRef.current);
    let shakeFrame = 0;
    const shakeBobber = () => {
      shakeFrame++;
      setBobberY(Math.sin(shakeFrame * 0.4) * 12);
      if (store.fishingState === 'bite') bobberAnimRef.current = requestAnimationFrame(shakeBobber);
    };
    shakeBobber();
    
    setTimeout(() => {
      if (store.fishingState === 'bite') {
        retroSounds.miss();
        store.setFishingState('idle');
        store.resetCombo();
        showMessage('Missed!');
        cancelAnimationFrame(bobberAnimRef.current);
        setBobberY(0);
        setCastProgress(0);
      }
    }, 1500);
  };

  const handleReel = () => {
    if (store.fishingState !== 'bite') return;
    cancelAnimationFrame(bobberAnimRef.current);
    setBobberY(0);
    
    const fishType = selectRandomFish(store.selectedLure, store.timeOfDay);
    const fish = { ...fishType, actualSize: calculateFishSize(fishType.size), resistance: 0.2 + fishType.rarity * 0.1 };
    store.setCurrentFish(fish);
    store.setFishingState('reeling');
    store.setTension(0.15);
    
    let fishFrame = 0;
    const animateFish = () => {
      fishFrame++;
      setFishSwim(Math.sin(fishFrame * 0.06) * 12);
      if (store.fishingState === 'reeling') fishAnimRef.current = requestAnimationFrame(animateFish);
    };
    animateFish();
    
    simulateReeling(fish);
  };

  const simulateReeling = (fish) => {
    let reelTime = 0;
    const reelInterval = setInterval(() => {
      const state = useGameStore.getState();
      if (state.fishingState !== 'reeling') {
        clearInterval(reelInterval);
        cancelAnimationFrame(fishAnimRef.current);
        setFishSwim(0);
        return;
      }
      
      reelTime += 150;
      const rod = RODS[state.selectedRod];
      let newTension = state.tension + (fish.resistance * 0.03);
      newTension = Math.max(0, newTension - rod.reelSpeed * 0.08);
      if (Math.random() < 0.04) newTension += 0.06;
      
      store.setTension(Math.min(1, newTension));
      
      if (newTension >= 1.0) {
        clearInterval(reelInterval);
        retroSounds.miss();
        store.setFishingState('lost');
        showMessage('Line broke!');
        setTimeout(() => { store.setFishingState('idle'); store.setCurrentFish(null); setCastProgress(0); }, 1200);
        return;
      }
      
      if (reelTime >= 2000 || (reelTime >= 1500 && newTension < 0.9)) {
        clearInterval(reelInterval);
        catchFish(fish, newTension);
      }
    }, 150);
  };

  const catchFish = async (fish, finalTension) => {
    store.setFishingState('caught');
    retroSounds.catch();
    
    const perfect = isPerfectCatch(finalTension);
    let points = Math.round(fish.points * (1 + store.combo * 0.1));
    if (perfect) { points *= 2; store.incrementPerfectCatches(); retroSounds.perfect(); }
    
    store.addFishToTacklebox({ ...fish, isPerfect: perfect, caughtAt: new Date().toISOString() });
    animateFishToTacklebox(fish);
    
    store.addScore(points);
    store.incrementCatches();
    store.incrementCombo();
    store.setRemaining(store.remaining - 1);
    animateScore();
    
    showMessage(perfect ? `✨ PERFECT! +${points}` : `+${points} ${fish.name}`, 2000);
    
    if (store.remaining <= 0) {
      const newLevel = store.level + 1;
      store.setLevel(newLevel);
      store.setRemaining(store.fishPerLevel);
      retroSounds.levelUp();
      if (LEVEL_MILESTONES[newLevel]) {
        store.addScore(LEVEL_MILESTONES[newLevel].reward);
        toast.success(`🎉 Level ${newLevel}! +${LEVEL_MILESTONES[newLevel].reward}`);
      }
    }
    
    if (store.score > store.highScore) store.setHighScore(store.score);
    checkAchievements();
    
    setTimeout(() => {
      store.setFishingState('idle');
      store.setCurrentFish(null);
      setCastProgress(0);
      setTimeout(() => { if (store.gameState === 'playing' && store.fishingState === 'idle') handleCast(); }, 1000);
    }, 2000);
  };

  const loadLeaderboard = async () => {
    try { setLeaderboardData(await apiService.getLeaderboard(100)); } catch (e) {}
  };

  // ========== RENDER ==========
  
  // Loading Screen with seasonal theme
  if (isLoading) {
    return (
      <div className={`h-screen flex items-center justify-center bg-gradient-to-b ${SEASON_COLORS[currentSeason]}`}>
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-6 animate-float">{SEASON_ICONS[currentSeason]} 🎣</div>
          <h1 className="text-4xl font-bold text-white font-pixel mb-4 drop-shadow-lg">GO FISH!</h1>
          <p className="text-white/80 mb-4 capitalize">{currentSeason} Edition</p>
          <div className="w-48 h-2 bg-white/30 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white animate-pulse rounded-full" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Menu Screen with seasonal theme
  if (store.gameState === 'menu') {
    return (
      <div className={`h-screen menu-bg flex flex-col items-center justify-center p-6 relative overflow-hidden`} data-testid="menu-screen">
        <Toaster position="top-center" richColors />
        
        {/* Seasonal background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b ${SEASON_COLORS[currentSeason]} opacity-20`} />
        
        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} className="floating-particle" style={{
            left: `${5 + i * 8}%`,
            top: `${15 + (i % 4) * 20}%`,
            animationDelay: `${i * 0.3}s`,
            opacity: 0.4,
          }} />
        ))}
        
        {/* Season indicator */}
        <div className="absolute top-4 right-4 glass-panel rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-2xl">{SEASON_ICONS[currentSeason]}</span>
          <span className="text-white capitalize text-sm">{currentSeason}</span>
        </div>
        
        {/* Logo */}
        <div className="animate-slide-down mb-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold font-pixel gradient-text logo-glow tracking-wider">
            GO FISH!
          </h1>
          <p className="text-center text-gray-400 text-sm mt-2">Fishing Master 2025</p>
        </div>
        
        {/* Animated Fish */}
        <div className="mb-8 animate-float relative z-10">
          <div className="animate-fish-swim">
            <PixelFish color="#FFD700" size={90} />
          </div>
        </div>
        
        {/* Menu Buttons */}
        <div className="space-y-3 w-64 relative z-10">
          <button onClick={() => { retroSounds.select(); store.setGameState('stage_select'); }}
            className="menu-item-1 w-full h-14 btn-primary rounded-xl font-bold text-lg text-white tracking-wide flex items-center justify-center gap-2"
            data-testid="start-button">
            <span className="text-xl">▶</span> PLAY
          </button>
          
          <button onClick={() => { retroSounds.select(); loadLeaderboard(); setShowLeaderboard(true); }}
            className="menu-item-2 w-full h-12 btn-secondary rounded-xl font-bold text-white flex items-center justify-center gap-2"
            data-testid="leaderboard-button">
            <span>🏆</span> LEADERBOARD
          </button>
          
          <button onClick={() => { retroSounds.select(); setShowAchievements(true); }}
            className="menu-item-3 w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(180deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)', border: '2px solid #c4b5fd', boxShadow: '0 4px 0 #5b21b6' }}
            data-testid="achievements-button">
            <span>⭐</span> ACHIEVEMENTS
          </button>
          
          <button onClick={() => { retroSounds.select(); setShowSettings(true); }}
            className="menu-item-4 w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 border-2 border-gray-500"
            data-testid="settings-button">
            <span>⚙️</span> SETTINGS
          </button>
        </div>
        
        {/* Stats */}
        <div className="mt-8 glass-panel rounded-xl px-6 py-3 relative z-10">
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-xs text-gray-400">HIGH SCORE</p>
              <p className="text-xl font-bold text-yellow-400">{store.highScore.toLocaleString()}</p>
            </div>
            <div className="w-px bg-gray-600" />
            <div>
              <p className="text-xs text-gray-400">CATCHES</p>
              <p className="text-xl font-bold text-green-400">{store.totalCatches.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/80">
            <div className="glass-panel rounded-2xl p-6 w-full max-w-md animate-modal">
              <h2 className="text-2xl font-bold text-center mb-6 gradient-text">⚙️ SETTINGS</h2>
              
              {/* Season Selector */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Season Theme</p>
                <div className="flex gap-2">
                  {SEASONS.map(s => (
                    <button key={s} onClick={() => setCurrentSeason(s)}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${currentSeason === s ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'}`}>
                      <div className="text-xl mb-1">{SEASON_ICONS[s]}</div>
                      <div className="text-xs capitalize">{s}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Music Toggle */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">🎵 Ambient Music</span>
                  <button onClick={() => setMusicEnabled(!musicEnabled)}
                    className={`w-14 h-8 rounded-full transition-all ${musicEnabled ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${musicEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              
              {/* Volume */}
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">Volume: {Math.round(volume * 100)}%</p>
                <input type="range" min="0" max="100" value={volume * 100}
                  onChange={(e) => setVolume(e.target.value / 100)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              </div>
              
              <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all">
                CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/80">
            <div className="glass-panel rounded-2xl p-6 w-full max-w-md max-h-[75vh] overflow-auto animate-modal">
              <h2 className="text-2xl font-bold text-center mb-6 gradient-text">🏆 LEADERBOARD</h2>
              <div className="space-y-2">
                {leaderboardData.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No scores yet!</p>
                ) : (
                  leaderboardData.slice(0, 10).map((entry, i) => (
                    <div key={i} className={`leaderboard-entry ${i < 3 ? 'top-3' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-300 text-black' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-700'}`}>{i + 1}</span>
                        <span className="text-white">{entry.username}</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{entry.score.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setShowLeaderboard(false)} className="w-full mt-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold">CLOSE</button>
            </div>
          </div>
        )}

        {/* Achievements Modal */}
        {showAchievements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/80">
            <div className="glass-panel rounded-2xl p-6 w-full max-w-md max-h-[75vh] overflow-auto animate-modal">
              <h2 className="text-2xl font-bold text-center mb-6 gradient-text">⭐ ACHIEVEMENTS</h2>
              <div className="grid grid-cols-4 gap-4">
                {ACHIEVEMENTS.map((ach) => (
                  <div key={ach.id} className={`achievement-badge ${store.achievements.includes(ach.id) ? 'unlocked' : 'locked'}`} title={ach.description}>
                    {ach.icon}
                  </div>
                ))}
              </div>
              <p className="text-center text-gray-400 mt-6">{store.achievements.length} / {ACHIEVEMENTS.length}</p>
              <button onClick={() => setShowAchievements(false)} className="w-full mt-4 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold">CLOSE</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stage Select
  if (store.gameState === 'stage_select') {
    const stages = [
      { name: 'SUNNY LAKE', icon: '☀️', color: 'from-sky-400 to-sky-600', shadow: '#0369a1' },
      { name: 'SUNSET RIVER', icon: '🌅', color: 'from-orange-400 to-orange-600', shadow: '#c2410c' },
      { name: 'DEEP OCEAN', icon: '🌙', color: 'from-indigo-600 to-indigo-900', shadow: '#312e81' },
      { name: 'STORM SEA', icon: '⛈️', color: 'from-gray-600 to-gray-800', shadow: '#1f2937' },
    ];
    
    return (
      <div className="h-screen menu-bg flex flex-col items-center justify-center p-6" data-testid="stage-select">
        <Toaster position="top-center" richColors />
        
        <h2 className="text-3xl font-bold mb-8 animate-slide-down gradient-text">SELECT STAGE</h2>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {stages.map((stage, i) => (
            <button key={i} onClick={() => { retroSounds.select(); store.setCurrentStage(i); store.setGameState('playing'); store.resetGame(); if (musicEnabled) retroSounds.startMusic(currentSeason); }}
              className={`menu-item-${i + 1} h-24 rounded-xl bg-gradient-to-b ${stage.color} border-2 border-white/50 font-bold text-white flex flex-col items-center justify-center gap-1 transition-all hover:scale-105`}
              style={{ boxShadow: `0 4px 0 ${stage.shadow}` }}
              data-testid={`stage-${i}`}>
              <span className="text-2xl">{stage.icon}</span>
              <span className="text-sm">{stage.name}</span>
            </button>
          ))}
        </div>
        
        <button onClick={() => { retroSounds.select(); store.setGameState('menu'); }}
          className="mt-8 px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold border-2 border-gray-500"
          data-testid="back-button">← BACK</button>
      </div>
    );
  }

  // Lure Shop
  if (store.gameState === 'shop') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/90">
        <Toaster position="top-center" richColors />
        <div className="glass-panel rounded-2xl p-6 w-full max-w-sm animate-modal">
          <h2 className="text-2xl font-bold text-center mb-2 gradient-text">LURE SHOP</h2>
          <p className="text-center text-yellow-400 mb-6">Points: {store.score.toLocaleString()}</p>
          <div className="space-y-3">
            {LURES.map((lure, i) => {
              const owned = store.unlockedLures.includes(i);
              return (
                <div key={i} className={`flex justify-between items-center p-4 rounded-xl ${owned ? 'bg-green-900/30 border border-green-500/50' : 'bg-gray-800/50 border border-gray-600'}`}>
                  <div>
                    <p className="font-bold text-white">{lure.name}</p>
                    <p className="text-xs text-gray-400">ATR: {lure.attraction}x</p>
                  </div>
                  {owned ? <span className="text-green-400 font-bold">✓ OWNED</span> : (
                    <button onClick={() => {
                      if (store.score >= lure.price) { store.addScore(-lure.price); store.unlockLure(i); toast.success(`${lure.name} unlocked!`); }
                      else toast.error(`Need ${lure.price - store.score} more!`);
                    }} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg">{lure.price} PTS</button>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => store.setGameState('playing')} className="w-full mt-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold">CLOSE</button>
        </div>
      </div>
    );
  }

  // Tacklebox Modal
  if (showTacklebox) {
    const stats = store.getTackleboxStats();
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/90">
        <Toaster position="top-center" richColors />
        <div className="glass-panel rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-auto animate-modal">
          <h2 className="text-2xl font-bold text-center mb-4 gradient-text">🎒 TACKLEBOX</h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[{ label: 'FISH', value: stats.totalFishCaught, color: 'text-yellow-400' }, { label: 'VALUE', value: stats.totalValue, color: 'text-green-400' }, { label: 'RARE', value: stats.rareFishCount, color: 'text-purple-400' }, { label: 'TYPES', value: `${stats.uniqueTypes}/6`, color: 'text-blue-400' }].map((stat, i) => (
              <div key={i} className="stat-card text-center">
                <p className="text-[10px] text-gray-400">{stat.label}</p>
                <p className={`font-bold ${stat.color}`}>{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              </div>
            ))}
          </div>
          {stats.largestFish && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4 flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <PixelFish color={stats.largestFish.color} size={32} />
              <div><p className="text-white font-bold">{stats.largestFish.name}</p><p className="text-yellow-400 text-sm">{stats.largestFish.size}cm</p></div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {FISH_TYPES.map((fish) => {
              const count = stats.fishByType[fish.name] || 0;
              return (
                <div key={fish.name} className={`fish-grid-item ${count > 0 ? 'unlocked' : ''}`}>
                  <div className="flex justify-center mb-1"><PixelFish color={fish.color} size={36} /></div>
                  <p className="text-xs text-center text-white">{fish.name}</p>
                  <p className="text-xs text-center text-yellow-400">×{count}</p>
                </div>
              );
            })}
          </div>
          <button onClick={() => setShowTacklebox(false)} className="w-full mt-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold">CLOSE</button>
        </div>
      </div>
    );
  }

  // ========== MAIN GAME ==========
  const stageData = STAGES[store.currentStage];
  const tensionLevel = store.tension > 0.7 ? 'danger' : store.tension > 0.4 ? 'warning' : 'safe';
  
  return (
    <div className="h-screen flex flex-col bg-black overflow-hidden" data-testid="game-screen">
      <Toaster position="top-center" richColors />
      
      {/* Game Area - 72% */}
      <div className="relative" style={{ height: '72%' }}>
        <RetroBackground stage={store.currentStage} timeOfDay={store.timeOfDay} showRain={stageData.features.rain} showLightning={store.showLightning} season={currentSeason} />
        
        {/* Flying Birds */}
        <FlyingBirds count={store.currentStage === 0 ? 5 : 3} direction={store.currentStage % 2 === 0 ? 'right' : 'left'} />
        
        {/* Island */}
        <AnimatedIsland season={currentSeason} side="right" />
        
        {/* Boats */}
        <AnimatedBoats show={showBoat} type={boatType} season={currentSeason} />
        
        {/* Whale */}
        <WhaleSprite show={showWhale} />
        
        {/* Bobber */}
        {(store.fishingState === 'waiting' || store.fishingState === 'bite') && (
          <div className={`absolute left-1/2 bobber ${store.fishingState === 'bite' ? 'active' : ''}`}
            style={{ top: '55%', transform: `translateX(-50%) translateY(${bobberY}px)` }}>
            <PixelBobber isActive={store.fishingState === 'bite'} wobble={store.fishingState === 'waiting'} />
          </div>
        )}
        
        {/* Splash */}
        {showSplash && <WaterSplash x={window.innerWidth / 2} y={window.innerHeight * 0.4} />}
        
        {/* Fish */}
        {store.currentFish && store.fishingState === 'reeling' && (
          <div className="absolute left-1/2 caught-fish" style={{ top: '58%', transform: `translateX(${fishSwim - 50}%)` }}>
            <PixelFish color={store.currentFish.color} size={store.currentFish.size * 0.7} wiggle />
          </div>
        )}
        
        {/* Flying fish to tacklebox */}
        {flyingFish && (
          <div className="absolute animate-fish-to-box z-50" style={{ left: '50%', top: '55%' }}>
            <PixelFish color={flyingFish.color} size={30} />
          </div>
        )}
        
        {/* Particles */}
        {store.showParticles && <ParticleEffects type={store.particleType} x={window.innerWidth / 2} y={window.innerHeight * 0.4} />}
        
        {/* Message */}
        {message && (
          <div className="absolute top-6 left-0 right-0 flex justify-center z-50">
            <div className="game-message"><p className="text-yellow-400 font-bold text-lg">{message}</p></div>
          </div>
        )}
        
        {/* Season indicator */}
        <div className="absolute top-2 left-2 glass-panel rounded-lg px-3 py-1 flex items-center gap-2 z-30">
          <span>{SEASON_ICONS[currentSeason]}</span>
          <span className="text-white text-xs capitalize">{currentSeason}</span>
        </div>
      </div>
      
      {/* UI Panel - 28% */}
      <div className="ui-panel glass-panel flex flex-col border-t-2 border-yellow-500/50" style={{ height: '28%' }}>
        <div className="flex items-center gap-2 px-3 py-2 bg-black/40">
          <div className="flex gap-2 flex-1">
            <div className={`stat-card ${scoreAnimation ? 'animate-score-pop' : ''}`}>
              <span className="text-[10px] text-gray-400 mr-1">SCORE</span>
              <span className="text-yellow-400 font-bold">{store.score.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="text-[10px] text-gray-400 mr-1">LV</span>
              <span className="text-green-400 font-bold">{store.level}</span>
            </div>
            {store.combo > 1 && <div className="stat-card bg-green-900/50 border-green-500/50"><span className="text-green-400 font-bold">×{store.combo}</span></div>}
          </div>
          {store.fishingState === 'reeling' && (
            <div className="flex-1 tension-bar"><div className={`tension-fill tension-${tensionLevel}`} style={{ width: `${store.tension * 100}%` }} /></div>
          )}
        </div>
        
        <div className="flex-1 flex items-center justify-between px-4">
          <div className="flex items-end gap-3">
            <div className="tacklebox-sprite" onClick={() => setShowTacklebox(true)} data-testid="tacklebox-sprite">
              <div className="relative">
                <svg width="55" height="45" viewBox="0 0 60 50">
                  <rect x="5" y="15" width="50" height="30" rx="3" fill="#8B4513" stroke="#654321" strokeWidth="2" />
                  <rect x="5" y="10" width="50" height="8" rx="2" fill="#654321" />
                  <path d="M 25 10 Q 30 4 35 10" stroke="#FFD700" strokeWidth="3" fill="none" />
                </svg>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-[10px] font-bold">{store.tacklebox?.totalFishCaught || 0}</span>
                </div>
              </div>
            </div>
            <svg width="70" height="90" viewBox="0 0 70 90" className="opacity-90">
              <line x1="8" y1="88" x2="45" y2="15" stroke="#8B4513" strokeWidth="4" strokeLinecap="round" />
              <circle cx="18" cy="75" r="5" fill="#C0C0C0" />
              {store.fishingState !== 'idle' && (<><line x1="45" y1="15" x2="65" y2="0" stroke="#888" strokeWidth="1.5" /><circle cx="65" cy="0" r="3" fill="#FF4444" /></>)}
            </svg>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <button onClick={handleCast} disabled={store.fishingState !== 'idle'} className="btn-cast w-24 h-24 rounded-full font-bold text-xl text-white" data-testid="cast-button">
              {store.fishingState === 'idle' ? 'CAST' : store.fishingState === 'waiting' ? '...' : store.fishingState.toUpperCase()}
            </button>
            {store.fishingState === 'bite' && (
              <button onClick={handleReel} className="btn-reel w-24 h-12 rounded-xl font-bold text-white" data-testid="reel-button">REEL!</button>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1">
              {RODS.map((_, i) => (
                <button key={i} onClick={() => { store.selectRod(i); retroSounds.select(); }} className={`equip-btn ${store.selectedRod === i ? 'active' : ''}`} data-testid={`rod-${i}`}>{['B', 'C', 'P'][i]}</button>
              ))}
            </div>
            <div className="flex gap-1">
              {LURES.map((_, i) => {
                const unlocked = store.unlockedLures.includes(i);
                return (
                  <button key={i} onClick={() => { unlocked ? store.selectLure(i) : store.setGameState('shop'); retroSounds.select(); }} className={`equip-btn ${store.selectedLure === i ? 'active' : ''} ${!unlocked ? 'locked' : ''}`} data-testid={`lure-${i}`}>{unlocked ? ['B', 'S', 'W'][i] : '🔒'}</button>
                );
              })}
            </div>
            <button onClick={() => { store.setGameState('menu'); retroSounds.stopMusic(); retroSounds.select(); }} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-xs font-bold" data-testid="menu-button">MENU</button>
          </div>
        </div>
        
        <div className="px-4 pb-2">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Level {store.level}</span>
            <span>{store.fishPerLevel - store.remaining}/{store.fishPerLevel}</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${((store.fishPerLevel - store.remaining) / store.fishPerLevel) * 100}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

export default App;
