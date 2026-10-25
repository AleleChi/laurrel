'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminBadge } from '@/components/admin/ui/AdminBadge';
import { formatCanadianDate } from '@/lib/utils/formatters';

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold tracking-tight text-zinc-900">
            Website Content
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Manage page copy, service details, FAQs, and SEO metadata with draft and rollback control.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </AdminButton>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#49056B] text-white hover:bg-[#390044] text-xs font-semibold transition-colors shadow-2xs"
          >
            <Globe className="w-3.5 h-3.5 text-orange-400" />
            <span>View Public Website</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={handleRefresh} className="font-semibold underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Pages Table Card */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Registered Website Pages</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Structured editorial pages managed with revision tracking in Neon PostgreSQL.
            </p>
          </div>
          <span className="text-xs text-zinc-500 font-medium">
            {pages.length} page{pages.length === 1 ? '' : 's'} registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3.5 px-6">Page Name</th>
                <th className="py-3.5 px-5">Route / Slug</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 hidden md:table-cell">Last Published</th>
                <th className="py-3.5 px-5 hidden sm:table-cell">Last Editor</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 text-[#49056B] animate-spin" />
                      <span className="text-sm text-zinc-500 font-medium">
                        Loading website pages...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400">
                    No CMS pages configured.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50/70 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-900 text-sm">
                        {page.name}
                      </div>
                      <div className="text-zinc-500 text-xs mt-0.5 truncate max-w-xs">
                        {page.seo?.title || 'No SEO title set'}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-zinc-600 font-medium">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-xs text-zinc-700 font-mono">
                        {page.slug}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <AdminBadge
                        status={page.status === 'published' ? 'published' : 'draft'}
                        variant={page.status === 'published' ? 'confirmed' : 'new'}
                      />
                    </td>
                    <td className="py-4 px-5 text-zinc-600 hidden md:table-cell text-xs">
                      {page.publishedAt ? (
                        <div>
                          <div className="text-zinc-900 font-medium">
                            {formatCanadianDate(page.publishedAt)}
                          </div>
                          <div className="text-zinc-400 text-[11px]">
                            {new Date(page.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic">Not yet published</span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-zinc-600 hidden sm:table-cell text-xs">
                      <span className="text-zinc-700 truncate block max-w-[160px]">
                        {page.lastEditorEmail || 'System'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={page.slug}
                          target="_blank"
                          className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1 p-1.5"
                        >
                          <span>Live</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/website/${page.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#49056B] hover:text-[#390044] px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
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
