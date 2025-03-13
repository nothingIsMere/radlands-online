'use client';
import React from 'react';
import { Card, PlayerState } from '@/types/game';

interface EventSlotProps {
  index: number;
  card: Card | null;
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  player?: 'left' | 'right'; // Add player prop
}

const EventSlot = ({ index, card, playerState, setPlayerState, player = 'left' }: EventSlotProps) => {
  return (
    <div
      className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700"
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const cardId = e.dataTransfer.getData('cardId');
        const draggedCard = playerState.handCards.find((card) => card.id === cardId);

        // Validate the drag operation
        if (!draggedCard || draggedCard.type !== 'event' || card) {
          return;
        }

        // ***Zeto Kahn check - using gameBoard to access state***
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
          // Check if this is the current player's turn
          const isCurrentPlayerTurn = (gameBoard as any).currentTurn === player;

          if (isCurrentPlayerTurn) {
            // Check if player has played an event this turn
            const hasPlayedEvent =
              player === 'left'
                ? (gameBoard as any).leftPlayedEventThisTurn
                : (gameBoard as any).rightPlayedEventThisTurn;

            if (!hasPlayedEvent) {
              // Check for undamaged Zeto Kahn directly in this player's personSlots
              const hasUndamagedZetoKahn = playerState.personSlots.some(
                (card) => card?.name === 'Zeto Kahn' && !card.isDamaged
              );

              if (hasUndamagedZetoKahn) {
                console.log("Zeto Kahn's trait activating");

                // Remove the card from hand
                setPlayerState((prev) => ({
                  ...prev,
                  handCards: prev.handCards.filter((c) => c.id !== cardId),
                }));

                // Mark that player has played an event
                if (player === 'left' && (gameBoard as any).setLeftPlayedEventThisTurn) {
                  (gameBoard as any).setLeftPlayedEventThisTurn(true);
                } else if (player === 'right' && (gameBoard as any).setRightPlayedEventThisTurn) {
                  (gameBoard as any).setRightPlayedEventThisTurn(true);
                }

                // Add to discard pile (if function is available)
                if ((gameBoard as any).addToDiscardPile) {
                  (gameBoard as any).addToDiscardPile(draggedCard);
                }

                alert(`Event ${draggedCard.name} executed immediately due to Zeto Kahn's ability!`);
                return; // Skip normal placement
              }
            }
          }
        }

        // Normal event placement - keep original code
        const slotNumber = 3 - index; // Convert index to slot number
        const startPos = draggedCard.startingQueuePosition || 3; // Default to 3 if not specified

        // Check if this is a valid slot and if any earlier valid slots are empty
        if (slotNumber >= startPos) {
          for (let i = startPos; i < slotNumber; i++) {
            if (!playerState.eventSlots[3 - i]) {
              // if any earlier valid slot is empty
              return; // can't place here, must use earlier slot
            }
          }

          setPlayerState((prev) => ({
            ...prev,
            eventSlots: prev.eventSlots.map((slot, i) => (i === index ? draggedCard : slot)),
            handCards: prev.handCards.filter((card) => card.id !== cardId),
          }));

          // Mark that the player has played an event this turn
          const gameBoard = document.getElementById('game-board');
          if (gameBoard) {
            if (player === 'left' && (gameBoard as any).setLeftPlayedEventThisTurn) {
              (gameBoard as any).setLeftPlayedEventThisTurn(true);
            } else if (player === 'right' && (gameBoard as any).setRightPlayedEventThisTurn) {
              (gameBoard as any).setRightPlayedEventThisTurn(true);
            }
          }
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
