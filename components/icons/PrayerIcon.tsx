
import React from 'react';

const PrayerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 6V2" />
    <path d="M12 22v-4" />
    <path d="M17 12h4" />
    <path d="M3 12h4" />
    <path d="m19.07 4.93-1.41 1.41" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 19.07-1.41-1.41" />
    <path d="m6.34 6.34-1.41-1.41" />
    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10z" />
    <path d="M12 12h.01" />
  </svg>
);

export default PrayerIcon;