'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ===========================================
// CONFIGURATION
// ===========================================
const API_BASE_URL = '/api/game';
const SAVE_INTERVAL = 10000;
const LOCAL_DEVICE_KEY = 'space_clicker_device_id';
const LOCAL_SAVE_KEY = 'space_clicker_local_save';

// ===========================================
// GAME BALANCE CONSTANTS
// ===========================================
const UPGRADE_BASE_COSTS = {
  tap_power: 100,
  auto_collect: 250,
};

const UPGRADE_COST_MULTIPLIER = 1.15;
const MILESTONE_10_BONUS = 3;
const MILESTONE_50_BONUS = 5;

// ===========================================
// GAME DATA - SOLAR SYSTEM
// ===========================================
const SOLAR_SYSTEM = {
  id: 'solar_system',
  name: 'Solar System',
  unlockCost: 0,
  bodies: [
    { id: 'sun', name: 'The Sun', color: '#FFD93D', landColor: '#FF8C00', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 220 },
    { id: 'mercury', name: 'Mercury', color: '#A0522D', landColor: '#8B4513', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 80 },
    { id: 'venus', name: 'Venus', color: '#DEB887', landColor: '#D2691E', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 110 },
    { id: 'earth', name: 'Earth', color: '#4a90d9', landColor: '#5cb85c', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 120 },
    { id: 'mars', name: 'Mars', color: '#d9654a', landColor: '#c9553a', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 100 },
    { id: 'jupiter', name: 'Jupiter', color: '#d9a054', landColor: '#c99044', unlockCost: 25000000, baseEnergy: 35, baseTap: 35, size: 180 },
    { id: 'saturn', name: 'Saturn', color: '#e8d068', landColor: '#d8c058', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, hasRings: true, size: 170 },
    { id: 'uranus', name: 'Uranus', color: '#87CEEB', landColor: '#5F9EA0', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, hasRings: true, ringTilt: 90, size: 140 },
    { id: 'neptune', name: 'Neptune', color: '#5a7bd9', landColor: '#4a6bc9', unlockCost: 2500000000, baseEnergy: 400, baseTap: 400, size: 135 },
    { id: 'pluto', name: 'Pluto', color: '#a8a8b8', landColor: '#989898', unlockCost: 10000000000, baseEnergy: 900, baseTap: 900, size: 70 },
  ]
};

// ===========================================
// GAME DATA - GALAXIES
// ===========================================
const GALAXIES = [
  SOLAR_SYSTEM,
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy',
    unlockCost: 100000000000, // 100B
    bodies: [
      { id: 'andromeda_core', name: 'Galactic Core', color: '#9370DB', landColor: '#8A2BE2', unlockCost: 0, baseEnergy: 2000, baseTap: 2000, isStar: true, size: 220 },
      { id: 'alpheratz', name: 'Alpheratz Prime', color: '#E6E6FA', landColor: '#D8BFD8', unlockCost: 150000000000, baseEnergy: 3500, baseTap: 3500, size: 140 },
      { id: 'mirach', name: 'Mirach World', color: '#FF6B6B', landColor: '#EE5A5A', unlockCost: 500000000000, baseEnergy: 6000, baseTap: 6000, size: 160 },
      { id: 'almach', name: 'Almach Station', color: '#4ECDC4', landColor: '#45B7AA', unlockCost: 2000000000000, baseEnergy: 12000, baseTap: 12000, size: 130 },
    ]
  },
  {
    id: 'triangulum',
    name: 'Triangulum Galaxy',
    unlockCost: 10000000000000, // 10T
    bodies: [
      { id: 'triangulum_core', name: 'Triangle Core', color: '#FF69B4', landColor: '#FF1493', unlockCost: 0, baseEnergy: 25000, baseTap: 25000, isStar: true, size: 220 },
      { id: 'mothallah', name: 'Mothallah', color: '#00CED1', landColor: '#008B8B', unlockCost: 25000000000000, baseEnergy: 45000, baseTap: 45000, size: 150 },
      { id: 'deltotum', name: 'Deltotum', color: '#FFD700', landColor: '#FFA500', unlockCost: 100000000000000, baseEnergy: 90000, baseTap: 90000, size: 170 },
    ]
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool Galaxy',
    unlockCost: 500000000000000, // 500T
    bodies: [
      { id: 'whirlpool_core', name: 'Vortex Core', color: '#00FF7F', landColor: '#3CB371', unlockCost: 0, baseEnergy: 200000, baseTap: 200000, isStar: true, size: 220 },
      { id: 'spiral_one', name: 'Spiral Alpha', color: '#BA55D3', landColor: '#9932CC', unlockCost: 750000000000000, baseEnergy: 350000, baseTap: 350000, size: 160 },
      { id: 'spiral_two', name: 'Spiral Beta', color: '#20B2AA', landColor: '#2E8B57', unlockCost: 2000000000000000, baseEnergy: 700000, baseTap: 700000, size: 175 },
      { id: 'spiral_three', name: 'Spiral Omega', color: '#FF4500', landColor: '#DC143C', unlockCost: 5000000000000000, baseEnergy: 1500000, baseTap: 1500000, size: 190 },
    ]
  },
  {
    id: 'sombrero',
    name: 'Sombrero Galaxy',
    unlockCost: 25000000000000000, // 25 Quadrillion
    bodies: [
      { id: 'sombrero_core', name: 'Hat Core', color: '#FFE4B5', landColor: '#FFDAB9', unlockCost: 0, baseEnergy: 3000000, baseTap: 3000000, isStar: true, size: 220 },
      { id: 'brim_alpha', name: 'Brim Alpha', color: '#DDA0DD', landColor: '#DA70D6', unlockCost: 50000000000000000, baseEnergy: 5500000, baseTap: 5500000, size: 165 },
      { id: 'corona_world', name: 'Corona World', color: '#AFEEEE', landColor: '#48D1CC', unlockCost: 150000000000000000, baseEnergy: 12000000, baseTap: 12000000, size: 180 },
    ]
  }
];

