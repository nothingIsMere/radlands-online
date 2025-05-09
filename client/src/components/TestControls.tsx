import React, { useState, useEffect } from 'react';
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
  
  // Handle keyboard shortcut (Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault(); // Prevent browser's default behavior
        toggleExpanded();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <div className={`test-controls ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="test-controls-header" onClick={toggleExpanded}>
        Debug Tools {isExpanded ? '▲' : '▼'}
        {!isExpanded && <span className="keyboard-shortcut">Ctrl+D</span>}
      </div>
      
      {isExpanded && (
        <div className="test-controls-content">
          <div className="button-group">
            <div className="button-group-title">Event Queue Testing</div>
            
            <button className="test-button" onClick={onSetupEventsTest}>
              Setup Events Test
            </button>
            
            <button className="test-button" onClick={onProcessEventsPhase}>
              Process Events
            </button>
            
            <button className="test-button" onClick={onForceEventsPhase}>
              Force Events Phase
            </button>
          </div>
          
          <div className="button-group">
            <div className="button-group-title">Game Controls</div>
            
            <button className="test-button" onClick={onResetGameState}>
              Reset Game State
            </button>
            
            <button 
              className={`test-button ${isGameLogVisible ? 'active' : ''}`} 
              onClick={onToggleGameLog}
            >
              {isGameLogVisible ? 'Hide' : 'Show'} Game Log
            </button>
          </div>
          
          <div className="test-controls-info">
            <p>Testing tools for event queue mechanics</p>
            <p className="event-rule"><strong>Event #:</strong> Events must be placed in corresponding slots (e.g., Event #1 goes to slot 1)</p>
            <p className="event-rule"><strong>Processing:</strong> Events advance once per turn; position 1 resolves, others move forward</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestControls;