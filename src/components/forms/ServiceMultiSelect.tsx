'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { ServiceCategory } from '@/lib/types/enquiry';
import { cn } from '@/lib/utils';

export interface ServiceOptionItem {
  id: ServiceCategory;
  label: string;
}

export const DEFAULT_SERVICE_OPTIONS: ServiceOptionItem[] = [
  { id: 'cleaning', label: 'Cleaning' },
  { id: 'moving', label: 'Moving' },
  { id: 'storage', label: 'Storage' },
];

interface ServiceMultiSelectProps {
  selectedServices: ServiceCategory[];
  onChange: (services: ServiceCategory[]) => void;
  options?: ServiceOptionItem[];
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ServiceMultiSelect: React.FC<ServiceMultiSelectProps> = ({
  selectedServices,
  onChange,
  options = DEFAULT_SERVICE_OPTIONS,
  hasError = false,
  disabled = false,
  className,
}) => {
  const toggleService = (id: ServiceCategory) => {
    if (disabled) return;
    if (selectedServices.includes(id)) {
      onChange(selectedServices.filter((s) => s !== id));
    } else {
      onChange([...selectedServices, id]);
    }
  };

  return (
    <div
      role="group"
      aria-label="Select one or more services"
      className={cn('grid grid-cols-1 sm:grid-cols-3 gap-2.5', className)}
    >
      {options.map((option) => {
        const isSelected = selectedServices.includes(option.id);

        return (
          <label
            key={option.id}
            htmlFor={`service-select-${option.id}`}
            className={cn(
              'relative flex items-center gap-3 px-3.5 py-3 rounded-[10px] border transition-all duration-150 cursor-pointer select-none',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#49056B] has-[:focus-visible]:ring-offset-1',
              isSelected
                ? 'border-[#49056B] bg-[#49056B]/[0.04]'
                : hasError
                ? 'border-rose-300 hover:border-rose-400 bg-white'
                : 'border-[#202024]/15 hover:border-[#202024]/30 hover:bg-[#F8F7F4]/50 bg-white',
              disabled && 'opacity-60 cursor-not-allowed hover:border-[#202024]/15 hover:bg-white'
            )}
          >
            {/* Native accessible checkbox input */}
            <input
              type="checkbox"
              id={`service-select-${option.id}`}
              name="service_selection"
              value={option.id}
              checked={isSelected}
              disabled={disabled}
              onChange={() => toggleService(option.id)}
              className="sr-only"
            />

            {/* Custom restrained checkbox square */}
            <span
              aria-hidden="true"
              className={cn(
                'w-4 h-4 rounded-[4px] border flex items-center justify-center flex-shrink-0 transition-colors duration-150',
                isSelected
                  ? 'bg-[#49056B] border-[#49056B] text-white'
                  : 'border-[#202024]/25 bg-white'
              )}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
            </span>

            {/* Service Label Text */}
            <span
              className={cn(
                'text-sm font-medium tracking-tight transition-colors',
                isSelected ? 'text-[#49056B] font-semibold' : 'text-[#18181B]'
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};
