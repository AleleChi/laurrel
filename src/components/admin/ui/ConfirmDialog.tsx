'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      setInputValue(initialInputValue);
      setInputError('');
    }
  }, [isOpen, initialInputValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresInput && inputRequired && !inputValue.trim()) {
      setInputError('This field is required.');
      return;
    }
    onConfirm(requiresInput ? inputValue.trim() : undefined);
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-[#49056B]" />;
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${getIconBg()}`}
            >
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                id="confirm-dialog-title"
                className="text-base font-bold text-zinc-900 tracking-tight"
              >
                {title}
              </h3>
              <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {requiresInput && (
            <div className="mt-4 pt-2">
              <label className="block text-[13px] font-medium text-zinc-700 mb-1">
                {inputLabel} {inputRequired && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (inputError) setInputError('');
                }}
                rows={3}
                placeholder={inputPlaceholder}
                className={`w-full p-3 text-sm bg-zinc-50 text-zinc-900 border rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#49056B]/20 focus:border-[#49056B] transition-all ${
                  inputError ? 'border-red-400' : 'border-zinc-300'
                }`}
                autoFocus
              />
              {inputError && (
                <p className="text-xs text-red-600 font-medium mt-1">{inputError}</p>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <AdminButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </AdminButton>
            <AdminButton
              type="button"
              variant={variant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              isLoading={isLoading}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );
}
