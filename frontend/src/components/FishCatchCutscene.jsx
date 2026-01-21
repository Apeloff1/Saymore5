import React, { useEffect, useState } from 'react';

// Fish catch celebration cutscene component
const FishCatchCutscene = ({ fish, isPerfect, points, onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    // Initialize particles for celebration effect
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 40,
      vx: (Math.random() - 0.5) * 15,
      vy: -10 - Math.random() * 15,
      size: 6 + Math.random() * 10,
      color: isPerfect 
        ? ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 5)]
        : ['#4ECDC4', '#45B7D1', '#96E6A1', '#87CEEB'][Math.floor(Math.random() * 4)],
      rotation: Math.random() * 360,
      type: Math.random() > 0.5 ? 'star' : 'circle',
    }));
    setParticles(newParticles);
    
    // Phase animations
    const timers = [
      setTimeout(() => setPhase(1), 100),   // Fish appears
      setTimeout(() => setPhase(2), 500),   // Text appears
      setTimeout(() => setPhase(3), 1200),  // Points fly
      setTimeout(() => setPhase(4), 2200),  // Fade out
      setTimeout(() => onComplete?.(), 2800), // Complete
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [isPerfect, onComplete]);

  // Animate particles
  useEffect(() => {
    if (phase < 1) return;
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx * 0.1,
        y: p.y + p.vy * 0.1,
        vy: p.vy + 0.5, // gravity
        rotation: p.rotation + 5,
        size: p.size * 0.98,
      })));
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center pointer-events-none transition-opacity duration-500 ${phase >= 4 ? 'opacity-0' : 'opacity-100'}`}
      data-testid="fish-catch-cutscene"
    >
      {/* Darkened overlay */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-300 ${phase >= 1 ? 'opacity-60' : 'opacity-0'}`} />
      
      {/* Radial light burst */}
      {isPerfect && phase >= 1 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-[600px] h-[600px] rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,215,0,0.1) 40%, transparent 70%)',
              animation: 'pulse 0.8s ease-in-out infinite',
            }}
          />
        </div>
      )}
      
      {/* Celebration particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute transition-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.type === 'circle' ? '50%' : '0',
            transform: `rotate(${p.rotation}deg) ${p.type === 'star' ? 'scale(1.2)' : ''}`,
            opacity: Math.min(1, p.size / 8),
            boxShadow: isPerfect ? `0 0 ${p.size}px ${p.color}` : 'none',
          }}
        />
      ))}
      
      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Perfect catch banner */}
        {isPerfect && phase >= 1 && (
          <div 
            className={`mb-4 px-6 py-2 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 rounded-lg border-4 border-yellow-300 shadow-[0_0_30px_rgba(255,215,0,0.8)] transition-all duration-500 ${phase >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
            style={{ animation: phase >= 1 ? 'bounce 0.6s ease-out' : 'none' }}
          >
            <span className="text-2xl font-bold text-yellow-900 font-pixel tracking-wider drop-shadow-lg">
              ✨ PERFECT! ✨
            </span>
          </div>
        )}
        
        {/* Fish display with animation */}
        <div 
          className={`relative transition-all duration-700 ease-out ${
            phase >= 1 ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-20'
          }`}
          style={{
            animation: phase >= 1 && phase < 4 ? 'fishBounce 1.5s ease-in-out infinite' : 'none',
          }}
        >
          {/* Glow behind fish */}
          <div 
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background: `radial-gradient(circle, ${fish?.color || '#4ECDC4'}66 0%, transparent 70%)`,
              transform: 'scale(2)',
            }}
          />
          
          {/* Fish SVG */}
          <svg 
            width="180" 
            height="120" 
            viewBox="0 0 60 40" 
            className="relative drop-shadow-2xl"
            style={{ filter: `drop-shadow(0 0 20px ${fish?.color || '#4ECDC4'})` }}
          >
            {/* Fish body */}
            <ellipse cx="28" cy="20" rx="22" ry="14" fill={fish?.color || '#4ECDC4'} />
            <ellipse cx="25" cy="20" rx="18" ry="11" fill={fish?.color || '#4ECDC4'} opacity="0.85" />
            
            {/* Tail */}
            <path d="M 45 20 L 58 10 L 54 20 L 58 30 Z" fill={fish?.color || '#4ECDC4'} />
            
            {/* Dorsal fin */}
            <path d="M 20 8 Q 28 2 35 8 L 28 12 Z" fill={fish?.color || '#4ECDC4'} opacity="0.9" />
            
            {/* Bottom fin */}
            <path d="M 22 32 Q 28 38 34 32 L 28 28 Z" fill={fish?.color || '#4ECDC4'} opacity="0.9" />
            
            {/* Eye */}
            <circle cx="14" cy="17" r="5" fill="#FFF" />
            <circle cx="13" cy="16" r="3" fill="#000" />
            <circle cx="12" cy="15" r="1.2" fill="#FFF" />
            
            {/* Scales pattern */}
            <ellipse cx="28" cy="20" rx="6" ry="9" fill="rgba(255,255,255,0.15)" />
            
            {/* Shine */}
            <ellipse cx="20" cy="14" rx="8" ry="4" fill="rgba(255,255,255,0.3)" />
          </svg>
          
          {/* Sparkles around fish */}
          {isPerfect && [0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute text-2xl"
              style={{
                left: `${30 + Math.cos(i * Math.PI / 2) * 80}px`,
                top: `${50 + Math.sin(i * Math.PI / 2) * 50}px`,
                animation: `sparkle 0.8s ease-in-out ${i * 0.2}s infinite`,
              }}
            >
              ⭐
            </div>
          ))}
        </div>
        
        {/* Fish name */}
        <div 
          className={`mt-6 transition-all duration-500 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        >
          <h2 className="text-3xl font-bold text-white font-pixel text-center drop-shadow-lg"
              style={{ textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
            {fish?.name || 'Fish'}!
          </h2>
          <p className="text-lg text-gray-300 text-center mt-1">
            {fish?.actualSize || fish?.size || 30}cm
          </p>
        </div>
        
        {/* Points display */}
        <div 
          className={`mt-4 transition-all duration-500 ${phase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
        >
          <div 
            className={`px-8 py-3 rounded-xl ${isPerfect ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'} border-4 border-white shadow-2xl`}
            style={{ animation: phase >= 3 ? 'pointsPop 0.5s ease-out' : 'none' }}
          >
            <span className="text-4xl font-bold text-white font-pixel drop-shadow-lg">
              +{points?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>
      
      {/* CSS animations */}
      <style>{`
        @keyframes fishBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(-3deg); }
          75% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes pointsPop {
          0% { transform: scale(0.5); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes bounce {
          0% { transform: scale(0) rotate(-10deg); }
          50% { transform: scale(1.1) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default FishCatchCutscene;
