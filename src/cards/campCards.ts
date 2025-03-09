// campCards.ts
import { Card } from '@/types/game';

export const campCards: { [key: string]: Omit<Card, 'isDamaged' | 'isProtected'> } = {
  'base-camp': {
    id: 'camp-base',
    name: 'Base Camp',
    type: 'camp',
    campDraw: 3,
    abilities: [
      {
        effect: 'Do 1 damage to an enemy person',
        cost: 1,
        type: 'damage',
        target: 'enemy_person',
        value: 1
      }
    ]
  },
  'fortress': {
    id: 'camp-fortress',
    name: 'Fortress',
    type: 'camp',
    campDraw: 2,
    abilities: [
      {
        effect: 'Restore one of your people',
        cost: 2,
        type: 'restore',
        target: 'own_person'
      }
    ],
    traits: ['protected_initially']
  },
  'outpost': {
    id: 'camp-outpost',
    name: 'Outpost',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Gain 1 water',
        cost: 1,
        type: 'water',
        value: 1
      }
    ]
  },
  'garrison': {
    id: 'camp-garrison',
    name: 'Garrison',
    type: 'camp',
    campDraw: 2,
    abilities: [
      {
        effect: 'Do 1 damage to an enemy person',
        cost: 2,
        type: 'damage',
        target: 'enemy_person',
        value: 1
      }
    ]
  },
  'depot': {
    id: 'camp-depot',
    name: 'Depot',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Draw 1 card',
        cost: 2,
        type: 'draw',
        value: 1
      }
    ]
  }
};

// Static counter for deterministic IDs
let campCounter = 0;

// Helper function to create a new camp instance
export function createCamp(cardKey: string): Card | undefined {
  const template = campCards[cardKey];
  if (!template) {
    console.error(`Camp card template not found: ${cardKey}`);
    return undefined;
  }
  // Create a new instance with default game state - use timestamp for uniqueness
  const id = `${template.id}-${cardKey}-${Date.now()}`;
  
  return {
    ...template,
    id: id,
    isDamaged: false,
    isProtected: template.traits?.includes('protected_initially') || false
  };
}