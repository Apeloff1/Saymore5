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

// ========== AMBIENT PARTICLES ==========
const SeasonalParticles = ({ season, count = 15 }) => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 8 + Math.random() * 12,
      speed: 0.3 + Math.random() * 0.5,
      sway: Math.random() * 2 - 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
    }));
    setParticles(newParticles);
  }, [season, count]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        y: (p.y + p.speed) % 110,
        x: p.x + Math.sin(p.y * 0.1) * p.sway * 0.1,
        rotation: p.rotation + p.rotationSpeed,
      })));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const renderParticle = (p) => {
    switch (season) {
      case 'spring':
        return (
          <svg key={p.id} width={p.size} height={p.size} viewBox="0 0 20 20" className="absolute transition-transform"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)`, opacity: 0.8 }}>
            <ellipse cx="10" cy="6" rx="4" ry="6" fill="#FFB7C5" />
            <ellipse cx="6" cy="10" rx="4" ry="6" fill="#FFC0CB" transform="rotate(-45 6 10)" />
            <ellipse cx="14" cy="10" rx="4" ry="6" fill="#FFB6C1" transform="rotate(45 14 10)" />
            <ellipse cx="10" cy="14" rx="4" ry="6" fill="#FF69B4" />
            <circle cx="10" cy="10" r="2" fill="#FFD700" />
          </svg>
        );
      case 'summer':
        return (
          <svg key={p.id} width={p.size * 1.2} height={p.size} viewBox="0 0 24 18" className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `scaleX(${Math.sin(p.rotation * 0.1) > 0 ? 1 : -1})`, opacity: 0.9 }}>
            <ellipse cx="12" cy="10" rx="8" ry="5" fill="#FFA500" />
            <path d="M 4 10 Q 0 6 4 4 Q 8 8 4 10" fill="#FF8C00" />
            <path d="M 20 10 Q 24 6 20 4 Q 16 8 20 10" fill="#FF8C00" />
            <circle cx="8" cy="9" r="1" fill="#000" />
          </svg>
        );
      case 'autumn':
        return (
          <svg key={p.id} width={p.size} height={p.size} viewBox="0 0 20 20" className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)`, opacity: 0.85 }}>
            <path d="M 10 2 Q 15 8 10 18 Q 5 8 10 2" fill={['#FF4500', '#FF6347', '#CD853F', '#DAA520'][p.id % 4]} />
            <line x1="10" y1="2" x2="10" y2="18" stroke="#8B4513" strokeWidth="1" />
          </svg>
        );
      case 'winter':
        return (
          <svg key={p.id} width={p.size * 0.8} height={p.size * 0.8} viewBox="0 0 16 16" className="absolute"
            style={{ left: `${p.x}%`, top: `${p.y}%`, transform: `rotate(${p.rotation}deg)`, opacity: 0.9 }}>
            <circle cx="8" cy="8" r="6" fill="#FFFFFF" />
            <circle cx="8" cy="8" r="4" fill="#E0FFFF" />
            <circle cx="8" cy="8" r="2" fill="#FFFFFF" />
          </svg>
        );
      default:
        return null;
    }
  };

  return <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">{particles.map(renderParticle)}</div>;
};

// ========== FLYING BIRDS ==========
export const FlyingBirds = ({ count = 5, direction = 'right' }) => {
  const [birds, setBirds] = useState([]);
  
  useEffect(() => {
    const newBirds = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: direction === 'right' ? -20 - i * 15 : 120 + i * 15,
      y: 10 + Math.random() * 25,
      speed: 0.15 + Math.random() * 0.1,
      wingPhase: Math.random() * Math.PI * 2,
      size: 20 + Math.random() * 15,
    }));
    setBirds(newBirds);
  }, [count, direction]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBirds(prev => prev.map(b => ({
        ...b,
        x: direction === 'right' 
          ? (b.x > 120 ? -20 : b.x + b.speed)
          : (b.x < -20 ? 120 : b.x - b.speed),
        y: b.y + Math.sin(b.x * 0.05) * 0.1,
        wingPhase: b.wingPhase + 0.3,
      })));
    }, 30);
    return () => clearInterval(interval);
  }, [direction]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {birds.map(bird => {
        const wingY = Math.sin(bird.wingPhase) * 5;
        return (
          <svg key={bird.id} width={bird.size} height={bird.size * 0.6} viewBox="0 0 40 24" className="absolute"
            style={{ left: `${bird.x}%`, top: `${bird.y}%`, opacity: 0.8 }}>
            <path d={`M 5 12 Q 12 ${7 + wingY} 20 12`} stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d={`M 35 12 Q 28 ${7 + wingY} 20 12`} stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
            <ellipse cx="20" cy="12" rx="3" ry="2" fill="#2a2a2a" />
          </svg>
        );
      })}
    </div>
  );
};

