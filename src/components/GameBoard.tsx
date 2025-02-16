'use client';

import { Card } from '@/types/game';
import React, { useState } from 'react';
import PersonSlot from '@/components/PersonSlot';
import EventSlot from '@/components/EventSlot';

const testCards: Card[] = [
  {
    id: 'test-1',
    name: 'Scout',
    type: 'person',
  },
  {
    id: 'test-2',
    name: 'Warrior',
    type: 'person',
  },
  {
    id: 'test-3',
    name: 'Mechanic',
    type: 'person',
  },
];

const testEventCards: Card[] = [
  {
    id: 'event-1',
    name: 'Raid',
    type: 'event',
    startingQueuePosition: 1,
  },
  {
    id: 'event-2',
    name: 'Ambush',
    type: 'event',
    startingQueuePosition: 2,
  },
  {
    id: 'event-3',
    name: 'Attack',
    type: 'event',
    startingQueuePosition: 1,
  },
];

const drawDeckCards: Card[] = [
  {
    id: 'deck-1',
    name: 'Scavenger',
    type: 'person',
  },
  {
    id: 'deck-2',
    name: 'Saboteur',
    type: 'person',
  },
  {
    id: 'deck-3',
    name: 'Assault',
    type: 'event',
  },
];

const GameBoard = () => {
  const [personSlots, setPersonSlots] = useState<(Card | null)[]>([null, null, null, null, null, null]);
  const [eventSlots, setEventSlots] = useState<(Card | null)[]>([null, null, null]);
  const [handCards, setHandCards] = useState<Card[]>([...testCards, ...testEventCards]);
  const [drawDeck, setDrawDeck] = useState<Card[]>(drawDeckCards);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);

  return (
    <div
      className="w-full h-screen p-4"
      style={{
        backgroundColor: '#340454',
      }}
    >
      <div className="w-full h-full flex justify-between">
        {/* Left Player Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2 relative">
          <div
            style={{
              marginTop: '50px',
            }}
          >
            {/* Event Queue */}
            <div className="flex justify-start gap-2 mb-8 ml-4">
              <EventSlot
                index={0}
                card={eventSlots[0]}
                eventSlots={eventSlots}
                setEventSlots={setEventSlots}
                handCards={handCards}
                setHandCards={setHandCards}
              />
              <EventSlot
                index={1}
                card={eventSlots[1]}
                eventSlots={eventSlots}
                setEventSlots={setEventSlots}
                handCards={handCards}
                setHandCards={setHandCards}
              />
              <EventSlot
                index={2}
                card={eventSlots[2]}
                eventSlots={eventSlots}
                setEventSlots={setEventSlots}
                handCards={handCards}
                setHandCards={setHandCards}
              />
            </div>
            {/* Three columns of cards */}
            <div className="flex justify-between">
              {/* Column 1 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={0}
                  card={personSlots[0]}
                  personSlots={personSlots}
                  setPersonSlots={setPersonSlots}
                  handCards={handCards}
                  setHandCards={setHandCards}
                />
                <PersonSlot
                  index={1}
                  card={personSlots[1]}
                  personSlots={personSlots}
                  setPersonSlots={setPersonSlots}
                  handCards={handCards}
                  setHandCards={setHandCards}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 1</div>
                </div>
              </div>
              {/* Column 2 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={2}
                  card={personSlots[2]}
                  personSlots={personSlots}
                  setPersonSlots={setPersonSlots}
                  handCards={handCards}
                  setHandCards={setHandCards}
                />
                <PersonSlot
                  index={3}
                  card={personSlots[3]}
                  personSlots={personSlots}
                  setPersonSlots={setPersonSlots}
                  handCards={handCards}
                  setHandCards={setHandCards}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 2</div>
                </div>
              </div>
              {/* Column 3 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={4}
                  card={personSlots[4]}
                  personSlots={personSlots}
                  setPersonSlots={setPersonSlots}
                  handCards={handCards}
                  setHandCards={setHandCards}
                />
                <PersonSlot
                  index={5}
                  card={personSlots[5]}
                  personSlots={personSlots}
                  setPersonSlots={setPersonSlots}
                  handCards={handCards}
                  setHandCards={setHandCards}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 3</div>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="border-2 border-gray-400 rounded bg-gray-700 p-4 min-h-32">
                  <div className="text-white mb-2">Hand</div>
                  <div
                    className="flex flex-wrap gap-2"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const cardId = e.dataTransfer.getData('cardId');
                      const sourceType = e.dataTransfer.getData('sourceType');
                      const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));

                      if (sourceType === 'personSlot') {
                        const card = personSlots[sourceIndex];
                        if (card) {
                          setHandCards([...handCards, card]);
                          const newPersonSlots = [...personSlots];
                          newPersonSlots[sourceIndex] = null;
                          setPersonSlots(newPersonSlots);
                        }
                      }
                    }}
                  >
                    {handCards.map((card) => (
                      <div
                        key={card.id}
                        className="w-16 h-24 border border-gray-400 rounded bg-gray-600"
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('cardId', card.id);
                        }}
                      >
                        <div className="text-white text-center text-xs mt-4">
                          {card.name}
                          <br />
                          {card.type}
                          <br />
                          {card.startingQueuePosition !== undefined ? `Queue: ${card.startingQueuePosition}` : ''}
                          <br />
                          {card.id}
                        </div>
                      </div>
                    ))}
                    <div className="w-16 h-24 border border-gray-400 rounded bg-gray-600">
                      <div className="text-white text-center text-xs mt-8">Card</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2">
          <div className="h-full flex flex-col justify-between">
            {/* Top section with deck and discard */}
            <div className="flex flex-col items-center mt-8">
              <div
                className={`w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8 
    ${drawDeck.length > 0 ? 'cursor-pointer' : 'opacity-50'}`}
                onClick={() => {
                  if (drawDeck.length > 0) {
                    const drawnCard = drawDeck[0];
                    setDrawDeck(drawDeck.slice(1));
                    setHandCards([...handCards, drawnCard]);
                  }
                }}
              >
                <div className="text-white text-center mt-12">
                  {drawDeck.length > 0 ? (
                    <>
                      Draw Deck
                      <br />({drawDeck.length} cards)
                    </>
                  ) : (
                    'Empty Deck'
                  )}
                </div>
              </div>
              <div
                className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData('cardId');
                  const discardedCard = handCards.find((card) => card.id === cardId);

                  if (discardedCard) {
                    setDiscardPile([...discardPile, discardedCard]);
                    setHandCards(handCards.filter((card) => card.id !== cardId));
                  }
                }}
              >
                <div className="text-white text-center mt-12">
                  Discard Pile
                  <br />({discardPile.length} cards)
                </div>
              </div>
            </div>

            {/* Bottom section with water counters and special cards */}
            <div className="flex justify-between mb-8">
              {/* Left player section */}
              <div className="flex items-center gap-2">
                <div className="w-16 h-20 border border-gray-400 rounded bg-blue-800">
                  <div className="text-white text-center text-xs mt-6">Water Silo</div>
                </div>
                <div className="w-16 h-20 border border-gray-400 rounded bg-red-800">
                  <div className="text-white text-center text-xs mt-6">Raiders</div>
                </div>
                <div className="bg-blue-600 rounded-full p-4 text-white font-bold text-xl">💧 3</div>
              </div>
              {/* Right player section */}
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 rounded-full p-4 text-white font-bold text-xl">💧 3</div>
                <div className="w-16 h-20 border border-gray-400 rounded bg-blue-800">
                  <div className="text-white text-center text-xs mt-6">Water Silo</div>
                </div>
                <div className="w-16 h-20 border border-gray-400 rounded bg-red-800">
                  <div className="text-white text-center text-xs mt-6">Raiders</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Player Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2 relative">
          <div
            style={{
              marginTop: '50px',
            }}
          >
            {/* Event Queue */}
            <div className="flex justify-end gap-2 mb-8 mr-4">
              <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                <div className="text-white text-center mt-12">1</div>
              </div>
              <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                <div className="text-white text-center mt-12">2</div>
              </div>
              <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                <div className="text-white text-center mt-12">3</div>
              </div>
            </div>
            {/* Three columns of cards */}
            <div className="flex justify-between">
              {/* Column 1 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 1</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 2</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 1</div>
                </div>
              </div>
              {/* Column 2 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 3</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 4</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 2</div>
                </div>
              </div>
              {/* Column 3 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 5</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 6</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 3</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="border-2 border-gray-400 rounded bg-gray-700 p-4 min-h-32">
              <div className="text-white mb-2">Hand</div>
              <div className="flex flex-wrap gap-2">
                <div className="w-16 h-24 border border-gray-400 rounded bg-gray-600">
                  <div className="text-white text-center text-xs mt-8">Card</div>
                </div>
                <div className="w-16 h-24 border border-gray-400 rounded bg-gray-600">
                  <div className="text-white text-center text-xs mt-8">Card</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
