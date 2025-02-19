type JunkEffect = 'extra_water' | 'draw_card' | 'raid' | 'injure' | 'gain_punk' | 'restore';

interface Card {
 id: string;
 name: string;
 type: 'person' | 'event' | 'camp' | 'watersilo';
 startingQueuePosition?: number;
 isReady?: boolean;
 owner?: 'left' | 'right';
 isDamaged?: boolean;
 junkEffect?: JunkEffect;
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