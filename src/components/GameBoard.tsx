'use client';

import { Card } from '@/types/game';
import React, { useState } from 'react';
import PersonSlot from '@/components/PersonSlot';
import EventSlot from '@/components/EventSlot';
import { useEffect } from 'react';

interface PlayerState {
  handCards: Card[];
  personSlots: (Card | null)[];
  eventSlots: (Card | null)[];
  waterSiloInHand: boolean;
  waterCount: number;
  raidersLocation: 'default' | 'event1' | 'event2' | 'event3';
}

const testCards: Card[] = [
  {
    id: 'test-1',
    name: 'Scout',
    type: 'person',
    isDamaged: true,
    junkEffect: 'extra_water',
  },
  {
    id: 'test-2',
    name: 'Warrior',
    type: 'person',
    isDamaged: false,
    junkEffect: 'draw_card',
  },
  {
    id: 'test-3',
    name: 'Mechanic',
    type: 'person',
    isDamaged: false,
    junkEffect: 'gain_punk',
  },
  {
    id: 'test-4',
    name: 'Raider 1',
    type: 'person',
    isDamaged: false,
    junkEffect: 'raid',
  },
  {
    id: 'test-5',
    name: 'Raider 2',
    type: 'person',
    isDamaged: false,
    junkEffect: 'raid',
  },
  {
    id: 'test-6',
    name: 'Raider 3',
    type: 'person',
    isDamaged: false,
    junkEffect: 'raid',
  },
];

const rightTestCards: Card[] = [
  {
    id: 'right-1',
    name: 'Medic',
    type: 'person',
    isDamaged: true,
  },
  {
    id: 'right-2',
    name: 'Defender',
    type: 'person',
    isDamaged: false,
  },
  {
    id: 'right-3',
    name: 'Bomber',
    type: 'person',
    isDamaged: false,
  },
];

