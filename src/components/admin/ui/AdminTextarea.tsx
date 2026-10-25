'use client';

import React, { forwardRef } from 'react';

interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  (
    {
      label,
      error,
      hint,
      containerClassName = '',
      className = '',
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[13px] font-medium text-zinc-700 select-none"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={`w-full p-3 text-sm bg-white text-zinc-900 border rounded-lg transition-all placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed ${
            error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-300'
          } ${className}`}
          {...props}
        />

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {!error && hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
    );
  }
);

AdminTextarea.displayName = 'AdminTextarea';
