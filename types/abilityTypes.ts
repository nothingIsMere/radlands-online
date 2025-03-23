// types/abilityTypes.ts

// Shared abilities that can be used by both person and camp cards
export type SharedAbilityType = 
  'water' | 
  'damage' | 
  'restore' | 
  'draw' | 
  'injure' | 
  'raid' | 
  'gain_punk_ability';

// Abilities specific to person cards
export type PersonAbilityType = 
  'sniper_damage' | 
  'damage_camp' | 
  'damage_column' | 
  'damage_conditional_event' |
  'destroy_damaged_all' | 
  'destroy_person' | 
  'draw_then_discard' | 
  'injure_all' |
  'mimic_ability' | 
  'mutant_ability' | 
  'punk_damage' | 
  'return_to_hand' |
  'sacrifice_then_damage' | 
  'scientist_ability' | 
  'vanguard_damage';

// Abilities specific to camp cards
export type CampAbilityType = 
  'advance_event' | 
  'conditional_damage' | 
  'conditional_damage_camp' |
  'conditional_gain_punk' | 
  'conditional_restore' | 
  'destroy_all_people' |
  'discard_for_punk_or_water' | 
  'exclusive_damage' | 
  'move_person' |
  'raid_and_punk' | 
  'sacrifice_for_draw' | 
  'sacrifice_for_opponent_sacrifice' |
  'sacrifice_for_restore' | 
  'sacrifice_for_water' | 
  'self_damage_then_restore_any';

// Unified ability type that includes all types of abilities
export type AbilityType = SharedAbilityType | PersonAbilityType | CampAbilityType;

// Helper functions to check ability types
export const isSharedAbility = (type: AbilityType): type is SharedAbilityType => {
  return [
    'water', 'damage', 'restore', 'draw', 'injure', 'raid', 'gain_punk_ability'
  ].includes(type as SharedAbilityType);
};

export const isPersonAbility = (type: AbilityType): type is PersonAbilityType => {
  return [
    'sniper_damage', 'damage_camp', 'damage_column', 'damage_conditional_event',
    'destroy_damaged_all', 'destroy_person', 'draw_then_discard', 'injure_all',
    'mimic_ability', 'mutant_ability', 'punk_damage', 'return_to_hand',
    'sacrifice_then_damage', 'scientist_ability', 'vanguard_damage'
  ].includes(type as PersonAbilityType);
};

export const isCampAbility = (type: AbilityType): type is CampAbilityType => {
  return [
    'advance_event', 'conditional_damage', 'conditional_damage_camp',
    'conditional_gain_punk', 'conditional_restore', 'destroy_all_people',
    'discard_for_punk_or_water', 'exclusive_damage', 'move_person',
    'raid_and_punk', 'sacrifice_for_draw', 'sacrifice_for_opponent_sacrifice',
    'sacrifice_for_restore', 'sacrifice_for_water', 'self_damage_then_restore_any'
  ].includes(type as CampAbilityType);
};