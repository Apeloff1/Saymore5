import React, { useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';

// ========== PERFORMANCE CONSTANTS ==========
const FRAME_RATE = 60;
const FRAME_TIME = 1000 / FRAME_RATE;

// ========== SEASONAL THEMES ==========
const SEASONS = {
  spring: {
    name: 'Spring',
    skyColors: ['#87CEEB', '#B0E0E6'],
    waterColors: ['#4A90D9', '#2E5A88'],
    accent: '#FF69B4',
    particles: 'petals',
    treeColor: '#FFB7C5',
    groundColor: '#90EE90',
  },
  summer: {
    name: 'Summer',
    skyColors: ['#00BFFF', '#87CEEB'],
    waterColors: ['#1E90FF', '#104E8B'],
    accent: '#FFD700',
    particles: 'butterflies',
    treeColor: '#228B22',
    groundColor: '#F4A460',
  },
  autumn: {
    name: 'Autumn',
    skyColors: ['#FF8C00', '#FFD700'],
    waterColors: ['#CD853F', '#8B4513'],
    accent: '#FF4500',
    particles: 'leaves',
    treeColor: '#FF6347',
    groundColor: '#D2691E',
  },
  winter: {
    name: 'Winter',
    skyColors: ['#B0C4DE', '#708090'],
    waterColors: ['#4682B4', '#2F4F4F'],
    accent: '#E0FFFF',
    particles: 'snow',
    treeColor: '#FFFFFF',
    groundColor: '#F0F8FF',
  },
};

const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

const getStageColors = (stageIndex, season) => {
  const seasonData = SEASONS[season];
  const baseStages = [
    { skyColors: seasonData.skyColors, waterColors: seasonData.waterColors, timeOfDay: 'day' },
    { skyColors: ['#FF6B35', '#2A4D69'], waterColors: ['#2A4D69', '#0D1B2A'], timeOfDay: 'dusk' },
    { skyColors: ['#0a2b5c', '#001122'], waterColors: ['#003366', '#000814'], timeOfDay: 'night' },
    { skyColors: ['#1a1a2e', '#0a2b5c'], waterColors: ['#16213e', '#0f3460'], timeOfDay: 'night' },
  ];
  return baseStages[stageIndex] || baseStages[0];
};

// ========== OPTIMIZED HOOK FOR SMOOTH ANIMATION ==========
const useAnimationFrame = (callback, deps = []) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  const animate = useCallback((time) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime, time);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, deps);
};

// ========== SMOOTH ANIMATED SUN (CSS-based) ==========
const AnimatedSun = memo(({ visible }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute top-6 right-16 sun-container" style={{ opacity: visible ? 1 : 0 }}>
      <svg width="90" height="90" viewBox="0 0 90 90" className="sun-rotate">
        <defs>
          <radialGradient id="sunGlow">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sunBody">
            <stop offset="0%" stopColor="#FFEC8B" />
            <stop offset="100%" stopColor="#FFD700" />
          </radialGradient>
        </defs>
        
        {/* Glow layers */}
        <circle cx="45" cy="45" r="42" fill="url(#sunGlow)" opacity="0.25" />
        <circle cx="45" cy="45" r="35" fill="url(#sunGlow)" opacity="0.35" />
        
        {/* Rays - CSS animated */}
        {[...Array(12)].map((_, i) => (
          <line
            key={i}
            x1="45"
            y1="45"
            x2={45 + Math.cos((i * 30 * Math.PI) / 180) * 40}
            y2={45 + Math.sin((i * 30 * Math.PI) / 180) * 40}
            stroke="#FFD700"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
            className="sun-ray"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
        
        {/* Sun body */}
        <circle cx="45" cy="45" r="20" fill="url(#sunBody)" />
        <circle cx="45" cy="45" r="17" fill="#FFEC8B" />
        <ellipse cx="40" cy="40" rx="5" ry="3" fill="#FFF" opacity="0.4" />
      </svg>
    </div>
  );
});

// ========== SMOOTH ANIMATED MOON (CSS-based) ==========
const AnimatedMoon = memo(({ visible, phase = 0.75 }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute top-8 right-20 moon-container" style={{ opacity: visible ? 1 : 0 }}>
      <svg width="70" height="70" viewBox="0 0 70 70" className="moon-glow">
        {/* Moon glow */}
        <circle cx="35" cy="35" r="32" fill="#F5F5DC" opacity="0.15" />
        <circle cx="35" cy="35" r="26" fill="#F5F5DC" opacity="0.25" />
        
        {/* Moon body */}
        <circle cx="35" cy="35" r="20" fill="#F5F5DC" />
        <circle cx={35 + (1 - phase) * 18} cy="35" r="18" fill="#0a2b5c" />
        
        {/* Craters */}
        <circle cx="30" cy="30" r="3.5" fill="#E8E8D0" opacity="0.5" />
        <circle cx="42" cy="40" r="2.5" fill="#E8E8D0" opacity="0.4" />
        <circle cx="32" cy="44" r="2" fill="#E8E8D0" opacity="0.35" />
        
        {/* Highlight */}
        <ellipse cx="28" cy="28" rx="4" ry="2.5" fill="#FFFFF0" opacity="0.35" />
      </svg>
    </div>
  );
});

// ========== OPTIMIZED TWINKLING STARS (CSS-based) ==========
const TwinklingStars = memo(({ visible, count = 40 }) => {
  const stars = useMemo(() => {
    if (!visible) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 40,
      size: 1.5 + Math.random() * 2,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
      type: Math.random() > 0.92 ? 'cross' : 'dot',
    }));
  }, [visible, count]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none will-change-transform">
      {stars.map(star => (
        star.type === 'cross' ? (
          <div
            key={star.id}
            className="absolute star-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size * 4,
              height: star.size * 4,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white" style={{ fontSize: star.size * 3 }}>+</div>
          </div>
        ) : (
          <div
            key={star.id}
            className="absolute rounded-full bg-white star-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              boxShadow: `0 0 ${star.size}px white`,
            }}
          />
        )
      ))}
    </div>
  );
});

