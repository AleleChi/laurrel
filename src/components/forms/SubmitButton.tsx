'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean;
  submittingText?: string;
  variant?: 'dark' | 'primary';
  children: React.ReactNode;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting = false,
  submittingText = 'Sending...',
  variant = 'dark',
  children,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    dark: 'bg-[#18181B] hover:bg-[#390044] text-white focus-visible:ring-[#18181B]',
    primary: 'bg-[#390044] hover:bg-[#4E025D] text-white focus-visible:ring-[#390044]',
  };

  return (
    <button
      type="submit"
      disabled={disabled || isSubmitting}
      className={cn(
        'inline-flex items-center justify-center h-12 sm:h-[52px] px-6 sm:px-7 rounded-xl text-sm sm:text-base font-medium tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
          <span>{submittingText}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
