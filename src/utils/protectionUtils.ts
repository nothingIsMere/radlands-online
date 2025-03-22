// protectionUtils.ts
import { Card } from '@/types/game';


/**
 * Updates the protected status of person cards and camps based on their positions
 * @param personSlots The array of person slots to update
 * @param campSlots The array of camp slots to update
 * @param affectedColumnIndex Optional - only update protection for this column
 * @returns Updated person slots and camp slots
 */
export const updateProtectionStatus = (
  personSlots: (Card | null)[],
  campSlots: (Card | null)[],
  affectedColumnIndex?: number
): { personSlots: (Card | null)[]; campSlots: (Card | null)[] } => {
  // Clone the arrays to avoid direct mutation
  const updatedPersonSlots = [...personSlots];
  const updatedCampSlots = [...campSlots];

  // If a specific column is affected, only update that column
  if (affectedColumnIndex !== undefined) {
    const i = affectedColumnIndex * 2; // Convert column index to person slot index
    const frontPersonSlot = updatedPersonSlots[i];
    const backPersonSlot = updatedPersonSlots[i + 1];
    const camp = updatedCampSlots[affectedColumnIndex];

    // Update person slot protection
    if (backPersonSlot) {
      backPersonSlot.isProtected = frontPersonSlot !== null;
    }
    if (frontPersonSlot) {
      frontPersonSlot.isProtected = false; // Front row is never protected
    }

    // Update camp protection
    if (camp) {
      camp.isProtected = frontPersonSlot !== null || backPersonSlot !== null;
    }
  } else {
    // For each column (0/1, 2/3, 4/5)
    for (let i = 0; i < 6; i += 2) {
      const frontPersonSlot = updatedPersonSlots[i];
      const backPersonSlot = updatedPersonSlots[i + 1];
      const campIndex = i / 2; // Convert person slot index to camp index (0,2,4 -> 0,1,2)
      const camp = updatedCampSlots[campIndex];

      // Update person slot protection
      if (backPersonSlot) {
        backPersonSlot.isProtected = frontPersonSlot !== null;
      }
      if (frontPersonSlot) {
        frontPersonSlot.isProtected = false; // Front row is never protected
      }

      // Update camp protection
      if (camp) {
        camp.isProtected = frontPersonSlot !== null || backPersonSlot !== null;
      }
    }
  }

  return { personSlots: updatedPersonSlots, campSlots: updatedCampSlots };
};

/**
 * Checks if a specific card is protected
 * @param card The card to check
 * @param personSlots The array of person slots
 * @param campSlots The array of camp slots
 * @param slotIndex The index of the card's slot
 * @param slotType The type of slot ('person' or 'camp')
 * @returns True if the card is protected
 */
export const isCardProtected = (
  card: Card,
  personSlots: (Card | null)[],
  campSlots: (Card | null)[],
  slotIndex: number,
  slotType: 'person' | 'camp'
): boolean => {
  if (slotType === 'person') {
    // Front row (even indices) are never protected
    if (slotIndex % 2 === 0) {
      return false;
    }
    
    // Back row (odd indices) are protected if front row has a card
    const frontRowIndex = slotIndex - 1;
    return personSlots[frontRowIndex] !== null;
  } else if (slotType === 'camp') {
    // Camps are protected if any person is in their column
    const columnStartIndex = slotIndex * 2;
    return personSlots[columnStartIndex] !== null || personSlots[columnStartIndex + 1] !== null;
  }
  
  return false;
};