const testEventCards: Card[] = [
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

const leftWaterSiloCard: Card = {
  id: 'watersilo-left',
  name: 'Water Silo',
  type: 'watersilo',
  owner: 'left',
};

const rightWaterSiloCard: Card = {
  id: 'watersilo-right',
  name: 'Water Silo',
  type: 'watersilo',
  owner: 'right',
};

const GameBoard = () => {
  // const testEventInSlot1: Card = {
  //   id: 'test-event-slot1',
  //   name: 'Test Event 1',
  //   type: 'event',
  //   startingQueuePosition: 1,
  //   owner: 'left',
  // };

  // const testEventInSlot2: Card = {
  //   id: 'test-event-slot2',
  //   name: 'Test Event 2',
  //   type: 'event',
  //   startingQueuePosition: 2,
  //   owner: 'left',
  // };

  // const testEventInSlot3: Card = {
  //   id: 'test-event-slot3',
  //   name: 'Test Event 3',
  //   type: 'event',
  //   startingQueuePosition: 3,
  //   owner: 'left',
  // };

  const handleEventsPhase = () => {
    const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setCurrentPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    const eventInSlot1 = currentPlayerState.eventSlots[2];
    if (eventInSlot1) {
      alert(`${eventInSlot1.name} occurs`);
      // Move card to discard pile
      setDiscardPile((prev) => [...prev, eventInSlot1]);
    }

    // Then advance remaining events
    setCurrentPlayerState((prev) => ({
      ...prev,
      eventSlots: [
        null, // Slot 3 becomes empty
        prev.eventSlots[0], // Slot 3's card moves to Slot 2
        prev.eventSlots[1], // Slot 2's card moves to Slot 1
      ],
    }));

    // After events are processed, move to Replenish phase
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        currentPhase: 'replenish',
      }));
    }, 100);
  };

  const [leftPlayerState, setLeftPlayerState] = useState<PlayerState>({
    handCards: [...testCards, ...testEventCards],
    personSlots: [null, null, null, null, null, null],
    // eventSlots: [testEventInSlot3, testEventInSlot2, testEventInSlot1],
    eventSlots: [null, null, null],
    waterSiloInHand: false,
    waterCount: 1,
    raidersLocation: 'default',
  });

  const [rightPlayerState, setRightPlayerState] = useState<PlayerState>({
    handCards: [...rightTestCards],
    personSlots: [null, null, null, null, null, null],
    eventSlots: [null, null, null],
    waterSiloInHand: false,
    waterCount: 2,
    raidersLocation: 'default',
  });

  const [drawDeck, setDrawDeck] = useState<Card[]>(drawDeckCards);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [cardToDiscard, setCardToDiscard] = useState<{ card: Card; sourcePlayer: string } | null>(null);
  const [punkPlacementMode, setPunkPlacementMode] = useState(false);
  const [punkCardToPlace, setPunkCardToPlace] = useState<Card | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    currentTurn: 'left', // left player starts
    currentPhase: 'events', // start with events phase
    isFirstTurn: true,
  });

  const handleReplenishPhase = () => {
    const currentPlayerState = gameState.currentTurn === 'left' ? leftPlayerState : rightPlayerState;
    const setCurrentPlayerState = gameState.currentTurn === 'left' ? setLeftPlayerState : setRightPlayerState;

    // Draw top card from draw deck if available
    if (drawDeck.length > 0) {
      const topCard = drawDeck[drawDeck.length - 1];
      setCurrentPlayerState((prev) => ({
        ...prev,
        handCards: [...prev.handCards, topCard],
      }));
      setDrawDeck((prev) => prev.slice(0, -1));
    }

    // Reset water count to 3
    setCurrentPlayerState((prev) => ({
      ...prev,
      waterCount: 3,
    }));

    // After replenish is complete, move to Actions phase
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        currentPhase: 'actions',
      }));
    }, 100);
  };

  useEffect(() => {
    if (gameState.currentPhase === 'events') {
      handleEventsPhase();
    } else if (gameState.currentPhase === 'replenish') {
      handleReplenishPhase();
    }
  }, [gameState.currentPhase, gameState.currentTurn]);

  return (
    <div
      className="w-full h-screen p-4"
      style={{
        backgroundColor: '#340454',
      }}
    >
      <div className="w-full h-full flex justify-between">
        {/* Left Player Area */}
        <div
          className={`w-1/3 h-full p-2 relative border-2 
  ${gameState.currentTurn === 'left' ? 'border-white brightness-110' : 'border-gray-600'}`}
        >
          <div
            style={{
              marginTop: '50px',
            }}
          >
            {/* Event Queue */}
            <div className="flex justify-start gap-2 mb-8 ml-4">
              <EventSlot
                index={0}
                card={leftPlayerState.eventSlots[0]}
                playerState={leftPlayerState}
                setPlayerState={setLeftPlayerState}
              />
              <EventSlot
                index={1}
                card={leftPlayerState.eventSlots[1]}
                playerState={leftPlayerState}
                setPlayerState={setLeftPlayerState}
              />
              <EventSlot
                index={2}
                card={leftPlayerState.eventSlots[2]}
                playerState={leftPlayerState}
                setPlayerState={setLeftPlayerState}
              />
            </div>

            {/* Hand Area */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="border-2 border-gray-400 rounded bg-gray-700 p-4 min-h-32">
                <div
                  className="flex flex-wrap gap-2"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cardId = e.dataTransfer.getData('cardId');
                    const sourceType = e.dataTransfer.getData('sourceType');
                    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));

                    if (sourceType === 'personSlot') {
                      const card = leftPlayerState.personSlots[sourceIndex];
                      if (card) {
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          handCards: [...prev.handCards, card],
                          personSlots: prev.personSlots.map((slot, i) => (i === sourceIndex ? null : slot)),
                        }));
                      }
                    }
                  }}
                >
                  {leftPlayerState.handCards.map((card) => (
                    <div
                      key={card.id}
                      className={`w-16 h-24 border border-gray-400 rounded bg-gray-600
      ${card.id === leftWaterSiloCard.id ? 'cursor-pointer hover:brightness-110' : ''}`}
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('cardId', card.id);
                        e.dataTransfer.setData('sourcePlayer', 'left');
                      }}
                      onClick={() => {
                        if (card.id === leftWaterSiloCard.id) {
                          setLeftPlayerState((prev) => ({
                            ...prev,
                            waterSiloInHand: false,
                            waterCount: prev.waterCount + 1,
                            handCards: prev.handCards.filter((c) => c.id !== leftWaterSiloCard.id),
                          }));
                        }
                      }}
                    >
                      <div className="text-white text-center text-xs mt-4">
                        {card.name}
                        <br />
                        {card.type}
                        <br />
                        {card.startingQueuePosition !== undefined ? `Queue: ${card.startingQueuePosition}` : ''}
                        <br />
                        {card.junkEffect && `Junk: ${card.junkEffect}`}
                        <br />
                        {card.id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Three columns of cards */}
            <div className="flex justify-between">
              {/* Column 1 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={0}
                  card={leftPlayerState.personSlots[0]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  punkPlacementMode={punkPlacementMode}
                  punkCardToPlace={punkCardToPlace}
                  setPunkPlacementMode={setPunkPlacementMode}
                  setPunkCardToPlace={setPunkCardToPlace}
                />
                <PersonSlot
                  index={1}
                  card={leftPlayerState.personSlots[1]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  punkPlacementMode={punkPlacementMode}
                  punkCardToPlace={punkCardToPlace}
                  setPunkPlacementMode={setPunkPlacementMode}
                  setPunkCardToPlace={setPunkCardToPlace}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 1</div>
                </div>
              </div>
              {/* Column 2 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={2}
                  card={leftPlayerState.personSlots[2]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  punkPlacementMode={punkPlacementMode}
                  punkCardToPlace={punkCardToPlace}
                  setPunkPlacementMode={setPunkPlacementMode}
                  setPunkCardToPlace={setPunkCardToPlace}
                />
                <PersonSlot
                  index={3}
                  card={leftPlayerState.personSlots[3]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  punkPlacementMode={punkPlacementMode}
                  punkCardToPlace={punkCardToPlace}
                  setPunkPlacementMode={setPunkPlacementMode}
                  setPunkCardToPlace={setPunkCardToPlace}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 2</div>
                </div>
              </div>
              {/* Column 3 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={4}
                  card={leftPlayerState.personSlots[4]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  punkPlacementMode={punkPlacementMode}
                  punkCardToPlace={punkCardToPlace}
                  setPunkPlacementMode={setPunkPlacementMode}
                  setPunkCardToPlace={setPunkCardToPlace}
                />
                <PersonSlot
                  index={5}
                  card={leftPlayerState.personSlots[5]}
                  playerState={leftPlayerState}
                  setPlayerState={setLeftPlayerState}
                  punkPlacementMode={punkPlacementMode}
                  punkCardToPlace={punkCardToPlace}
                  setPunkPlacementMode={setPunkPlacementMode}
                  setPunkCardToPlace={setPunkCardToPlace}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 3</div>
                </div>
              </div>
            </div>
          </div>
          {gameState.currentTurn !== 'left' && (
            <div
              className="absolute inset-0 bg-black opacity-30 z-50 cursor-not-allowed"
              onClick={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
            />
          )}
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
                    setLeftPlayerState((prev) => ({
                      ...prev,
                      handCards: [...prev.handCards, drawnCard],
                    }));
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
              {/* Discard Modal */}
              {showDiscardModal && cardToDiscard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-600">
                    <div className="text-white mb-4">What would you like to do with this card?</div>
                    <div className="flex gap-4">
                      {cardToDiscard.card.junkEffect && (
                        <button
                          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded"
                          onClick={() => {
                            if (cardToDiscard.card.junkEffect === 'extra_water') {
                              const setPlayerState =
                                cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                              setPlayerState((prev) => ({
                                ...prev,
                                waterCount: prev.waterCount + 1,
                                handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                              }));
                            } else if (cardToDiscard.card.junkEffect === 'draw_card') {
                              const setPlayerState =
                                cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                              const playerState =
                                cardToDiscard.sourcePlayer === 'left' ? leftPlayerState : rightPlayerState;

                              if (drawDeck.length > 0) {
                                const topCard = drawDeck[drawDeck.length - 1];
                                setPlayerState((prev) => ({
                                  ...prev,
                                  handCards: [...prev.handCards.filter((c) => c.id !== cardToDiscard.card.id), topCard],
                                }));
                                setDrawDeck((prev) => prev.slice(0, -1));
                              }
                            } else if (cardToDiscard.card.junkEffect === 'gain_punk') {
                              if (drawDeck.length > 0) {
                                const topCard = drawDeck[drawDeck.length - 1];
                                setPunkCardToPlace(topCard);
                                setPunkPlacementMode(true);
                                setDrawDeck((prev) => prev.slice(0, -1));
                                // Remove the junked card from hand
                                const setPlayerState =
                                  cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                                setPlayerState((prev) => ({
                                  ...prev,
                                  handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                }));
                              }
                            } else if (cardToDiscard.card.junkEffect === 'raid') {
                              const setPlayerState =
                                cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                              const playerState =
                                cardToDiscard.sourcePlayer === 'left' ? leftPlayerState : rightPlayerState;

                              // Handle Raiders movement based on current location
                              switch (playerState.raidersLocation) {
                                case 'default':
                                  // Move to event slot 2 (index 1)
                                  setPlayerState((prev) => ({
                                    ...prev,
                                    eventSlots: [
                                      prev.eventSlots[0],
                                      { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
                                      prev.eventSlots[2],
                                    ],
                                    raidersLocation: 'event2',
                                    handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                  }));
                                  break;

                                case 'event3':
                                  // Move from slot 3 to slot 2 if empty
                                  if (!playerState.eventSlots[1]) {
                                    setPlayerState((prev) => ({
                                      ...prev,
                                      eventSlots: [
                                        null, // Clear slot 3
                                        { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
                                        prev.eventSlots[2],
                                      ],
                                      raidersLocation: 'event2',
                                      handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                    }));
                                  }
                                  break;

                                case 'event2':
                                  // Move from slot 2 to slot 1 if empty
                                  if (!playerState.eventSlots[2]) {
                                    setPlayerState((prev) => ({
                                      ...prev,
                                      eventSlots: [
                                        prev.eventSlots[0],
                                        null, // Clear slot 2
                                        { id: 'raiders', name: 'Raiders', type: 'event', startingQueuePosition: 2 },
                                      ],
                                      raidersLocation: 'event1',
                                      handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                    }));
                                  }
                                  break;

                                case 'event1':
                                  // For now, just discard the junked card since we'll implement raid later
                                  setPlayerState((prev) => ({
                                    ...prev,
                                    handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                                  }));
                                  break;
                              }
                            }

                            setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                            setShowDiscardModal(false);
                            setCardToDiscard(null);
                          }}
                        >
                          Junk
                        </button>
                      )}
                      <button
                        className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded"
                        onClick={() => {
                          const setPlayerState =
                            cardToDiscard.sourcePlayer === 'left' ? setLeftPlayerState : setRightPlayerState;
                          setPlayerState((prev) => ({
                            ...prev,
                            handCards: prev.handCards.filter((c) => c.id !== cardToDiscard.card.id),
                          }));
                          setDiscardPile((prev) => [...prev, cardToDiscard.card]);
                          setShowDiscardModal(false);
                          setCardToDiscard(null);
                        }}
                      >
                        Discard
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
                        onClick={() => {
                          setShowDiscardModal(false);
                          setCardToDiscard(null);
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData('cardId');
                  const sourcePlayer = e.dataTransfer.getData('sourcePlayer');
                  const playerState = sourcePlayer === 'left' ? leftPlayerState : rightPlayerState;

                  const discardedCard = playerState.handCards.find((card) => card.id === cardId);

                  if (discardedCard) {
                    setCardToDiscard({ card: discardedCard, sourcePlayer });
                    setShowDiscardModal(true);
                  }
                }}
              >
                <div className="text-white text-center mt-12">
                  Discard Pile
                  <br />({discardPile.length} cards)
                </div>
              </div>
            </div>

            {/* Phase Tracker */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-8">
                <div
                  className={`text-lg ${
                    gameState.currentPhase === 'events' ? 'text-purple-300 font-bold' : 'text-gray-400'
                  }`}
                >
                  Events
                </div>
                <div
                  className={`text-lg ${
                    gameState.currentPhase === 'replenish' ? 'text-purple-300 font-bold' : 'text-gray-400'
                  }`}
                >
                  Replenish
                </div>
                <div
                  className={`text-lg ${
                    gameState.currentPhase === 'actions' ? 'text-purple-300 font-bold' : 'text-gray-400'
                  }`}
                >
                  Actions
                </div>
              </div>
            </div>

            {/* Bottom section with water counters and special cards */}
            <div className="flex justify-between mb-8">
              {/* Left player section */}
              <div className="relative">
                {gameState.currentTurn === 'left' && (
                  <button
                    className="absolute -top-20 left-0 right-0 bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                      console.log('Done clicked, current turn:', gameState.currentTurn);
                      console.log('Current phase:', gameState.currentPhase);
                      setGameState((prev) => ({
                        ...prev,
                        currentTurn: prev.currentTurn === 'left' ? 'right' : 'left',
                        currentPhase: 'events',
                      }));
                      console.log('After state update - turn:', gameState.currentTurn);
                      console.log('After state update - phase:', gameState.currentPhase);
                    }}
                  >
                    Done
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-16 h-20 border border-gray-400 rounded bg-blue-800
    ${
      !leftPlayerState.waterSiloInHand && leftPlayerState.waterCount >= 1 && gameState.currentTurn === 'left'
        ? 'cursor-pointer hover:brightness-110'
        : 'opacity-50'
    }`}
                    onClick={() => {
                      if (
                        !leftPlayerState.waterSiloInHand &&
                        leftPlayerState.waterCount >= 1 &&
                        gameState.currentTurn === 'left'
                      ) {
                        setLeftPlayerState((prev) => ({
                          ...prev,
                          waterSiloInHand: true,
                          waterCount: prev.waterCount - 1,
                          handCards: [...prev.handCards, leftWaterSiloCard],
                        }));
                      }
                    }}
                  >
                    <div className="text-white text-center text-xs mt-6">
                      Water Silo
                      {!leftPlayerState.waterSiloInHand ? (
                        <>
                          <br />
                          (1 water)
                        </>
                      ) : (
                        <>
                          <br />
                          (in hand)
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={`w-16 h-20 border border-gray-400 rounded bg-red-800 ${
                      leftPlayerState.raidersLocation !== 'default' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="text-white text-center text-xs mt-6">
                      Raiders
                      <br />
                      {leftPlayerState.raidersLocation === 'default' ? '(ready)' : '(in queue)'}
                    </div>
                  </div>
                  <div className="bg-blue-600 rounded-full p-4 text-white font-bold text-xl">
                    💧 {leftPlayerState.waterCount}
                  </div>
                </div>
              </div>

              {/* Right player section */}
              <div className="relative">
                {gameState.currentTurn === 'right' && (
                  <button
                    className="absolute -top-20 left-0 right-0 bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                    onClick={() => {
                      setGameState((prev) => ({
                        ...prev,
                        currentTurn: prev.currentTurn === 'left' ? 'right' : 'left',
                        currentPhase: 'events',
                      }));
                    }}
                  >
                    Done
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 rounded-full p-4 text-white font-bold text-xl">
                    💧 {rightPlayerState.waterCount}
                  </div>
                  <div
                    className={`w-16 h-20 border border-gray-400 rounded bg-blue-800
    ${
      !rightPlayerState.waterSiloInHand && rightPlayerState.waterCount >= 1 && gameState.currentTurn === 'right'
        ? 'cursor-pointer hover:brightness-110'
        : 'opacity-50'
    }`}
                    onClick={() => {
                      if (
                        !rightPlayerState.waterSiloInHand &&
                        rightPlayerState.waterCount >= 1 &&
                        gameState.currentTurn === 'right'
                      ) {
                        setRightPlayerState((prev) => ({
                          ...prev,
                          waterSiloInHand: true,
                          waterCount: prev.waterCount - 1,
                          handCards: [...prev.handCards, rightWaterSiloCard],
                        }));
                      }
                    }}
                  >
                    <div className="text-white text-center text-xs mt-6">
                      Water Silo
                      {!rightPlayerState.waterSiloInHand ? (
                        <>
                          <br />
                          (1 water)
                        </>
                      ) : (
                        <>
                          <br />
                          (in hand)
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-16 h-20 border border-gray-400 rounded bg-red-800">
                    <div className="text-white text-center text-xs mt-6">Raiders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Player Area */}
        <div
          className={`w-1/3 h-full p-2 relative border-2
  ${gameState.currentTurn === 'right' ? 'border-white brightness-110' : 'border-gray-600'}`}
        >
          <div
            style={{
              marginTop: '50px',
            }}
          >
            {/* Event Queue */}
            <div className="flex justify-end gap-2 mb-8 mr-4">
              <EventSlot
                index={0}
                card={rightPlayerState.eventSlots[0]}
                playerState={rightPlayerState}
                setPlayerState={setRightPlayerState}
              />
              <EventSlot
                index={1}
                card={rightPlayerState.eventSlots[1]}
                playerState={rightPlayerState}
                setPlayerState={setRightPlayerState}
              />
              <EventSlot
                index={2}
                card={rightPlayerState.eventSlots[2]}
                playerState={rightPlayerState}
                setPlayerState={setRightPlayerState}
              />
            </div>
            {/* Three columns of cards */}
            <div className="flex justify-between">
              {/* Column 1 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={0}
                  card={rightPlayerState.personSlots[0]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                />
                <PersonSlot
                  index={1}
                  card={rightPlayerState.personSlots[1]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 1</div>
                </div>
              </div>
              {/* Column 2 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={2}
                  card={rightPlayerState.personSlots[2]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                />
                <PersonSlot
                  index={3}
                  card={rightPlayerState.personSlots[3]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 2</div>
                </div>
              </div>
              {/* Column 3 */}
              <div className="flex flex-col">
                <PersonSlot
                  index={4}
                  card={rightPlayerState.personSlots[4]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                />
                <PersonSlot
                  index={5}
                  card={rightPlayerState.personSlots[5]}
                  playerState={rightPlayerState}
                  setPlayerState={setRightPlayerState}
                />
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 3</div>
                </div>
              </div>
            </div>
          </div>

          {/*Hand Area*/}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="border-2 border-gray-400 rounded bg-gray-700 p-4 min-h-32">
              <div
                className="flex flex-wrap gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const cardId = e.dataTransfer.getData('cardId');
                  const sourceType = e.dataTransfer.getData('sourceType');
                  const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));

                  if (sourceType === 'personSlot') {
                    const card = rightPlayerState.personSlots[sourceIndex];
                    if (card) {
                      setRightPlayerState((prev) => ({
                        ...prev,
                        handCards: [...prev.handCards, card],
                        personSlots: prev.personSlots.map((slot, i) => (i === sourceIndex ? null : slot)),
                      }));
                    }
                  }
                }}
              >
                {rightPlayerState.handCards.map((card) => (
                  <div
                    key={card.id}
                    className={`w-16 h-24 border border-gray-400 rounded bg-gray-600
      ${card.id === rightWaterSiloCard.id ? 'cursor-pointer hover:brightness-110' : ''}`}
                    draggable="true"
                    onDragStart={(e) => {
                      e.dataTransfer.setData('cardId', card.id);
                      e.dataTransfer.setData('sourcePlayer', 'right');
                    }}
                    onClick={() => {
                      if (card.id === rightWaterSiloCard.id) {
                        setRightPlayerState((prev) => ({
                          ...prev,
                          waterSiloInHand: false,
                          waterCount: prev.waterCount + 1,
                          handCards: prev.handCards.filter((c) => c.id !== rightWaterSiloCard.id),
                        }));
                      }
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
              </div>
            </div>
          </div>
          {gameState.currentTurn !== 'right' && (
            <div
              className="absolute inset-0 bg-black opacity-30 z-50 cursor-not-allowed"
              onClick={(e) => e.preventDefault()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
