interface Card {
  id: string;
  name: string;
  type: 'person' | 'event' | 'camp';
  startingQueuePosition?: number;
  isReady?: boolean;
  owner?: 'left' | 'right';  // Added this line
}

interface PlayerState {
  hand: Card[];
  personSlots: (Card | null)[];  // null means empty slot
}

export type { Card, PlayerState };

export type Phase = 'events' | 'replenish' | 'actions';
export type Player = 'left' | 'right';

export interface GameState {
  currentTurn: Player;
  currentPhase: Phase;
  isFirstTurn: boolean;
}