'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { siteConfig, OverlappingPlansConfig, OverlappingPlansSituation } from '@/content/site';
import { getOverlappingPlansData, isCmsConfigured } from '@/sanity/client';

interface WhenPlansOverlapSectionProps {
  content?: OverlappingPlansConfig;
  onOpenQuote?: (services?: ('cleaning' | 'moving' | 'storage')[]) => void;
}

export const WhenPlansOverlapSection: React.FC<WhenPlansOverlapSectionProps> = ({
  content,
  onOpenQuote,
}) => {
  const [activeContent, setActiveContent] = useState<OverlappingPlansConfig>(
    content || siteConfig.overlappingPlans
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (isCmsConfigured && !content) {
      getOverlappingPlansData().then((res) => {
        if (res?.data) {
          setActiveContent(res.data);
        }
      }).catch(() => {});
    }
  }, [content]);

  const situations = activeContent.situations;
  const current = situations[currentIndex] || situations[0];

  const handleSelectIndex = (newIndex: number) => {
    if (newIndex === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 200);
  };

  const handlePrev = () => {
    const nextIdx = currentIndex === 0 ? situations.length - 1 : currentIndex - 1;
    handleSelectIndex(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = currentIndex === situations.length - 1 ? 0 : currentIndex + 1;
    handleSelectIndex(nextIdx);
  };

  // Close detail modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && detailModalOpen) {
        setDetailModalOpen(false);
      }
    };
    if (detailModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [detailModalOpen]);

  const handleOpenDetailModal = () => {
    setDetailModalOpen(true);
  };

  const handleQuoteFromDetail = () => {
    setDetailModalOpen(false);
    if (onOpenQuote) {
      onOpenQuote(current.preselectedServices);
    }
  };

  return (
    <section
      id="when-plans-overlap"
      aria-labelledby="when-plans-overlap-heading"
      className="w-full py-20 lg:py-28 px-6 sm:px-8 lg:px-12 xl:px-16 bg-[#F8F7F4] border-t border-[#202024]/8"
    >
      <div className="max-w-[1400px] xl:max-w-[1440px] 2xl:max-w-[1560px] mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-3 block">
              {activeContent.eyebrow}
            </span>
            <h2
              id="when-plans-overlap-heading"
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold text-[#18181B] tracking-[-0.03em] leading-[1.12] mb-6"
            >
              {activeContent.headline}
            </h2>
            <div className="space-y-3 text-base sm:text-lg text-[#202024]/85 leading-relaxed font-normal">
              {activeContent.intro.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Navigation Controls on Desktop Header */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0 mb-2">
            <button
              onClick={handlePrev}
              aria-label="Previous situation"
              className="w-12 h-12 rounded-full border border-[#202024]/15 bg-white hover:bg-[#F2F1ED] text-[#18181B] flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#18181B]"
            >
              <ChevronLeft className="w-5 h-5 text-[#18181B]" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next situation"
              className="w-12 h-12 rounded-full border border-[#202024]/15 bg-white hover:bg-[#F2F1ED] text-[#18181B] flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#18181B]"
            >
              <ChevronRight className="w-5 h-5 text-[#18181B]" />
            </button>
          </div>
        </div>

        {/* Featured Editorial Showcase: Single Photograph (Left 60-62%) + Lime Panel (Right 38-40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-stretch">
          
          {/* Left Column: Substantial Photograph (~60% desktop width) */}
          <div className="lg:col-span-7 relative min-h-[360px] sm:min-h-[460px] lg:min-h-[520px] rounded-[24px] sm:rounded-[26px] overflow-hidden bg-[#202024]/5 border border-[#202024]/8 shadow-sm">
            <div
              className={`relative w-full h-full transition-opacity duration-500 ease-out ${
                isTransitioning ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <Image
                src={current.imageSrc}
                alt={current.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 62vw"
                className="object-cover object-center"
              />
            </div>
          </div>

          {/* Right Column: Lime Content Panel (~40% desktop width) */}
          <div
            className={`lg:col-span-5 bg-[#C8E80B] text-[#18181B] rounded-[24px] sm:rounded-[26px] p-8 sm:p-10 lg:p-11 border border-[#202024]/8 shadow-sm flex flex-col justify-between transition-opacity duration-500 ease-out ${
              isTransitioning ? 'opacity-40' : 'opacity-100'
            }`}
          >
            {/* Top Section */}
            <div>
              {/* Header inside Lime card: linear vector illustration + State Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-2xl bg-[#18181B] text-[#C8E80B] flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5 text-[#C8E80B]" />
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-[#18181B]/80 uppercase">
                  <span>0{currentIndex + 1}</span>
                  <span>/</span>
                  <span>0{situations.length}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#18181B] tracking-tight leading-[1.18] mb-4">
                {current.title}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base lg:text-[17px] text-[#18181B]/85 leading-relaxed font-normal mb-6">
                {current.description}
              </p>

              {/* Related Services */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/10 text-xs font-semibold text-[#18181B] mb-8">
                <span>Related: {current.relatedServicesText}</span>
              </div>
            </div>

            {/* Bottom Actions & Situation Switching */}
            <div className="pt-6 border-t border-[#18181B]/15">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* View Details CTA with inner white arrow circle */}
                <button
                  type="button"
                  onClick={handleOpenDetailModal}
                  className="group inline-flex items-center gap-3 bg-[#18181B] hover:bg-[#390044] text-white pl-6 pr-2.5 py-2.5 rounded-full font-medium text-sm sm:text-base transition-colors duration-200 cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B]"
                >
                  <span>View Details</span>
                  <div className="w-8 h-8 rounded-full bg-white text-[#18181B] flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="w-4 h-4 text-[#18181B]" />
                  </div>
                </button>

                {/* Request a Quote Button */}
                <button
                  type="button"
                  onClick={() => onOpenQuote && onOpenQuote(current.preselectedServices)}
                  className="inline-flex items-center justify-center bg-white/85 hover:bg-white text-[#18181B] px-5 py-3 rounded-full font-medium text-sm sm:text-base transition-colors duration-200 cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#18181B]"
                >
                  <span>Request a Quote</span>
                </button>
              </div>

              {/* Situation Switcher Tabs / Dots */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {situations.map((sit, idx) => (
                    <button
                      key={sit.id}
                      onClick={() => handleSelectIndex(idx)}
                      aria-label={`Switch to ${sit.title}`}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        idx === currentIndex ? 'w-8 bg-[#18181B]' : 'w-2.5 bg-[#18181B]/30 hover:bg-[#18181B]/50'
                      }`}
                    />
                  ))}
                </div>

                {/* Mobile / Compact Next/Prev buttons */}
                <div className="flex sm:hidden items-center gap-2">
                  <button
                    onClick={handlePrev}
                    aria-label="Previous situation"
                    className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#18181B]" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next situation"
                    className="w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-[#18181B]" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Accessible Situation Detail Modal */}
      {detailModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#202024]/60 backdrop-blur-sm p-4 sm:p-6"
          onClick={() => setDetailModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="situation-detail-title"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl border border-[#202024]/10 text-[#202024] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-bold tracking-widest uppercase text-[#390044] mb-1.5 block">
                  SITUATION DETAILS
                </span>
                <h3
                  id="situation-detail-title"
                  className="text-2xl sm:text-3xl font-semibold text-[#18181B] tracking-tight"
                >
                  {current.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="w-10 h-10 rounded-full bg-[#F8F7F4] hover:bg-[#EAE8E2] text-[#202024] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5 text-[#202024]" />
              </button>
            </div>

            {/* Intro paragraph */}
            <p className="text-base text-[#202024]/85 leading-relaxed mb-6">
              {current.details.intro}
            </p>

            {/* Useful Information checklist */}
            <div className="mb-6 bg-[#F8F7F4] rounded-2xl p-5 border border-[#202024]/8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#18181B] mb-3">
                Helpful details to include in your enquiry:
              </h4>
              <ul className="space-y-2.5">
                {current.details.considerations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-[#202024]/85 leading-normal">
                    <CheckCircle2 className="w-4 h-4 text-[#390044] flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preselected Services */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#202024]/10">
              <span className="text-xs font-medium text-[#202024]/70">Coordinated services:</span>
              <span className="text-xs font-bold text-[#390044] bg-[#390044]/10 px-3 py-1 rounded-full">
                {current.relatedServicesText}
              </span>
            </div>

            {/* Action Button: Opens Quote Modal with preselection */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="w-full sm:w-auto px-5 py-3 rounded-full text-sm font-medium text-[#202024]/80 hover:bg-[#F2F1ED] transition-colors cursor-pointer text-center"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleQuoteFromDetail}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#18181B] hover:bg-[#390044] text-white px-7 py-3.5 rounded-full text-sm font-medium transition-colors cursor-pointer shadow-sm"
              >
                <span>Request a Quote for this Situation</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
