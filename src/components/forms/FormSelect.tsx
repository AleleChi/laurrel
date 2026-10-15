'use client';

import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: FormSelectOption[];
  hasError?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ className, options, children, hasError, id, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    const errorDescribedBy = hasError && id ? `${id}-error` : undefined;
    const combinedDescribedBy = [ariaDescribedBy, errorDescribedBy]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          id={id}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={combinedDescribedBy}
          className={cn(
            'w-full h-[52px] sm:h-[54px] pl-4 pr-10 rounded-[10px] bg-white border text-sm sm:text-base text-[#18181B] font-normal transition-all duration-200 focus:outline-none focus:ring-2 appearance-none cursor-pointer disabled:bg-[#F8F7F4] disabled:opacity-60 disabled:cursor-not-allowed',
            hasError
              ? 'border-rose-400 focus:border-rose-600 focus:ring-rose-200'
              : 'border-[#202024]/15 hover:border-[#202024]/30 focus:border-[#390044] focus:ring-[#390044]/15',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#202024]/60">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
