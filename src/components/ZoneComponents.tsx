import React from 'react';
import type { CardInstance } from '../game/types';

export const DeckZone = ({ count }: { count: number }) => (
  <div className="relative w-16 h-24 group cursor-pointer">
    {count > 0 ? (
      <div className="absolute top-0 left-0 w-full h-full bg-slate-700 border-2 border-slate-500 rounded bg-[url('/assets/backs/card_back.png')] bg-cover shadow-xl flex items-center justify-center">
        <span className="text-white font-bold drop-shadow-md">{count}</span>
      </div>
    ) : (
      <div className="w-full h-full border-2 border-dashed border-gray-600 rounded flex items-center justify-center opacity-30">
        Empty
      </div>
    )}
    <span className="absolute -bottom-4 left-0 w-full text-center text-[10px] text-gray-400">DECK</span>
  </div>
);

export const GraveZone = ({ count }: { count: number }) => (
  <div className="relative w-16 h-24 border-2 border-gray-700 bg-black/40 rounded flex items-center justify-center">
    <span className="text-gray-500 text-xs">Grave ({count})</span>
  </div>
);

export const LifeZone = ({ count }: { count: number }) => (
  <div className="relative w-16 h-24">
    {count > 0 ? (
      <div className="w-full h-full bg-red-900/80 border-2 border-red-500 rounded bg-[url('/assets/backs/card_back.png')] bg-cover flex items-center justify-center shadow-lg">
        <span className="text-2xl font-bold text-red-500">{count}</span>
      </div>
    ) : (
      <div className="w-full h-full border-dashed border-red-900 rounded flex items-center justify-center">X</div>
    )}
    <span className="absolute -bottom-4 left-0 w-full text-center text-[10px] text-red-400 font-bold">LIFE</span>
  </div>
);

export const SharedTerritoryZone = ({
  activeTerritory,
  nextTerritory,
  remaining
}: {
  activeTerritory: CardInstance | null;
  nextTerritory: CardInstance | null;
  remaining: { p0: number; p1: number };
}) => (
  <div className="flex items-center gap-4">
    <div className="text-[10px] text-gray-500 font-mono text-right">
      P0 LEFT<br />{remaining.p0}
    </div>
    <div className="relative transition-all duration-500 group">
      {activeTerritory ? (
        <div className="w-20 h-28 border border-yellow-500/50 rounded bg-gray-900 overflow-hidden relative shadow-lg shadow-yellow-900/20 group-hover:scale-125 group-hover:z-20 transition-transform">
          {activeTerritory.image && <img src={activeTerritory.image} className="w-full h-full object-cover opacity-60" />}
          <div className="absolute inset-0 flex items-center justify-center text-[9px] text-center p-1 font-bold text-yellow-500 leading-tight">
            {activeTerritory.description}
          </div>
        </div>
      ) : (
        <div className="w-20 h-28 border border-gray-700 rounded bg-slate-800 bg-[url('/assets/backs/card_back.png')] bg-cover opacity-30 grayscale group-hover:scale-125 transition-transform"></div>
      )}
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-mono">
        ACTIVE
      </span>
    </div>
    <div className="relative transition-all duration-500 group">
      {nextTerritory ? (
        <div className="w-16 h-24 border border-sky-400/40 rounded bg-gray-900 overflow-hidden relative shadow-lg shadow-sky-900/20 group-hover:scale-125 group-hover:z-20 transition-transform">
          {nextTerritory.image && <img src={nextTerritory.image} className="w-full h-full object-cover opacity-60" />}
          <div className="absolute inset-0 flex items-center justify-center text-[8px] text-center p-1 font-bold text-sky-300 leading-tight">
            {nextTerritory.name}
          </div>
        </div>
      ) : (
        <div className="w-16 h-24 border border-gray-700 rounded bg-slate-800 bg-[url('/assets/backs/card_back.png')] bg-cover opacity-30 grayscale group-hover:scale-125 transition-transform"></div>
      )}
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 font-mono">
        NEXT
      </span>
    </div>
    <div className="text-[10px] text-gray-500 font-mono text-left">
      P1 LEFT<br />{remaining.p1}
    </div>
  </div>
);
