'use client';

import React from 'react';

export type StatusVariant =
  | 'new'
  | 'reviewed'
  | 'quoted'
  | 'scheduled'
  | 'closed'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'neutral';

interface AdminBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function AdminBadge({ status, variant, className = '' }: AdminBadgeProps) {
  const normalized = (variant || status || 'neutral').toLowerCase();

  const getStyles = () => {
    switch (normalized) {
      case 'new':
      case 'awaiting review':
        return 'bg-orange-50/80 text-[#FE6000] border-orange-200/60';
      case 'reviewed':
        return 'bg-zinc-100/80 text-zinc-700 border-zinc-200';
      case 'quoted':
        return 'bg-purple-50/80 text-[#49056B] border-purple-200/60';
      case 'scheduled':
      case 'confirmed':
        return 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60';
      case 'closed':
        return 'bg-zinc-50 text-zinc-400 border-zinc-200/60';
      case 'pending':
        return 'bg-amber-50/80 text-amber-800 border-amber-200/60';
      case 'cancelled':
        return 'bg-red-50/80 text-red-700 border-red-200/60';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getLabel = () => {
    switch (normalized) {
      case 'new':
        return 'New';
      case 'reviewed':
        return 'Reviewed';
      case 'quoted':
        return 'Quoted';
      case 'scheduled':
        return 'Scheduled';
      case 'closed':
        return 'Closed';
      case 'pending':
        return 'Pending';
      case 'confirmed':
        return 'Confirmed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()} ${className}`}
    >
      {getLabel()}
    </span>
  );
}
