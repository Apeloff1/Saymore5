import React, { useEffect, useState, useRef, useMemo } from 'react';

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

// Get current season based on date
const getCurrentSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
};

// ========== STAGES WITH SEASONAL OVERRIDE ==========
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

// ========== IMPROVEMENT 1: ANIMATED SUN ==========
const AnimatedSun = ({ visible, stage }) => {
  const [rays, setRays] = useState(0);
  
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setRays(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute top-8 right-20 transition-all duration-1000" style={{ opacity: visible ? 1 : 0 }}>
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Outer glow */}
        <circle cx="60" cy="60" r="55" fill="url(#sunGlow)" opacity="0.3" />
        <circle cx="60" cy="60" r="45" fill="url(#sunGlow)" opacity="0.4" />
        
        {/* Animated rays */}
        {[...Array(16)].map((_, i) => {
          const angle = ((i * 22.5 + rays) * Math.PI) / 180;
          const innerR = 32;
          const outerR = 48 + Math.sin(rays * 0.05 + i) * 5;
          return (
            <line
              key={i}
              x1={60 + Math.cos(angle) * innerR}
              y1={60 + Math.sin(angle) * innerR}
              x2={60 + Math.cos(angle) * outerR}
              y2={60 + Math.sin(angle) * outerR}
              stroke="#FFD700"
              strokeWidth="3"
              strokeLinecap="round"
              opacity={0.7 + Math.sin(rays * 0.1 + i) * 0.3}
            />
          );
        })}
        
        {/* Sun body with gradient */}
        <circle cx="60" cy="60" r="28" fill="url(#sunBody)" />
        <circle cx="60" cy="60" r="24" fill="#FFEC8B" />
        <circle cx="52" cy="52" r="8" fill="#FFF" opacity="0.5" />
        
        {/* Definitions */}
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
      </svg>
    </div>
  );
};

// ========== IMPROVEMENT 2: ANIMATED MOON ==========
const AnimatedMoon = ({ visible, phase = 0.7 }) => {
  const [glow, setGlow] = useState(0);
  
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setGlow(prev => prev + 0.02);
    }, 50);
    return () => clearInterval(interval);
  }, [visible]);
  
  if (!visible) return null;
  
  const glowIntensity = 0.3 + Math.sin(glow) * 0.15;
  
  return (
    <div className="absolute top-10 right-24 transition-all duration-1000" style={{ opacity: visible ? 1 : 0 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Moon glow */}
        <circle cx="50" cy="50" r="45" fill="#F5F5DC" opacity={glowIntensity * 0.3} />
        <circle cx="50" cy="50" r="38" fill="#F5F5DC" opacity={glowIntensity * 0.5} />
        
        {/* Moon body */}
        <circle cx="50" cy="50" r="28" fill="#F5F5DC" />
        
        {/* Moon shadow for phase */}
        <circle cx={50 + (1 - phase) * 25} cy="50" r="26" fill="#0a2b5c" />
        
        {/* Craters */}
        <circle cx="42" cy="42" r="5" fill="#E8E8D0" opacity="0.6" />
        <circle cx="58" cy="55" r="4" fill="#E8E8D0" opacity="0.5" />
        <circle cx="45" cy="62" r="3" fill="#E8E8D0" opacity="0.4" />
        <circle cx="55" cy="38" r="2" fill="#E8E8D0" opacity="0.5" />
        
        {/* Highlight */}
        <ellipse cx="40" cy="40" rx="6" ry="4" fill="#FFFFF0" opacity="0.4" />
      </svg>
    </div>
  );
};

// ========== IMPROVEMENT 3: TWINKLING STARS ==========
const TwinklingStars = ({ visible, count = 50 }) => {
  const [stars, setStars] = useState([]);
  
  useEffect(() => {
    if (!visible) return;
    const newStars = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 45,
      size: 1 + Math.random() * 2.5,
      twinkleSpeed: 0.02 + Math.random() * 0.03,
      twinkleOffset: Math.random() * Math.PI * 2,
      type: Math.random() > 0.9 ? 'cross' : 'dot',
    }));
    setStars(newStars);
  }, [visible, count]);
  
  const [twinkle, setTwinkle] = useState(0);
  
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setTwinkle(prev => prev + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map(star => {
        const opacity = 0.3 + Math.sin(twinkle * star.twinkleSpeed * 50 + star.twinkleOffset) * 0.7;
        const scale = 1 + Math.sin(twinkle * star.twinkleSpeed * 30 + star.twinkleOffset) * 0.3;
        
        return star.type === 'cross' ? (
          <svg
            key={star.id}
            className="absolute"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size * 6,
              height: star.size * 6,
              opacity,
              transform: `scale(${scale})`,
            }}
            viewBox="0 0 20 20"
          >
            <line x1="10" y1="2" x2="10" y2="18" stroke="white" strokeWidth="2" />
            <line x1="2" y1="10" x2="18" y2="10" stroke="white" strokeWidth="2" />
          </svg>
        ) : (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              opacity,
              transform: `scale(${scale})`,
              boxShadow: `0 0 ${star.size * 2}px white`,
            }}
          />
        );
      })}
    </div>
  );
};

// ========== IMPROVEMENT 4: ANIMATED CLOUDS ==========
const AnimatedClouds = ({ count = 6, speed = 1, stage = 0 }) => {
  const [clouds, setClouds] = useState([]);
  
  useEffect(() => {
    const newClouds = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: -20 + (i * 120) + Math.random() * 50,
      y: 30 + Math.random() * 80,
      scale: 0.6 + Math.random() * 0.8,
      speed: (0.1 + Math.random() * 0.15) * speed,
      type: Math.floor(Math.random() * 3),
      opacity: 0.7 + Math.random() * 0.3,
    }));
    setClouds(newClouds);
  }, [count, speed]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setClouds(prev => prev.map(cloud => ({
        ...cloud,
        x: cloud.x > window.innerWidth + 200 ? -200 : cloud.x + cloud.speed,
      })));
    }, 30);
    return () => clearInterval(interval);
  }, []);
  
  const cloudColors = stage === 3 ? ['#4a4a5e', '#5a5a6e', '#3a3a4e'] : ['#FFFFFF', '#F8F8FF', '#F0F0F5'];
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {clouds.map(cloud => (
        <svg
          key={cloud.id}
          className="absolute transition-none"
          style={{
            left: cloud.x,
            top: cloud.y,
            transform: `scale(${cloud.scale})`,
            opacity: cloud.opacity,
          }}
          width="180"
          height="80"
          viewBox="0 0 180 80"
        >
          {cloud.type === 0 ? (
            // Fluffy cloud type 1
            <>
              <ellipse cx="50" cy="50" rx="35" ry="25" fill={cloudColors[0]} />
              <ellipse cx="90" cy="45" rx="45" ry="30" fill={cloudColors[1]} />
              <ellipse cx="130" cy="50" rx="35" ry="25" fill={cloudColors[0]} />
              <ellipse cx="90" cy="55" rx="50" ry="22" fill={cloudColors[2]} />
              <ellipse cx="70" cy="40" rx="20" ry="15" fill={cloudColors[1]} opacity="0.8" />
              <ellipse cx="110" cy="38" rx="18" ry="14" fill={cloudColors[1]} opacity="0.8" />
            </>
          ) : cloud.type === 1 ? (
            // Wispy cloud type 2
            <>
              <ellipse cx="40" cy="50" rx="30" ry="18" fill={cloudColors[0]} />
              <ellipse cx="80" cy="48" rx="40" ry="22" fill={cloudColors[1]} />
              <ellipse cx="120" cy="52" rx="35" ry="20" fill={cloudColors[0]} />
              <ellipse cx="150" cy="50" rx="25" ry="15" fill={cloudColors[2]} />
            </>
          ) : (
            // Puffy cloud type 3
            <>
              <ellipse cx="60" cy="55" rx="40" ry="22" fill={cloudColors[2]} />
              <ellipse cx="90" cy="40" rx="35" ry="28" fill={cloudColors[0]} />
              <ellipse cx="120" cy="55" rx="40" ry="22" fill={cloudColors[2]} />
              <ellipse cx="90" cy="50" rx="45" ry="20" fill={cloudColors[1]} />
              <ellipse cx="75" cy="35" rx="15" ry="12" fill={cloudColors[0]} opacity="0.9" />
              <ellipse cx="105" cy="32" rx="18" ry="14" fill={cloudColors[0]} opacity="0.9" />
            </>
          )}
        </svg>
      ))}
    </div>
  );
};

