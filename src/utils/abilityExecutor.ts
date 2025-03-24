// utils/abilityExecutor.ts
import { AbilityRegistry } from '../../services/abilityRegistry';
import { 
  SharedAbilityType, 
  PersonAbilityType, 
  CampAbilityType 
} from '../types/abilityTypes';

// Import shared abilities
import { damageAbilityHandler } from '../../handlers/damageAbilityHandler';
import { drawAbilityHandler } from '../../handlers/drawAbilityHandler';
import { gainPunkAbilityHandler } from '../../handlers/gainPunkAbilityHandler';
import { injureAbilityHandler } from '../../handlers/injureAbilityHandler';
import { raidAbilityHandler } from '../../handlers/raidAbilityHandler';
import { restoreAbilityHandler } from '../../handlers/restoreAbilityHandler';
import { waterAbilityHandler } from '../../handlers/waterAbilityHandler';

// Import person-specific abilities
import { damageCampAbilityHandler } from '../../handlers/person/damageCampAbilityHandler';
import { damageColumnAbilityHandler } from '../../handlers/person/damageColumnAbilityHandler';
import { damageConditionalEventAbilityHandler } from '../../handlers/person/damageConditionalEventAbilityHandler';
import { destroyDamagedAllAbilityHandler } from '../../handlers/person/destroyDamagedAllAbilityHandler';
import { destroyPersonAbilityHandler } from '../../handlers/person/destroyPersonAbilityHandler';
import { drawThenDiscardAbilityHandler } from '../../handlers/person/drawThenDiscardAbilityHandler';
import { injureAllAbilityHandler } from '../../handlers/person/injureAllAbilityHandler';
import { mimicAbilityHandler } from '../../handlers/person/mimicAbilityHandler';
import { mutantAbilityHandler } from '../../handlers/person/mutantAbilityHandler';
import { punkDamageAbilityHandler } from '../../handlers/person/punkDamageAbilityHandler';
import { returnToHandAbilityHandler } from '../../handlers/person/returnToHandAbilityHandler';
import { sacrificeThenDamageAbilityHandler } from '../../handlers/person/sacrificeThenDamageAbilityHandler';
import { scientistAbilityHandler } from '../../handlers/person/scientistAbilityHandler';
import { sniperDamageAbilityHandler } from '../../handlers/person/sniperDamageAbilityHandler';
import { vanguardDamageAbilityHandler } from '../../handlers/person/vanguardDamageAbilityHandler';
import { destroyAnyCampAbilityHandler } from '../../handlers/person/destroyAnyCampAbilityHandler';

// Import camp-specific abilities (commented out for now - will implement later)
// import { advanceEventAbilityHandler } from '../handlers/camp/advanceEventAbilityHandler';
// import { conditionalDamageAbilityHandler } from '../handlers/camp/conditionalDamageAbilityHandler';
// import { conditionalDamageCampAbilityHandler } from '../handlers/camp/conditionalDamageCampAbilityHandler';
// import { conditionalGainPunkAbilityHandler } from '../handlers/camp/conditionalGainPunkAbilityHandler';
// import { conditionalRestoreAbilityHandler } from '../handlers/camp/conditionalRestoreAbilityHandler';
// import { destroyAllPeopleAbilityHandler } from '../handlers/camp/destroyAllPeopleAbilityHandler';
// import { discardForPunkOrWaterAbilityHandler } from '../handlers/camp/discardForPunkOrWaterAbilityHandler';
// import { exclusiveDamageAbilityHandler } from '../handlers/camp/exclusiveDamageAbilityHandler';
// import { movePersonAbilityHandler } from '../handlers/camp/movePersonAbilityHandler';
// import { raidAndPunkAbilityHandler } from '../handlers/camp/raidAndPunkAbilityHandler';
// import { sacrificeForDrawAbilityHandler } from '../handlers/camp/sacrificeForDrawAbilityHandler';
// import { sacrificeForOpponentSacrificeAbilityHandler } from '../handlers/camp/sacrificeForOpponentSacrificeAbilityHandler';
// import { sacrificeForRestoreAbilityHandler } from '../handlers/camp/sacrificeForRestoreAbilityHandler';
// import { sacrificeForWaterAbilityHandler } from '../handlers/camp/sacrificeForWaterAbilityHandler';
// import { selfDamageThenRestoreAnyAbilityHandler } from '../handlers/camp/selfDamageThenRestoreAnyAbilityHandler';

