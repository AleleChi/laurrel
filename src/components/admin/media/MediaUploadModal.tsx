'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { X, UploadCloud, AlertCircle, Check, Film, Image as ImageIcon } from 'lucide-react';
import { MediaAsset } from './types';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (asset: MediaAsset) => void;
  defaultFolder?: string;
  allowedType?: 'image' | 'video' | 'all';
}

export function MediaUploadModal({
  isOpen,
  onClose,
  onSuccess,
  defaultFolder = 'general',
  allowedType = 'all',
}: MediaUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState<string>(defaultFolder);
  const [altText, setAltText] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [focalPoint, setFocalPoint] = useState<string>('center');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      selectFile(e.target.files[0]);
    }
  };

  const selectFile = (selectedFile: File) => {
    setFile(selectedFile);
    setUploadError('');

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    if (!altText) {
      const cleanName = selectedFile.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      setAltText(`Laurrel Services ${cleanName}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('altText', altText);
      formData.append('caption', caption);
      formData.append('focalPoint', focalPoint);

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed.');
      }

      onSuccess(data.data);
      onClose();
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading file.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="bg-white rounded-md border border-zinc-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/70">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Upload Media Asset</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Cloudflare R2 Object Storage</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {uploadError && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-[#49056B] bg-[#49056B]/[0.02]'
                : 'border-zinc-300 hover:border-[#49056B] bg-zinc-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept={
                allowedType === 'image'
                  ? 'image/*'
                  : allowedType === 'video'
                  ? 'video/mp4,video/webm'
                  : 'image/*,video/mp4,video/webm'
              }
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                {previewUrl ? (
                  <div className="relative w-28 h-20 rounded overflow-hidden border border-zinc-200 shadow-2xs mb-1">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-md bg-[#49056B]/10 flex items-center justify-center text-[#49056B] mb-1">
                    <Film className="w-5 h-5" />
                  </div>
                )}
                <span className="text-xs font-semibold text-zinc-900 truncate max-w-xs">{file.name}</span>
                <span className="text-[11px] text-zinc-500">
                  {Math.round(file.size / 1024)} KB • Click or drop another file to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500 mb-1">
                  <UploadCloud className="w-5 h-5 text-[#49056B]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-zinc-900">Click to browse</span> or drag and drop
                </div>
                <p className="text-[11px] text-zinc-400">
                  PNG, JPEG, WebP, AVIF (up to 15MB) or MP4 (up to 100MB)
                </p>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Folder</label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#49056B]"
              >
                <option value="general">General</option>
                <option value="hero">Hero Section</option>
                <option value="about">About Page</option>
                <option value="services">Services Page</option>
                <option value="videos">Hero Videos</option>
                <option value="brand">Brand & Identity</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-800 mb-1">Focal Positioning</label>
              <select
                value={focalPoint}
                onChange={(e) => setFocalPoint(e.target.value)}
                disabled={isUploading}
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

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">
              Alt Text (Accessibility)
            </label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Descriptive alt text for screen readers..."
              disabled={isUploading}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-800 mb-1">Caption</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              disabled={isUploading}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200/80 rounded-md text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#49056B] focus:bg-white"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-md text-xs font-semibold hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-4 py-2 bg-[#49056B] text-white rounded-md text-xs font-semibold hover:bg-[#390044] transition-colors disabled:opacity-50 shadow-2xs"
            >
              {isUploading ? 'Uploading to R2...' : 'Upload Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
