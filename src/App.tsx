/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { KitzchRenderer } from './utils/kitzchRenderer';
import { soundManager } from './utils/audio';
import {
  Achievement,
  AmbientBat,
  AmbientCloud,
  AmbientFirefly,
  DropFortune,
  DropRarity,
  FloatingPopText,
  ItemCategory,
  KitzchItem,
  KitzchParticle,
  PlayerSkinId,
} from './types/game';
import { GrimoireModal } from './components/GrimoireModal';
import { SkinSelectorModal } from './components/SkinSelectorModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { BookOpen, Shirt, Volume2, VolumeX, Music, Share2, Check, Download, Cloud } from 'lucide-react';

const STORAGE_KEY = 'kitzch_halloween_profile_v2';

const WISHES: Record<DropRarity, string[]> = {
  common: [
    'May your fits go hard and your Wi-Fi never lag.',
    'Main character energy all year. Zero NPC moments.',
    'May your crush reply in under five minutes.',
    'May every song you shuffle absolutely slap.',
    'Hope your sleep schedule heals. We believe in you.',
  ],
  rare: [
    'A glow-up so loud the group chat needs a minute.',
    'Your next plot twist is an absolute W, no notes.',
    'Free rent in everyone’s head, but make it flattering.',
    'One free pass on a bad hair day. Use it wisely.',
  ],
  mythic: [
    'The moon says you’re the plot. Everything you touch turns iconic, fr fr.',
    'Wish granted: a whole year of rich, happy and unbothered. Periodt.',
    'Legend status unlocked. The universe is on your side, no cap.',
  ],
};

const RARITY_LABELS: Record<DropRarity, string> = {
  common: 'Common drop',
  rare: 'Rare drop',
  mythic: 'Mythic drop, rare af',
};

const STAGES: [number, string][] = [
  [0, 'Dusk'],
  [25, 'Midnight'],
  [55, 'Witching hour'],
  [95, 'Dead of night'],
];

