// handlers/parachuteBaseAbilityHandler.ts
import { AbilityContext, AbilityService } from '@/types/abilities';
import { Card, PlayerState } from '@/types/game';
import { updateProtectionStatus } from '@/utils/protectionUtils';
import { hasKarliBlazeTrait, hasCardTrait } from '@/utils/gameUtils';

export const parachuteBaseAbilityHandler = (context: AbilityContext): void => {
  const { player, playerState, stateSetters } = context;
  
  // Step 1: Show a modal to select a person card from hand to play
  showPersonSelectionModal(context);
};

// Helper function to show person selection modal
const showPersonSelectionModal = (context: AbilityContext): void => {
  const { player, playerState } = context;
  
  // Filter hand for eligible person cards
  const eligibleCards = playerState.handCards.filter(card => 
    card.type === 'person' && !card.isPunk
  );
  
  if (eligibleCards.length === 0) {
    alert('You have no eligible person cards in your hand!');
    AbilityService.cancelAbility();
    return;
  }
  
  // Create and show the modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.id = 'parachute-base-modal';
  modal.innerHTML = `
    <div class="bg-gray-800 p-4 rounded-lg max-w-md w-full">
      <h2 class="text-white text-xl mb-4">Parachute Base</h2>
      <p class="text-white mb-4">Select a person card from your hand to play:</p>
      <div class="grid grid-cols-3 gap-2 mb-4" id="person-card-container">
        ${eligibleCards.map((card, index) => `
          <div class="bg-gray-700 border border-gray-600 rounded p-2 cursor-pointer hover:bg-gray-600" 
               data-card-index="${index}">
            <div class="text-white text-center text-xs">
              <strong>${card.name}</strong>
              <br />
              Cost: ${card.playCost || 0} Water
              ${card.abilities && card.abilities.length > 0 ? 
                `<br /><span class="text-yellow-300">Has Ability</span>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded w-full" id="cancel-button">
        Cancel
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add click event listeners to cards
  const cardContainer = document.getElementById('person-card-container');
  if (cardContainer) {
    cardContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const cardElement = target.closest('[data-card-index]') as HTMLElement;
      
      if (cardElement) {
        const cardIndex = parseInt(cardElement.getAttribute('data-card-index') || '0');
        const selectedCard = eligibleCards[cardIndex];
        
        // Remove the modal
        document.body.removeChild(modal);
        
        // Proceed to slot selection
        showSlotSelectionModal(context, selectedCard);
      }
    });
  }
  
  // Add cancel button listener
  const cancelButton = document.getElementById('cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      AbilityService.cancelAbility();
    });
  }
};

// Helper function to show slot selection modal
const showSlotSelectionModal = (context: AbilityContext, selectedCard: Card): void => {
  const { player, playerState, stateSetters } = context;
  
  // Create and show the modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.id = 'slot-selection-modal';
  modal.innerHTML = `
    <div class="bg-gray-800 p-4 rounded-lg max-w-md w-full">
      <h2 class="text-white text-xl mb-4">Parachute Base</h2>
      <p class="text-white mb-4">Select a slot to place ${selectedCard.name}:</p>
      <div class="grid grid-cols-3 gap-2 mb-4" id="slot-container">
        ${playerState.personSlots.map((slot, index) => `
          <div class="h-24 border-2 ${slot ? 'bg-gray-600 opacity-50' : 'bg-gray-800 cursor-pointer hover:bg-gray-700 border-purple-400'}" 
               data-slot-index="${index}" ${slot ? 'disabled' : ''}>
            <div class="text-white text-center mt-8">
              ${slot ? 'Occupied' : `Slot ${index + 1}`}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded w-full" id="cancel-slot-button">
        Cancel
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add click event listeners to slots
  const slotContainer = document.getElementById('slot-container');
  if (slotContainer) {
    slotContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const slotElement = target.closest('[data-slot-index]') as HTMLElement;
      
      if (slotElement && !slotElement.hasAttribute('disabled')) {
        const slotIndex = parseInt(slotElement.getAttribute('data-slot-index') || '0');
        
        // Remove the modal
        document.body.removeChild(modal);
        
        // Place the card and proceed to ability use
        placeCardAndUseAbility(context, selectedCard, slotIndex);
      }
    });
  }
  
  // Add cancel button listener
  const cancelButton = document.getElementById('cancel-slot-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      showPersonSelectionModal(context); // Go back to person selection
    });
  }
};

// Helper function to place the card and use its ability
const placeCardAndUseAbility = (context: AbilityContext, card: Card, slotIndex: number): void => {
  const { player, playerState, stateSetters } = context;
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // 1. Pay for the card
  const waterCost = card.playCost || 0;
  
  if (playerState.waterCount < waterCost) {
    alert(`Not enough water to play ${card.name}. Cost: ${waterCost}, Available: ${playerState.waterCount}`);
    AbilityService.cancelAbility();
    return;
  }
  
  // Remove from hand and pay cost
  setPlayerState(prev => {
    const handCards = prev.handCards.filter(c => c.id !== card.id);
    return {
      ...prev,
      handCards,
      waterCount: prev.waterCount - waterCost
    };
  });
  
  // 2. Place the card in the selected slot
  const columnIndex = Math.floor(slotIndex / 2);
  
  // Check if Karli Blaze's trait is active
  const hasKarliEffect = hasKarliBlazeTrait(playerState);
  
  // Determine if the card should start ready
  const shouldStartReady = hasCardTrait(card, 'start_ready') || hasKarliEffect;
  
  setPlayerState(prev => {
    // Place the card in the slot
    const updatedPersonSlots = prev.personSlots.map((slot, i) => 
      i === slotIndex ? { ...card, isReady: true } : slot // Force card to be ready for ability use
    );
    
    // Update protection status
    const { personSlots, campSlots } = updateProtectionStatus(
      updatedPersonSlots, 
      prev.campSlots, 
      columnIndex
    );
    
    return {
      ...prev,
      personSlots,
      campSlots,
      peoplePlayedThisTurn: prev.peoplePlayedThisTurn + 1
    };
  });
  
  // 3. If the card has abilities, show ability selection modal
  if (card.abilities && card.abilities.length > 0) {
    setTimeout(() => {
      showAbilitySelectionModal(context, card, slotIndex);
    }, 100);
  } else {
    // Skip to damaging the card if it has no abilities
    damageCardAndComplete(context, card, slotIndex);
  }
};

// Helper function to show ability selection modal
const showAbilitySelectionModal = (context: AbilityContext, card: Card, slotIndex: number): void => {
  const { player } = context;
  
  if (!card.abilities || card.abilities.length === 0) {
    damageCardAndComplete(context, card, slotIndex);
    return;
  }
  
  // Create and show the modal
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.id = 'ability-selection-modal';
  modal.innerHTML = `
    <div class="bg-gray-800 p-4 rounded-lg max-w-md w-full">
      <h2 class="text-white text-xl mb-4">Parachute Base</h2>
      <p class="text-white mb-4">Select an ability to use:</p>
      <div class="flex flex-col gap-2 mb-4" id="ability-container">
        ${card.abilities.map((ability, index) => `
          <div class="bg-gray-700 border border-gray-600 rounded p-2 cursor-pointer hover:bg-gray-600" 
               data-ability-index="${index}">
            <div class="text-white">
              <strong>${ability.effect || 'Unknown effect'}</strong>
              <br />
              Cost: ${ability.cost} Water
            </div>
          </div>
        `).join('')}
      </div>
      <button class="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded w-full" id="cancel-ability-button">
        Skip ability use
      </button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add click event listeners to abilities
  const abilityContainer = document.getElementById('ability-container');
  if (abilityContainer) {
    abilityContainer.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const abilityElement = target.closest('[data-ability-index]') as HTMLElement;
      
      if (abilityElement) {
        const abilityIndex = parseInt(abilityElement.getAttribute('data-ability-index') || '0');
        const selectedAbility = card.abilities?.[abilityIndex];
        
        if (selectedAbility) {
          // Remove the modal
          document.body.removeChild(modal);
          
          // Use the ability
          useAbilityAndDamage(context, card, slotIndex, selectedAbility);
        }
      }
    });
  }
  
  // Add cancel button listener
  const cancelButton = document.getElementById('cancel-ability-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      document.body.removeChild(modal);
      damageCardAndComplete(context, card, slotIndex);
    });
  }
};