export const initializeAbilitySystem = () => {
  initializeSharedAbilities();
  initializePersonAbilities();
  // Later: initializeCampAbilities();
};

const initializeSharedAbilities = () => {
  console.log("Registering shared abilities...");
  
  // Register shared abilities
  AbilityRegistry.register('damage', damageAbilityHandler);
  AbilityRegistry.register('draw', drawAbilityHandler);
  AbilityRegistry.register('gain_punk_ability', gainPunkAbilityHandler);
  AbilityRegistry.register('injure', injureAbilityHandler);
  AbilityRegistry.register('raid', raidAbilityHandler);
  AbilityRegistry.register('restore', restoreAbilityHandler);
  AbilityRegistry.register('water', waterAbilityHandler);
};

const initializePersonAbilities = () => {
  console.log("Registering person card abilities...");
  
  // Register person-specific abilities
  AbilityRegistry.register('damage_camp', damageCampAbilityHandler);
  AbilityRegistry.register('damage_column', damageColumnAbilityHandler);
  AbilityRegistry.register('damage_conditional_event', damageConditionalEventAbilityHandler);
  AbilityRegistry.register('destroy_damaged_all', destroyDamagedAllAbilityHandler);
  AbilityRegistry.register('destroy_person', destroyPersonAbilityHandler);
  AbilityRegistry.register('draw_then_discard', drawThenDiscardAbilityHandler);
  AbilityRegistry.register('injure_all', injureAllAbilityHandler);
  AbilityRegistry.register('mimic_ability', mimicAbilityHandler);
  AbilityRegistry.register('mutant_ability', mutantAbilityHandler);
  AbilityRegistry.register('punk_damage', punkDamageAbilityHandler);
  AbilityRegistry.register('return_to_hand', returnToHandAbilityHandler);
  AbilityRegistry.register('sacrifice_then_damage', sacrificeThenDamageAbilityHandler);
  AbilityRegistry.register('scientist_ability', scientistAbilityHandler);
  AbilityRegistry.register('sniper_damage', sniperDamageAbilityHandler);
  AbilityRegistry.register('vanguard_damage', vanguardDamageAbilityHandler);
  AbilityRegistry.register('destroy_any_camp', destroyAnyCampAbilityHandler);
};

// Commented out for now - will implement later
/*
const initializeCampAbilities = () => {
  console.log("Registering camp card abilities...");
  
  // Register camp-specific abilities
  AbilityRegistry.register('advance_event', advanceEventAbilityHandler);
  AbilityRegistry.register('conditional_damage', conditionalDamageAbilityHandler);
  AbilityRegistry.register('conditional_damage_camp', conditionalDamageCampAbilityHandler);
  AbilityRegistry.register('conditional_gain_punk', conditionalGainPunkAbilityHandler);
  AbilityRegistry.register('conditional_restore', conditionalRestoreAbilityHandler);
  AbilityRegistry.register('destroy_all_people', destroyAllPeopleAbilityHandler);
  AbilityRegistry.register('discard_for_punk_or_water', discardForPunkOrWaterAbilityHandler);
  AbilityRegistry.register('exclusive_damage', exclusiveDamageAbilityHandler);
  AbilityRegistry.register('move_person', movePersonAbilityHandler);
  AbilityRegistry.register('raid_and_punk', raidAndPunkAbilityHandler);
  AbilityRegistry.register('sacrifice_for_draw', sacrificeForDrawAbilityHandler);
  AbilityRegistry.register('sacrifice_for_opponent_sacrifice', sacrificeForOpponentSacrificeAbilityHandler);
  AbilityRegistry.register('sacrifice_for_restore', sacrificeForRestoreAbilityHandler);
  AbilityRegistry.register('sacrifice_for_water', sacrificeForWaterAbilityHandler);
  AbilityRegistry.register('self_damage_then_restore_any', selfDamageThenRestoreAnyAbilityHandler);
};
*/