'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Film, UploadCloud, X, Check, Eye } from 'lucide-react';
import { MediaPickerModal } from '../media/MediaPickerModal';
import { MediaAsset } from '../media/types';

interface CmsMediaFieldProps {
  label: string;
  description?: string;
  value?: string; // imageSrc or video src
  altText?: string;
  assetId?: string;
  focalPoint?: string;
  allowedType?: 'image' | 'video' | 'all';
  disabled?: boolean;
  onChange: (patch: {
    src?: string;
    altText?: string;
    assetId?: string;
    focalPoint?: string;
  }) => void;
}

export function CmsMediaField({
  label,
  description,
  value = '',
  altText = '',
  assetId = '',
  focalPoint = 'center',
  allowedType = 'image',
  disabled = false,
  onChange,
}: CmsMediaFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isVideo = allowedType === 'video' || (value && (value.endsWith('.mp4') || value.endsWith('.webm')));

  const handleSelectAsset = (asset: MediaAsset) => {
    onChange({
      src: asset.publicUrl,
      altText: asset.altText || altText,
      assetId: asset.id,
      focalPoint: asset.focalPoint || focalPoint,
    });
  };

  const handleClear = () => {
    onChange({
      src: '',
      assetId: '',
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-semibold text-zinc-900 tracking-tight">{label}</label>
        {assetId && (
          <span className="text-[10px] text-zinc-400 font-mono" title={`Linked Asset: ${assetId}`}>
            Library Asset Linked
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-zinc-400">{description}</p>}

      {/* Main Container */}
      <div className="p-3 bg-white rounded-xl border border-black/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Thumbnail Preview */}
        <div className="w-full sm:w-24 h-20 rounded-lg bg-zinc-950 overflow-hidden relative border border-black/10 shrink-0 flex items-center justify-center">
          {value ? (
            isVideo ? (
              <div className="w-full h-full relative flex items-center justify-center">
                <video src={value} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Film className="w-5 h-5 text-white/90" />
                </div>
              </div>
            ) : (
              <img
                src={value}
                alt={altText || 'Media preview'}
                className="w-full h-full object-cover"
                style={{ objectPosition: focalPoint }}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400">
              {isVideo ? <Film className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
              <span className="text-[9px] mt-0.5">No Media</span>
            </div>
          )}
        </div>

        {/* Path, Meta & Picker Trigger */}
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange({ src: e.target.value })}
              disabled={disabled}
              placeholder={isVideo ? '/assets/videos/clean.mp4' : '/assets/hero/laurrel-room.png'}
              className="flex-1 px-3 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled}
                className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                title="Clear Media Reference"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              disabled={disabled}
              className="media-picker-btn px-3 py-1 rounded-lg bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Choose from Library</span>
            </button>

            {/* Focal Point Selector for Images */}
            {!isVideo && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span>Crop Focus:</span>
                <select
                  value={focalPoint}
                  onChange={(e) => onChange({ focalPoint: e.target.value })}
                  disabled={disabled}
                  className="px-2 py-1 bg-[#F8F7F4] border border-black/10 rounded-md text-[11px] text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="center 45%">Center 45% (Hero)</option>
                  <option value="45% 55%">45% 55%</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectAsset}
        allowedType={allowedType}
        currentAssetUrl={value}
        title={`Select ${label}`}
      />
    </div>
  );
}
