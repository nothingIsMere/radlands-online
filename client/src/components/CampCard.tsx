import React from 'react';
import { CampCard } from '../models';

interface CampCardProps {
  camp: CampCard;
}

const CampCardComponent: React.FC<CampCardProps> = ({ camp }) => {
  return (
    <div className={`camp-card ${camp.isDamaged ? 'damaged' : ''} ${camp.isDestroyed ? 'destroyed' : ''}`}>
      <div className="card-name">{camp.name}</div>
      <div className="card-cost">
        <div className="ability-cost">{camp.ability.waterCost}</div>
      </div>
      <div className="card-ability">
        {camp.isDestroyed ? 'DESTROYED' : camp.ability.name}
      </div>
    </div>
  );
};

export default CampCardComponent;