// ========== IMPROVEMENT 5: FLYING SEAGULLS ==========
export const FlyingSeagulls = ({ count = 6, direction = 'right' }) => {
  const [birds, setBirds] = useState([]);
  const [wingPhases, setWingPhases] = useState({});
  
  useEffect(() => {
    const newBirds = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: direction === 'right' ? -25 - i * 20 : 125 + i * 20,
      y: 8 + Math.random() * 30,
      speed: 0.12 + Math.random() * 0.08,
      size: 25 + Math.random() * 20,
      verticalOffset: Math.random() * Math.PI * 2,
      flapSpeed: 0.15 + Math.random() * 0.1,
    }));
    setBirds(newBirds);
    
    const phases = {};
    newBirds.forEach(b => { phases[b.id] = Math.random() * Math.PI * 2; });
    setWingPhases(phases);
  }, [count, direction]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBirds(prev => prev.map(b => ({
        ...b,
        x: direction === 'right' 
          ? (b.x > 125 ? -25 : b.x + b.speed)
          : (b.x < -25 ? 125 : b.x - b.speed),
        y: b.y + Math.sin(Date.now() * 0.002 + b.verticalOffset) * 0.08,
      })));
      setWingPhases(prev => {
        const newPhases = { ...prev };
        Object.keys(newPhases).forEach(id => {
          newPhases[id] += 0.25;
        });
        return newPhases;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {birds.map(bird => {
        const wingY = Math.sin(wingPhases[bird.id] || 0) * 8;
        const bodyTilt = Math.sin(wingPhases[bird.id] * 0.5 || 0) * 2;
        
        return (
          <svg
            key={bird.id}
            width={bird.size}
            height={bird.size * 0.5}
            viewBox="0 0 50 25"
            className="absolute"
            style={{
              left: `${bird.x}%`,
              top: `${bird.y}%`,
              transform: `scaleX(${direction === 'right' ? 1 : -1}) rotate(${bodyTilt}deg)`,
            }}
          >
            {/* Body */}
            <ellipse cx="25" cy="14" rx="8" ry="4" fill="#F5F5F5" />
            <ellipse cx="25" cy="13" rx="6" ry="3" fill="#FFFFFF" />
            
            {/* Head */}
            <circle cx="33" cy="12" r="4" fill="#F5F5F5" />
            <circle cx="35" cy="11" r="1.5" fill="#1a1a1a" />
            
            {/* Beak */}
            <path d="M 37 12 L 42 13 L 37 14 Z" fill="#FFA500" />
            
            {/* Left wing */}
            <path
              d={`M 25 14 Q 15 ${8 + wingY} 5 ${6 + wingY * 1.2}`}
              stroke="#E8E8E8"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M 25 14 Q 15 ${8 + wingY} 5 ${6 + wingY * 1.2}`}
              stroke="#F5F5F5"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Right wing */}
            <path
              d={`M 25 14 Q 35 ${8 + wingY} 45 ${6 + wingY * 1.2}`}
              stroke="#E8E8E8"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M 25 14 Q 35 ${8 + wingY} 45 ${6 + wingY * 1.2}`}
              stroke="#F5F5F5"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            
            {/* Tail */}
            <path d="M 17 14 L 12 16 L 12 12 Z" fill="#E8E8E8" />
          </svg>
        );
      })}
    </div>
  );
};

// Keep old name for compatibility
export const FlyingBirds = FlyingSeagulls;

