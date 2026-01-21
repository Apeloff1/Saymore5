import React, { useState } from 'react';
import { 
  EXPANSION_PACKAGES, 
  EXPANSION_STAGES, 
  EXPANSION_RODS, 
  EXPANSION_LINES,
  EXPANSION_BOBBERS,
  EXPANSION_DIFFICULTIES, 
  TACKLEBOX_UPGRADES,
  FISHING_SKILLS,
  EXPANSION_FISH
} from '../lib/expansionData';
import { toast } from 'sonner';

// ========== EXPANSION SHOP COMPONENT ==========
const ExpansionShop = ({ onClose, onPurchase, purchasedItems = {} }) => {
  const [activeTab, setActiveTab] = useState('packages');
  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  
  const tabs = [
    { id: 'packages', name: 'Bundles', icon: '🎁' },
    { id: 'stages', name: 'Stages', icon: '🗺️' },
    { id: 'rods', name: 'Rods', icon: '🎣' },
    { id: 'bobbers', name: 'Bobbers', icon: '🔴' },
    { id: 'lines', name: 'Lines', icon: '🧵' },
    { id: 'difficulty', name: 'Difficulty', icon: '💪' },
    { id: 'tacklebox', name: 'Tacklebox', icon: '🎒' },
    { id: 'skills', name: 'Skills', icon: '⚡' },
    { id: 'fish', name: 'Fishdex', icon: '🐟' },
  ];
  
  const addToCart = (item, type) => {
    if (cart.find(c => c.id === item.id && c.type === type)) {
      toast.error('Already in cart!');
      return;
    }
    setCart([...cart, { ...item, type }]);
    toast.success(`Added ${item.name} to cart!`);
  };
  
  const removeFromCart = (item) => {
    setCart(cart.filter(c => !(c.id === item.id && c.type === item.type)));
  };
  
  const cartTotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty!');
      return;
    }
    // Simulate purchase
    onPurchase(cart);
    setCart([]);
    toast.success('🎉 Purchase successful! Enjoy your new items!');
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 animate-backdrop" data-testid="expansion-shop">
      <div className="glass-panel rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border-2 border-yellow-500/30 animate-modal flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-600 via-orange-500 to-red-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏪</span>
            <div>
              <h2 className="text-xl font-bold text-white font-pixel">EXPANSION SHOP</h2>
              <p className="text-yellow-100 text-xs">Premium content to enhance your fishing!</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white text-xl transition-all"
            data-testid="close-shop"
          >
            ✕
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-1 p-2 bg-black/40 border-b border-white/10 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === tab.id 
                  ? 'bg-yellow-500 text-black' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Packages Tab */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-yellow-400">💰 BUNDLE DEALS - SAVE BIG!</h3>
                <p className="text-white/60 text-xs">Best value packages for serious anglers</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {EXPANSION_PACKAGES.map(pkg => (
                  <div 
                    key={pkg.id}
                    className={`rounded-2xl p-4 border-2 transition-all hover:scale-[1.02] cursor-pointer ${
                      pkg.featured 
                        ? 'bg-gradient-to-br from-yellow-500/20 to-purple-500/20 border-yellow-400 ring-2 ring-yellow-400/50' 
                        : 'bg-white/5 border-white/20 hover:border-white/40'
                    }`}
                    onClick={() => setSelectedItem({ ...pkg, type: 'package' })}
                    data-testid={`package-${pkg.id}`}
                  >
                    {pkg.featured && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-bold px-2 py-1 rounded-full inline-block mb-2">
                        ⭐ BEST VALUE
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-2xl`}>
                        {pkg.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{pkg.name}</h4>
                        <p className="text-white/60 text-xs mb-2">{pkg.desc}</p>
                        <div className="flex flex-wrap gap-1">
                          {pkg.items.slice(0, 3).map((item, i) => (
                            <span key={i} className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/80">
                              {item}
                            </span>
                          ))}
                          {pkg.items.length > 3 && (
                            <span className="text-[9px] text-yellow-400">+{pkg.items.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                      <div>
                        <span className="text-white/50 line-through text-xs">${pkg.originalPrice}</span>
                        <span className="text-green-400 text-xs ml-2">-{pkg.discount}%</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); addToCart(pkg, 'package'); }}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white font-bold text-sm hover:from-green-400 hover:to-emerald-500 transition-all"
                      >
                        ${pkg.price}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Stages Tab */}
          {activeTab === 'stages' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-cyan-400">🗺️ 50 UNIQUE STAGES</h3>
                <p className="text-white/60 text-xs">Explore diverse fishing locations</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {EXPANSION_STAGES.map(stage => (
                  <button
                    key={stage.id}
                    onClick={() => !stage.unlocked && stage.price > 0 && addToCart(stage, 'stage')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      stage.unlocked 
                        ? 'bg-green-900/30 border-green-500/50 cursor-default' 
                        : stage.price === 0 
                          ? 'bg-white/5 border-white/20'
                          : 'bg-white/5 border-white/20 hover:border-yellow-400 hover:bg-yellow-500/10 cursor-pointer'
                    }`}
                    data-testid={`stage-${stage.id}`}
                  >
                    <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center text-lg mb-1`}>
                      {stage.icon}
                    </div>
                    <p className="text-[10px] text-white font-medium truncate">{stage.name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < stage.difficulty ? 'bg-yellow-400' : 'bg-white/20'}`} />
                      ))}
                    </div>
                    <p className="text-[9px] mt-1 font-bold">
                      {stage.unlocked ? (
                        <span className="text-green-400">✓ OWNED</span>
                      ) : stage.price === 0 ? (
                        <span className="text-white/50">FREE</span>
                      ) : (
                        <span className="text-yellow-400">${stage.price}</span>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Rods Tab */}
          {activeTab === 'rods' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-orange-400">🎣 10 PREMIUM RODS</h3>
                <p className="text-white/60 text-xs">Upgrade your casting power</p>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2">
                {EXPANSION_RODS.map(rod => (
                  <div
                    key={rod.id}
                    className="bg-white/5 rounded-xl p-4 border-2 border-white/20 hover:border-orange-400 transition-all"
                    data-testid={`rod-${rod.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: rod.color + '40' }}
                      >
                        <div className="w-2 h-10 rounded" style={{ backgroundColor: rod.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{rod.name}</h4>
                        <p className="text-white/50 text-[10px]">{rod.desc}</p>
                        <div className="flex gap-3 mt-1 text-[9px]">
                          <span className="text-cyan-400">Cast: {rod.castDistance}m</span>
                          <span className="text-green-400">Speed: {rod.reelSpeed}x</span>
                        </div>
                      </div>
                      <button
                        onClick={() => rod.price > 0 && addToCart(rod, 'rod')}
                        className={`px-3 py-2 rounded-lg font-bold text-xs ${
                          rod.price === 0 
                            ? 'bg-green-900/50 text-green-400 cursor-default' 
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400'
                        }`}
                      >
                        {rod.price === 0 ? '✓ FREE' : `$${rod.price}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Bobbers Tab */}
          {activeTab === 'bobbers' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-red-400">🔴 15 PREMIUM BOBBERS</h3>
                <p className="text-white/60 text-xs">Better visibility and sensitivity</p>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {EXPANSION_BOBBERS.map(bobber => (
                  <button
                    key={bobber.id}
                    onClick={() => bobber.price > 0 && addToCart(bobber, 'bobber')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      bobber.price === 0 
                        ? 'bg-green-900/30 border-green-500/50 cursor-default' 
                        : 'bg-white/5 border-white/20 hover:border-red-400 hover:bg-red-500/10 cursor-pointer'
                    } ${bobber.legendary ? 'ring-2 ring-yellow-400 animate-pulse' : ''}`}
                    data-testid={`bobber-${bobber.id}`}
                  >
                    <div 
                      className={`w-8 h-8 mx-auto rounded-full mb-1 ${bobber.glow ? 'animate-pulse' : ''}`}
                      style={{ 
                        backgroundColor: bobber.color,
                        boxShadow: bobber.glow ? `0 0 15px ${bobber.color}80` : 'none',
                        background: bobber.rainbow ? 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)' : bobber.color,
                      }}
                    />
                    <p className="text-[9px] text-white font-medium truncate">{bobber.name}</p>
                    <div className="flex justify-center gap-1 mt-1 text-[8px]">
                      <span className="text-cyan-400">V:{bobber.visibility}</span>
                      <span className="text-green-400">S:{bobber.sensitivity}</span>
                    </div>
                    <p className="text-[9px] mt-1 font-bold">
                      {bobber.price === 0 ? (
                        <span className="text-green-400">✓ FREE</span>
                      ) : (
                        <span className="text-yellow-400">${bobber.price}</span>
                      )}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Lines Tab */}
          {activeTab === 'lines' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-blue-400">🧵 10 FISHING LINES</h3>
                <p className="text-white/60 text-xs">Better lines for bigger catches</p>
              </div>
              
              <div className="grid gap-2 md:grid-cols-2">
                {EXPANSION_LINES.map(line => (
                  <div
                    key={line.id}
                    className="bg-white/5 rounded-xl p-3 border-2 border-white/20 hover:border-blue-400 transition-all flex items-center gap-3"
                    data-testid={`line-${line.id}`}
                  >
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: line.color + '30', border: `2px solid ${line.color}` }}
                    >
                      <span className="text-lg">🧵</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white text-sm truncate">{line.name}</h4>
                      <div className="flex gap-2 text-[9px]">
                        <span className="text-green-400">Str: {line.strength}</span>
                        <span className="text-cyan-400">Vis: {(line.visibility * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => line.price > 0 && addToCart(line, 'line')}
                      className={`px-3 py-2 rounded-lg font-bold text-xs ${
                        line.price === 0 
                          ? 'bg-green-900/50 text-green-400 cursor-default' 
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-400 hover:to-cyan-400'
                      }`}
                    >
                      {line.price === 0 ? '✓ FREE' : `$${line.price}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Difficulty Tab */}
          {activeTab === 'difficulty' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-red-400">💪 5 EXTREME DIFFICULTIES</h3>
                <p className="text-white/60 text-xs">Challenge yourself for bigger rewards!</p>
              </div>
              
              <div className="grid gap-3">
                {EXPANSION_DIFFICULTIES.map(diff => (
                  <div
                    key={diff.id}
                    className={`rounded-xl p-4 border-2 transition-all ${
                      diff.unlocked 
                        ? 'bg-green-900/30 border-green-500/50' 
                        : `bg-gradient-to-r ${diff.color} bg-opacity-20 border-white/20 hover:border-white/50`
                    }`}
                    data-testid={`difficulty-${diff.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${diff.color} flex items-center justify-center text-3xl`}>
                        {diff.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg">{diff.name}</h4>
                        <p className="text-white/60 text-xs mb-2">{diff.desc}</p>
                        <div className="flex flex-wrap gap-2 text-[9px]">
                          <span className="bg-red-500/30 px-2 py-0.5 rounded text-red-300">
                            Tension: {diff.tensionMultiplier}x
                          </span>
                          <span className="bg-orange-500/30 px-2 py-0.5 rounded text-orange-300">
                            Fish Power: {diff.fishStrength}x
                          </span>
                          <span className="bg-green-500/30 px-2 py-0.5 rounded text-green-300">
                            Rewards: {diff.rewardMultiplier}x
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => !diff.unlocked && diff.price > 0 && addToCart(diff, 'difficulty')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${
                          diff.unlocked 
                            ? 'bg-green-900/50 text-green-400 cursor-default' 
                            : diff.price === 0
                              ? 'bg-green-900/50 text-green-400 cursor-default'
                              : 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-400 hover:to-orange-400'
                        }`}
                      >
                        {diff.unlocked ? '✓ UNLOCKED' : diff.price === 0 ? '✓ FREE' : `$${diff.price}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-red-900/20 rounded-xl border border-red-500/30 text-center">
                <p className="text-red-300 text-sm">⚠️ Higher difficulties = Higher risks + Higher rewards!</p>
              </div>
            </div>
          )}
          
          {/* Tacklebox Tab */}
          {activeTab === 'tacklebox' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-amber-400">🎒 TACKLEBOX UPGRADES</h3>
                <p className="text-white/60 text-xs">Store more fish with better organization</p>
              </div>
              
              <div className="grid gap-3">
                {TACKLEBOX_UPGRADES.map(box => (
                  <div
                    key={box.id}
                    className="bg-white/5 rounded-xl p-4 border-2 border-white/20 hover:border-amber-400 transition-all"
                    data-testid={`tacklebox-${box.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-3xl">
                        {box.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{box.name}</h4>
                        <p className="text-yellow-400 text-xs">{box.slots} fish capacity</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {box.features.map((f, i) => (
                            <span key={i} className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-white/70">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => box.price > 0 && addToCart(box, 'tacklebox')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${
                          box.price === 0 
                            ? 'bg-green-900/50 text-green-400 cursor-default' 
                            : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400'
                        }`}
                      >
                        {box.price === 0 ? '✓ FREE' : `$${box.price}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-purple-400">⚡ FISHING SKILLS</h3>
                <p className="text-white/60 text-xs">Level up your fishing abilities (Included in Pro+ packs)</p>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(FISHING_SKILLS).map(([key, skill]) => (
                  <div
                    key={key}
                    className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 rounded-xl p-4 border-2 border-purple-500/30"
                    data-testid={`skill-${key}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/30 flex items-center justify-center text-2xl">
                        {skill.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{skill.name}</h4>
                        <p className="text-purple-300 text-xs">{skill.desc}</p>
                      </div>
                    </div>
                    
                    {/* Skill level bar */}
                    <div className="bg-black/30 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-0 transition-all" />
                    </div>
                    <div className="flex justify-between text-[10px] mt-1">
                      <span className="text-white/50">Level 0</span>
                      <span className="text-purple-400">Max: {skill.levels}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-purple-900/20 rounded-xl border border-purple-500/30 text-center">
                <p className="text-purple-300 text-sm">🔒 Skill system included in <strong className="text-yellow-400">Fisher Pack</strong> and above!</p>
              </div>
            </div>
          )}
          
          {/* Fish Preview Tab */}
          {activeTab === 'fish' && (
            <div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-cyan-400">🐟 100 FISH TYPES</h3>
                <p className="text-white/60 text-xs">Including 10 SUPER RARE legendary fish!</p>
              </div>
              
              {/* Super Rare Fish Preview */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-yellow-400 mb-2">✨ SUPER RARE FISH (10)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {EXPANSION_FISH.filter(f => f.rarity === 'super_rare').map(fish => (
                    <div
                      key={fish.id}
                      className="bg-gradient-to-br from-yellow-900/30 to-purple-900/30 rounded-xl p-3 border-2 border-yellow-500/30 text-center animate-pulse"
                      data-testid={`fish-${fish.id}`}
                    >
                      <div 
                        className="w-10 h-10 mx-auto rounded-full mb-1"
                        style={{ 
                          backgroundColor: fish.color,
                          boxShadow: `0 0 20px ${fish.color}80`
                        }}
                      />
                      <p className="text-[9px] text-white font-bold truncate">{fish.name}</p>
                      <p className="text-[8px] text-yellow-400">{fish.points.toLocaleString()} pts</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Regular Fish Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-xl p-4 text-center border border-white/20">
                  <p className="text-3xl mb-1">🐟</p>
                  <p className="text-white font-bold">40</p>
                  <p className="text-white/50 text-xs">Common</p>
                </div>
                <div className="bg-blue-900/30 rounded-xl p-4 text-center border border-blue-500/30">
                  <p className="text-3xl mb-1">🐠</p>
                  <p className="text-blue-400 font-bold">30</p>
                  <p className="text-blue-300/50 text-xs">Uncommon</p>
                </div>
                <div className="bg-purple-900/30 rounded-xl p-4 text-center border border-purple-500/30">
                  <p className="text-3xl mb-1">🐡</p>
                  <p className="text-purple-400 font-bold">20</p>
                  <p className="text-purple-300/50 text-xs">Rare</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-900/30 to-red-900/30 rounded-xl p-4 text-center border border-yellow-500/30">
                  <p className="text-3xl mb-1">🐉</p>
                  <p className="text-yellow-400 font-bold">10</p>
                  <p className="text-yellow-300/50 text-xs">Super Rare</p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-cyan-900/20 rounded-xl border border-cyan-500/30 text-center">
                <p className="text-cyan-300 text-sm">🔓 All 100 fish types included in <strong className="text-yellow-400">Ultimate Bundle</strong>!</p>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="border-t border-white/20 bg-black/60 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm">Cart ({cart.length}):</span>
                <div className="flex gap-1 max-w-[200px] overflow-x-auto">
                  {cart.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => removeFromCart(item)}
                      className="px-2 py-1 bg-white/10 rounded text-[10px] text-white hover:bg-red-500/50 transition-all"
                      title="Click to remove"
                    >
                      {item.name} ✕
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-yellow-400">${cartTotal.toFixed(2)}</span>
                <button
                  onClick={handleCheckout}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold hover:from-green-400 hover:to-emerald-500 transition-all flex items-center gap-2"
                  data-testid="checkout-btn"
                >
                  <span>💳</span>
                  <span>CHECKOUT</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Total Price Banner */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-3 text-center">
          <p className="text-white text-sm">
            🎯 <strong>ULTIMATE BUNDLE</strong> - Everything for just <strong className="text-2xl">$49.99</strong> (Save $40!)
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default ExpansionShop;
