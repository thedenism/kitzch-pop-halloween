import React, { useState } from 'react';
import { X, BookOpen, Trophy, Sparkles, Award } from 'lucide-react';
import { Achievement, DropRarity } from '../types/game';

interface GrimoireModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectedWishes: string[];
  achievements: Achievement[];
  totalCandies: number;
  bestScore: number;
  bestStreak: number;
}

const ALL_WISHES: { text: string; rarity: DropRarity; label: string }[] = [
  { text: 'May your fits go hard and your Wi-Fi never lag.', rarity: 'common', label: 'Common Drop' },
  { text: 'Main character energy all year. Zero NPC moments.', rarity: 'common', label: 'Common Drop' },
  { text: 'May your crush reply in under five minutes.', rarity: 'common', label: 'Common Drop' },
  { text: 'May every song you shuffle absolutely slap.', rarity: 'common', label: 'Common Drop' },
  { text: 'Hope your sleep schedule heals. We believe in you.', rarity: 'common', label: 'Common Drop' },
  { text: 'A glow-up so loud the group chat needs a minute.', rarity: 'rare', label: 'Rare Drop' },
  { text: 'Your next plot twist is an absolute W, no notes.', rarity: 'rare', label: 'Rare Drop' },
  { text: 'Free rent in everyone’s head, but make it flattering.', rarity: 'rare', label: 'Rare Drop' },
  { text: 'One free pass on a bad hair day. Use it wisely.', rarity: 'rare', label: 'Rare Drop' },
  { text: 'The moon says you’re the plot. Everything you touch turns iconic, fr fr.', rarity: 'mythic', label: 'Mythic Drop' },
  { text: 'Wish granted: a whole year of rich, happy and unbothered. Periodt.', rarity: 'mythic', label: 'Mythic Drop' },
  { text: 'Legend status unlocked. The universe is on your side, no cap.', rarity: 'mythic', label: 'Mythic Drop' },
];

export const GrimoireModal: React.FC<GrimoireModalProps> = ({
  isOpen,
  onClose,
  collectedWishes,
  achievements,
  totalCandies,
  bestScore,
  bestStreak,
}) => {
  const [activeTab, setActiveTab] = useState<'wishes' | 'achievements'>('wishes');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[85vh] bg-[#0d1d20] border border-[#FACE91]/20 rounded-[28px] p-6 shadow-2xl text-[#FACE91] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FACE91]/15">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#F86903]" />
            <h2 className="font-disp text-2xl text-[#fff3dc] m-0">Fortune Grimoire</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Grimoire"
            className="p-1.5 rounded-full hover:bg-white/10 text-[#FACE91]/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 my-3.5 p-3 rounded-2xl bg-black/40 border border-[#FACE91]/10 text-center font-ui">
          <div>
            <span className="text-[10px] text-[#FACE91]/60 block uppercase">All-Time Stash</span>
            <strong className="text-sm font-mono text-white">{totalCandies.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#FACE91]/60 block uppercase">Best Record</span>
            <strong className="text-sm font-mono text-[#F86903]">{bestScore.toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-[10px] text-[#FACE91]/60 block uppercase">Max Streak</span>
            <strong className="text-sm font-mono text-[#5eead4]">{bestStreak}x</strong>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-black/30 rounded-xl mb-3 font-ui text-xs font-semibold">
          <button
            onClick={() => setActiveTab('wishes')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'wishes'
                ? 'bg-[#F86903] text-[#2a0900] shadow-sm'
                : 'text-[#FACE91]/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unlocked Fortunes ({collectedWishes.length}/{ALL_WISHES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'achievements'
                ? 'bg-[#F86903] text-[#2a0900] shadow-sm'
                : 'text-[#FACE91]/70 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Spooky Badges</span>
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-ui text-xs">
          {activeTab === 'wishes' ? (
            ALL_WISHES.map((w, idx) => {
              const isFound = collectedWishes.includes(w.text);
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    isFound
                      ? w.rarity === 'mythic'
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                        : w.rarity === 'rare'
                        ? 'bg-purple-950/20 border-purple-500/40 text-purple-200'
                        : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-black/20 border-white/5 opacity-40 text-[#FACE91]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        !isFound
                          ? 'bg-white/10 text-[#FACE91]/50'
                          : w.rarity === 'mythic'
                          ? 'bg-[#F86903] text-[#2a0900]'
                          : w.rarity === 'rare'
                          ? 'bg-[#8b5cf6] text-white'
                          : 'bg-[#5eead4] text-[#06201c]'
                      }`}
                    >
                      {isFound ? w.label : 'Locked Fortune'}
                    </span>
                    <span className="text-[10px] text-white/50">#{idx + 1}</span>
                  </div>
                  <p className="italic text-[13px] leading-relaxed m-0 mt-1">
                    {isFound ? `"${w.text}"` : '??? Play more games to unwrap this mysterious fortune.'}
                  </p>
                </div>
              );
            })
          ) : (
            achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  ach.isUnlocked
                    ? 'bg-black/40 border-[#F86903]/40'
                    : 'bg-black/20 border-white/5 opacity-50'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                  {ach.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-xs m-0">{ach.title}</h4>
                    {ach.isUnlocked && (
                      <span className="text-[10px] font-bold text-[#5eead4] bg-[#5eead4]/10 px-1.5 py-0.5 rounded">
                        UNLOCKED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#FACE91]/70 m-0 mt-0.5 leading-snug">
                    {ach.desc}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-2 border-t border-[#FACE91]/15 flex justify-end">
          <button
            onClick={onClose}
            className="btn-alt text-xs py-2 px-5"
          >
            Close Grimoire
          </button>
        </div>
      </div>
    </div>
  );
};
