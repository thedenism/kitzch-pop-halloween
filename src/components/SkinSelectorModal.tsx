import React from 'react';
import { X, Check, Lock } from 'lucide-react';
import { PlayerSkin, PlayerSkinId } from '../types/game';

interface SkinSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkin: PlayerSkinId;
  onSelectSkin: (skinId: PlayerSkinId) => void;
  bestScore: number;
}

export const SKINS_LIST: PlayerSkin[] = [
  {
    id: 'classic',
    name: 'Classic Kitzch',
    desc: 'The original iconic smiling harvest jack-o’-lantern.',
    emoji: '🎃',
    unlockScore: 0,
    primaryColor: '#F86903',
    accentColor: '#FACE91',
  },
  {
    id: 'cauldron',
    name: 'Witch’s Cauldron',
    desc: 'Heavy cast iron pot bubbling with glowing emerald slime.',
    emoji: '🍵',
    unlockScore: 200,
    primaryColor: '#22c55e',
    accentColor: '#86efac',
  },
  {
    id: 'ghost',
    name: 'Boba Ghost',
    desc: 'Translucent floating sheet ghost with glowing pink blush.',
    emoji: '👻',
    unlockScore: 500,
    primaryColor: '#5eead4',
    accentColor: '#ffffff',
  },
  {
    id: 'cat',
    name: 'Midnight Familiar',
    desc: 'Mysterious black cat basket with pointed ears & golden eyes.',
    emoji: '🐱',
    unlockScore: 1000,
    primaryColor: '#0a1215',
    accentColor: '#facc15',
  },
  {
    id: 'vampire',
    name: 'Count Pumpkula',
    desc: 'Aristocratic vampire pumpkin with fluttering bat wings & sharp fangs.',
    emoji: '🧛',
    unlockScore: 1800,
    primaryColor: '#860000',
    accentColor: '#F86903',
  },
];

export const SkinSelectorModal: React.FC<SkinSelectorModalProps> = ({
  isOpen,
  onClose,
  currentSkin,
  onSelectSkin,
  bestScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0d1d20] border border-[#FACE91]/20 rounded-[28px] p-6 shadow-2xl text-[#FACE91] flex flex-col font-ui">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#FACE91]/15">
          <div>
            <h2 className="font-disp text-2xl text-[#fff3dc] m-0">Pumpkin Wardrobe</h2>
            <p className="text-xs text-[#FACE91]/70 m-0 mt-0.5">
              Unlock unique characters with your high score stash!
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Wardrobe"
            className="p-1.5 rounded-full hover:bg-white/10 text-[#FACE91]/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Skins list */}
        <div className="my-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {SKINS_LIST.map((s) => {
            const isUnlocked = bestScore >= s.unlockScore;
            const isSelected = currentSkin === s.id;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (isUnlocked) onSelectSkin(s.id);
                }}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  !isUnlocked
                    ? 'opacity-50 bg-black/20 border-white/5 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#F86903]/20 border-[#F86903] shadow-md cursor-pointer'
                    : 'bg-black/30 border-white/10 hover:border-[#FACE91]/40 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl shadow-inner">
                    {s.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm m-0">{s.name}</h4>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[#F86903] bg-[#F86903]/15 px-1.5 py-0.2 rounded border border-[#F86903]/30">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#FACE91]/70 m-0 mt-0.5 leading-snug">
                      {s.desc}
                    </p>
                  </div>
                </div>

                <div className="pl-2">
                  {!isUnlocked ? (
                    <div className="flex items-center gap-1 text-xs text-white/40 font-mono">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{s.unlockScore}</span>
                    </div>
                  ) : isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#F86903] flex items-center justify-center text-[#2a0900]">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSkin(s.id);
                      }}
                      className="btn-alt text-xs py-1 px-3"
                    >
                      Equip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#FACE91]/15 flex items-center justify-between text-xs text-[#FACE91]/70">
          <span>Personal Best: <strong className="font-mono text-white">{bestScore}</strong></span>
          <button
            onClick={onClose}
            className="btn-hunt text-xs py-2 px-5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
