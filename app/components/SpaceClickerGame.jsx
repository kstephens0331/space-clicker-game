'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ===========================================
// CONFIGURATION
// ===========================================
const API_BASE_URL = '/api/game';
const SAVE_INTERVAL = 60000; // Save every 1 minute
const BASE_OFFLINE_HOURS = 12; // Starting max offline time
const LOCAL_SAVE_KEY_BACKUP = 'space_clicker_backup';
const LOCAL_DEVICE_KEY = 'space_clicker_device_id';
const LOCAL_SAVE_KEY = 'space_clicker_local_save';

// ===========================================
// GAME BALANCE CONSTANTS
// ===========================================
const UPGRADE_BASE_COSTS = {
  tap_power: 100,
  auto_collect: 250,
  critical_chance: 500,      // % chance for 5x tap
  energy_multiplier: 1000,   // Multiplies all energy
  offline_earnings: 2000,    // Earn while away
  offline_time: 3000,        // +1 hour max offline time
  auto_tap: 5000,            // Automatic tapping
};

const UPGRADE_DESCRIPTIONS = {
  tap_power: { name: 'Tap Power', icon: '⚡', desc: 'Increase energy per tap' },
  auto_collect: { name: 'Auto Collector', icon: '🔄', desc: 'Passive energy per second' },
  critical_chance: { name: 'Critical Strike', icon: '💥', desc: '+2% chance for 5x energy' },
  energy_multiplier: { name: 'Energy Amplifier', icon: '✨', desc: '+5% bonus to all energy' },
  offline_earnings: { name: 'Quantum Harvester', icon: '🌙', desc: '+10% offline earnings' },
  offline_time: { name: 'Time Dilation', icon: '⏰', desc: '+1 hour max offline time' },
  auto_tap: { name: 'Auto Tapper', icon: '🤖', desc: '+1 automatic tap per second' },
};

const UPGRADE_COST_MULTIPLIER = 1.15;
const MILESTONE_10_BONUS = 3;
const MILESTONE_50_BONUS = 5;

