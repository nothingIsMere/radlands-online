import React from 'react';
import { PersonCard } from '../models';

interface PersonCardProps {
  person: PersonCard;
}

const PersonCardComponent: React.FC<PersonCardProps> = ({ person }) => {
  return (
    <div className={`person-card ${person.isDamaged ? 'damaged' : ''} ${!person.isReady ? 'not-ready' : ''} ${person.isPunk ? 'punk' : ''}`}>
      <div className="card-name">{person.isPunk ? 'Punk' : person.name}</div>
      <div className="card-cost">
        <div className="play-cost">{person.waterCost}</div>
        {!person.isPunk && <div className="ability-cost">{person.ability.waterCost}</div>}
      </div>
      {!person.isPunk && <div className="card-ability">{person.ability.name}</div>}
    </div>
  );
};

export default PersonCardComponent;