import React from 'react';

interface OnlineLobbyProps {
  onBack: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen w-full aether-bg relative overflow-hidden">
      <div className="aether-grid" />
      <div className="aether-orb orb-left" />
      <div className="aether-orb orb-right" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-xs uppercase tracking-[0.6em] text-sky-200/70 mb-3">Online Nexus</div>
        <h2 className="aether-title text-4xl md:text-5xl mb-4">Multiplayer Coming Soon</h2>
        <p className="text-sm md:text-base text-white/70 max-w-lg">
          The dimensional gates are warming up. Matchmaking, rooms, and ranked ladders will arrive in a later build.
        </p>
        <button
          onClick={onBack}
          className="mt-8 px-6 py-3 rounded-full border border-white/20 text-sm uppercase tracking-widest text-white/70 hover:text-white hover:border-white/40 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
};
