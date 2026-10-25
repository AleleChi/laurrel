'use client';

import React, { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface AdminSelectOption {
  value: string;
  label: string;
}

interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options?: AdminSelectOption[];
  containerClassName?: string;
}

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  (
    {
      label,
      error,
      hint,
      options,
      children,
      containerClassName = '',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || (label ? `${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${generatedId}` : generatedId);
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[13px] font-medium text-zinc-700 select-none"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={`w-full h-11 text-sm bg-white text-zinc-900 border rounded-md transition-all appearance-none pl-3.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed ${
              error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-300'
            } ${className}`}
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

          <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" aria-hidden="true" />
        </div>

        {error && (
          <p id={errorId} className="text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={hintId} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

AdminSelect.displayName = 'AdminSelect';
