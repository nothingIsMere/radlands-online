// Keep the existing Card interface
interface Card {
  id: string;
  name: string;
  type: 'person' | 'event' | 'camp';
}

// Add this new interface
interface PlayerState {
  hand: Card[];
  personSlots: (Card | null)[];  // null means empty slot
}

export type { Card, PlayerState };