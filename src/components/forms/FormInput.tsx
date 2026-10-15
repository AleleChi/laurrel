'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, hasError, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const errorDescribedBy = hasError && id ? `${id}-error` : undefined;
    const combinedDescribedBy = [ariaDescribedBy, errorDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <input
        ref={ref}
        id={id}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={combinedDescribedBy}
        className={cn(
          'w-full h-[52px] sm:h-[54px] px-4 rounded-[10px] bg-white border text-sm sm:text-base text-[#18181B] placeholder-[#202024]/40 font-normal transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-[#F8F7F4] disabled:opacity-60 disabled:cursor-not-allowed',
          hasError
            ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200'
            : 'border-[#202024]/15 hover:border-[#202024]/30 focus:border-[#390044] focus:ring-[#390044]/15',
          className
        )}
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
