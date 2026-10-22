import React, { useState } from 'react';
import { X, History, RotateCcw, Check, AlertCircle, Calendar, User } from 'lucide-react';

export interface CmsRevisionItem {
  id: string;
  pageId: string;
  revisionNumber: number;
  data: {
    seo?: Record<string, any>;
    sections?: Record<string, any>;
  };
  isPublished: boolean;
  authorEmail?: string;
  authorName?: string;
  notes?: string;
  createdAt: string;
}

interface RevisionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  revisions: CmsRevisionItem[];
  currentRevisionId?: string;
  onRestore: (revisionNumber: number) => Promise<void>;
  canPublish: boolean; // owner or admin only
}

export function RevisionHistoryDrawer({
  isOpen,
  onClose,
  revisions,
  currentRevisionId,
  onRestore,
  canPublish,
}: RevisionHistoryDrawerProps) {
  const [restoringRev, setRestoringRev] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState('');

  if (!isOpen) return null;

  const handleConfirmRestore = async (revNumber: number) => {
    setIsRestoring(true);
    setRestoreError('');
    try {
      await onRestore(revNumber);
      setRestoringRev(null);
      onClose();
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore revision.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col border-l border-black/[0.08] overflow-hidden">
        {/* Drawer Header */}
        <div className="px-6 py-4.5 border-b border-black/[0.06] flex items-center justify-between bg-zinc-50/60">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#49056B]" />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 tracking-tight">Revision History</h2>
              <p className="text-[11px] text-zinc-400">
                Audited version timeline and one-click restoration snapshots.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {restoreError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{restoreError}</span>
            </div>
          )}

          {revisions.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              No historical revisions found for this page.
            </div>
          ) : (
            <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-zinc-200">
              {revisions.map((rev) => {
                const isCurrent = rev.id === currentRevisionId;
                const isConfirming = restoringRev === rev.revisionNumber;

                return (
                  <div
                    key={rev.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-[#49056B]/[0.03] border-[#49056B]/20'
                        : 'bg-white border-black/[0.06] hover:border-black/15'
                    }`}
                  >
                    <div
                      className={`absolute -left-4.5 top-4 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                        isCurrent ? 'bg-[#FE6000]' : 'bg-zinc-300'
                      }`}
                    />

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 tracking-tight">
                          Revision #{rev.revisionNumber}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Current Live
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-zinc-400">
                        {new Date(rev.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 mt-1 font-medium">
                      {rev.notes || 'No description notes provided.'}
                    </p>

                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/[0.04] text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                        <User className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{rev.authorEmail || 'System'}</span>
                      </div>

                      {!isCurrent && (
                        <div>
                          {isConfirming ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                id="confirm-restore-btn"
                                onClick={() => handleConfirmRestore(rev.revisionNumber)}
                                disabled={isRestoring || !canPublish}
                                className="px-2.5 py-1 rounded-md bg-[#49056B] text-white hover:bg-[#5B0785] text-[11px] font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isRestoring ? 'Restoring...' : 'Confirm'}
                              </button>
                              <button
                                onClick={() => setRestoringRev(null)}
                                className="px-2 py-1 rounded-md bg-zinc-100 text-zinc-600 text-[11px] hover:bg-zinc-200 transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRestoringRev(rev.revisionNumber)}
                              disabled={!canPublish}
                              className="restore-trigger-btn inline-flex items-center gap-1 text-[11px] font-semibold text-[#49056B] hover:text-[#FE6000] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                              title={
                                !canPublish
                                  ? 'Restoring requires owner or admin permissions'
                                  : 'Restore this version to live site'
                              }
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restore</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
