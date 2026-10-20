import React from 'react';
import { CmsField, CmsInput, CmsTextarea } from './CmsFormControls';

interface SectionProps<T> {
  data: T;
  onChange: (updated: T) => void;
  disabled?: boolean;
}

export function ServicesBannerEditor({ data, onChange, disabled }: SectionProps<any>) {
  const banner = data || {};
  const update = (patch: Record<string, any>) => onChange({ ...banner, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Services Page Header Banner</h3>
      <CmsField label="Page Title">
        <CmsInput
          disabled={disabled}
          value={banner.title || ''}
          onChange={(e) => update({ title: e.target.value })}
        />
      </CmsField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CmsField label="Banner Image Path">
          <CmsInput
            disabled={disabled}
            value={banner.imageSrc || ''}
            onChange={(e) => update({ imageSrc: e.target.value })}
          />
        </CmsField>
        <CmsField label="Image Alt Text">
          <CmsInput
            disabled={disabled}
            value={banner.altText || ''}
            onChange={(e) => update({ altText: e.target.value })}
          />
        </CmsField>
      </div>
    </div>
  );
}

export function ServicesArticleIntroEditor({ data, onChange, disabled }: SectionProps<any>) {
  const intro = data || {};
  const update = (patch: Record<string, any>) => onChange({ ...intro, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Services Page Article Introduction</h3>
      <CmsField label="Section H2">
        <CmsInput
          disabled={disabled}
          value={intro.h2 || ''}
          onChange={(e) => update({ h2: e.target.value })}
        />
      </CmsField>
      <CmsField label="Paragraph 1">
        <CmsTextarea
          disabled={disabled}
          rows={3}
          value={intro.paragraph1 || ''}
          onChange={(e) => update({ paragraph1: e.target.value })}
        />
      </CmsField>
      <CmsField label="Paragraph 2">
        <CmsTextarea
          disabled={disabled}
          rows={3}
          value={intro.paragraph2 || ''}
          onChange={(e) => update({ paragraph2: e.target.value })}
        />
      </CmsField>
    </div>
  );
}

export function ServicesDetailListEditor({ data, onChange, disabled }: SectionProps<any>) {
  const list = data || {};
  const services = list.services || [];
  const update = (patch: Record<string, any>) => onChange({ ...list, ...patch });

  const updateService = (index: number, patch: Record<string, any>) => {
    const updated = [...services];
    updated[index] = { ...updated[index], ...patch };
    update({ services: updated });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Dedicated Service Deep-Dives</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Detailed operational guidelines and planning information for Cleaning, Moving, and Storage.
        </p>
      </div>

      <div className="space-y-6">
        {services.map((svc: any, idx: number) => (
          <div key={svc.id || idx} className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
              <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                {svc.title || `Service ${idx + 1}`}
              </span>
              <span className="text-[11px] text-zinc-400">Anchor: #{svc.anchor}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CmsField label="Service Headline">
                <CmsInput
                  disabled={disabled}
                  value={svc.headline || ''}
                  onChange={(e) => updateService(idx, { headline: e.target.value })}
                />
              </CmsField>
              <CmsField label="Section Badge">
                <CmsInput
                  disabled={disabled}
                  value={svc.badge || ''}
                  onChange={(e) => updateService(idx, { badge: e.target.value })}
                />
              </CmsField>
            </div>

            <CmsField label="Intro Narrative (Paragraph 1)">
              <CmsTextarea
                disabled={disabled}
                rows={2}
                value={svc.paragraphs?.[0] || ''}
                onChange={(e) => {
                  const updatedP = [...(svc.paragraphs || [])];
                  updatedP[0] = e.target.value;
                  updateService(idx, { paragraphs: updatedP });
                }}
              />
            </CmsField>

            <CmsField label="Detailed Narrative (Paragraph 2)">
              <CmsTextarea
                disabled={disabled}
                rows={2}
                value={svc.paragraphs?.[1] || ''}
                onChange={(e) => {
                  const updatedP = [...(svc.paragraphs || [])];
                  updatedP[1] = e.target.value;
                  updateService(idx, { paragraphs: updatedP });
                }}
              />
            </CmsField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <CmsField label="Planning Heading">
                <CmsInput
                  disabled={disabled}
                  value={svc.planningTitle || ''}
                  onChange={(e) => updateService(idx, { planningTitle: e.target.value })}
                />
              </CmsField>
              <CmsField label="CTA Button Label">
                <CmsInput
                  disabled={disabled}
                  value={svc.ctaLabel || ''}
                  onChange={(e) => updateService(idx, { ctaLabel: e.target.value })}
                />
              </CmsField>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GettingStartedStepsEditor({ data, onChange, disabled }: SectionProps<any>) {
  const gs = data || {};
  const steps = gs.steps || [];
  const update = (patch: Record<string, any>) => onChange({ ...gs, ...patch });

  const updateStep = (index: number, patch: Record<string, any>) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], ...patch };
    update({ steps: updated });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">How To Get Started Steps</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CmsField label="Eyebrow">
          <CmsInput
            disabled={disabled}
            value={gs.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </CmsField>
        <CmsField label="Headline">
          <CmsInput
            disabled={disabled}
            value={gs.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="space-y-3 pt-2">
        {steps.map((st: any, idx: number) => (
          <div key={idx} className="p-3.5 bg-zinc-50/70 rounded-lg border border-black/[0.04] space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-800">Step {st.number || idx + 1}</span>
            </div>
            <CmsField label="Title">
              <CmsInput
                disabled={disabled}
                value={st.title || ''}
                onChange={(e) => updateStep(idx, { title: e.target.value })}
              />
            </CmsField>
            <CmsField label="Description">
              <CmsTextarea
                disabled={disabled}
                rows={2}
                value={st.description || ''}
                onChange={(e) => updateStep(idx, { description: e.target.value })}
              />
            </CmsField>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServicesSidebarEditor({
  formData,
  infoData,
  onFormChange,
  onInfoChange,
  disabled,
}: {
  formData: any;
  infoData: any;
  onFormChange: (updated: any) => void;
  onInfoChange: (updated: any) => void;
  disabled?: boolean;
}) {
  const form = formData || {};
  const info = infoData || {};

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Sidebar Enquiry Form Text</h3>
        <CmsField label="Form Heading">
          <CmsInput
            disabled={disabled}
            value={form.heading || ''}
            onChange={(e) => onFormChange({ ...form, heading: e.target.value })}
          />
        </CmsField>
        <CmsField label="Supporting Subtitle">
          <CmsTextarea
            disabled={disabled}
            rows={2}
            value={form.supportingText || ''}
            onChange={(e) => onFormChange({ ...form, supportingText: e.target.value })}
          />
        </CmsField>
        <CmsField label="Submit Button Label">
          <CmsInput
            disabled={disabled}
            value={form.submitButtonText || ''}
            onChange={(e) => onFormChange({ ...form, submitButtonText: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Sidebar Secondary Info Panel</h3>
        <CmsField label="Panel Heading">
          <CmsInput
            disabled={disabled}
            value={info.heading || ''}
            onChange={(e) => onInfoChange({ ...info, heading: e.target.value })}
          />
        </CmsField>
        <CmsField label="Panel Body">
          <CmsTextarea
            disabled={disabled}
            rows={2}
            value={info.body || ''}
            onChange={(e) => onInfoChange({ ...info, body: e.target.value })}
          />
        </CmsField>
        <CmsField label="Action Link Text">
          <CmsInput
            disabled={disabled}
            value={info.ctaText || ''}
            onChange={(e) => onInfoChange({ ...info, ctaText: e.target.value })}
          />
        </CmsField>
      </div>
    </div>
  );
}
