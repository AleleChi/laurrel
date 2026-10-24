'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, UploadCloud, Film, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { MediaAsset } from './types';
import { MediaUploadModal } from './MediaUploadModal';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  allowedType?: 'image' | 'video' | 'all';
  currentAssetUrl?: string;
  title?: string;
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  allowedType = 'all',
  currentAssetUrl,
  title = 'Select Media Asset',
}: MediaPickerModalProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAssets();
    }
  }, [isOpen, folder, search]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (folder !== 'all') params.set('folder', folder);
      if (search.trim()) params.set('search', search.trim());
      if (allowedType !== 'all') params.set('assetType', allowedType);

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.data);
        if (currentAssetUrl && !selectedAsset) {
          const match = data.data.find((a: MediaAsset) => a.publicUrl === currentAssetUrl);
          if (match) setSelectedAsset(match);
        }
      }
    } catch (err) {
      console.error('Failed to load media assets for picker:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  const handleUploadSuccess = (newAsset: MediaAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    setSelectedAsset(newAsset);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-4xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/70">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Select an asset from Cloudflare R2</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200/80 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search media assets..."
                className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
              />
            </div>

            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            >
              <option value="all">All Folders</option>
              <option value="hero">Hero</option>
              <option value="about">About</option>
              <option value="services">Services</option>
              <option value="videos">Videos</option>
              <option value="brand">Brand</option>
              <option value="general">General</option>
            </select>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-md bg-[#49056B] text-white text-xs font-semibold hover:bg-[#390044] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New</span>
          </button>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-5 bg-zinc-50/40">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
              <div className="w-5 h-5 border-2 border-[#49056B]/30 border-t-[#49056B] rounded-full animate-spin" />
              <span>Loading media assets...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 rounded-md bg-white">
              <ImageIcon className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-xs font-bold text-zinc-700">No media assets found</p>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-sm">
                Try adjusting your search filter or upload a new image or video.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-3 px-3 py-1.5 text-xs text-[#49056B] font-semibold hover:underline cursor-pointer"
              >
                Upload an asset now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {assets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const isCurrent = asset.publicUrl === currentAssetUrl;

                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group relative rounded-md border overflow-hidden cursor-pointer bg-white transition-all flex flex-col shadow-2xs ${
                      isSelected
                        ? 'border-[#49056B] ring-2 ring-[#49056B]/25'
                        : 'border-zinc-200/80 hover:border-zinc-300'
                    }`}
                  >
                    {/* Thumbnail box */}
                    <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden flex items-center justify-center border-b border-zinc-100">
                      {asset.assetType === 'video' ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                          {asset.thumbnailUrl ? (
                            <img src={asset.thumbnailUrl} alt={asset.altText || asset.originalFilename} className="w-full h-full object-cover" />
                          ) : null}
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/95">
                              <Film className="w-3.5 h-3.5 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={asset.thumbnailUrl || asset.publicUrl}
                          alt={asset.altText || asset.originalFilename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/brand/laurrel-symbol.png';
                            (e.target as HTMLImageElement).className = 'w-8 h-8 object-contain opacity-40';
                          }}
                        />
                      )}

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#49056B] text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Active tag */}
                      {isCurrent && !isSelected && (
                        <div className="absolute top-2 left-2 text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80">
                          Active
                        </div>
                      )}
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-semibold text-zinc-900 truncate" title={asset.originalFilename}>
                        {asset.originalFilename}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-400">
                        <span className="uppercase">{asset.assetType}</span>
                        <span>•</span>
                        <span>{formatFileSize(asset.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zinc-200/80 bg-zinc-50 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            {selectedAsset ? (
              <span className="truncate max-w-md block">
                Selected: <strong className="text-zinc-900">{selectedAsset.originalFilename}</strong>
              </span>
            ) : (
              'Select an asset to continue'
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-zinc-200 rounded-md text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedAsset}
              className="px-4 py-1.5 rounded-md bg-[#49056B] text-white text-xs font-semibold hover:bg-[#390044] transition-colors disabled:opacity-50 shadow-2xs"
            >
              Use Selected Asset
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Upload Modal */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        defaultFolder={folder !== 'all' ? folder : 'general'}
      />
    </div>
  );
}
