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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-black/[0.08] w-full max-w-4xl h-[82vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50/60">
          <div>
            <h2 className="text-base font-bold text-zinc-900 tracking-tight">{title}</h2>
            <p className="text-xs text-zinc-400">Choose from existing library assets or upload a new asset.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Actions Bar */}
        <div className="px-6 py-3 border-b border-black/[0.06] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
              />
            </div>

            {/* Folder Filter */}
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="px-3 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
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
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload New</span>
          </button>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F8F7F4]/40">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-[#49056B]/30 border-t-[#49056B] rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Loading library assets...</span>
            </div>
          ) : assets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-200 rounded-xl bg-white">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const isCurrent = asset.publicUrl === currentAssetUrl;

                return (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group relative rounded-xl border overflow-hidden cursor-pointer bg-white transition-all ${
                      isSelected
                        ? 'border-[#49056B] ring-2 ring-[#49056B]/20 shadow-sm'
                        : 'border-black/[0.08] hover:border-black/20 hover:shadow-xs'
                    }`}
                  >
                    {/* Thumbnail box */}
                    <div className="aspect-[4/3] bg-zinc-900 relative overflow-hidden flex items-center justify-center">
                      {asset.assetType === 'video' ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                          {asset.thumbnailUrl ? (
                            <img src={asset.thumbnailUrl} alt={asset.altText} className="w-full h-full object-cover" />
                          ) : (
                            <Film className="w-8 h-8 text-zinc-500" />
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Film className="w-6 h-6 text-white/90" />
                          </div>
                        </div>
                      ) : (
                        <img
                          src={asset.thumbnailUrl || asset.publicUrl}
                          alt={asset.altText || asset.originalFilename}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                      )}

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#49056B] text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Currently in use tag */}
                      {isCurrent && !isSelected && (
                        <div className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-black/70 text-white rounded backdrop-blur-xs">
                          Current
                        </div>
                      )}
                    </div>

                    {/* Metadata Card Footer */}
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-zinc-900 truncate" title={asset.originalFilename}>
                        {asset.originalFilename}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                        <span className="capitalize">{asset.folder}</span>
                        <span>{asset.width && asset.height ? `${asset.width}×${asset.height}` : asset.assetType}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Selected Asset Summary & Confirm */}
        <div className="px-6 py-4 border-t border-black/[0.06] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {selectedAsset ? (
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-8 rounded-md overflow-hidden bg-zinc-100 border border-black/10 shrink-0">
                  <img
                    src={selectedAsset.thumbnailUrl || selectedAsset.publicUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs truncate max-w-[280px]">
                  <p className="font-semibold text-zinc-900 truncate">{selectedAsset.originalFilename}</p>
                  <p className="text-[10px] text-zinc-400 truncate">{selectedAsset.altText || 'No alt text'}</p>
                </div>
              </div>
            ) : (
              <span className="text-xs text-zinc-400 italic">Select an asset above to apply</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-media-selection-btn"
              onClick={handleConfirm}
              disabled={!selectedAsset}
              className="px-5 py-2 rounded-xl bg-[#49056B] text-white text-xs font-semibold hover:bg-[#5B0785] transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Selection</span>
            </button>
          </div>
        </div>

        {/* Upload Modal nested */}
        <MediaUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
          allowedType={allowedType}
        />
      </div>
    </div>
  );
}
