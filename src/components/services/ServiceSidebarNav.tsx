'use client';

import React, { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'cleaning', label: 'Cleaning Services', href: '#cleaning' },
  { id: 'moving', label: 'Moving Services', href: '#moving' },
  { id: 'storage', label: 'Storage Services', href: '#storage' },
  { id: 'how-it-works', label: 'How It Works', href: '#how-it-works' },
  { id: 'faq', label: 'Frequently Asked Questions', href: '#faq' },
];

export const ServiceSidebarNav: React.FC = () => {
  const [activeId, setActiveId] = useState<string>('cleaning');

  useEffect(() => {
    // Handle initial hash on page load
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (NAV_ITEMS.some((item) => item.id === hash)) {
        setActiveId(hash);
        // Delay slightly for hydration and layout stabilization
        setTimeout(() => {
          const targetEl = document.getElementById(hash);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    }

    // Set up IntersectionObserver to update active state during scroll
    const sectionIds = NAV_ITEMS.map((item) => item.id);
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible entries
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top position to pick the one closest to header
          visibleEntries.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
          setActiveId(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: '-120px 0px -40% 0px',
        threshold: [0, 0.2, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (history.pushState) {
        history.pushState(null, '', `#${id}`);
      }
    }
  };

  return (
    <>
      {/* ========================================================= */}
      {/* DESKTOP SIDEBAR NAV PANEL (Sticky)                       */}
      {/* ========================================================= */}
      <div className="hidden lg:block w-full sticky top-28 xl:top-32 self-start">
        <nav
          aria-label="Services Navigation"
          className="w-full bg-[#F2F1ED] rounded-[36px] p-6 xl:p-7 border border-[#202024]/8 shadow-sm"
        >
          <div className="space-y-3.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeId === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleClick(e, item.id)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`group w-full h-[60px] px-6 rounded-full flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#C8E80B] text-[#18181B] font-semibold shadow-sm'
                      : 'bg-white text-[#18181B] hover:bg-white/90 font-medium shadow-xs'
                  }`}
                >
                  <span className="text-[17px] tracking-tight truncate pr-2 select-none">
                    {item.label}
                  </span>
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                      isActive
                        ? 'bg-[#18181B] text-white'
                        : 'bg-[#202024]/5 text-[#18181B] group-hover:translate-x-0.5'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </a>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ========================================================= */}
      {/* MOBILE / TABLET HORIZONTAL SERVICE SELECTOR              */}
      {/* ========================================================= */}
      <div className="lg:hidden w-full mb-10 overflow-x-auto pb-2 scrollbar-none">
        <nav
          aria-label="Mobile Services Selector"
          className="flex items-center gap-2.5 min-w-max px-1"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleClick(e, item.id)}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#C8E80B] text-[#18181B] font-semibold shadow-xs'
                    : 'bg-white text-[#18181B] border border-[#202024]/10 hover:bg-[#F2F1ED]'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </>
  );
};