// ===========================================
// UTILITY FUNCTIONS
// ===========================================
const generateDeviceId = () => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const formatNumber = (num) => {
  if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Qi';
  if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Q';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
};

const getDeviceId = () => {
  if (typeof window === 'undefined') return 'server';
  let deviceId = localStorage.getItem(LOCAL_DEVICE_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(LOCAL_DEVICE_KEY, deviceId);
  }
  return deviceId;
};

const getWeekNumber = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 604800000;
  return Math.floor(diff / oneWeek);
};

const calculateUpgradeCost = (baseType, level) => {
  const baseCost = UPGRADE_BASE_COSTS[baseType];
  return Math.floor(baseCost * Math.pow(UPGRADE_COST_MULTIPLIER, level));
};

const calculateMilestoneMultiplier = (level) => {
  const bonus10 = Math.floor(level / 10);
  const bonus50 = Math.floor(level / 50);
  let multiplier = 1;
  multiplier *= Math.pow(MILESTONE_10_BONUS, bonus10);
  multiplier *= Math.pow(MILESTONE_50_BONUS, bonus50);
  return multiplier;
};

// ===========================================
// API SERVICE
// ===========================================
const GameAPI = {
  async saveGame(deviceId, gameState) {
    try {
      const response = await fetch(`${API_BASE_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, ...gameState, updatedAt: new Date().toISOString() })
      });
      if (!response.ok) throw new Error('Save failed');
      return await response.json();
    } catch (error) {
      console.error('API save failed, using localStorage fallback:', error);
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify({ deviceId, ...gameState }));
      return { success: true, fallback: true };
    }
  },

  async loadGame(deviceId) {
    try {
      const response = await fetch(`${API_BASE_URL}/load/${deviceId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Load failed');
      }
      return await response.json();
    } catch (error) {
      console.error('API load failed, trying localStorage fallback:', error);
      const localSave = localStorage.getItem(LOCAL_SAVE_KEY);
      if (localSave) {
        const data = JSON.parse(localSave);
        if (data.deviceId === deviceId) return data;
      }
      return null;
    }
  },

  async getLeaderboard(galaxyId, bodyId, limit = 20) {
    try {
      const week = getWeekNumber();
      const response = await fetch(`${API_BASE_URL}/leaderboard?galaxy=${galaxyId}&body=${bodyId}&week=${week}&limit=${limit}`);
      if (!response.ok) throw new Error('Leaderboard fetch failed');
      return await response.json();
    } catch (error) {
      console.error('Leaderboard fetch failed:', error);
      return [];
    }
  },

  async submitScore(deviceId, galaxyId, bodyId, energy) {
    try {
      const week = getWeekNumber();
      const response = await fetch(`${API_BASE_URL}/leaderboard/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, galaxyId, bodyId, energy, week })
      });
      return await response.json();
    } catch (error) {
      console.error('Score submit failed:', error);
      return { success: false };
    }
  }
};

// ===========================================
// COMPONENTS
// ===========================================

const StarField = () => {
  const [stars] = useState(() =>
    Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 3 + 2
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

const CelestialBody = ({ body, onClick, size }) => {
  const [scale, setScale] = useState(1);
  const [ripples, setRipples] = useState([]);
  const displaySize = size || body.size || 160;

  const handleClick = (e) => {
    setScale(0.92);
    setTimeout(() => setScale(1), 100);

    const ripple = { id: Date.now() };
    setRipples(prev => [...prev, ripple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== ripple.id)), 600);

    onClick(e);
  };

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: displaySize * 1.5, height: displaySize * 1.5 }}
      onClick={handleClick}
    >
      {/* Glow effect */}
      <div
        className="absolute rounded-full transition-transform duration-100"
        style={{
          width: displaySize * 1.2,
          height: displaySize * 1.2,
          background: body.isStar
            ? `radial-gradient(circle, ${body.color}99 0%, ${body.color}44 40%, transparent 70%)`
            : `radial-gradient(circle, ${body.color}66 0%, transparent 70%)`,
          transform: `scale(${scale})`,
          filter: body.isStar ? 'blur(25px)' : 'blur(20px)'
        }}
      />

      {/* Solar flares for stars */}
      {body.isStar && (
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            width: displaySize * 1.4,
            height: displaySize * 1.4,
            background: `radial-gradient(circle, ${body.color}33 0%, transparent 60%)`,
            filter: 'blur(15px)'
          }}
        />
      )}

      {/* Ripples */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute rounded-full border-2"
          style={{
            width: displaySize,
            height: displaySize,
            borderColor: body.color,
            animation: 'ripple 0.6s ease-out forwards'
          }}
        />
      ))}

      {/* Rings for Saturn/Uranus */}
      {body.hasRings && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: displaySize * 1.8,
            height: displaySize * 0.5,
            border: `3px solid ${body.landColor}`,
            borderRadius: '50%',
            transform: `rotateX(${body.ringTilt || 75}deg)`,
            opacity: 0.7
          }}
        />
      )}

      {/* Main body */}
      <div
        className="relative rounded-full transition-transform duration-100 overflow-hidden"
        style={{
          width: displaySize,
          height: displaySize,
          backgroundColor: body.color,
          transform: `scale(${scale})`,
          boxShadow: body.isStar
            ? `0 0 ${displaySize * 0.4}px ${body.color}66, inset -${displaySize * 0.1}px -${displaySize * 0.05}px ${displaySize * 0.2}px rgba(255,200,100,0.5)`
            : `inset -${displaySize * 0.15}px -${displaySize * 0.1}px ${displaySize * 0.3}px rgba(0,0,0,0.5), 0 0 ${displaySize * 0.2}px ${body.color}44`
        }}
      >
        {!body.isStar && (
          <>
            <div
              className="absolute rounded-full"
              style={{ width: '55%', height: '35%', backgroundColor: body.landColor, top: '18%', left: '12%', opacity: 0.85, borderRadius: '45% 55% 50% 50%' }}
            />
            <div
              className="absolute rounded-full"
              style={{ width: '35%', height: '28%', backgroundColor: body.landColor, top: '52%', left: '48%', opacity: 0.8, borderRadius: '50% 45% 55% 45%' }}
            />
            <div
              className="absolute rounded-full"
              style={{ width: '20%', height: '15%', backgroundColor: body.landColor, top: '65%', left: '15%', opacity: 0.7, borderRadius: '40% 60% 50% 50%' }}
            />
          </>
        )}
        <div
          className="absolute rounded-full"
          style={{ width: '25%', height: '25%', background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)', top: '10%', left: '15%' }}
        />
      </div>
    </div>
  );
};

const EnergyPopup = ({ amount, x, y, isCritical }) => (
  <div
    className={`absolute pointer-events-none font-bold ${isCritical ? 'text-2xl text-red-400' : 'text-xl text-yellow-400'}`}
    style={{
      left: x,
      top: y,
      animation: 'floatUp 1s ease-out forwards',
      textShadow: '0 0 10px currentColor'
    }}
  >
    +{formatNumber(amount)}{isCritical && ' CRIT!'}
  </div>
);

const MilestoneIndicator = ({ level }) => {
  const next10 = Math.ceil((level + 1) / 10) * 10;
  const next50 = Math.ceil((level + 1) / 50) * 50;
  const progressTo10 = ((level % 10) / 10) * 100;
  const progressTo50 = ((level % 50) / 50) * 100;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500 w-16">3x @ {next10}</span>
        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-yellow-500 transition-all" style={{ width: `${progressTo10}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-500 w-16">5x @ {next50}</span>
        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 transition-all" style={{ width: `${progressTo50}%` }} />
        </div>
      </div>
    </div>
  );
};

const Shop = ({
  isOpen,
  onClose,
  energy,
  bodyUpgrades,
  currentBody,
  currentGalaxy,
  unlockedBodies,
  unlockedGalaxies,
  onBuyUpgrade,
  onUnlockBody,
  onUnlockGalaxy,
  getTapEnergy,
  getAutoEnergy
}) => {
  const [tab, setTab] = useState('upgrades');

  const currentUpgrades = bodyUpgrades[currentBody.id] || { tap_power: 0, auto_collect: 0 };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white tracking-wider">SHOP</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <div className="text-yellow-400 text-2xl font-bold">{formatNumber(energy)} Energy</div>
          <div className="text-gray-400 text-sm mt-1">
            {currentBody.name}: Tap +{formatNumber(getTapEnergy())} | Auto +{formatNumber(getAutoEnergy())}/s
          </div>
        </div>

        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setTab('upgrades')}
            className={`flex-1 py-3 font-bold tracking-wider transition-colors text-sm ${tab === 'upgrades' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}
          >
            UPGRADES
          </button>
          <button
            onClick={() => setTab('bodies')}
            className={`flex-1 py-3 font-bold tracking-wider transition-colors text-sm ${tab === 'bodies' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-gray-400'}`}
          >
            PLANETS
          </button>
          <button
            onClick={() => setTab('galaxies')}
            className={`flex-1 py-3 font-bold tracking-wider transition-colors text-sm ${tab === 'galaxies' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          >
            GALAXIES
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'upgrades' && (
            <>
              <div className="text-center text-gray-400 text-sm mb-4 p-3 bg-gray-800/50 rounded-lg">
                Upgrades are specific to each celestial body
              </div>

              {/* Tap Power Upgrade */}
              {(() => {
                const level = currentUpgrades.tap_power;
                const cost = calculateUpgradeCost('tap_power', level);
                const canAfford = energy >= cost;
                const multiplier = calculateMilestoneMultiplier(level);

                return (
                  <div className={`p-4 rounded-xl transition-all ${canAfford ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-800/50 opacity-60'}`}>
                    <button
                      onClick={() => onBuyUpgrade('tap_power')}
                      disabled={!canAfford}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">⚡</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">Tap Power</span>
                            <span className="text-gray-400 text-sm">Lv.{level}</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            +{currentBody.baseTap} base tap energy per level
                          </p>
                          {multiplier > 1 && (
                            <p className="text-purple-400 text-sm mt-1">
                              Current bonus: {formatNumber(multiplier)}x
                            </p>
                          )}
                          <div className={`mt-2 font-bold ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                            {formatNumber(cost)} Energy
                          </div>
                          <MilestoneIndicator level={level} />
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })()}

              {/* Auto Collector Upgrade */}
              {(() => {
                const level = currentUpgrades.auto_collect;
                const cost = calculateUpgradeCost('auto_collect', level);
                const canAfford = energy >= cost;
                const multiplier = calculateMilestoneMultiplier(level);

                return (
                  <div className={`p-4 rounded-xl transition-all ${canAfford ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-800/50 opacity-60'}`}>
                    <button
                      onClick={() => onBuyUpgrade('auto_collect')}
                      disabled={!canAfford}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">🔄</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">Auto Collector</span>
                            <span className="text-gray-400 text-sm">Lv.{level}</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            +{currentBody.baseEnergy} idle energy/sec per level
                          </p>
                          {multiplier > 1 && (
                            <p className="text-purple-400 text-sm mt-1">
                              Current bonus: {formatNumber(multiplier)}x
                            </p>
                          )}
                          <div className={`mt-2 font-bold ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                            {formatNumber(cost)} Energy
                          </div>
                          <MilestoneIndicator level={level} />
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })()}
            </>
          )}

          {tab === 'bodies' && currentGalaxy.bodies.map((body, index) => {
            const isUnlocked = unlockedBodies.includes(body.id);
            const canAfford = energy >= body.unlockCost;
            const isFirst = index === 0;
            const isCurrent = body.id === currentBody.id;

            return (
              <button
                key={body.id}
                onClick={() => !isUnlocked && !isFirst && onUnlockBody(body)}
                disabled={isUnlocked || !canAfford || isFirst}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  isCurrent ? 'bg-blue-900/30 border border-blue-500' :
                  isUnlocked ? 'bg-green-900/30 border border-green-700' :
                  canAfford ? 'bg-gray-800 hover:bg-gray-700' :
                  'bg-gray-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: body.color,
                      boxShadow: body.isStar
                        ? `0 0 15px ${body.color}66`
                        : `inset -4px -2px 8px rgba(0,0,0,0.4), 0 0 10px ${body.color}44`
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{body.name}</span>
                      {isCurrent && <span className="text-blue-400 text-sm">Active</span>}
                      {isUnlocked && !isCurrent && <span className="text-green-400 text-sm">Unlocked</span>}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      Base: +{body.baseTap} tap | +{body.baseEnergy}/sec idle
                    </p>
                    {!isUnlocked && !isFirst && (
                      <div className={`mt-2 font-bold ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {formatNumber(body.unlockCost)} Energy
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {tab === 'galaxies' && GALAXIES.map((galaxy, index) => {
            const isUnlocked = unlockedGalaxies.includes(galaxy.id);
            const canAfford = energy >= galaxy.unlockCost;
            const isFirst = index === 0;
            const isCurrent = galaxy.id === currentGalaxy.id;

            return (
              <button
                key={galaxy.id}
                onClick={() => !isUnlocked && !isFirst && onUnlockGalaxy(galaxy)}
                disabled={isUnlocked || !canAfford || isFirst}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  isCurrent ? 'bg-purple-900/30 border border-purple-500' :
                  isUnlocked ? 'bg-green-900/30 border border-green-700' :
                  canAfford ? 'bg-gray-800 hover:bg-gray-700' :
                  'bg-gray-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <span className="text-2xl">🌌</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold">{galaxy.name}</span>
                      {isCurrent && <span className="text-purple-400 text-sm">Current</span>}
                      {isUnlocked && !isCurrent && <span className="text-green-400 text-sm">Unlocked</span>}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {galaxy.bodies.length} celestial bodies
                    </p>
                    {!isUnlocked && !isFirst && (
                      <div className={`mt-2 font-bold ${canAfford ? 'text-purple-400' : 'text-gray-500'}`}>
                        {formatNumber(galaxy.unlockCost)} Energy
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const Leaderboard = ({ isOpen, onClose, currentBody, currentGalaxy, deviceId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBody, setSelectedBody] = useState(currentBody.id);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      GameAPI.getLeaderboard(currentGalaxy.id, selectedBody).then(data => {
        setLeaderboard(data);
        setLoading(false);
      });
    }
  }, [isOpen, selectedBody, currentGalaxy.id]);

  if (!isOpen) return null;

  const week = getWeekNumber();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wider">LEADERBOARD</h2>
            <p className="text-gray-400 text-sm">Week {week} | {currentGalaxy.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <select
            value={selectedBody}
            onChange={(e) => setSelectedBody(e.target.value)}
            className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
          >
            {currentGalaxy.bodies.map(body => (
              <option key={body.id} value={body.id}>{body.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No scores yet this week. Be the first!
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const isYou = entry.deviceId?.startsWith(deviceId.slice(0, 8));
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      isYou ? 'bg-yellow-900/30 border border-yellow-600' : 'bg-gray-800'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {entry.playerId || 'Unknown'}
                        {isYou && <span className="text-yellow-400 ml-2">(You)</span>}
                      </div>
                    </div>
                    <div className="text-yellow-400 font-bold">
                      {formatNumber(entry.totalEnergy || entry.energy || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-700 text-center text-gray-500 text-sm">
          Leaderboard resets every Monday
        </div>
      </div>
    </div>
  );
};

const Stats = ({ isOpen, onClose, totalEnergy, bodyUpgrades, unlockedBodies, unlockedGalaxies, deviceId, bodyEnergy }) => {
  if (!isOpen) return null;

  const allBodies = GALAXIES.flatMap(g => g.bodies);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white tracking-wider">STATS</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400">Total Energy (All Time)</span>
            <span className="text-yellow-400 font-bold">{formatNumber(totalEnergy)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400">Galaxies Unlocked</span>
            <span className="text-purple-400 font-bold">{unlockedGalaxies.length} / {GALAXIES.length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400">Bodies Unlocked</span>
            <span className="text-white font-bold">{unlockedBodies.length} / {allBodies.length}</span>
          </div>

          {GALAXIES.filter(g => unlockedGalaxies.includes(g.id)).map(galaxy => (
            <div key={galaxy.id} className="pt-4">
              <h3 className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-3">{galaxy.name}</h3>
              {galaxy.bodies.filter(b => unlockedBodies.includes(b.id)).map(body => {
                const upgrades = bodyUpgrades[body.id] || { tap_power: 0, auto_collect: 0 };
                return (
                  <div key={body.id} className="mb-2 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: body.color }} />
                      <span className="text-white font-medium">{body.name}</span>
                      <span className="text-gray-500 text-xs ml-auto">{formatNumber(bodyEnergy[body.id] || 0)} energy</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-400">⚡ Tap: Lv.{upgrades.tap_power}</div>
                      <div className="text-gray-400">🔄 Auto: Lv.{upgrades.auto_collect}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          <div className="flex justify-between items-center py-2 pt-4">
            <span className="text-gray-400">Device ID</span>
            <span className="text-gray-500 text-xs font-mono">{deviceId.slice(0, 16)}...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// MAIN GAME COMPONENT
// ===========================================
export default function SpaceClickerGame() {
  const [deviceId, setDeviceId] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Global energy pool
  const [energy, setEnergy] = useState(0);
  const [totalEnergy, setTotalEnergy] = useState(0);

  // Per-body data
  const [bodyEnergy, setBodyEnergy] = useState({});
  const [bodyUpgrades, setBodyUpgrades] = useState({});

  // Current state
  const [currentGalaxyIndex, setCurrentGalaxyIndex] = useState(0);
  const [currentBodyIndex, setCurrentBodyIndex] = useState(0);
  const [unlockedBodies, setUnlockedBodies] = useState(['sun']);
  const [unlockedGalaxies, setUnlockedGalaxies] = useState(['solar_system']);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [popups, setPopups] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved');

  const hasChangesRef = useRef(false);

  const currentGalaxy = GALAXIES[currentGalaxyIndex];
  const currentBody = currentGalaxy.bodies[currentBodyIndex];
  const currentUpgrades = bodyUpgrades[currentBody?.id] || { tap_power: 0, auto_collect: 0 };

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
    setDeviceId(getDeviceId());
  }, []);

  // ===========================================
  // GAME CALCULATIONS
  // ===========================================
  const getTapEnergy = useCallback(() => {
    if (!currentBody) return 0;
    const base = currentBody.baseTap;
    const level = currentUpgrades.tap_power;
    const levelBonus = level * base;
    const milestoneMultiplier = calculateMilestoneMultiplier(level);
    return Math.floor((base + levelBonus) * milestoneMultiplier);
  }, [currentBody, currentUpgrades]);

  const getAutoEnergy = useCallback(() => {
    if (!currentBody) return 0;
    const base = currentBody.baseEnergy;
    const level = currentUpgrades.auto_collect;
    const levelBonus = level * base;
    const milestoneMultiplier = calculateMilestoneMultiplier(level);
    return Math.floor(levelBonus * milestoneMultiplier);
  }, [currentBody, currentUpgrades]);

  // ===========================================
  // SAVE/LOAD
  // ===========================================
  const getGameState = useCallback(() => ({
    energy,
    totalEnergy,
    bodyEnergy,
    bodyUpgrades,
    currentGalaxyIndex,
    currentBodyIndex,
    unlockedBodies,
    unlockedGalaxies
  }), [energy, totalEnergy, bodyEnergy, bodyUpgrades, currentGalaxyIndex, currentBodyIndex, unlockedBodies, unlockedGalaxies]);

  const saveGame = useCallback(async (force = false) => {
    if (!deviceId || (!hasChangesRef.current && !force)) return;

    setSaveStatus('saving');
    const result = await GameAPI.saveGame(deviceId, getGameState());

    if (currentBody) {
      await GameAPI.submitScore(deviceId, currentGalaxy.id, currentBody.id, bodyEnergy[currentBody.id] || 0);
    }

    setSaveStatus(result.fallback ? 'offline' : 'saved');
    hasChangesRef.current = false;
  }, [deviceId, getGameState, currentGalaxy?.id, currentBody, bodyEnergy]);

  // Load game on mount
  useEffect(() => {
    if (!deviceId) return;

    const loadGame = async () => {
      setIsLoading(true);
      const savedData = await GameAPI.loadGame(deviceId);

      if (savedData) {
        setEnergy(savedData.energy || 0);
        setTotalEnergy(savedData.totalEnergy || 0);
        setBodyEnergy(savedData.bodyEnergy || savedData.planetEnergy || {});
        setBodyUpgrades(savedData.bodyUpgrades || savedData.planetUpgrades || {});
        setCurrentGalaxyIndex(savedData.currentGalaxyIndex || 0);
        setCurrentBodyIndex(savedData.currentBodyIndex || savedData.currentPlanetIndex || 0);
        setUnlockedBodies(savedData.unlockedBodies || savedData.unlockedPlanets || ['sun']);
        setUnlockedGalaxies(savedData.unlockedGalaxies || ['solar_system']);
      }

      setIsLoading(false);
    };

    loadGame();
  }, [deviceId]);

  // Auto-save interval
  useEffect(() => {
    if (!deviceId) return;

    const interval = setInterval(() => saveGame(), SAVE_INTERVAL);
    const handleUnload = () => saveGame(true);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [saveGame, deviceId]);

  // Auto collector
  useEffect(() => {
    if (!currentBody) return;

    const autoEnergy = getAutoEnergy();
    if (autoEnergy > 0) {
      const interval = setInterval(() => {
        setEnergy(prev => prev + autoEnergy);
        setTotalEnergy(prev => prev + autoEnergy);
        setBodyEnergy(prev => ({
          ...prev,
          [currentBody.id]: (prev[currentBody.id] || 0) + autoEnergy
        }));
        hasChangesRef.current = true;
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [getAutoEnergy, currentBody]);

  // ===========================================
  // GAME ACTIONS
  // ===========================================
  const handleTap = (e) => {
    if (!currentBody) return;

    const tapEnergy = getTapEnergy();

    setEnergy(prev => prev + tapEnergy);
    setTotalEnergy(prev => prev + tapEnergy);
    setBodyEnergy(prev => ({
      ...prev,
      [currentBody.id]: (prev[currentBody.id] || 0) + tapEnergy
    }));
    hasChangesRef.current = true;

    const popup = {
      id: Date.now() + Math.random(),
      amount: tapEnergy,
      isCritical: false,
      x: `${Math.random() * 60 + 20}%`,
      y: `${Math.random() * 20 + 35}%`
    };
    setPopups(prev => [...prev, popup]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== popup.id)), 1000);
  };

  const changeBody = (direction) => {
    const unlockedIndexes = currentGalaxy.bodies
      .map((b, i) => unlockedBodies.includes(b.id) ? i : -1)
      .filter(i => i !== -1);

    if (unlockedIndexes.length === 0) return;

    const currentPos = unlockedIndexes.indexOf(currentBodyIndex);
    let newPos;

    if (direction === 'next') {
      newPos = (currentPos + 1) % unlockedIndexes.length;
    } else {
      newPos = currentPos === 0 ? unlockedIndexes.length - 1 : currentPos - 1;
    }

    setCurrentBodyIndex(unlockedIndexes[newPos]);
    hasChangesRef.current = true;
  };

  const changeGalaxy = (direction) => {
    const unlockedIndexes = GALAXIES
      .map((g, i) => unlockedGalaxies.includes(g.id) ? i : -1)
      .filter(i => i !== -1);

    if (unlockedIndexes.length <= 1) return;

    const currentPos = unlockedIndexes.indexOf(currentGalaxyIndex);
    let newPos;

    if (direction === 'next') {
      newPos = (currentPos + 1) % unlockedIndexes.length;
    } else {
      newPos = currentPos === 0 ? unlockedIndexes.length - 1 : currentPos - 1;
    }

    setCurrentGalaxyIndex(unlockedIndexes[newPos]);
    setCurrentBodyIndex(0);
    hasChangesRef.current = true;
  };

  const buyUpgrade = (upgradeType) => {
    if (!currentBody) return;

    const level = currentUpgrades[upgradeType] || 0;
    const cost = calculateUpgradeCost(upgradeType, level);

    if (energy >= cost) {
      setEnergy(prev => prev - cost);
      setBodyUpgrades(prev => ({
        ...prev,
        [currentBody.id]: {
          ...currentUpgrades,
          [upgradeType]: level + 1
        }
      }));
      hasChangesRef.current = true;
    }
  };

  const unlockBody = (body) => {
    if (energy >= body.unlockCost && !unlockedBodies.includes(body.id)) {
      setEnergy(prev => prev - body.unlockCost);
      setUnlockedBodies(prev => [...prev, body.id]);
      setBodyUpgrades(prev => ({
        ...prev,
        [body.id]: { tap_power: 0, auto_collect: 0 }
      }));
      hasChangesRef.current = true;
    }
  };

  const unlockGalaxy = (galaxy) => {
    if (energy >= galaxy.unlockCost && !unlockedGalaxies.includes(galaxy.id)) {
      setEnergy(prev => prev - galaxy.unlockCost);
      setUnlockedGalaxies(prev => [...prev, galaxy.id]);
      // Unlock first body of the new galaxy
      const firstBody = galaxy.bodies[0];
      if (firstBody && !unlockedBodies.includes(firstBody.id)) {
        setUnlockedBodies(prev => [...prev, firstBody.id]);
        setBodyUpgrades(prev => ({
          ...prev,
          [firstBody.id]: { tap_power: 0, auto_collect: 0 }
        }));
      }
      hasChangesRef.current = true;
    }
  };

  // ===========================================
  // RENDER
  // ===========================================
  if (!isClient || isLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black flex flex-col overflow-hidden select-none">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.2); }
        }
      `}</style>

      <StarField />

      {/* Save status */}
      <div className="absolute top-4 right-4 z-20">
        <div className={`w-2 h-2 rounded-full ${
          saveStatus === 'saved' ? 'bg-green-500' :
          saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
          'bg-orange-500'
        }`} title={saveStatus} />
      </div>

      {/* Galaxy indicator */}
      {unlockedGalaxies.length > 1 && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={() => changeGalaxy('prev')}
            className="text-purple-400 hover:text-purple-300 text-xl"
          >
            ◀
          </button>
          <span className="text-purple-400 text-sm font-medium">{currentGalaxy.name}</span>
          <button
            onClick={() => changeGalaxy('next')}
            className="text-purple-400 hover:text-purple-300 text-xl"
          >
            ▶
          </button>
        </div>
      )}

      {/* Energy display */}
      <div className="relative z-10 mt-16 text-center">
        <div className="text-5xl font-bold text-white tracking-wider">
          {formatNumber(energy)}
        </div>
        <div className="text-yellow-400 text-xl font-bold tracking-widest mt-1">ENERGY</div>
        <div className="text-gray-400 text-sm mt-2">
          Tap +{formatNumber(getTapEnergy())} | Auto +{formatNumber(getAutoEnergy())}/sec
        </div>
      </div>

      {/* Body area */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        {popups.map(popup => (
          <EnergyPopup key={popup.id} {...popup} />
        ))}

        {currentBody && (
          <CelestialBody body={currentBody} onClick={handleTap} />
        )}
      </div>

      {/* Body selector */}
      <div className="relative z-10 flex items-center justify-center gap-6 mb-2">
        <button
          onClick={() => changeBody('prev')}
          className="text-white text-4xl px-4 py-2 hover:text-yellow-400 transition-colors active:scale-90"
        >
          ‹
        </button>
        <div className="text-center min-w-48">
          <span className="text-white text-2xl font-bold tracking-widest uppercase block">
            {currentBody?.name || 'Unknown'}
          </span>
          <span className="text-gray-500 text-xs">
            Energy: {formatNumber(bodyEnergy[currentBody?.id] || 0)}
          </span>
        </div>
        <button
          onClick={() => changeBody('next')}
          className="text-white text-4xl px-4 py-2 hover:text-yellow-400 transition-colors active:scale-90"
        >
          ›
        </button>
      </div>

      {/* Warning */}
      {unlockedBodies.length > 1 && (
        <div className="relative z-10 text-center text-orange-400 text-xs mb-4">
          Only active body earns energy
        </div>
      )}

      {/* Bottom controls */}
      <div className="relative z-10 flex items-center justify-between w-full px-6 pb-8">
        <button
          onClick={() => setShowStats(true)}
          className="p-4 bg-gray-800/80 rounded-xl text-white hover:bg-gray-700 transition-all active:scale-95"
        >
          📊
        </button>

        <button
          onClick={() => setShowLeaderboard(true)}
          className="p-4 bg-gray-800/80 rounded-xl text-white hover:bg-gray-700 transition-all active:scale-95"
        >
          🏆
        </button>

        <button
          onClick={() => setShowShop(true)}
          className="px-8 py-4 bg-gray-800/80 text-white font-bold text-lg tracking-widest hover:bg-gray-700 transition-all rounded-xl active:scale-95"
        >
          SHOP
        </button>
      </div>

      {/* Modals */}
      <Shop
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        energy={energy}
        bodyUpgrades={bodyUpgrades}
        currentBody={currentBody}
        currentGalaxy={currentGalaxy}
        unlockedBodies={unlockedBodies}
        unlockedGalaxies={unlockedGalaxies}
        onBuyUpgrade={buyUpgrade}
        onUnlockBody={unlockBody}
        onUnlockGalaxy={unlockGalaxy}
        getTapEnergy={getTapEnergy}
        getAutoEnergy={getAutoEnergy}
      />

      <Stats
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        totalEnergy={totalEnergy}
        bodyUpgrades={bodyUpgrades}
        unlockedBodies={unlockedBodies}
        unlockedGalaxies={unlockedGalaxies}
        deviceId={deviceId}
        bodyEnergy={bodyEnergy}
      />

      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentBody={currentBody}
        currentGalaxy={currentGalaxy}
        deviceId={deviceId}
      />
    </div>
  );
}