// ========== IMPROVEMENT 6: IMPROVED ISLAND ON WATER ==========
export const AnimatedIsland = ({ season = 'summer', side = 'right' }) => {
  const [palmSway, setPalmSway] = useState(0);
  const [waveOffset, setWaveOffset] = useState(0);
  const seasonData = SEASONS[season];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPalmSway(prev => prev + 0.04);
      setWaveOffset(prev => prev + 0.08);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const swayAmount = Math.sin(palmSway) * 4;
  const isRight = side === 'right';
  const bobAmount = Math.sin(waveOffset) * 3;

  return (
    <div 
      className={`absolute ${isRight ? 'right-4' : 'left-4'}`} 
      style={{ 
        bottom: '42%',
        transform: `${isRight ? 'scaleX(1)' : 'scaleX(-1)'} translateY(${bobAmount}px)`,
        transition: 'transform 0.3s ease',
        zIndex: 15,
      }}
    >
      <svg width="160" height="140" viewBox="0 0 160 140">
        {/* Water reflection under island */}
        <ellipse cx="80" cy="130" rx="65" ry="10" fill="#4A90D9" opacity="0.25" />
        <ellipse cx="80" cy="132" rx="55" ry="7" fill="#2E5A88" opacity="0.2" />
        
        {/* Water ripples around island base */}
        <ellipse 
          cx="80" 
          cy="125" 
          rx={60 + Math.sin(waveOffset) * 5} 
          ry="8" 
          stroke="#87CEEB" 
          strokeWidth="1.5" 
          fill="none" 
          opacity={0.4 + Math.sin(waveOffset) * 0.2}
        />
        <ellipse 
          cx="80" 
          cy="127" 
          rx={70 + Math.sin(waveOffset + 1) * 5} 
          ry="10" 
          stroke="#87CEEB" 
          strokeWidth="1" 
          fill="none" 
          opacity={0.3 + Math.sin(waveOffset + 1) * 0.15}
        />
        
        {/* Island base - sand with gradient */}
        <ellipse cx="80" cy="115" rx="60" ry="18" fill="url(#sandGradient2)" />
        <ellipse cx="80" cy="112" rx="50" ry="14" fill="#F4D03F" opacity="0.5" />
        
        {/* Beach details - shells, rocks, starfish */}
        <circle cx="45" cy="113" r="2.5" fill="#DEB887" opacity="0.7" />
        <circle cx="110" cy="115" r="2" fill="#A0522D" opacity="0.6" />
        <ellipse cx="65" cy="117" rx="3" ry="1.5" fill="#F5DEB3" opacity="0.5" />
        <circle cx="95" cy="114" r="2" fill="#8B7355" opacity="0.5" />
        {/* Starfish */}
        <path d="M 55 118 L 57 114 L 60 117 L 58 121 L 54 120 Z" fill="#FF6B6B" opacity="0.6" />
        
        {/* Small grass/plants */}
        <path d="M 35 112 Q 33 105 36 108 Q 34 102 38 107" stroke="#228B22" strokeWidth="2" fill="none" opacity="0.6" />
        <path d="M 120 113 Q 122 106 119 109 Q 121 103 117 108" stroke="#228B22" strokeWidth="2" fill="none" opacity="0.6" />
        
        {/* Main palm tree trunk with texture */}
        <path 
          d={`M 80 110 Q ${77 + swayAmount * 0.3} 85 ${72 + swayAmount * 0.6} 50`} 
          stroke="#654321" 
          strokeWidth="10" 
          fill="none" 
          strokeLinecap="round" 
        />
        <path 
          d={`M 80 110 Q ${77 + swayAmount * 0.3} 85 ${72 + swayAmount * 0.6} 50`} 
          stroke="#8B4513" 
          strokeWidth="7" 
          fill="none" 
          strokeLinecap="round" 
        />
        {/* Trunk texture rings */}
        {[0, 1, 2, 3, 4].map(i => (
          <ellipse 
            key={i}
            cx={78 + swayAmount * 0.1 * (5 - i) / 5 - i * 1.5}
            cy={105 - i * 12}
            rx={3.5 - i * 0.2}
            ry={1.2}
            fill="#5D4037"
            opacity="0.35"
          />
        ))}
        
        {/* Palm leaves - detailed with shadows */}
        {[-65, -40, -15, 10, 35, 60].map((angle, i) => {
          const leafSway = swayAmount * (1.2 + i * 0.08);
          const leafLength = 50 - Math.abs(angle) * 0.25;
          const baseX = 72 + swayAmount * 0.6;
          const baseY = 50;
          
          return (
            <g key={i}>
              {/* Leaf shadow */}
              <path
                d={`M ${baseX} ${baseY} 
                    Q ${baseX + angle * 0.85 + leafSway} ${baseY - leafLength * 0.45} 
                      ${baseX + angle * 1.3 + leafSway * 1.3} ${baseY - leafLength * 0.1 + Math.abs(angle) * 0.15}`}
                stroke={season === 'winter' ? '#AAAAAA' : '#1B5E20'}
                strokeWidth="9"
                fill="none"
                strokeLinecap="round"
                opacity="0.25"
              />
              {/* Main leaf */}
              <path
                d={`M ${baseX} ${baseY} 
                    Q ${baseX + angle * 0.85 + leafSway} ${baseY - leafLength * 0.45} 
                      ${baseX + angle * 1.3 + leafSway * 1.3} ${baseY - leafLength * 0.1 + Math.abs(angle) * 0.15}`}
                stroke={season === 'winter' ? '#E0E0E0' : '#2E7D32'}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
              {/* Leaf vein/highlight */}
              <path
                d={`M ${baseX} ${baseY} 
                    Q ${baseX + angle * 0.8 + leafSway} ${baseY - leafLength * 0.4} 
                      ${baseX + angle * 1.2 + leafSway * 1.2} ${baseY - leafLength * 0.08 + Math.abs(angle) * 0.15}`}
                stroke={season === 'winter' ? '#FFFFFF' : '#4CAF50'}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.5"
              />
            </g>
          );
        })}
        
        {/* Coconuts cluster */}
        <circle cx={70 + swayAmount * 0.4} cy="53" r="4.5" fill="#4E342E" />
        <circle cx={69 + swayAmount * 0.4} cy="52" r="3.5" fill="#5D4037" />
        <circle cx={67 + swayAmount * 0.4} cy="51" r="1.2" fill="#8D6E63" opacity="0.7" />
        
        <circle cx={75 + swayAmount * 0.4} cy="56" r="4" fill="#3E2723" />
        <circle cx={74 + swayAmount * 0.4} cy="55" r="3" fill="#4E342E" />
        
        <circle cx={66 + swayAmount * 0.4} cy="57" r="3.5" fill="#5D4037" />
        
        {/* Small palm tree */}
        <path 
          d={`M 110 113 Q ${108 + swayAmount * 0.35} 98 ${105 + swayAmount * 0.25} 82`} 
          stroke="#654321" 
          strokeWidth="5" 
          fill="none" 
          strokeLinecap="round" 
        />
        <path 
          d={`M 110 113 Q ${108 + swayAmount * 0.35} 98 ${105 + swayAmount * 0.25} 82`} 
          stroke="#8B4513" 
          strokeWidth="3.5" 
          fill="none" 
          strokeLinecap="round" 
        />
        
        {/* Small palm leaves */}
        {[-45, -10, 25, 55].map((angle, i) => (
          <path
            key={`small-${i}`}
            d={`M ${105 + swayAmount * 0.25} 82 
                Q ${105 + angle * 0.45 + swayAmount * 0.4} ${74} 
                  ${105 + angle * 0.8 + swayAmount * 0.6} ${78}`}
            stroke={season === 'winter' ? '#E0E0E0' : '#388E3C'}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        
        {/* Beach umbrella for summer */}
        {season === 'summer' && (
          <g>
            <line x1="50" y1="112" x2="50" y2="92" stroke="#8B4513" strokeWidth="2" />
            <path d="M 32 92 Q 50 78 68 92 Z" fill="#FF6B6B" />
            <path d="M 36 92 Q 50 82 64 92" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.4" />
            {/* Beach towel */}
            <rect x="55" y="113" width="18" height="8" rx="1" fill="#4FC3F7" opacity="0.7" />
          </g>
        )}
        
        {/* Snow on island for winter */}
        {season === 'winter' && (
          <>
            <ellipse cx="80" cy="108" rx="48" ry="10" fill="#FFFFFF" opacity="0.75" />
            <ellipse cx="75" cy="105" rx="35" ry="7" fill="#F0F8FF" opacity="0.5" />
            {/* Snow on palm leaves */}
            <ellipse cx={72 + swayAmount * 0.6 - 40} cy="42" rx="8" ry="3" fill="#FFF" opacity="0.6" />
            <ellipse cx={72 + swayAmount * 0.6 + 35} cy="45" rx="6" ry="2" fill="#FFF" opacity="0.5" />
          </>
        )}
        
        {/* Autumn leaves on ground */}
        {season === 'autumn' && (
          <>
            <ellipse cx="60" cy="116" rx="3" ry="2" fill="#FF6347" opacity="0.6" />
            <ellipse cx="95" cy="115" rx="2.5" ry="1.5" fill="#FF8C00" opacity="0.5" />
            <ellipse cx="75" cy="118" rx="2" ry="1.5" fill="#DAA520" opacity="0.6" />
          </>
        )}
        
        {/* Spring flowers */}
        {season === 'spring' && (
          <>
            <circle cx="45" cy="110" r="3" fill="#FF69B4" opacity="0.7" />
            <circle cx="45" cy="110" r="1.5" fill="#FFD700" />
            <circle cx="115" cy="111" r="2.5" fill="#FF69B4" opacity="0.6" />
            <circle cx="115" cy="111" r="1.2" fill="#FFD700" />
          </>
        )}
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="sandGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F4D03F" />
            <stop offset="40%" stopColor="#DAA520" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// ========== IMPROVEMENT 7: ENHANCED WATER ==========
const EnhancedWater = ({ stage, season }) => {
  const [wavePhase, setWavePhase] = useState(0);
  const [ripples, setRipples] = useState([]);
  const [fishShadows, setFishShadows] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase(prev => prev + 0.03);
    }, 30);
    return () => clearInterval(interval);
  }, []);
  
  // Initialize fish shadows swimming under water
  useEffect(() => {
    const shadows = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 20 + Math.random() * 60,
      size: 15 + Math.random() * 25,
      speed: 0.1 + Math.random() * 0.15,
      direction: Math.random() > 0.5 ? 1 : -1,
      depth: 0.1 + Math.random() * 0.25,
    }));
    setFishShadows(shadows);
  }, []);
  
  // Animate fish shadows
  useEffect(() => {
    const interval = setInterval(() => {
      setFishShadows(prev => prev.map(fish => ({
        ...fish,
        x: fish.direction > 0 
          ? (fish.x > 105 ? -5 : fish.x + fish.speed)
          : (fish.x < -5 ? 105 : fish.x - fish.speed),
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  // Random ripples
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        setRipples(prev => [...prev.slice(-8), {
          id: Date.now(),
          x: 10 + Math.random() * 80,
          y: 5 + Math.random() * 35,
          age: 0,
        }]);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRipples(prev => prev.map(r => ({ ...r, age: r.age + 1 })).filter(r => r.age < 60));
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  const stageColors = getStageColors(stage, season);
  
  return (
    <div className="absolute bottom-0 left-0 right-0" style={{ height: '45%' }}>
      {/* Base water gradient */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: `linear-gradient(180deg, ${stageColors.waterColors[0]} 0%, ${stageColors.waterColors[1]} 100%)` 
        }}
      />
      
      {/* Fish shadows swimming */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fishShadows.map(fish => (
          <div
            key={fish.id}
            className="absolute transition-none"
            style={{
              left: `${fish.x}%`,
              top: `${fish.y}%`,
              opacity: fish.depth,
              transform: `scaleX(${fish.direction})`,
            }}
          >
            <svg width={fish.size} height={fish.size * 0.6} viewBox="0 0 40 24">
              <ellipse cx="18" cy="12" rx="14" ry="9" fill="#000" opacity="0.5" />
              <path d="M 30 12 L 40 6 L 38 12 L 40 18 Z" fill="#000" opacity="0.5" />
            </svg>
          </div>
        ))}
      </div>
      
      {/* Animated wave layers */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        {/* Wave layer 1 - slow, large waves */}
        {[...Array(6)].map((_, i) => {
          const yBase = i * 20 + 5;
          const amplitude = 4 + i * 0.5;
          const frequency = 0.008 - i * 0.0005;
          
          return (
            <path
              key={`wave1-${i}`}
              d={`M 0 ${yBase} 
                  ${[...Array(20)].map((_, j) => {
                    const x = j * 60;
                    const y = yBase + Math.sin(wavePhase + j * frequency * 100 + i) * amplitude;
                    return `Q ${x + 30} ${y + amplitude} ${x + 60} ${y}`;
                  }).join(' ')}
                  L 1200 ${yBase} L 1200 200 L 0 200 Z`}
              fill="rgba(255,255,255,0.03)"
            />
          );
        })}
        
        {/* Wave layer 2 - medium waves */}
        {[...Array(8)].map((_, i) => {
          const yBase = 10 + i * 15;
          return (
            <path
              key={`wave2-${i}`}
              d={`M ${-wavePhase * 30 % 100 - 100} ${yBase} 
                  ${[...Array(25)].map((_, j) => {
                    const x = j * 50 + (-wavePhase * 30 % 100) - 100;
                    const y = yBase + Math.sin(wavePhase * 1.5 + j * 0.3 + i * 0.5) * 3;
                    return `Q ${x + 25} ${y + 3} ${x + 50} ${y}`;
                  }).join(' ')}`}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2"
              fill="none"
            />
          );
        })}
        
        {/* Foam lines at surface */}
        {[...Array(4)].map((_, i) => (
          <path
            key={`foam-${i}`}
            d={`M ${(wavePhase * 20 + i * 300) % 1400 - 200} ${2 + i * 2} 
                Q ${(wavePhase * 20 + i * 300 + 50) % 1400 - 200} ${4 + i * 2} 
                  ${(wavePhase * 20 + i * 300 + 100) % 1400 - 200} ${2 + i * 2}`}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={3 - i * 0.5}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        
        {/* Sparkle reflections */}
        {[...Array(20)].map((_, i) => {
          const sparkleOpacity = 0.08 + Math.sin(wavePhase * 2 + i * 0.7) * 0.12;
          const sparkleSize = 2 + Math.sin(wavePhase + i) * 1.5;
          return (
            <ellipse
              key={`sparkle-${i}`}
              cx={40 + i * 55 + Math.sin(wavePhase + i) * 15}
              cy={15 + (i % 5) * 22 + Math.sin(wavePhase * 0.5 + i) * 4}
              rx={sparkleSize}
              ry={sparkleSize * 0.5}
              fill="white"
              opacity={sparkleOpacity}
            />
          );
        })}
        
        {/* Light beams in water */}
        {[...Array(5)].map((_, i) => (
          <path
            key={`beam-${i}`}
            d={`M ${150 + i * 200} 0 L ${120 + i * 200} 100 L ${180 + i * 200} 100 Z`}
            fill="rgba(255,255,255,0.02)"
            opacity={0.5 + Math.sin(wavePhase * 0.3 + i) * 0.3}
          />
        ))}
      </svg>
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="rounded-full border-2 border-white"
            style={{
              width: ripple.age * 3,
              height: ripple.age * 1.2,
              opacity: Math.max(0, 0.4 - ripple.age * 0.007),
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 rounded-full border border-white"
            style={{
              width: ripple.age * 2,
              height: ripple.age * 0.8,
              opacity: Math.max(0, 0.25 - ripple.age * 0.004),
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      ))}
      
      {/* Underwater caustics effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: `repeating-conic-gradient(
            from ${wavePhase * 30}deg,
            transparent 0deg,
            rgba(255,255,255,0.1) 5deg,
            transparent 10deg
          )`,
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
        }}
      />
      
      {/* Surface shine gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(${170 + Math.sin(wavePhase * 0.5) * 10}deg, 
            transparent 30%, 
            rgba(255,255,255,0.06) 50%, 
            transparent 70%)`,
        }}
      />
      
      {/* Depth gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 100%)',
        }}
      />
    </div>
  );
};

// ========== IMPROVEMENT 51-60: DISTANT MOUNTAINS/HORIZON ==========
const DistantHorizon = ({ stage, season }) => {
  const stageColors = getStageColors(stage, season);
  const isNight = stageColors.timeOfDay === 'night';
  
  return (
    <div className="absolute bottom-[45%] left-0 right-0 h-20 pointer-events-none">
      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 80">
        {/* Distant mountains layer 1 */}
        <path
          d="M 0 80 L 0 60 L 100 45 L 200 55 L 300 35 L 400 50 L 500 30 L 600 45 L 700 38 L 800 52 L 900 42 L 1000 55 L 1100 40 L 1200 50 L 1200 80 Z"
          fill={isNight ? 'rgba(20, 30, 50, 0.4)' : 'rgba(100, 130, 160, 0.25)'}
        />
        {/* Distant mountains layer 2 */}
        <path
          d="M 0 80 L 0 65 L 150 52 L 250 60 L 350 48 L 450 58 L 550 45 L 650 55 L 750 50 L 850 60 L 950 52 L 1050 62 L 1150 55 L 1200 58 L 1200 80 Z"
          fill={isNight ? 'rgba(30, 45, 70, 0.35)' : 'rgba(130, 160, 190, 0.2)'}
        />
        {/* Horizon mist */}
        <rect x="0" y="60" width="1200" height="20" fill="url(#horizonMist)" />
        <defs>
          <linearGradient id="horizonMist" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isNight ? 'rgba(50, 70, 100, 0.3)' : 'rgba(200, 220, 240, 0.4)'} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// ========== IMPROVEMENT 61-70: FLOATING DEBRIS/LILY PADS ==========
const FloatingDebris = ({ stage, season }) => {
  const [debris, setDebris] = useState([]);
  const [phase, setPhase] = useState(0);
  
  useEffect(() => {
    // Only show in lake and river stages
    if (stage > 1) return;
    
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: Math.random() * 30,
      type: ['lilypad', 'leaf', 'twig', 'flower'][Math.floor(Math.random() * 4)],
      size: 20 + Math.random() * 20,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 0.5,
      bobOffset: Math.random() * Math.PI * 2,
    }));
    setDebris(items);
  }, [stage]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => prev + 0.05);
      setDebris(prev => prev.map(d => ({
        ...d,
        rotation: d.rotation + d.rotationSpeed,
        x: d.x + 0.01,
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  if (stage > 1) return null;
  
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '45%' }}>
      {debris.map(item => {
        const bob = Math.sin(phase + item.bobOffset) * 3;
        
        return (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: `${item.x}%`,
              top: `${item.y + 5}%`,
              transform: `rotate(${item.rotation}deg) translateY(${bob}px)`,
            }}
          >
            {item.type === 'lilypad' && (
              <svg width={item.size} height={item.size * 0.7} viewBox="0 0 40 28">
                <ellipse cx="20" cy="14" rx="18" ry="12" fill="#228B22" opacity="0.8" />
                <ellipse cx="20" cy="14" rx="15" ry="10" fill="#2E7D32" opacity="0.6" />
                <path d="M 20 2 L 20 14" stroke="#1B5E20" strokeWidth="1" opacity="0.5" />
                <path d="M 20 14 L 8 20" stroke="#1B5E20" strokeWidth="0.5" opacity="0.3" />
                <path d="M 20 14 L 32 20" stroke="#1B5E20" strokeWidth="0.5" opacity="0.3" />
                {season === 'spring' && (
                  <>
                    <circle cx="25" cy="10" r="4" fill="#FF69B4" />
                    <circle cx="25" cy="10" r="2" fill="#FFD700" />
                  </>
                )}
              </svg>
            )}
            {item.type === 'leaf' && (
              <svg width={item.size * 0.6} height={item.size * 0.4} viewBox="0 0 24 16">
                <path d="M 2 8 Q 12 2 22 8 Q 12 14 2 8" fill={season === 'autumn' ? '#CD853F' : '#4CAF50'} opacity="0.7" />
                <line x1="2" y1="8" x2="22" y2="8" stroke={season === 'autumn' ? '#8B4513' : '#2E7D32'} strokeWidth="0.5" opacity="0.5" />
              </svg>
            )}
            {item.type === 'twig' && (
              <svg width={item.size * 0.8} height={item.size * 0.3} viewBox="0 0 32 12">
                <line x1="2" y1="6" x2="30" y2="6" stroke="#8B4513" strokeWidth="2" strokeLinecap="round" />
                <line x1="10" y1="6" x2="8" y2="2" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" />
                <line x1="20" y1="6" x2="22" y2="10" stroke="#8B4513" strokeWidth="1" strokeLinecap="round" />
              </svg>
            )}
            {item.type === 'flower' && season === 'spring' && (
              <svg width={item.size * 0.5} height={item.size * 0.5} viewBox="0 0 20 20">
                <circle cx="10" cy="6" r="4" fill="#FFB7C5" opacity="0.8" />
                <circle cx="6" cy="10" r="4" fill="#FFC0CB" opacity="0.8" />
                <circle cx="14" cy="10" r="4" fill="#FFB6C1" opacity="0.8" />
                <circle cx="10" cy="14" r="4" fill="#FF69B4" opacity="0.8" />
                <circle cx="10" cy="10" r="3" fill="#FFD700" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ========== IMPROVEMENT 71-80: UNDERWATER BUBBLES ==========
const UnderwaterBubbles = ({ active = true }) => {
  const [bubbles, setBubbles] = useState([]);
  
  useEffect(() => {
    if (!active) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setBubbles(prev => [...prev.slice(-15), {
          id: Date.now(),
          x: 45 + Math.random() * 10,
          y: 100,
          size: 3 + Math.random() * 6,
          speed: 0.8 + Math.random() * 0.5,
          wobble: Math.random() * Math.PI * 2,
        }]);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [active]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => prev
        .map(b => ({
          ...b,
          y: b.y - b.speed,
          x: b.x + Math.sin(b.wobble + b.y * 0.1) * 0.3,
        }))
        .filter(b => b.y > 50)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-25" style={{ height: '50%' }}>
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute rounded-full"
          style={{
            left: `${bubble.x}%`,
            top: `${bubble.y}%`,
            width: bubble.size,
            height: bubble.size,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(135,206,235,0.4) 50%, rgba(135,206,235,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.3)',
          }}
        />
      ))}
    </div>
  );
};

// ========== IMPROVEMENT 81-90: LENS FLARE ==========
const LensFlare = ({ visible, position = 'top-right' }) => {
  const [intensity, setIntensity] = useState(0.7);
  
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setIntensity(0.6 + Math.random() * 0.3);
    }, 100);
    return () => clearInterval(interval);
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Main flare */}
      <div
        className="absolute top-8 right-24"
        style={{
          width: 150,
          height: 150,
          background: `radial-gradient(circle, rgba(255,255,200,${intensity * 0.3}) 0%, rgba(255,200,100,${intensity * 0.15}) 30%, transparent 70%)`,
        }}
      />
      {/* Secondary flares */}
      {[
        { x: '60%', y: '25%', size: 30, color: 'rgba(255,180,100,0.2)' },
        { x: '50%', y: '35%', size: 15, color: 'rgba(100,200,255,0.15)' },
        { x: '40%', y: '45%', size: 50, color: 'rgba(255,220,150,0.1)' },
        { x: '35%', y: '50%', size: 20, color: 'rgba(255,150,100,0.12)' },
      ].map((flare, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: flare.x,
            top: flare.y,
            width: flare.size,
            height: flare.size,
            background: `radial-gradient(circle, ${flare.color} 0%, transparent 70%)`,
            opacity: intensity,
          }}
        />
      ))}
      {/* Light streak */}
      <div
        className="absolute top-12 right-20"
        style={{
          width: 200,
          height: 3,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,200,0.3) 50%, transparent 100%)',
          transform: 'rotate(-30deg)',
          opacity: intensity * 0.5,
        }}
      />
    </div>
  );
};

// ========== IMPROVEMENT 91-100: SHOOTING STAR ==========
const ShootingStars = ({ visible }) => {
  const [stars, setStars] = useState([]);
  
  useEffect(() => {
    if (!visible) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setStars(prev => [...prev.slice(-3), {
          id: Date.now(),
          startX: 10 + Math.random() * 60,
          startY: 5 + Math.random() * 20,
          length: 80 + Math.random() * 60,
          angle: 20 + Math.random() * 30,
          duration: 0.5 + Math.random() * 0.5,
          progress: 0,
        }]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [visible]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStars(prev => prev
        .map(s => ({ ...s, progress: s.progress + 0.05 }))
        .filter(s => s.progress < 1)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);
  
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map(star => {
        const x = star.startX + star.progress * star.length * Math.cos(star.angle * Math.PI / 180);
        const y = star.startY + star.progress * star.length * Math.sin(star.angle * Math.PI / 180);
        const opacity = star.progress < 0.5 ? star.progress * 2 : (1 - star.progress) * 2;
        
        return (
          <div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              width: star.length,
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${opacity}) 50%, white ${100 - star.progress * 100}%)`,
              transform: `rotate(${star.angle}deg)`,
              transformOrigin: 'left center',
              boxShadow: `0 0 10px rgba(255,255,255,${opacity * 0.5})`,
            }}
          />
        );
      })}
    </div>
  );
};

// ========== IMPROVEMENT 101-110: FIREFLIES (SUMMER NIGHT) ==========
const Fireflies = ({ visible, count = 15 }) => {
  const [fireflies, setFireflies] = useState([]);
  
  useEffect(() => {
    if (!visible) return;
    
    const flies = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 30 + Math.random() * 50,
      phase: Math.random() * Math.PI * 2,
      speed: 0.02 + Math.random() * 0.02,
      glowPhase: Math.random() * Math.PI * 2,
    }));
    setFireflies(flies);
  }, [visible, count]);
  
  const [tick, setTick] = useState(0);
  
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setTick(prev => prev + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {fireflies.map(fly => {
        const x = fly.x + Math.sin(tick * fly.speed * 50 + fly.phase) * 10;
        const y = fly.y + Math.cos(tick * fly.speed * 30 + fly.phase) * 8;
        const glow = 0.3 + Math.sin(tick * 3 + fly.glowPhase) * 0.7;
        
        return (
          <div
            key={fly.id}
            className="absolute rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: 6,
              height: 6,
              background: `radial-gradient(circle, rgba(255,255,150,${glow}) 0%, rgba(200,255,100,${glow * 0.5}) 50%, transparent 100%)`,
              boxShadow: `0 0 ${10 + glow * 10}px rgba(255,255,100,${glow})`,
            }}
          />
        );
      })}
    </div>
  );
};

// ========== IMPROVEMENT 8: AMBIENT PARTICLES ==========
const SeasonalParticles = ({ season, count = 20 }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 8 + Math.random() * 14,
      speed: 0.2 + Math.random() * 0.4,
      sway: Math.random() * 2.5 - 1.25,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 5,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, [season, count]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: (p.y + p.speed) % 115,
        x: p.x + Math.sin(p.y * 0.08 + p.delay) * p.sway * 0.12,
        rotation: p.rotation + p.rotationSpeed,
      })));
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const renderParticle = (p) => {
    switch (season) {
      case 'spring':
        return (
          <svg key={p.id} width={p.size} height={p.size} viewBox="0 0 24 24" className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)`, opacity: 0.85 }}>
            <ellipse cx="12" cy="6" rx="4" ry="6" fill="#FFB7C5" />
            <ellipse cx="6" cy="12" rx="4" ry="6" fill="#FFC0CB" transform="rotate(-50 6 12)" />
            <ellipse cx="18" cy="12" rx="4" ry="6" fill="#FFB6C1" transform="rotate(50 18 12)" />
            <ellipse cx="12" cy="18" rx="4" ry="6" fill="#FF69B4" />
            <circle cx="12" cy="12" r="2.5" fill="#FFD700" />
            <circle cx="11" cy="11" r="1" fill="#FFF" opacity="0.6" />
          </svg>
        );
      case 'summer':
        return (
          <svg key={p.id} width={p.size * 1.3} height={p.size} viewBox="0 0 30 22" className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `scaleX(${Math.sin(p.rotation * 0.08) > 0 ? 1 : -1})`, opacity: 0.9 }}>
            <ellipse cx="15" cy="12" rx="10" ry="6" fill="#FFA500" />
            <path d="M 5 12 Q 0 7 5 4 Q 10 9 5 12" fill="#FF8C00" />
            <path d="M 25 12 Q 30 7 25 4 Q 20 9 25 12" fill="#FF8C00" />
            <circle cx="10" cy="10" r="1.5" fill="#000" />
            <circle cx="9.5" cy="9.5" r="0.5" fill="#FFF" />
          </svg>
        );
      case 'autumn':
        return (
          <svg key={p.id} width={p.size} height={p.size} viewBox="0 0 24 24" className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)`, opacity: 0.9 }}>
            <path d="M 12 2 Q 18 10 12 22 Q 6 10 12 2" fill={['#FF4500', '#FF6347', '#CD853F', '#DAA520', '#FF8C00'][p.id % 5]} />
            <path d="M 12 2 Q 16 10 12 22" fill={['#FF6347', '#FF7F50', '#DEB887', '#F4A460'][p.id % 4]} opacity="0.5" />
            <line x1="12" y1="2" x2="12" y2="22" stroke="#8B4513" strokeWidth="1.5" />
            <path d="M 8 8 Q 12 10 8 14" stroke="#8B4513" strokeWidth="0.8" fill="none" />
            <path d="M 16 10 Q 12 12 16 16" stroke="#8B4513" strokeWidth="0.8" fill="none" />
          </svg>
        );
      case 'winter':
        return (
          <svg key={p.id} width={p.size} height={p.size} viewBox="0 0 20 20" className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)`, opacity: 0.9 }}>
            <circle cx="10" cy="10" r="7" fill="#FFFFFF" />
            <circle cx="10" cy="10" r="5" fill="#E0FFFF" />
            <circle cx="10" cy="10" r="3" fill="#FFFFFF" />
            <circle cx="8" cy="8" r="1.5" fill="#F0FFFF" opacity="0.8" />
            {/* Snowflake arms */}
            {[0, 60, 120].map(angle => (
              <g key={angle} transform={`rotate(${angle} 10 10)`}>
                <line x1="10" y1="3" x2="10" y2="17" stroke="#B0E0E6" strokeWidth="0.5" opacity="0.5" />
              </g>
            ))}
          </svg>
        );
      default:
        return null;
    }
  };

  return <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">{particles.map(renderParticle)}</div>;
};

