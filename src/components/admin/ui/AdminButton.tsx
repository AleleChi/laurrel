'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function AdminButton({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}: AdminButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'h-9 px-3 text-xs gap-1.5',
    md: 'h-11 px-4 text-sm gap-2',
    lg: 'h-12 px-5 text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#49056B] text-white hover:bg-[#390044] focus:ring-[#49056B] shadow-xs active:bg-[#2d0037]',
    secondary:
      'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-400 active:bg-zinc-300',
    outline:
      'bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400 focus:ring-[#49056B] shadow-2xs',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-xs active:bg-red-800',
    ghost:
      'bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 focus:ring-zinc-400',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
}