// ========== OPTIMIZED CLOUDS (CSS transform-based, proportionate) ==========
const AnimatedClouds = memo(({ count = 5, stage = 0 }) => {
  const clouds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      y: 8 + Math.random() * 25,
      scale: 0.25 + Math.random() * 0.25, // Smaller scale for proportion
      duration: 80 + Math.random() * 60,
      delay: i * -15,
      type: Math.floor(Math.random() * 3),
      opacity: 0.75 + Math.random() * 0.25,
    }));
  }, [count]);
  
  const cloudColors = stage === 3 ? ['#4a4a5e', '#5a5a6e', '#3a3a4e'] : ['#FFFFFF', '#F8F8FF', '#F0F0F5'];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {clouds.map(cloud => (
        <div
          key={cloud.id}
          className="absolute cloud-float will-change-transform"
          style={{
            top: `${cloud.y}%`,
            transform: `scale(${cloud.scale})`,
            opacity: cloud.opacity,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
          }}
        >
          <svg width="160" height="70" viewBox="0 0 160 70">
            {cloud.type === 0 ? (
              <>
                <ellipse cx="45" cy="45" rx="30" ry="22" fill={cloudColors[0]} />
                <ellipse cx="80" cy="40" rx="38" ry="26" fill={cloudColors[1]} />
                <ellipse cx="115" cy="45" rx="30" ry="22" fill={cloudColors[0]} />
                <ellipse cx="80" cy="48" rx="42" ry="18" fill={cloudColors[2]} />
              </>
            ) : cloud.type === 1 ? (
              <>
                <ellipse cx="35" cy="42" rx="26" ry="16" fill={cloudColors[0]} />
                <ellipse cx="70" cy="40" rx="35" ry="20" fill={cloudColors[1]} />
                <ellipse cx="105" cy="44" rx="30" ry="18" fill={cloudColors[0]} />
                <ellipse cx="130" cy="42" rx="22" ry="14" fill={cloudColors[2]} />
              </>
            ) : (
              <>
                <ellipse cx="55" cy="48" rx="35" ry="20" fill={cloudColors[2]} />
                <ellipse cx="80" cy="35" rx="30" ry="24" fill={cloudColors[0]} />
                <ellipse cx="105" cy="48" rx="35" ry="20" fill={cloudColors[2]} />
                <ellipse cx="80" cy="42" rx="38" ry="18" fill={cloudColors[1]} />
              </>
            )}
          </svg>
        </div>
      ))}
    </div>
  );
});

