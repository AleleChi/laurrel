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
        return 'bg-orange-50/90 text-[#FE6000] border-orange-200/80';
      case 'reviewed':
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
      case 'quoted':
        return 'bg-purple-50 text-[#49056B] border-purple-200/80';
      case 'scheduled':
      case 'confirmed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'closed':
        return 'bg-zinc-50 text-zinc-500 border-zinc-200/60';
      case 'pending':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200/80';
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
      className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-medium border ${getStyles()} ${className}`}
    >
      {getLabel()}
    </span>
  );
}
