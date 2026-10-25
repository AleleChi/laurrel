'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { AdminButton } from './AdminButton';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  requiresInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  initialInputValue?: string;
  inputRequired?: boolean;
  isLoading?: boolean;
  onConfirm: (inputValue?: string) => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  requiresInput = false,
  inputLabel = 'Reason or note',
  inputPlaceholder = 'Enter details...',
  initialInputValue = '',
  inputRequired = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [inputError, setInputError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const uniqueId = useId();
  const titleId = `confirm-dialog-title-${uniqueId}`;
  const descId = `confirm-dialog-desc-${uniqueId}`;
  const inputId = `confirm-dialog-input-${uniqueId}`;
  const errorId = `confirm-dialog-error-${uniqueId}`;

  // Reset values and manage focus restoration
  useEffect(() => {
    if (isOpen) {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
      setInputValue(initialInputValue);
      setInputError('');
      setSubmitting(false);

      // Focus first interactive element on open
      const timer = setTimeout(() => {
        if (requiresInput && inputRef.current) {
          inputRef.current.focus();
        } else if (confirmButtonRef.current) {
          confirmButtonRef.current.focus();
        }
      }, 50);

      return () => clearTimeout(timer);
    } else {
      // Restore focus on close
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
        lastActiveElementRef.current.focus();
      }
    }
  }, [isOpen, initialInputValue, requiresInput]);

  const isBusy = isLoading || submitting;

  const handleConfirm = useCallback(async () => {
    if (isBusy) return;

    if (requiresInput && inputRequired && !inputValue.trim()) {
      setInputError('This field is required.');
      inputRef.current?.focus();
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(requiresInput ? inputValue.trim() : undefined);
    } finally {
      setSubmitting(false);
    }
  }, [isBusy, requiresInput, inputRequired, inputValue, onConfirm]);

  const handleCancel = useCallback(() => {
    if (isBusy) return;
    onCancel();
  }, [isBusy, onCancel]);

  // Focus trap & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isBusy) {
          e.preventDefault();
          handleCancel();
        }
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBusy, handleCancel]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" aria-hidden="true" />;
      default:
        return <Info className="w-5 h-5 text-[#49056B]" aria-hidden="true" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-purple-50 border-purple-200';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4"
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md bg-white rounded-md shadow-xl border border-zinc-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${getIconBg()}`}
            >
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id={titleId}
                className="text-base font-bold text-zinc-900 tracking-tight"
              >
                {title}
              </h3>
              <p
                id={descId}
                className="text-sm text-zinc-600 mt-1 leading-relaxed"
              >
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isBusy}
              aria-label="Close dialog"
              className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {requiresInput && (
            <div className="mt-4 pt-2">
              <label
                htmlFor={inputId}
                className="block text-[13px] font-medium text-zinc-700 mb-1"
              >
                {inputLabel} {inputRequired && <span className="text-red-500">*</span>}
              </label>
              <textarea
                ref={inputRef}
                id={inputId}
                value={inputValue}
                disabled={isBusy}
                aria-required={inputRequired}
                aria-invalid={!!inputError}
                aria-describedby={inputError ? errorId : undefined}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError('');
                }}
                rows={3}
                placeholder={inputPlaceholder}
                className={`w-full p-3 text-sm bg-zinc-50 text-zinc-900 border rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all disabled:bg-zinc-100 disabled:text-zinc-500 disabled:cursor-not-allowed ${
                  inputError ? 'border-red-400' : 'border-zinc-300'
                }`}
              />
              {inputError && (
                <p id={errorId} className="text-xs text-red-600 font-medium mt-1">
                  {inputError}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isBusy}
            >
              {cancelLabel}
            </AdminButton>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirm}
              disabled={isBusy}
              className={`inline-flex items-center justify-center font-medium rounded-md h-9 px-3 text-xs gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none ${
                variant === 'danger'
                  ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-xs active:bg-red-800'
                  : 'bg-[#49056B] text-white hover:bg-[#390044] focus:ring-[#49056B] shadow-xs active:bg-[#2d0037]'
              }`}
            >
              {isBusy && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1 shrink-0" />
              )}
              <span>{confirmLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
