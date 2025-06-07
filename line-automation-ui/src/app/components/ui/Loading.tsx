'use client';

import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'animate-spin border-2 border-current border-t-transparent rounded-full',
        sizeClasses[size]
      )} />
      {text && (
        <span className="ml-2 text-sm text-gray-600">{text}</span>
      )}
    </div>
  );
};

// Spinner component for inline use
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'sm', 
  className 
}) => {
  return (
    <div className={cn(
      'animate-spin border-2 border-current border-t-transparent rounded-full',
      sizeClasses[size],
      className
    )} />
  );
};

// Full page loading component
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'กำลังโหลด...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loading size="lg" />
        <p className="mt-4 text-gray-600">{text}</p>
      </div>
    </div>
  );
};

export default Loading; 