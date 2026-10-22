import React from 'react';
import { CmsField, CmsInput, CmsTextarea } from './CmsFormControls';
import { CmsMediaField } from './CmsMediaField';

interface SectionProps<T> {
  data: T;
  onChange: (updated: T) => void;
  disabled?: boolean;
}

export function AboutBannerEditor({ data, onChange, disabled }: SectionProps<any>) {
  const banner = data || {};
  const update = (patch: Record<string, any>) => onChange({ ...banner, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">About Page Hero Banner</h3>
      <CmsField label="Page Title">
        <CmsInput
          disabled={disabled}
          value={banner.title || ''}
          onChange={(e) => update({ title: e.target.value })}
        />
      </CmsField>
      <div className="pt-2">
        <CmsMediaField
          label="Banner Photograph"
          description="High-resolution banner photograph for About Us header."
          value={banner.imageSrc || ''}
          altText={banner.altText || ''}
          assetId={banner.assetId || ''}
          allowedType="image"
          disabled={disabled}
          onChange={(patch) =>
            update({
              imageSrc: patch.src !== undefined ? patch.src : banner.imageSrc,
              altText: patch.altText !== undefined ? patch.altText : banner.altText,
              assetId: patch.assetId !== undefined ? patch.assetId : banner.assetId,
            })
          }
        />
      </div>
    </div>
  );
}

export function AboutCompanyStoryEditor({ data, onChange, disabled }: SectionProps<any>) {
  const story = data || {};
  const cta = story.cta || {};
  const update = (patch: Record<string, any>) => onChange({ ...story, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">About Our Company Section</h3>
      <CmsField label="Eyebrow">
        <CmsInput
          disabled={disabled}
          value={story.eyebrow || ''}
          onChange={(e) => update({ eyebrow: e.target.value })}
        />
      </CmsField>
      <CmsField label="Headline">
        <CmsInput
          disabled={disabled}
          value={story.headline || ''}
          onChange={(e) => update({ headline: e.target.value })}
        />
      </CmsField>
      <CmsField label="Paragraph 1">
        <CmsTextarea
          disabled={disabled}
          rows={3}
          value={story.paragraph1 || ''}
          onChange={(e) => update({ paragraph1: e.target.value })}
        />
      </CmsField>
      <CmsField label="Paragraph 2">
        <CmsTextarea
          disabled={disabled}
          rows={3}
          value={story.paragraph2 || ''}
          onChange={(e) => update({ paragraph2: e.target.value })}
        />
      </CmsField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <CmsField label="CTA Label">
          <CmsInput
            disabled={disabled}
            value={cta.label || ''}
            onChange={(e) => update({ cta: { ...cta, label: e.target.value } })}
          />
        </CmsField>
        <CmsField label="CTA Link">
          <CmsInput
            disabled={disabled}
            value={cta.href || ''}
            onChange={(e) => update({ cta: { ...cta, href: e.target.value } })}
          />
        </CmsField>
      </div>
    </div>
  );
}

export function AboutWhatWeDoEditor({ data, onChange, disabled }: SectionProps<any>) {
  const whatWeDo = data || {};
  const columns = whatWeDo.columns || [];
  const update = (patch: Record<string, any>) => onChange({ ...whatWeDo, ...patch });

  const updateColumn = (index: number, patch: Record<string, any>) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], ...patch };
    update({ columns: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">What We Do Introduction</h3>
        <CmsField label="Eyebrow">
          <CmsInput
            disabled={disabled}
            value={whatWeDo.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </CmsField>
        <CmsField label="Headline">
          <CmsInput
            disabled={disabled}
            value={whatWeDo.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </CmsField>
        <CmsField label="Introductory Text">
          <CmsTextarea
            disabled={disabled}
            rows={3}
            value={whatWeDo.intro || ''}
            onChange={(e) => update({ intro: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Core Service Columns</h3>
        <div className="space-y-3">
          {columns.map((col: any, idx: number) => (
            <div key={idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CmsField label="Category Label">
                  <CmsInput
                    disabled={disabled}
                    value={col.category || ''}
                    onChange={(e) => updateColumn(idx, { category: e.target.value })}
                  />
                </CmsField>
                <CmsField label="Display Word">
                  <CmsInput
                    disabled={disabled}
                    value={col.displayWord || ''}
                    onChange={(e) => updateColumn(idx, { displayWord: e.target.value })}
                  />
                </CmsField>
              </div>
              <CmsField label="Description">
                <CmsTextarea
                  disabled={disabled}
                  rows={2}
                  value={col.description || ''}
                  onChange={(e) => updateColumn(idx, { description: e.target.value })}
                />
              </CmsField>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutWhyLaurrelEditor({ data, onChange, disabled }: SectionProps<any>) {
  const why = data || {};
  const items = why.items || [];
  const update = (patch: Record<string, any>) => onChange({ ...why, ...patch });

  const updateItem = (index: number, patch: Record<string, any>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    update({ items: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Why Laurrel Services Section</h3>
        <CmsField label="Eyebrow">
          <CmsInput
            disabled={disabled}
            value={why.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </CmsField>
        <CmsField label="Headline">
          <CmsInput
            disabled={disabled}
            value={why.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </CmsField>
        <CmsField label="Introductory Text">
          <CmsTextarea
            disabled={disabled}
            rows={2}
            value={why.intro || ''}
            onChange={(e) => update({ intro: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Brand Pillars & Value Items</h3>
        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div key={item.id || idx} className="p-4 bg-zinc-50/70 rounded-xl border border-black/[0.04] space-y-2">
              <CmsField label={`Pillar ${idx + 1} Title`}>
                <CmsInput
                  disabled={disabled}
                  value={item.title || ''}
                  onChange={(e) => updateItem(idx, { title: e.target.value })}
                />
              </CmsField>
              <CmsField label="Description">
                <CmsTextarea
                  disabled={disabled}
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                />
              </CmsField>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AboutFinalCtaEditor({ data, onChange, disabled }: SectionProps<any>) {
  const cta = data || {};
  const update = (patch: Record<string, any>) => onChange({ ...cta, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Final Closing Callout</h3>
      <CmsField label="Headline">
        <CmsInput
          disabled={disabled}
          value={cta.headline || ''}
          onChange={(e) => update({ headline: e.target.value })}
        />
      </CmsField>
      <CmsField label="Body Copy">
        <CmsTextarea
          disabled={disabled}
          rows={2}
          value={cta.body || ''}
          onChange={(e) => update({ body: e.target.value })}
        />
      </CmsField>
      <CmsField label="Button Label">
        <CmsInput
          disabled={disabled}
          value={cta.ctaLabel || ''}
          onChange={(e) => update({ ctaLabel: e.target.value })}
        />
      </CmsField>
    </div>
  );
}
