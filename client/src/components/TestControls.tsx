import React, { useState } from 'react';
import './TestControls.css';

interface TestControlsProps {
  onSetupEventsTest: () => void;
  onProcessEventsPhase: () => void;
  onResetGameState: () => void;
  onToggleGameLog: () => void;
  onForceEventsPhase: () => void;
  isGameLogVisible: boolean;
}

const TestControls: React.FC<TestControlsProps> = ({
  onSetupEventsTest,
  onProcessEventsPhase,
  onResetGameState,
  onToggleGameLog,
  onForceEventsPhase,
  isGameLogVisible
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="test-controls">
      <div className="test-controls-header" onClick={toggleExpanded}>
        Test Controls {isExpanded ? '▲' : '▼'}
      </div>
      
      {isExpanded && (
        <div className="test-controls-content">
          <button className="test-button" onClick={onSetupEventsTest}>
            Setup Events Test
          </button>
          
          <button className="test-button" onClick={onProcessEventsPhase}>
            Process Events (All-at-Once)
          </button>
          
          <button className="test-button" onClick={onForceEventsPhase}>
            Force Events Phase
          </button>
          
          <button className="test-button" onClick={onResetGameState}>
            Reset Game State
          </button>
          
          <button 
            className={`test-button ${isGameLogVisible ? 'active' : ''}`} 
            onClick={onToggleGameLog}
          >
            {isGameLogVisible ? 'Hide' : 'Show'} Game Log
          </button>
          
          <div className="test-controls-info">
            <p>These controls are for testing event queue mechanics.</p>
            <p className="event-rule"><strong>Event Number Rule:</strong> Events must be placed in the slot matching their event number if available. If that slot is taken, the event goes in the next open slot further back.</p>
            <p className="event-rule"><strong>Event Processing Flow:</strong> All events in the queue advance once per turn in the Events Phase. Position 1 events are resolved, then all other events move forward one slot.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestControls;