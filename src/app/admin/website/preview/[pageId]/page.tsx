'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Eye, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { siteConfig } from '@/content/site';

// Layout & Modals
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { QuoteInquiryModal } from '@/components/ui/QuoteInquiryModal';

// Homepage components
import { Hero } from '@/components/home/Hero';
import { ServiceTicker } from '@/components/home/ServiceTicker';
import { AboutSection } from '@/components/home/AboutSection';
import { ServicesHighlightSection } from '@/components/home/ServicesHighlightSection';
import { WhenPlansOverlapSection } from '@/components/home/WhenPlansOverlapSection';
import { RequestQuoteSection } from '@/components/home/RequestQuoteSection';
import { HomeFaqSection } from '@/components/home/HomeFaqSection';
import { HomeContactSection } from '@/components/home/HomeContactSection';

// Other page clients
import { AboutPageClient } from '@/app/about/AboutPageClient';
import { ServicesPageClient } from '@/app/services/ServicesPageClient';
import { ContactPageClient } from '@/app/contact/ContactPageClient';

export default function DraftPreviewPage() {
  const params = useParams();
  const pageId = (params.pageId as string) || 'home';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);
  const [sections, setSections] = useState<Record<string, any>>({});
  const [error, setError] = useState('');

  // Homepage modal state
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteServices, setQuoteServices] = useState<('cleaning' | 'moving' | 'storage')[] | undefined>(undefined);

  const handleOpenQuote = (srvs?: ('cleaning' | 'moving' | 'storage')[]) => {
    setQuoteServices(srvs);
    setIsQuoteModalOpen(true);
  };

  const loadDraft = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/cms/pages/${pageId}`);
      if (!res.ok) {
        throw new Error(`Failed to load draft for page '${pageId}'.`);
      }
      const data = await res.json();
      if (data.page) {
        setPage(data.page);
        const dict: Record<string, any> = {};
        for (const sec of data.page.sections || []) {
          dict[sec.sectionKey] = sec.draftContent !== null && sec.draftContent !== undefined
            ? sec.draftContent
            : sec.content;
        }
        setSections(dict);
      }
    } catch (err: any) {
      console.error('[Draft Preview Error]:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraft();
  }, [pageId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] gap-3">
        <div className="relative w-8 h-8 motion-safe:animate-pulse">
          <Image
            src="/assets/brand/laurrel-symbol.png"
            alt="Loading"
            fill
            sizes="32px"
            className="object-contain"
          />
        </div>
        <p className="text-xs text-zinc-400 font-medium tracking-wide">
          Rendering draft preview for {pageId}...
        </p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F7F4] p-4 text-center">
        <div className="max-w-md bg-white p-6 rounded-2xl border border-black/10 shadow-lg space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h2 className="text-base font-bold text-zinc-900">Preview Unavailable</h2>
          <p className="text-xs text-zinc-500">{error || 'Could not load draft content.'}</p>
          <Link
            href={`/admin/website/${pageId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#49056B] text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Editor</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] relative">
      {/* Persistent Draft Notice Bar (Floating at top) */}
      <div className="sticky top-0 z-50 bg-[#202024] text-white px-4 py-2.5 flex items-center justify-between text-xs shadow-md border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#FE6000] animate-pulse" />
          <span className="font-semibold text-zinc-200">
            DRAFT PREVIEW MODE — <span className="text-white">{page.name}</span>
          </span>
          <span className="hidden sm:inline text-zinc-400">
            (Live visitors do not see these changes until published)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDraft}
            className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reload</span>
          </button>
          <Link
            href={`/admin/website/${pageId}`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#49056B] text-white hover:bg-[#5B0785] text-xs font-semibold transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Return to Editor</span>
          </Link>
        </div>
      </div>

      {/* RENDER TARGET PREVIEW BASED ON PAGE */}
      {pageId === 'home' && (
        <>
          <SiteHeader onOpenQuote={() => handleOpenQuote()} />
          <main className="flex-1">
            <Hero onOpenQuote={() => handleOpenQuote()} initialData={sections['hero']} />
            <ServiceTicker />
            <AboutSection onOpenQuote={() => handleOpenQuote()} initialData={sections['about']} />
            <ServicesHighlightSection content={sections['servicesHighlight']} />
            <WhenPlansOverlapSection content={sections['overlappingPlans']} onOpenQuote={handleOpenQuote} />
            <RequestQuoteSection content={sections['requestQuote']} onOpenQuote={() => handleOpenQuote()} />
            <HomeFaqSection content={sections['faq']} />
            <HomeContactSection content={sections['contact']} />
          </main>
          <SiteFooter onOpenQuote={() => handleOpenQuote()} />
          <QuoteInquiryModal
            isOpen={isQuoteModalOpen}
            onClose={() => {
              setIsQuoteModalOpen(false);
              setQuoteServices(undefined);
            }}
            initialServices={quoteServices}
          />
        </>
      )}

      {pageId === 'about' && (
        <AboutPageClient
          content={{
            banner: sections['banner'] || siteConfig.aboutPage.banner,
            aboutCompany: sections['aboutCompany'] || siteConfig.aboutPage.aboutCompany,
            whatWeDo: sections['whatWeDo'] || siteConfig.aboutPage.whatWeDo,
            whyLaurrel: sections['whyLaurrel'] || siteConfig.aboutPage.whyLaurrel,
            marquee: sections['marquee'] || siteConfig.aboutPage.marquee,
            faq: sections['faq'] || siteConfig.aboutPage.faq,
            finalCta: sections['finalCta'] || siteConfig.aboutPage.finalCta,
            meta: page.seo || siteConfig.aboutPage.meta,
          }}
        />
      )}

      {pageId === 'services' && (
        <ServicesPageClient
          content={{
            meta: page.seo || siteConfig.servicesPage.meta,
            banner: sections['banner'] || siteConfig.servicesPage.banner,
            articleIntro: sections['articleIntro'] || siteConfig.servicesPage.articleIntro,
            services: sections['servicesList']?.services || siteConfig.servicesPage.services,
            gettingStarted: sections['gettingStarted'] || siteConfig.servicesPage.gettingStarted,
            faq: sections['faq'] || siteConfig.servicesPage.faq,
            finalCta: sections['finalCta'] || siteConfig.servicesPage.finalCta,
            sidebarForm: sections['sidebarForm'] || siteConfig.servicesPage.sidebarForm,
            sidebarInfoPanel: sections['sidebarInfoPanel'] || siteConfig.servicesPage.sidebarInfoPanel,
          }}
        />
      )}

      {pageId === 'contact' && (
        <ContactPageClient
          content={{
            meta: page.seo || siteConfig.contactPage.meta,
            banner: sections['banner'] || siteConfig.contactPage.banner,
            eyebrow: sections['contactInfo']?.eyebrow || siteConfig.contactPage.eyebrow,
            headline: sections['contactInfo']?.headline || siteConfig.contactPage.headline,
            supportingParagraph: sections['contactInfo']?.supportingParagraph || siteConfig.contactPage.supportingParagraph,
            businessEmail: sections['contactInfo']?.businessEmail ?? siteConfig.contactPage.businessEmail,
            businessPhone: sections['contactInfo']?.businessPhone ?? siteConfig.contactPage.businessPhone,
            hasPublicOffice: sections['contactInfo']?.hasPublicOffice ?? siteConfig.contactPage.hasPublicOffice,
            officeAddress: sections['contactInfo']?.officeAddress ?? siteConfig.contactPage.officeAddress,
            locationHeading: sections['contactInfo']?.locationHeading || siteConfig.contactPage.locationHeading,
            serviceRegionDescription: sections['contactInfo']?.serviceRegionDescription || siteConfig.contactPage.serviceRegionDescription,
            confirmedServiceAreas: sections['contactInfo']?.confirmedServiceAreas || siteConfig.contactPage.confirmedServiceAreas,
            form: sections['form'] || siteConfig.contactPage.form,
          }}
        />
      )}
    </div>
  );
}
