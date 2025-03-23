// utils/abilityExecutor.ts

import { AbilityRegistry } from '../services/abilityRegistry';
import { waterAbilityHandler } from '../handlers/waterAbilityHandler';
import { damageAbilityHandler } from '../handlers/damageAbilityHandler';
import { drawAbilityHandler } from '../handlers/drawAbilityHandler';
import { restoreAbilityHandler } from '../handlers/restoreAbilityHandler';
import { injureAbilityHandler } from '../handlers/injureAbilityHandler';

export const initializeAbilitySystem = () => {
  AbilityRegistry.register('water', waterAbilityHandler);
  AbilityRegistry.register('damage', damageAbilityHandler);
  AbilityRegistry.register('draw', drawAbilityHandler);
  AbilityRegistry.register('restore', restoreAbilityHandler);
  AbilityRegistry.register('injure', injureAbilityHandler);
};