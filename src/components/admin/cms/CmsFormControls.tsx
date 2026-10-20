import React from 'react';

export interface CmsFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function CmsField({ label, description, required, children }: CmsFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold text-zinc-900 tracking-tight">
          {label} {required && <span className="text-[#FE6000]">*</span>}
        </label>
      </div>
      {description && <p className="text-[11px] text-zinc-400 leading-normal">{description}</p>}
      {children}
    </div>
  );
}

export interface CmsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  disabled?: boolean;
}

export function CmsInput({ disabled, className = '', ...props }: CmsInputProps) {
  return (
    <input
      disabled={disabled}
      className={`w-full px-3.5 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}

export interface CmsTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  disabled?: boolean;
}

export function CmsTextarea({ disabled, rows = 3, className = '', ...props }: CmsTextareaProps) {
  return (
    <textarea
      rows={rows}
      disabled={disabled}
      className={`w-full p-3 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:border-transparent transition-all leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      {...props}
    />
  );
}
