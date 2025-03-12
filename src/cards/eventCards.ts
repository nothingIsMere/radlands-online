// eventCards.ts
import { Card } from '@/types/game';

export const eventCards: { [key: string]: Omit<Card, 'isDamaged' | 'isProtected'> } = {
  'ambush': {
    id: 'event-ambush',
    name: 'ambush',
    type: 'event',
    startingQueuePosition: 2,
    effect: 'When resolved, damage two enemy person cards'
  },
  'attack': {
    id: 'event-attack',
    name: 'attack',
    type: 'event',
    startingQueuePosition: 1,
    effect: 'When resolved, damage an enemy camp'
  },
  'assault': {
    id: 'event-assault',
    name: 'assault',
    type: 'event',
    startingQueuePosition: 1,
    effect: 'When resolved, damage all unprotected enemy persons'
  },
  'raiders': {
    id: 'event-raiders',
    name: 'Raiders',
    type: 'event',
    startingQueuePosition: 2,
    effect: 'When resolved, opponent must select a camp to damage'
  }
};

// Static counter for deterministic IDs
let eventCounter = 0;

// Helper function to create a new event instance
export function createEvent(cardKey: string): Card | undefined {
  const template = eventCards[cardKey];
  if (!template) {
    console.error(`Event card template not found: ${cardKey}`);
    return undefined;
  }
  // Create a new instance with default game state - use counter for uniqueness on client side
const id = `${template.id}-${cardKey}-${eventCounter++}`;
  
  return {
    ...template,
    id: id
  };
}