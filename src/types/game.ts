export type ItemCategory = 'gum' | 'pop' | 'wrap' | 'star' | 'apple' | 'moon' | 'bolt' | 'ring' | 'curse' | 'pinata';

export type DropRarity = 'common' | 'rare' | 'mythic';

export interface DropFortune {
  id: string;
  rarity: DropRarity;
  label: string;
  wish: string;
  unlockedAt?: string;
}

export type PlayerSkinId = 'classic' | 'cauldron' | 'ghost' | 'cat' | 'vampire';

export interface PlayerSkin {
  id: PlayerSkinId;
  name: string;
  desc: string;
  emoji: string;
  unlockScore: number;
  primaryColor: string;
  accentColor: string;
}

export interface KitzchItem {
  id: string;
  type: ItemCategory;
  x: number;
  y: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  color: string;
  isJackpot?: boolean;
}

export interface KitzchParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  isSpark: boolean;
  shape?: 'circle' | 'spark' | 'star';
}

export interface FloatingPopText {
  id: string;
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
  scale?: number;
}

export interface AmbientBat {
  x: number;
  y: number;
  vx: number;
  size: number;
  phase: number;
}

export interface AmbientCloud {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
  alpha: number;
}

export interface AmbientFirefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  color: string;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  isUnlocked: boolean;
}

export interface PlayerProfile {
  bestScore: number;
  totalCandiesCaught: number;
  bestStreak: number;
  gamesPlayed: number;
  unlockedSkins: PlayerSkinId[];
  activeSkin: PlayerSkinId;
  collectedWishes: string[]; // wish texts unlocked
  achievements: string[]; // achievement ids
}
