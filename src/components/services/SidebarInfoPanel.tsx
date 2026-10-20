'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface SidebarInfoPanelProps {
  heading?: string;
  body?: string;
  ctaText?: string;
  onOpenQuote?: () => void;
}

export const SidebarInfoPanel: React.FC<SidebarInfoPanelProps> = ({
  heading = 'Planning more than one service?',
  body = "Moving out, cleaning a property or arranging storage between addresses? Tell us which services you need and the dates you're working with.",
  ctaText = 'Request a Quote',
  onOpenQuote,
}) => {
  const handleClick = () => {
    if (onOpenQuote) {
      onOpenQuote();
    } else {
      // Focus or scroll to sidebar form as fallback
      const form = document.getElementById('sidebar-enquiry-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const nameInput = form.querySelector('input') as HTMLInputElement | null;
        if (nameInput) nameInput.focus();
      }
    }
  };

  return (
    <div
      id="sidebar-info-panel"
      className="w-full bg-[#49056B] text-white rounded-[36px] p-7 sm:p-8 xl:p-9 border border-white/10 shadow-xs flex flex-col justify-between items-start"
    >
      <div>
        {/* Purposeful accent icon */}
        <div className="w-10 h-10 rounded-2xl bg-[#FE6000] text-[#18181B] flex items-center justify-center mb-6">
          <Sparkles className="w-5 h-5 text-[#18181B]" />
        </div>

        {/* Heading */}
        <h3 className="text-2xl sm:text-[26px] font-semibold text-[#18181B] tracking-[-0.02em] leading-tight mb-3">
          {heading}
        </h3>

        {/* Body Copy */}
        <p className="text-sm sm:text-[15px] text-[#18181B]/85 leading-relaxed font-normal mb-8">
          {body}
        </p>
      </div>

      {/* CTA Button */}
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2.5 bg-[#FE6000] hover:bg-[#E05500] text-[#18181B] px-6 py-3.5 rounded-full text-sm font-bold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE6000] shadow-xs cursor-pointer"
      >
        <span>{ctaText}</span>
        <ArrowRight className="w-4 h-4 text-[#18181B]" />
      </button>
    </div>
  );
};
