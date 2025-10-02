import React from 'react';

const AiIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 8.5A2.5 2.5 0 0 1 12 6V3.5"/>
        <path d="M14.5 8.5A2.5 2.5 0 0 0 12 6"/>
        <path d="M12 14a2.5 2.5 0 0 0 2.5-2.5V10"/>
        <path d="M12 14a2.5 2.5 0 0 1-2.5-2.5V10"/>
        <path d="M14.5 15.5a2.5 2.5 0 0 1 2.5-2.5H19"/>
        <path d="M9.5 15.5a2.5 2.5 0 0 0-2.5-2.5H5"/>
        <path d="M5 10V8.5A2.5 2.5 0 0 1 7.5 6"/>
        <path d="M19 10V8.5A2.5 2.5 0 0 0 16.5 6"/>
        <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/>
    </svg>
);

export default AiIcon;
