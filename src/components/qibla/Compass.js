import React from 'react';

const Compass = ({ deviceHeading, qiblaDirection, isCalibrated }) => {
  return (
    <div className="flex flex-col items-center">
      {/* Compass */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 mb-6">
        {/* Compass Background */}
        <div className="absolute inset-0 rounded-full border-4 border-[#d4af37] bg-white/5">
          {/* Cardinal Points */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-[#d4af37] font-bold">N</div>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#d4af37] font-bold">E</div>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[#d4af37] font-bold">S</div>
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#d4af37] font-bold">W</div>
          
          {/* Degree Markers */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-4 bg-white/30"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${deg}deg) translateY(-120px)`,
                transformOrigin: '0 0'
              }}
            />
          ))}
        </div>

        {/* Device Direction Needle */}
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: `rotate(${deviceHeading}deg)` }}
        >
          <div className="absolute top-1/2 left-1/2 w-1 h-24 bg-gradient-to-t from-[#d4af37] to-red-500 origin-bottom"
            style={{ transform: 'translate(-50%, -100%)' }}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        </div>

        {/* Qibla Indicator */}
        {qiblaDirection && (
          <div
            className="absolute inset-0 transition-transform duration-500"
            style={{ transform: `rotate(${qiblaDirection}deg)` }}
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
              <i className="fas fa-map-marker-alt text-2xl text-[#d4af37] animate-pulse"></i>
            </div>
          </div>
        )}

        {/* Center Point */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#d4af37] rounded-full border-4 border-white z-10"></div>
      </div>

      {/* Compass Info */}
      <div className="text-center">
        <p className="text-lg text-white/70 mb-2">Device Direction</p>
        <p className="text-2xl font-bold text-[#d4af37]">
          {Math.round(deviceHeading)}°
        </p>
      </div>
    </div>
  );
};

export default Compass;