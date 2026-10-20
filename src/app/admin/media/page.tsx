'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  Search,
  Grid,
  List,
  Film,
  Image as ImageIcon,
  Layers,
  ArrowUpDown,
  Filter,
  AlertCircle,
  Archive,
  RefreshCw,
} from 'lucide-react';
import { MediaAsset } from '@/components/admin/media/types';
import { MediaDetailDrawer } from '@/components/admin/media/MediaDetailDrawer';
import { MediaUploadModal } from '@/components/admin/media/MediaUploadModal';

export default function MediaLibraryPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Controls
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('all');
  const [assetType, setAssetType] = useState<'all' | 'image' | 'video'>('all');
  const [isArchived, setIsArchived] = useState(false);
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc'>('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Drawers
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  useEffect(() => {
    loadMedia();
  }, [folder, assetType, isArchived, sort]);

  const loadMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (folder !== 'all') params.set('folder', folder);
      if (assetType !== 'all') params.set('assetType', assetType);
      params.set('isArchived', isArchived.toString());
      params.set('sort', sort);

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load media assets.');
      }

      setAssets(data.data || []);
    } catch (err: any) {
      setError(err.message || 'Error communicating with media API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia();
  };

  const handleAssetClick = async (asset: MediaAsset) => {
    // Fetch full detail including live usage
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedAsset(data.data);
      } else {
        setSelectedAsset(asset);
      }
    } catch {
      setSelectedAsset(asset);
    }
    setIsDrawerOpen(true);
  };

  const handleAssetUpdated = (updated: MediaAsset) => {
    setAssets((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setSelectedAsset(updated);
  };

  const handleAssetDeleted = (deletedId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== deletedId));
    setIsDrawerOpen(false);
    setSelectedAsset(null);
  };

  const handleUploadSuccess = (newAsset: MediaAsset) => {
    setAssets((prev) => [newAsset, ...prev]);
    handleAssetClick(newAsset);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Media Library</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage, upload, and organize brand photography, hero videos, and marketing assets.
          </p>
        </div>

        <button
          id="upload-media-btn"
          onClick={() => setIsUploadOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#49056B] text-white text-xs font-semibold rounded-xl hover:bg-[#5B0785] transition-all shadow-xs cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Media</span>
        </button>
      </div>

      {/* Control Bar: Filters, Search, Views */}
      <div className="bg-white p-4 rounded-xl border border-black/[0.06] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Type Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F8F7F4] rounded-lg border border-black/[0.04]">
            <button
              onClick={() => setAssetType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                assetType === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              All Media
            </button>
            <button
              onClick={() => setAssetType('image')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                assetType === 'image'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images</span>
            </button>
            <button
              onClick={() => setAssetType('video')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                assetType === 'video'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Videos</span>
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              id="media-search-input"
              placeholder="Search filename, alt text, or caption..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTimeout(loadMedia, 50);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs cursor-pointer"
              >
                ×
              </button>
            )}
          </form>

          {/* Secondary Filters: Folder, Sort & View Mode */}
          <div className="flex items-center gap-2">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="px-3 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B] cursor-pointer"
            >
              <option value="all">All Folders</option>
              <option value="hero">Hero</option>
              <option value="about">About</option>
              <option value="services">Services</option>
              <option value="videos">Videos</option>
              <option value="brand">Brand</option>
              <option value="general">General</option>
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="px-3 py-1.5 bg-[#F8F7F4] border border-black/10 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B] cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="size_desc">File Size</option>
            </select>

            {/* Archive Toggle */}
            <button
              onClick={() => setIsArchived(!isArchived)}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                isArchived
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-[#F8F7F4] border-black/10 text-zinc-600 hover:text-zinc-900'
              }`}
              title={isArchived ? 'Showing archived assets' : 'Show archived assets'}
            >
              <Archive className="w-3.5 h-3.5" />
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 p-0.5 bg-[#F8F7F4] rounded-lg border border-black/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title="Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Asset Container */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadMedia} className="text-xs font-semibold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-[#49056B]/30 border-t-[#49056B] rounded-full animate-spin" />
          <span className="text-xs text-zinc-400">Loading library assets...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-xl border border-black/[0.06] p-8 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 tracking-tight">No Media Assets Found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {isArchived
              ? 'There are no archived media assets currently.'
              : search
              ? `No media items matching "${search}".`
              : 'The media library has no assets in this folder.'}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 px-4 py-2 bg-[#49056B] text-white text-xs font-semibold rounded-xl hover:bg-[#5B0785] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload First Asset</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => {
            const hasDimensions = asset.width && asset.height;
            const metaLabel = hasDimensions
              ? `${asset.width}×${asset.height}`
              : asset.mimeType?.split('/')[1]?.toUpperCase() || 'FILE';

            return (
              <div
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className="media-card-item group rounded-[10px] border border-black/[0.08] bg-white overflow-hidden hover:border-black/25 transition-all cursor-pointer flex flex-col"
              >
                {/* Media Thumbnail Container */}
                <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden flex items-center justify-center border-b border-black/[0.04]">
                  {asset.assetType === 'video' ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
                      {asset.thumbnailUrl ? (
                        <img
                          src={asset.thumbnailUrl}
                          alt={asset.altText || asset.originalFilename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/15 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white/95">
                          <Film className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={asset.thumbnailUrl || asset.publicUrl}
                      alt={asset.altText || asset.originalFilename}
                      className="w-full h-full object-cover transition-opacity duration-200"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/brand/laurrel-symbol.png';
                        (e.target as HTMLImageElement).className = 'w-10 h-10 object-contain opacity-40';
                      }}
                    />
                  )}
                </div>

                {/* Concise Metadata Below Thumbnail */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <h4
                    className="text-xs font-medium text-zinc-900 truncate"
                    title={asset.originalFilename}
                  >
                    {asset.originalFilename}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                    <span>{metaLabel}</span>
                    <span>·</span>
                    <span>{formatFileSize(asset.fileSize)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-xl border border-black/[0.06] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-black/[0.06] bg-zinc-50/50 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Filename</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Folder</th>
                  <th className="py-3 px-4">Dimensions</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Upload Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] text-xs">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => handleAssetClick(asset)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4">
                      <div className="w-12 h-9 rounded-md bg-zinc-900 overflow-hidden relative border border-black/10 shrink-0">
                        {asset.assetType === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center">
                            {asset.thumbnailUrl ? (
                              <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Film className="w-4 h-4 text-zinc-400" />
                            )}
                          </div>
                        ) : (
                          <img
                            src={asset.thumbnailUrl || asset.publicUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-zinc-900 group-hover:text-[#49056B] transition-colors truncate max-w-xs">
                      {asset.originalFilename}
                    </td>
                    <td className="py-2.5 px-4 uppercase text-[10px] font-bold text-zinc-500">
                      {asset.assetType}
                    </td>
                    <td className="py-2.5 px-4 capitalize text-zinc-600">{asset.folder}</td>
                    <td className="py-2.5 px-4 text-zinc-600">
                      {asset.width && asset.height ? `${asset.width} × ${asset.height}` : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-600">{formatFileSize(asset.fileSize)}</td>
                    <td className="py-2.5 px-4 text-zinc-400">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Asset Detail Drawer */}
      <MediaDetailDrawer
        asset={selectedAsset}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdated={handleAssetUpdated}
        onDeleted={handleAssetDeleted}
      />

      {/* Upload Modal */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        defaultFolder={folder !== 'all' ? folder : 'general'}
      />
    </div>
  );
}
