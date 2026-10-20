'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronRight, ChevronDown } from 'lucide-react';
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
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle ESC key and outside click to close menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (servicesDropdownOpen) setServicesDropdownOpen(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [servicesDropdownOpen, mobileMenuOpen]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setServicesDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setServicesDropdownOpen(false);
    }, 150);
  };

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
              className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B] rounded-lg p-0.5"
              aria-label="Laurrel Services Home"
            >
              <Logo />
            </Link>

            {/* Desktop Center Navigation Links (1024px+) */}
            <ul className="hidden lg:flex items-center gap-7 xl:gap-9 text-[15px] font-medium text-[#202024]">
              {siteConfig.navigation.links.map((link) => {
                const isServices = link.label === 'Services' || Boolean(link.dropdown);
                const isActive =
                  link.href === '/'
                    ? pathname === '/'
                    : isServices
                    ? pathname.startsWith('/services')
                    : pathname === link.href;

                if (isServices && link.dropdown) {
                  return (
                    <li
                      key={link.label}
                      ref={dropdownRef}
                      className="relative py-1"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="flex items-center gap-1">
                        <Link
                          href={link.href}
                          className={`transition-colors duration-200 hover:text-[#49056B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B] rounded ${
                            isActive ? 'text-[#49056B] font-semibold' : 'text-[#202024]/85'
                          }`}
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => setServicesDropdownOpen(false)}
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setServicesDropdownOpen((prev) => !prev)}
                          aria-expanded={servicesDropdownOpen}
                          aria-haspopup="true"
                          aria-label="Toggle Services dropdown"
                          className="p-1 rounded hover:bg-black/5 text-[#202024]/75 hover:text-[#49056B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B]"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              servicesDropdownOpen ? 'rotate-180 text-[#49056B]' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {isActive && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#49056B] rounded-full" />
                      )}

                      {/* Dropdown Menu */}
                      {servicesDropdownOpen && (
                        <div
                          role="menu"
                          aria-orientation="vertical"
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-[#202024]/10 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                          {link.dropdown.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              role="menuitem"
                              onClick={() => setServicesDropdownOpen(false)}
                              className="block px-3.5 py-2 text-sm text-[#202024]/90 hover:text-[#49056B] hover:bg-[#F8F7F4] rounded-xl transition-colors font-medium"
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={link.label} className="relative py-1">
                    <Link
                      href={link.href}
                      className={`transition-colors duration-200 hover:text-[#49056B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B] rounded ${
                        isActive ? 'text-[#49056B] font-semibold' : 'text-[#202024]/85'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#49056B] rounded-full" />
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
                className="lg:hidden p-2 rounded-xl text-[#202024] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#49056B] transition-colors"
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-[#49056B]" />
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
            <ul className="space-y-3 text-base font-semibold text-[#202024]">
              {siteConfig.navigation.links.map((link) => {
                const isServices = link.label === 'Services' || Boolean(link.dropdown);

                if (isServices && link.dropdown) {
                  return (
                    <li key={link.label} className="border-b border-[#202024]/8 pb-2">
                      <div className="flex items-center justify-between">
                        <Link
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="py-2 px-3 rounded-lg hover:bg-[#49056B]/5 hover:text-[#49056B] transition-colors"
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setMobileServicesOpen((prev) => !prev)}
                          aria-expanded={mobileServicesOpen}
                          className="p-2 text-[#202024]/70 hover:text-[#49056B]"
                          aria-label="Toggle services links"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              mobileServicesOpen ? 'rotate-180 text-[#49056B]' : ''
                            }`}
                          />
                        </button>
                      </div>

                      {mobileServicesOpen && (
                        <div className="pl-4 pt-1 space-y-1">
                          {link.dropdown.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMobileServicesOpen(false);
                              }}
                              className="block py-2 px-3 text-sm text-[#202024]/80 hover:text-[#49056B] hover:bg-[#F8F7F4] rounded-lg transition-colors font-medium"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                }

                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-2 px-3 rounded-lg hover:bg-[#49056B]/5 hover:text-[#49056B] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
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
