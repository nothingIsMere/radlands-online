import React from 'react';
import { EventCard } from '../models';

interface EventCardProps {
  event: EventCard;
}

const EventCardComponent: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="event-card">
      <div className="card-name">{event.name}</div>
      <div className="card-cost">
        <div className="play-cost">{event.waterCost}</div>
      </div>
      <div className="event-number">{event.eventNumber}</div>
    </div>
  );
};

export default EventCardComponent;