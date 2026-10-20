'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  Save,
  Send,
  Eye,
  History,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';

import { PageSeoEditor, PageSeoData } from '@/components/admin/cms/PageSeoEditor';
import { RevisionHistoryDrawer, CmsRevisionItem } from '@/components/admin/cms/RevisionHistoryDrawer';

// Homepage Editors
import {
  HeroSectionEditor,
  HomeAboutEditor,
  ServicesHighlightEditor,
  OverlappingPlansEditor,
  RequestQuoteSectionEditor,
  FaqSectionEditor,
  ContactTeaserEditor,
} from '@/components/admin/cms/HomeSectionEditors';

// About Page Editors
import {
  AboutBannerEditor,
  AboutCompanyStoryEditor,
  AboutWhatWeDoEditor,
  AboutWhyLaurrelEditor,
  AboutFinalCtaEditor,
} from '@/components/admin/cms/AboutPageEditors';

// Services Page Editors
import {
  ServicesBannerEditor,
  ServicesArticleIntroEditor,
  ServicesDetailListEditor,
  GettingStartedStepsEditor,
  ServicesSidebarEditor,
} from '@/components/admin/cms/ServicesPageEditors';

// Contact Page Editors
import {
  ContactBannerEditor,
  ContactInfoEditor,
  ContactFormEditor,
} from '@/components/admin/cms/ContactPageEditors';

interface CmsSectionRaw {
  id: string;
  sectionKey: string;
  sectionType: string;
  sortOrder: number;
  content: Record<string, any>;
  draftContent?: Record<string, any> | null;
}

interface CmsPageFull {
  id: string;
  name: string;
  slug: string;
  template: string;
  status: 'draft' | 'published' | 'scheduled';
  seo: PageSeoData;
  currentRevisionId?: string;
  lastEditorEmail?: string;
  publishedAt?: string;
  updatedAt: string;
  sections: CmsSectionRaw[];
}