// Helper function to use the selected ability and then damage the card
const useAbilityAndDamage = (context: AbilityContext, card: Card, slotIndex: number, ability: any): void => {
  const { player, playerState, stateSetters } = context;
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // 1. Pay the ability cost
  const abilityCost = ability.cost || 0;
  
  if (playerState.waterCount < abilityCost) {
    alert(`Not enough water to use this ability. Cost: ${abilityCost}, Available: ${playerState.waterCount}`);
    damageCardAndComplete(context, card, slotIndex);
    return;
  }
  
  setPlayerState(prev => ({
    ...prev,
    waterCount: prev.waterCount - abilityCost
  }));
  
  // 2. Create a new context for the ability
  const abilityContext: AbilityContext = {
    ...context,
    sourceCard: card,
    sourceLocation: { type: 'person', index: slotIndex },
    ability: ability,
    callbacks: {
      onComplete: () => {
        // When the ability is complete, damage the card
        setTimeout(() => {
          damageCardAndComplete(context, card, slotIndex);
        }, 100);
      },
      onCancel: () => {
        // If the ability is cancelled, still damage the card
        damageCardAndComplete(context, card, slotIndex);
      }
    }
  };
  
  // 3. Execute the ability
  const AbilityRegistry = (window as any).AbilityRegistry;
  if (AbilityRegistry) {
    AbilityRegistry.executeAbility(abilityContext);
  } else {
    console.error('AbilityRegistry not found');
    damageCardAndComplete(context, card, slotIndex);
  }
};

// Helper function to damage the card and complete the Parachute Base ability
const damageCardAndComplete = (context: AbilityContext, card: Card, slotIndex: number): void => {
  const { player, stateSetters } = context;
  const setPlayerState = player === 'left' ? stateSetters.setLeftPlayerState : stateSetters.setRightPlayerState;
  
  // 1. Damage the card
  setPlayerState(prev => ({
    ...prev,
    personSlots: prev.personSlots.map((slot, i) => 
      i === slotIndex ? { ...slot, isDamaged: true, isReady: false } : slot
    )
  }));
  
  alert(`${card.name} was damaged after use!`);
  
  // 2. Complete the Parachute Base ability
  AbilityService.completeAbility();
};