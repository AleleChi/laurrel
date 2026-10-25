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
  X,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { MediaAsset } from '@/components/admin/media/types';
import { MediaDetailDrawer } from '@/components/admin/media/MediaDetailDrawer';
import { MediaUploadModal } from '@/components/admin/media/MediaUploadModal';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { formatCanadianDate } from '@/lib/utils/formatters';

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
      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error('Media service returned an unreadable response. Please check network connectivity.');
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Unable to load media assets (HTTP ${res.status}).`);
      }

      setAssets(Array.isArray(data?.data) ? data.data : []);
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
    try {
      const res = await fetch(`/api/admin/media/${asset.id}`);
      if (res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        if (data?.success && data?.data) {
          setSelectedAsset(data.data);
          setIsDrawerOpen(true);
          return;
        }
      }
      setSelectedAsset(asset);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900">
            Media Library
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Cloudflare R2 storage assets for Ottawa photography, service videos, and marketing media.
          </p>
        </div>

        <AdminButton
          id="upload-media-btn"
          variant="primary"
          size="sm"
          onClick={() => setIsUploadOpen(true)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
          className="self-start sm:self-auto"
        >
          Upload Media
        </AdminButton>
      </div>

      {/* ========================================================================= */}
      {/* TOOLBAR: Standardized Controls (44px height)                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-md border border-zinc-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
          {/* Search Input (5 cols) */}
          <div className="sm:col-span-2 md:col-span-5 relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename, alt text, tag..."
              className="w-full h-11 pl-10 pr-10 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setTimeout(loadMedia, 50);
                }}
                className="absolute right-3 text-zinc-400 hover:text-zinc-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Folder Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full h-11 px-3.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
            >
              <option value="all">All Folders</option>
              <option value="general">General</option>
              <option value="cleaning">Cleaning</option>
              <option value="moving">Moving</option>
              <option value="storage">Storage</option>
              <option value="hero">Hero Banners</option>
            </select>
          </div>

          {/* Type Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as any)}
              className="w-full h-11 px-3.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
            >
              <option value="all">All File Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
          </div>

          {/* Sort Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="w-full h-11 px-3.5 text-sm bg-white text-zinc-900 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="size_desc">Largest File</option>
            </select>
          </div>

          {/* View Mode Toggle (1 col) */}
          <div className="md:col-span-1 flex items-center justify-end bg-zinc-100 p-1 rounded-lg h-11">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-2xs text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-zinc-100">
          <span>
            Showing <strong className="text-zinc-900 font-semibold">{assets.length}</strong> media assets in Cloudflare R2
          </span>
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              className="w-4 h-4 rounded text-[#49056B] focus:ring-[#49056B] border-zinc-300"
            />
            <span className="text-xs text-zinc-600">Show archived items</span>
          </label>
        </div>
      </div>

      {/* Main Asset Container */}
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={loadMedia} className="font-semibold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-2 text-zinc-400 text-sm">
          <RefreshCw className="w-6 h-6 text-[#49056B] animate-spin" />
          <span>Loading media assets...</span>
        </div>
      ) : assets.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-md border border-zinc-200 p-8 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-md bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 tracking-tight">No Media Assets Found</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto mt-1">
              {isArchived
                ? 'There are no archived media assets currently.'
                : search
                ? `No media items matching "${search}".`
                : 'The media library has no assets in this folder.'}
            </p>
          </div>
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            Upload First Asset
          </AdminButton>
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
                className="group rounded-md border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer flex flex-col shadow-2xs"
              >
                {/* Media Thumbnail Container */}
                <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden flex items-center justify-center border-b border-zinc-100">
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
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/15 transition-colors">
                        <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center text-white">
                          <Film className="w-4 h-4 ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={asset.thumbnailUrl || asset.publicUrl}
                      alt={asset.altText || asset.originalFilename}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/brand/laurrel-symbol.png';
                        (e.target as HTMLImageElement).className = 'w-8 h-8 object-contain opacity-40';
                      }}
                    />
                  )}
                </div>

                {/* Metadata */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <h4
                    className="text-xs font-semibold text-zinc-900 truncate"
                    title={asset.originalFilename}
                  >
                    {asset.originalFilename}
                  </h4>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-zinc-500">
                    <span>{metaLabel}</span>
                    <span>•</span>
                    <span>{formatFileSize(asset.fileSize)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-md border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <th className="py-3.5 px-5">Preview</th>
                  <th className="py-3.5 px-4">Filename</th>
                  <th className="py-3.5 px-4">Folder</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Uploaded</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    onClick={() => handleAssetClick(asset)}
                    className="hover:bg-zinc-50/70 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-5 w-16">
                      <div className="w-11 h-11 rounded-lg bg-zinc-100 overflow-hidden relative flex items-center justify-center border border-zinc-200">
                        {asset.assetType === 'video' ? (
                          <Film className="w-4 h-4 text-zinc-600" />
                        ) : (
                          <img
                            src={asset.thumbnailUrl || asset.publicUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 text-sm truncate max-w-xs">
                        {asset.originalFilename}
                      </div>
                      <div className="text-xs text-zinc-500 truncate max-w-xs">
                        {asset.altText || 'No alt text set'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-600 capitalize">
                      {asset.folder}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-600 uppercase">
                      {asset.mimeType?.split('/')[1] || asset.assetType}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-600">
                      {formatFileSize(asset.fileSize)}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-xs text-zinc-500">
                      {formatCanadianDate(asset.createdAt)}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssetClick(asset);
                        }}
                        className="text-[#49056B]"
                        rightIcon={<ChevronRight className="w-4 h-4" />}
                      >
                        Inspect
                      </AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Drawer */}
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
        defaultFolder={folder === 'all' ? 'general' : folder}
      />
    </div>
  );
}
