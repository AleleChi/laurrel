'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileEdit,
  ExternalLink,
  RefreshCw,
  Clock,
  ArrowRight,
  Globe,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface CmsPageSummary {
  id: string;
  name: string;
  slug: string;
  template: string;
  status: 'draft' | 'published' | 'scheduled';
  seo: {
    title?: string;
    description?: string;
  };
  currentRevisionId?: string;
  lastEditorEmail?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function CmsOverviewPage() {
  const [pages, setPages] = useState<CmsPageSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadPages = async () => {
    try {
      const res = await fetch('/api/admin/cms/pages');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch CMS pages from database.');
      }
      const data = await res.json();
      if (data.pages) {
        setPages(data.pages);
      }
    } catch (err: any) {
      console.error('[CMS Overview Error]:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setError('');
    loadPages();
  };

  return (
    <div className="space-y-6">
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-black/[0.06]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Website Content Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Authoritative native CMS. Edit section copy, draft updates, review revision history, and publish directly to the live website.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white border border-black/10 hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[#49056B] text-white hover:bg-[#5B0785] text-xs font-semibold transition-colors shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-orange-400" />
            <span>View Live Site</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Pages Table Card */}
      <div className="bg-white rounded-xl border border-black/[0.06] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Active Website Pages</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Structured pages and sections managed by Laurrel CMS in Neon PostgreSQL.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {pages.length} page{pages.length === 1 ? '' : 's'} registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-black/[0.06] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-6">Page Name</th>
                <th className="py-3 px-6">Route / Slug</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Last Published</th>
                <th className="py-3 px-6">Last Editor</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2.5" role="status" aria-busy="true">
                      <div className="relative w-6 h-6 motion-safe:animate-pulse">
                        <Image
                          src="/assets/brand/laurrel-symbol.png"
                          alt="Loading"
                          fill
                          sizes="24px"
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs text-zinc-400 font-medium tracking-wide">
                        Loading CMS pages...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No CMS pages configured. Run seed migration to populate initial pages.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-900 tracking-tight text-sm">
                        {page.name}
                      </div>
                      <div className="text-zinc-400 text-[11px] mt-0.5 truncate max-w-xs">
                        {page.seo?.title || 'No title set'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-zinc-600 font-medium">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-[11px] text-zinc-700">
                        {page.slug}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {page.status === 'published' ? (
                        <span className="text-xs font-semibold text-emerald-700">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#FE6000]">
                          Draft Changes
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-zinc-600">
                      {page.publishedAt ? (
                        <div>
                          <div className="text-zinc-900 font-medium">
                            {new Date(page.publishedAt).toLocaleDateString()}
                          </div>
                          <div className="text-zinc-400 text-[10px]">
                            {new Date(page.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Not yet published</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-zinc-600">
                      <span className="text-zinc-700 truncate block max-w-[140px]">
                        {page.lastEditorEmail || 'System Initializer'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={page.slug}
                          target="_blank"
                          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/admin/website/${page.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#49056B] hover:text-[#FE6000] transition-colors"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Edit Page</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