// ========== ANIMATED ISLAND (Smaller, touches water) ==========
export const AnimatedIsland = ({ season = 'summer', side = 'right' }) => {
  const [palmSway, setPalmSway] = useState(0);
  const seasonData = SEASONS[season];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPalmSway(prev => prev + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const swayAmount = Math.sin(palmSway) * 3;
  const isRight = side === 'right';

  return (
    <div className={`absolute top-16 ${isRight ? 'right-4' : 'left-4'}`} style={{ transform: isRight ? 'scaleX(1)' : 'scaleX(-1)' }}>
      <svg width="140" height="120" viewBox="0 0 140 120">
        {/* Island base with sand */}
        <ellipse cx="70" cy="105" rx="65" ry="15" fill={seasonData.groundColor} />
        <ellipse cx="70" cy="102" rx="58" ry="12" fill="#DEB887" />
        
        {/* Beach details */}
        <ellipse cx="50" cy="103" rx="8" ry="3" fill="#F5DEB3" opacity="0.6" />
        <ellipse cx="85" cy="105" rx="6" ry="2" fill="#F5DEB3" opacity="0.6" />
        
        {/* Palm tree trunk */}
        <path d={`M 70 95 Q ${68 + swayAmount} 70 ${65 + swayAmount * 0.5} 45`} stroke="#8B4513" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d={`M 70 95 Q ${68 + swayAmount} 70 ${65 + swayAmount * 0.5} 45`} stroke="#A0522D" strokeWidth="4" fill="none" strokeLinecap="round" />
        
        {/* Palm leaves */}
        {[-60, -30, 0, 30, 60].map((angle, i) => {
          const leafSway = swayAmount * (1 + i * 0.1);
          return (
            <path key={i}
              d={`M ${65 + leafSway * 0.5} 45 Q ${65 + angle * 0.8 + leafSway} ${30 - Math.abs(angle) * 0.2} ${65 + angle * 1.2 + leafSway * 1.5} ${35 + Math.abs(angle) * 0.15}`}
              stroke={seasonData.treeColor}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
        
        {/* Coconuts */}
        <circle cx={64 + swayAmount * 0.3} cy="48" r="4" fill="#8B4513" />
        <circle cx={68 + swayAmount * 0.3} cy="50" r="4" fill="#654321" />
        
        {/* Small palm */}
        <path d={`M 95 100 Q ${94 + swayAmount * 0.5} 85 ${92 + swayAmount * 0.3} 72`} stroke="#8B4513" strokeWidth="4" fill="none" strokeLinecap="round" />
        {[-40, 0, 40].map((angle, i) => (
          <path key={`small-${i}`}
            d={`M ${92 + swayAmount * 0.3} 72 Q ${92 + angle * 0.5 + swayAmount * 0.5} ${62} ${92 + angle * 0.8 + swayAmount * 0.7} ${66}`}
            stroke={seasonData.treeColor}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        ))}
        
        {/* Beach items */}
        {season === 'summer' && (
          <>
            <ellipse cx="45" cy="100" rx="6" ry="3" fill="#FF6B6B" /> {/* Beach ball */}
            <line x1="45" y1="97" x2="45" y2="103" stroke="#FFF" strokeWidth="1" />
            <line x1="42" y1="100" x2="48" y2="100" stroke="#4ECDC4" strokeWidth="1" />
          </>
        )}
        
        {season === 'winter' && (
          <>
            <ellipse cx="70" cy="95" rx="50" ry="8" fill="#FFFFFF" opacity="0.6" /> {/* Snow */}
          </>
        )}
      </svg>
    </div>
  );
};

// ========== ANIMATED BOATS ==========
export const AnimatedBoats = ({ show, type = 0, season = 'summer' }) => {
  const [position, setPosition] = useState(-200);
  const [bobOffset, setBobOffset] = useState(0);
  
  useEffect(() => {
    if (!show) {
      setPosition(-200);
      return;
    }
    const interval = setInterval(() => {
      setPosition(prev => prev > window.innerWidth + 100 ? -200 : prev + 1.5);
      setBobOffset(prev => prev + 0.1);
    }, 30);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const boats = [
    // Rowboat
    <svg key="rowboat" width="70" height="50" viewBox="0 0 70 50">
      <path d="M 10 35 Q 5 40 15 42 L 55 42 Q 65 40 60 35 Z" fill="#8B4513" />
      <rect x="30" y="20" width="4" height="15" fill="#654321" />
      <rect x="20" y="25" width="25" height="3" fill="#A0522D" rx="1" />
      <ellipse cx="35" cy="30" rx="3" ry="2" fill="#4A90D9" opacity="0.3" />
    </svg>,
    
    // Sailboat
    <svg key="sailboat" width="90" height="70" viewBox="0 0 90 70">
      <path d="M 15 55 Q 10 60 20 62 L 70 62 Q 80 60 75 55 Z" fill="#CD853F" />
      <rect x="42" y="20" width="4" height="35" fill="#8B4513" />
      <path d="M 44 20 L 44 45 L 75 35 Z" fill="#FFFFFF" stroke="#DDD" strokeWidth="1" />
      <path d="M 44 20 L 44 40 L 20 32 Z" fill="#FFD700" stroke="#DAA520" strokeWidth="1" />
      <line x1="44" y1="18" x2="44" y2="15" stroke="#8B4513" strokeWidth="2" />
      <polygon points="44,15 52,18 44,21" fill="#FF4444" />
    </svg>,
    
    // Fishing boat
    <svg key="fishing" width="100" height="60" viewBox="0 0 100 60">
      <path d="M 10 45 Q 5 50 15 52 L 85 52 Q 95 50 90 45 Z" fill="#2F4F4F" />
      <rect x="20" y="35" width="60" height="10" fill="#3C5A5A" />
      <rect x="35" y="25" width="20" height="10" fill="#4A6A6A" />
      <rect x="60" y="20" width="4" height="25" fill="#8B4513" />
      <line x1="62" y1="20" x2="62" y2="8" stroke="#888" strokeWidth="1" />
      <line x1="62" y1="8" x2="80" y2="15" stroke="#888" strokeWidth="1" strokeDasharray="2" />
    </svg>,
    
    // Yacht
    <svg key="yacht" width="130" height="80" viewBox="0 0 130 80">
      <path d="M 10 60 Q 5 65 15 68 L 115 68 Q 125 65 120 60 Z" fill="#FFFFFF" stroke="#DDD" strokeWidth="1" />
      <rect x="30" y="45" width="70" height="15" fill="#F5F5F5" />
      <rect x="40" y="35" width="50" height="10" fill="#E8E8E8" rx="2" />
      <rect x="55" y="28" width="20" height="7" fill="#87CEEB" rx="1" />
      <circle cx="45" cy="50" r="3" fill="#1E90FF" />
      <circle cx="85" cy="50" r="3" fill="#1E90FF" />
    </svg>,
    
    // Cargo ship
    <svg key="cargo" width="180" height="100" viewBox="0 0 180 100">
      <rect x="10" y="65" width="160" height="30" fill="#4A4A4A" />
      <rect x="20" y="50" width="140" height="15" fill="#5A5A5A" />
      <rect x="30" y="35" width="30" height="15" fill="#3A3A3A" />
      <rect x="70" y="40" width="20" height="10" fill="#FF4444" />
      <rect x="100" y="40" width="20" height="10" fill="#4444FF" />
      <rect x="130" y="40" width="20" height="10" fill="#44FF44" />
      <rect x="140" y="20" width="8" height="20" fill="#2A2A2A" />
      <ellipse cx="144" cy="15" rx="10" ry="8" fill="#888" opacity="0.6" />
    </svg>,
  ];

  const bob = Math.sin(bobOffset) * 3;

  return (
    <div className="absolute z-15" style={{ left: position, top: `calc(52% + ${bob}px)`, transition: 'top 0.3s ease' }}>
      {boats[type % boats.length]}
    </div>
  );
};

// ========== WHALE WITH SPOUT ==========
export const WhaleSprite = ({ show }) => {
  const [position, setPosition] = useState(-150);
  const [spoutPhase, setSpoutPhase] = useState(0);
  
  useEffect(() => {
    if (!show) {
      setPosition(-150);
      return;
    }
    const interval = setInterval(() => {
      setPosition(prev => prev + 1.5);
      setSpoutPhase(prev => prev + 0.15);
    }, 30);
    return () => clearInterval(interval);
  }, [show]);

  if (!show || position > window.innerWidth + 100) return null;

  const spoutHeight = Math.abs(Math.sin(spoutPhase)) * 20;

  return (
    <div className="absolute z-20" style={{ left: position, top: '48%', transform: `translateY(${Math.sin(position * 0.02) * 8}px)` }}>
      <svg width="120" height="80" viewBox="0 0 120 80">
        {/* Whale body */}
        <ellipse cx="60" cy="50" rx="50" ry="25" fill="#2C3E50" />
        <ellipse cx="55" cy="48" rx="42" ry="20" fill="#34495E" />
        
        {/* Tail */}
        <path d="M 105 50 Q 115 40 125 35 Q 118 50 125 65 Q 115 60 105 50" fill="#2C3E50" />
        
        {/* Fin */}
        <path d="M 50 30 Q 55 20 65 25 Q 60 35 55 35 Z" fill="#34495E" />
        
        {/* Eye */}
        <circle cx="25" cy="45" r="4" fill="#FFFFFF" />
        <circle cx="24" cy="45" r="2" fill="#1a1a1a" />
        
        {/* Smile */}
        <path d="M 15 55 Q 25 60 35 55" stroke="#1a1a1a" strokeWidth="2" fill="none" />
        
        {/* Water spout */}
        <path d={`M 45 25 Q 42 ${15 - spoutHeight} 45 ${5 - spoutHeight} Q 48 ${15 - spoutHeight} 45 25`} 
          fill="none" stroke="#87CEEB" strokeWidth="3" opacity={0.7 + Math.sin(spoutPhase) * 0.3} />
        <ellipse cx="45" cy={3 - spoutHeight} rx="8" ry="4" fill="#87CEEB" opacity={0.5 + Math.sin(spoutPhase) * 0.3} />
      </svg>
    </div>
  );
};

// ========== ENHANCED BACKGROUND ==========
export const RetroBackground = ({ stage, timeOfDay, showRain, showLightning, season = null }) => {
  const currentSeason = season || getCurrentSeason();
  const seasonData = SEASONS[currentSeason];
  const stageColors = getStageColors(stage, currentSeason);
  
  const [cloudPositions, setCloudPositions] = useState([0, 150, 300, 450]);
  const [waveOffset, setWaveOffset] = useState(0);
  const [starTwinkle, setStarTwinkle] = useState([]);
  const [rainDrops, setRainDrops] = useState([]);

  // Initialize stars
  useEffect(() => {
    if (stageColors.timeOfDay === 'night') {
      setStarTwinkle(Array.from({ length: 40 }, () => Math.random()));
    }
  }, [stageColors.timeOfDay]);

  // Animate clouds
  useEffect(() => {
    const interval = setInterval(() => {
      setCloudPositions(prev => prev.map((p, i) => (p + 0.2 + i * 0.05) % 600));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Animate waves
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 0.5) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Star twinkle
  useEffect(() => {
    if (stageColors.timeOfDay !== 'night') return;
    const interval = setInterval(() => {
      setStarTwinkle(prev => prev.map(() => 0.3 + Math.random() * 0.7));
    }, 200);
    return () => clearInterval(interval);
  }, [stageColors.timeOfDay]);

  // Rain
  useEffect(() => {
    if (showRain) {
      setRainDrops(Array.from({ length: 80 }, (_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 3 + Math.random() * 4,
        length: 10 + Math.random() * 15,
      })));
    } else {
      setRainDrops([]);
    }
  }, [showRain]);

  useEffect(() => {
    if (!showRain) return;
    const interval = setInterval(() => {
      setRainDrops(prev => prev.map(d => ({ ...d, y: (d.y + d.speed) % 120 })));
    }, 30);
    return () => clearInterval(interval);
  }, [showRain]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0 transition-all duration-1000"
        style={{ background: `linear-gradient(180deg, ${stageColors.skyColors[0]} 0%, ${stageColors.skyColors[1]} 60%, ${stageColors.waterColors[0]} 100%)` }} />

      {/* Sun/Moon based on stage */}
      {stage === 0 && (
        <div className="absolute top-12 right-16">
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Sun glow */}
            <circle cx="50" cy="50" r="45" fill={seasonData.accent} opacity="0.15" />
            <circle cx="50" cy="50" r="35" fill={seasonData.accent} opacity="0.25" />
            {/* Sun body */}
            <circle cx="50" cy="50" r="25" fill="#FFD700" />
            <circle cx="50" cy="50" r="22" fill="#FFEC8B" />
            {/* Sun rays */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              return (
                <line key={i}
                  x1={50 + Math.cos(angle) * 28}
                  y1={50 + Math.sin(angle) * 28}
                  x2={50 + Math.cos(angle) * 40}
                  y2={50 + Math.sin(angle) * 40}
                  stroke="#FFD700"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity={0.8}
                />
              );
            })}
          </svg>
        </div>
      )}

      {/* Moon for night stages */}
      {(stage === 2 || stage === 3) && (
        <div className="absolute top-12 right-16">
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="25" fill="#F5F5DC" />
            <circle cx="28" cy="28" r="20" fill={stageColors.skyColors[0]} />
            {/* Moon craters */}
            <circle cx="40" cy="35" r="3" fill="#E8E8D0" opacity="0.5" />
            <circle cx="35" cy="45" r="2" fill="#E8E8D0" opacity="0.5" />
          </svg>
        </div>
      )}

      {/* Stars for night */}
      {stageColors.timeOfDay === 'night' && (
        <div className="absolute inset-0">
          {starTwinkle.map((opacity, i) => (
            <div key={i} className="absolute rounded-full bg-white"
              style={{
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                left: `${(i * 17) % 100}%`,
                top: `${(i * 13) % 40}%`,
                opacity,
                boxShadow: `0 0 ${4 + (i % 3) * 2}px white`,
              }}
            />
          ))}
        </div>
      )}

      {/* Clouds */}
      {(stage === 0 || stage === 1) && cloudPositions.map((pos, i) => (
        <div key={i} className="absolute" style={{ top: 50 + i * 25, left: pos - 100, opacity: 0.9 - i * 0.15 }}>
          <svg width="120" height="50" viewBox="0 0 120 50">
            <ellipse cx="30" cy="28" rx="25" ry="18" fill="#FFFFFF" />
            <ellipse cx="55" cy="25" rx="30" ry="22" fill="#FFFFFF" />
            <ellipse cx="80" cy="28" rx="25" ry="18" fill="#F8F8F8" />
            <ellipse cx="55" cy="32" rx="35" ry="15" fill="#FAFAFA" />
          </svg>
        </div>
      ))}

      {/* Water */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: '45%' }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${stageColors.waterColors[0]} 0%, ${stageColors.waterColors[1]} 100%)` }} />
        
        {/* Animated wave lines */}
        <svg className="absolute inset-0 w-full h-full">
          {[...Array(10)].map((_, i) => (
            <path key={i}
              d={`M ${-waveOffset + (i % 2) * 30} ${i * 18 + 10} Q ${50 - waveOffset} ${i * 18 + 5} ${100 - waveOffset + (i % 2) * 30} ${i * 18 + 10} T ${200 - waveOffset} ${i * 18 + 10}`}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
              fill="none"
            />
          ))}
        </svg>

        {/* Water shimmer */}
        <div className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(${45 + waveOffset}deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)` }} />
      </div>

      {/* Seasonal particles */}
      <SeasonalParticles season={currentSeason} count={currentSeason === 'winter' ? 25 : 12} />

      {/* Rain */}
      {showRain && (
        <div className="absolute inset-0 pointer-events-none">
          {rainDrops.map((drop, i) => (
            <div key={i} className="absolute bg-blue-300 opacity-60"
              style={{
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: 2,
                height: drop.length,
                transform: 'rotate(15deg)',
              }}
            />
          ))}
        </div>
      )}

      {/* Lightning */}
      {showLightning && (
        <div className="absolute inset-0 bg-white opacity-70 animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

// ========== EXISTING SPRITES (ENHANCED) ==========

export const PixelFish = ({ color, size, wiggle = false }) => {
  const scale = size / 40;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 40 24" className={wiggle ? 'animate-wiggle' : ''} style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}>
      <ellipse cx="20" cy="12" rx="14" ry="9" fill={color} />
      <ellipse cx="18" cy="12" rx="11" ry="7" fill={color} opacity="0.85" />
      <path d="M 30 12 L 40 7 L 37 12 L 40 17 Z" fill={color} />
      <path d="M 16 6 Q 14 2 17 4 Z" fill={color} opacity="0.8" />
      <path d="M 16 18 Q 14 22 17 20 Z" fill={color} opacity="0.8" />
      <circle cx="12" cy="10" r="3" fill="#FFF" />
      <circle cx="11.5" cy="9.5" r="1.5" fill="#000" />
      <circle cx="12" cy="9" r="0.8" fill="#FFF" />
      <ellipse cx="20" cy="12" rx="3" ry="5" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
};

export const PixelBobber = ({ isActive, wobble = false }) => (
  <svg width="36" height="36" viewBox="0 0 32 32" className={isActive ? 'animate-shake' : wobble ? 'animate-bob' : ''} style={{ filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.4))' }}>
    <circle cx="16" cy="16" r="12" fill="#FF4444" />
    <circle cx="16" cy="16" r="9" fill="#FFFFFF" />
    <circle cx="16" cy="16" r="6" fill="#FF4444" />
    <ellipse cx="13" cy="13" rx="3" ry="2" fill="#FFAAAA" opacity="0.7" />
    {isActive && (
      <>
        <circle cx="16" cy="16" r="16" stroke="#00AAFF" strokeWidth="2" fill="none" opacity="0.7" className="animate-ping" />
        <circle cx="16" cy="16" r="20" stroke="#00AAFF" strokeWidth="2" fill="none" opacity="0.4" className="animate-ping" style={{ animationDelay: '0.2s' }} />
      </>
    )}
  </svg>
);

export const WaterSplash = ({ x, y }) => (
  <div className="absolute pointer-events-none animate-splash" style={{ left: x - 40, top: y - 25 }}>
    <svg width="80" height="50">
      <ellipse cx="40" cy="25" rx="12" ry="8" fill="#00AAFF" opacity="0.7" />
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 * Math.PI) / 180;
        return (
          <circle key={i}
            cx={40 + Math.cos(angle) * (15 + i * 3)}
            cy={25 + Math.sin(angle) * (10 + i * 2)}
            r={4 - i * 0.3}
            fill="#00AAFF"
            opacity={0.6 - i * 0.05}
          />
        );
      })}
    </svg>
  </div>
);

export const ParticleEffects = ({ type, x, y }) => {
  const [particles] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      angle: (i / 15) * Math.PI * 2,
      distance: 20 + Math.random() * 40,
      size: 4 + Math.random() * 6,
      color: type === 'perfect' ? '#00FF00' : type === 'catch' ? '#FFD700' : '#FF6B6B',
    }))
  );

  return (
    <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full animate-particle"
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
};

// Export BoatSprite as AnimatedBoats
export const BoatSprite = AnimatedBoats;

export default RetroBackground;
