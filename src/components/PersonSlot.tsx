'use client';

import React from 'react';
import { Card } from '@/types/game';

interface PersonSlotProps {
  index: number;
  card: Card | null;
  personSlots: (Card | null)[];
  setPersonSlots: React.Dispatch<React.SetStateAction<(Card | null)[]>>;
  handCards: Card[];
  setHandCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

const PersonSlot = ({ index, card, personSlots, setPersonSlots, handCards, setHandCards }: PersonSlotProps) => {
  return (
    <div
      className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        const draggedCard = handCards.find((card) => card.id === cardId);

        if (draggedCard) {
          const newSlots = [...personSlots];
          newSlots[index] = draggedCard;
          setPersonSlots(newSlots);
          setHandCards(handCards.filter((card) => card.id !== cardId));
        }
      }}
    >
      {card ? (
        <div className="text-white text-center text-xs mt-4">
          {card.name}
          <br />
          {card.type}
          <br />
          {card.id}
        </div>
      ) : (
        <div className="text-white text-center mt-12">Person {index + 1}</div>
      )}
    </div>
  );
};

export default PersonSlot;
