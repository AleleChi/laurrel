'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MessageSquare } from 'lucide-react';

// Lazy-load the chat panel so zero assistant bundle is downloaded on initial page load
const LaurrelAssistantPanel = dynamic(
  () => import('./LaurrelAssistantPanel'),
  { ssr: false }
);

export default function LaurrelAssistantLauncher() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating launcher button in bottom-right corner - only rendered when chat is closed */}
      {!isOpen && (
        <aside
          aria-label="Customer service assistant"
          className="fixed bottom-5 right-5 z-40 select-none"
        >
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={false}
            aria-label="Open Laurrel Assistant"
            className="group inline-flex items-center justify-center w-auto gap-2.5 px-5 py-3 rounded-full shadow-lg border border-[#49056B]/20 bg-[#49056B] text-white hover:bg-[#49056B]/90 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#49056B]/30"
          >
            <MessageSquare className="w-5 h-5 text-white shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-normal text-white whitespace-nowrap leading-none">
              Laurrel Assistant
            </span>
          </button>
        </aside>
      )}

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
