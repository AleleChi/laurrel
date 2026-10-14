'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/Button';
import { siteConfig } from '@/content/site';

interface SiteHeaderProps {
  onOpenQuote: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenQuote }) => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle ESC key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled ? 'pt-2 sm:pt-3' : 'pt-4 sm:pt-6'
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Main Navigation"
            className={`w-full bg-[#FFFFFF]/90 backdrop-blur-md rounded-2xl border border-black/[0.08] transition-all duration-300 ${
              isScrolled
                ? 'shadow-nav-scrolled py-2.5 px-4 sm:px-6'
                : 'shadow-nav py-3.5 px-5 sm:px-8'
            } flex items-center justify-between`}
          >
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded-lg p-0.5"
              aria-label="Laurrel Services Home"
            >
              <Logo />
            </Link>

            {/* Desktop Center Navigation Links (1024px+) */}
            <ul className="hidden lg:flex items-center gap-7 xl:gap-9 text-[15px] font-medium text-[#202024]">
              {siteConfig.navigation.links.map((link) => {
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : link.href.includes('#')
                    ? pathname === '/'
                    : pathname === link.href;
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`relative py-1 transition-colors duration-200 hover:text-[#390044] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] rounded ${
                        isActive ? 'text-[#390044] font-semibold' : 'text-[#202024]/85'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#390044] rounded-full" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Right Action: CTA Button + Tablet/Mobile Hamburger */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="hidden sm:block">
                <Button
                  variant="primary"
                  size="md"
                  onClick={onOpenQuote}
                  icon={<ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />}
                  className="!h-10 sm:!h-11 !px-4 sm:!px-5 text-sm font-semibold !rounded-xl whitespace-nowrap"
                >
                  {siteConfig.navigation.cta.label}
                </Button>
              </div>

              {/* Tablet & Mobile Menu Toggle Button (shown below 1024px) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-[#202024] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#390044] transition-colors"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#390044]" />
                ) : (
                  <Menu className="w-6 h-6 text-[#202024]" />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Tablet & Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-[#202024]/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute top-20 left-4 right-4 bg-[#FFFFFF] rounded-2xl shadow-2xl border border-black/10 p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="space-y-4 text-base font-semibold text-[#202024]">
              {siteConfig.navigation.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 px-3 rounded-lg hover:bg-[#390044]/5 hover:text-[#390044] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-black/10">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQuote();
                }}
                className="w-full justify-center"
              >
                {siteConfig.navigation.cta.label}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
