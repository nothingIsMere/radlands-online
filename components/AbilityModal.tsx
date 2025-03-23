// components/AbilityModal.tsx

'use client';

import React from 'react';
import { Card } from '../src/types/game';
import { useAbility } from './AbilityManager';

interface AbilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: Card | null;
  location: { type: 'person' | 'camp'; index: number } | null;
}

export const AbilityModal: React.FC<AbilityModalProps> = ({ isOpen, onClose, card, location }) => {
  const { executeAbility } = useAbility();

  if (!isOpen || !card || !location || !card.abilities) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-4 rounded-lg max-w-md w-full">
        <h2 className="text-white text-xl font-bold mb-4">{card.name} Abilities</h2>

        <div className="flex flex-col gap-4">
          {card.abilities.map((ability, index) => (
            <div key={index} className="border border-gray-600 rounded p-3">
              <div className="text-white mb-2">{ability.effect}</div>
              <div className="text-blue-300 mb-2">Cost: {ability.cost} water</div>
              <button
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded w-full"
                onClick={() => {
                  executeAbility(card, ability, location);
                  onClose();
                }}
              >
                Use Ability
              </button>
            </div>
          ))}
        </div>

        <button className="mt-4 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded w-full" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};
