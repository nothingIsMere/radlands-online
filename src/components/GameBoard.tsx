import React from 'react';

const GameBoard = () => {
  return (
    <div className="w-full h-screen bg-gray-800 p-4">
      <div className="w-full h-full flex justify-between">
        {/* Left Player Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2">
        <div style={{ marginTop: '100px' }}>
          {/* Event Queue */}
          <div className="flex justify-between mb-8">
            <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
              <div className="text-white text-center mt-12">Event 3</div>
            </div>
            <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
              <div className="text-white text-center mt-12">Event 2</div>
            </div>
            <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
              <div className="text-white text-center mt-12">Event 1</div>
            </div>
          </div>
            {/* Three columns of cards */}
            <div className="flex justify-between">
              {/* Column 1 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 1</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 2</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 1</div>
                </div>
              </div>
              {/* Column 2 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 3</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 4</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 2</div>
                </div>
              </div>
              {/* Column 3 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 5</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 6</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2">
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
              <div className="text-white text-center mt-12">Draw Deck</div>
            </div>
            <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
              <div className="text-white text-center mt-12">Discard Pile</div>
            </div>
          </div>
        </div>

        {/* Right Player Area */}
        <div className="w-1/3 h-full border border-gray-600 p-2">
        <div style={{ marginTop: '100px' }}>
        {/* Event Queue */}
        <div className="flex justify-between mb-8">
          <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
            <div className="text-white text-center mt-12">Event 1</div>
          </div>
          <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
            <div className="text-white text-center mt-12">Event 2</div>
          </div>
          <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
            <div className="text-white text-center mt-12">Event 3</div>
          </div>
        </div>
            {/* Three columns of cards */}
            <div className="flex justify-between">
              {/* Column 1 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 1</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 2</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 1</div>
                </div>
              </div>
              {/* Column 2 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 3</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 4</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 2</div>
                </div>
              </div>
              {/* Column 3 */}
              <div className="flex flex-col">
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-4">
                  <div className="text-white text-center mt-12">Person 5</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700 mb-8">
                  <div className="text-white text-center mt-12">Person 6</div>
                </div>
                <div className="w-24 h-32 border-2 border-gray-400 rounded bg-gray-700">
                  <div className="text-white text-center mt-12">Camp 3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;