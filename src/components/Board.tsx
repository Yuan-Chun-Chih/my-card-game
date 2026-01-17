import React, { useState } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import { clsx } from 'clsx';
import type { CardInstance, GameState, PlayerID } from '../game/types';
import { SharedTerritoryZone } from './ZoneComponents';
import { HandActionModal, UnitActionModal, BlockingWarning } from './Modals';
import { PlayerArea } from './PlayerArea';

type TargetingSource =
  | { type: 'HAND_SPELL'; index: number; card: CardInstance }
  | { type: 'UNIT_EFFECT'; slot: number; card: CardInstance }
  | { type: 'UNIT_EFFECT_ENERGY'; slot: number; card: CardInstance }
  | { type: 'FLASH_SUMMON'; index: number; card: CardInstance }
  | null;

interface MyBoardProps extends BoardProps<GameState> {}

export const CardGameBoard: React.FC<MyBoardProps> = ({ G, ctx, moves, playerID }) => {
  const viewID: PlayerID = (playerID ?? ctx.currentPlayer) as PlayerID;
  const opID: PlayerID = viewID === '0' ? '1' : '0';
  const me = G.players[viewID];
  const opponent = G.players[opID];

  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [selectedFieldSlot, setSelectedFieldSlot] = useState<number | null>(null);
  const [targetingSource, setTargetingSource] = useState<TargetingSource>(null);

  const currentPhase = ctx.phase;
  const isMyTurn = playerID !== undefined && ctx.currentPlayer === playerID;
  const phaseLabel = isMyTurn ? currentPhase : `opponent ${currentPhase}`;
  const isBlockingPhase = typeof playerID === 'string' && ctx.activePlayers?.[playerID] === 'blocking';
  const isResponsePhase = typeof playerID === 'string' && ctx.activePlayers?.[playerID] === 'response';
  const isDeploymentPhase = typeof playerID === 'string' && ctx.activePlayers?.[playerID] === 'deployment';
  const isMainPhase = isMyTurn && !isBlockingPhase && !isResponsePhase && !isDeploymentPhase && currentPhase === 'main';

  const selectedCard = selectedHandIndex !== null ? me.hand[selectedHandIndex] : null;

  const startTargeting = (source: TargetingSource) => {
    setTargetingSource(source);
    setSelectedHandIndex(null);
    setSelectedFieldSlot(null);
  };

  const handleFieldClick = (isOpponent: boolean, slotIndex: number) => {
    if (targetingSource) {
      if (targetingSource.type === 'FLASH_SUMMON') {
        if (isOpponent) return;
        moves.playUnitInstantWithSacrifice(targetingSource.index, slotIndex);
        setTargetingSource(null);
        return;
      }
      if (targetingSource.type === 'UNIT_EFFECT_ENERGY') {
        return;
      }
      const targetPlayerID = isOpponent ? opID : viewID;
      if (targetingSource.type === 'HAND_SPELL') {
        if (targetingSource.card.type === 'SPELL') {
          moves.playSpell(targetingSource.index, slotIndex, targetPlayerID);
        } else if (targetingSource.card.type === 'SPELL_INSTANT') {
          moves.playInstant(targetingSource.index, slotIndex, targetPlayerID);
        }
      } else if (targetingSource.type === 'UNIT_EFFECT') {
        moves.useUnitEffect(targetingSource.slot, slotIndex, targetPlayerID);
      }
      setTargetingSource(null);
      return;
    }

    if (isOpponent) return;
    if (isDeploymentPhase) return;

    if (isBlockingPhase) {
      moves.block(slotIndex);
    } else if (isMyTurn) {
      setSelectedFieldSlot(slotIndex);
    }
  };

  if (ctx.gameover) {
    const isWinner = typeof playerID === 'string' && ctx.gameover.winner === playerID;
    return (
      <div className="flex flex-col items-center justify-center w-full h-screen bg-black text-white z-50">
        <h1 className={clsx('text-6xl font-black mb-4', isWinner ? 'text-yellow-500' : 'text-gray-500')}>
          {isWinner ? 'VICTORY' : 'DEFEAT'}
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          {isWinner ? 'You win.' : `Defeat. (${ctx.gameover.reason})`}
        </p>
        <button onClick={() => window.location.reload()} className="px-8 py-3 bg-blue-600 rounded-full font-bold">
          Play Again
        </button>
      </div>
    );
  }

  const remainingTerritories = {
    p0: G.territoryDecks?.['0']?.length ?? 0,
    p1: G.territoryDecks?.['1']?.length ?? 0
  };
  const nextTerritory = G.territoryDecks?.[ctx.currentPlayer]?.[0] ?? null;

  return (
    <div className="relative flex flex-col w-full h-screen bg-[#121212] overflow-hidden text-white select-none font-sans">
      {targetingSource && (
        <div className="absolute inset-0 z-40 cursor-crosshair flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-black/70 px-6 py-4 rounded-xl border border-yellow-500 animate-pulse pointer-events-auto">
            <h2 className="text-xl font-bold text-yellow-500 mb-1">
              {targetingSource.type === 'UNIT_EFFECT_ENERGY' ? 'Select an energy unit' : 'Select a target'}
            </h2>
            <button onClick={() => setTargetingSource(null)} className="px-4 py-1 bg-gray-700 rounded text-xs text-white">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isBlockingPhase && <BlockingWarning onSkip={() => moves.skipBlock()} />}
      {isDeploymentPhase && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex justify-center">
          <div className="bg-black/80 p-4 rounded-xl border border-amber-400/50 text-center shadow-[0_0_20px_rgba(251,191,36,0.3)] pointer-events-auto">
            <h3 className="text-amber-100 text-lg mb-2 font-bold tracking-widest">DEPLOYMENT PHASE</h3>
            <p className="text-white/60 text-xs mb-4">Click energy cards to return them to hand.</p>
            <button
              onClick={() => moves.endDeployment()}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-full uppercase tracking-widest transition-all"
            >
              Start Main Phase
            </button>
          </div>
        </div>
      )}
      {isResponsePhase && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none flex justify-center">
          <div className="bg-indigo-900/80 border border-indigo-400 p-4 rounded text-center pointer-events-auto shadow-2xl animate-pulse">
            <p className="font-bold mb-2 text-white text-lg">Response Window</p>
            <p className="text-sm text-indigo-200 mb-4">Cast an instant or pass priority.</p>
            <button
              onClick={() => moves.passResponse()}
              className="bg-gray-800 px-6 py-2 rounded border border-gray-600 hover:bg-gray-700 text-white font-bold"
            >
              Pass
            </button>
          </div>
        </div>
      )}

      {selectedHandIndex !== null && selectedCard && !targetingSource && !isDeploymentPhase && (
        <HandActionModal
          card={selectedCard}
          phase={currentPhase}
          isMainPhase={isMainPhase}
          isBlockingPhase={isBlockingPhase}
          isResponsePhase={isResponsePhase}
          canSummon={
            isMainPhase &&
            selectedCard.type === 'UNIT' &&
            me.energyZone.length >= selectedCard.cost &&
            me.battleZone.some((s) => s === null)
          }
          canFlash={
            !isMyTurn &&
            selectedCard.type === 'UNIT' &&
            (selectedCard.keywords ?? []).includes('FLASH') &&
            me.energyZone.length >= selectedCard.cost &&
            me.battleZone.some((s) => s !== null)
          }
          canCastSpell={isMainPhase && selectedCard.type === 'SPELL' && me.energyZone.length >= selectedCard.cost}
          canCastInstant={
            (isMainPhase || isBlockingPhase || isResponsePhase) &&
            selectedCard.type === 'SPELL_INSTANT' &&
            me.energyZone.length >= selectedCard.cost
          }
          onPlayEnergy={() => {
            moves.playCardAsEnergy(selectedHandIndex);
            setSelectedHandIndex(null);
          }}
          onPlayUnit={() => {
            moves.playUnit(selectedHandIndex);
            setSelectedHandIndex(null);
          }}
          onPlayFlash={() => {
            startTargeting({ type: 'FLASH_SUMMON', index: selectedHandIndex, card: selectedCard });
          }}
          onPlaySpell={() => {
            moves.playSpell(selectedHandIndex);
            setSelectedHandIndex(null);
          }}
          onPlayInstant={() => {
            moves.playInstant(selectedHandIndex);
            setSelectedHandIndex(null);
          }}
          onTargeting={(type: 'HAND_SPELL') => startTargeting({ type, index: selectedHandIndex, card: selectedCard })}
          onCancel={() => setSelectedHandIndex(null)}
        />
      )}

      {selectedFieldSlot !== null && me.battleZone[selectedFieldSlot] && !targetingSource && !isDeploymentPhase && (
        <UnitActionModal
          unit={me.battleZone[selectedFieldSlot]}
          phase={currentPhase}
          onAttack={() => {
            moves.declareAttack(selectedFieldSlot);
            setSelectedFieldSlot(null);
          }}
          onEffect={() => {
            const unit = me.battleZone[selectedFieldSlot]!;
            const hasEnergySummon = unit.effects?.some((eff) => eff.action === 'SUMMON_FROM_ENERGY');
            startTargeting({
              type: hasEnergySummon ? 'UNIT_EFFECT_ENERGY' : 'UNIT_EFFECT',
              slot: selectedFieldSlot,
              card: unit
            });
          }}
          onCancel={() => setSelectedFieldSlot(null)}
        />
      )}

      <PlayerArea
        player={opponent}
        isOpponent={true}
        onFieldClick={(idx: number) => handleFieldClick(true, idx)}
        targetingSource={targetingSource}
      />

      <div className="flex items-center justify-between px-8 py-1 bg-gray-950/80 border-y border-gray-800 h-[22vh] z-10 relative">
        <div className="text-gray-400 text-sm w-32">
          <div className="text-2xl text-white font-black">TURN {G.turnCount}</div>
          <div className="text-xs uppercase tracking-widest text-yellow-600 mt-1">Era {G.era}</div>
        </div>

        <div className="flex-1 flex justify-center">
          <SharedTerritoryZone
            activeTerritory={G.activeTerritory}
            nextTerritory={nextTerritory}
            remaining={remainingTerritories}
          />
        </div>

        <div className="w-48 flex flex-col gap-2 items-end z-20">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-1 text-right">
            Current:{' '}
            <span className={clsx('font-bold', currentPhase === 'main' ? 'text-blue-400' : 'text-yellow-500')}>
              {phaseLabel} PHASE
            </span>
          </div>

          {isMyTurn && !isBlockingPhase && !isResponsePhase && currentPhase === 'main' && (
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => moves.endTurn()}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 text-gray-200 text-xs font-bold rounded shadow transition-all"
              >
                End Turn
              </button>
            </div>
          )}
          {!isMyTurn && !isBlockingPhase && <div className="text-xs text-gray-600 animate-pulse text-right">Opponent thinking...</div>}
        </div>
      </div>

      <PlayerArea
        player={me}
        isOpponent={false}
        selectedHandIndex={selectedHandIndex}
        onHandClick={(idx: number) => !isBlockingPhase && !isDeploymentPhase && setSelectedHandIndex(idx)}
        onFieldClick={(idx: number) => handleFieldClick(false, idx)}
        isBlockingPhase={isBlockingPhase}
        isDeploymentPhase={isDeploymentPhase}
        isEnergyTargeting={targetingSource?.type === 'UNIT_EFFECT_ENERGY'}
        onEnergyClick={(idx: number) => {
          if (targetingSource?.type === 'UNIT_EFFECT_ENERGY') {
            moves.useUnitEffect(targetingSource.slot, idx, viewID);
            setTargetingSource(null);
            return;
          }
          moves.returnEnergy(idx);
        }}
        targetingSource={targetingSource}
      />
    </div>
  );
};
