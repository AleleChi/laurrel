import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  icon?: boolean | React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'lg',
  href,
  icon = true,
  children,
  className = '',
  ...props
}) => {
  const baseStyles =
    'group relative inline-flex items-center justify-center font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none rounded-[10px]';

  const sizeStyles = {
    sm: 'h-10 px-4 text-sm gap-2',
    md: 'h-12 px-6 text-base gap-2.5',
    lg: 'h-14 px-7 text-base font-medium gap-3', // Exactly matching 56px reference height
  };

  const variantStyles = {
    primary:
      'bg-[#49056B] text-white shadow-button-purple hover:bg-[#5B0785] active:scale-[0.98] focus-visible:ring-[#49056B] border border-black/10',
    secondary:
      'bg-white text-[#49056B] border border-[#49056B]/30 hover:border-[#49056B] hover:bg-[#49056B]/5 active:scale-[0.98] focus-visible:ring-[#49056B]',
    accent:
      'bg-[#FE6000] text-[#18181B] font-bold hover:bg-[#E05500] active:scale-[0.98] focus-visible:ring-[#FE6000] shadow-sm',
    outline:
      'bg-transparent text-[#202024] border border-black/15 hover:border-black/30 hover:bg-black/[0.03] active:scale-[0.98] focus-visible:ring-[#202024]',
    ghost:
      'bg-transparent text-[#202024] hover:bg-black/[0.04] active:scale-[0.98] focus-visible:ring-[#202024]',
  };

  const renderedIcon =
    icon === true ? (
      <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 flex-shrink-0" />
    ) : icon ? (
      icon
    ) : null;

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        <span>{children}</span>
        {renderedIcon}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      <span>{children}</span>
      {renderedIcon}
    </button>
  );
};
