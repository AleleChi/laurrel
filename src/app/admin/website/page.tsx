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
  ChevronRight,
  Layers,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Website Content
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage page copy, service details, FAQs, and SEO metadata with draft and rollback control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-zinc-200/80 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#49056B] text-white hover:bg-[#390044] text-xs font-semibold transition-colors shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-orange-400" />
            <span>View Public Website</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={handleRefresh} className="font-semibold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Pages Table Card */}
      <div className="bg-white rounded-md border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Website Pages</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Structured editorial pages managed in Neon PostgreSQL.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {pages.length} page{pages.length === 1 ? '' : 's'} registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200/80 text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5">Page Name</th>
                <th className="py-3 px-5">Route / Slug</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 hidden md:table-cell">Last Published</th>
                <th className="py-3 px-5 hidden sm:table-cell">Last Editor</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-[#49056B] animate-spin" />
                      <span className="text-xs text-zinc-500 font-medium">
                        Loading website pages...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No CMS pages configured.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50/60 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-zinc-900 text-sm">
                        {page.name}
                      </div>
                      <div className="text-zinc-500 text-[11px] mt-0.5 truncate max-w-xs">
                        {page.seo?.title || 'No SEO title set'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-zinc-600 font-medium">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-[11px] text-zinc-700 font-mono">
                        {page.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {page.status === 'published' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-[#FE6000] border border-orange-200/60">
                          Draft Changes
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-600 hidden md:table-cell">
                      {page.publishedAt ? (
                        <div>
                          <div className="text-zinc-900 font-medium">
                            {new Date(page.publishedAt).toLocaleDateString('en-CA')}
                          </div>
                          <div className="text-zinc-400 text-[10px]">
                            {new Date(page.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Not yet published</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-zinc-600 hidden sm:table-cell">
                      <span className="text-zinc-700 truncate block max-w-[140px]">
                        {page.lastEditorEmail || 'System'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={page.slug}
                          target="_blank"
                          className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <Link
                          href={`/admin/website/${page.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#49056B] hover:text-[#390044] px-2.5 py-1 rounded bg-purple-50 hover:bg-purple-100 transition-colors"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Edit</span>
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