// ========== OPTIMIZED SEAGULLS (CSS animation, proportionate) ==========
export const FlyingSeagulls = memo(({ count = 4, direction = 'right' }) => {
  const birds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      y: 12 + Math.random() * 20,
      size: 18 + Math.random() * 10, // Smaller, proportionate size
      duration: 25 + Math.random() * 15,
      delay: i * -6,
      flapDuration: 0.4 + Math.random() * 0.2,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {birds.map(bird => (
        <div
          key={bird.id}
          className={`absolute seagull-fly will-change-transform ${direction === 'left' ? 'seagull-left' : ''}`}
          style={{
            top: `${bird.y}%`,
            animationDuration: `${bird.duration}s`,
            animationDelay: `${bird.delay}s`,
          }}
        >
          <svg
            width={bird.size}
            height={bird.size * 0.5}
            viewBox="0 0 40 20"
            className="seagull-wings"
            style={{ animationDuration: `${bird.flapDuration}s` }}
          >
            {/* Body */}
            <ellipse cx="20" cy="11" rx="6" ry="3" fill="#F5F5F5" />
            <ellipse cx="20" cy="10.5" rx="4.5" ry="2.2" fill="#FFFFFF" />
            
            {/* Head */}
            <circle cx="26" cy="9.5" r="3" fill="#F5F5F5" />
            <circle cx="27.5" cy="9" r="1" fill="#1a1a1a" />
            
            {/* Beak */}
            <path d="M 29 10 L 33 10.5 L 29 11 Z" fill="#FFA500" />
            
            {/* Wings - animated via CSS */}
            <path className="wing-left" d="M 20 11 Q 12 6 4 4" stroke="#E8E8E8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path className="wing-right" d="M 20 11 Q 28 6 36 4" stroke="#E8E8E8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            
            {/* Tail */}
            <path d="M 14 11 L 10 13 L 10 9 Z" fill="#E8E8E8" />
          </svg>
        </div>
      ))}
    </div>
  );
});

export const FlyingBirds = FlyingSeagulls;

