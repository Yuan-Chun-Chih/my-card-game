import React from 'react';
import { clsx } from 'clsx';
import type { CardInstance, PlayerState } from '../game/types';
import { Card } from './Card';
import { DeckZone, GraveZone, LifeZone } from './ZoneComponents';

interface PlayerAreaProps {
  player: PlayerState;
  isOpponent: boolean;
  selectedHandIndex?: number | null;
  onHandClick?: (index: number) => void;
  onFieldClick: (index: number) => void;
  isBlockingPhase?: boolean;
  targetingSource?: unknown;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  isOpponent,
  selectedHandIndex,
  onHandClick,
  onFieldClick,
  isBlockingPhase
}) => {
  return (
    <div className={clsx('flex w-full h-[40vh] p-2 relative', isOpponent ? 'bg-red-900/10 items-start' : 'bg-blue-900/10 items-end')}>
      <div className="w-24 flex flex-col items-center gap-4 z-20 mx-4">
        <div className="w-16 h-16 bg-gray-700 rounded-full border-2 border-gray-500 flex items-center justify-center font-bold text-xl shadow-lg">
          {isOpponent ? 'OP' : 'ME'}
        </div>
        <LifeZone count={player.lifeZone.length} />
      </div>

      <div className="flex-1 flex flex-col h-full relative">
        <div className={clsx('flex gap-2 justify-center mb-2 z-30 absolute w-full', isOpponent ? '-top-6' : 'bottom-4')}>
          {player.hand.map((card: CardInstance, index: number) => (
            <div
              key={card.instanceId ?? index}
              className={clsx('transition-all', !isOpponent && selectedHandIndex === index && '-translate-y-6 scale-110', isOpponent && 'scale-75')}
            >
              <Card
                card={card}
                variant={isOpponent ? 'HIDDEN' : 'HAND'}
                onClick={() => !isOpponent && onHandClick?.(index)}
                isSelected={!isOpponent && selectedHandIndex === index}
              />
            </div>
          ))}
        </div>

        <div className={clsx('flex gap-2 justify-center items-center absolute w-full opacity-90 z-20', isOpponent ? 'top-20' : 'bottom-32')}>
          <span className="text-[10px] text-gray-400 font-bold w-8 text-right">ENG</span>
          {player.energyZone.map((card, idx) => (
            <Card key={card.instanceId ?? idx} card={card} variant="ENERGY" />
          ))}
        </div>

        <div className={clsx('flex gap-4 justify-center px-8 z-10 absolute w-full', isOpponent ? 'bottom-2' : 'top-2')}>
          {player.battleZone.map((card, index) => (
            <div key={index} className="relative w-24 h-32">
              {card ? (
                <div className={clsx('transition-all duration-300', card.isTapped && 'rotate-12 translate-y-2 brightness-75')}>
                  <Card card={card} variant="FIELD" onClick={() => onFieldClick(index)} />
                  {isBlockingPhase && !isOpponent && !card.isTapped && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                      BLOCK
                    </div>
                  )}
                  {card.isTapped && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="bg-black/70 text-[10px] px-1 rounded">REST</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full border border-dashed border-gray-800 rounded-lg flex items-center justify-center text-xs text-gray-800">
                  Slot {index}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-24 flex flex-col items-center gap-4 z-20 mx-4">
        <DeckZone count={player.deck.length} />
        <GraveZone count={player.graveyard.length} />
      </div>
    </div>
  );
};
