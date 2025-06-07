'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textareaVariants = cva(
  'flex w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
  {
    variants: {
      variant: {
        default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
        error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
        success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
      },
      size: {
        sm: 'min-h-[80px] px-2 py-1.5 text-xs',
        md: 'min-h-[100px] px-3 py-2 text-sm',
        lg: 'min-h-[120px] px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    size, 
    label, 
    error, 
    helperText, 
    fullWidth = true,
    maxLength,
    showCharCount = false,
    value,
    id,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const textareaVariant = hasError ? 'error' : variant;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className={cn('space-y-2', fullWidth && 'w-full')}>
        {label && (
          <div className="flex items-center justify-between">
            <label 
              htmlFor={textareaId} 
              className="block text-sm font-medium text-gray-700"
            >
              {label}
            </label>
            {showCharCount && maxLength && (
              <span className={cn(
                'text-xs',
                currentLength > maxLength ? 'text-red-600' : 'text-gray-500'
              )}>
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        
        <textarea
          id={textareaId}
          className={cn(textareaVariants({ variant: textareaVariant, size }), className)}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        
        {(error || helperText) && (
          <div className="text-sm">
            {error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <p className="text-gray-600">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 