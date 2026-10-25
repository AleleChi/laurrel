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
  const lastAssetIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (asset) {
      setAltText(asset.altText || '');
      setCaption(asset.caption || '');
      setFolder(asset.folder || 'general');
      setFocalPoint(asset.focalPoint || 'center');
      if (lastAssetIdRef.current !== asset.id) {
        lastAssetIdRef.current = asset.id;
        setSaveSuccess(false);
        setErrorMsg('');
        setConfirmDelete(false);
      }
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
      const nextArchived = !asset.isArchived;
      const res = await fetch(`/api/admin/media/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: nextArchived }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onUpdated(data.data);
      }
    } catch (err) {
      console.error('Failed to toggle archive status:', err);
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Deletion blocked.');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-2xs">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-zinc-200 overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/70">
          <div className="min-w-0 pr-3">
            <h2 className="text-sm font-bold text-zinc-900 truncate tracking-tight">
              {asset.originalFilename}
            </h2>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
              ID: {asset.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Metadata saved successfully.</span>
            </div>
          )}

          {/* Media Preview Box */}
          <div className="rounded-md border border-zinc-200/80 bg-zinc-950/5 p-2 flex items-center justify-center overflow-hidden">
            {asset.assetType === 'video' ? (
              <video
                src={asset.publicUrl}
                controls
                className="w-full max-h-[260px] rounded object-contain bg-black"
              />
            ) : (
              <img
                src={asset.publicUrl}
                alt={asset.altText || asset.originalFilename}
                className="w-full max-h-[260px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/brand/laurrel-symbol.png';
                  (e.target as HTMLImageElement).className = 'w-16 h-16 object-contain opacity-40';
                }}
              />
            )}
          </div>

          {/* Core File Metadata Table */}
          <div className="bg-zinc-50 p-4 rounded-md border border-zinc-200/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-medium">Public URL</span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-600 truncate max-w-[200px] text-[11px] font-mono">{asset.publicUrl}</span>
                <button
                  onClick={handleCopyUrl}
                  className="p-1 hover:bg-zinc-200 rounded text-zinc-600 transition-colors"
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
              <span className="text-zinc-700">{new Date(asset.createdAt).toLocaleDateString('en-CA')}</span>
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
              <div className="divide-y divide-zinc-100 rounded-md border border-zinc-200/80 overflow-hidden bg-white">
                {asset.usage.map((u, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-900">{u.pageName}</span>
                      <span className="text-zinc-400 ml-1.5 text-[11px]">Section: {u.sectionKey}</span>
                    </div>
                    <div>
                      {u.inPublished ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Live Site
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Draft Only
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic bg-zinc-50 p-3 rounded-md border border-zinc-200/60">
                This asset is not currently referenced in published or draft website sections.
              </p>
            )}
          </div>

          {/* Editable Metadata Form */}
          <div className="space-y-3 pt-3 border-t border-zinc-100">
            <h3 className="text-xs font-bold text-zinc-900 tracking-tight">Editorial Metadata</h3>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Alt Text (Accessibility & SEO)
              </label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriptive alt text for screen readers..."
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Optional editorial caption..."
                rows={2}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Folder
                </label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
                >
                  <option value="general">General</option>
                  <option value="hero">Hero</option>
                  <option value="about">About</option>
                  <option value="services">Services</option>
                  <option value="videos">Videos</option>
                  <option value="brand">Brand</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Focal Point
                </label>
                <select
                  value={focalPoint}
                  onChange={(e) => setFocalPoint(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
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
              className="w-full py-2 bg-[#49056B] text-white text-xs font-semibold rounded-md hover:bg-[#390044] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isSaving ? 'Saving Changes...' : 'Save Metadata'}
            </button>
          </div>

          {/* Danger / Administrative Actions */}
          <div className="pt-4 border-t border-zinc-100 space-y-3">
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
                    className="px-2.5 py-1 bg-red-600 text-white text-xs font-semibold rounded hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs rounded hover:bg-zinc-200 transition-colors cursor-pointer"
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