// Which upgrades are available per body type
const getAvailableUpgrades = (body, galaxy) => {
  const baseUpgrades = ['tap_power', 'auto_collect'];

  // Stars get critical chance
  if (body.isStar) {
    baseUpgrades.push('critical_chance');
  }

  // Outer planets get energy multiplier
  if (['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(body.id)) {
    baseUpgrades.push('energy_multiplier');
  }

  // Pluto and beyond get offline earnings + time extension
  if (body.unlockCost >= 10000000000) { // 10B+
    baseUpgrades.push('offline_earnings');
    baseUpgrades.push('offline_time');
  }

  // Other galaxies get auto-tap
  if (galaxy.id !== 'solar_system') {
    baseUpgrades.push('auto_tap');
  }

  return baseUpgrades;
};

// ===========================================
// GAME THEMES - 10 VARIANTS
// ===========================================
const THEMES = {
  space: {
    id: 'space',
    name: 'Space Explorer',
    icon: '🚀',
    bgGradient: 'from-gray-900 via-purple-900 to-black',
    worldLabel: 'Galaxy',
    itemLabel: 'Planet',
    energyName: 'Energy',
    worlds: [
      {
        id: 'solar_system', name: 'Solar System', unlockCost: 0,
        bodies: [
          { id: 'sun', name: 'The Sun', color: '#FFD93D', landColor: '#FF8C00', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 220, emoji: '☀️' },
          { id: 'mercury', name: 'Mercury', color: '#A0522D', landColor: '#8B4513', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 80, emoji: '🪨' },
          { id: 'venus', name: 'Venus', color: '#DEB887', landColor: '#D2691E', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 110, emoji: '🌕' },
          { id: 'earth', name: 'Earth', color: '#4a90d9', landColor: '#5cb85c', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 120, emoji: '🌍' },
          { id: 'mars', name: 'Mars', color: '#d9654a', landColor: '#c9553a', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 100, emoji: '🔴' },
          { id: 'jupiter', name: 'Jupiter', color: '#d9a054', landColor: '#c99044', unlockCost: 25000000, baseEnergy: 35, baseTap: 35, size: 180, emoji: '🟠' },
          { id: 'saturn', name: 'Saturn', color: '#e8d068', landColor: '#d8c058', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, hasRings: true, size: 170, emoji: '🪐' },
          { id: 'uranus', name: 'Uranus', color: '#87CEEB', landColor: '#5F9EA0', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, hasRings: true, ringTilt: 90, size: 140, emoji: '🔵' },
          { id: 'neptune', name: 'Neptune', color: '#5a7bd9', landColor: '#4a6bc9', unlockCost: 2500000000, baseEnergy: 400, baseTap: 400, size: 135, emoji: '🌀' },
          { id: 'pluto', name: 'Pluto', color: '#a8a8b8', landColor: '#989898', unlockCost: 10000000000, baseEnergy: 900, baseTap: 900, size: 70, emoji: '⚫' },
        ]
      },
      {
        id: 'andromeda', name: 'Andromeda Galaxy', unlockCost: 100000000000,
        bodies: [
          { id: 'andromeda_core', name: 'Galactic Core', color: '#9370DB', landColor: '#8A2BE2', unlockCost: 0, baseEnergy: 2000, baseTap: 2000, isStar: true, size: 220, emoji: '💜' },
          { id: 'alpheratz', name: 'Alpheratz Prime', color: '#E6E6FA', landColor: '#D8BFD8', unlockCost: 150000000000, baseEnergy: 3500, baseTap: 3500, size: 140, emoji: '🌟' },
          { id: 'mirach', name: 'Mirach World', color: '#FF6B6B', landColor: '#EE5A5A', unlockCost: 500000000000, baseEnergy: 6000, baseTap: 6000, size: 160, emoji: '❤️' },
        ]
      }
    ]
  },
  animals: {
    id: 'animals',
    name: 'Animal Kingdom',
    icon: '🦁',
    bgGradient: 'from-green-900 via-emerald-800 to-green-950',
    worldLabel: 'Habitat',
    itemLabel: 'Animal',
    energyName: 'Treats',
    worlds: [
      {
        // Farm: Smallest to Biggest - Chicken → Sheep → Pig → Cow → Horse
        id: 'farm', name: 'The Farm', unlockCost: 0,
        bodies: [
          { id: 'chicken', name: 'Chicken', color: '#FFA500', landColor: '#FF8C00', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 80, emoji: '🐔' },
          { id: 'sheep', name: 'Sheep', color: '#F5F5DC', landColor: '#E8E8D0', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 110, emoji: '🐑' },
          { id: 'pig', name: 'Pig', color: '#FFB6C1', landColor: '#FF69B4', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 130, emoji: '🐷' },
          { id: 'cow', name: 'Cow', color: '#8B4513', landColor: '#654321', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 160, emoji: '🐄' },
          { id: 'horse', name: 'Horse', color: '#8B4513', landColor: '#5D3A1A', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 190, emoji: '🐴' },
        ]
      },
      {
        // Safari: Smallest to Biggest - Lion → Zebra → Giraffe → Elephant
        id: 'safari', name: 'Safari', unlockCost: 25000000,
        bodies: [
          { id: 'lion', name: 'Lion', color: '#DAA520', landColor: '#B8860B', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 140, emoji: '🦁' },
          { id: 'zebra', name: 'Zebra', color: '#FFFFFF', landColor: '#000000', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 155, emoji: '🦓' },
          { id: 'giraffe', name: 'Giraffe', color: '#DAA520', landColor: '#8B4513', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 200, emoji: '🦒' },
          { id: 'elephant', name: 'Elephant', color: '#808080', landColor: '#696969', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 220, emoji: '🐘' },
        ]
      },
      {
        // Jungle: Smallest to Biggest - Panda → Tiger → Gorilla
        id: 'jungle', name: 'Jungle', unlockCost: 2500000000,
        bodies: [
          { id: 'panda', name: 'Panda', color: '#FFFFFF', landColor: '#000000', unlockCost: 0, baseEnergy: 400, baseTap: 400, isStar: true, size: 150, emoji: '🐼' },
          { id: 'tiger', name: 'Tiger', color: '#FF8C00', landColor: '#000000', unlockCost: 5000000000, baseEnergy: 600, baseTap: 600, size: 175, emoji: '🐅' },
          { id: 'gorilla', name: 'Gorilla', color: '#2F2F2F', landColor: '#1A1A1A', unlockCost: 10000000000, baseEnergy: 900, baseTap: 900, size: 200, emoji: '🦍' },
        ]
      }
    ]
  },
  cars: {
    id: 'cars',
    name: 'Auto Collection',
    icon: '🏎️',
    bgGradient: 'from-slate-900 via-zinc-800 to-neutral-900',
    worldLabel: 'Garage',
    itemLabel: 'Vehicle',
    energyName: 'Speed',
    worlds: [
      {
        // Economy: Cheapest to Most Expensive - ~$0 → $50k
        id: 'economy', name: 'Economy Class', unlockCost: 0,
        bodies: [
          { id: 'bicycle', name: 'Bicycle', color: '#4CAF50', landColor: '#388E3C', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 70, emoji: '🚲' },
          { id: 'scooter', name: 'Scooter', color: '#9C27B0', landColor: '#7B1FA2', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 90, emoji: '🛵' },
          { id: 'sedan', name: 'Sedan', color: '#2196F3', landColor: '#1976D2', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 130, emoji: '🚗' },
          { id: 'suv', name: 'SUV', color: '#607D8B', landColor: '#455A64', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 150, emoji: '🚙' },
          { id: 'pickup', name: 'Pickup Truck', color: '#795548', landColor: '#5D4037', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 165, emoji: '🛻' },
        ]
      },
      {
        // Luxury: $80k → $350k - BMW → Mercedes → Porsche → Ferrari
        id: 'luxury', name: 'Luxury Class', unlockCost: 25000000,
        bodies: [
          { id: 'bmw', name: 'BMW M5', color: '#1E3A8A', landColor: '#1E40AF', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 140, emoji: '🚘' },
          { id: 'mercedes', name: 'Mercedes AMG', color: '#1F2937', landColor: '#111827', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 150, emoji: '🏎️' },
          { id: 'porsche', name: 'Porsche 911', color: '#DC2626', landColor: '#B91C1C', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 160, emoji: '🏎️' },
          { id: 'ferrari', name: 'Ferrari 488', color: '#EF4444', landColor: '#DC2626', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 170, emoji: '🏎️' },
        ]
      },
      {
        // Exotic: $400k → $3M+ - Lamborghini → Bugatti → Koenigsegg
        id: 'exotic', name: 'Exotic Class', unlockCost: 2500000000,
        bodies: [
          { id: 'lambo', name: 'Lamborghini Aventador', color: '#F59E0B', landColor: '#D97706', unlockCost: 0, baseEnergy: 400, baseTap: 400, isStar: true, size: 155, emoji: '🏎️' },
          { id: 'bugatti', name: 'Bugatti Chiron', color: '#3B82F6', landColor: '#2563EB', unlockCost: 5000000000, baseEnergy: 600, baseTap: 600, size: 165, emoji: '🏎️' },
          { id: 'koenigsegg', name: 'Koenigsegg Jesko', color: '#F97316', landColor: '#EA580C', unlockCost: 10000000000, baseEnergy: 900, baseTap: 900, size: 175, emoji: '🚀' },
        ]
      }
    ]
  },
  food: {
    id: 'food',
    name: 'Food Paradise',
    icon: '🍔',
    bgGradient: 'from-orange-900 via-red-800 to-amber-900',
    worldLabel: 'Kitchen',
    itemLabel: 'Dish',
    energyName: 'Yum',
    worlds: [
      {
        id: 'snacks', name: 'Snack Bar', unlockCost: 0,
        bodies: [
          { id: 'cookie', name: 'Cookie', color: '#D2691E', landColor: '#8B4513', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 100, emoji: '🍪' },
          { id: 'donut', name: 'Donut', color: '#FF69B4', landColor: '#FF1493', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 110, emoji: '🍩' },
          { id: 'icecream', name: 'Ice Cream', color: '#FFC0CB', landColor: '#FFB6C1', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 130, emoji: '🍦' },
          { id: 'cake', name: 'Cake', color: '#FFE4E1', landColor: '#FFC0CB', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 150, emoji: '🎂' },
          { id: 'pizza', name: 'Pizza', color: '#FFA500', landColor: '#FF8C00', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 160, emoji: '🍕' },
        ]
      },
      {
        id: 'gourmet', name: 'Gourmet Kitchen', unlockCost: 25000000,
        bodies: [
          { id: 'burger', name: 'Gourmet Burger', color: '#8B4513', landColor: '#654321', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 160, emoji: '🍔' },
          { id: 'steak', name: 'Steak', color: '#8B0000', landColor: '#660000', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 150, emoji: '🥩' },
          { id: 'sushi', name: 'Sushi Platter', color: '#FF6347', landColor: '#FF4500', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 170, emoji: '🍣' },
          { id: 'lobster', name: 'Lobster', color: '#FF4500', landColor: '#DC143C', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 165, emoji: '🦞' },
        ]
      }
    ]
  },
  sports: {
    id: 'sports',
    name: 'Sports Arena',
    icon: '⚽',
    bgGradient: 'from-blue-900 via-indigo-800 to-blue-950',
    worldLabel: 'League',
    itemLabel: 'Sport',
    energyName: 'Points',
    worlds: [
      {
        id: 'casual', name: 'Casual Sports', unlockCost: 0,
        bodies: [
          { id: 'bowling', name: 'Bowling', color: '#FF4500', landColor: '#DC143C', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 120, emoji: '🎳' },
          { id: 'golf', name: 'Golf', color: '#228B22', landColor: '#006400', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 100, emoji: '⛳' },
          { id: 'tennis', name: 'Tennis', color: '#ADFF2F', landColor: '#7CFC00', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 110, emoji: '🎾' },
          { id: 'baseball', name: 'Baseball', color: '#FFFFFF', landColor: '#DC143C', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 110, emoji: '⚾' },
          { id: 'basketball', name: 'Basketball', color: '#FF8C00', landColor: '#FF4500', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 130, emoji: '🏀' },
        ]
      },
      {
        id: 'pro', name: 'Pro League', unlockCost: 25000000,
        bodies: [
          { id: 'soccer', name: 'Soccer', color: '#FFFFFF', landColor: '#000000', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 130, emoji: '⚽' },
          { id: 'football', name: 'Football', color: '#8B4513', landColor: '#654321', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 140, emoji: '🏈' },
          { id: 'hockey', name: 'Hockey', color: '#000000', landColor: '#1A1A1A', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 120, emoji: '🏒' },
          { id: 'rugby', name: 'Rugby', color: '#8B0000', landColor: '#660000', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 135, emoji: '🏉' },
        ]
      }
    ]
  },
  music: {
    id: 'music',
    name: 'Music Studio',
    icon: '🎵',
    bgGradient: 'from-purple-900 via-fuchsia-800 to-pink-900',
    worldLabel: 'Genre',
    itemLabel: 'Instrument',
    energyName: 'Notes',
    worlds: [
      {
        id: 'acoustic', name: 'Acoustic', unlockCost: 0,
        bodies: [
          { id: 'triangle', name: 'Triangle', color: '#C0C0C0', landColor: '#A9A9A9', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 80, emoji: '🔺' },
          { id: 'tambourine', name: 'Tambourine', color: '#DAA520', landColor: '#B8860B', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 100, emoji: '🪘' },
          { id: 'guitar', name: 'Guitar', color: '#8B4513', landColor: '#654321', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 150, emoji: '🎸' },
          { id: 'violin', name: 'Violin', color: '#8B4513', landColor: '#5D3A1A', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 130, emoji: '🎻' },
          { id: 'piano', name: 'Piano', color: '#1A1A1A', landColor: '#FFFFFF', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 180, emoji: '🎹' },
        ]
      },
      {
        id: 'electric', name: 'Electric', unlockCost: 25000000,
        bodies: [
          { id: 'synth', name: 'Synthesizer', color: '#00FFFF', landColor: '#00CED1', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 160, emoji: '🎛️' },
          { id: 'drums', name: 'Drum Kit', color: '#DC143C', landColor: '#B22222', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 180, emoji: '🥁' },
          { id: 'bass', name: 'Bass Guitar', color: '#4169E1', landColor: '#0000CD', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 160, emoji: '🎸' },
          { id: 'turntable', name: 'DJ Turntable', color: '#1A1A1A', landColor: '#333333', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 170, emoji: '💿' },
        ]
      }
    ]
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Depths',
    icon: '🐋',
    bgGradient: 'from-blue-950 via-cyan-900 to-teal-900',
    worldLabel: 'Zone',
    itemLabel: 'Creature',
    energyName: 'Bubbles',
    worlds: [
      {
        // Shallow: Smallest to Biggest - Starfish → Fish → Crab → Turtle → Dolphin
        id: 'shallow', name: 'Shallow Waters', unlockCost: 0,
        bodies: [
          { id: 'starfish', name: 'Starfish', color: '#FF6347', landColor: '#FF4500', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 70, emoji: '⭐' },
          { id: 'fish', name: 'Tropical Fish', color: '#FFD700', landColor: '#FFA500', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 85, emoji: '🐠' },
          { id: 'crab', name: 'Crab', color: '#FF4500', landColor: '#DC143C', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 100, emoji: '🦀' },
          { id: 'turtle', name: 'Sea Turtle', color: '#228B22', landColor: '#006400', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 140, emoji: '🐢' },
          { id: 'dolphin', name: 'Dolphin', color: '#708090', landColor: '#4682B4', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 170, emoji: '🐬' },
        ]
      },
      {
        // Deep: Smallest to Biggest - Octopus → Shark → Giant Squid → Blue Whale
        id: 'deep', name: 'Deep Sea', unlockCost: 25000000,
        bodies: [
          { id: 'octopus', name: 'Octopus', color: '#9370DB', landColor: '#8A2BE2', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 130, emoji: '🐙' },
          { id: 'shark', name: 'Great White Shark', color: '#708090', landColor: '#2F4F4F', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 170, emoji: '🦈' },
          { id: 'squid', name: 'Giant Squid', color: '#FF69B4', landColor: '#FF1493', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 190, emoji: '🦑' },
          { id: 'whale', name: 'Blue Whale', color: '#4169E1', landColor: '#0000CD', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 220, emoji: '🐋' },
        ]
      }
    ]
  },
  fantasy: {
    id: 'fantasy',
    name: 'Mythical Realm',
    icon: '🐉',
    bgGradient: 'from-indigo-950 via-violet-900 to-purple-950',
    worldLabel: 'Realm',
    itemLabel: 'Creature',
    energyName: 'Magic',
    worlds: [
      {
        // Enchanted Forest: Smallest to Biggest - Fairy → Gnome → Elf → Unicorn → Centaur
        id: 'forest', name: 'Enchanted Forest', unlockCost: 0,
        bodies: [
          { id: 'fairy', name: 'Fairy', color: '#FF69B4', landColor: '#FF1493', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 60, emoji: '🧚' },
          { id: 'gnome', name: 'Gnome', color: '#8B4513', landColor: '#654321', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 85, emoji: '🧙' },
          { id: 'elf', name: 'Elf', color: '#228B22', landColor: '#006400', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 120, emoji: '🧝' },
          { id: 'unicorn', name: 'Unicorn', color: '#FFFFFF', landColor: '#FF69B4', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 155, emoji: '🦄' },
          { id: 'centaur', name: 'Centaur', color: '#8B4513', landColor: '#5D3A1A', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 180, emoji: '🏇' },
        ]
      },
      {
        // Dragon Mountains: Smallest to Biggest - Phoenix → Griffin → Dragon → Hydra
        id: 'mountain', name: 'Dragon Mountains', unlockCost: 25000000,
        bodies: [
          { id: 'phoenix', name: 'Phoenix', color: '#FF4500', landColor: '#DC143C', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 140, emoji: '🔥' },
          { id: 'griffin', name: 'Griffin', color: '#DAA520', landColor: '#B8860B', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 165, emoji: '🦅' },
          { id: 'dragon', name: 'Dragon', color: '#228B22', landColor: '#006400', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 195, emoji: '🐉' },
          { id: 'hydra', name: 'Hydra', color: '#9370DB', landColor: '#8A2BE2', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 220, emoji: '🐲' },
        ]
      }
    ]
  },
  tech: {
    id: 'tech',
    name: 'Tech World',
    icon: '💻',
    bgGradient: 'from-gray-900 via-slate-800 to-zinc-900',
    worldLabel: 'Era',
    itemLabel: 'Device',
    energyName: 'Data',
    worlds: [
      {
        id: 'retro', name: 'Retro Tech', unlockCost: 0,
        bodies: [
          { id: 'calculator', name: 'Calculator', color: '#808080', landColor: '#696969', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 90, emoji: '🧮' },
          { id: 'walkman', name: 'Walkman', color: '#FFD700', landColor: '#FFA500', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 100, emoji: '📻' },
          { id: 'gameboy', name: 'Game Boy', color: '#C0C0C0', landColor: '#A9A9A9', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 110, emoji: '🎮' },
          { id: 'desktop', name: 'Desktop PC', color: '#F5F5DC', landColor: '#E8E8D0', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 150, emoji: '🖥️' },
          { id: 'flip', name: 'Flip Phone', color: '#4169E1', landColor: '#0000CD', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 100, emoji: '📱' },
        ]
      },
      {
        id: 'modern', name: 'Modern Tech', unlockCost: 25000000,
        bodies: [
          { id: 'smartphone', name: 'Smartphone', color: '#1A1A1A', landColor: '#333333', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 120, emoji: '📱' },
          { id: 'laptop', name: 'Laptop', color: '#C0C0C0', landColor: '#A9A9A9', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 150, emoji: '💻' },
          { id: 'vr', name: 'VR Headset', color: '#1A1A1A', landColor: '#4169E1', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 140, emoji: '🥽' },
          { id: 'robot', name: 'Robot', color: '#C0C0C0', landColor: '#708090', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 170, emoji: '🤖' },
        ]
      }
    ]
  },
  nature: {
    id: 'nature',
    name: 'Garden Paradise',
    icon: '🌸',
    bgGradient: 'from-green-950 via-lime-900 to-emerald-950',
    worldLabel: 'Garden',
    itemLabel: 'Plant',
    energyName: 'Seeds',
    worlds: [
      {
        id: 'flowers', name: 'Flower Garden', unlockCost: 0,
        bodies: [
          { id: 'daisy', name: 'Daisy', color: '#FFFFFF', landColor: '#FFD700', unlockCost: 0, baseEnergy: 1, baseTap: 1, isStar: true, size: 90, emoji: '🌼' },
          { id: 'tulip', name: 'Tulip', color: '#FF69B4', landColor: '#FF1493', unlockCost: 50000, baseEnergy: 2, baseTap: 2, size: 100, emoji: '🌷' },
          { id: 'sunflower', name: 'Sunflower', color: '#FFD700', landColor: '#FFA500', unlockCost: 250000, baseEnergy: 4, baseTap: 4, size: 140, emoji: '🌻' },
          { id: 'rose', name: 'Rose', color: '#DC143C', landColor: '#B22222', unlockCost: 1000000, baseEnergy: 8, baseTap: 8, size: 110, emoji: '🌹' },
          { id: 'orchid', name: 'Orchid', color: '#9370DB', landColor: '#8A2BE2', unlockCost: 5000000, baseEnergy: 15, baseTap: 15, size: 120, emoji: '🌺' },
        ]
      },
      {
        id: 'trees', name: 'Forest', unlockCost: 25000000,
        bodies: [
          { id: 'bonsai', name: 'Bonsai', color: '#228B22', landColor: '#8B4513', unlockCost: 0, baseEnergy: 35, baseTap: 35, isStar: true, size: 100, emoji: '🌳' },
          { id: 'palm', name: 'Palm Tree', color: '#228B22', landColor: '#8B4513', unlockCost: 50000000, baseEnergy: 50, baseTap: 50, size: 180, emoji: '🌴' },
          { id: 'cherry', name: 'Cherry Blossom', color: '#FFB6C1', landColor: '#8B4513', unlockCost: 100000000, baseEnergy: 80, baseTap: 80, size: 170, emoji: '🌸' },
          { id: 'redwood', name: 'Redwood', color: '#228B22', landColor: '#654321', unlockCost: 500000000, baseEnergy: 175, baseTap: 175, size: 200, emoji: '🌲' },
        ]
      }
    ]
  }
};

// Get theme data - default to space
const getThemeData = (themeId) => THEMES[themeId] || THEMES.space;

// For backwards compatibility
const GALAXIES = THEMES.space.worlds;

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
  getAutoEnergy,
  worlds,
  theme
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
          <div className="text-yellow-400 text-2xl font-bold">{formatNumber(energy)} {theme.energyName}</div>
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
            {theme.itemLabel.toUpperCase()}S
          </button>
          <button
            onClick={() => setTab('galaxies')}
            className={`flex-1 py-3 font-bold tracking-wider transition-colors text-sm ${tab === 'galaxies' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}
          >
            {theme.worldLabel.toUpperCase()}S
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'upgrades' && (
            <>
              <div className="text-center text-gray-400 text-sm mb-4 p-3 bg-gray-800/50 rounded-lg">
                Upgrades are specific to {currentBody.name}
              </div>

              {/* Dynamic upgrades based on body/galaxy */}
              {getAvailableUpgrades(currentBody, currentGalaxy).map(upgradeType => {
                const info = UPGRADE_DESCRIPTIONS[upgradeType];
                const level = currentUpgrades[upgradeType] || 0;
                const cost = calculateUpgradeCost(upgradeType, level);
                const canAfford = energy >= cost;
                const multiplier = calculateMilestoneMultiplier(level);

                // Get upgrade-specific details
                let effectText = info.desc;
                if (upgradeType === 'tap_power') {
                  effectText = `+${currentBody.baseTap} tap energy per level`;
                } else if (upgradeType === 'auto_collect') {
                  effectText = `+${currentBody.baseEnergy} energy/sec per level`;
                } else if (upgradeType === 'critical_chance') {
                  effectText = `${Math.min((level + 1) * 2, 50)}% chance for 5x energy`;
                } else if (upgradeType === 'energy_multiplier') {
                  effectText = `+${(level + 1) * 5}% bonus to all energy`;
                } else if (upgradeType === 'offline_earnings') {
                  effectText = `${Math.min((level + 1) * 10, 100)}% of auto earnings while away`;
                } else if (upgradeType === 'offline_time') {
                  effectText = `Max ${BASE_OFFLINE_HOURS + level + 1} hours offline (currently ${BASE_OFFLINE_HOURS + level}h)`;
                } else if (upgradeType === 'auto_tap') {
                  effectText = `${level + 1} automatic taps per second`;
                }

                return (
                  <div key={upgradeType} className={`p-4 rounded-xl transition-all ${canAfford ? 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600' : 'bg-gray-800/50 opacity-60'}`}>
                    <button
                      onClick={() => onBuyUpgrade(upgradeType)}
                      disabled={!canAfford}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{info.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">{info.name}</span>
                            <span className="text-gray-400 text-sm">Lv.{level}</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">{effectText}</p>
                          {multiplier > 1 && ['tap_power', 'auto_collect'].includes(upgradeType) && (
                            <p className="text-purple-400 text-sm mt-1">
                              Milestone bonus: {formatNumber(multiplier)}x
                            </p>
                          )}
                          <div className={`mt-2 font-bold ${canAfford ? 'text-yellow-400' : 'text-gray-500'}`}>
                            {formatNumber(cost)} Energy
                          </div>
                          {['tap_power', 'auto_collect'].includes(upgradeType) && (
                            <MilestoneIndicator level={level} />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
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
                        {formatNumber(body.unlockCost)} {theme.energyName}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {tab === 'galaxies' && worlds.map((galaxy, index) => {
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
                      {galaxy.bodies.length} {theme.itemLabel.toLowerCase()}s
                    </p>
                    {!isUnlocked && !isFirst && (
                      <div className={`mt-2 font-bold ${canAfford ? 'text-purple-400' : 'text-gray-500'}`}>
                        {formatNumber(galaxy.unlockCost)} {theme.energyName}
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

const Stats = ({ isOpen, onClose, totalEnergy, bodyUpgrades, unlockedBodies, unlockedGalaxies, deviceId, bodyEnergy, worlds, theme }) => {
  if (!isOpen) return null;

  const allBodies = worlds.flatMap(g => g.bodies);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white tracking-wider">STATS</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400">Total {theme.energyName} (All Time)</span>
            <span className="text-yellow-400 font-bold">{formatNumber(totalEnergy)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400">{theme.worldLabel}s Unlocked</span>
            <span className="text-purple-400 font-bold">{unlockedGalaxies.length} / {worlds.length}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-gray-400">{theme.itemLabel}s Unlocked</span>
            <span className="text-white font-bold">{unlockedBodies.length} / {allBodies.length}</span>
          </div>

          {worlds.filter(g => unlockedGalaxies.includes(g.id)).map(galaxy => (
            <div key={galaxy.id} className="pt-4">
              <h3 className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-3">{galaxy.name}</h3>
              {galaxy.bodies.filter(b => unlockedBodies.includes(b.id)).map(body => {
                const upgrades = bodyUpgrades[body.id] || { tap_power: 0, auto_collect: 0 };
                return (
                  <div key={body.id} className="mb-2 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: body.color }} />
                      <span className="text-white font-medium">{body.name}</span>
                      <span className="text-gray-500 text-xs ml-auto">{formatNumber(bodyEnergy[body.id] || 0)} {theme.energyName.toLowerCase()}</span>
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

  // Theme state
  const [currentThemeId, setCurrentThemeId] = useState('space');
  const [showMenu, setShowMenu] = useState(false);

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
  const [showOfflineEarnings, setShowOfflineEarnings] = useState(null);
  const [popups, setPopups] = useState([]);
  const [saveStatus, setSaveStatus] = useState('saved');

  const hasChangesRef = useRef(false);
  const lastSaveTimeRef = useRef(null);

  // Get current theme data
  const currentTheme = getThemeData(currentThemeId);
  const currentWorlds = currentTheme.worlds;
  const currentGalaxy = currentWorlds[currentGalaxyIndex] || currentWorlds[0];
  const currentBody = currentGalaxy?.bodies?.[currentBodyIndex] || currentGalaxy?.bodies?.[0];
  const currentUpgrades = bodyUpgrades[currentBody?.id] || { tap_power: 0, auto_collect: 0 };

  // Switch theme
  const switchTheme = (themeId) => {
    if (themeId !== currentThemeId) {
      setCurrentThemeId(themeId);
      setCurrentGalaxyIndex(0);
      setCurrentBodyIndex(0);
      const newTheme = getThemeData(themeId);
      const firstWorld = newTheme.worlds[0];
      const firstBody = firstWorld.bodies[0];
      setUnlockedGalaxies([firstWorld.id]);
      setUnlockedBodies([firstBody.id]);
      hasChangesRef.current = true;
    }
    setShowMenu(false);
  };

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
    setDeviceId(getDeviceId());
  }, []);

  // ===========================================
  // GAME CALCULATIONS
  // ===========================================

  // Get energy multiplier from upgrades (5% per level)
  const getEnergyMultiplier = useCallback(() => {
    const level = currentUpgrades.energy_multiplier || 0;
    return 1 + (level * 0.05);
  }, [currentUpgrades]);

  // Get critical hit chance (2% per level, max 50%)
  const getCriticalChance = useCallback(() => {
    const level = currentUpgrades.critical_chance || 0;
    return Math.min(level * 0.02, 0.5);
  }, [currentUpgrades]);

  // Get auto-tap rate (taps per second)
  const getAutoTapRate = useCallback(() => {
    return currentUpgrades.auto_tap || 0;
  }, [currentUpgrades]);

  // Get offline earnings percentage (10% per level)
  const getOfflineEarningsPercent = useCallback(() => {
    const level = currentUpgrades.offline_earnings || 0;
    return Math.min(level * 0.1, 1.0); // Max 100%
  }, [currentUpgrades]);

  const getTapEnergy = useCallback(() => {
    if (!currentBody) return 0;
    const base = currentBody.baseTap;
    const level = currentUpgrades.tap_power || 0;
    const levelBonus = level * base;
    const milestoneMultiplier = calculateMilestoneMultiplier(level);
    const energyMultiplier = getEnergyMultiplier();
    return Math.floor((base + levelBonus) * milestoneMultiplier * energyMultiplier);
  }, [currentBody, currentUpgrades, getEnergyMultiplier]);

  const getAutoEnergy = useCallback(() => {
    if (!currentBody) return 0;
    const base = currentBody.baseEnergy;
    const level = currentUpgrades.auto_collect || 0;
    const levelBonus = level * base;
    const milestoneMultiplier = calculateMilestoneMultiplier(level);
    const energyMultiplier = getEnergyMultiplier();
    return Math.floor(levelBonus * milestoneMultiplier * energyMultiplier);
  }, [currentBody, currentUpgrades, getEnergyMultiplier]);

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

  // Always save to localStorage as backup
  const saveToLocalStorage = useCallback((gameState) => {
    try {
      const saveData = {
        ...gameState,
        deviceId,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(saveData));
      localStorage.setItem(LOCAL_SAVE_KEY_BACKUP, JSON.stringify(saveData));
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }
  }, [deviceId]);

  const saveGame = useCallback(async (force = false) => {
    if (!deviceId) return;
    if (!hasChangesRef.current && !force) return;

    const gameState = getGameState();

    // Always save to localStorage first (instant backup)
    saveToLocalStorage(gameState);

    setSaveStatus('saving');

    try {
      const result = await GameAPI.saveGame(deviceId, gameState);

      if (currentBody) {
        await GameAPI.submitScore(deviceId, currentGalaxy.id, currentBody.id, bodyEnergy[currentBody.id] || 0);
      }

      setSaveStatus(result.fallback ? 'offline' : 'saved');
    } catch (error) {
      console.error('Cloud save failed:', error);
      setSaveStatus('offline');
    }

    hasChangesRef.current = false;
  }, [deviceId, getGameState, saveToLocalStorage, currentGalaxy?.id, currentBody, bodyEnergy]);

  // Load game on mount + calculate offline earnings
  useEffect(() => {
    if (!deviceId) return;

    const loadGame = async () => {
      setIsLoading(true);
      const savedData = await GameAPI.loadGame(deviceId);

      if (savedData) {
        let loadedEnergy = savedData.energy || 0;
        let loadedTotalEnergy = savedData.totalEnergy || 0;
        const loadedBodyUpgrades = savedData.bodyUpgrades || savedData.planetUpgrades || {};
        const loadedBodyEnergy = savedData.bodyEnergy || savedData.planetEnergy || {};

        // Calculate offline earnings
        if (savedData.updatedAt || savedData.savedAt) {
          const lastSave = new Date(savedData.updatedAt || savedData.savedAt).getTime();
          const now = Date.now();
          const rawOfflineMs = now - lastSave;

          // Calculate max offline hours based on upgrades (base 12 + 1 per level)
          let maxOfflineHours = BASE_OFFLINE_HOURS;
          Object.values(loadedBodyUpgrades).forEach(upgrades => {
            const timeLevel = upgrades.offline_time || 0;
            maxOfflineHours = Math.max(maxOfflineHours, BASE_OFFLINE_HOURS + timeLevel);
          });
          const maxOfflineMs = maxOfflineHours * 60 * 60 * 1000;
          const offlineMs = Math.min(rawOfflineMs, maxOfflineMs);
          const offlineSeconds = Math.floor(offlineMs / 1000);

          if (offlineSeconds > 60) { // Only count if offline > 1 minute
            // Calculate earnings for each body with offline earnings upgrade
            let totalOfflineEarnings = 0;

            Object.keys(loadedBodyUpgrades).forEach(bodyId => {
              const upgrades = loadedBodyUpgrades[bodyId] || {};
              const offlineLevel = upgrades.offline_earnings || 0;

              if (offlineLevel > 0) {
                const offlinePercent = Math.min(offlineLevel * 0.1, 1.0);
                const autoLevel = upgrades.auto_collect || 0;

                // Find the body to get base energy
                let baseEnergy = 1;
                for (const galaxy of currentWorlds) {
                  const body = galaxy.bodies.find(b => b.id === bodyId);
                  if (body) {
                    baseEnergy = body.baseEnergy;
                    break;
                  }
                }

                const autoEnergy = autoLevel * baseEnergy * calculateMilestoneMultiplier(autoLevel);
                const offlineEarnings = Math.floor(autoEnergy * offlineSeconds * offlinePercent);
                totalOfflineEarnings += offlineEarnings;

                loadedBodyEnergy[bodyId] = (loadedBodyEnergy[bodyId] || 0) + offlineEarnings;
              }
            });

            if (totalOfflineEarnings > 0) {
              loadedEnergy += totalOfflineEarnings;
              loadedTotalEnergy += totalOfflineEarnings;

              const hours = Math.floor(offlineMs / (1000 * 60 * 60));
              const mins = Math.floor((offlineMs % (1000 * 60 * 60)) / (1000 * 60));

              setShowOfflineEarnings({
                amount: totalOfflineEarnings,
                time: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
                maxHours: maxOfflineHours
              });
            }
          }
        }

        setEnergy(loadedEnergy);
        setTotalEnergy(loadedTotalEnergy);
        setBodyEnergy(loadedBodyEnergy);
        setBodyUpgrades(loadedBodyUpgrades);
        setCurrentGalaxyIndex(savedData.currentGalaxyIndex || 0);
        setCurrentBodyIndex(savedData.currentBodyIndex || savedData.currentPlanetIndex || 0);
        setUnlockedBodies(savedData.unlockedBodies || savedData.unlockedPlanets || ['sun']);
        setUnlockedGalaxies(savedData.unlockedGalaxies || ['solar_system']);
      }

      setIsLoading(false);
    };

    loadGame();
  }, [deviceId]);

  // Auto-save interval + visibility change + beforeunload
  useEffect(() => {
    if (!deviceId) return;

    // Save every minute
    const interval = setInterval(() => saveGame(), SAVE_INTERVAL);

    // Save when leaving page
    const handleUnload = () => saveGame(true);
    window.addEventListener('beforeunload', handleUnload);

    // Save when tab becomes hidden (switching tabs, minimizing)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveGame(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Save when window loses focus
    const handleBlur = () => saveGame(true);
    window.addEventListener('blur', handleBlur);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
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
  const handleTap = (e, isAutoTap = false) => {
    if (!currentBody) return;

    let tapEnergy = getTapEnergy();
    let isCritical = false;

    // Check for critical hit
    const critChance = getCriticalChance();
    if (critChance > 0 && Math.random() < critChance) {
      tapEnergy *= 5;
      isCritical = true;
    }

    setEnergy(prev => prev + tapEnergy);
    setTotalEnergy(prev => prev + tapEnergy);
    setBodyEnergy(prev => ({
      ...prev,
      [currentBody.id]: (prev[currentBody.id] || 0) + tapEnergy
    }));
    hasChangesRef.current = true;

    // Only show popup for manual taps or critical auto-taps
    if (!isAutoTap || isCritical) {
      const popup = {
        id: Date.now() + Math.random(),
        amount: tapEnergy,
        isCritical,
        x: `${Math.random() * 60 + 20}%`,
        y: `${Math.random() * 20 + 35}%`
      };
      setPopups(prev => [...prev, popup]);
      setTimeout(() => setPopups(prev => prev.filter(p => p.id !== popup.id)), 1000);
    }
  };

  // Auto-tap effect
  useEffect(() => {
    if (!currentBody) return;

    const autoTapRate = getAutoTapRate();
    if (autoTapRate > 0) {
      const interval = setInterval(() => {
        for (let i = 0; i < autoTapRate; i++) {
          handleTap(null, true);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentBody, getAutoTapRate]);

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
    const unlockedIndexes = currentWorlds
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
    <div className={`relative w-full h-screen bg-gradient-to-b ${currentTheme.bgGradient} flex flex-col overflow-hidden select-none`}>
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

      {/* Menu button - top right */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          saveStatus === 'saved' ? 'bg-green-500' :
          saveStatus === 'saving' ? 'bg-yellow-500 animate-pulse' :
          'bg-orange-500'
        }`} title={saveStatus} />
        <button
          onClick={() => setShowMenu(true)}
          className="p-2 bg-gray-800/80 rounded-lg text-white hover:bg-gray-700 transition-all text-xl"
        >
          ☰
        </button>
      </div>

      {/* Theme Menu Modal */}
      {showMenu && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-2xl font-bold text-white tracking-wider">THEMES</h2>
              <button onClick={() => setShowMenu(false)} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Object.values(THEMES).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => switchTheme(theme.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    theme.id === currentThemeId
                      ? 'bg-purple-900/50 border-2 border-purple-500'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{theme.icon}</span>
                    <div>
                      <div className="text-white font-bold text-lg">{theme.name}</div>
                      <div className="text-gray-400 text-sm">
                        {theme.worlds.length} {theme.worldLabel}s • Collect {theme.energyName}
                      </div>
                    </div>
                    {theme.id === currentThemeId && (
                      <span className="ml-auto text-purple-400">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* World indicator */}
      {unlockedGalaxies.length > 1 && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button
            onClick={() => changeGalaxy('prev')}
            className="text-purple-400 hover:text-purple-300 text-xl"
          >
            ◀
          </button>
          <span className="text-purple-400 text-sm font-medium">{currentGalaxy?.name}</span>
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
        <div className="text-yellow-400 text-xl font-bold tracking-widest mt-1">{currentTheme.energyName.toUpperCase()}</div>
        <div className="text-gray-400 text-sm mt-2">
          Tap +{formatNumber(getTapEnergy())} | Auto +{formatNumber(getAutoEnergy())}/sec
        </div>
      </div>

      {/* Tappable game area - full screen tap zone */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center cursor-pointer active:opacity-90 touch-manipulation"
        onClick={handleTap}
        onTouchStart={(e) => e.preventDefault()}
      >
        {popups.map(popup => (
          <EnergyPopup key={popup.id} {...popup} />
        ))}

        {currentBody && (
          <div className="pointer-events-none">
            <CelestialBody body={currentBody} onClick={() => {}} />
          </div>
        )}
      </div>

      {/* Offline earnings popup */}
      {showOfflineEarnings && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full text-center border border-purple-500">
            <div className="text-4xl mb-4">🌙</div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome Back!</h2>
            <p className="text-gray-400 mb-4">
              While you were away for {showOfflineEarnings.time}...
            </p>
            <div className="text-3xl font-bold text-yellow-400 mb-4">
              +{formatNumber(showOfflineEarnings.amount)} Energy
            </div>
            <p className="text-gray-500 text-sm mb-4">
              (Max offline time: {showOfflineEarnings.maxHours} hours)
            </p>
            <button
              onClick={() => setShowOfflineEarnings(null)}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
            >
              Collect!
            </button>
          </div>
        </div>
      )}

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
          onClick={() => saveGame(true)}
          className={`p-4 rounded-xl text-white transition-all active:scale-95 ${
            saveStatus === 'saving' ? 'bg-yellow-600/80 animate-pulse' :
            saveStatus === 'saved' ? 'bg-green-800/80 hover:bg-green-700' :
            'bg-orange-800/80 hover:bg-orange-700'
          }`}
          title={`Status: ${saveStatus} - Click to force save`}
        >
          💾
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
        worlds={currentWorlds}
        theme={currentTheme}
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
        worlds={currentWorlds}
        theme={currentTheme}
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