// ========== OPTIMIZED ISLAND (Proper size, CSS animations) ==========
export const AnimatedIsland = memo(({ season = 'summer', side = 'right' }) => {
  const isRight = side === 'right';

  return (
    <div 
      className={`absolute ${isRight ? 'right-6' : 'left-6'} island-bob will-change-transform`} 
      style={{ 
        bottom: '40%',
        transform: `${isRight ? 'scaleX(1)' : 'scaleX(-1)'}`,
        zIndex: 15,
      }}
    >
      <svg width="120" height="110" viewBox="0 0 120 110" className="island-svg">
        {/* Water reflection */}
        <ellipse cx="60" cy="100" rx="50" ry="8" fill="#4A90D9" opacity="0.2" className="ripple-1" />
        <ellipse cx="60" cy="102" rx="55" ry="6" fill="#2E5A88" opacity="0.15" className="ripple-2" />
        
        {/* Island base */}
        <ellipse cx="60" cy="90" rx="48" ry="14" fill="url(#islandSand)" />
        <ellipse cx="60" cy="87" rx="40" ry="11" fill="#F4D03F" opacity="0.45" />
        
        {/* Beach details */}
        <circle cx="35" cy="88" r="2" fill="#DEB887" opacity="0.6" />
        <circle cx="82" cy="90" r="1.5" fill="#A0522D" opacity="0.5" />
        <path d="M 42 92 L 44 89 L 46 91 L 44 94 L 41 93 Z" fill="#FF6B6B" opacity="0.5" />
        
        {/* Main palm trunk */}
        <path d="M 60 88 Q 57 70 52 42" stroke="#654321" strokeWidth="7" fill="none" strokeLinecap="round" className="palm-sway" />
        <path d="M 60 88 Q 57 70 52 42" stroke="#8B4513" strokeWidth="5" fill="none" strokeLinecap="round" className="palm-sway" />
        
        {/* Palm leaves */}
        {[-55, -30, -5, 20, 45].map((angle, i) => (
          <path
            key={i}
            className="palm-leaf palm-sway"
            style={{ animationDelay: `${i * 0.1}s` }}
            d={`M 52 42 Q ${52 + angle * 0.7} ${25} ${52 + angle * 1.1} ${38 + Math.abs(angle) * 0.1}`}
            stroke={season === 'winter' ? '#E0E0E0' : '#2E7D32'}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        
        {/* Coconuts */}
        <circle cx="50" cy="44" r="3.5" fill="#4E342E" />
        <circle cx="54" cy="47" r="3" fill="#5D4037" />
        
        {/* Small palm */}
        <path d="M 82 90 Q 80 78 77 65" stroke="#654321" strokeWidth="4" fill="none" strokeLinecap="round" className="palm-sway-small" />
        <path d="M 82 90 Q 80 78 77 65" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" className="palm-sway-small" />
        
        {[-40, -10, 20, 45].map((angle, i) => (
          <path
            key={`small-${i}`}
            className="palm-leaf palm-sway-small"
            style={{ animationDelay: `${i * 0.12}s` }}
            d={`M 77 65 Q ${77 + angle * 0.4} ${56} ${77 + angle * 0.7} ${61}`}
            stroke={season === 'winter' ? '#E0E0E0' : '#388E3C'}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        
        {/* Summer umbrella */}
        {season === 'summer' && (
          <g className="umbrella">
            <line x1="38" y1="88" x2="38" y2="72" stroke="#8B4513" strokeWidth="1.5" />
            <path d="M 26 72 Q 38 62 50 72 Z" fill="#FF6B6B" />
          </g>
        )}
        
        {/* Winter snow */}
        {season === 'winter' && (
          <>
            <ellipse cx="60" cy="84" rx="38" ry="8" fill="#FFFFFF" opacity="0.65" />
            <ellipse cx="55" cy="82" rx="28" ry="5" fill="#F0F8FF" opacity="0.45" />
          </>
        )}
        
        {/* Spring flowers */}
        {season === 'spring' && (
          <>
            <circle cx="35" cy="86" r="2.5" fill="#FF69B4" opacity="0.65" />
            <circle cx="35" cy="86" r="1.2" fill="#FFD700" />
          </>
        )}
        
        <defs>
          <linearGradient id="islandSand" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F4D03F" />
            <stop offset="50%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
});

// ========== OPTIMIZED WATER (CSS animations, reduced elements) ==========
const EnhancedWater = memo(({ stage, season }) => {
  const stageColors = getStageColors(stage, season);
  
  // Reduced fish shadows for performance
  const fishShadows = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      y: 25 + Math.random() * 50,
      size: 18 + Math.random() * 18,
      duration: 20 + Math.random() * 15,
      delay: i * -5,
      direction: i % 2 === 0 ? 1 : -1,
      depth: 0.12 + Math.random() * 0.18,
    }));
  }, []);
  
  return (
    <div className="absolute bottom-0 left-0 right-0 water-container" style={{ height: '45%', zIndex: 10 }}>
      {/* Base water gradient */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: `linear-gradient(180deg, ${stageColors.waterColors[0]} 0%, ${stageColors.waterColors[1]} 100%)` 
        }}
      />
      
      {/* CSS-animated wave overlay */}
      <div className="absolute inset-0 wave-layer-1" />
      <div className="absolute inset-0 wave-layer-2" />
      <div className="absolute inset-0 wave-layer-3" />
      
      {/* Fish shadows - CSS animated */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fishShadows.map(fish => (
          <div
            key={fish.id}
            className="absolute fish-swim will-change-transform"
            style={{
              top: `${fish.y}%`,
              opacity: fish.depth,
              transform: `scaleX(${fish.direction})`,
              animationDuration: `${fish.duration}s`,
              animationDelay: `${fish.delay}s`,
            }}
          >
            <svg width={fish.size} height={fish.size * 0.6} viewBox="0 0 36 22">
              <ellipse cx="16" cy="11" rx="12" ry="8" fill="#000" opacity="0.5" />
              <path d="M 26 11 L 34 5 L 32 11 L 34 17 Z" fill="#000" opacity="0.5" />
            </svg>
          </div>
        ))}
      </div>
      
      {/* Sparkle reflections - CSS animated */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute water-sparkle"
            style={{
              left: `${8 + i * 8}%`,
              top: `${15 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>
      
      {/* Surface shine */}
      <div className="absolute inset-0 water-shine pointer-events-none" />
      
      {/* Depth gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.12) 100%)' }}
      />
    </div>
  );
});

// ========== OPTIMIZED SEASONAL PARTICLES (CSS-based, proportionate) ==========
const SeasonalParticles = memo(({ season, count = 15 }) => {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: season === 'winter' ? 3 + Math.random() * 4 : 8 + Math.random() * 10, // Smaller snowflakes
      duration: season === 'winter' ? 6 + Math.random() * 4 : 8 + Math.random() * 6,
      delay: Math.random() * 8,
      swayAmount: season === 'winter' ? 8 + Math.random() * 12 : 15 + Math.random() * 20,
    }));
  }, [count, season]);

  const particleClass = {
    spring: 'particle-petal',
    summer: 'particle-butterfly',
    autumn: 'particle-leaf',
    winter: 'particle-snow',
  }[season];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute ${particleClass} will-change-transform`}
          style={{
            left: `${p.x}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--sway': `${p.swayAmount}px`,
          }}
        >
          {season === 'spring' && (
            <svg width={p.size} height={p.size} viewBox="0 0 20 20">
              <ellipse cx="10" cy="5" rx="3.5" ry="5" fill="#FFB7C5" />
              <ellipse cx="5" cy="10" rx="3.5" ry="5" fill="#FFC0CB" transform="rotate(-50 5 10)" />
              <ellipse cx="15" cy="10" rx="3.5" ry="5" fill="#FFB6C1" transform="rotate(50 15 10)" />
              <ellipse cx="10" cy="15" rx="3.5" ry="5" fill="#FF69B4" />
              <circle cx="10" cy="10" r="2" fill="#FFD700" />
            </svg>
          )}
          {season === 'summer' && (
            <svg width={p.size * 1.2} height={p.size} viewBox="0 0 24 18" className="butterfly-flutter">
              <ellipse cx="12" cy="10" rx="8" ry="5" fill="#FFA500" />
              <path d="M 4 10 Q 0 6 4 3 Q 8 7 4 10" fill="#FF8C00" />
              <path d="M 20 10 Q 24 6 20 3 Q 16 7 20 10" fill="#FF8C00" />
              <circle cx="8" cy="8" r="1" fill="#000" />
            </svg>
          )}
          {season === 'autumn' && (
            <svg width={p.size} height={p.size} viewBox="0 0 20 20" className="leaf-spin">
              <path d="M 10 2 Q 16 10 10 18 Q 4 10 10 2" fill={['#FF4500', '#FF6347', '#CD853F', '#DAA520'][p.id % 4]} />
              <line x1="10" y1="2" x2="10" y2="18" stroke="#8B4513" strokeWidth="1" />
            </svg>
          )}
          {season === 'winter' && (
            <div 
              className="rounded-full snowflake-shimmer"
              style={{ 
                width: p.size, 
                height: p.size,
                background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(220,240,255,0.7) 50%, rgba(200,230,255,0.4) 100%)',
                boxShadow: `0 0 ${p.size}px rgba(255,255,255,0.5)`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
});

// ========== OPTIMIZED DISTANT HORIZON ==========
const DistantHorizon = memo(({ stage, season }) => {
  const stageColors = getStageColors(stage, season);
  const isNight = stageColors.timeOfDay === 'night';
  
  return (
    <div className="absolute bottom-[45%] left-0 right-0 h-16 pointer-events-none">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 64">
        <path
          d="M 0 64 L 0 50 L 100 38 L 200 46 L 300 30 L 400 42 L 500 26 L 600 38 L 700 32 L 800 44 L 900 36 L 1000 46 L 1100 34 L 1200 42 L 1200 64 Z"
          fill={isNight ? 'rgba(20, 30, 50, 0.35)' : 'rgba(100, 130, 160, 0.2)'}
        />
        <path
          d="M 0 64 L 0 54 L 150 44 L 250 52 L 350 40 L 450 50 L 550 38 L 650 48 L 750 42 L 850 52 L 950 44 L 1050 54 L 1150 46 L 1200 50 L 1200 64 Z"
          fill={isNight ? 'rgba(30, 45, 70, 0.3)' : 'rgba(130, 160, 190, 0.15)'}
        />
      </svg>
    </div>
  );
});

// ========== OPTIMIZED UNDERWATER BUBBLES ==========
const UnderwaterBubbles = memo(({ active = true }) => {
  const bubbles = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 44 + Math.random() * 12,
      size: 4 + Math.random() * 5,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 3,
    }));
  }, [active]);
  
  if (!active) return null;
  
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-25 overflow-hidden" style={{ height: '50%' }}>
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute bubble-rise will-change-transform"
          style={{
            left: `${bubble.x}%`,
            bottom: 0,
            width: bubble.size,
            height: bubble.size,
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
          }}
        >
          <div 
            className="w-full h-full rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, rgba(135,206,235,0.3) 50%, rgba(135,206,235,0.15) 100%)',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          />
        </div>
      ))}
    </div>
  );
});

// ========== SHOOTING STARS (CSS-based) ==========
const ShootingStars = memo(({ visible }) => {
  const [stars, setStars] = useState([]);
  
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.92) {
        setStars(prev => [...prev.slice(-2), {
          id: Date.now(),
          x: 10 + Math.random() * 50,
          y: 5 + Math.random() * 15,
          angle: 20 + Math.random() * 25,
          duration: 0.6 + Math.random() * 0.4,
        }]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [visible]);
  
  useEffect(() => {
    if (stars.length === 0) return;
    const timeout = setTimeout(() => {
      setStars(prev => prev.slice(1));
    }, 1500);
    return () => clearTimeout(timeout);
  }, [stars]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute shooting-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            transform: `rotate(${star.angle}deg)`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
});

// ========== FIREFLIES (CSS-based) ==========
const Fireflies = memo(({ visible, count = 10 }) => {
  const fireflies = useMemo(() => {
    if (!visible) return [];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 35 + Math.random() * 45,
      duration: 4 + Math.random() * 3,
      glowDuration: 1.5 + Math.random() * 1,
      delay: Math.random() * 4,
    }));
  }, [visible, count]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {fireflies.map(fly => (
        <div
          key={fly.id}
          className="absolute firefly-float"
          style={{
            left: `${fly.x}%`,
            top: `${fly.y}%`,
            animationDuration: `${fly.duration}s`,
            animationDelay: `${fly.delay}s`,
          }}
        >
          <div 
            className="w-2 h-2 rounded-full firefly-glow"
            style={{ animationDuration: `${fly.glowDuration}s` }}
          />
        </div>
      ))}
    </div>
  );
});

// ========== LENS FLARE ==========
const LensFlare = memo(({ visible }) => {
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden lens-flare-container">
      <div className="absolute top-6 right-20 w-32 h-32 lens-flare-main" />
      <div className="absolute top-[20%] right-[35%] w-6 h-6 rounded-full lens-flare-secondary" />
      <div className="absolute top-[30%] right-[45%] w-3 h-3 rounded-full lens-flare-tertiary" />
      <div className="absolute top-[40%] right-[50%] w-10 h-10 rounded-full lens-flare-secondary" style={{ opacity: 0.15 }} />
    </div>
  );
});

// ========== MAIN BACKGROUND COMPONENT ==========
export const RetroBackground = memo(({ stage, timeOfDay, showRain, showLightning, season = null }) => {
  const currentSeason = season || getCurrentSeason();
  const stageColors = getStageColors(stage, currentSeason);
  
  const [lightningFlash, setLightningFlash] = useState(false);

  const showSun = stageColors.timeOfDay === 'day';
  const showMoon = !showSun && (stageColors.timeOfDay === 'night' || stageColors.timeOfDay === 'dusk');
  const isNight = stageColors.timeOfDay === 'night';
  const showFireflies = (isNight || stageColors.timeOfDay === 'dusk') && currentSeason === 'summer';

  // Lightning effect - optimized
  useEffect(() => {
    if (!showLightning) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.88) {
        setLightningFlash(true);
        setTimeout(() => setLightningFlash(false), 80);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [showLightning]);

  return (
    <div className="absolute inset-0 overflow-hidden gpu-accelerate">
      {/* Sky gradient */}
      <div 
        className="absolute inset-0 sky-transition"
        style={{ 
          background: `linear-gradient(180deg, 
            ${stageColors.skyColors[0]} 0%, 
            ${stageColors.skyColors[1]} 50%, 
            ${stageColors.waterColors[0]} 100%)` 
        }}
      />
      
      {/* Distant horizon */}
      <DistantHorizon stage={stage} season={currentSeason} />

      {/* Sun */}
      <AnimatedSun visible={showSun} />
      
      {/* Lens flare */}
      <LensFlare visible={showSun && stage === 0} />
      
      {/* Moon */}
      <AnimatedMoon visible={showMoon} phase={0.75} />
      
      {/* Stars */}
      <TwinklingStars visible={isNight} count={45} />
      
      {/* Shooting stars */}
      <ShootingStars visible={isNight} />
      
      {/* Clouds */}
      <AnimatedClouds count={stage === 3 ? 7 : 5} stage={stage} />

      {/* Water */}
      <EnhancedWater stage={stage} season={currentSeason} />
      
      {/* Bubbles */}
      <UnderwaterBubbles active={true} />

      {/* Seasonal particles */}
      <SeasonalParticles season={currentSeason} count={currentSeason === 'winter' ? 25 : 15} />
      
      {/* Fireflies */}
      <Fireflies visible={showFireflies} count={12} />

      {/* Rain - CSS animated */}
      {showRain && <div className="absolute inset-0 rain-effect pointer-events-none" />}

      {/* Lightning flash */}
      {lightningFlash && (
        <div className="absolute inset-0 bg-white opacity-80 pointer-events-none lightning-flash" />
      )}
      
      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.2) 100%)' }}
      />
    </div>
  );
});

// ========== FISH & BOBBER SPRITES ==========
export const PixelFish = memo(({ color, size, wiggle = false }) => {
  return (
    <svg 
      width={size} 
      height={size * 0.6} 
      viewBox="0 0 50 30" 
      className={wiggle ? 'fish-wiggle' : ''} 
      style={{ filter: 'drop-shadow(2px 3px 3px rgba(0,0,0,0.3))' }}
    >
      <ellipse cx="23" cy="15" rx="17" ry="11" fill={color} />
      <ellipse cx="21" cy="15" rx="14" ry="9" fill={color} opacity="0.9" />
      <path d="M 36 15 L 48 8 L 44 15 L 48 22 Z" fill={color} />
      <path d="M 18 6 Q 15 1 19 3 Q 22 2 20 6 Z" fill={color} opacity="0.85" />
      <path d="M 18 24 Q 15 29 19 27 Q 22 28 20 24 Z" fill={color} opacity="0.85" />
      <circle cx="12" cy="12" r="4" fill="#FFF" />
      <circle cx="11" cy="11" r="2.5" fill="#000" />
      <circle cx="10" cy="10" r="1" fill="#FFF" />
      <ellipse cx="22" cy="15" rx="4" ry="7" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="16" cy="10" rx="6" ry="3" fill="rgba(255,255,255,0.12)" />
    </svg>
  );
});

export const PixelBobber = memo(({ isActive, wobble = false }) => (
  <svg 
    width="36" 
    height="36" 
    viewBox="0 0 36 36" 
    className={isActive ? 'bobber-shake' : wobble ? 'bobber-bob' : ''} 
    style={{ filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.4))' }}
  >
    <circle cx="18" cy="18" r="13" fill="#FF4444" />
    <circle cx="18" cy="18" r="10" fill="#FFFFFF" />
    <circle cx="18" cy="18" r="6" fill="#FF4444" />
    <ellipse cx="14" cy="14" rx="3.5" ry="2.5" fill="#FFAAAA" opacity="0.7" />
    <circle cx="13" cy="13" r="1.5" fill="#FFF" opacity="0.45" />
    
    {/* Target rings removed - they disturbed the feel */}
  </svg>
));

// ========== WATER RIPPLE EFFECT ==========
export const WaterRipple = memo(({ x, y, active = true }) => {
  const [ripples, setRipples] = useState([]);
  
  useEffect(() => {
    if (!active) {
      setRipples([]);
      return;
    }
    
    // Create new ripple every 1.5 seconds
    const interval = setInterval(() => {
      const newRipple = {
        id: Date.now(),
        startTime: Date.now(),
      };
      setRipples(prev => [...prev.slice(-3), newRipple]); // Keep max 4 ripples
    }, 1500);
    
    // Initial ripple
    setRipples([{ id: Date.now(), startTime: Date.now() }]);
    
    return () => clearInterval(interval);
  }, [active]);
  
  if (!active || ripples.length === 0) return null;
  
  return (
    <div className="absolute pointer-events-none" style={{ left: x - 60, top: y - 30 }}>
      <svg width="120" height="60" viewBox="0 0 120 60">
        {ripples.map((ripple) => {
          const age = (Date.now() - ripple.startTime) / 1000;
          const progress = Math.min(age / 2, 1);
          const opacity = Math.max(0, 1 - progress);
          
          return (
            <g key={ripple.id}>
              {/* Multiple expanding rings */}
              {[0, 0.2, 0.4].map((delay, i) => {
                const ringProgress = Math.max(0, Math.min(1, (progress - delay) / 0.8));
                const ringOpacity = Math.max(0, opacity - delay * 0.5) * (1 - ringProgress);
                const radius = 5 + ringProgress * 50;
                
                return (
                  <ellipse
                    key={i}
                    cx="60"
                    cy="30"
                    rx={radius}
                    ry={radius * 0.4}
                    fill="none"
                    stroke="#4A90D9"
                    strokeWidth={Math.max(0.5, 2 - ringProgress * 1.5)}
                    opacity={ringOpacity * 0.6}
                    style={{
                      transition: 'all 0.1s linear',
                    }}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export const WaterSplash = memo(({ x, y }) => (
  <div className="absolute pointer-events-none splash-anim" style={{ left: x - 45, top: y - 25 }}>
    <svg width="90" height="55">
      <ellipse cx="45" cy="28" rx="12" ry="8" fill="#00AAFF" opacity="0.7" />
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        const distance = 15 + i * 3;
        return (
          <circle
            key={i}
            cx={45 + Math.cos(angle) * distance}
            cy={28 + Math.sin(angle) * (distance * 0.55)}
            r={4 - i * 0.3}
            fill="#00AAFF"
            opacity={0.65 - i * 0.06}
          />
        );
      })}
    </svg>
  </div>
));

export const ParticleEffects = memo(({ type, x, y }) => {
  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      angle: (i / 12) * Math.PI * 2,
      distance: 20 + Math.random() * 40,
      size: 5 + Math.random() * 6,
      color: type === 'perfect' ? '#00FF00' : type === 'catch' ? '#FFD700' : '#FF6B6B',
    }))
  , [type]);

  return (
    <div className="absolute pointer-events-none particle-burst" style={{ left: x, top: y }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: Math.cos(p.angle) * p.distance,
            top: Math.sin(p.angle) * p.distance,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
});

// ========== BOAT & WHALE SPRITES ==========
export const AnimatedBoats = memo(({ show, type = 0, season = 'summer' }) => {
  if (!show) return null;

  const boats = [
    <svg key="rowboat" width="65" height="45" viewBox="0 0 65 45">
      <path d="M 8 32 Q 4 36 15 38 L 50 38 Q 61 36 57 32 Z" fill="#8B4513" />
      <path d="M 12 32 Q 10 34 16 36 L 49 36 Q 55 34 53 32 Z" fill="#A0522D" />
      <rect x="28" y="18" width="4" height="14" fill="#654321" />
      <rect x="18" y="22" width="24" height="3" fill="#8B4513" rx="1.5" />
    </svg>,
    <svg key="sailboat" width="80" height="65" viewBox="0 0 80 65">
      <path d="M 12 48 Q 8 52 18 54 L 62 54 Q 72 52 68 48 Z" fill="#CD853F" />
      <rect x="38" y="18" width="4" height="30" fill="#8B4513" />
      <path d="M 40 18 L 40 42 L 68 32 Z" fill="#FFFFFF" />
      <path d="M 40 18 L 40 40 L 16 30 Z" fill="#FFD700" />
    </svg>,
  ];

  return (
    <div className="absolute boat-float z-15" style={{ top: '46%' }}>
      {boats[type % boats.length]}
    </div>
  );
});

export const WhaleSprite = memo(({ show }) => {
  if (!show) return null;

  return (
    <div className="absolute whale-swim z-20" style={{ top: '43%' }}>
      <svg width="110" height="75" viewBox="0 0 110 75">
        <ellipse cx="50" cy="55" rx="40" ry="6" fill="#000" opacity="0.12" />
        <ellipse cx="50" cy="42" rx="42" ry="22" fill="#2C3E50" />
        <ellipse cx="46" cy="40" rx="36" ry="18" fill="#34495E" />
        <ellipse cx="42" cy="48" rx="28" ry="12" fill="#4A6572" opacity="0.45" />
        <path d="M 88 42 Q 100 30 110 25 Q 102 42 110 58 Q 100 52 88 42" fill="#2C3E50" className="whale-tail" />
        <path d="M 42 24 Q 48 14 56 22 Q 50 28 44 28 Z" fill="#34495E" />
        <ellipse cx="30" cy="50" rx="12" ry="5" fill="#34495E" transform="rotate(-18 30 50)" />
        <circle cx="18" cy="38" r="4" fill="#FFFFFF" />
        <circle cx="17" cy="37" r="2.5" fill="#1a1a1a" />
        <circle cx="16" cy="36" r="0.8" fill="#FFFFFF" />
        <path d="M 10 46 Q 18 52 26 46" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path className="whale-spout" d="M 38 22 Q 36 12 38 2 Q 40 12 38 22" stroke="#87CEEB" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
});

export const BoatSprite = AnimatedBoats;

export default RetroBackground;
