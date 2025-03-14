// personCards.ts
'use client';
import { Card, JunkEffect } from '@/types/game';

export const personCards: { [key: string]: Omit<Card, 'isDamaged' | 'isProtected' | 'isReady'> } = {
  'looter': {
    id: 'person-looter',
    name: 'Looter',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Damage. If this hits a camp, Draw 1 card.',
        cost: 2,
        type: 'damage',
        target: 'any',
        value: 1,
        secondaryEffect: {
          condition: 'hits_camp',
          type: 'draw',
          value: 1,
        },
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'extra_water'
  },
  'wounded-soldier': {
    id: 'person-wounded-soldier',
    name: 'Wounded Soldier',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Do 1 damage to an unprotected enemy card',
        cost: 1,
        type: 'damage',
        target: 'any',
        value: 1
      }
    ],
    traits: ['start_ready', 'draw_and_damage_on_entry'],
    junkEffect: 'injure'
  },
  'cult-leader': {
    id: 'person-cult-leader',
    name: 'Cult Leader',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Destroy one of your people, then damage an enemy card',
        cost: 0,
        type: 'sacrifice_then_damage',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'draw_card'
  },
  'repair-bot': {
    id: 'person-repair-bot',
    name: 'Repair Bot',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Restore a damaged card',
        cost: 2,
        type: 'restore',
        target: 'own_any',
      }
    ],
    traits: ['start_ready', 'restore_on_entry'],
    junkEffect: 'injure'
  },
  'gunner': {
    id: 'person-gunner',
    name: 'Gunner',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Injure all unprotected enemy persons',
        cost: 2,
        type: 'injure_all'
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'restore'
  },
  'assassin': {
    id: 'person-assassin',
    name: 'Assassin',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Destroy an unprotected enemy person',
        cost: 2,
        type: 'destroy_person',
        target: 'enemy_person'
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'raid'
  },
  'scientist': {
    id: 'person-scientist',
    name: 'Scientist',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Discard 3 cards from the draw deck and use one junk effect',
        cost: 1,
        type: 'scientist_ability',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'raid'
  },
  'mutant': {
    id: 'person-mutant',
    name: 'Mutant',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Do 1 damage and/or restore one of your cards, then take 1 damage',
        cost: 0,
        type: 'mutant_ability',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'injure'
  },
  'vigilante': {
    id: 'person-vigilante',
    name: 'Vigilante',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Injure an enemy person',
        cost: 1,
        type: 'injure',
        target: 'enemy_person',
        value: 1
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'raid'
  },
  'rescue-team': {
    id: 'person-rescue-team',
    name: 'Rescue Team',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Return one of your people to your hand',
        cost: 0,
        type: 'return_to_hand',
        target: 'own_person',
      }
    ],
    traits: ['start_ready'], // NOTE: In final version, Rescue Team should be the only card with start_ready by default
    junkEffect: 'injure'
  },
  'muse': {
    id: 'person-muse',
    name: 'Muse',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Gain 1 water',
        cost: 0,
        type: 'water',
        value: 1
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'injure'
  },
  'mimic': {
    id: 'person-mimic',
    name: 'Mimic',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Use the ability of one of your ready person cards or any undamaged enemy person',
        cost: 0,
        type: 'mimic_ability',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'injure'
  },
  'exterminator': {
    id: 'person-exterminator',
    name: 'Exterminator',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Destroy all damaged enemy cards',
        cost: 1,
        type: 'destroy_damaged_all',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'draw_card'
  },
  'scout': {
    id: 'person-scout',
    name: 'Scout',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Move your Raiders card forward one space',
        cost: 1,
        type: 'raid',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'extra_water'
  },
  'pyromaniac': {
    id: 'person-pyromaniac',
    name: 'Pyromaniac',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Do 1 damage to an unprotected enemy camp',
        cost: 1,
        type: 'damage_camp',
        target: 'enemy_camp',
        value: 1
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'injure'
  },
  'holdout': {
    id: 'person-holdout',
    name: 'Holdout',
    type: 'person',
    playCost: 2,
    abilities: [
      {
        effect: 'Do 1 damage to an unprotected enemy card',
        cost: 1,
        type: 'damage',
        target: 'any',
        value: 1
      }
    ],
    traits: ['start_ready', 'free_in_destroyed_camp'],
    junkEffect: 'raid'
  },
  'doomsayer': {
    id: 'person-doomsayer',
    name: 'Doomsayer',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Do 1 damage if opponent has an event in queue',
        cost: 1,
        type: 'damage_conditional_event',
        target: 'any',
        value: 1
      }
    ],
    traits: ['start_ready', 'delay_events_on_entry'],
    junkEffect: 'draw_card'
  },
  'rabble-rouser': {
    id: 'person-rabble-rouser',
    name: 'Rabble Rouser',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Gain a punk',
        cost: 1,
        type: 'gain_punk_ability',
      },
      {
        effect: 'Do 1 damage if you have a punk in play',
        cost: 1,
        type: 'punk_damage',
      }
    ],
    traits: [],
    junkEffect: 'raid'
  },
  'vanguard': {
    id: 'person-vanguard',
    name: 'Vanguard',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Do 1 damage, then opponent does 1 damage back to you',
        cost: 1,
        type: 'vanguard_damage',
      }
    ],
    traits: ['start_ready', 'gain_punk_on_entry'],
    junkEffect: 'raid'
  },
  'sniper': {
    id: 'person-sniper',
    name: 'Sniper',
    type: 'person',
    playCost: 1,
    abilities: [
      {
        effect: 'Do 1 damage to any enemy card (ignores protection)',
        cost: 2,
        type: 'sniper_damage',
        target: 'any_protected',
        value: 1
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'restore'
  },
  'magnus-karv': {
    id: 'person-magnus-karv',
    name: 'Magnus Karv',
    type: 'person',
    playCost: 3,
    abilities: [
      {
        effect: 'Damage all cards in one enemy column',
        cost: 2,
        type: 'damage_column',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'gain_punk'
  },
  'zeto-kahn': {
    id: 'person-zeto-kahn',
    name: 'Zeto Kahn',
    type: 'person',
    playCost: 3,
    abilities: [
      {
        effect: 'Draw 3 cards, then discard 3 cards',
        cost: 1,
        type: 'draw_then_discard',
      }
    ],
    traits: ['immediate_events'], // This trait should be checked regardless of ready status
    junkEffect: 'gain_punk'
  },
  'vera-vosh': {
    id: 'person-vera-vosh',
    name: 'Vera Vosh',
    type: 'person',
    playCost: 3,  // 3 water cost to play
    abilities: [
      {
        effect: 'Injure an enemy person',
        cost: 1,  // 1 water cost to use ability
        type: 'injure',
        target: 'enemy_person',
        value: 1
      }
    ],
    traits: ['keep_ready_first_ability'],
    junkEffect: 'gain_punk'  // Junk effect is gain_punk
  },
  'karli-blaze': {
    id: 'person-karli-blaze',
    name: 'Karli Blaze',
    type: 'person',
    playCost: 3,
    abilities: [
      {
        effect: 'Do 1 damage to an unprotected enemy card',
        cost: 1,
        type: 'damage',
        target: 'any',
        value: 1
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'gain_punk'
  },
  'molgur-stang': {
    id: 'person-molgur-stang',
    name: 'Molgur Stang',
    type: 'person',
    playCost: 4,
    abilities: [
      {
        effect: 'Destroy any camp, even if protected',
        cost: 1,
        type: 'destroy_any_camp',
        target: 'enemy_camp',
      }
    ],
    traits: ['start_ready'],
    junkEffect: 'gain_punk'
  },
  'argo-yesky': {
    id: 'person-argo-yesky',
    name: 'Argo Yesky',
    type: 'person',
    playCost: 3,
    abilities: [
      {
        effect: 'Do 1 damage to an unprotected enemy card',
        cost: 1,
        type: 'damage',
        target: 'any',
        value: 1
      }
    ],
    traits: ['start_ready', 'gain_punk_on_entry'],
    junkEffect: 'gain_punk'
  },
};

// Helper function to create a new person instance
export function createPerson(cardKey: string): Card | undefined {
  const template = personCards[cardKey];
  
  if (!template) {
    console.error(`Person card template not found: ${cardKey}`);
    return undefined;
  }
  
  // Create a new instance with default game state - use random string for uniqueness
  const randomId = Math.random().toString(36).substring(2, 9);
  const id = `${template.id}-${cardKey}-${randomId}`;
  
  return {
    ...template,
    id: id,
    isDamaged: false,
    isProtected: false,
    isReady: template.traits?.includes('start_ready') || false
  };
}

// Helper function to create multiple copies of a person card
export function createPersonCopies(cardKey: string, count: number): Card[] {
  const cards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    const card = createPerson(cardKey);
    if (card) {
      cards.push(card);
    }
  }
  
  return cards;
}

