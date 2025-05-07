import { useState } from 'react';
import { 
  BaseCard, 
  CampCard, 
  PersonCard, 
  EventCard, 
  CardType,
  EffectType
} from '../models';
import './CardDisplay.css';

// Example cards
const exampleCamp: CampCard = {
  id: '1',
  name: 'Railgun',
  type: CardType.CAMP,
  description: 'A basic camp with a damage ability',
  imageUrl: '/camps/railgun.png',
  traits: [],
  ability: {
    id: 'railgun-ability',
    name: 'Damage',
    description: 'Deal damage to an unprotected enemy card',
    waterCost: 2,
    effect: {
      type: EffectType.DAMAGE,
      execute: () => {
        throw new Error('Not implemented');
      },
      canBeExecuted: () => true
    }
  },
  startingCards: 0,
  isDamaged: false,
  isDestroyed: false
};

const examplePerson: PersonCard = {
  id: '2',
  name: 'Vigilante',
  type: CardType.PERSON,
  description: 'A person with a basic injure ability',
  imageUrl: '/persons/vigilante.png',
  traits: [],
  waterCost: 1,
  ability: {
    id: 'vigilante-ability',
    name: 'Injure',
    description: 'Injure an unprotected enemy person',
    waterCost: 1,
    effect: {
      type: EffectType.INJURE,
      execute: () => {
        throw new Error('Not implemented');
      },
      canBeExecuted: () => true
    }
  },
  isDamaged: false,
  isReady: true,
  isPunk: false
};

const exampleEvent: EventCard = {
  id: '3',
  name: 'Strafe',
  type: CardType.EVENT,
  description: 'Injure all unprotected enemies',
  imageUrl: '/events/strafe.png',
  traits: [],
  waterCost: 2,
  effect: {
    type: EffectType.INJURE,
    execute: () => {
      throw new Error('Not implemented');
    },
    canBeExecuted: () => true
  },
  eventNumber: 0
};

interface CardDisplayProps {
  showCards?: boolean;
}

export const CardDisplay = ({ showCards = true }: CardDisplayProps) => {
  const [selectedCard, setSelectedCard] = useState<BaseCard | null>(null);

  // Skip rendering if showCards is false
  if (!showCards) {
    return null;
  }

  const renderCardDetails = (card: BaseCard) => {
    switch (card.type) {
      case CardType.CAMP:
        const campCard = card as CampCard;
        return (
          <div>
            <p><strong>Starting Cards:</strong> {campCard.startingCards}</p>
            <p><strong>Ability:</strong> {campCard.ability.name} ({campCard.ability.waterCost} water)</p>
            <p><strong>Damaged:</strong> {campCard.isDamaged ? 'Yes' : 'No'}</p>
            <p><strong>Destroyed:</strong> {campCard.isDestroyed ? 'Yes' : 'No'}</p>
          </div>
        );
      case CardType.PERSON:
        const personCard = card as PersonCard;
        return (
          <div>
            <p><strong>Water Cost:</strong> {personCard.waterCost}</p>
            <p><strong>Ability:</strong> {personCard.ability.name} ({personCard.ability.waterCost} water)</p>
            <p><strong>Ready:</strong> {personCard.isReady ? 'Yes' : 'No'}</p>
            <p><strong>Damaged:</strong> {personCard.isDamaged ? 'Yes' : 'No'}</p>
            <p><strong>Punk:</strong> {personCard.isPunk ? 'Yes' : 'No'}</p>
          </div>
        );
      case CardType.EVENT:
        const eventCard = card as EventCard;
        return (
          <div>
            <p><strong>Water Cost:</strong> {eventCard.waterCost}</p>
            <p><strong>Queue Position:</strong> {eventCard.eventNumber}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const getCardTypeAttribute = (type: CardType): string => {
    switch (type) {
      case CardType.CAMP: return 'camp';
      case CardType.PERSON: return 'person';
      case CardType.EVENT: return 'event';
      default: return '';
    }
  };

  return (
    <div className="card-display">
      <h2>Example Cards</h2>
      <div className="card-list">
        <div 
          className="card-item" 
          data-card-type={getCardTypeAttribute(exampleCamp.type)}
          onClick={() => setSelectedCard(exampleCamp)}
        >
          <h3>{exampleCamp.name}</h3>
          <div className="card-type">Camp</div>
        </div>
        <div 
          className="card-item" 
          data-card-type={getCardTypeAttribute(examplePerson.type)}
          onClick={() => setSelectedCard(examplePerson)}
        >
          <h3>{examplePerson.name}</h3>
          <div className="card-type">Person</div>
        </div>
        <div 
          className="card-item" 
          data-card-type={getCardTypeAttribute(exampleEvent.type)}
          onClick={() => setSelectedCard(exampleEvent)}
        >
          <h3>{exampleEvent.name}</h3>
          <div className="card-type">Event</div>
        </div>
      </div>

      {selectedCard && (
        <div className="card-details">
          <h3>{selectedCard.name}</h3>
          <p>{selectedCard.description}</p>
          {renderCardDetails(selectedCard)}
          <button onClick={() => setSelectedCard(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default CardDisplay;