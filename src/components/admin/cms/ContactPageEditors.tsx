import React from 'react';
import { CmsField, CmsInput, CmsTextarea } from './CmsFormControls';
import { CmsMediaField } from './CmsMediaField';

interface SectionProps<T> {
  data: T;
  onChange: (updated: T) => void;
  disabled?: boolean;
}

export function ContactBannerEditor({ data, onChange, disabled }: SectionProps<any>) {
  const banner = data || {};
  const update = (patch: Record<string, any>) => onChange({ ...banner, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Contact Page Banner</h3>
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
          description="High-resolution banner photograph for Contact header."
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

export function ContactInfoEditor({ data, onChange, disabled }: SectionProps<any>) {
  const info = data || {};
  const update = (patch: Record<string, any>) => onChange({ ...info, ...patch });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Public Contact Narrative</h3>
        <CmsField label="Eyebrow">
          <CmsInput
            disabled={disabled}
            value={info.eyebrow || ''}
            onChange={(e) => update({ eyebrow: e.target.value })}
          />
        </CmsField>
        <CmsField label="Headline">
          <CmsInput
            disabled={disabled}
            value={info.headline || ''}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </CmsField>
        <CmsField label="Supporting Paragraph">
          <CmsTextarea
            disabled={disabled}
            rows={3}
            value={info.supportingParagraph || ''}
            onChange={(e) => update({ supportingParagraph: e.target.value })}
          />
        </CmsField>
      </div>

      <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Location & Service Area Details</h3>
        <CmsField label="Location Heading">
          <CmsInput
            disabled={disabled}
            value={info.locationHeading || ''}
            onChange={(e) => update({ locationHeading: e.target.value })}
          />
        </CmsField>
        <CmsField label="Service Region Description">
          <CmsTextarea
            disabled={disabled}
            rows={2}
            value={info.serviceRegionDescription || ''}
            onChange={(e) => update({ serviceRegionDescription: e.target.value })}
          />
        </CmsField>

        <div className="pt-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="has-public-office"
            disabled={disabled}
            checked={Boolean(info.hasPublicOffice)}
            onChange={(e) => update({ hasPublicOffice: e.target.checked })}
            className="w-4 h-4 text-[#49056B] rounded border-zinc-300 focus:ring-[#49056B]"
          />
          <label htmlFor="has-public-office" className="text-xs text-zinc-700 font-medium">
            Laurrel has a physical walk-in office in Ottawa (Mode A: public address; Mode B: service-area business)
          </label>
        </div>

        {info.hasPublicOffice && (
          <CmsField label="Verified Office Address">
            <CmsInput
              disabled={disabled}
              value={info.officeAddress || ''}
              onChange={(e) => update({ officeAddress: e.target.value })}
              placeholder="e.g. 100 Laurier Ave, Ottawa, ON"
            />
          </CmsField>
        )}
      </div>
    </div>
  );
}

export function ContactFormEditor({ data, onChange, disabled }: SectionProps<any>) {
  const form = data || {};
  const update = (patch: Record<string, any>) => onChange({ ...form, ...patch });

  return (
    <div className="bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Public Form Content</h3>
      <p className="text-xs text-zinc-400">
        Internal form fields, validation logic, and secure dispatch API handlers remain protected and unchanged.
      </p>
      <CmsField label="Form Heading">
        <CmsInput
          disabled={disabled}
          value={form.heading || ''}
          onChange={(e) => update({ heading: e.target.value })}
        />
      </CmsField>
      <CmsField label="Submit Button Label">
        <CmsInput
          disabled={disabled}
          value={form.buttonText || ''}
          onChange={(e) => update({ buttonText: e.target.value })}
        />
      </CmsField>
    </div>
  );
}