export default function PageContentEditor() {
  const router = useRouter();
  const params = useParams();
  const pageId = (params.pageId as string) || 'home';

  const [page, setPage] = useState<CmsPageFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSectionKey, setActiveSectionKey] = useState<string>('');
  
  // Local working state
  const [workingSections, setWorkingSections] = useState<Record<string, any>>({});
  const [workingSeo, setWorkingSeo] = useState<PageSeoData>({});
  const [isDirty, setIsDirty] = useState(false);

  // User auth & role
  const [userRole, setUserRole] = useState<string>('viewer');

  // Action states
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishNotes, setPublishNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Revision drawer state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [revisions, setRevisions] = useState<CmsRevisionItem[]>([]);

  const canEdit = ['owner', 'admin', 'content_editor'].includes(userRole);
  const canPublish = ['owner', 'admin'].includes(userRole);

  // Load user session
  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user) {
          setUserRole(d.user.role);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch page content
  const loadPageData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/cms/pages/${pageId}`);
      if (!res.ok) {
        throw new Error(`Failed to load page '${pageId}'. Status: ${res.status}`);
      }
      const data = await res.json();
      if (data.page) {
        const p: CmsPageFull = data.page;
        setPage(p);
        setWorkingSeo(p.seo || {});

        // Build working dictionary prioritizing draftContent if present, else content
        const dict: Record<string, any> = {};
        for (const sec of p.sections || []) {
          dict[sec.sectionKey] = sec.draftContent !== null && sec.draftContent !== undefined
            ? sec.draftContent
            : sec.content;
        }
        setWorkingSections(dict);

        // Default to first section or SEO
        if (!activeSectionKey && p.sections && p.sections.length > 0) {
          setActiveSectionKey(p.sections[0].sectionKey);
        }
        setIsDirty(false);
      }
    } catch (err: any) {
      console.error('[Load Page Error]:', err.message);
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [pageId, activeSectionKey]);

  useEffect(() => {
    loadPageData();
  }, [pageId]);

  // Load revisions when drawer opens
  const loadRevisions = async () => {
    try {
      const res = await fetch(`/api/admin/cms/pages/${pageId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      console.error('[Load Revisions Error]:', err);
    }
  };

  const handleOpenHistory = () => {
    setHistoryOpen(true);
    loadRevisions();
  };

  // Warn before navigation if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Update a section in memory
  const handleSectionChange = (secKey: string, updatedData: any) => {
    setWorkingSections((prev) => ({
      ...prev,
      [secKey]: updatedData,
    }));
    setIsDirty(true);
    setStatusMessage(null);
  };

  // Update SEO in memory
  const handleSeoChange = (updatedSeo: PageSeoData) => {
    setWorkingSeo(updatedSeo);
    setIsDirty(true);
    setStatusMessage(null);
  };

  // Save Draft action
  const handleSaveDraft = async () => {
    if (!canEdit) return;
    setIsSavingDraft(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/admin/cms/pages/${pageId}/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: workingSections,
          seo: workingSeo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save draft changes.');
      }

      setIsDirty(false);
      setStatusMessage({ type: 'success', text: 'Draft revisions saved successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Publish action
  const handleConfirmPublish = async () => {
    if (!canPublish) return;
    setIsPublishing(true);
    setStatusMessage(null);

    try {
      // 1. Ensure latest drafts are saved first
      await fetch(`/api/admin/cms/pages/${pageId}/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: workingSections,
          seo: workingSeo,
        }),
      });

      // 2. Publish to live website
      const res = await fetch(`/api/admin/cms/pages/${pageId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: publishNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish changes.');
      }

      setIsDirty(false);
      setPublishModalOpen(false);
      setPublishNotes('');
      setStatusMessage({
        type: 'success',
        text: `Published successfully as Revision #${data.revision?.revisionNumber || 'latest'}. Changes are now live.`,
      });

      // Reload page state
      await loadPageData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  // Restore Revision action
  const handleRestoreRevision = async (revNumber: number) => {
    const res = await fetch(`/api/admin/cms/pages/${pageId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revisionNumber: revNumber }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to restore revision.');
    }

    setStatusMessage({
      type: 'success',
      text: `Successfully restored revision #${revNumber}.`,
    });
    await loadPageData();
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3" role="status" aria-busy="true">
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
          Loading page editor...
        </p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-8 bg-white rounded-xl border border-black/[0.06] text-center space-y-4">
        <p className="text-sm text-zinc-600">Page '{pageId}' could not be located in the CMS database.</p>
        <Link
          href="/admin/website"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#49056B] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Pages Overview</span>
        </Link>
      </div>
    );
  }

  // Section list items
  const sectionNavItems = [
    ...(page.sections || []).map((s) => ({
      key: s.sectionKey,
      label: formatSectionLabel(s.sectionKey),
    })),
    { key: '__seo__', label: 'SEO & Metadata' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/website"
            className="p-1.5 rounded-lg border border-black/10 bg-white hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">{page.name}</h1>
              {isDirty ? (
                <span className="text-[10px] font-semibold text-[#FE6000] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  Unsaved Changes
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Synced
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live route: <span className="font-mono text-zinc-600">{page.slug}</span> · Last published{' '}
              {page.publishedAt ? new Date(page.publishedAt).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>

        {/* Global Editor Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Revision History */}
          <button
            id="open-history-btn"
            type="button"
            onClick={handleOpenHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-black/10 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>History</span>
          </button>

          {/* Preview Draft */}
          <Link
            id="preview-draft-link"
            href={`/admin/website/preview/${page.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-black/10 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>Preview</span>
          </Link>

          {/* Save Draft */}
          <button
            id="save-draft-btn"
            type="button"
            disabled={isSavingDraft || !canEdit || !isDirty}
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-zinc-500" />
            <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
          </button>

          {/* Publish Changes */}
          <button
            id="publish-live-btn"
            type="button"
            disabled={isPublishing || !canPublish}
            onClick={() => setPublishModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] bg-[#49056B] hover:bg-[#5B0785] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            title={
              !canPublish
                ? 'Publishing requires owner or administrator permissions'
                : 'Publish changes to the live website'
            }
          >
            <Send className="w-3.5 h-3.5 text-orange-400" />
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Two-Column Layout (Desktop: narrow nav on left, generous workspace on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mobile Section Selector */}
        <div className="lg:hidden col-span-12">
          <label className="block text-xs font-semibold text-zinc-700 mb-1">Select Section</label>
          <select
            value={activeSectionKey}
            onChange={(e) => setActiveSectionKey(e.target.value)}
            className="w-full p-2.5 bg-white border border-black/10 rounded-[10px] text-xs font-medium text-zinc-900"
          >
            {sectionNavItems.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block lg:col-span-3 space-y-1 bg-white p-3 rounded-xl border border-black/[0.06] shadow-xs self-start sticky top-6">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Page Sections
          </div>
          <nav className="space-y-1">
            {sectionNavItems.map((item) => {
              const isActive = activeSectionKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSectionKey(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-[#49056B] text-white font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FE6000]" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Generous Section Editing Workspace */}
        <main className="col-span-12 lg:col-span-9 space-y-6">
          {renderActiveSectionEditor({
            pageId,
            activeKey: activeSectionKey,
            workingSections,
            workingSeo,
            onSectionChange: handleSectionChange,
            onSeoChange: handleSeoChange,
            disabled: !canEdit,
          })}
        </main>
      </div>

      {/* Revision History Drawer */}
      <RevisionHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        revisions={revisions}
        currentRevisionId={page.currentRevisionId}
        onRestore={handleRestoreRevision}
        canPublish={canPublish}
      />

      {/* Publish Confirmation Modal */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-black/[0.08] p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                Publish Changes to Live Site?
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                This will save your draft changes, create an immutable revision record in Neon PostgreSQL, and update the live website content for <span className="font-semibold text-zinc-900">{page.name}</span>.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-800">
                Revision Notes <span className="text-zinc-400 font-normal">(Optional)</span>
              </label>
              <input
                id="publish-notes-input"
                type="text"
                value={publishNotes}
                onChange={(e) => setPublishNotes(e.target.value)}
                placeholder="e.g. Updated hero headline and spring promo copy"
                className="w-full p-2.5 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-black/10 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-publish-btn"
                type="button"
                disabled={isPublishing}
                onClick={handleConfirmPublish}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#49056B] text-white hover:bg-[#5B0785] text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5 text-orange-400" />
                <span>{isPublishing ? 'Publishing...' : 'Confirm & Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to format section labels in sidebar
function formatSectionLabel(key: string): string {
  switch (key) {
    case 'hero':
      return 'Hero & Video Rotator';
    case 'ticker':
      return 'Service Ticker';
    case 'about':
      return 'About Teaser';
    case 'servicesHighlight':
      return 'Services Overview';
    case 'overlappingPlans':
      return 'When Plans Overlap';
    case 'requestQuote':
      return 'Quote Callout Banner';
    case 'faq':
      return 'Frequently Asked Questions';
    case 'contact':
      return 'Contact Teaser';
    case 'banner':
      return 'Page Header Banner';
    case 'aboutCompany':
      return 'About Company Story';
    case 'whatWeDo':
      return 'What We Do Pillars';
    case 'whyLaurrel':
      return 'Why Laurrel Services';
    case 'marquee':
      return 'Marquee Ticker';
    case 'finalCta':
      return 'Final Callout';
    case 'articleIntro':
      return 'Article Introduction';
    case 'servicesList':
      return 'Services Deep-Dives';
    case 'gettingStarted':
      return 'How To Get Started';
    case 'sidebarForm':
      return 'Sidebar Enquiry Form';
    case 'sidebarInfoPanel':
      return 'Sidebar Info Panel';
    case 'contactInfo':
      return 'Contact Information';
    case 'form':
      return 'Contact Form Text';
    default:
      return key.charAt(0).toUpperCase() + key.slice(1);
  }
}

// Router to render the appropriate sub-editor
function renderActiveSectionEditor({
  pageId,
  activeKey,
  workingSections,
  workingSeo,
  onSectionChange,
  onSeoChange,
  disabled,
}: {
  pageId: string;
  activeKey: string;
  workingSections: Record<string, any>;
  workingSeo: PageSeoData;
  onSectionChange: (key: string, data: any) => void;
  onSeoChange: (seo: PageSeoData) => void;
  disabled?: boolean;
}) {
  if (activeKey === '__seo__') {
    return (
      <PageSeoEditor
        seo={workingSeo}
        onChange={onSeoChange}
        disabled={disabled}
      />
    );
  }

  const currentData = workingSections[activeKey] || {};

  // HOMEPAGE SECTIONS
  if (pageId === 'home') {
    switch (activeKey) {
      case 'hero':
        return <HeroSectionEditor data={currentData} onChange={(d) => onSectionChange('hero', d)} disabled={disabled} />;
      case 'about':
        return <HomeAboutEditor data={currentData} onChange={(d) => onSectionChange('about', d)} disabled={disabled} />;
      case 'servicesHighlight':
        return <ServicesHighlightEditor data={currentData} onChange={(d) => onSectionChange('servicesHighlight', d)} disabled={disabled} />;
      case 'overlappingPlans':
        return <OverlappingPlansEditor data={currentData} onChange={(d) => onSectionChange('overlappingPlans', d)} disabled={disabled} />;
      case 'requestQuote':
        return <RequestQuoteSectionEditor data={currentData} onChange={(d) => onSectionChange('requestQuote', d)} disabled={disabled} />;
      case 'faq':
        return <FaqSectionEditor data={currentData} onChange={(d) => onSectionChange('faq', d)} disabled={disabled} />;
      case 'contact':
        return <ContactTeaserEditor data={currentData} onChange={(d) => onSectionChange('contact', d)} disabled={disabled} />;
    }
  }

  // ABOUT PAGE SECTIONS
  if (pageId === 'about') {
    switch (activeKey) {
      case 'banner':
        return <AboutBannerEditor data={currentData} onChange={(d) => onSectionChange('banner', d)} disabled={disabled} />;
      case 'aboutCompany':
        return <AboutCompanyStoryEditor data={currentData} onChange={(d) => onSectionChange('aboutCompany', d)} disabled={disabled} />;
      case 'whatWeDo':
        return <AboutWhatWeDoEditor data={currentData} onChange={(d) => onSectionChange('whatWeDo', d)} disabled={disabled} />;
      case 'whyLaurrel':
        return <AboutWhyLaurrelEditor data={currentData} onChange={(d) => onSectionChange('whyLaurrel', d)} disabled={disabled} />;
      case 'faq':
        return <FaqSectionEditor data={currentData} onChange={(d) => onSectionChange('faq', d)} disabled={disabled} />;
      case 'finalCta':
        return <AboutFinalCtaEditor data={currentData} onChange={(d) => onSectionChange('finalCta', d)} disabled={disabled} />;
    }
  }

  // SERVICES PAGE SECTIONS
  if (pageId === 'services') {
    switch (activeKey) {
      case 'banner':
        return <ServicesBannerEditor data={currentData} onChange={(d) => onSectionChange('banner', d)} disabled={disabled} />;
      case 'articleIntro':
        return <ServicesArticleIntroEditor data={currentData} onChange={(d) => onSectionChange('articleIntro', d)} disabled={disabled} />;
      case 'servicesList':
        return <ServicesDetailListEditor data={currentData} onChange={(d) => onSectionChange('servicesList', d)} disabled={disabled} />;
      case 'gettingStarted':
        return <GettingStartedStepsEditor data={currentData} onChange={(d) => onSectionChange('gettingStarted', d)} disabled={disabled} />;
      case 'faq':
        return <FaqSectionEditor data={currentData} onChange={(d) => onSectionChange('faq', d)} disabled={disabled} />;
      case 'finalCta':
        return <AboutFinalCtaEditor data={currentData} onChange={(d) => onSectionChange('finalCta', d)} disabled={disabled} />;
      case 'sidebarForm':
      case 'sidebarInfoPanel':
        return (
          <ServicesSidebarEditor
            formData={workingSections['sidebarForm']}
            infoData={workingSections['sidebarInfoPanel']}
            onFormChange={(d) => onSectionChange('sidebarForm', d)}
            onInfoChange={(d) => onSectionChange('sidebarInfoPanel', d)}
            disabled={disabled}
          />
        );
    }
  }

  // CONTACT PAGE SECTIONS
  if (pageId === 'contact') {
    switch (activeKey) {
      case 'banner':
        return <ContactBannerEditor data={currentData} onChange={(d) => onSectionChange('banner', d)} disabled={disabled} />;
      case 'contactInfo':
        return <ContactInfoEditor data={currentData} onChange={(d) => onSectionChange('contactInfo', d)} disabled={disabled} />;
      case 'form':
        return <ContactFormEditor data={currentData} onChange={(d) => onSectionChange('form', d)} disabled={disabled} />;
    }
  }

  // Fallback generic json editor if unexpected section
  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Structured Content: {activeKey}</h3>
      <textarea
        rows={12}
        disabled={disabled}
        value={JSON.stringify(currentData, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onSectionChange(activeKey, parsed);
          } catch {}
        }}
        className="w-full p-3 font-mono text-xs bg-[#F8F7F4] border border-black/10 rounded-[10px]"
      />
    </div>
  );
}
