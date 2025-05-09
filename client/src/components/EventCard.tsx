import React from 'react';
import { EventCard } from '../models';

interface EventCardProps {
  event: EventCard;
}

const EventCardComponent: React.FC<EventCardProps> = ({ event }) => {
  // Determine if this is an immediate effect card (event number 0)
  const isImmediateEffect = event.eventNumber === 0;

  // Generate the appropriate tooltip based on event number
  const getEventTooltip = () => {
    if (isImmediateEffect) {
      return `${event.name}\n${event.description}\n\nImmediate Effect: This event resolves immediately when played and doesn't go into the event queue.`;
    }
    return `${event.name}\n${event.description}\n\nEvent #${event.eventNumber}: This event must be placed in position ${event.eventNumber} of the event queue if available, or the next open position.`;
  };

  // Generate the appropriate event number tooltip
  const getEventNumberTooltip = () => {
    if (isImmediateEffect) {
      return `Immediate Effect: This event resolves immediately when played and doesn't go into the event queue.`;
    }
    return `Event #${event.eventNumber}: This event must be placed in position ${event.eventNumber} of the event queue if available, or the next open position.`;
  };

  return (
    <div 
      className={`event-card ${isImmediateEffect ? 'immediate-effect' : ''}`}
      title={getEventTooltip()}
    >
      <div className="card-name">{event.name}</div>
      <div className="card-cost">
        <div className="play-cost">{event.waterCost}</div>
      </div>
      <div 
        className={`event-number ${isImmediateEffect ? 'immediate-effect-number' : ''}`}
        title={getEventNumberTooltip()}
      >
        {isImmediateEffect ? "!" : event.eventNumber}
      </div>
      {isImmediateEffect && (
        <div className="immediate-indicator" title="Immediate Effect">
          IMMEDIATE
        </div>
      )}
      <div className="card-description">
        {event.description}
      </div>
    </div>
  );
};

export default EventCardComponent;