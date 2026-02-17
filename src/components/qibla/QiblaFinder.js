import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Compass from './Compass';
import KaabaInfo from './KaabaInfo';

const QiblaFinder = ({ location, qiblaDirection }) => {
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);

  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  const handleOrientation = (event) => {
    let heading = null;
    
    if (event.webkitCompassHeading) {
      // iOS
      heading = event.webkitCompassHeading;
      setIsCalibrated(true);
    } else if (event.alpha) {
      // Android
      heading = 360 - event.alpha;
      setIsCalibrated(true);
    }
    
    if (heading !== null) {
      setDeviceHeading(heading);
    }
  };

  const qiblaOffset = qiblaDirection ? qiblaDirection - deviceHeading : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="glass p-8">
        <Compass
          deviceHeading={deviceHeading}
          qiblaDirection={qiblaDirection}
          isCalibrated={isCalibrated}
        />
      </div>

      {!isCalibrated && (
        <div className="glass p-4 text-center">
          <p className="text-yellow-500">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            Please move your device in a figure-8 pattern to calibrate the compass
          </p>
        </div>
      )}

      <KaabaInfo
        location={location}
        qiblaDirection={qiblaDirection}
        qiblaOffset={qiblaOffset}
      />
    </motion.div>
  );
};

export default QiblaFinder;