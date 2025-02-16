'use client';

import React from 'react';
import { Card } from '@/types/game';

interface EventSlotProps {
  index: number;
  card: Card | null;
  eventSlots: (Card | null)[];
  setEventSlots: React.Dispatch<React.SetStateAction<(Card | null)[]>>;
  handCards: Card[];
  setHandCards: React.Dispatch<React.SetStateAction<Card[]>>;
}

const EventSlot = ({ index, card, eventSlots, setEventSlots, handCards, setHandCards }: EventSlotProps) => {
  return (
    <div
      className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        const draggedCard = handCards.find((card) => card.id === cardId);

        if (!draggedCard || draggedCard.type !== 'event' || !draggedCard.startingQueuePosition || card) {
          return;
        }

        const slotNumber = 3 - index; // Convert index (0,1,2) to slot number (3,2,1)
        const startPos = draggedCard.startingQueuePosition;

        // Check if this is a valid slot and if any earlier valid slots are empty
        if (slotNumber >= startPos) {
          for (let i = startPos; i < slotNumber; i++) {
            if (!eventSlots[3 - i]) {
              // if any earlier valid slot is empty
              return; // can't place here, must use earlier slot
            }
          }

          const newSlots = [...eventSlots];
          newSlots[index] = draggedCard;
          setEventSlots(newSlots);
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
        <div className="text-white text-center mt-12">Event {3 - index}</div>
      )}
    </div>
  );
};

export default EventSlot;
