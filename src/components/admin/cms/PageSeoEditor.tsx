import React from 'react';
import { CmsField, CmsInput, CmsTextarea } from './CmsFormControls';

export interface PageSeoData {
  title?: string;
  description?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
}

interface PageSeoEditorProps {
  seo: PageSeoData;
  onChange: (updated: PageSeoData) => void;
  disabled?: boolean;
}

export function PageSeoEditor({ seo, onChange, disabled }: PageSeoEditorProps) {
  const handleChange = (field: keyof PageSeoData, val: any) => {
    onChange({
      ...seo,
      [field]: val,
    });
  };

  return (
    <div className="space-y-5 bg-white p-6 rounded-xl border border-black/[0.06] shadow-xs">
      <div>
        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Search Engine Optimization (SEO)</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure metadata, canonical tags, and Open Graph previews for this page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2">
        <CmsField
          label="Meta Title"
          description="Appears in browser tabs and search engine result titles (Recommended: 50-60 characters)."
        >
          <CmsInput
            disabled={disabled}
            value={seo.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g. Cleaning, Moving & Storage in Ottawa | Laurrel Services"
          />
        </CmsField>

        <CmsField
          label="Meta Description"
          description="Summary displayed below title in search results (Recommended: 120-160 characters)."
        >
          <CmsTextarea
            disabled={disabled}
            rows={2}
            value={seo.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g. Cleaning, moving and storage services in Ottawa. Explore Laurrel Services..."
          />
        </CmsField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CmsField
            label="Canonical URL"
            description="The authoritative URL for search engines."
          >
            <CmsInput
              disabled={disabled}
              value={seo.canonical || ''}
              onChange={(e) => handleChange('canonical', e.target.value)}
              placeholder="https://laurrelservices.ca/"
            />
          </CmsField>

          <CmsField
            label="Open Graph Image"
            description="Social sharing preview asset path."
          >
            <CmsInput
              disabled={disabled}
              value={seo.ogImage || ''}
              onChange={(e) => handleChange('ogImage', e.target.value)}
              placeholder="/assets/hero/laurrel-room.png"
            />
          </CmsField>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <input
            type="checkbox"
            id="seo-no-index"
            disabled={disabled}
            checked={Boolean(seo.noIndex)}
            onChange={(e) => handleChange('noIndex', e.target.checked)}
            className="w-4 h-4 text-[#49056B] rounded border-zinc-300 focus:ring-[#49056B]"
          />
          <label htmlFor="seo-no-index" className="text-xs text-zinc-700 font-medium">
            Hide this page from search engine indexes (<code className="text-zinc-500 text-[11px]">noindex, nofollow</code>)
          </label>
        </div>
      </div>
    </div>
  );
}
