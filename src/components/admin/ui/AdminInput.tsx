'use client';

import React, { forwardRef } from 'react';

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightElement,
      containerClassName = '',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-zinc-700 select-none"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full h-11 text-sm bg-white text-zinc-900 border rounded-lg transition-all placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed ${
              leftIcon ? 'pl-10' : 'pl-3.5'
            } ${rightElement ? 'pr-11' : 'pr-3.5'} ${
              error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-300'
            } ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-2 flex items-center">{rightElement}</div>
          )}
        </div>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {!error && hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

AdminInput.displayName = 'AdminInput';
