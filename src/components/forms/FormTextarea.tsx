'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ className, hasError, id, rows = 4, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const errorDescribedBy = hasError && id ? `${id}-error` : undefined;
    const combinedDescribedBy = [ariaDescribedBy, errorDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={hasError ? 'true' : undefined}
        aria-describedby={combinedDescribedBy}
        className={cn(
          'w-full p-4 rounded-[10px] bg-white border text-sm sm:text-base text-[#18181B] placeholder-[#202024]/40 font-normal transition-all duration-200 focus:outline-none focus:ring-2 resize-none disabled:bg-[#F8F7F4] disabled:opacity-60 disabled:cursor-not-allowed',
          hasError
            ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200'
            : 'border-[#202024]/15 hover:border-[#202024]/30 focus:border-[#49056B] focus:ring-[#49056B]/15',
          className
        )}
        {...props}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
