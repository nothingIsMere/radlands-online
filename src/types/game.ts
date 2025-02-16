interface Card {
  id: string;
  name: string;
  type: 'person' | 'event' | 'camp';
  startingQueuePosition?: number;  // Optional since person/camp cards don't need it
}

interface PlayerState {
  hand: Card[];
  personSlots: (Card | null)[];  // null means empty slot
}

export type { Card, PlayerState };