const CANDY_COLORS = ['#F86903', '#FACE91', '#8b5cf6', '#5eead4', '#ff5d8f', '#CE3D01'];
const SLANGS = ['slay', 'ate', 'periodt', 'no cap', 'lets go'];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<KitzchRenderer | null>(null);

  // Persistent Player Profile
  const [bestScore, setBestScore] = useState<number>(0);
  const [totalCandies, setTotalCandies] = useState<number>(0);
  const [bestStreakAllTime, setBestStreakAllTime] = useState<number>(0);
  const [collectedWishes, setCollectedWishes] = useState<string[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [activeSkin, setActiveSkin] = useState<PlayerSkinId>('classic');

  // UI State
  const [gameState, setGameState] = useState<'intro' | 'play' | 'pause' | 'end'>('intro');
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [stageBanner, setStageBanner] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState<boolean>(true);

  // Modals & Sharing
  const [showGrimoire, setShowGrimoire] = useState<boolean>(false);
  const [showWardrobe, setShowWardrobe] = useState<boolean>(false);
  const [showDriveModal, setShowDriveModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleShareGame = () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: 'Kitzch-Pop Halloween | Candy Catch Szn',
      text: `Ayo main Kitzch-Pop Halloween Candy Catch bareng! Skor tertinggiku ${bestScore || 0}. Coba kalahkan! 🎃🍬`,
      url: shareUrl,
    };

    if (navigator.share) {
      navigator.share(shareData).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl);
        setToastMessage('Link game berhasil disalin! Siap dibagikan!');
        setTimeout(() => setToastMessage(''), 2500);
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      setToastMessage('Link game berhasil disalin! Siap dibagikan!');
      setTimeout(() => setToastMessage(''), 2500);
    }
  };

  // Powerups timers
  const [magnetTimer, setMagnetTimer] = useState<number>(0);
  const [rushTimer, setRushTimer] = useState<number>(0);
  const [shieldTimer, setShieldTimer] = useState<number>(0);

  // End Fortune Drop
  const [fortuneDrop, setFortuneDrop] = useState<DropFortune | null>(null);
  const [isBoxUnwrapped, setIsBoxUnwrapped] = useState<boolean>(false);
  const [endStats, setEndStats] = useState({
    finalScore: 0,
    bestStreak: 0,
    timeSurvived: 0,
    finalStage: 'Dusk',
    treatCount: 0,
  });

  // Load profile from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBestScore(parsed.bestScore || 0);
        setTotalCandies(parsed.totalCandies || 0);
        setBestStreakAllTime(parsed.bestStreak || 0);
        setCollectedWishes(parsed.collectedWishes || []);
        setUnlockedAchievements(parsed.unlockedAchievements || []);
        setActiveSkin(parsed.activeSkin || 'classic');
      }
    } catch {
      // Fallback
    }
  }, []);

  // Save profile helper
  const saveProfile = useCallback(
    (updates: {
      bestScore?: number;
      totalCandies?: number;
      bestStreak?: number;
      collectedWishes?: string[];
      unlockedAchievements?: string[];
      activeSkin?: PlayerSkinId;
    }) => {
      try {
        const current = {
          bestScore: updates.bestScore !== undefined ? updates.bestScore : bestScore,
          totalCandies: updates.totalCandies !== undefined ? updates.totalCandies : totalCandies,
          bestStreak: updates.bestStreak !== undefined ? updates.bestStreak : bestStreakAllTime,
          collectedWishes: updates.collectedWishes || collectedWishes,
          unlockedAchievements: updates.unlockedAchievements || unlockedAchievements,
          activeSkin: updates.activeSkin || activeSkin,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      } catch {
        // Ignore
      }
    },
    [bestScore, totalCandies, bestStreakAllTime, collectedWishes, unlockedAchievements, activeSkin]
  );

  // Unlock achievement helper
  const unlockAchievement = useCallback(
    (id: string) => {
      setUnlockedAchievements((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        saveProfile({ unlockedAchievements: next });
        return next;
      });
    },
    [saveProfile]
  );

  // Game internal state held in refs for 60fps loop
  const stateRef = useRef({
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: 3,
    time: 0,
    stageIndex: 0,
    spawnTimer: 0,
    pinataTimer: 24, // every 25-35s

    // Powerups
    magnet: 0,
    rush: 0,
    shield: 0,

    // Screen effects
    screenShake: 0,
    redFlash: 0,
    squash: 0,
    expression: 'normal' as 'normal' | 'excited' | 'hurt' | 'rush',
    expressionTimer: 0,

    // Physics
    px: 200,
    tx: 200,
    bw: 90,
    leftPressed: false,
    rightPressed: false,

    // Entities
    items: [] as KitzchItem[],
    particles: [] as KitzchParticle[],
    texts: [] as FloatingPopText[],
    bats: [] as AmbientBat[],
    clouds: [] as AmbientCloud[],
    fireflies: [] as AmbientFirefly[],
    batSpawnTimer: 2,

    tally: {
      gum: 0,
      pop: 0,
      wrap: 0,
      star: 0,
      apple: 0,
      pinata: 0,
    },
  });

  // Calculate multiplier
  const getMultiplier = useCallback(() => {
    const s = stateRef.current;
    const base = Math.min(5, 1 + Math.floor(s.streak / 10));
    return base * (s.rush > 0 ? 2 : 1);
  }, []);

  const getProgressToNextMultiplier = () => {
    const curLevel = Math.min(5, 1 + Math.floor(streak / 10));
    if (curLevel >= 5) return 100;
    return (streak % 10) * 10;
  };

  // Initialize canvas & environmental particles
  // Robust updateSize with guaranteed non-zero fallbacks
  const updateSize = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const container = cv.parentElement;
    let w = container ? container.clientWidth : 0;
    let h = container ? container.clientHeight : 0;

    if (w <= 0) w = Math.min(window.innerWidth - 24, 520);
    if (h <= 0) h = Math.min(window.innerHeight * 0.86, 820);
    if (w <= 0) w = 360;
    if (h <= 0) h = 600;

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;

    const ctx = cv.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      if (!rendererRef.current) {
        rendererRef.current = new KitzchRenderer(ctx, w, h, dpr);
      } else {
        rendererRef.current.resize(w, h, dpr);
      }
    }

    stateRef.current.bw = Math.min(116, Math.max(78, w * 0.22));
    stateRef.current.px = stateRef.current.tx = Math.min(
      Math.max(stateRef.current.px || w / 2, stateRef.current.bw / 2),
      w - stateRef.current.bw / 2
    );

    // Create ambient clouds & fireflies
    if (stateRef.current.clouds.length === 0) {
      for (let i = 0; i < 4; i++) {
        stateRef.current.clouds.push({
          x: Math.random() * w,
          y: h * (0.05 + Math.random() * 0.25),
          vx: 10 + Math.random() * 15,
          width: 80 + Math.random() * 100,
          height: 25 + Math.random() * 20,
          alpha: 0.12 + Math.random() * 0.15,
        });
      }
    }

    if (stateRef.current.fireflies.length === 0) {
      for (let i = 0; i < 12; i++) {
        stateRef.current.fireflies.push({
          x: Math.random() * w,
          y: h * (0.75 + Math.random() * 0.2),
          vx: (Math.random() - 0.5) * 20,
          vy: -15 - Math.random() * 20,
          size: 2 + Math.random() * 2.5,
          phase: Math.random() * Math.PI * 2,
          color: i % 2 === 0 ? '#5eead4' : '#FACE91',
        });
      }
    }
  }, []);

  useEffect(() => {
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateSize]);

  useEffect(() => {
    // Re-check size when gameState changes
    updateSize();
  }, [gameState, updateSize]);

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.leftPressed = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.rightPressed = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.leftPressed = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.rightPressed = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Pointer / Touch basket repositioning
  const moveBasketToX = useCallback((clientX: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const relX = clientX - rect.left;
    stateRef.current.tx = Math.max(
      stateRef.current.bw / 2,
      Math.min(cv.clientWidth - stateRef.current.bw / 2, relX)
    );
  }, []);

  // Particle burst helper
  const spawnBurst = (x: number, y: number, color: string, count: number = 14, shape: 'circle' | 'spark' | 'star' = 'circle') => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 60 + Math.random() * 260;
      s.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 120,
        life: 1,
        color: i % 3 ? color : '#FACE91',
        size: 2.5 + Math.random() * 3.5,
        isSpark: i % 2 === 0,
        shape,
      });
    }
  };

  // Popup floating text
  const addPopText = (text: string, x: number, y: number, color: string = '#FACE91', scale: number = 1) => {
    stateRef.current.texts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      life: 1,
      color,
      scale,
    });
  };

  const triggerBanner = (title: string) => {
    setStageBanner(title);
    setTimeout(() => {
      setStageBanner('');
    }, 2400);
  };

  // Spawn candy, powerup, or jackpot pinata
  const spawnItem = (w: number) => {
    const s = stateRef.current;

    // Check for Ghost Pinata spawn
    if (s.pinataTimer <= 0) {
      s.pinataTimer = 30 + Math.random() * 15;
      s.items.push({
        id: Math.random().toString(),
        type: 'pinata',
        x: Math.random() * (w - 80) + 40,
        y: -40,
        vy: 120,
        r: 28,
        rot: 0,
        vr: 1.5,
        color: '#f472b6',
        isJackpot: true,
      });
      addPopText('PINATA INCOMING!', w / 2, 90, '#f472b6', 1.25);
      soundManager.voice(600, [800, 1150], 0.35, 1);
      return;
    }

    const p = Math.random();
    const curseChance = Math.min(0.06 + s.time * 0.0016, 0.22);

    let ty: ItemCategory;
    if (p < curseChance) {
      ty = 'curse';
    } else if (p < curseChance + 0.06) {
      const powerups: ItemCategory[] = ['moon', 'bolt', 'ring'];
      ty = powerups[Math.floor(Math.random() * powerups.length)];
    } else {
      const q = Math.random();
      if (q < 0.45) ty = 'gum';
      else if (q < 0.7) ty = 'pop';
      else if (q < 0.88) ty = 'wrap';
      else if (q < 0.96) ty = 'apple';
      else ty = 'star';
    }

    const u = Math.min(1.3, Math.max(0.8, w / 400));
    const r = (ty === 'curse' ? 20 : ty === 'star' || ty === 'apple' ? 17 : 16) * u;
    const vy = (150 + Math.min(s.time, 150) * 2.4) * u * (0.8 + Math.random() * 0.5);

    s.items.push({
      id: Math.random().toString(),
      type: ty,
      x: r + Math.random() * (w - 2 * r),
      y: -r * 2,
      vy,
      r,
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 3,
      color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
    });
  };

  // Item caught handler
  const handleItemCatch = (item: KitzchItem, cvHeight: number, cvWidth: number) => {
    const s = stateRef.current;
    const T = item.type;

    if (T === 'pinata') {
      // Jackpot Candy Rain
      s.score += 100 * getMultiplier();
      setScore(s.score);
      soundManager.playPinataExplosion();
      soundManager.vibrate(100);
      spawnBurst(item.x, item.y, '#f472b6', 35, 'star');
      addPopText('+100 CANDY RAIN!', item.x, item.y - 25, '#f472b6', 1.4);
      unlockAchievement('pinata');

      // Rain 12 treats immediately
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          if (gameState === 'play') {
            const types: ItemCategory[] = ['gum', 'pop', 'wrap', 'star'];
            const randType = types[Math.floor(Math.random() * types.length)];
            s.items.push({
              id: Math.random().toString(),
              type: randType,
              x: Math.random() * (cvWidth - 60) + 30,
              y: -20,
              vy: 200 + Math.random() * 120,
              r: 16,
              rot: Math.random() * 6,
              vr: (Math.random() - 0.5) * 4,
              color: CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
            });
          }
        }, i * 160);
      }
      return;
    }

    if (T === 'curse') {
      if (s.shield > 0) {
        s.shield = 0;
        setShieldTimer(0);
        spawnBurst(item.x, item.y, '#5eead4', 18);
        addPopText('blocked', s.px, item.y - 24, '#5eead4');
        soundManager.sfx(600, 0.15, 'sine');
        unlockAchievement('shield');
        return;
      }

      s.lives = Math.max(0, s.lives - 1);
      s.streak = 0;
      s.screenShake = 0.45;
      s.redFlash = 0.6;
      s.expression = 'hurt';
      s.expressionTimer = 0.8;
      setLives(s.lives);
      setStreak(0);

      spawnBurst(item.x, item.y, '#ff3b2e', 24);
      addPopText('cooked', s.px, item.y - 24, '#ff6b4a');
      soundManager.sfx(120, 0.35, 'sawtooth', 0.09);
      soundManager.voice(140, [330, 700], 0.45, 1.2);
      soundManager.say('cooked');
      soundManager.vibrate(70);

      if (s.lives <= 0) {
        setTimeout(() => {
          endCurrentRun();
        }, 800);
      }
      return;
    }

    // Powerups
    if (T === 'moon') {
      s.magnet = 8;
      setMagnetTimer(8);
      addPopText('moon magnet', s.px, item.y - 24, '#c4b0ff');
      soundManager.voice(520, [300, 2300], 0.3, 1);
      unlockAchievement('magnet');
    } else if (T === 'bolt') {
      s.rush = 8;
      setRushTimer(8);
      s.expression = 'rush';
      s.expressionTimer = 8;
      addPopText('sugar rush x2', s.px, item.y - 24, '#ffb347');
      soundManager.voice(520, [300, 2300], 0.3, 1);
    } else if (T === 'ring') {
      s.shield = 14;
      setShieldTimer(14);
      addPopText('shield up', s.px, item.y - 24, '#5eead4');
      soundManager.voice(520, [300, 2300], 0.3, 1);
    } else {
      // Normal Candy
      s.streak++;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      setStreak(s.streak);
      unlockAchievement('first_candy');

      if (s.streak >= 20) {
        unlockAchievement('streak_20');
      }

      const mul = getMultiplier();
      const pointsTable: Record<string, number> = {
        gum: 1,
        pop: 3,
        wrap: 5,
        apple: 50,
        star: 10,
      };

      const pts = (pointsTable[T] || 1) * mul;
      s.score += pts;
      setScore(s.score);

      if (T in s.tally) {
        s.tally[T as keyof typeof s.tally]++;
      }

      if (T === 'apple') {
        s.rush = Math.max(s.rush, 6);
        setRushTimer(s.rush);
        addPopText(`+${pts} SPEED SURGE!`, item.x, item.y - 20, '#d97706');
      } else {
        addPopText(`+${pts}`, item.x, item.y - 20, T === 'star' ? '#ffe08a' : '#FACE91');
      }

      // Hype voice slang at streak milestones
      if (s.streak % 10 === 0) {
        const word = SLANGS[Math.floor(Math.random() * SLANGS.length)];
        addPopText(word, s.px, cvHeight * 0.55, '#F86903', 1.3);
        soundManager.say(word);
      }
    }

    s.squash = 1;
    s.expression = 'excited';
    s.expressionTimer = 0.3;
    spawnBurst(item.x, item.y, item.color, 12);
    soundManager.sfx(420 + Math.min(s.streak, 30) * 14, 0.08);
  };

  // End run and generate fortune drop
  const endCurrentRun = () => {
    setGameState('end');
    const s = stateRef.current;

    let rarity: DropRarity = 'common';
    if (s.score >= 450 || s.bestStreak >= 30) {
      rarity = 'mythic';
      unlockAchievement('mythic_wish');
    } else if (s.score >= 180 || s.bestStreak >= 15) {
      rarity = 'rare';
    }

    const wishList = WISHES[rarity];
    const pickedWish = wishList[Math.floor(Math.random() * wishList.length)];

    setFortuneDrop({
      id: Math.random().toString(),
      rarity,
      label: RARITY_LABELS[rarity],
      wish: pickedWish,
    });
    setIsBoxUnwrapped(false);

    // Save to collected fortunes in Grimoire
    if (!collectedWishes.includes(pickedWish)) {
      const nextWishes = [...collectedWishes, pickedWish];
      setCollectedWishes(nextWishes);
      saveProfile({ collectedWishes: nextWishes });
    }

    // Cumulative stats
    const totalCandyRound = s.score;
    const newTotal = totalCandies + totalCandyRound;
    const newBest = Math.max(bestScore, totalCandyRound);
    const newMaxStreak = Math.max(bestStreakAllTime, s.bestStreak);

    setTotalCandies(newTotal);
    setBestScore(newBest);
    setBestStreakAllTime(newMaxStreak);

    saveProfile({
      bestScore: newBest,
      totalCandies: newTotal,
      bestStreak: newMaxStreak,
    });

    const currentStage = STAGES[s.stageIndex] ? STAGES[s.stageIndex][1] : 'Dusk';
    const totalCollected = Object.values(s.tally).reduce((a, b) => a + b, 0);

    setEndStats({
      finalScore: totalCandyRound,
      bestStreak: s.bestStreak,
      timeSurvived: Math.floor(s.time),
      finalStage: currentStage,
      treatCount: totalCollected,
    });
  };

  // Start fresh game
  const handleStartHunt = () => {
    const s = stateRef.current;
    s.score = 0;
    s.streak = 0;
    s.bestStreak = 0;
    s.lives = 3;
    s.time = 0;
    s.stageIndex = 0;
    s.spawnTimer = 0;
    s.pinataTimer = 24;
    s.magnet = 0;
    s.rush = 0;
    s.shield = 0;
    s.items = [];
    s.particles = [];
    s.texts = [];
    s.bats = [];
    s.batSpawnTimer = 2;
    s.tally = { gum: 0, pop: 0, wrap: 0, star: 0, apple: 0, pinata: 0 };

    setScore(0);
    setStreak(0);
    setLives(3);
    setMagnetTimer(0);
    setRushTimer(0);
    setShieldTimer(0);
    setGameState('play');
    triggerBanner(STAGES[0][1]);

    if (isMusicEnabled) {
      soundManager.startMusic();
    }
  };

  // 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const cv = canvasRef.current;
      const s = stateRef.current;

      if (cv && rendererRef.current) {
        const W = cv.clientWidth;
        const H = cv.clientHeight;
        const ctx = cv.getContext('2d');

        if (ctx) {
          ctx.save();

          // Screen Shake
          if (s.screenShake > 0) {
            const shakeAmt = s.screenShake * 10;
            ctx.translate((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt);
            s.screenShake = Math.max(0, s.screenShake - dt * 2.5);
          }

          // Draw Scenic Gothic Background
          rendererRef.current.drawBackground();

          // Ambient drifting clouds
          s.clouds.forEach((c) => {
            c.x += c.vx * dt;
            if (c.x - c.width > W) c.x = -c.width;
          });
          rendererRef.current.drawClouds(s.clouds);

          // Ambient Bats
          s.batSpawnTimer -= dt;
          if (s.batSpawnTimer <= 0) {
            s.batSpawnTimer = 4 + Math.random() * 5;
            const dir = Math.random() < 0.5 ? 1 : -1;
            s.bats.push({
              x: dir > 0 ? -30 : W + 30,
              y: H * (0.08 + Math.random() * 0.3),
              vx: dir * (50 + Math.random() * 70),
              size: 7 + Math.random() * 7,
              phase: Math.random() * 6,
            });
          }

          s.bats.forEach((b) => {
            b.x += b.vx * dt;
            b.y += Math.sin(now * 0.003 + b.phase) * 18 * dt;
          });
          s.bats = s.bats.filter((b) => b.x > -60 && b.x < W + 60);
          rendererRef.current.drawBats(s.bats);

          // Ambient Fireflies
          s.fireflies.forEach((ff) => {
            ff.x += ff.vx * dt;
            ff.y += ff.vy * dt;
            if (ff.y < H * 0.65) ff.y = H * 0.95;
            if (ff.x < 0) ff.x = W;
            if (ff.x > W) ff.x = 0;
          });
          rendererRef.current.drawFireflies(s.fireflies);

          // Active Play Loop
          if (gameState === 'play') {
            s.time += dt;
            s.pinataTimer -= dt;

            // Stage Check
            const nextStageIdx = STAGES.reduce((acc, stg, idx) => (s.time >= stg[0] ? idx : acc), 0);
            if (nextStageIdx !== s.stageIndex) {
              s.stageIndex = nextStageIdx;
              triggerBanner(STAGES[nextStageIdx][1]);
            }

            // Powerups countdown
            if (s.magnet > 0) {
              s.magnet = Math.max(0, s.magnet - dt);
              setMagnetTimer(s.magnet);
            }
            if (s.rush > 0) {
              s.rush = Math.max(0, s.rush - dt);
              setRushTimer(s.rush);
            }
            if (s.shield > 0) {
              s.shield = Math.max(0, s.shield - dt);
              setShieldTimer(s.shield);
            }

            // Character expression reset timer
            if (s.expressionTimer > 0) {
              s.expressionTimer -= dt;
              if (s.expressionTimer <= 0) {
                s.expression = s.rush > 0 ? 'rush' : 'normal';
              }
            }

            // Movement
            const k = (s.rightPressed ? 1 : 0) - (s.leftPressed ? 1 : 0);
            if (k) s.tx += k * W * 1.15 * dt;
            s.tx = Math.max(s.bw / 2, Math.min(W - s.bw / 2, s.tx));
            s.px += (s.tx - s.px) * Math.min(1, dt * 14);

            // Spawner
            s.spawnTimer -= dt;
            if (s.spawnTimer <= 0) {
              spawnItem(W);
              s.spawnTimer = Math.max(0.24, 0.75 - s.time * 0.004) * (0.7 + Math.random() * 0.6);
            }

            const bh = s.bw * 0.62;
            const by = H - bh * 0.5 - 22;

            // Items loop
            for (let i = s.items.length - 1; i >= 0; i--) {
              const o = s.items[i];
              o.y += o.vy * dt;
              o.rot += o.vr * dt;

              // Moon magnet effect
              if (s.magnet > 0 && o.type !== 'curse' && o.y > H * 0.2) {
                o.x += (s.px - o.x) * Math.min(1, dt * 3);
              }

              // Collision check
              const dy = Math.abs(o.y - (by - bh * 0.1));
              const dx = Math.abs(o.x - s.px);
              if (dy < bh * 0.45 && dx < s.bw * 0.5) {
                handleItemCatch(o, H, W);
                s.items.splice(i, 1);
                continue;
              }

              // Fall off screen
              if (o.y > H + 40) {
                if (o.type !== 'curse' && o.type !== 'pinata') {
                  s.streak = 0;
                  setStreak(0);
                }
                s.items.splice(i, 1);
              }
            }

            // Particles
            s.particles.forEach((p) => {
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.vy += 520 * dt;
              p.life -= dt * 1.4;
            });
            s.particles = s.particles.filter((p) => p.life > 0);

            // Floating texts
            s.texts.forEach((o) => {
              o.y -= 46 * dt;
              o.life -= dt * 1.05;
            });
            s.texts = s.texts.filter((o) => o.life > 0);

            s.squash = Math.max(0, s.squash - dt * 5);
          }

          // Draw Items
          s.items.forEach((item) => rendererRef.current?.drawItem(item));

          // Draw Player Basket with active skin and facial expression
          const bh = s.bw * 0.62;
          const by = H - bh * 0.5 - 22;
          rendererRef.current.drawPlayer(
            s.px,
            by,
            s.bw,
            s.squash,
            s.shield > 0,
            s.magnet > 0,
            s.rush > 0,
            activeSkin,
            s.expression
          );

          // Draw Particles & Popups
          rendererRef.current.drawParticles(s.particles);
          rendererRef.current.drawTexts(s.texts);

          // Red screen damage flash
          if (s.redFlash > 0) {
            ctx.fillStyle = `rgba(255, 59, 46, ${s.redFlash * 0.45})`;
            ctx.fillRect(0, 0, W, H);
            s.redFlash = Math.max(0, s.redFlash - dt * 1.4);
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameState, getMultiplier, activeSkin]);

  // Sound toggles
  const toggleSound = () => {
    setIsMuted((prev) => {
      const next = !prev;
      soundManager.setMuted(next);
      return next;
    });
  };

  const toggleMusic = () => {
    setIsMusicEnabled((prev) => {
      const next = !prev;
      soundManager.setMusicEnabled(next);
      return next;
    });
  };

  // Achievements Definition List
  const ACHIEVEMENTS_LIST: Achievement[] = [
    {
      id: 'first_candy',
      title: 'First Nibble',
      desc: 'Catch your very first Halloween treat.',
      icon: '🍬',
      isUnlocked: unlockedAchievements.includes('first_candy'),
    },
    {
      id: 'streak_20',
      title: 'On Fire!',
      desc: 'Reach a scorching 20x combo streak.',
      icon: '🔥',
      isUnlocked: unlockedAchievements.includes('streak_20'),
    },
    {
      id: 'magnet',
      title: 'Cosmic Attractor',
      desc: 'Catch a glowing Moon Magnet powerup.',
      icon: '🧲',
      isUnlocked: unlockedAchievements.includes('magnet'),
    },
    {
      id: 'shield',
      title: 'Aegis Barrier',
      desc: 'Block a cursed orb with the celestial shield.',
      icon: '🛡️',
      isUnlocked: unlockedAchievements.includes('shield'),
    },
    {
      id: 'pinata',
      title: 'Pinata Crusher',
      desc: 'Crack open the floating Ghost Pinata for candy rain.',
      icon: '🪅',
      isUnlocked: unlockedAchievements.includes('pinata'),
    },
    {
      id: 'mythic_wish',
      title: 'Chosen by the Moon',
      desc: 'Survive and earn a Mythic Fortune Drop.',
      icon: '👑',
      isUnlocked: unlockedAchievements.includes('mythic_wish'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-[#0a1215] text-[#FACE91] overflow-x-hidden">
      {/* Subtle Noise Texture */}
      <div className="fixed inset-0 noise-overlay" />

      {/* Main Kitzch Container */}
      <div className="relative w-full max-w-[520px] min-h-screen flex flex-col p-0 pb-10">
        
        {/* Game Canvas Container - Always active & sized */}
        <div className="relative w-full h-[86svh] min-h-[540px] max-h-[820px] rounded-[28px] overflow-hidden shadow-2xl bg-[#07100f]">
          <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              moveBasketToX(e.clientX);
              try {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
              } catch {
                // ignore
              }
            }}
            onPointerMove={(e) => moveBasketToX(e.clientX)}
            onTouchStart={(e) => {
              if (e.touches && e.touches[0]) moveBasketToX(e.touches[0].clientX);
            }}
            onTouchMove={(e) => {
              if (e.touches && e.touches[0]) moveBasketToX(e.touches[0].clientX);
            }}
            className="absolute inset-0 w-full h-full block cursor-pointer touch-none"
          />

          {/* On-screen Mobile Touch Controls during play */}
          {gameState === 'play' && (
            <div className="md:hidden absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 px-1">
              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  stateRef.current.leftPressed = true;
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  stateRef.current.leftPressed = false;
                }}
                onPointerLeave={() => {
                  stateRef.current.leftPressed = false;
                }}
                className="pointer-events-auto w-14 h-14 rounded-2xl bg-[#0a1215]/85 border border-[#FACE91]/30 text-white text-2xl flex items-center justify-center active:bg-[#F86903] transition-colors shadow-xl active:scale-95 cursor-pointer"
                aria-label="Move left"
              >
                ◀
              </button>

              <span className="text-[10px] text-[#FACE91]/70 font-ui font-semibold pointer-events-none bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                Geser layar atau tap tombol
              </span>

              <button
                onPointerDown={(e) => {
                  e.stopPropagation();
                  stateRef.current.rightPressed = true;
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  stateRef.current.rightPressed = false;
                }}
                onPointerLeave={() => {
                  stateRef.current.rightPressed = false;
                }}
                className="pointer-events-auto w-14 h-14 rounded-2xl bg-[#0a1215]/85 border border-[#FACE91]/30 text-white text-2xl flex items-center justify-center active:bg-[#F86903] transition-colors shadow-xl active:scale-95 cursor-pointer"
                aria-label="Move right"
              >
                ▶
              </button>
            </div>
          )}

          {/* Intro Screen View (Inside the game frame overlay) */}
          {gameState === 'intro' && (
            <section className="absolute inset-0 z-20 flex flex-col items-center text-center p-4 overflow-y-auto bg-[#0a1215]/95 backdrop-blur-md animate-in fade-in duration-300">
              {/* Scenic SVG Header with Glowing Moon, Haunted Castle & Flying Bats */}
              <div className="w-full max-w-[400px] mb-2 shrink-0">
                <svg viewBox="0 0 400 190" className="w-full h-auto drop-shadow-xl" aria-hidden="true">
                  <defs>
                    <radialGradient id="mg">
                      <stop offset="0%" stopColor="#FACE91" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#FACE91" stopOpacity="0" />
                    </radialGradient>
                    <path id="bat-svg" d="M0 0q-6-9-15-2 4 1 5 5 3-3 10-3 7 0 10 3 1-4 5-5-9-7-15 2z" />
                  </defs>
                  {/* Moon */}
                  <circle cx="262" cy="84" r="120" fill="url(#mg)" />
                  <circle cx="262" cy="84" r="62" fill="#f6e3bd" />
                  <g fill="#e2c795">
                    <circle cx="244" cy="68" r="11" />
                    <circle cx="280" cy="102" r="15" />
                    <circle cx="282" cy="60" r="6" />
                  </g>
                  {/* Castle silhouette */}
                  <path fill="#050c0e" d="M30 190V128h22V104l9-34 9 34v24h26V92l10-44 10 44v36h28V108l11-26 11 26v82z" />
                  <g fill="#FACE91" opacity="0.85">
                    <rect x="42" y="138" width="8" height="14" rx="4" />
                    <rect x="72" y="138" width="8" height="14" rx="4" />
                    <rect x="104" y="112" width="8" height="14" rx="4" />
                    <rect x="132" y="136" width="8" height="14" rx="4" />
                  </g>
                  {/* Bats */}
                  <g fill="#050c0e">
                    <use href="#bat-svg" x="70" y="34" />
                    <use href="#bat-svg" x="330" y="30" transform="translate(660, 0) scale(-1, 1)" />
                    <use href="#bat-svg" x="190" y="22" />
                    {/* Witch on broom */}
                    <g transform="translate(236, 62) rotate(-14)">
                      <rect x="-34" y="16" width="70" height="3" rx="1.5" />
                      <path d="M36 14l14-3v10z" />
                      <ellipse cx="0" cy="8" rx="9" ry="8" />
                      <circle cx="6" cy="-6" r="5.5" />
                      <path d="M0 -8h14l-6 -18z" />
                    </g>
                  </g>
                </svg>
              </div>

              {/* Logo & Playful Cutout Badges */}
              <div className="mb-3 shrink-0">
                <h1 className="logo">Kitzch-Pop</h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="cut c1" style={{ '--r': '-4deg' } as React.CSSProperties}>
                    Halloween
                  </span>
                  <span className="cut" style={{ '--r': '3deg' } as React.CSSProperties}>
                    candy catch szn
                  </span>
                </div>
              </div>

              {/* Top Quick Utility Buttons (Wardrobe, Grimoire, Sound, Download) */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-3 font-ui text-xs shrink-0">
                <button
                  onClick={() => setShowWardrobe(true)}
                  className="btn-alt py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Shirt className="w-3.5 h-3.5 text-[#F86903]" />
                  <span>Wardrobe</span>
                </button>

                <button
                  onClick={() => setShowGrimoire(true)}
                  className="btn-alt py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#5eead4]" />
                  <span>Grimoire ({collectedWishes.length}/12)</span>
                </button>

                <button
                  onClick={toggleMusic}
                  aria-label="Toggle Background Music"
                  className="btn-alt py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Music className={`w-3.5 h-3.5 ${isMusicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{isMusicEnabled ? 'BGM: On' : 'BGM: Off'}</span>
                </button>

                <button
                  onClick={() => setShowDriveModal(true)}
                  className="btn-alt py-1.5 px-3 flex items-center gap-1.5 cursor-pointer text-amber-300 hover:text-white"
                  title="Upload game file ke Google Drive"
                >
                  <Cloud className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Drive</span>
                </button>

                <a
                  href="/kitzch-pop-halloween-game.zip"
                  download="kitzch-pop-halloween-game.zip"
                  className="btn-alt py-1.5 px-3 flex items-center gap-1.5 cursor-pointer text-[#FACE91] hover:text-white"
                  title="Download Source Code (.ZIP)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh (.ZIP)</span>
                </a>
              </div>

              {/* Story Card */}
              <div className="glass text-left p-4 mb-4 max-w-[420px] w-full text-xs leading-relaxed text-[#FACE91] shrink-0">
                <h2 className="font-bold text-sm text-[#F86903] mb-1.5 tracking-wide font-ui">
                  TRICK OR TREAT: CANDY CATCH!
                </h2>
                <p className="mb-2">
                  <i>Beware, dear creatures of the night!</i> The moon is aglow, the pumpkins are alight, and a delightful bounty of sweets awaits!
                </p>
                <p className="mb-2">
                  Welcome to Kitzch-Pop’s little Halloween adventure! Leave your worries behind, relish every moment, and let the merriment unfold.
                </p>
                <p className="font-bold italic text-white m-0">
                  Trick or treat, Kitzch-Pop! Let the candy hunt begin!
                </p>
              </div>

              {/* Cutout Sticker Feature Badges */}
              <div className="flex flex-wrap gap-1 justify-center max-w-[410px] mb-4 shrink-0">
                <span className="cut" style={{ '--r': '-3deg' } as React.CSSProperties}>drag to slide</span>
                <span className="cut c2" style={{ '--r': '2deg' } as React.CSSProperties}>catch the sweets</span>
                <span className="cut c3" style={{ '--r': '-2deg' } as React.CSSProperties}>dodge cursed orbs</span>
                <span className="cut c1" style={{ '--r': '3deg' } as React.CSSProperties}>3 lives, 0 limits</span>
                <span className="cut c2" style={{ '--r': '-2deg' } as React.CSSProperties}>moon = magnet</span>
                <span className="cut" style={{ '--r': '2deg' } as React.CSSProperties}>bolt = x2 rush</span>
                <span className="cut c3" style={{ '--r': '-3deg' } as React.CSSProperties}>ring = shield</span>
                <span className="cut c1" style={{ '--r': '2deg' } as React.CSSProperties}>🪅 ghost pinata</span>
              </div>

              {/* Primary Start & Share Buttons */}
              <div className="flex flex-col items-center gap-2 w-full max-w-[360px] mb-3 shrink-0">
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
                  <button
                    onClick={handleStartHunt}
                    className="btn-hunt flex-1 w-full flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Start the hunt
                  </button>

                  <button
                    onClick={handleShareGame}
                    className="btn-alt py-3 px-4 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold w-full sm:w-auto hover:text-white"
                    title="Bagikan Link Game ke Teman"
                  >
                    <Share2 className="w-4 h-4 text-[#F86903]" />
                    <span>Bagikan Game</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowDriveModal(true)}
                  className="btn-alt w-full py-2.5 px-4 flex items-center justify-center gap-2 cursor-pointer text-xs font-bold text-amber-300 hover:text-white border-amber-400/40 hover:border-amber-400 shadow-sm"
                  title="Simpan file game dan source code langsung ke Google Drive Anda"
                >
                  <Cloud className="w-4 h-4 text-amber-400" />
                  <span>Masukin Game ke Google Drive</span>
                </button>
              </div>

              {/* Personal Record */}
              {bestScore > 0 && (
                <small className="text-xs text-[#FACE91]/70 font-ui font-semibold pb-2 shrink-0">
                  Personal best stash: <strong className="font-mono text-white text-sm">{bestScore.toLocaleString()}</strong>
                </small>
              )}
            </section>
          )}

          {/* In-Game Glass HUD */}
          {gameState === 'play' && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none z-10 font-ui">
              {/* Left: Candy Stash */}
              <div className="glass px-3 py-1.5 pointer-events-auto">
                <small className="block text-[0.66rem] text-[#FACE91]/65 leading-tight font-ui">
                  candy stash
                </small>
                <b className="font-disp text-2xl text-[#fff3dc] leading-none">
                  {score.toLocaleString()}
                </b>
              </div>

              {/* Center: Multiplier & Fill bar */}
              <div className="glass px-3 py-1.5 text-center min-w-[80px] pointer-events-auto">
                <span className="font-bold text-base text-[#F86903] leading-none block">
                  x{getMultiplier()}
                </span>
                <i className="block h-1 rounded-full bg-[#FACE91]/15 mt-1 overflow-hidden">
                  <u
                    className="block h-full transition-all duration-150"
                    style={{
                      width: `${getProgressToNextMultiplier()}%`,
                      background: 'linear-gradient(90deg, #F86903, #FACE91)',
                    }}
                  />
                </i>
              </div>

              {/* Right: Pumpkin Lives & Pause */}
              <div className="glass px-3 py-1.5 flex items-center gap-2.5 pointer-events-auto">
                <div className="flex items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`life-icon ${i < lives ? '' : 'lost'}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setGameState('pause')}
                  aria-label="Pause"
                  className="flex gap-1 p-1 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <s className="w-1 h-3.5 rounded-sm bg-[#FACE91] block" />
                  <s className="w-1 h-3.5 rounded-sm bg-[#FACE91] block" />
                </button>
              </div>
            </div>
          )}

          {/* Floating Powerup Pills */}
          {gameState === 'play' && (
            <div className="absolute left-3 top-[70px] flex flex-col gap-1.5 pointer-events-none z-10 font-ui">
              {magnetTimer > 0 && (
                <div className="glass py-1 px-3 rounded-full flex items-center gap-2 text-xs font-semibold text-[#c4b0ff]">
                  <b className="w-2.5 h-2.5 rounded-full bg-[#c4b0ff] block animate-pulse" />
                  <span>Moon Magnet ({Math.ceil(magnetTimer)}s)</span>
                </div>
              )}
              {rushTimer > 0 && (
                <div className="glass py-1 px-3 rounded-full flex items-center gap-2 text-xs font-semibold text-[#ffb347]">
                  <b className="w-2.5 h-2.5 rounded-full bg-[#ffb347] block animate-pulse" />
                  <span>Sugar Rush x2 ({Math.ceil(rushTimer)}s)</span>
                </div>
              )}
              {shieldTimer > 0 && (
                <div className="glass py-1 px-3 rounded-full flex items-center gap-2 text-xs font-semibold text-[#5eead4]">
                  <b className="w-2.5 h-2.5 rounded-full bg-[#5eead4] block animate-pulse" />
                  <span>Shield Up ({Math.ceil(shieldTimer)}s)</span>
                </div>
              )}
            </div>
          )}

          {/* Big Stage Banner Notification */}
          {stageBanner && (
            <div className="absolute left-0 right-0 top-[32%] text-center font-disp text-5xl text-[#fff3dc] drop-shadow-[0_8px_40px_#CE3D01] pointer-events-none z-20 animate-banner">
              {stageBanner}
            </div>
          )}

          {/* Pause Modal Overlay */}
          {gameState === 'pause' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
              <div className="glass text-center p-6 max-w-sm w-full flex flex-col items-center gap-3">
                <h2 className="font-disp text-3xl text-[#fff3dc] m-0">Touch grass for a sec?</h2>
                <p className="text-xs text-[#FACE91]/80 m-0">
                  Your candy is safe. The ghosts can wait.
                </p>

                <button
                  onClick={() => setGameState('play')}
                  className="btn-hunt w-full mt-2 cursor-pointer"
                >
                  Back in
                </button>

                <button
                  onClick={() => endCurrentRun()}
                  className="btn-alt w-full cursor-pointer"
                >
                  Wrap it up, I want my wish
                </button>

                <div className="flex gap-2 w-full mt-1">
                  <button
                    onClick={toggleSound}
                    className="btn-alt flex-1 text-xs py-2 cursor-pointer"
                  >
                    SFX: {isMuted ? 'off' : 'on'}
                  </button>
                  <button
                    onClick={toggleMusic}
                    className="btn-alt flex-1 text-xs py-2 cursor-pointer"
                  >
                    BGM: {isMusicEnabled ? 'on' : 'off'}
                  </button>
                </div>

                <button
                  onClick={() => setShowDriveModal(true)}
                  className="btn-alt w-full text-xs flex items-center justify-center gap-1.5 py-2 cursor-pointer text-amber-300 hover:text-white mt-1 border-amber-400/30"
                >
                  <Cloud className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simpan ke Google Drive</span>
                </button>

                <a
                  href="/kitzch-pop-halloween-game.zip"
                  download="kitzch-pop-halloween-game.zip"
                  className="btn-alt w-full text-xs flex items-center justify-center gap-1.5 py-2 cursor-pointer text-[#FACE91] hover:text-white mt-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh File Source Code (.ZIP)</span>
                </a>
              </div>
            </div>
          )}

          {/* End Screen / Fortune Drop Overlay */}
          {gameState === 'end' && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-gradient-to-b from-[#0a1215]/85 to-[#0a1215] backdrop-blur-md overflow-y-auto">
              <div className="w-full max-w-[400px] flex flex-col items-center text-center gap-3 py-4">
                {/* Wrapped candy box button to spin/unwrap */}
                {!isBoxUnwrapped ? (
                  <div
                    onClick={() => {
                      setIsBoxUnwrapped(true);
                      soundManager.voice(440, [800, 1150], 0.35, 1);
                    }}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <svg
                      viewBox="0 0 100 100"
                      className="w-32 h-32 animate-wobble filter drop-shadow-[0_12px_30px_rgba(248,105,3,0.5)] group-hover:scale-110 transition-transform"
                    >
                      <path d="M20 50 L5 30 L5 70 Z" fill="#F86903" />
                      <path d="M80 50 L95 30 L95 70 Z" fill="#F86903" />
                      <rect x="20" y="25" width="60" height="50" rx="12" fill="#CE3D01" />
                      <rect x="35" y="25" width="30" height="50" fill="#FACE91" opacity="0.3" />
                      <circle cx="50" cy="50" r="14" fill="#5eead4" />
                      <text x="50" y="55" fontSize="14" textAnchor="middle" fill="#0a1215" fontWeight="bold">🎃</text>
                    </svg>
                    <span className="font-ui font-bold text-sm text-[#FACE91]">
                      Tap to unwrap your Halloween fortune
                    </span>
                  </div>
                ) : (
                  fortuneDrop && (
                    <div
                      className={`glass p-6 w-full animate-pop-in border ${
                        fortuneDrop.rarity === 'mythic'
                          ? 'border-[#F86903] shadow-[0_0_70px_-12px_#F86903]'
                          : fortuneDrop.rarity === 'rare'
                          ? 'border-[#8b5cf6]'
                          : 'border-[#5eead4]'
                      }`}
                    >
                      {/* Rarity label badge */}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-ui mb-3 ${
                          fortuneDrop.rarity === 'mythic'
                            ? 'bg-gradient-to-r from-[#F86903] to-[#ffd36b] text-[#2a0900]'
                            : fortuneDrop.rarity === 'rare'
                            ? 'bg-[#8b5cf6] text-white'
                            : 'bg-[#5eead4] text-[#06201c]'
                        }`}
                      >
                        {fortuneDrop.label}
                      </span>

                      {/* Score headline */}
                      <div className="mb-2">
                        <small className="text-xs text-[#FACE91]/70 block font-ui">Candy Stash</small>
                        <b className="font-disp text-5xl text-[#fff3dc] leading-none block">
                          {endStats.finalScore.toLocaleString()}
                        </b>
                      </div>

                      {/* Fortune wish */}
                      <p className="my-4 text-base font-ui leading-relaxed text-[#FACE91] italic">
                        "{fortuneDrop.wish}"
                      </p>

                      {/* Stats strip */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/30 text-xs font-ui mb-4">
                        <div>
                          <span className="text-[#FACE91]/60 block text-[10px]">Best Streak</span>
                          <strong className="text-white font-mono">{endStats.bestStreak}x</strong>
                        </div>
                        <div>
                          <span className="text-[#FACE91]/60 block text-[10px]">Survived</span>
                          <strong className="text-white font-mono">{endStats.timeSurvived}s</strong>
                        </div>
                        <div>
                          <span className="text-[#FACE91]/60 block text-[10px]">Stage</span>
                          <strong className="text-white font-mono">{endStats.finalStage}</strong>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleStartHunt}
                          className="btn-hunt w-full text-sm cursor-pointer"
                        >
                          Play again
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowGrimoire(true)}
                            className="btn-alt flex-1 text-xs cursor-pointer flex items-center justify-center gap-1.5 py-2.5"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-[#5eead4]" />
                            <span>Grimoire</span>
                          </button>
                          <button
                            onClick={handleShareGame}
                            className="btn-alt flex-1 text-xs cursor-pointer flex items-center justify-center gap-1.5 py-2.5 text-[#FACE91] hover:text-white"
                          >
                            <Share2 className="w-3.5 h-3.5 text-[#F86903]" />
                            <span>Bagikan</span>
                          </button>
                        </div>
                        <button
                          onClick={() => setShowDriveModal(true)}
                          className="btn-alt w-full text-xs cursor-pointer flex items-center justify-center gap-1.5 py-2.5 text-amber-300 hover:text-white border-amber-400/30"
                        >
                          <Cloud className="w-3.5 h-3.5 text-amber-400" />
                          <span>Masukin ke Google Drive</span>
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wardrobe Modal */}
      <SkinSelectorModal
        isOpen={showWardrobe}
        onClose={() => setShowWardrobe(false)}
        currentSkin={activeSkin}
        onSelectSkin={(id) => {
          setActiveSkin(id);
          saveProfile({ activeSkin: id });
        }}
        bestScore={bestScore}
      />

      {/* Grimoire Modal */}
      <GrimoireModal
        isOpen={showGrimoire}
        onClose={() => setShowGrimoire(false)}
        collectedWishes={collectedWishes}
        achievements={ACHIEVEMENTS_LIST}
        totalCandies={totalCandies}
        bestScore={bestScore}
        bestStreak={bestStreakAllTime}
      />

      {/* Google Drive Modal */}
      <GoogleDriveModal
        isOpen={showDriveModal}
        onClose={() => setShowDriveModal(false)}
      />

      {/* Toast Notification for Sharing */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FACE91] text-[#0a1215] font-ui font-bold text-xs shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <Check className="w-4 h-4 text-emerald-800 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
