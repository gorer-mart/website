'use client';

import React from 'react';

interface NotificationBarProps {
  items?: string[];
}

export const NotificationBar: React.FC<NotificationBarProps> = ({
  items,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  // Duplicate array for seamless infinite marquee loop
  const marqueeItems = [...items, ...items, ...items, ...items];

  return (
    <div
      role="region"
      aria-label="Store Announcements Ticker"
      className="relative w-full bg-black text-white py-3.5 overflow-hidden select-none z-20"
    >
      <div className="flex w-full overflow-hidden">
        <div className="animate-marquee flex items-center space-x-12 md:space-x-16">
          {marqueeItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-12 md:space-x-16 whitespace-nowrap text-xs md:text-sm font-bold uppercase tracking-wider text-white"
            >
              <span>{item}</span>
              <span className="text-white/40 text-xs" aria-hidden="true">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationBar;


