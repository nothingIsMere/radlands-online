// handlers/person/mimicAbilityHandler.ts
import { AbilityContext } from '../../types/abilities';
import { AbilityService } from '../../services/abilityService';

export const mimicAbilityHandler = (context: AbilityContext): void => {
  const { player, stateSetters } = context;
  
  // Extract the necessary state setters
  const { 
    setMimicMode,
    setMimicSourceCard, 
    setMimicSourceLocation 
  } = stateSetters;
  
  // Set up mimic mode to select a card to copy the ability from
  setMimicMode(true);
  
  // Store the source card and location for reference
  setMimicSourceCard(context.sourceCard);
  setMimicSourceLocation(context.sourceLocation);
  
  // Display message to player
  alert(`Select one of your ready person cards or an undamaged enemy person card to mimic its ability`);
  
  // The actual ability execution will be handled in the onClick handler of PersonSlot
  // when the player selects a card to mimic
  
  // Mark the ability as pending - will be completed when selection is done
  AbilityService.setPendingAbility(true);
};