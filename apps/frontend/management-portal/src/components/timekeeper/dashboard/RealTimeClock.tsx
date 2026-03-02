'use client';

import { useState, useEffect } from 'react';

interface RealTimeClockProps {
  className?: string;
}

export function RealTimeClock({ className = '' }: RealTimeClockProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-6 shadow-lg ${className}`}>
      <div className="text-center">
        <div className="text-5xl font-bold tracking-wider mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-blue-100 text-sm">
          {formatDate(currentTime)}
        </div>
      </div>
    </div>
  );
}
