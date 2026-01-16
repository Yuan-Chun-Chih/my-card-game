import React from 'react';
import { clsx } from 'clsx';
import type { CardDef, CardInstance } from '../game/types';

interface CardProps {
  card: CardDef | CardInstance | null;
  variant?: 'HAND' | 'FIELD' | 'ENERGY' | 'TERRITORY' | 'HIDDEN';
  onClick?: () => void;
  isSelected?: boolean;
}

export const Card: React.FC<CardProps> = ({
  card,
  variant = 'FIELD',
  onClick,
  isSelected
}) => {
  if (!card) {
    return (
      <div
        className={clsx(
          'border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/30 transition-all box-border',
          variant === 'ENERGY' ? 'w-16 h-24' : 'w-24 h-32',
          'flex items-center justify-center text-gray-700 text-xs'
        )}
      >
        Slot
      </div>
    );
  }

  const isFaceDown = ('isFaceDown' in card && card.isFaceDown) || variant === 'HIDDEN';

  if (isFaceDown) {
    return (
      <div
        onClick={onClick}
        className={clsx(
          'rounded-lg border-2 border-slate-600 bg-slate-800 shadow-lg cursor-pointer transition-transform hover:scale-105 box-border',
          "bg-[url('/assets/backs/card_back.png')] bg-cover bg-center",
          variant === 'ENERGY' ? 'w-16 h-24' : 'w-24 h-32'
        )}
      >
        {!card.image && (
          <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold opacity-10 rotate-45 select-none">
            BACK
          </div>
        )}
      </div>
    );
  }

  const bpValue = (card as CardInstance).currentBP ?? (card as CardDef).bp;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative flex flex-col rounded-lg border-2 transition-all cursor-pointer shadow-lg select-none overflow-hidden bg-gray-900 box-border',
        variant === 'HAND' && 'w-32 h-44 hover:-translate-y-4 z-10',
        variant === 'FIELD' && 'w-24 h-32',
        variant === 'ENERGY' && 'w-16 h-24',
        variant === 'TERRITORY' && 'w-full h-full',
        isSelected ? 'border-yellow-400 ring-4 ring-yellow-400/30 scale-105' : 'border-gray-600 hover:border-gray-400'
      )}
    >
      <div className="w-full flex justify-between items-center px-1 bg-gray-800 text-white text-[10px] h-6 border-b border-gray-700 z-10">
        <div className="flex items-center justify-center w-5 h-5 bg-blue-600 rounded-full font-bold shadow-sm text-xs">
          {card.cost}
        </div>
        <span className="truncate flex-1 text-center font-bold px-1 text-gray-200">{card.name}</span>
      </div>

      {card.keywords && card.keywords.length > 0 && (
        <div className="absolute top-7 right-1 flex flex-col gap-1 items-end z-20 pointer-events-none">
          {card.keywords.includes('RUSH') && (
            <span className="bg-yellow-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">RUSH</span>
          )}
          {card.keywords.includes('GUARD') && (
            <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">GUARD</span>
          )}
        </div>
      )}

      <div className="relative w-full flex-1 bg-gray-800 group overflow-hidden">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 p-2 text-center">
            <span className="text-xs opacity-50">No Image</span>
            <p className="text-[9px] mt-1 opacity-80 line-clamp-4 px-1">{card.description}</p>
          </div>
        )}

        <div className="absolute inset-0 bg-black/90 p-2 text-[10px] text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-center z-30">
          {card.description}
        </div>
      </div>

      {card.type === 'UNIT' && bpValue !== undefined && (
        <div className="w-full h-8 bg-gray-900 border-t border-gray-700 flex items-center justify-center z-10">
          <div className="flex items-center gap-1 text-yellow-500 font-black text-lg tracking-wider drop-shadow-md">
            <span className="text-sm">BP</span>
            {bpValue}
          </div>
        </div>
      )}
    </div>
  );
};
