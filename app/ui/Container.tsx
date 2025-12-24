import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

// Single source of truth for content width
// max-w-7xl, centered, responsive horizontal padding
export default function Container({ children, className = '' }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
