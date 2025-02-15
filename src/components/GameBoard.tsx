import React from 'react';

const GameBoard = () => {
  return (
    <div className="w-full h-screen bg-gray-800 p-4">
      <div className="w-full h-full flex justify-between">
        {/* Left Player Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2">
          <div className="text-white">Left Player Area</div>
        </div>

        {/* Center Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2">
          <div className="text-white">Center Area</div>
        </div>

        {/* Right Player Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2">
          <div className="text-white">Right Player Area</div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;