// utils/abilityExecutor.ts

import { AbilityRegistry } from '../services/abilityRegistry';
import { waterAbilityHandler } from '../handlers/waterAbilityHandler';
import { damageAbilityHandler } from '../handlers/damageAbilityHandler';
import { drawAbilityHandler } from '../handlers/drawAbilityHandler';

export const initializeAbilitySystem = () => {
  AbilityRegistry.register('water', waterAbilityHandler);
  AbilityRegistry.register('damage', damageAbilityHandler);
  AbilityRegistry.register('draw', drawAbilityHandler);
};