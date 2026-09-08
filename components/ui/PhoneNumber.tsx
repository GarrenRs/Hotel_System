import React from 'react';

interface PhoneNumberProps {
  display: string;
  action: string;
  className?: string;
}

export const PhoneNumber: React.FC<PhoneNumberProps> = ({
  display,
  action,
  className = "",
}) => {
  return (
    <a
      href={action.startsWith('tel:') || action.startsWith('https://wa.me') ? action : `tel:${action}`}
      dir="ltr"
      style={{ unicodeBidi: 'isolate', direction: 'ltr' }}
      className={`inline-block whitespace-nowrap ${className}`}
    >
      {/* 
        Using LRM (Left-to-Right Mark) &#x200E; to ensure proper layout 
        in bidirectional contexts for + symbols and spaces
      */}
      &#x200E;{display}&#x200E;
    </a>
  );
};
