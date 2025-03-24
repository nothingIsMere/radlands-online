// components/AbilityModal.tsx
import React from 'react';
import { Card } from '@/types/game';
import { AbilityService } from '../../services/abilityService';

interface AbilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  location: { type: 'person' | 'camp'; index: number } | null;
  gameState: any;
  leftPlayerState: any;
  rightPlayerState: any;
  stateSetters: any;
  drawDeck: any;
}

export const AbilityModal: React.FC<AbilityModalProps> = ({
  isOpen,
  onClose,
  card,
  location,
  gameState,
  leftPlayerState,
  rightPlayerState,
  stateSetters,
  drawDeck,
}) => {
  if (!isOpen || !card || !location) {
    return null;
  }

  const player = gameState.currentTurn;
  const playerState = player === 'left' ? leftPlayerState : rightPlayerState;
  const opponentState = player === 'left' ? rightPlayerState : leftPlayerState;

  // Handle cards that have already used their ability
  if ((location.type === 'camp' || location.type === 'person') && !card.isReady) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full">
          <div className="text-white mb-4 text-center">
            <h3 className="text-xl font-bold mb-2 text-red-400">Card Already Used</h3>
            <p>This card has already used its ability this turn and cannot be used again until next turn.</p>
          </div>
          <button className="mt-4 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded w-full" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full">
        <h2 className="text-white text-xl mb-4">{card.name} Abilities</h2>
        {card.abilities?.map((ability, index) => {
          // Calculate modified cost if applicable
          let displayCost = ability.cost;

          if (ability.costModifier === 'destroyed_camps') {
            const destroyedCamps = playerState.campSlots.filter((camp) => camp === null).length;
            displayCost = Math.max(0, ability.cost - destroyedCamps);
          } else if (ability.costModifier === 'punks_owned') {
            const punksInPlay = playerState.personSlots.filter((person) => person && person.isPunk).length;
            displayCost = Math.max(0, ability.cost - punksInPlay);
          }

          const hasEnoughWater = playerState.waterCount >= displayCost;

          return (
            <div key={index} className="mb-4 p-2 border border-gray-600 rounded">
              <div className="text-white mb-2">{ability.effect}</div>
              <div className="text-blue-300 mb-2">
                Cost: {displayCost} water
                {displayCost !== ability.cost && ` (reduced from ${ability.cost})`}
              </div>
              <button
                className={`bg-purple-600 text-white px-4 py-2 rounded w-full
                  ${!hasEnoughWater ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500'}`}
                disabled={!hasEnoughWater}
                title={!hasEnoughWater ? 'Not enough water' : ''}
                onClick={() => {
                  if (!hasEnoughWater) return;

                  // Close the modal
                  onClose();

                  // Execute the ability
                  AbilityService.executeAbility({
                    sourceCard: card,
                    sourceLocation: location,
                    player,
                    ability,
                    gameState,
                    playerState,
                    opponentState,
                    stateSetters,
                    drawDeck,
                  });
                }}
              >
                Use Ability {!hasEnoughWater && `(Not enough water)`}
              </button>
            </div>
          );
        })}
        <button className="mt-4 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded w-full" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};
