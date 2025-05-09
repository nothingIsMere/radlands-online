import React, { useState, useRef, useEffect } from 'react';
import { PersonCard, EventCard, WaterSiloCard, CardType } from '../models';
import './CardModal.css';

type Card = PersonCard | EventCard | WaterSiloCard;

interface CardModalProps {
  cards: Card[];
  water: number;
  initialCardIndex?: number;
  onClose: () => void;
  onPlayCard: (card: Card) => void;
  onJunkCard: (card: Card) => void;
}

const CardModal: React.FC<CardModalProps> = ({ 
  cards, 
  water, 
  initialCardIndex = 0,
  onClose, 
  onPlayCard, 
  onJunkCard 
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialCardIndex);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  if (cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex];
  
  // Effect to set initial scroll position to show the clicked card
  useEffect(() => {
    // Ensure initialCardIndex is valid
    if (initialCardIndex >= 0 && initialCardIndex < cards.length) {
      setCurrentIndex(initialCardIndex);

      // Apply any specific scroll positioning if needed
      // For our current structure, this isn't needed as we're showing one card at a time
      // But this could be useful if we had a carousel-like UI with multiple cards visible
    }
  }, [initialCardIndex, cards.length]);
  
  const handlePrevCard = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? cards.length - 1 : prevIndex - 1
    );
  };

  const handleNextCard = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === cards.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePlayCard = () => {
    onPlayCard(currentCard);
  };

  const handleJunkCard = () => {
    onJunkCard(currentCard);
  };

  // Check if card is playable based on water cost and card type
  const isPlayable = () => {
    // Water Silo is never playable - it can only be junked
    if ('type' in currentCard && currentCard.type === 'waterSilo') {
      return false; // Water Silo cannot be played, only junked
    }
    
    if ('waterCost' in currentCard) {
      return currentCard.waterCost <= water;
    }
    
    return false;
  };
  
  // Check if current card is a Water Silo
  const isWaterSilo = () => {
    return 'type' in currentCard && currentCard.type === 'waterSilo';
  };

  // Render card details based on card type
  const renderCardDetails = () => {
    if ('type' in currentCard && currentCard.type === 'waterSilo') {
      return (
        <div className="card-modal-details water-silo-details">
          <h3>Water Silo</h3>
          <p className="card-description">
            Provides extra water each turn when placed in your play area.
          </p>
          <div className="card-instructions">
            <strong>Special Card:</strong> The Water Silo can only be junked, not played. 
            When junked, it returns to its slot and gives you 1 water token.
          </div>
        </div>
      );
    }

    if ('type' in currentCard && currentCard.type === CardType.PERSON) {
      const personCard = currentCard as PersonCard;
      return (
        <div className="card-modal-details person-details">
          <div className="card-header">
            <h3>{personCard.name}</h3>
            <div className="card-cost">{personCard.waterCost} Water</div>
          </div>
          <p className="card-description">{personCard.description}</p>
          <div className="card-ability">
            <h4>Ability: {personCard.ability.name}</h4>
            <p>{personCard.ability.description}</p>
            <div className="ability-cost">Cost: {personCard.ability.waterCost} Water</div>
          </div>
          {personCard.isPunk && <div className="card-trait">Punk</div>}
        </div>
      );
    }

    if ('type' in currentCard && currentCard.type === CardType.EVENT) {
      const eventCard = currentCard as EventCard;
      return (
        <div className="card-modal-details event-details">
          <div className="card-header">
            <h3>{eventCard.name}</h3>
            <div className="card-cost">{eventCard.waterCost} Water</div>
          </div>
          <p className="card-description">{eventCard.description}</p>
          <div className="event-number">Event Number: {eventCard.eventNumber}</div>
        </div>
      );
    }

    return <div>Unknown card type</div>;
  };

  // Determine card class based on type
  const getCardClass = () => {
    if ('type' in currentCard) {
      if (currentCard.type === 'waterSilo') return 'water-silo-card';
      if (currentCard.type === CardType.PERSON) return 'person-card';
      if (currentCard.type === CardType.EVENT) return 'event-card';
    }
    return '';
  };

  return (
    <div className="card-modal-overlay" onClick={onClose}>
      <div className="card-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="card-scroll-container" ref={scrollContainerRef}>
          <button 
            className="scroll-button prev-button" 
            onClick={handlePrevCard}
            disabled={cards.length <= 1}
          >
            &#10094;
          </button>
          
          <div className={`card-modal-display ${getCardClass()}`}>
            {renderCardDetails()}
          </div>
          
          <button 
            className="scroll-button next-button" 
            onClick={handleNextCard}
            disabled={cards.length <= 1}
          >
            &#10095;
          </button>
        </div>
        
        <div className="card-count">
          Card {currentIndex + 1} of {cards.length}
        </div>
        
        <div className="card-actions">
          {/* Only show Play button if not Water Silo */}
          {!isWaterSilo() && (
            <button 
              className="play-button" 
              onClick={handlePlayCard}
              disabled={!isPlayable()}
            >
              Play Card {!isPlayable() && '(Not enough water)'}
            </button>
          )}
          
          <button 
            className={`junk-button ${isWaterSilo() ? 'junk-water-silo' : ''}`}
            onClick={handleJunkCard}
          >
            {isWaterSilo() ? 'Junk & Return Water Silo' : 'Junk Card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardModal;