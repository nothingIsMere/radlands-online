import React from 'react';
import { EventCard } from '../models';

interface EventCardProps {
  event: EventCard;
}

const EventCardComponent: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div 
      className="event-card"
      title={`${event.name}\n${event.description}\n\nEvent #${event.eventNumber}: This event must be placed in position ${event.eventNumber} of the event queue if available, or the next open position.`}
    >
      <div className="card-name">{event.name}</div>
      <div className="card-cost">
        <div className="play-cost">{event.waterCost}</div>
      </div>
      <div 
        className="event-number" 
        title={`Event #${event.eventNumber}: This event must be placed in position ${event.eventNumber} of the event queue if available, or the next open position.`}
      >
        {event.eventNumber}
      </div>
      <div className="card-description">
        {event.description}
      </div>
    </div>
  );
};

export default EventCardComponent;