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
          className={`relative group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg border border-[#390044]/20 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#C8E80B]/50 ${
            isOpen
              ? 'bg-[#202024] text-white hover:bg-black'
              : 'bg-[#390044] text-white hover:bg-[#390044]/90 hover:scale-[1.02]'
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <MessageSquare className="w-5 h-5 text-[#C8E80B]" />
          )}

          <span className="text-xs font-semibold tracking-wide pr-0.5">
            {isOpen ? 'Close Assistant' : 'Laurrel Assistant'}
          </span>

          {/* Restrained lime status indicator */}
          {!isOpen && (
            <span
              className="w-2 h-2 rounded-full bg-[#C8E80B] shadow-[0_0_8px_rgba(200,232,11,0.6)]"
              aria-hidden="true"
            />
          )}
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