// ========== IMPROVEMENT 9-50: ENHANCED BACKGROUND ==========
export const RetroBackground = ({ stage, timeOfDay, showRain, showLightning, season = null }) => {
  const currentSeason = season || getCurrentSeason();
  const seasonData = SEASONS[currentSeason];
  const stageColors = getStageColors(stage, currentSeason);
  
  const [rainDrops, setRainDrops] = useState([]);
  const [lightningFlash, setLightningFlash] = useState(false);

  // Determine if sun or moon should be visible - MUTUALLY EXCLUSIVE
  const showSun = stageColors.timeOfDay === 'day';
  const showMoon = !showSun && (stageColors.timeOfDay === 'night' || stageColors.timeOfDay === 'dusk');
  const isNight = stageColors.timeOfDay === 'night';
  const isDusk = stageColors.timeOfDay === 'dusk';
  
  // Show fireflies only in summer nights
  const showFireflies = (isNight || isDusk) && currentSeason === 'summer';

  // Rain effect
  useEffect(() => {
    if (showRain) {
      setRainDrops(Array.from({ length: 120 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 5 + Math.random() * 6,
        length: 15 + Math.random() * 20,
        opacity: 0.4 + Math.random() * 0.4,
      })));
    } else {
      setRainDrops([]);
    }
  }, [showRain]);

  useEffect(() => {
    if (!showRain) return;
    const interval = setInterval(() => {
      setRainDrops(prev => prev.map(d => ({ 
        ...d, 
        y: (d.y + d.speed) % 130,
        x: d.x + 0.4, // Wind effect
      })));
    }, 25);
    return () => clearInterval(interval);
  }, [showRain]);

  // Lightning effect
  useEffect(() => {
    if (!showLightning) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        setLightningFlash(true);
        setTimeout(() => setLightningFlash(false), 100);
        setTimeout(() => {
          if (Math.random() > 0.5) {
            setLightningFlash(true);
            setTimeout(() => setLightningFlash(false), 50);
          }
        }, 150);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [showLightning]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient with smooth transition */}
      <div 
        className="absolute inset-0 transition-all duration-2000"
        style={{ 
          background: `linear-gradient(180deg, 
            ${stageColors.skyColors[0]} 0%, 
            ${stageColors.skyColors[1]} 50%, 
            ${stageColors.waterColors[0]} 100%)` 
        }}
      />
      
      {/* Distant horizon/mountains */}
      <DistantHorizon stage={stage} season={currentSeason} />

      {/* Sun - only visible during day */}
      <AnimatedSun visible={showSun} stage={stage} />
      
      {/* Lens flare for sunny days */}
      <LensFlare visible={showSun && stage === 0} />
      
      {/* Moon - only visible during night/dusk */}
      <AnimatedMoon visible={showMoon} phase={0.75} />
      
      {/* Stars - only at night */}
      <TwinklingStars visible={isNight} count={70} />
      
      {/* Shooting stars at night */}
      <ShootingStars visible={isNight} />
      
      {/* Animated clouds */}
      <AnimatedClouds 
        count={stage === 3 ? 12 : 7} 
        speed={stage === 3 ? 2.5 : 1} 
        stage={stage}
      />

      {/* Enhanced water with fish shadows */}
      <EnhancedWater stage={stage} season={currentSeason} />
      
      {/* Floating debris / lily pads for calm waters */}
      <FloatingDebris stage={stage} season={currentSeason} />
      
      {/* Underwater bubbles near fishing area */}
      <UnderwaterBubbles active={true} />

      {/* Seasonal particles */}
      <SeasonalParticles season={currentSeason} count={currentSeason === 'winter' ? 40 : 22} />
      
      {/* Fireflies for summer nights */}
      <Fireflies visible={showFireflies} count={18} />

      {/* Rain - Enhanced visibility */}
      {showRain && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {rainDrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute"
              style={{
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: 3,
                height: drop.length,
                background: 'linear-gradient(180deg, rgba(180, 200, 255, 0.9) 0%, rgba(100, 150, 220, 0.4) 100%)',
                transform: 'rotate(20deg)',
                opacity: drop.opacity + 0.2,
                borderRadius: '2px',
                boxShadow: '0 0 4px rgba(180, 200, 255, 0.4)',
              }}
            />
          ))}
          {/* Rain mist overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(100, 130, 180, 0.1) 0%, rgba(100, 130, 180, 0.25) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* Lightning flash */}
      {lightningFlash && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(200,200,255,0.7) 100%)',
          }}
        />
      )}
      
      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)',
        }}
      />
      
      {/* Film grain overlay for atmosphere */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};

