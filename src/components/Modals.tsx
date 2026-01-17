import React from 'react';
import { clsx } from 'clsx';
import { Card } from './Card';

export const HandActionModal = ({
  card,
  phase,
  isMainPhase,
  isBlockingPhase,
  isResponsePhase,
  canSummon,
  canFlash,
  canCastSpell,
  canCastInstant,
  onPlayEnergy,
  onPlayUnit,
  onPlayFlash,
  onPlaySpell,
  onPlayInstant,
  onTargeting,
  onCancel
}: any) => (
  <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm" onClick={onCancel}>
    <div className="mb-4 scale-125" onClick={(e) => e.stopPropagation()}>
      <Card card={card} variant="HAND" />
    </div>
    <div className="flex flex-col gap-3 w-64" onClick={(e) => e.stopPropagation()}>
      {isMainPhase && (
        <button onClick={onPlayEnergy} className="w-full py-3 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white font-bold shadow-lg flex justify-center items-center gap-2">
          Place as Energy
        </button>
      )}
      {card.type === 'UNIT' && (
        <button
          onClick={onPlayUnit}
          disabled={!canSummon}
          className={clsx(
            'w-full py-3 rounded-lg font-bold border flex justify-center items-center gap-2',
            canSummon ? 'bg-blue-600 hover:bg-blue-500 border-blue-400' : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
          )}
        >
          Summon Unit
        </button>
      )}
      {card.type === 'UNIT' && (
        <button
          onClick={onPlayFlash}
          disabled={!canFlash}
          className={clsx(
            'w-full py-3 rounded-lg font-bold border flex justify-center items-center gap-2',
            canFlash ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400' : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
          )}
        >
          Flash Summon
        </button>
      )}
      {(card.type === 'SPELL' || card.type === 'SPELL_INSTANT') && (
        <>
          <button
            onClick={card.type === 'SPELL' ? onPlaySpell : onPlayInstant}
            disabled={card.type === 'SPELL' ? !canCastSpell : !canCastInstant}
            className={clsx(
              'w-full py-3 rounded-lg font-bold border flex justify-center items-center gap-2',
              (card.type === 'SPELL' ? canCastSpell : canCastInstant)
                ? 'bg-purple-600 border-purple-400'
                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
            )}
          >
            Cast Now
          </button>
          <button
            onClick={() => onTargeting('HAND_SPELL')}
            disabled={card.type === 'SPELL' ? !canCastSpell : !canCastInstant}
            className={clsx(
              'w-full py-3 rounded-lg font-bold border flex justify-center items-center gap-2',
              (card.type === 'SPELL' ? canCastSpell : canCastInstant)
                ? 'bg-indigo-600 border-indigo-400'
                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
            )}
          >
            Choose Target
          </button>
        </>
      )}
      <button onClick={onCancel} className="w-full py-2 rounded-lg border border-gray-600 text-gray-400 hover:bg-gray-800">
        Cancel
      </button>
      {!isMainPhase && !isBlockingPhase && !isResponsePhase && (
        <div className="text-[10px] text-white/40 text-center">Some actions are restricted right now.</div>
      )}
    </div>
  </div>
);

export const UnitActionModal = ({ unit, phase, onAttack, onEffect, onCancel }: any) => (
  <div className="absolute inset-0 z-50 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm" onClick={onCancel}>
    <div className="bg-gray-900 border border-gray-600 p-6 rounded-xl shadow-2xl flex flex-col gap-4 w-64" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-center font-bold text-lg mb-2 text-white">{unit.name}</h3>
      <button
        disabled={phase !== 'main' || unit.isTapped}
        onClick={onAttack}
        className={clsx(
          'py-3 rounded font-bold flex items-center justify-center gap-2',
          phase === 'main' && !unit.isTapped ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        )}
      >
        Declare Attack
      </button>
      <button onClick={onEffect} className="py-3 rounded font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg">
        Use Effect
      </button>
      <button onClick={onCancel} className="py-2 text-gray-400 hover:text-white mt-2">
        Cancel
      </button>
    </div>
  </div>
);

export const BlockingWarning = ({ onSkip }: any) => (
  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex justify-center">
    <div className="bg-red-900/80 border border-red-500 p-4 rounded text-center pointer-events-auto shadow-2xl animate-pulse">
      <p className="font-bold mb-2 text-white text-xl">Blocking Phase</p>
      <p className="text-sm text-red-200 mb-4">Choose a blocker or skip to take damage.</p>
      <button onClick={onSkip} className="bg-gray-800 px-6 py-2 rounded border border-gray-600 hover:bg-gray-700 text-white font-bold">
        Skip Block
      </button>
    </div>
  </div>
);
