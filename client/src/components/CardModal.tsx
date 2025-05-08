import React, { useState } from 'react';
import { PersonCard, EventCard, WaterSiloCard, CardType } from '../models';
import './CardModal.css';

type Card = PersonCard | EventCard | WaterSiloCard;

interface CardModalProps {
  cards: Card[];
  water: number;
  onClose: () => void;
  onPlayCard: (card: Card) => void;
  onJunkCard: (card: Card) => void;
}

const CardModal: React.FC<CardModalProps> = ({ 
  cards, 
  water, 
  onClose, 
  onPlayCard, 
  onJunkCard 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (cards.length === 0) {
    return null;
  }

  const currentCard = cards[currentIndex];
  
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

  // Check if card is playable based on water cost
  const isPlayable = () => {
    if ('type' in currentCard && currentCard.type === 'waterSilo') {
      return true; // Water Silo has no water cost
    }
    
    if ('waterCost' in currentCard) {
      return currentCard.waterCost <= water;
    }
    
    return false;
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
        
        <div className="card-scroll-container">
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
          <button 
            className="play-button" 
            onClick={handlePlayCard}
            disabled={!isPlayable()}
          >
            Play Card {!isPlayable() && '(Not enough water)'}
          </button>
          
          <button 
            className="junk-button"
            onClick={handleJunkCard}
          >
            Junk Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardModal;