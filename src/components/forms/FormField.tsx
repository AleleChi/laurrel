'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required,
  optional,
  hint,
  error,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#18181B]/85 tracking-wide"
        >
          {label}
          {required && <span className="text-rose-600 ml-1" aria-hidden="true">*</span>}
          {optional && (
            <span className="text-xs text-[#202024]/50 font-normal ml-1">
              (optional)
            </span>
          )}
        </label>
        {hint && !error && (
          <span className="text-[11px] text-[#202024]/55 font-normal">
            {hint}
          </span>
        )}
      </div>

      <div>{children}</div>

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-rose-600 font-medium mt-1 transition-opacity duration-150"
        >
          {error}
        </p>
      )}
    </div>
  );
};