// ========== BOAT SPRITES ==========
export const AnimatedBoats = ({ show, type = 0, season = 'summer' }) => {
  const [position, setPosition] = useState(-200);
  const [bobOffset, setBobOffset] = useState(0);
  
  useEffect(() => {
    if (!show) {
      setPosition(-200);
      return;
    }
    const interval = setInterval(() => {
      setPosition(prev => prev > window.innerWidth + 100 ? -200 : prev + 1.2);
      setBobOffset(prev => prev + 0.08);
    }, 30);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const boats = [
    // Rowboat
    <svg key="rowboat" width="80" height="55" viewBox="0 0 80 55">
      <path d="M 10 40 Q 5 45 18 48 L 62 48 Q 75 45 70 40 Z" fill="#8B4513" />
      <path d="M 15 40 Q 12 43 20 45 L 60 45 Q 68 43 65 40 Z" fill="#A0522D" />
      <rect x="35" y="22" width="5" height="18" fill="#654321" />
      <rect x="22" y="28" width="30" height="4" fill="#8B4513" rx="2" />
      <ellipse cx="40" cy="35" rx="4" ry="2.5" fill="#4A90D9" opacity="0.3" />
      <circle cx="40" cy="30" r="3" fill="#FFE4B5" />
    </svg>,
    
    // Sailboat
    <svg key="sailboat" width="100" height="80" viewBox="0 0 100 80">
      <path d="M 15 60 Q 10 65 22 68 L 78 68 Q 90 65 85 60 Z" fill="#CD853F" />
      <path d="M 20 60 Q 17 63 25 65 L 75 65 Q 83 63 80 60 Z" fill="#DEB887" />
      <rect x="47" y="22" width="5" height="38" fill="#8B4513" />
      <path d="M 49 22 L 49 52 L 85 40 Z" fill="#FFFFFF" stroke="#E8E8E8" strokeWidth="1" />
      <path d="M 49 22 L 49 48 L 20 36 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
      <line x1="49" y1="20" x2="49" y2="16" stroke="#8B4513" strokeWidth="2" />
      <polygon points="49,16 58,20 49,24" fill="#FF4444" />
    </svg>,
    
    // Fishing boat
    <svg key="fishing" width="110" height="70" viewBox="0 0 110 70">
      <path d="M 10 50 Q 5 55 18 58 L 92 58 Q 105 55 100 50 Z" fill="#2F4F4F" />
      <path d="M 15 50 Q 12 53 20 55 L 90 55 Q 98 53 95 50 Z" fill="#3C5A5A" />
      <rect x="22" y="38" width="66" height="12" fill="#3C5A5A" />
      <rect x="38" y="26" width="24" height="12" fill="#4A6A6A" />
      <rect x="68" y="18" width="5" height="32" fill="#8B4513" />
      <line x1="70" y1="18" x2="70" y2="6" stroke="#666" strokeWidth="1.5" />
      <line x1="70" y1="6" x2="92" y2="14" stroke="#666" strokeWidth="1" strokeDasharray="3" />
      <circle cx="30" cy="44" r="3" fill="#FF6B6B" />
    </svg>,
    
    // Yacht
    <svg key="yacht" width="140" height="90" viewBox="0 0 140 90">
      <path d="M 10 65 Q 5 70 18 74 L 122 74 Q 135 70 130 65 Z" fill="#FFFFFF" stroke="#E8E8E8" strokeWidth="1" />
      <path d="M 15 65 Q 12 68 22 71 L 118 71 Q 128 68 125 65 Z" fill="#F8F8F8" />
      <rect x="32" y="48" width="76" height="17" fill="#F5F5F5" />
      <rect x="42" y="36" width="56" height="12" fill="#E8E8E8" rx="2" />
      <rect x="58" y="26" width="24" height="10" fill="#87CEEB" rx="2" />
      <circle cx="48" cy="55" r="4" fill="#1E90FF" />
      <circle cx="92" cy="55" r="4" fill="#1E90FF" />
      <rect x="80" y="30" width="3" height="18" fill="#C0C0C0" />
    </svg>,
    
    // Cargo ship
    <svg key="cargo" width="200" height="110" viewBox="0 0 200 110">
      <rect x="10" y="70" width="180" height="35" fill="#4A4A4A" rx="2" />
      <rect x="20" y="52" width="160" height="18" fill="#5A5A5A" />
      <rect x="30" y="35" width="35" height="17" fill="#3A3A3A" />
      <rect x="75" y="40" width="22" height="12" fill="#FF4444" />
      <rect x="107" y="40" width="22" height="12" fill="#4444FF" />
      <rect x="139" y="40" width="22" height="12" fill="#44AA44" />
      <rect x="155" y="18" width="10" height="22" fill="#2A2A2A" />
      <ellipse cx="160" cy="12" rx="12" ry="10" fill="#888" opacity="0.7" />
    </svg>,
  ];

  const bob = Math.sin(bobOffset) * 4;
  const tilt = Math.sin(bobOffset * 0.7) * 2;

  return (
    <div 
      className="absolute z-15" 
      style={{ 
        left: position, 
        top: `calc(48% + ${bob}px)`, 
        transform: `rotate(${tilt}deg)`,
        transition: 'top 0.2s ease',
      }}
    >
      {boats[type % boats.length]}
    </div>
  );
};

// ========== WHALE SPRITE ==========
export const WhaleSprite = ({ show }) => {
  const [position, setPosition] = useState(-180);
  const [spoutPhase, setSpoutPhase] = useState(0);
  const [tailPhase, setTailPhase] = useState(0);
  
  useEffect(() => {
    if (!show) {
      setPosition(-180);
      return;
    }
    const interval = setInterval(() => {
      setPosition(prev => prev + 1.2);
      setSpoutPhase(prev => prev + 0.12);
      setTailPhase(prev => prev + 0.08);
    }, 30);
    return () => clearInterval(interval);
  }, [show]);

  if (!show || position > window.innerWidth + 150) return null;

  const spoutHeight = Math.abs(Math.sin(spoutPhase)) * 25;
  const tailWag = Math.sin(tailPhase) * 8;

  return (
    <div 
      className="absolute z-20" 
      style={{ 
        left: position, 
        top: '45%', 
        transform: `translateY(${Math.sin(position * 0.015) * 10}px)` 
      }}
    >
      <svg width="140" height="100" viewBox="0 0 140 100">
        {/* Whale shadow in water */}
        <ellipse cx="65" cy="75" rx="50" ry="8" fill="#000" opacity="0.15" />
        
        {/* Whale body */}
        <ellipse cx="65" cy="55" rx="55" ry="28" fill="#2C3E50" />
        <ellipse cx="60" cy="52" rx="46" ry="23" fill="#34495E" />
        
        {/* Belly */}
        <ellipse cx="55" cy="62" rx="35" ry="15" fill="#4A6572" opacity="0.5" />
        
        {/* Tail */}
        <path 
          d={`M 115 55 Q 128 ${42 + tailWag} 140 ${35 + tailWag} Q 132 55 140 ${75 - tailWag} Q 128 ${68 - tailWag} 115 55`} 
          fill="#2C3E50" 
        />
        
        {/* Dorsal fin */}
        <path d="M 55 30 Q 62 18 72 28 Q 65 35 58 35 Z" fill="#34495E" />
        
        {/* Pectoral fin */}
        <ellipse cx="40" cy="65" rx="15" ry="6" fill="#34495E" transform="rotate(-20 40 65)" />
        
        {/* Eye */}
        <circle cx="22" cy="48" r="5" fill="#FFFFFF" />
        <circle cx="21" cy="47" r="3" fill="#1a1a1a" />
        <circle cx="20" cy="46" r="1" fill="#FFFFFF" />
        
        {/* Smile */}
        <path d="M 12 58 Q 22 65 32 58" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        
        {/* Water spout */}
        <path 
          d={`M 50 28 Q 47 ${18 - spoutHeight} 50 ${5 - spoutHeight} Q 53 ${18 - spoutHeight} 50 28`} 
          fill="none" 
          stroke="#87CEEB" 
          strokeWidth="4" 
          opacity={0.6 + Math.sin(spoutPhase) * 0.3}
          strokeLinecap="round"
        />
        <ellipse 
          cx="50" 
          cy={2 - spoutHeight} 
          rx="10" 
          ry="5" 
          fill="#87CEEB" 
          opacity={0.4 + Math.sin(spoutPhase) * 0.25}
        />
        {/* Spout droplets */}
        {[...Array(5)].map((_, i) => (
          <circle
            key={i}
            cx={45 + i * 2.5 + Math.sin(spoutPhase + i) * 3}
            cy={8 - spoutHeight + Math.sin(spoutPhase * 2 + i) * 5}
            r={1.5 - i * 0.2}
            fill="#87CEEB"
            opacity={0.5 - i * 0.08}
          />
        ))}
      </svg>
    </div>
  );
};

// ========== EXISTING SPRITES (ENHANCED) ==========

export const PixelFish = ({ color, size, wiggle = false }) => {
  return (
    <svg 
      width={size} 
      height={size * 0.6} 
      viewBox="0 0 50 30" 
      className={wiggle ? 'animate-wiggle' : ''} 
      style={{ filter: 'drop-shadow(2px 3px 3px rgba(0,0,0,0.35))' }}
    >
      {/* Body */}
      <ellipse cx="23" cy="15" rx="17" ry="11" fill={color} />
      <ellipse cx="21" cy="15" rx="14" ry="9" fill={color} opacity="0.9" />
      
      {/* Tail */}
      <path d="M 36 15 L 48 8 L 44 15 L 48 22 Z" fill={color} />
      
      {/* Dorsal fin */}
      <path d="M 18 6 Q 15 1 19 3 Q 22 2 20 6 Z" fill={color} opacity="0.85" />
      
      {/* Bottom fin */}
      <path d="M 18 24 Q 15 29 19 27 Q 22 28 20 24 Z" fill={color} opacity="0.85" />
      
      {/* Eye */}
      <circle cx="12" cy="12" r="4" fill="#FFF" />
      <circle cx="11" cy="11" r="2.5" fill="#000" />
      <circle cx="10" cy="10" r="1" fill="#FFF" />
      
      {/* Body shine */}
      <ellipse cx="22" cy="15" rx="4" ry="7" fill="rgba(255,255,255,0.18)" />
      <ellipse cx="16" cy="10" rx="6" ry="3" fill="rgba(255,255,255,0.15)" />
      
      {/* Scales texture */}
      <ellipse cx="25" cy="15" rx="2" ry="4" fill="rgba(255,255,255,0.1)" />
      <ellipse cx="20" cy="15" rx="2" ry="4" fill="rgba(255,255,255,0.08)" />
    </svg>
  );
};

export const PixelBobber = ({ isActive, wobble = false }) => (
  <svg 
    width="40" 
    height="40" 
    viewBox="0 0 36 36" 
    className={isActive ? 'animate-shake' : wobble ? 'animate-bob' : ''} 
    style={{ filter: 'drop-shadow(2px 5px 5px rgba(0,0,0,0.45))' }}
  >
    {/* Bobber body */}
    <circle cx="18" cy="18" r="14" fill="#FF4444" />
    <circle cx="18" cy="18" r="11" fill="#FFFFFF" />
    <circle cx="18" cy="18" r="7" fill="#FF4444" />
    
    {/* Highlight */}
    <ellipse cx="14" cy="14" rx="4" ry="3" fill="#FFAAAA" opacity="0.75" />
    <circle cx="13" cy="13" r="2" fill="#FFF" opacity="0.5" />
    
    {/* Active rings */}
    {isActive && (
      <>
        <circle cx="18" cy="18" r="18" stroke="#00AAFF" strokeWidth="2.5" fill="none" opacity="0.8" className="animate-ping" />
        <circle cx="18" cy="18" r="22" stroke="#00AAFF" strokeWidth="2" fill="none" opacity="0.5" className="animate-ping" style={{ animationDelay: '0.15s' }} />
        <circle cx="18" cy="18" r="26" stroke="#00AAFF" strokeWidth="1.5" fill="none" opacity="0.3" className="animate-ping" style={{ animationDelay: '0.3s' }} />
      </>
    )}
  </svg>
);

export const WaterSplash = ({ x, y }) => (
  <div className="absolute pointer-events-none animate-splash" style={{ left: x - 50, top: y - 30 }}>
    <svg width="100" height="65">
      {/* Main splash */}
      <ellipse cx="50" cy="32" rx="15" ry="10" fill="#00AAFF" opacity="0.75" />
      
      {/* Droplets */}
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const distance = 18 + i * 4;
        return (
          <circle
            key={i}
            cx={50 + Math.cos(angle) * distance}
            cy={32 + Math.sin(angle) * (distance * 0.6)}
            r={5 - i * 0.35}
            fill="#00AAFF"
            opacity={0.7 - i * 0.05}
          />
        );
      })}
      
      {/* Spray mist */}
      <ellipse cx="50" cy="20" rx="25" ry="12" fill="#87CEEB" opacity="0.3" />
    </svg>
  </div>
);

export const ParticleEffects = ({ type, x, y }) => {
  const [particles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      angle: (i / 18) * Math.PI * 2,
      distance: 25 + Math.random() * 50,
      size: 5 + Math.random() * 8,
      color: type === 'perfect' ? '#00FF00' : type === 'catch' ? '#FFD700' : '#FF6B6B',
    }))
  );

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full animate-particle"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: Math.cos(p.angle) * p.distance,
            top: Math.sin(p.angle) * p.distance,
            boxShadow: `0 0 ${p.size + 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
};

// Export BoatSprite as AnimatedBoats
export const BoatSprite = AnimatedBoats;

export default RetroBackground;
