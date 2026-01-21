import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
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
  FlyingSeagulls,
  AnimatedIsland,
  AnimatedBoats,
} from './components/GameSprites';
import FishCatchCutscene from './components/FishCatchCutscene';
import { toast, Toaster } from 'sonner';
import './App.css';

// ========== SEASONS ==========
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_ICONS = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const SEASON_COLORS = {
  spring: 'from-emerald-500 via-green-400 to-teal-500',
  summer: 'from-amber-400 via-orange-400 to-yellow-500',
  autumn: 'from-orange-500 via-red-500 to-amber-600',
  winter: 'from-blue-400 via-cyan-300 to-slate-400',
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

// Animated water waves component
const AnimatedWaves = ({ color = '#4A90D9' }) => (
  <svg className="absolute bottom-0 left-0 w-full h-32 z-10" viewBox="0 0 1440 120" preserveAspectRatio="none">
    <path 
      d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z" 
      fill={color}
      opacity="0.8"
      className="animate-wave-slow"
    />
    <path 
      d="M0,80 C360,120 720,40 1080,80 C1260,100 1380,60 1440,80 L1440,120 L0,120 Z" 
      fill={color}
      opacity="0.6"
      className="animate-wave-medium"
    />
  </svg>
);

// Floating fish background animation
const FloatingFishBg = () => {
  const [fish, setFish] = useState([]);
  
  useEffect(() => {
    const newFish = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 60 + Math.random() * 30,
      size: 20 + Math.random() * 30,
      speed: 0.02 + Math.random() * 0.03,
      color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1'][i % 5],
      direction: i % 2 === 0 ? 1 : -1,
    }));
    setFish(newFish);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFish(prev => prev.map(f => ({
        ...f,
        x: f.direction > 0 
          ? (f.x > 110 ? -10 : f.x + f.speed)
          : (f.x < -10 ? 110 : f.x - f.speed),
        y: f.y + Math.sin(Date.now() * 0.001 + f.id) * 0.1,
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
      {fish.map(f => (
        <div 
          key={f.id} 
          className="absolute transition-none"
          style={{ 
            left: `${f.x}%`, 
            top: `${f.y}%`,
            transform: `scaleX(${f.direction})`,
          }}
        >
          <PixelFish color={f.color} size={f.size} />
        </div>
      ))}
    </div>
  );
};

// ========== FISH ENCYCLOPEDIA DATA ==========
const FISH_ENCYCLOPEDIA = [
  { id: 1, name: 'Minnow', size: '10-15cm', rarity: 'Common', habitat: 'Lakes', color: '#8B5A2B', desc: 'Small and speedy', points: 10 },
  { id: 2, name: 'Perch', size: '20-30cm', rarity: 'Common', habitat: 'Rivers', color: '#4CAF50', desc: 'Green striped beauty', points: 25 },
  { id: 3, name: 'Bass', size: '30-50cm', rarity: 'Uncommon', habitat: 'Lakes', color: '#FF5722', desc: 'A fighter fish!', points: 40 },
  { id: 4, name: 'Catfish', size: '40-70cm', rarity: 'Uncommon', habitat: 'Deep', color: '#795548', desc: 'Night hunter', points: 80 },
  { id: 5, name: 'Pike', size: '60-90cm', rarity: 'Rare', habitat: 'Rivers', color: '#2196F3', desc: 'Fast and fierce', points: 120 },
  { id: 6, name: 'Golden Koi', size: '50-80cm', rarity: 'Legendary', habitat: 'Secret', color: '#FFD700', desc: 'Super rare!', points: 300 },
];

// ========== TUTORIAL COMPONENT ==========
const TutorialScreen = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  
  const tutorialSteps = [
    {
      title: "Welcome! 🎣",
      text: "Let's learn to fish!",
      emoji: "👋",
      instruction: "Tap anywhere to continue"
    },
    {
      title: "Step 1: Cast!",
      text: "Press the big green CAST button to throw your line into the water!",
      emoji: "🎯",
      instruction: "The fishing rod goes WHOOSH!"
    },
    {
      title: "Step 2: Wait...",
      text: "Watch the bobber float in the water. Wait for a fish to bite!",
      emoji: "⏳",
      instruction: "Be patient like a real fisher!"
    },
    {
      title: "Step 3: REEL!",
      text: "When the bobber shakes and you see 'TAP REEL!', quickly tap the REEL button!",
      emoji: "⚡",
      instruction: "Be fast! The fish might escape!"
    },
    {
      title: "You Got This! 🏆",
      text: "Catch fish to earn points and level up! Have fun fishing!",
      emoji: "🐟",
      instruction: "Ready to play?"
    }
  ];
  
  const currentStep = tutorialSteps[step];
  const isLastStep = step === tutorialSteps.length - 1;
  
  return (
    <div 
      className="h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1a4a6a 50%, #2a7090 100%)' }}
      data-testid="tutorial-screen"
    >
      <Toaster position="top-center" richColors />
      <FloatingFishBg />
      
      {/* Progress dots */}
      <div className="absolute top-8 flex gap-2 z-30">
        {tutorialSteps.map((_, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-full transition-all ${i === step ? 'bg-yellow-400 scale-125' : i < step ? 'bg-green-400' : 'bg-white/30'}`}
          />
        ))}
      </div>
      
      {/* Main tutorial card */}
      <div 
        className="relative z-20 glass-panel rounded-3xl p-8 max-w-md w-full text-center border-4 border-yellow-500/50 shadow-2xl animate-scale-pop cursor-pointer"
        onClick={() => !isLastStep && setStep(step + 1)}
      >
        {/* Big emoji */}
        <div className="text-8xl mb-6 animate-bounce">{currentStep.emoji}</div>
        
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 font-pixel mb-4">
          {currentStep.title}
        </h2>
        
        {/* Main text - simple for children */}
        <p className="text-lg md:text-xl text-white mb-4 leading-relaxed">
          {currentStep.text}
        </p>
        
        {/* Instruction hint */}
        <p className="text-sm text-blue-300/80 italic">
          {currentStep.instruction}
        </p>
        
        {/* Navigation buttons */}
        <div className="flex gap-4 mt-8 justify-center">
          {step > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setStep(step - 1); }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white border-2 border-white/30 transition-all"
            >
              Back
            </button>
          )}
          
          {isLastStep ? (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              className="px-8 py-3 bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 rounded-xl font-bold text-white border-3 border-white shadow-lg transition-all animate-pulse"
              data-testid="tutorial-start-button"
            >
              Start Fishing! 🎣
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setStep(step + 1); }}
              className="px-8 py-3 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 rounded-xl font-bold text-white border-3 border-white shadow-lg transition-all"
            >
              Next →
            </button>
          )}
        </div>
      </div>
      
      {/* Back to stage select */}
      <button 
        onClick={onBack}
        className="mt-8 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white border-2 border-white/30 transition-all z-20"
        data-testid="tutorial-back-button"
      >
        ← Back to Menu
      </button>
    </div>
  );
};

// ========== FISH ENCYCLOPEDIA COMPONENT ==========
const FishEncyclopedia = ({ onClose, caughtFish = {} }) => {
  const [selectedFish, setSelectedFish] = useState(null);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/85">
      <div className="glass-panel rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-auto animate-modal border-2 border-cyan-500/40">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold gradient-text font-pixel flex items-center gap-2">
            <span className="text-2xl">📖</span> FISHDEX
          </h2>
          <div className="text-xs text-cyan-400/80">
            {Object.keys(caughtFish).length}/{FISH_ENCYCLOPEDIA.length} Discovered
          </div>
        </div>
        
        {/* Fish Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {FISH_ENCYCLOPEDIA.map((fish) => {
            const caught = caughtFish[fish.name] > 0;
            return (
              <button
                key={fish.id}
                onClick={() => setSelectedFish(fish)}
                className={`fish-dex-entry p-2 rounded-xl border-2 transition-all ${
                  caught 
                    ? 'bg-cyan-900/40 border-cyan-500/50 hover:border-cyan-400' 
                    : 'bg-black/40 border-white/10 opacity-50'
                } ${selectedFish?.id === fish.id ? 'ring-2 ring-yellow-400' : ''}`}
                data-testid={`fishdex-${fish.id}`}
              >
                <div className="flex justify-center mb-1">
                  <PixelFish color={caught ? fish.color : '#444'} size={32} />
                </div>
                <p className="text-[9px] text-white font-medium truncate">
                  {caught ? fish.name : '???'}
                </p>
                <p className="text-[8px] text-cyan-400/60">
                  #{String(fish.id).padStart(3, '0')}
                </p>
              </button>
            );
          })}
        </div>
        
        {/* Selected Fish Detail */}
        {selectedFish && (
          <div className="bg-cyan-900/30 rounded-xl p-4 border border-cyan-500/30 mb-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <PixelFish color={caughtFish[selectedFish.name] > 0 ? selectedFish.color : '#444'} size={50} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white mb-1">
                  {caughtFish[selectedFish.name] > 0 ? selectedFish.name : '???'}
                </h3>
                {caughtFish[selectedFish.name] > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div><span className="text-cyan-400/60">Size:</span> <span className="text-white">{selectedFish.size}</span></div>
                      <div><span className="text-cyan-400/60">Points:</span> <span className="text-yellow-400">{selectedFish.points}</span></div>
                      <div><span className="text-cyan-400/60">Rarity:</span> <span className={`${selectedFish.rarity === 'Legendary' ? 'text-yellow-400' : selectedFish.rarity === 'Rare' ? 'text-purple-400' : 'text-green-400'}`}>{selectedFish.rarity}</span></div>
                      <div><span className="text-cyan-400/60">Habitat:</span> <span className="text-white">{selectedFish.habitat}</span></div>
                    </div>
                    <p className="text-[10px] text-cyan-300/80 mt-2 italic">"{selectedFish.desc}"</p>
                    <p className="text-[10px] text-green-400 mt-1">Caught: {caughtFish[selectedFish.name]}x</p>
                  </>
                ) : (
                  <p className="text-[10px] text-white/50 italic">Catch this fish to learn more!</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 rounded-xl font-bold text-white text-sm border-2 border-red-400 transition-all"
          data-testid="fishdex-close"
        >
          Close
        </button>
      </div>
    </div>
  );
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
  
  // New states
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFishdex, setShowFishdex] = useState(false);
  
  // Season & visuals
  const [currentSeason, setCurrentSeason] = useState(getCurrentSeason());
  const [showBoat, setShowBoat] = useState(false);
  const [boatType, setBoatType] = useState(0);
  const [showWhale, setShowWhale] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  // Cutscene state
  const [showCutscene, setShowCutscene] = useState(false);
  const [cutsceneData, setCutsceneData] = useState(null);
  
  // Menu animation states
  const [menuAnimated, setMenuAnimated] = useState(false);
  
  // ========== NEURON ACTIVATION STATES ==========
  const [screenShake, setScreenShake] = useState(false);
  const [comboFlash, setComboFlash] = useState(false);
  const [pointsPopup, setPointsPopup] = useState(null);
  const [streakFire, setStreakFire] = useState(false);
  const [rareCatchGlow, setRareCatchGlow] = useState(false);
  
  const biteTimeoutRef = useRef(null);
  const bobberAnimRef = useRef(null);
  const fishAnimRef = useRef(null);
  const boatTimerRef = useRef(null);
  const whaleTimerRef = useRef(null);

  useEffect(() => {
    initializeGame();
    return () => clearAllTimers();
  }, []);
  
  // Move all useMemo hooks to the top to avoid conditional hook calls
  const gameContainerClass = useMemo(() => {
    let classes = 'h-screen flex flex-col bg-black overflow-hidden';
    if (screenShake) classes += ' screen-shake';
    if (comboFlash) classes += ' combo-flash';
    if (streakFire) classes += ' streak-fire';
    if (rareCatchGlow) classes += ' rare-glow';
    return classes;
  }, [screenShake, comboFlash, streakFire, rareCatchGlow]);
  
  // Menu animation trigger
  useEffect(() => {
    if (store.gameState === 'menu' && !menuAnimated) {
      setTimeout(() => setMenuAnimated(true), 100);
    }
  }, [store.gameState, menuAnimated]);

  // Boat timer
  useEffect(() => {
    if (store.gameState === 'playing') {
      boatTimerRef.current = setInterval(() => {
        setBoatType(prev => (prev + 1) % 5);
        setShowBoat(true);
        setTimeout(() => setShowBoat(false), 25000);
      }, 60000);
      
      setTimeout(() => {
        setShowBoat(true);
        setTimeout(() => setShowBoat(false), 25000);
      }, 10000);
    }
    return () => clearInterval(boatTimerRef.current);
  }, [store.gameState]);

  // Whale timer
  useEffect(() => {
    if (store.gameState === 'playing' && store.currentStage >= 2) {
      whaleTimerRef.current = setInterval(() => {
        setShowWhale(true);
        setTimeout(() => setShowWhale(false), 20000);
      }, 180000);
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
      
      setTimeout(() => setIsLoading(false), 1500);
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
    
    // ========== NEURON ACTIVATION: VISUAL FEEDBACK ==========
    
    // Screen shake on catch
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 300);
    
    // Points popup
    setPointsPopup({ points, perfect, x: 50, y: 40 });
    setTimeout(() => setPointsPopup(null), 1500);
    
    // Combo flash effect
    if (store.combo >= 2) {
      setComboFlash(true);
      retroSounds.combo(store.combo + 1);
      setTimeout(() => setComboFlash(false), 200);
    }
    
    // Streak fire for 5+ combo
    if (store.combo >= 4) {
      setStreakFire(true);
      setTimeout(() => setStreakFire(false), 2000);
    }
    
    // Rare catch glow for rare fish
    if (fish.rarity >= 0.7) {
      setRareCatchGlow(true);
      setTimeout(() => setRareCatchGlow(false), 1500);
    }
    
    // Show cutscene
    setCutsceneData({ fish, isPerfect: perfect, points });
    setShowCutscene(true);
    
    store.addFishToTacklebox({ ...fish, isPerfect: perfect, caughtAt: new Date().toISOString() });
    
    store.addScore(points);
    store.incrementCatches();
    store.incrementCombo();
    store.setRemaining(store.remaining - 1);
    animateScore();
    
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
  };
  
  const handleCutsceneComplete = () => {
    setShowCutscene(false);
    setCutsceneData(null);
    animateFishToTacklebox(store.currentFish);
    
    setTimeout(() => {
      store.setFishingState('idle');
      store.setCurrentFish(null);
      setCastProgress(0);
      setTimeout(() => { 
        if (store.gameState === 'playing' && store.fishingState === 'idle') handleCast(); 
      }, 800);
    }, 500);
  };

  const loadLeaderboard = async () => {
    try { setLeaderboardData(await apiService.getLeaderboard(100)); } catch (e) {}
  };

  // Get caught fish stats for encyclopedia
  const getCaughtFishStats = () => {
    return store.tacklebox?.fishByType || {};
  };

  // ========== RENDER ==========
  
  // Tutorial Screen
  if (showTutorial) {
    return (
      <TutorialScreen 
        onComplete={() => {
          setShowTutorial(false);
          store.setCurrentStage(0);
          store.setGameState('playing');
          store.resetGame();
          if (musicEnabled) retroSounds.startMusic(currentSeason);
        }}
        onBack={() => {
          setShowTutorial(false);
          store.setGameState('stage_select');
        }}
      />
    );
  }
  
  // Loading Screen
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center overflow-hidden relative" 
           style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 50%, #2a6090 100%)' }}>
        <FloatingFishBg />
        <AnimatedWaves color="#1a3a5c" />
        
        <div className="text-center animate-fade-in relative z-20">
          <div className="relative mb-6">
            <div className="text-6xl md:text-7xl mb-4 animate-float">🎣</div>
            <div className="absolute -inset-4 bg-yellow-400/20 blur-3xl rounded-full animate-pulse" />
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-pixel gradient-text logo-glow tracking-wider mb-6">
            GO FISH!
          </h1>
          
          <div className="w-56 md:w-64 h-2.5 bg-black/40 rounded-full mx-auto overflow-hidden border-2 border-white/20">
            <div className="h-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-full animate-loading-bar" />
          </div>
          <p className="text-white/60 mt-4 text-xs md:text-sm animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  // Menu Screen - Redesigned with Winter button at bottom
  if (store.gameState === 'menu') {
    return (
      <div className="h-screen flex flex-col items-center justify-between p-6 relative overflow-hidden" 
           style={{ background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 40%, #1a4060 80%, #2a6090 100%)' }}
           data-testid="menu-screen">
        <Toaster position="top-center" richColors />
        
        {/* Animated background elements */}
        <FloatingFishBg />
        <AnimatedWaves color="#1a4060" />
        
        {/* Floating sparkles */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="floating-sparkle" style={{
            left: `${5 + i * 5}%`,
            top: `${10 + (i % 5) * 18}%`,
            animationDelay: `${i * 0.2}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }} />
        ))}
        
        {/* Top spacer */}
        <div />
        
        {/* Main content centered */}
        <div className="flex flex-col items-center">
          {/* Main Logo Section */}
          <div className={`relative z-20 text-center transition-all duration-1000 ${menuAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <div className="relative inline-block mb-2">
              <div className="absolute -inset-8 bg-yellow-400/20 blur-3xl rounded-full" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-pixel gradient-text logo-glow tracking-wider relative">
                GO FISH!
              </h1>
            </div>
          </div>
          
          {/* Animated Fish Mascot - Wiggle animation */}
          <div className={`my-6 relative z-20 transition-all duration-1000 delay-300 ${menuAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
            <div className="relative">
              <div className="absolute -inset-8 bg-yellow-400/30 blur-2xl rounded-full animate-pulse" />
              <div className="fish-wiggle">
                <PixelFish color="#FFD700" size={80} />
              </div>
            </div>
          </div>
          
          {/* Menu Buttons */}
          <div className={`space-y-3 w-64 md:w-72 relative z-20 transition-all duration-1000 delay-500 ${menuAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button 
              onClick={() => { retroSounds.select(); store.setGameState('stage_select'); }}
              className="menu-btn-primary w-full h-14 rounded-2xl font-bold text-lg text-white tracking-wide flex items-center justify-center gap-3 group"
              data-testid="start-button"
            >
              <span className="text-xl group-hover:scale-125 transition-transform">▶</span>
              <span>PLAY</span>
            </button>
            
            <button 
              onClick={() => { retroSounds.select(); loadLeaderboard(); setShowLeaderboard(true); }}
              className="menu-btn-secondary w-full h-12 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2"
              data-testid="leaderboard-button"
            >
              <span className="text-lg">🏆</span>
              <span>LEADERBOARD</span>
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => { retroSounds.select(); setShowAchievements(true); }}
                className="menu-btn-accent flex-1 h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                data-testid="achievements-button"
              >
                <span>⭐</span>
                <span className="text-xs">BADGES</span>
              </button>
              
              <button 
                onClick={() => { retroSounds.select(); setShowSettings(true); }}
                className="menu-btn-neutral flex-1 h-12 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                data-testid="settings-button"
              >
                <span>⚙️</span>
                <span className="text-xs">SETTINGS</span>
              </button>
            </div>
          </div>
          
          {/* Stats Banner */}
          <div className={`mt-8 relative z-20 transition-all duration-1000 delay-700 ${menuAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="glass-panel rounded-2xl px-6 py-3 flex gap-8">
              <div className="text-center">
                <p className="text-[10px] text-blue-300/60 uppercase tracking-wider mb-1">Best Score</p>
                <p className="text-lg md:text-xl font-bold text-yellow-400 font-pixel">{store.highScore.toLocaleString()}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[10px] text-blue-300/60 uppercase tracking-wider mb-1">Fish Caught</p>
                <p className="text-lg md:text-xl font-bold text-green-400 font-pixel">{store.totalCatches.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Season badge at BOTTOM */}
        <div className={`relative z-30 mb-4 transition-all duration-1000 delay-900 ${menuAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${SEASON_COLORS[currentSeason]} border-2 border-white/50 shadow-lg backdrop-blur-sm cursor-pointer hover:scale-105 transition-transform`}
               onClick={() => setShowSettings(true)}
               data-testid="season-badge">
            <span className="text-xl mr-2">{SEASON_ICONS[currentSeason]}</span>
            <span className="text-white font-bold capitalize text-sm">{currentSeason}</span>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/80">
            <div className="glass-panel rounded-3xl p-8 w-full max-w-md animate-modal border-2 border-white/20">
              <h2 className="text-2xl font-bold text-center mb-8 gradient-text font-pixel">SETTINGS</h2>
              
              <div className="mb-8">
                <p className="text-blue-300/70 text-sm mb-3 uppercase tracking-wider">Season Theme</p>
                <div className="grid grid-cols-4 gap-2">
                  {SEASONS.map(s => (
                    <button key={s} onClick={() => setCurrentSeason(s)}
                      className={`py-4 rounded-xl font-bold transition-all ${currentSeason === s 
                        ? 'bg-gradient-to-b from-yellow-400 to-yellow-600 text-black border-2 border-yellow-300 shadow-lg shadow-yellow-500/30' 
                        : 'bg-white/10 text-white hover:bg-white/20 border-2 border-transparent'}`}>
                      <div className="text-2xl mb-1">{SEASON_ICONS[s]}</div>
                      <div className="text-[10px] uppercase tracking-wider">{s}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <span className="text-white flex items-center gap-2">🎵 Background Music</span>
                  <button onClick={() => setMusicEnabled(!musicEnabled)}
                    className={`w-16 h-9 rounded-full transition-all duration-300 ${musicEnabled ? 'bg-green-500' : 'bg-white/20'}`}>
                    <div className={`w-7 h-7 bg-white rounded-full shadow-lg transition-transform duration-300 ${musicEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-white">🔊 Volume</span>
                    <span className="text-blue-300">{Math.round(volume * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={volume * 100}
                    onChange={(e) => setVolume(e.target.value / 100)}
                    className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer accent-yellow-400" />
                </div>
              </div>
              
              <button onClick={() => setShowSettings(false)} 
                className="w-full py-4 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 rounded-xl font-bold text-white border-2 border-red-400 shadow-lg transition-all">
                CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/80">
            <div className="glass-panel rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-auto animate-modal border-2 border-yellow-500/30">
              <h2 className="text-2xl font-bold text-center mb-6 gradient-text font-pixel">🏆 TOP ANGLERS</h2>
              <div className="space-y-2">
                {leaderboardData.length === 0 ? (
                  <p className="text-blue-300/60 text-center py-12">No scores yet! Be the first!</p>
                ) : (
                  leaderboardData.slice(0, 10).map((entry, i) => (
                    <div key={i} className={`leaderboard-entry ${i < 3 ? 'top-3' : ''}`}>
                      <div className="flex items-center gap-4">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                          i === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' : 
                          i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' : 
                          i === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white' : 
                          'bg-white/10 text-white/60'}`}>
                          {i + 1}
                        </span>
                        <span className="text-white font-medium">{entry.username}</span>
                      </div>
                      <span className="text-yellow-400 font-bold font-pixel">{entry.score.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setShowLeaderboard(false)} 
                className="w-full mt-6 py-4 bg-gradient-to-b from-red-500 to-red-700 rounded-xl font-bold text-white border-2 border-red-400">
                CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Achievements Modal */}
        {showAchievements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/80">
            <div className="glass-panel rounded-3xl p-6 w-full max-w-md max-h-[80vh] overflow-auto animate-modal border-2 border-purple-500/30">
              <h2 className="text-2xl font-bold text-center mb-6 gradient-text font-pixel">⭐ ACHIEVEMENTS</h2>
              <div className="grid grid-cols-4 gap-3">
                {ACHIEVEMENTS.map((ach) => (
                  <div key={ach.id} 
                    className={`achievement-badge ${store.achievements.includes(ach.id) ? 'unlocked' : 'locked'}`} 
                    title={ach.description}>
                    <span className="text-2xl">{ach.icon}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-blue-300/60 mt-6 text-sm">
                {store.achievements.length} / {ACHIEVEMENTS.length} Unlocked
              </p>
              <button onClick={() => setShowAchievements(false)} 
                className="w-full mt-4 py-4 bg-gradient-to-b from-red-500 to-red-700 rounded-xl font-bold text-white border-2 border-red-400">
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stage Select - Redesigned with Tutorial + Fishdex
  if (store.gameState === 'stage_select') {
    const stages = [
      { name: 'Sunny Lake', desc: 'Calm waters, perfect for beginners', icon: '☀️', color: 'from-sky-400 to-cyan-500', accent: '#0ea5e9', difficulty: 1 },
      { name: 'Sunset River', desc: 'Beautiful dusk fishing spot', icon: '🌅', color: 'from-orange-400 to-red-500', accent: '#f97316', difficulty: 2 },
      { name: 'Deep Ocean', desc: 'Night fishing, rare catches', icon: '🌙', color: 'from-indigo-600 to-purple-800', accent: '#6366f1', difficulty: 3 },
      { name: 'Storm Sea', desc: 'Extreme conditions, epic rewards', icon: '⛈️', color: 'from-slate-600 to-slate-900', accent: '#475569', difficulty: 4 },
    ];
    
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
           style={{ background: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 100%)' }}
           data-testid="stage-select">
        <Toaster position="top-center" richColors />
        
        <FloatingFishBg />
        
        <h2 className="text-3xl md:text-4xl font-bold mb-6 animate-slide-down gradient-text font-pixel relative z-20">
          SELECT WATERS
        </h2>
        
        {/* Tutorial Card */}
        <button 
          onClick={() => { retroSounds.select(); setShowTutorial(true); }}
          className="mb-4 w-full max-w-lg bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 border-2 border-green-300/50 transition-all duration-300 hover:scale-[1.02] hover:border-white/60 group relative z-20 flex items-center gap-4"
          data-testid="tutorial-button"
        >
          <div className="text-4xl animate-bounce">📚</div>
          <div className="text-left flex-1">
            <h3 className="font-bold text-white text-lg">Tutorial</h3>
            <p className="text-green-100/80 text-xs">Learn how to fish! Perfect for new players</p>
          </div>
          <div className="text-2xl group-hover:translate-x-1 transition-transform">→</div>
        </button>
        
        {/* Stage Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-lg relative z-20">
          {stages.map((stage, i) => (
            <button 
              key={i} 
              onClick={() => { 
                retroSounds.select(); 
                store.setCurrentStage(i); 
                store.setGameState('playing'); 
                store.resetGame(); 
                if (musicEnabled) retroSounds.startMusic(currentSeason); 
              }}
              className={`stage-card menu-item-${i + 1} bg-gradient-to-br ${stage.color} rounded-2xl p-4 border-2 border-white/30 transition-all duration-300 hover:scale-105 hover:border-white/60 group`}
              style={{ boxShadow: `0 8px 32px ${stage.accent}40` }}
              data-testid={`stage-${i}`}
            >
              <div className="text-4xl mb-2 group-hover:scale-125 transition-transform">{stage.icon}</div>
              <h3 className="font-bold text-white text-sm mb-1">{stage.name}</h3>
              <p className="text-white/70 text-[10px] mb-2">{stage.desc}</p>
              <div className="flex justify-center gap-1">
                {[...Array(4)].map((_, d) => (
                  <div key={d} className={`w-2 h-2 rounded-full ${d < stage.difficulty ? 'bg-yellow-400' : 'bg-white/30'}`} />
                ))}
              </div>
            </button>
          ))}
        </div>
        
        {/* Bottom buttons: Fishdex + Back */}
        <div className="flex gap-4 mt-6 relative z-20">
          <button 
            onClick={() => { retroSounds.select(); setShowFishdex(true); }}
            className="px-6 py-3 bg-gradient-to-b from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 rounded-2xl font-bold text-white border-2 border-cyan-300/50 transition-all flex items-center gap-2"
            data-testid="fishdex-button"
          >
            <span className="text-xl">📖</span>
            <span className="text-sm">Fishdex</span>
          </button>
          
          <button 
            onClick={() => { retroSounds.select(); store.setGameState('menu'); }}
            className="px-10 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-white border-2 border-white/30 transition-all"
            data-testid="back-button"
          >
            ← BACK
          </button>
        </div>
        
        {/* Fish Encyclopedia Modal */}
        {showFishdex && (
          <FishEncyclopedia 
            onClose={() => setShowFishdex(false)} 
            caughtFish={getCaughtFishStats()}
          />
        )}
      </div>
    );
  }

  // Lure Shop
  if (store.gameState === 'shop') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop bg-black/90">
        <Toaster position="top-center" richColors />
        <div className="glass-panel rounded-3xl p-6 w-full max-w-sm animate-modal border-2 border-yellow-500/30">
          <h2 className="text-2xl font-bold text-center mb-2 gradient-text font-pixel">LURE SHOP</h2>
          <p className="text-center text-yellow-400 mb-6 font-bold">{store.score.toLocaleString()} Points</p>
          <div className="space-y-3">
            {LURES.map((lure, i) => {
              const owned = store.unlockedLures.includes(i);
              return (
                <div key={i} className={`flex justify-between items-center p-4 rounded-xl ${owned ? 'bg-green-900/30 border-2 border-green-500/50' : 'bg-white/5 border-2 border-white/20'}`}>
                  <div>
                    <p className="font-bold text-white">{lure.name}</p>
                    <p className="text-xs text-blue-300/60">Attraction: {lure.attraction}x</p>
                  </div>
                  {owned ? (
                    <span className="text-green-400 font-bold px-4 py-2">✓ OWNED</span>
                  ) : (
                    <button onClick={() => {
                      if (store.score >= lure.price) { store.addScore(-lure.price); store.unlockLure(i); toast.success(`${lure.name} unlocked!`); }
                      else toast.error(`Need ${lure.price - store.score} more points!`);
                    }} className="px-4 py-2 bg-gradient-to-b from-yellow-400 to-yellow-600 text-black font-bold rounded-lg hover:from-yellow-300 hover:to-yellow-500 transition-all">
                      {lure.price} PTS
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => store.setGameState('playing')} className="w-full mt-6 py-4 bg-gradient-to-b from-red-500 to-red-700 rounded-xl font-bold text-white border-2 border-red-400">
            CLOSE
          </button>
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
        <div className="glass-panel rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-auto animate-modal border-2 border-amber-500/30">
          <h2 className="text-2xl font-bold text-center mb-6 gradient-text font-pixel">🎒 TACKLEBOX</h2>
          
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: 'CAUGHT', value: stats.totalFishCaught, color: 'text-yellow-400' },
              { label: 'VALUE', value: stats.totalValue, color: 'text-green-400' },
              { label: 'RARE', value: stats.rareFishCount, color: 'text-purple-400' },
              { label: 'TYPES', value: `${stats.uniqueTypes}/6`, color: 'text-cyan-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</p>
                <p className={`font-bold ${stat.color}`}>{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
              </div>
            ))}
          </div>
          
          {stats.largestFish && (
            <div className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-4 mb-6 flex items-center gap-4">
              <span className="text-3xl">🏆</span>
              <PixelFish color={stats.largestFish.color} size={40} />
              <div>
                <p className="text-white font-bold">{stats.largestFish.name}</p>
                <p className="text-yellow-400">{stats.largestFish.size}cm - Record!</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            {FISH_TYPES.map((fish) => {
              const count = stats.fishByType[fish.name] || 0;
              return (
                <div key={fish.name} className={`fish-grid-item ${count > 0 ? 'unlocked' : ''}`}>
                  <div className="flex justify-center mb-2">
                    <PixelFish color={count > 0 ? fish.color : '#666'} size={36} />
                  </div>
                  <p className="text-xs text-center text-white font-medium">{fish.name}</p>
                  <p className="text-xs text-center text-yellow-400">×{count}</p>
                </div>
              );
            })}
          </div>
          
          <button onClick={() => setShowTacklebox(false)} className="w-full mt-6 py-4 bg-gradient-to-b from-red-500 to-red-700 rounded-xl font-bold text-white border-2 border-red-400">
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  // ========== MAIN GAME ==========
  const stageData = STAGES[store.currentStage];
  const tensionLevel = store.tension > 0.7 ? 'danger' : store.tension > 0.4 ? 'warning' : 'safe';
  
  return (
    <div className={gameContainerClass} data-testid="game-screen">
      <Toaster position="top-center" richColors />
      
      {/* Fish Catch Cutscene */}
      {showCutscene && cutsceneData && (
        <FishCatchCutscene 
          fish={cutsceneData.fish}
          isPerfect={cutsceneData.isPerfect}
          points={cutsceneData.points}
          onComplete={handleCutsceneComplete}
        />
      )}
      
      {/* Points Popup - Neuron Activation */}
      {pointsPopup && (
        <div 
          className="fixed z-[200] pointer-events-none points-popup"
          style={{ left: `${pointsPopup.x}%`, top: `${pointsPopup.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className={`text-4xl md:text-6xl font-bold font-pixel ${pointsPopup.perfect ? 'text-yellow-400 perfect-glow' : 'text-green-400'}`}>
            +{pointsPopup.points}
          </div>
          {pointsPopup.perfect && <div className="text-center text-yellow-300 text-lg font-bold mt-1">PERFECT!</div>}
        </div>
      )}
      
      {/* Combo indicator overlay */}
      {store.combo >= 3 && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[150] pointer-events-none">
          <div className={`text-2xl md:text-3xl font-bold font-pixel combo-pulse ${store.combo >= 5 ? 'text-orange-400 on-fire' : 'text-yellow-400'}`}>
            {store.combo}x COMBO!
            {store.combo >= 5 && <span className="ml-2">🔥</span>}
          </div>
        </div>
      )}
      
      {/* Game Area - 70% */}
      <div className="relative" style={{ height: '70%' }}>
        <RetroBackground stage={store.currentStage} timeOfDay={store.timeOfDay} showRain={stageData.features.rain} showLightning={store.showLightning} season={currentSeason} />
        
        {/* Flying Seagulls */}
        <FlyingSeagulls count={store.currentStage === 0 ? 7 : 4} direction={store.currentStage % 2 === 0 ? 'right' : 'left'} />
        
        {/* Island - Better positioned */}
        <AnimatedIsland season={currentSeason} side="right" />
        
        {/* Boats */}
        <AnimatedBoats show={showBoat} type={boatType} season={currentSeason} />
        
        {/* Whale */}
        <WhaleSprite show={showWhale} />
        
        {/* Fishing Line - hidden behind water layer */}
        {(store.fishingState === 'waiting' || store.fishingState === 'bite' || store.fishingState === 'reeling') && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]">
            <line 
              x1="15%" 
              y1="100%" 
              x2="50%" 
              y2="55%" 
              stroke="#666" 
              strokeWidth="1.5" 
              strokeDasharray={store.fishingState === 'bite' ? "4" : "0"}
              className={store.fishingState === 'bite' ? 'animate-pulse' : ''}
              opacity="0.6"
            />
          </svg>
        )}
        
        {/* Bobber - ONLY visible during bite (hidden during waiting) */}
        {store.fishingState === 'bite' && (
          <div className={`absolute left-1/2 bobber active z-[25]`}
            style={{ top: '52%', transform: `translateX(-50%) translateY(${bobberY}px)` }}>
            <PixelBobber isActive={true} wobble={false} />
          </div>
        )}
        
        {/* Splash */}
        {showSplash && <WaterSplash x={window.innerWidth / 2} y={window.innerHeight * 0.35} />}
        
        {/* Fish being reeled */}
        {store.currentFish && store.fishingState === 'reeling' && (
          <div className="absolute left-1/2 caught-fish z-30" style={{ top: '55%', transform: `translateX(${fishSwim - 50}%)` }}>
            <PixelFish color={store.currentFish.color} size={store.currentFish.size * 0.8} wiggle />
          </div>
        )}
        
        {/* Flying fish to tacklebox */}
        {flyingFish && (
          <div className="absolute animate-fish-to-box z-50" style={{ left: '50%', top: '50%' }}>
            <PixelFish color={flyingFish.color} size={30} />
          </div>
        )}
        
        {/* Particles */}
        {store.showParticles && <ParticleEffects type={store.particleType} x={window.innerWidth / 2} y={window.innerHeight * 0.35} />}
        
        {/* Message */}
        {message && (
          <div className="absolute top-8 left-0 right-0 flex justify-center z-50">
            <div className="game-message"><p className="text-yellow-400 font-bold text-lg font-pixel">{message}</p></div>
          </div>
        )}
        
        {/* Season indicator */}
        <div className="absolute top-3 left-3 glass-panel rounded-xl px-4 py-2 flex items-center gap-2 z-30 border border-white/20">
          <span className="text-lg">{SEASON_ICONS[currentSeason]}</span>
          <span className="text-white text-xs uppercase tracking-wider">{currentSeason}</span>
        </div>
      </div>
      
      {/* UI Panel - 30% */}
      <div className="flex-1 glass-panel border-t-4 border-yellow-500/60 flex flex-col">
        {/* Top Stats Bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-black/40 border-b border-white/10">
          <div className={`stat-card flex items-center gap-2 ${scoreAnimation ? 'animate-score-pop' : ''}`}>
            <span className="text-[10px] text-yellow-400/80 uppercase">Score</span>
            <span className="text-yellow-400 font-bold font-pixel">{store.score.toLocaleString()}</span>
          </div>
          <div className="stat-card flex items-center gap-2">
            <span className="text-[10px] text-green-400/80 uppercase">Lv</span>
            <span className="text-green-400 font-bold font-pixel">{store.level}</span>
          </div>
          {store.combo > 1 && (
            <div className="stat-card bg-green-900/50 border-green-500/50 animate-pulse">
              <span className="text-green-400 font-bold">×{store.combo} COMBO</span>
            </div>
          )}
          
          {/* Tension Bar */}
          {store.fishingState === 'reeling' && (
            <div className="flex-1 ml-4">
              <div className="tension-bar">
                <div className={`tension-fill tension-${tensionLevel}`} style={{ width: `${store.tension * 100}%` }} />
              </div>
              <p className="text-[10px] text-center mt-1 text-white/60 uppercase">Line Tension</p>
            </div>
          )}
        </div>
        
        {/* Main Controls */}
        <div className="flex-1 flex items-center justify-between px-6">
          {/* Left: Tacklebox & Rod */}
          <div className="flex items-end gap-4">
            <div className="tacklebox-sprite" onClick={() => setShowTacklebox(true)} data-testid="tacklebox-sprite">
              <div className="relative">
                <svg width="60" height="50" viewBox="0 0 60 50">
                  <rect x="5" y="15" width="50" height="30" rx="4" fill="#8B4513" stroke="#654321" strokeWidth="2" />
                  <rect x="5" y="10" width="50" height="10" rx="3" fill="#654321" />
                  <path d="M 22 10 Q 30 2 38 10" stroke="#FFD700" strokeWidth="4" fill="none" />
                  <rect x="10" y="22" width="40" height="3" fill="#A0522D" opacity="0.5" />
                </svg>
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <span className="text-white text-[10px] font-bold">{store.tacklebox?.totalFishCaught || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Rod Display */}
            <svg width="50" height="80" viewBox="0 0 50 80" className="opacity-80">
              <line x1="8" y1="78" x2="35" y2="10" stroke="#8B4513" strokeWidth="5" strokeLinecap="round" />
              <line x1="8" y1="78" x2="35" y2="10" stroke="#A0522D" strokeWidth="3" strokeLinecap="round" />
              <circle cx="12" cy="65" r="5" fill="#C0C0C0" stroke="#888" strokeWidth="1" />
              {store.fishingState !== 'idle' && (
                <>
                  <line x1="35" y1="10" x2="45" y2="0" stroke="#666" strokeWidth="1.5" />
                  <circle cx="45" cy="0" r="4" fill="#FF4444" stroke="#CC0000" strokeWidth="1" />
                </>
              )}
            </svg>
          </div>
          
          {/* Center: Cast/Reel Buttons - SMALLER FONT */}
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={handleCast} 
              disabled={store.fishingState !== 'idle'} 
              className="btn-cast w-24 h-24 md:w-28 md:h-28 rounded-full font-bold text-white btn-smooth flex items-center justify-center" 
              data-testid="cast-button"
            >
              <span className="font-pixel text-xs md:text-sm leading-none">
                {store.fishingState === 'idle' ? 'CAST' : store.fishingState === 'waiting' ? '...' : store.fishingState.toUpperCase()}
              </span>
            </button>
            
            {store.fishingState === 'bite' && (
              <button 
                onClick={handleReel} 
                className="btn-reel w-24 h-12 md:w-28 md:h-14 rounded-xl font-bold text-white animate-pulse btn-smooth flex items-center justify-center gap-1" 
                data-testid="reel-button"
              >
                <span className="text-base">🎣</span>
                <span className="font-pixel text-xs">REEL!</span>
              </button>
            )}
          </div>
          
          {/* Right: Equipment & Menu */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/50 uppercase tracking-wider text-right">Rod</p>
              <div className="flex gap-1">
                {RODS.map((rod, i) => (
                  <button key={i} onClick={() => { store.selectRod(i); retroSounds.select(); }} 
                    className={`equip-btn ${store.selectedRod === i ? 'active' : ''}`} 
                    title={rod.name}
                    data-testid={`rod-${i}`}>
                    {['B', 'C', 'P'][i]}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-white/50 uppercase tracking-wider text-right">Lure</p>
              <div className="flex gap-1">
                {LURES.map((lure, i) => {
                  const unlocked = store.unlockedLures.includes(i);
                  return (
                    <button key={i} onClick={() => { unlocked ? store.selectLure(i) : store.setGameState('shop'); retroSounds.select(); }} 
                      className={`equip-btn ${store.selectedLure === i ? 'active' : ''} ${!unlocked ? 'locked' : ''}`}
                      title={unlocked ? lure.name : 'Locked'}
                      data-testid={`lure-${i}`}>
                      {unlocked ? ['B', 'S', 'W'][i] : '🔒'}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={() => { store.setGameState('menu'); retroSounds.stopMusic(); retroSounds.select(); }} 
              className="px-5 py-2.5 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 rounded-xl text-xs font-bold text-white border-2 border-red-400 transition-all"
              data-testid="menu-button"
            >
              MENU
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex justify-between text-[10px] text-white/50 mb-2 uppercase tracking-wider">
            <span>Level {store.level} Progress</span>
            <span>{store.fishPerLevel - store.remaining} / {store.fishPerLevel}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((store.fishPerLevel - store.remaining) / store.fishPerLevel) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
