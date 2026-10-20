'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Trash2,
  Archive,
  RotateCcw,
  ExternalLink,
  AlertCircle,
  FileText,
  Layers,
  Calendar,
  User,
  HardDrive,
  Maximize2,
} from 'lucide-react';
import { MediaAsset } from './types';

interface MediaDetailDrawerProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedAsset: MediaAsset) => void;
  onDeleted: (deletedId: string) => void;
}

export function MediaDetailDrawer({
  asset,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: MediaDetailDrawerProps) {
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [folder, setFolder] = useState('general');
  const [focalPoint, setFocalPoint] = useState('center');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (asset) {
      setAltText(asset.altText || '');
      setCaption(asset.caption || '');
      setFolder(asset.folder || 'general');
      setFocalPoint(asset.focalPoint || 'center');
      setSaveSuccess(false);
      setErrorMsg('');
      setConfirmDelete(false);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(asset.publicUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          altText,
          caption,
          folder,
          focalPoint,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save metadata.');
      }

      setSaveSuccess(true);
      onUpdated(data.data);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating metadata.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleArchive = async () => {
    try {
      const res = await fetch(`/api/admin/media/${asset.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !asset.isArchived }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdated(data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle archive status.');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete asset.');
      }

      onDeleted(asset.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting asset.');
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  const isVideo = asset.assetType === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-black/[0.08] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50/60">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Asset Details</h2>
            <p className="text-[11px] text-zinc-400 truncate max-w-[340px]">{asset.originalFilename}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Metadata updated successfully.</span>
            </div>
          )}

          {/* Media Preview Box */}
          <div className="rounded-xl overflow-hidden border border-black/10 bg-zinc-950 flex items-center justify-center relative min-h-[200px]">
            {isVideo ? (
              <video
                src={asset.publicUrl}
                poster={asset.thumbnailUrl || undefined}
                controls
                preload="metadata"
                className="w-full max-h-[280px] object-contain"
              />
            ) : (
              <img
                src={asset.publicUrl}
                alt={asset.altText || asset.originalFilename}
                className="w-full max-h-[280px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/brand/laurrel-symbol.png';
                  (e.target as HTMLImageElement).className = 'w-16 h-16 object-contain opacity-40';
                }}
              />
            )}
          </div>

          {/* Core File Metadata Table */}
          <div className="bg-[#F8F7F4] p-4 rounded-xl border border-black/[0.06] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Public URL</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 truncate max-w-[200px] text-[11px]">{asset.publicUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="p-1 hover:bg-black/5 rounded text-zinc-600 transition-colors cursor-pointer"
                  title="Copy public URL"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Dimensions</span>
              <span className="text-zinc-700 font-semibold">
                {asset.width && asset.height ? `${asset.width} × ${asset.height} px` : 'Scalable / Dynamic'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">File Size</span>
              <span className="text-zinc-700 font-semibold">{formatFileSize(asset.fileSize)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">MIME Format</span>
              <span className="text-zinc-700 text-[11px]">{asset.mimeType}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Storage Engine</span>
              <span className="text-zinc-700 font-medium capitalize">{asset.storageProvider} Provider</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Uploaded</span>
              <span className="text-zinc-700">{new Date(asset.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* CMS Usage Discovery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-900 tracking-tight flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#49056B]" />
                <span>Referenced In Website Content</span>
              </h3>
              <span className="text-[11px] text-zinc-400">
                {asset.usage?.length || 0} reference{asset.usage?.length === 1 ? '' : 's'}
              </span>
            </div>

            {asset.usage && asset.usage.length > 0 ? (
              <div className="divide-y divide-black/[0.04] rounded-xl border border-black/[0.06] overflow-hidden bg-white">
                {asset.usage.map((u, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-900">{u.pageName}</span>
                      <span className="text-zinc-400 ml-1.5 text-[11px]">Section: {u.sectionKey}</span>
                    </div>
                    <div>
                      {u.inPublished ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Live Site
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Draft Only
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-black/[0.06] bg-zinc-50 text-xs text-zinc-400 text-center">
                This asset is not currently referenced in any page sections. Safe to delete or replace.
              </div>
            )}
          </div>

          {/* Metadata Editing Fields */}
          <div className="space-y-4 pt-2 border-t border-black/[0.06]">
            <h3 className="text-xs font-bold text-zinc-900 tracking-tight">Editable Asset Metadata</h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">Alt Text</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Accessible description"
                className="w-full px-3 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-900 mb-1">Caption / Internal Notes</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Display caption or internal guidelines"
                className="w-full px-3 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">Folder</label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
                >
                  <option value="general">General</option>
                  <option value="hero">Hero Section</option>
                  <option value="about">About Page</option>
                  <option value="services">Services Page</option>
                  <option value="videos">Hero Videos</option>
                  <option value="brand">Brand</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-900 mb-1">Focal Positioning</label>
                <select
                  value={focalPoint}
                  onChange={(e) => setFocalPoint(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F7F4] border border-black/10 rounded-[10px] text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="center 45%">Center 45% (Hero)</option>
                </select>
              </div>
            </div>

            <button
              id="save-media-metadata-btn"
              onClick={handleSaveMetadata}
              disabled={isSaving}
              className="w-full py-2 bg-[#49056B] text-white text-xs font-semibold rounded-xl hover:bg-[#5B0785] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSaving ? 'Saving Changes...' : 'Save Metadata'}
            </button>
          </div>

          {/* Danger / Administrative Actions */}
          <div className="pt-4 border-t border-black/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleToggleArchive}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-medium transition-colors cursor-pointer"
              >
                <Archive className="w-4 h-4 text-zinc-400" />
                <span>{asset.isArchived ? 'Unarchive Asset' : 'Archive Asset'}</span>
              </button>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>Delete Asset</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-red-600 font-semibold">Confirm delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
