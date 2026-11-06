import React from 'react';
import { CmsField, CmsInput, CmsTextarea } from './CmsFormControls';
import { Plus, Trash2 } from 'lucide-react';
import { CmsMediaField } from './CmsMediaField';

interface SectionEditorProps<T> {
  data: T;
  onChange: (updated: T) => void;
  disabled?: boolean;
}

// ============================================================================
// 1. HERO SECTION EDITOR
// ============================================================================
export function HeroSectionEditor({ data, onChange, disabled }: SectionEditorProps<any>) {
  const hero = data || {};
  const headline = hero.headline || {};
  const primaryCta = hero.primaryCta || {};
  const secondaryCta = hero.secondaryCta || {};
  const supportCard = hero.supportCard || {};
  const media = hero.media || {};

  const defaultSlides = [
    {
      id: 'hero-slide-cleaning',
      serviceKey: 'cleaning',
      serviceLabel: 'Cleaning',
      imageSrc: '/assets/images/laurrel-cleaning-slide.webp',
      altText: 'Cleaner wiping a countertop in a bright residential interior.',
      order: 1,
      objectPosition: 'center center',
    },
    {
      id: 'hero-slide-moving',
      serviceKey: 'moving',
      serviceLabel: 'Moving',
      imageSrc: '/assets/images/laurrel-moving-slide.webp',
      altText: 'Movers carrying wrapped household furniture towards a moving truck.',
      order: 2,
      objectPosition: 'center center',
    },
    {
      id: 'hero-slide-storage',
      serviceKey: 'storage',
      serviceLabel: 'Storage Solutions',
      imageSrc: '/assets/images/laurrel-storage-solutions-slide.webp',
      altText: 'Packed boxes and protected household belongings arranged for storage.',
      order: 3,
      objectPosition: 'center center',
    },
  ];

  const slides = Array.isArray(media.slides) && media.slides.length > 0
    ? media.slides
    : defaultSlides;

  const update = (patch: Record<string, any>) => {
    onChange({ ...hero, ...patch });
  };

  const updateSlide = (index: number, patch: Record<string, any>) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], ...patch };
    const syncImageSrc = index === 0 && patch.imageSrc ? patch.imageSrc : media.imageSrc || updated[0]?.imageSrc;
    const syncAltText = index === 0 && patch.altText ? patch.altText : media.altText || updated[0]?.altText;
    update({
      media: {
        ...media,
        imageSrc: syncImageSrc,
        altText: syncAltText,
        slides: updated,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Hero Eyebrow & Headlines</h3>
        <CmsField label="Hero Eyebrow" description="Subtle uppercase category line above main heading.">
          <CmsInput
            disabled={disabled}
            value={hero.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
            placeholder="CLEANING · MOVING · STORAGE SOLUTIONS IN OTTAWA"
          />
        </CmsField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CmsField label="Headline Line 1">
            <CmsInput
              id="hero-headline-line1"
              disabled={disabled}
              value={headline.line1 || ''}
              onChange={(e) => update({ headline: { ...headline, line1: e.target.value } })}
              placeholder="One team."
            />
          </CmsField>
          <CmsField label="Headline Line 2">
            <CmsInput
              disabled={disabled}
              value={headline.line2 || ''}
              onChange={(e) => update({ headline: { ...headline, line2: e.target.value } })}
              placeholder="Three solutions."
            />
          </CmsField>
          <CmsField label="Headline Line 3 (Optional)">
            <CmsInput
              disabled={disabled}
              value={headline.line3 || ''}
              onChange={(e) => update({ headline: { ...headline, line3: e.target.value } })}
              placeholder="Leave empty or enter line 3"
            />
          </CmsField>
        </div>

        <CmsField label="Introductory Paragraph" description="Main narrative text introducing Laurrel Services.">
          <CmsTextarea
            disabled={disabled}
            rows={3}
            value={hero.body || ''}
            onChange={(e) => update({ body: e.target.value })}
            placeholder="From cleaning homes and workspaces to moving furniture and finding storage options..."
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Call-to-Action Buttons</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-zinc-50/70 rounded-lg border border-black/[0.04] space-y-2">
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider block">Primary CTA</span>
            <CmsField label="Button Label">
              <CmsInput
                disabled={disabled}
                value={primaryCta.label || ''}
                onChange={(e) => update({ primaryCta: { ...primaryCta, label: e.target.value } })}
                placeholder="Request a Quote"
              />
            </CmsField>
            <CmsField label="Link Destination">
              <CmsInput
                disabled={disabled}
                value={primaryCta.href || ''}
                onChange={(e) => update({ primaryCta: { ...primaryCta, href: e.target.value } })}
                placeholder="#quote"
              />
            </CmsField>
          </div>

          <div className="p-3.5 bg-zinc-50/70 rounded-lg border border-black/[0.04] space-y-2">
            <span className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider block">Secondary CTA</span>
            <CmsField label="Button Label">
              <CmsInput
                disabled={disabled}
                value={secondaryCta.label || ''}
                onChange={(e) => update({ secondaryCta: { ...secondaryCta, label: e.target.value } })}
                placeholder="Explore Services"
              />
            </CmsField>
            <CmsField label="Link Destination">
              <CmsInput
                disabled={disabled}
                value={secondaryCta.href || ''}
                onChange={(e) => update({ secondaryCta: { ...secondaryCta, href: e.target.value } })}
                placeholder="#services"
              />
            </CmsField>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Support Floating Card</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CmsField label="Card Heading">
            <CmsInput
              disabled={disabled}
              value={supportCard.heading || ''}
              onChange={(e) => update({ supportCard: { ...supportCard, heading: e.target.value } })}
              placeholder="Need help planning your service?"
            />
          </CmsField>
          <CmsField label="Card Body">
            <CmsInput
              disabled={disabled}
              value={supportCard.body || ''}
              onChange={(e) => update({ supportCard: { ...supportCard, body: e.target.value } })}
              placeholder="Tell us what you need and your preferred date to get started."
            />
          </CmsField>
          <CmsField label="Action Text">
            <CmsInput
              disabled={disabled}
              value={supportCard.actionText || ''}
              onChange={(e) => update({ supportCard: { ...supportCard, actionText: e.target.value } })}
              placeholder="Get in Touch"
            />
          </CmsField>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-5">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
            Hero Photography & Multi-Service Slider (Cleaning · Moving · Storage Solutions)
          </h3>
          <p className="text-xs text-zinc-500">
            Manage the three client-approved photography slides (Cleaning, Moving, Storage Solutions) displayed in the smooth hero crossfade rotator, plus fallback imagery.
          </p>
        </div>

        {/* The 3 Slides: Cleaning, Moving, Storage Solutions */}
        <div className="space-y-5 pt-2">
          {slides.map((slide: any, idx: number) => (
            <div key={slide.id || idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-black/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FE6000]" />
                  <span className="text-xs font-bold text-zinc-900 tracking-tight">
                    Slide {idx + 1}: {slide.serviceLabel || slide.serviceKey}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 font-mono">Order:</span>
                  <input
                    type="number"
                    disabled={disabled}
                    min={1}
                    max={10}
                    value={slide.order || idx + 1}
                    onChange={(e) => updateSlide(idx, { order: parseInt(e.target.value, 10) || idx + 1 })}
                    className="w-12 h-6 px-1.5 text-xs text-center border border-zinc-200 rounded bg-white text-zinc-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CmsField label="Service Display Label">
                  <CmsInput
                    disabled={disabled}
                    value={slide.serviceLabel || ''}
                    onChange={(e) => updateSlide(idx, { serviceLabel: e.target.value })}
                    placeholder="e.g. Cleaning"
                  />
                </CmsField>
                <CmsField label="Object Position / Focal Point">
                  <CmsInput
                    disabled={disabled}
                    value={slide.objectPosition || 'center center'}
                    onChange={(e) => updateSlide(idx, { objectPosition: e.target.value })}
                    placeholder="center center"
                  />
                </CmsField>
              </div>

              <CmsMediaField
                label={`${slide.serviceLabel || 'Service'} Slide Photograph`}
                description="Client-approved WebP or high-resolution marketing concept image."
                value={slide.imageSrc || ''}
                altText={slide.altText || ''}
                assetId={slide.assetId || ''}
                focalPoint={slide.objectPosition || 'center center'}
                allowedType="image"
                disabled={disabled}
                onChange={(patch) =>
                  updateSlide(idx, {
                    imageSrc: patch.src !== undefined ? patch.src : slide.imageSrc,
                    altText: patch.altText !== undefined ? patch.altText : slide.altText,
                    assetId: patch.assetId !== undefined ? patch.assetId : slide.assetId,
                    objectPosition: patch.focalPoint !== undefined ? patch.focalPoint : slide.objectPosition,
                  })
                }
              />
            </div>
          ))}
        </div>

        {/* Fallback Single Image Configuration for Backward Compatibility */}
        <div className="pt-4 border-t border-black/[0.04] space-y-2">
          <span className="text-xs font-semibold text-zinc-700 block">
            Legacy Single Image / OpenGraph Fallback Reference
          </span>
          <p className="text-[11px] text-zinc-400">
            Synchronized automatically with Slide 1 for clients or channels requiring a single static image reference.
          </p>
          <CmsMediaField
            label="Hero Static Fallback Image"
            value={media.imageSrc || slides[0]?.imageSrc || ''}
            altText={media.altText || slides[0]?.altText || ''}
            assetId={media.assetId || slides[0]?.assetId || ''}
            focalPoint={media.objectPosition || 'center center'}
            allowedType="image"
            disabled={disabled}
            onChange={(patch) =>
              update({
                media: {
                  ...media,
                  imageSrc: patch.src !== undefined ? patch.src : media.imageSrc,
                  altText: patch.altText !== undefined ? patch.altText : media.altText,
                  assetId: patch.assetId !== undefined ? patch.assetId : media.assetId,
                  objectPosition: patch.focalPoint !== undefined ? patch.focalPoint : media.objectPosition,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 2. HOMEPAGE ABOUT SECTION EDITOR
// ============================================================================
export function HomeAboutEditor({ data, onChange, disabled }: SectionEditorProps<any>) {
  const about = data || {};
  const stat = about.stat || {};
  const services = about.services || [];
  const cta = about.cta || {};
  const media = about.media || {};

  const update = (patch: Record<string, any>) => onChange({ ...about, ...patch });

  const updateService = (index: number, patch: Record<string, any>) => {
    const updated = [...services];
    updated[index] = { ...updated[index], ...patch };
    update({ services: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">About Teaser Section Copy</h3>
        <CmsField label="Eyebrow Text">
          <CmsInput
            disabled={disabled}
            value={about.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
            placeholder="ABOUT LAURREL SERVICES"
          />
        </CmsField>

        <CmsField label="Main Headline">
          <CmsInput
            disabled={disabled}
            value={about.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
            placeholder="A cleaner space. A smoother move. Storage options when you need them."
          />
        </CmsField>

        <CmsField label="Introductory Paragraph">
          <CmsTextarea
            disabled={disabled}
            rows={3}
            value={about.introParagraph || ''}
            onChange={(e) => update({ introParagraph: e.target.value })}
            placeholder="Whether you're preparing a property, relocating furniture or looking for somewhere to keep your belongings..."
          />
        </CmsField>

        <CmsField label="Right-Hand Services Heading">
          <CmsInput
            disabled={disabled}
            value={about.rightHeading || ''}
            onChange={(e) => update({ rightHeading: e.target.value })}
            placeholder="Choose the service you need."
          />
        </CmsField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <CmsField label="Statistic Number">
            <CmsInput
              disabled={disabled}
              value={stat.number || ''}
              onChange={(e) => update({ stat: { ...stat, number: e.target.value } })}
              placeholder="03"
            />
          </CmsField>
          <CmsField label="Statistic Caption">
            <CmsInput
              disabled={disabled}
              value={stat.caption || ''}
              onChange={(e) => update({ stat: { ...stat, caption: e.target.value } })}
              placeholder="CORE SERVICES"
            />
          </CmsField>
        </div>

        <div className="pt-3 border-t border-black/[0.04]">
          <CmsMediaField
            label="About Section Featured Photograph"
            description="Photograph displayed alongside the core services narrative."
            value={media.imageSrc || ''}
            altText={media.altText || ''}
            assetId={media.assetId || ''}
            allowedType="image"
            disabled={disabled}
            onChange={(patch) =>
              update({
                media: {
                  ...media,
                  imageSrc: patch.src !== undefined ? patch.src : media.imageSrc,
                  altText: patch.altText !== undefined ? patch.altText : media.altText,
                  assetId: patch.assetId !== undefined ? patch.assetId : media.assetId,
                },
              })
            }
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Core Services Descriptions</h3>
        <div className="space-y-3">
          {services.map((svc: any, idx: number) => (
            <div key={idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-2">
              <CmsField label={`Service ${idx + 1} Title`}>
                <CmsInput
                  disabled={disabled}
                  value={svc.title || ''}
                  onChange={(e) => updateService(idx, { title: e.target.value })}
                />
              </CmsField>
              <CmsField label="Service Narrative">
                <CmsTextarea
                  disabled={disabled}
                  rows={2}
                  value={svc.description || ''}
                  onChange={(e) => updateService(idx, { description: e.target.value })}
                />
              </CmsField>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. SERVICES HIGHLIGHT EDITOR
// ============================================================================
export function ServicesHighlightEditor({ data, onChange, disabled }: SectionEditorProps<any>) {
  const highlight = data || {};
  const services = highlight.services || [];
  const update = (patch: Record<string, any>) => onChange({ ...highlight, ...patch });

  const updateService = (index: number, patch: Record<string, any>) => {
    const updated = [...services];
    updated[index] = { ...updated[index], ...patch };
    update({ services: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Services Overview Grid</h3>
        <CmsField label="Section Eyebrow">
          <CmsInput
            disabled={disabled}
            value={highlight.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </CmsField>
        <CmsField label="Section Headline">
          <CmsInput
            disabled={disabled}
            value={highlight.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Service Cards</h3>
        <div className="space-y-4">
          {services.map((svc: any, idx: number) => (
            <div key={svc.id || idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CmsField label="Title">
                  <CmsInput
                    disabled={disabled}
                    value={svc.title || ''}
                    onChange={(e) => updateService(idx, { title: e.target.value })}
                  />
                </CmsField>
                <CmsField label="Anchor Link">
                  <CmsInput
                    disabled={disabled}
                    value={svc.anchor || ''}
                    onChange={(e) => updateService(idx, { anchor: e.target.value })}
                  />
                </CmsField>
              </div>
              <CmsField label="Card Summary Description">
                <CmsTextarea
                  disabled={disabled}
                  rows={2}
                  value={svc.description || ''}
                  onChange={(e) => updateService(idx, { description: e.target.value })}
                />
              </CmsField>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. OVERLAPPING PLANS SECTION EDITOR
// ============================================================================
export function OverlappingPlansEditor({ data, onChange, disabled }: SectionEditorProps<any>) {
  const config = data || {};
  const situations = config.situations || [];
  const update = (patch: Record<string, any>) => onChange({ ...config, ...patch });

  const updateSituation = (index: number, patch: Record<string, any>) => {
    const updated = [...situations];
    updated[index] = { ...updated[index], ...patch };
    update({ situations: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">When Plans Overlap Heading</h3>
        <CmsField label="Eyebrow">
          <CmsInput
            disabled={disabled}
            value={config.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </CmsField>
        <CmsField label="Headline">
          <CmsInput
            disabled={disabled}
            value={config.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </CmsField>
        <CmsField label="Introductory Text">
          <CmsTextarea
            disabled={disabled}
            rows={3}
            value={config.intro || ''}
            onChange={(e) => update({ intro: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Situations & Service Combinations</h3>
        <div className="space-y-4">
          {situations.map((sit: any, idx: number) => (
            <div key={sit.id || idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CmsField label="Situation Title">
                  <CmsInput
                    disabled={disabled}
                    value={sit.title || ''}
                    onChange={(e) => updateSituation(idx, { title: e.target.value })}
                  />
                </CmsField>
                <CmsField label="Related Services Text">
                  <CmsInput
                    disabled={disabled}
                    value={sit.relatedServicesText || ''}
                    onChange={(e) => updateSituation(idx, { relatedServicesText: e.target.value })}
                  />
                </CmsField>
              </div>
              <CmsField label="Summary">
                <CmsTextarea
                  disabled={disabled}
                  rows={2}
                  value={sit.description || ''}
                  onChange={(e) => updateSituation(idx, { description: e.target.value })}
                />
              </CmsField>

              <div className="pt-2 border-t border-black/[0.04]">
                <CmsMediaField
                  label="Scenario Illustrative Photograph"
                  value={sit.imageSrc || ''}
                  altText={sit.imageAlt || ''}
                  assetId={sit.assetId || ''}
                  allowedType="image"
                  disabled={disabled}
                  onChange={(patch) =>
                    updateSituation(idx, {
                      imageSrc: patch.src !== undefined ? patch.src : sit.imageSrc,
                      imageAlt: patch.altText !== undefined ? patch.altText : sit.imageAlt,
                      assetId: patch.assetId !== undefined ? patch.assetId : sit.assetId,
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. FAQ SECTION EDITOR
// ============================================================================
export function FaqSectionEditor({ data, onChange, disabled }: SectionEditorProps<any>) {
  const faq = data || {};
  const items = faq.items || [];
  const update = (patch: Record<string, any>) => onChange({ ...faq, ...patch });

  const updateItem = (index: number, patch: Record<string, any>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    update({ items: updated });
  };

  const addItem = () => {
    update({
      items: [
        ...items,
        { question: 'New Question', answer: 'Answer detailing service logistics in Ottawa.' },
      ],
    });
  };

  const removeItem = (index: number) => {
    update({ items: items.filter((_: any, i: number) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">FAQ Section Headings</h3>
        <CmsField label="Eyebrow">
          <CmsInput
            disabled={disabled}
            value={faq.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </CmsField>
        <CmsField label="Headline">
          <CmsInput
            disabled={disabled}
            value={faq.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Frequently Asked Questions ({items.length})</h3>
          {!disabled && (
            <button
              onClick={addItem}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#49056B] text-white hover:bg-[#5B0785] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add FAQ</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-800">Q{idx + 1}</span>
                {!disabled && (
                  <button
                    onClick={() => removeItem(idx)}
                    type="button"
                    className="p-1 text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <CmsField label="Question">
                <CmsInput
                  disabled={disabled}
                  value={item.question || ''}
                  onChange={(e) => updateItem(idx, { question: e.target.value })}
                />
              </CmsField>
              <CmsField label="Answer">
                <CmsTextarea
                  disabled={disabled}
                  rows={2}
                  value={item.answer || ''}
                  onChange={(e) => updateItem(idx, { answer: e.target.value })}
                />
              </CmsField>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 6. REQUEST QUOTE SECTION EDITOR
// ============================================================================
export function RequestQuoteSectionEditor({ data, onChange, disabled }: SectionEditorProps<any>) {
  const quote = data || {};
  const primaryCta = quote.primaryCta || {};
  const secondaryLink = quote.secondaryLink || {};
  const update = (patch: Record<string, any>) => onChange({ ...quote, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Quote Callout Banner</h3>
      <CmsField label="Eyebrow">
        <CmsInput
          disabled={disabled}
          value={quote.eyebrow || ''}
          onChange={(e) => update({ eyebrow: e.target.value })}
        />
      </CmsField>
      <CmsField label="Headline">
        <CmsInput
          disabled={disabled}
          value={quote.headline || ''}
          onChange={(e) => update({ headline: e.target.value })}
        />
      </CmsField>
      <CmsField label="Body Copy">
        <CmsTextarea
          disabled={disabled}
          rows={3}
          value={quote.body || ''}
          onChange={(e) => update({ body: e.target.value })}
        />
      </CmsField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <CmsField label="CTA Button Label">
          <CmsInput
            disabled={disabled}
            value={primaryCta.label || ''}
            onChange={(e) => update({ primaryCta: { ...primaryCta, label: e.target.value } })}
          />
        </CmsField>
        <CmsField label="Secondary Link Label">
          <CmsInput
            disabled={disabled}
            value={secondaryLink.label || ''}
            onChange={(e) => update({ secondaryLink: { ...secondaryLink, label: e.target.value } })}
          />
        </CmsField>
      </div>
    </div>
  );
}

// ============================================================================
// 7. CONTACT TEASER SECTION EDITOR
// ============================================================================
export function ContactTeaserEditor({ data, onChange, disabled }: SectionEditorProps<any>) {
  const contact = data || {};
  const primaryCta = contact.primaryCta || {};
  const update = (patch: Record<string, any>) => onChange({ ...contact, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Homepage Contact Teaser</h3>
      <CmsField label="Eyebrow">
        <CmsInput
          disabled={disabled}
          value={contact.eyebrow || ''}
          onChange={(e) => update({ eyebrow: e.target.value })}
        />
      </CmsField>
      <CmsField label="Headline">
        <CmsInput
          disabled={disabled}
          value={contact.headline || ''}
          onChange={(e) => update({ headline: e.target.value })}
        />
      </CmsField>
      <CmsField label="Paragraph">
        <CmsTextarea
          disabled={disabled}
          rows={3}
          value={contact.paragraph || ''}
          onChange={(e) => update({ paragraph: e.target.value })}
        />
      </CmsField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <CmsField label="CTA Label">
          <CmsInput
            disabled={disabled}
            value={primaryCta.label || ''}
            onChange={(e) => update({ primaryCta: { ...primaryCta, label: e.target.value } })}
          />
        </CmsField>
        <CmsField label="CTA Destination">
          <CmsInput
            disabled={disabled}
            value={primaryCta.href || ''}
            onChange={(e) => update({ primaryCta: { ...primaryCta, href: e.target.value } })}
          />
        </CmsField>
      </div>
    </div>
  );
}
