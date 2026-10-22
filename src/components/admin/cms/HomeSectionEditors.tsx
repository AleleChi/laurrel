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
  const videos = media.videos || [];

  const update = (patch: Record<string, any>) => {
    onChange({ ...hero, ...patch });
  };

  const updateVideo = (index: number, patch: Record<string, any>) => {
    const updated = [...videos];
    updated[index] = { ...updated[index], ...patch };
    update({ media: { ...media, videos: updated } });
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
            placeholder="CLEANING · MOVING · STORAGE IN OTTAWA"
          />
        </CmsField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CmsField label="Headline Line 1">
            <CmsInput
              id="hero-headline-line1"
              disabled={disabled}
              value={headline.line1 || ''}
              onChange={(e) => update({ headline: { ...headline, line1: e.target.value } })}
              placeholder="Clean spaces."
            />
          </CmsField>
          <CmsField label="Headline Line 2">
            <CmsInput
              disabled={disabled}
              value={headline.line2 || ''}
              onChange={(e) => update({ headline: { ...headline, line2: e.target.value } })}
              placeholder="Smooth moves."
            />
          </CmsField>
          <CmsField label="Headline Line 3">
            <CmsInput
              disabled={disabled}
              value={headline.line3 || ''}
              onChange={(e) => update({ headline: { ...headline, line3: e.target.value } })}
              placeholder="Secure storage."
            />
          </CmsField>
        </div>

        <CmsField label="Introductory Paragraph" description="Main narrative text introducing Laurrel Services.">
          <CmsTextarea
            disabled={disabled}
            rows={3}
            value={hero.body || ''}
            onChange={(e) => update({ body: e.target.value })}
            placeholder="Whether you’re preparing a property, moving to a new address..."
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
              placeholder="Tell us what you need..."
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
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Hero Media & 3-Video Rotator References</h3>
        <p className="text-xs text-zinc-400">
          The three-service rotation (Cleaning, Moving, Storage) runs continuously on the live website. Manage video streams, poster frames, and fallback imagery.
        </p>

        {/* Fallback Photograph */}
        <div className="pt-2">
          <CmsMediaField
            label="Hero Fallback / Social Share Photograph"
            description="Displayed when video playback is not active or during reduced-motion preferences."
            value={media.imageSrc || ''}
            altText={media.altText || ''}
            assetId={media.assetId || ''}
            focalPoint={media.objectPosition || 'center 60%'}
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

        <div className="space-y-4 pt-3 border-t border-black/[0.04]">
          <h4 className="text-xs font-bold text-zinc-800 tracking-tight">Rotating Service Videos (Dual-Slot Architecture)</h4>
          {videos.map((vid: any, idx: number) => (
            <div key={vid.id || idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 tracking-tight">
                  Video {idx + 1}: {vid.service} Service
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">order: {vid.order}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CmsMediaField
                  label={`Video Stream (${vid.service})`}
                  description="MP4 or WebM video file"
                  value={vid.src || ''}
                  assetId={vid.assetId || ''}
                  allowedType="video"
                  disabled={disabled}
                  onChange={(patch) =>
                    updateVideo(idx, {
                      src: patch.src !== undefined ? patch.src : vid.src,
                      assetId: patch.assetId !== undefined ? patch.assetId : vid.assetId,
                    })
                  }
                />
                <CmsMediaField
                  label={`Poster Frame (${vid.service})`}
                  description="Instant initial frame"
                  value={vid.poster || ''}
                  assetId={vid.posterAssetId || ''}
                  focalPoint={vid.objectPosition || 'center 45%'}
                  allowedType="image"
                  disabled={disabled}
                  onChange={(patch) =>
                    updateVideo(idx, {
                      poster: patch.src !== undefined ? patch.src : vid.poster,
                      posterAssetId: patch.assetId !== undefined ? patch.assetId : vid.posterAssetId,
                      objectPosition: patch.focalPoint !== undefined ? patch.focalPoint : vid.objectPosition,
                    })
                  }
                />
              </div>

              <CmsField label="Accessible Video Description">
                <CmsInput
                  disabled={disabled}
                  value={vid.description || ''}
                  onChange={(e) => updateVideo(idx, { description: e.target.value })}
                  placeholder="Laurrel Services professional inspecting residential space..."
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
            placeholder="The details matter before the work begins."
          />
        </CmsField>

        <CmsField label="Introductory Paragraph">
          <CmsTextarea
            disabled={disabled}
            rows={3}
            value={about.introParagraph || ''}
            onChange={(e) => update({ introParagraph: e.target.value })}
            placeholder="Cleaning a property, moving belongings and arranging storage..."
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
