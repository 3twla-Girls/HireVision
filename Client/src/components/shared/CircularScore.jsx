import React, { useEffect, useState } from 'react';

const CircularScore = ({ 
  score = 0, 
  size = 128, 
  duration = 2000,
  strokeColor = "#1B3C53",
  textColor = "#EE6C4D",
  emptyStrokeColor = "#F1F5F9" 
}) => {
  const viewBoxSize = 100;
  const strokeWidth = 8;
  const radius = (viewBoxSize / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  
  const [displayNumber, setDisplayNumber] = useState(0);

  useEffect(() => {
    let requestID;
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOutProgress * score);
      
      setDisplayNumber(currentValue);

      if (progress < 1) {
        requestID = window.requestAnimationFrame(step);
      }
    };

    requestID = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(requestID);
  }, [score, duration]); 

  return (
    <div 
      className="m-5 relative flex items-center justify-center transition-all duration-300" 
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} 
        className="w-full h-full transform -rotate-90"
      >
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={radius}
          stroke={emptyStrokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: circumference - (displayNumber / 100) * circumference,
            transition: `stroke-dashoffset 0.1s linear`,
          }}
          strokeLinecap="round"
        />
      </svg>
      
      <div 
        className="absolute inset-0 flex items-center justify-center font-extrabold"
        style={{ 
          fontSize: `${size * 0.25}px`, 
          color: textColor 
        }}
      >
        {displayNumber}%
      </div>
    </div>
  );
};

export default CircularScore;