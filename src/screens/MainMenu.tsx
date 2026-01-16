import React from 'react';
import { clsx } from 'clsx';

type Screen = 'menu' | 'single' | 'online' | 'deck';

interface MainMenuProps {
  onSelect: (screen: Screen) => void;
  onExit: () => void;
}

const MenuButton = ({
  label,
  tone = 'gold',
  onClick,
  sub
}: {
  label: string;
  tone?: 'gold' | 'blue' | 'red';
  onClick: () => void;
  sub?: string;
}) => (
  <button
    onClick={onClick}
    className={clsx(
      'group relative w-full text-left px-6 py-4 rounded-2xl border transition-all duration-300',
      'backdrop-blur bg-white/5 hover:bg-white/10',
      tone === 'gold' && 'border-amber-400/50 hover:border-amber-300 text-amber-100',
      tone === 'blue' && 'border-sky-400/40 hover:border-sky-300 text-sky-100',
      tone === 'red' && 'border-rose-400/40 hover:border-rose-300 text-rose-100'
    )}
  >
    <div className="text-lg font-semibold tracking-wide">{label}</div>
    {sub && <div className="text-xs uppercase tracking-[0.3em] text-white/50 mt-1">{sub}</div>}
    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
  </button>
);

export const MainMenu: React.FC<MainMenuProps> = ({ onSelect, onExit }) => {
  return (
    <div className="min-h-screen w-full aether-bg relative overflow-hidden">
      <div className="aether-grid" />
      <div className="aether-orb orb-left" />
      <div className="aether-orb orb-right" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center mb-10 animate-fade-up">
          <div className="text-xs uppercase tracking-[0.6em] text-amber-200/70 mb-4">Planar Collision</div>
          <h1 className="aether-title text-5xl md:text-6xl lg:text-7xl">Aether Nexus</h1>
          <p className="text-sm md:text-base text-white/70 max-w-lg mx-auto mt-4">
            Choose your mode and shape the clash between Sanctum, Verdant, Arcane, and Nightmare.
          </p>
        </div>

        <div className="w-full max-w-md space-y-4 animate-stagger">
          <MenuButton
            label="Single Player"
            sub="Local duel"
            onClick={() => onSelect('single')}
          />
          <MenuButton
            label="Online Multiplayer"
            sub="Coming soon"
            tone="blue"
            onClick={() => onSelect('online')}
          />
          <MenuButton
            label="Deck Editor"
            sub="Manage decks"
            tone="gold"
            onClick={() => onSelect('deck')}
          />
          <MenuButton
            label="Exit Game"
            sub="Close client"
            tone="red"
            onClick={onExit}
          />
        </div>

        <div className="mt-12 text-xs uppercase tracking-[0.4em] text-white/30">
          v0.1 Pre-Alpha
        </div>
      </div>
    </div>
  );
};
