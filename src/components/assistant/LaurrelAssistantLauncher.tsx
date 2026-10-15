'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare, X } from 'lucide-react';

// Lazy-load the chat panel so zero assistant bundle is downloaded on initial page load
const LaurrelAssistantPanel = dynamic(
  () => import('./LaurrelAssistantPanel'),
  { ssr: false }
);

export default function LaurrelAssistantLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating launcher button in bottom-right corner */}
      <aside
        aria-label="Customer service assistant"
        className="fixed bottom-6 right-6 z-40 select-none"
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close Laurrel Assistant' : 'Open Laurrel Assistant'}
          className={`relative group flex items-center gap-2.5 px-4.5 py-3 rounded-full shadow-lg border border-[#390044]/20 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#390044]/30 ${
            isOpen
              ? 'bg-[#202024] text-white hover:bg-black'
              : 'bg-[#390044] text-white hover:bg-[#390044]/90'
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white shrink-0" />
          ) : (
            <MessageSquare className="w-5 h-5 text-white shrink-0" />
          )}

          <span className="text-sm font-semibold tracking-normal text-white">
            {isOpen ? 'Close Assistant' : 'Laurrel Assistant'}
          </span>
        </button>
      </aside>

      {/* Conditionally rendered assistant chat panel */}
      {isOpen && (
        <LaurrelAssistantPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
