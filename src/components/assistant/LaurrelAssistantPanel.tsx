'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X,
  ArrowUp,
  RotateCcw,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  AssistantMessage,
  ActionChip,
  AssistantEnquiryDraft,
  AssistantChatResponse,
} from '@/lib/assistant/types';
import { ServiceCategory } from '@/lib/types/enquiry';

interface LaurrelAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_SUGGESTIONS: ActionChip[] = [
  { label: 'Cleaning services', action: 'suggest_query', payload: 'Tell me about cleaning services in Ottawa' },
  { label: 'Moving services', action: 'suggest_query', payload: 'How does moving coordination work in Ottawa?' },
  { label: 'Storage options', action: 'suggest_query', payload: 'How does transitional storage work?' },
  { label: 'Request a quote', action: 'start_quote' },
];

const INITIAL_MESSAGES: AssistantMessage[] = [
  {
    id: 'msg-init-1',
    role: 'assistant',
    content:
      'Welcome to Laurrel Services. I can help you with cleaning, moving, storage or a service enquiry.\n\nWhat would you like help with?',
    timestamp: new Date().toISOString(),
    suggestedActions: INITIAL_SUGGESTIONS,
  },
];

/**
 * Clean renderer for assistant markdown and internal links
 */
function FormattedAssistantText({ text }: { text: string }) {
  // Parse paragraphs and bullet lists cleanly
  const paragraphs = text.split(/\n\n+/);

  return (
    <div className="space-y-2.5">
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        const isBulletList = lines.every((line) => line.trim().startsWith('- ') || line.trim().startsWith('* '));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="list-disc pl-4 space-y-1 text-[#202024]/90 text-[14px] leading-[1.6]">
              {lines.map((item, iIdx) => {
                const cleaned = item.replace(/^[-*]\s+/, '');
                return <li key={iIdx}>{renderInlineFormatting(cleaned)}</li>;
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="text-[#202024]/95 text-[14px] leading-[1.6] break-words">
            {renderInlineFormatting(para)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode[] {
  // Match markdown links [label](href) and bold **text**
  const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('[') && part.includes('](')) {
      const labelMatch = part.match(/\[(.*?)\]/);
      const urlMatch = part.match(/\((.*?)\)/);
      if (labelMatch && urlMatch) {
        const href = urlMatch[1];
        const label = labelMatch[1];
        return (
          <Link
            key={index}
            href={href}
            className="text-[#390044] font-semibold underline decoration-[#390044]/30 underline-offset-2 hover:decoration-[#390044] transition-colors"
          >
            {label}
          </Link>
        );
      }
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-[#202024]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

export default function LaurrelAssistantPanel({ isOpen, onClose }: LaurrelAssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<AssistantEnquiryDraft>({ services: [] });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Human handoff specific form state
  const [handoffEmail, setHandoffEmail] = useState('');
  const [handoffName, setHandoffName] = useState('');
  const [handoffNote, setHandoffNote] = useState('');
  const [handoffSubmitted, setHandoffSubmitted] = useState(false);
  const [handoffReference, setHandoffReference] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isSubmittingEnquiry]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Adjust textarea height dynamically
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 40), 120)}px`;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isLoading) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
    }

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          draft: currentDraft,
        }),
      });

      if (!res.ok) {
        throw new Error('Network error');
      }

      const data: AssistantChatResponse = await res.json();

      if (data.draft) {
        setCurrentDraft(data.draft);
      }

      const assistantMsg: AssistantMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        suggestedActions: data.suggestedActions,
        enquiryDraft: data.draft,
        showConfirmation: data.showConfirmation,
        isHandoff: data.isHandoff,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: AssistantMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content:
          "I couldn't complete that request. Please try again or use our [Contact page](/contact) to reach our Ottawa team directly.",
        timestamp: new Date().toISOString(),
        suggestedActions: [
          { label: 'Request a Quote Online', action: 'start_quote' },
          { label: 'Contact Us', action: 'human_handoff' },
        ],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (chip: ActionChip) => {
    if (chip.action === 'suggest_query' && chip.payload) {
      handleSendMessage(chip.payload);
    } else if (chip.action === 'start_quote') {
      handleSendMessage('I would like to request a quote');
    } else if (chip.action === 'human_handoff') {
      handleSendMessage('Can I speak with someone from the Laurrel team?');
    }
  };

  const handleNewConversation = () => {
    if (messages.length > 2 && currentDraft.services?.length) {
      setShowResetConfirm(true);
    } else {
      executeReset();
    }
  };

  const executeReset = () => {
    setMessages(INITIAL_MESSAGES);
    setCurrentDraft({ services: [] });
    setInputText('');
    setHandoffSubmitted(false);
    setHandoffReference(null);
    setShowResetConfirm(false);
  };

  const handleConfirmEnquirySubmission = async () => {
    setIsSubmittingEnquiry(true);

    try {
      const payload = {
        intent: 'ai_assisted_enquiry',
        name: currentDraft.name || 'Laurrel Assistant Customer',
        email: currentDraft.email || 'customer@laurrel.ca',
        phone: currentDraft.phone || '',
        services: currentDraft.services.length > 0 ? currentDraft.services : (['cleaning'] as ServiceCategory[]),
        serviceLocation: currentDraft.serviceLocation || 'Ottawa, ON',
        preferredDate: currentDraft.preferredDate || '',
        details: currentDraft.details || 'Enquiry prepared with Laurrel Assistant',
      };

      const res = await fetch('/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const refId = data.referenceId;
        const confirmMsg: AssistantMessage = {
          id: `msg-${Date.now()}-success`,
          role: 'assistant',
          content: `Your enquiry has been successfully registered under reference **${refId}**.\n\nOur Ottawa team will review your requirements and follow up with a clear quote.`,
          timestamp: new Date().toISOString(),
          isConfirmed: true,
          referenceId: refId,
          suggestedActions: [
            { label: 'Cleaning services', action: 'suggest_query', payload: 'Tell me about cleaning services in Ottawa' },
            { label: 'Moving services', action: 'suggest_query', payload: 'How does moving coordination work in Ottawa?' },
          ],
        };
        setMessages((prev) => [...prev, confirmMsg]);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      const failMsg: AssistantMessage = {
        id: `msg-${Date.now()}-submit-fail`,
        role: 'assistant',
        content:
          'We were unable to submit the enquiry automatically. Please try submitting again or use our [Contact page](/contact).',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, failMsg]);
    } finally {
      setIsSubmittingEnquiry(false);
    }
  };

  const handleHumanHandoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoffEmail) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/enquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'human_handoff',
          name: handoffName || 'Laurrel Visitor',
          email: handoffEmail,
          message: handoffNote || 'Customer requested team contact via Laurrel Assistant.',
          details: handoffNote || 'Customer requested team contact via Laurrel Assistant.',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHandoffSubmitted(true);
        setHandoffReference(data.referenceId);
      }
    } catch (err) {
      // Handle error gracefully
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Laurrel Assistant"
      className="fixed inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-[84px] sm:right-6 z-50 w-full sm:w-[440px] h-[92dvh] sm:h-[620px] max-h-[640px] flex flex-col bg-[#FAF9F6] border border-[#202024]/12 sm:rounded-[18px] shadow-[0_16px_48px_rgba(32,32,36,0.14)] overflow-hidden text-[#202024] animate-in fade-in duration-200"
    >
      {/* Header */}
      <header className="bg-[#390044] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-white/10 select-none">
        <div className="flex flex-col">
          <h2 className="text-[16px] font-bold tracking-tight text-white leading-tight">
            Laurrel Assistant
          </h2>
          <p className="text-[12.5px] text-white/75 font-normal leading-normal">
            AI-powered customer assistant
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleNewConversation}
            title="Start new conversation"
            aria-label="Start new conversation"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close assistant"
            aria-label="Close assistant"
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Reset Confirmation Prompt */}
      {showResetConfirm && (
        <div className="bg-[#390044]/10 border-b border-[#390044]/15 px-4 py-2.5 flex items-center justify-between text-xs text-[#202024]">
          <span>Clear current conversation and start over?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={executeReset}
              className="px-2.5 py-1 bg-[#390044] text-white font-medium rounded-md hover:bg-[#390044]/90"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="px-2.5 py-1 bg-white text-[#202024] font-medium border border-[#202024]/20 rounded-md hover:bg-[#F8F7F4]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label="Conversation history"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 focus:outline-none"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-[14px] px-4 py-3 leading-[1.6] ${
                  isUser
                    ? 'max-w-[82%] bg-[#390044] text-white rounded-br-sm shadow-sm text-[14.5px]'
                    : 'max-w-[88%] bg-white text-[#202024] rounded-bl-sm border border-[#202024]/10 shadow-[0_1px_3px_rgba(32,32,36,0.04)] text-[14px]'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-line text-white">{msg.content}</p>
                ) : (
                  <FormattedAssistantText text={msg.content} />
                )}

                {/* Inline Confirmation Summary Card */}
                {msg.showConfirmation && currentDraft && !msg.isConfirmed && (
                  <div className="mt-3.5 pt-3 border-t border-[#202024]/10 text-xs text-[#202024]">
                    <div className="font-semibold text-[#390044] mb-2 text-xs uppercase tracking-wider">
                      Enquiry Summary
                    </div>
                    <div className="space-y-1.5 mb-3 bg-[#FAF9F6] p-2.5 rounded-lg border border-[#202024]/10">
                      <div>
                        <span className="text-[#202024]/60 font-medium">Service: </span>
                        <span className="font-semibold text-[#202024] capitalize">
                          {currentDraft.services?.join(', ') || 'Cleaning'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#202024]/60 font-medium">Location: </span>
                        <span className="font-semibold text-[#202024]">
                          {currentDraft.serviceLocation || 'Ottawa, ON'}
                        </span>
                      </div>
                      {currentDraft.preferredDate && (
                        <div>
                          <span className="text-[#202024]/60 font-medium">Preferred Date: </span>
                          <span className="font-semibold text-[#202024]">{currentDraft.preferredDate}</span>
                        </div>
                      )}
                      {currentDraft.details && (
                        <div>
                          <span className="text-[#202024]/60 font-medium">Job Details: </span>
                          <span className="text-[#202024]">{currentDraft.details}</span>
                        </div>
                      )}
                      {currentDraft.email && (
                        <div>
                          <span className="text-[#202024]/60 font-medium">Contact: </span>
                          <span className="font-semibold text-[#390044]">{currentDraft.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendMessage('I would like to edit my enquiry details')}
                        className="flex-1 py-2 px-3 rounded-lg bg-white border border-[#202024]/20 text-[#202024] font-medium text-xs hover:bg-[#F8F7F4] transition-colors"
                      >
                        Edit details
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmEnquirySubmission}
                        disabled={isSubmittingEnquiry}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#390044] text-white font-semibold text-xs hover:bg-[#390044]/90 transition-colors disabled:opacity-50"
                      >
                        {isSubmittingEnquiry ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Submitting…</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Enquiry</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Human Handoff Card */}
                {msg.isHandoff && (
                  <div className="mt-3.5 pt-3 border-t border-[#202024]/10 text-xs text-[#202024]">
                    <div className="font-semibold text-[#390044] mb-1.5 text-xs">
                      Request a follow-up from our team
                    </div>
                    {handoffSubmitted ? (
                      <div className="space-y-1 py-1.5 bg-[#FAF9F6] p-2.5 rounded-lg border border-[#202024]/10">
                        <div className="flex items-center gap-1.5 text-[#390044] font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Request Recorded ({handoffReference})</span>
                        </div>
                        <p className="text-[11.5px] text-[#202024]/75">
                          A team member will review your note and contact you at {handoffEmail}.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleHumanHandoffSubmit} className="space-y-2 mt-2">
                        <input
                          type="text"
                          placeholder="Your Name (optional)"
                          value={handoffName}
                          onChange={(e) => setHandoffName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FAF9F6] border border-[#202024]/15 focus:outline-none focus:ring-1 focus:ring-[#390044]"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Your Email Address *"
                          value={handoffEmail}
                          onChange={(e) => setHandoffEmail(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FAF9F6] border border-[#202024]/15 focus:outline-none focus:ring-1 focus:ring-[#390044]"
                        />
                        <textarea
                          placeholder="Note or question for our team"
                          rows={2}
                          value={handoffNote}
                          onChange={(e) => setHandoffNote(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-md bg-[#FAF9F6] border border-[#202024]/15 focus:outline-none focus:ring-1 focus:ring-[#390044] resize-none"
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !handoffEmail}
                          className="w-full py-2 bg-[#390044] text-white text-xs font-semibold rounded-md hover:bg-[#390044]/90 disabled:opacity-50 transition-colors"
                        >
                          Send Request to Team
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Functional Suggestion Chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.suggestedActions.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleActionClick(chip)}
                      className="px-3 py-1.5 bg-white hover:bg-[#390044]/5 text-[#390044] font-medium text-[12.5px] rounded-full border border-[#202024]/15 shadow-sm transition-all text-left"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#202024]/70 px-2 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#390044]" />
            <span className="italic">Preparing a response…</span>
          </div>
        )}
      </div>

      {/* Message Composer */}
      <footer className="p-3 bg-white border-t border-[#202024]/10 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2 bg-[#FAF9F6] border border-[#202024]/15 rounded-[12px] p-1.5 focus-within:ring-2 focus-within:ring-[#390044]/20 focus-within:border-[#390044] transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about cleaning, moving, or storage…"
            aria-label="Your message to Laurrel Assistant"
            className="flex-1 px-2.5 py-1 text-[14px] leading-[1.4] bg-transparent text-[#202024] placeholder-[#202024]/40 focus:outline-none resize-none max-h-[120px] min-h-[38px]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            aria-label="Send message"
            className="w-8 h-8 rounded-full bg-[#390044] text-white flex items-center justify-center hover:bg-[#390044]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 mb-0.5"
          >
            <ArrowUp className="w-4 h-4 text-white stroke-[2.5]" />
          </button>
        </form>
      </footer>
    </div>
  );
}
