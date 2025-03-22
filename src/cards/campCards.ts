// campCards.ts
'use client';
import { Card } from '@/types/game';

export const campCards: { [key: string]: Omit<Card, 'isDamaged' | 'isProtected'> } = {
  'railgun': {
    id: 'camp-railgun',
    name: 'Railgun',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'Damage',
        cost: 2,
        type: 'damage',
        target: 'any',
        value: 1,
      }
    ],
    traits: [],
  },
  'atomic-garden': {
    id: 'camp-atomic-garden',
    name: 'Atomic Garden',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Restore a damaged person. They become ready',
        cost: 2,
        type: 'restore_person_ready',
        target: 'own_person',
      }
    ],
    traits: [],
  },
  'cannon': {
    id: 'camp-cannon',
    name: 'Cannon',
    type: 'camp',
    campDraw: 2,
    abilities: [
      {
        effect: 'If this card is undamaged, Damage.',
        cost: 2,
        type: 'conditional_damage',
        condition: 'self_undamaged',
        target: 'any',
        value: 1,
      }
    ],
    traits: ['starts_damaged'],
  },
  'pillbox': {
    id: 'camp-pillbox',
    name: 'Pillbox',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Damage. This ability costs 1 less for each destroyed camp you have.',
        cost: 3,
        type: 'damage',
        target: 'any',
        value: 1,
        costModifier: 'destroyed_camps',
      }
    ],
    traits: [],
  },
  'scud-launcher': {
    id: 'camp-scud-launcher',
    name: 'Scud Launcher',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: "Damage one of the opponent's cards of their choice.",
        cost: 1,
        type: 'opponent_choice_damage',
        target: 'opponent_choice',
        value: 1,
      }
    ],
    traits: [],
  },
  'victory-totem': {
    id: 'camp-victory-totem',
    name: 'Victory Totem',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Damage',
        cost: 2,
        type: 'damage',
        target: 'any',
        value: 1,
      },
      {
        effect: 'Raid',
        cost: 2,
        type: 'raid',
      }
    ],
    traits: [],
  },
  'catapult': {
    id: 'camp-catapult',
    name: 'Catapult',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'Damage any card. Then destroy one of your people.',
        cost: 2,
        type: 'damage_then_sacrifice',
        target: 'any_protected',
        value: 1,
      }
    ],
    traits: [],
  },
  'nest-of-spies': {
    id: 'camp-nest-of-spies',
    name: 'Nest of Spies',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'If you have put 2 or more people into play this turn Damage.',
        cost: 1,
        type: 'conditional_damage',
        condition: 'played_two_people',
        target: 'any',
        value: 1,
      }
    ],
    traits: [],
  },
  'command-post': {
    id: 'camp-command-post',
    name: 'Command Post',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Damage. This ability costs 1 less for each Punk you have.',
        cost: 3,
        type: 'damage',
        target: 'any',
        value: 1,
        costModifier: 'punks_owned',
      }
    ],
    traits: [],
  },
  'obelisk': {
    id: 'camp-obelisk',
    name: 'Obelisk',
    type: 'camp',
    campDraw: 1,
    abilities: [],
    traits: ['win_on_empty_deck'],
  },
  'mercenary-camp': {
    id: 'camp-mercenary-camp',
    name: 'Mercenary Camp',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'Damage any camp if you have 4 or more people.',
        cost: 2,
        type: 'conditional_damage_camp',
        condition: 'four_or_more_people',
        target: 'enemy_camp',
        value: 1,
      }
    ],
    traits: [],
  },
  'reactor': {
    id: 'camp-reactor',
    name: 'Reactor',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Destroy this card and all people.',
        cost: 2,
        type: 'destroy_all_people',
      }
    ],
    traits: [],
  },
  'the-octagon': {
    id: 'camp-the-octagon',
    name: 'The Octagon',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'Destroy one of your people. If you do the opponent destroys one of theirs.',
        cost: 1,
        type: 'sacrifice_for_opponent_sacrifice',
      }
    ],
    traits: [],
  },
  'juggernaut': {
    id: 'camp-juggernaut',
    name: 'Juggernaut',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'Move this card forward one space (people go behind). On its third move return to its starting position then the opponent destroys one of their camps.',
        cost: 1,
        type: 'juggernaut_advance',
      }
    ],
    traits: ['movable'],
  },
  'scavenger-camp': {
    id: 'camp-scavenger-camp',
    name: 'Scavenger Camp',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Discard a card (not Water Silo). Then either Gain a Punk or Gain an Extra Water.',
        cost: 0,
        type: 'discard_for_punk_or_water',
      }
    ],
    traits: [],
  },
  'outpost': {
    id: 'camp-outpost',
    name: 'Outpost',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Raid',
        cost: 2,
        type: 'raid',
      },
      {
        effect: 'Restore',
        cost: 2,
        type: 'restore',
        target: 'own_any',
      }
    ],
    traits: [],
  },
  'transplant-lab': {
    id: 'camp-transplant-lab',
    name: 'Transplant Lab',
    type: 'camp',
    campDraw: 2,
    abilities: [
      {
        effect: 'If you have put 2 or more people into play this turn Restore.',
        cost: 1,
        type: 'conditional_restore',
        condition: 'played_two_people',
        target: 'own_any',
      }
    ],
    traits: ['cannot_self_restore'],
  },
  'resonator': {
    id: 'camp-resonator',
    name: 'Resonator',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Damage. This must be the only ability you use this turn.',
        cost: 1,
        type: 'exclusive_damage',
        target: 'any',
        value: 1,
      }
    ],
    traits: [],
  },
  'bonfire': {
    id: 'camp-bonfire',
    name: 'Bonfire',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Damage this card, then Restore any number of cards',
        cost: 0,
        type: 'self_damage_then_restore_any',
        target: 'own_any',
      }
    ],
    traits: ['cannot_restore'],
  },
  'cache': {
    id: 'camp-cache',
    name: 'Cache',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Raid and Gain a Punk.',
        cost: 2,
        type: 'raid_and_punk',
      }
    ],
    traits: [],
  },
  'watchtower': {
    id: 'camp-watchtower',
    name: 'Watchtower',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'If any event resolved this turn Damage.',
        cost: 1,
        type: 'conditional_damage',
        condition: 'event_resolved',
        target: 'any',
        value: 1,
      }
    ],
    traits: [],
  },
  'construction-yard': {
    id: 'camp-construction-yard',
    name: 'Construction Yard',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Move any person to any place (on the same side).',
        cost: 1,
        type: 'move_person',
      },
      {
        effect: 'Raid.',
        cost: 2,
        type: 'raid',
      }
    ],
    traits: [],
  },
  'adrenaline-lab': {
    id: 'camp-adrenaline-lab',
    name: 'Adrenaline Lab',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Use the ability of any one of your damaged people (you must still pay). Then destroy it.',
        cost: 0,
        type: 'use_damaged_person_ability',
      }
    ],
    traits: [],
  },
  'mulcher': {
    id: 'camp-mulcher',
    name: 'Mulcher',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'Destroy one of your people. Then Draw 1 card.',
        cost: 0,
        type: 'sacrifice_for_draw',
      }
    ],
    traits: [],
  },
  'blood-bank': {
    id: 'camp-blood-bank',
    name: 'Blood Bank',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Destroy one of your people. Then Gain extra water.',
        cost: 0,
        type: 'sacrifice_for_water',
      }
    ],
    traits: [],
  },
  'arcade': {
    id: 'camp-arcade',
    name: 'Arcade',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'If you have 0 or 1 people Gain Punk.',
        cost: 1,
        type: 'conditional_gain_punk',
        condition: 'one_or_zero_people',
      }
    ],
    traits: [],
  },
  'training-camp': {
    id: 'camp-training-camp',
    name: 'Training Camp',
    type: 'camp',
    campDraw: 2,
    abilities: [
      {
        effect: 'If you have 2 people in this column, Damage.',
        cost: 2,
        type: 'conditional_damage',
        condition: 'two_people_in_column',
        target: 'any',
        value: 1,
      }
    ],
    traits: [],
  },
  'supply-depot': {
    id: 'camp-supply-depot',
    name: 'Supply Depot',
    type: 'camp',
    campDraw: 2,
    abilities: [
      {
        effect: 'Draw 2 cards. Then discard one of these cards.',
        cost: 2,
        type: 'draw_then_discard',
        drawCount: 2,
        discardCount: 1,
      }
    ],
    traits: [],
  },
  'omen-clock': {
    id: 'camp-omen-clock',
    name: 'Omen Clock',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Advance any event by 1 queue.',
        cost: 1,
        type: 'advance_event',
      }
    ],
    traits: [],
  },
  'warehouse': {
    id: 'camp-warehouse',
    name: 'Warehouse',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'If opponent has an unprotected camp, Restore.',
        cost: 1,
        type: 'conditional_restore',
        condition: 'opponent_has_unprotected_camp',
        target: 'own_any',
      }
    ],
    traits: [],
  },
  'garage': {
    id: 'camp-garage',
    name: 'Garage',
    type: 'camp',
    campDraw: 0,
    abilities: [
      {
        effect: 'Raid',
        cost: 1,
        type: 'raid',
      }
    ],
    traits: [],
  },
  'oasis': {
    id: 'camp-oasis',
    name: 'Oasis',
    type: 'camp',
    campDraw: 1,
    abilities: [],
    traits: ['discount_column'],
  },
  'parachute-base': {
    id: 'camp-parachute-base',
    name: 'Parachute Base',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Play a person and use their ability (you must pay for both). Then damage them.',
        cost: 0,
        type: 'play_use_damage_person',
      }
    ],
    traits: [],
  },
  'labor-camp': {
    id: 'camp-labor-camp',
    name: 'Labor Camp',
    type: 'camp',
    campDraw: 1,
    abilities: [
      {
        effect: 'Destroy one of your people. Then Restore.',
        cost: 0,
        type: 'sacrifice_for_restore',
        target: 'own_any',
      }
    ],
    traits: ['cannot_self_restore'],
  },
};

// Helper function to create a new camp instance
export function createCamp(cardKey: string): Card | undefined {
  const template = campCards[cardKey];

  
  if (!template) {
    console.error(`Camp card template not found: ${cardKey}`);
    return undefined;
  }
  
  // Create a new instance with default game state - use random string for uniqueness
  const randomId = Math.random().toString(36).substring(2, 9);
  const id = `${template.id}-${cardKey}-${randomId}`;
  
  // Apply any default traits (e.g., starts the game damaged)
  const isDamaged = template.traits?.includes('starts_damaged') || false;
  
  return {
    ...template,
    id: id,
    isDamaged: isDamaged,
    isProtected: false,
    isReady: true 
  };
}