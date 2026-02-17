import React from 'react';

const KaabaInfo = ({ location, qiblaDirection, qiblaOffset }) => {
  const calculateDistance = (lat1, lon1) => {
    const R = 6371; // Earth's radius in km
    const lat2 = 21.4225;
    const lon2 = 39.8262;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const distance = location ? calculateDistance(location.lat, location.lng) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass p-4 text-center">
        <h4 className="text-sm text-white/50 mb-2">Qibla Direction</h4>
        <p className="text-2xl font-bold text-[#d4af37]">
          {qiblaDirection ? `${Math.round(qiblaDirection)}°` : '--°'}
        </p>
      </div>

      <div className="glass p-4 text-center">
        <h4 className="text-sm text-white/50 mb-2">Distance to Kaaba</h4>
        <p className="text-2xl font-bold text-[#d4af37]">
          {distance ? `${distance.toLocaleString()} km` : '-- km'}
        </p>
      </div>

      <div className="glass p-4 text-center">
        <h4 className="text-sm text-white/50 mb-2">Qibla Offset</h4>
        <p className="text-2xl font-bold text-[#d4af37]">
          {qiblaOffset ? `${Math.round(qiblaOffset)}°` : '--°'}
        </p>
      </div>
    </div>
  );
};

export default KaabaInfo;