import React from 'react';

const TrafficIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 2.5v18h18" />
    <path d="m20.5 8.5-7.31 7.31-4-4L2.5 18.5" />
    <path d="M14.5 8.5h6v6" />
  </svg>
);

export default TrafficIcon;
