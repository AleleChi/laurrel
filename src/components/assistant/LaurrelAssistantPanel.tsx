'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
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

const INITIAL_MESSAGE: AssistantMessage = {
  id: 'msg-init-1',
  role: 'assistant',
  content:
    'Welcome to Laurrel Services. I can help with cleaning, moving, storage or an existing enquiry. What would you like to know?',
  timestamp: new Date().toISOString(),
  suggestedActions: [
    { label: 'Cleaning services', action: 'suggest_query', payload: 'Tell me about cleaning services in Ottawa' },
    { label: 'Plan a move', action: 'suggest_query', payload: 'How does moving coordination work in Ottawa?' },
    { label: 'Storage questions', action: 'suggest_query', payload: 'How does transitional storage work?' },
    { label: 'Request a quote', action: 'start_quote' },
    { label: 'Contact the team', action: 'human_handoff' },
  ],
};

export default function LaurrelAssistantPanel({ isOpen, onClose }: LaurrelAssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<AssistantEnquiryDraft>({ services: [] });
  const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

  // Human handoff specific form state
  const [handoffEmail, setHandoffEmail] = useState('');
  const [handoffName, setHandoffName] = useState('');
  const [handoffNote, setHandoffNote] = useState('');
  const [handoffSubmitted, setHandoffSubmitted] = useState(false);
  const [handoffReference, setHandoffReference] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

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

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content || isLoading) return;

    setInputText('');

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
          'We encountered a temporary connection issue. You can still reach our Ottawa team directly via our online enquiry forms.',
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

  const handleActionClick = (chip: ActionChip) => {
    if (chip.action === 'suggest_query' && chip.payload) {
      handleSendMessage(chip.payload);
    } else if (chip.action === 'start_quote') {
      handleSendMessage('I would like to request a quote');
    } else if (chip.action === 'human_handoff') {
      handleSendMessage('I would like to speak with someone from the Laurrel team');
    }
  };

  const handleConfirmEnquirySubmission = async () => {
    setIsSubmittingEnquiry(true);

    try {
      const payload = {
        intent: 'ai_assisted_enquiry',
        name: currentDraft.name || 'Laurrel Assistant Customer',
        email: currentDraft.email || 'customer@laurrel.ca',
        phone: currentDraft.phone || '',
        services: currentDraft.services.length > 0 ? currentDraft.services : ['cleaning' as ServiceCategory],
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
          content: `Your enquiry has been successfully registered under reference ${refId}. Our team in Ottawa will review your details and email your formal quote promptly.`,
          timestamp: new Date().toISOString(),
          isConfirmed: true,
          referenceId: refId,
          suggestedActions: [
            { label: 'Ask another question', action: 'suggest_query', payload: 'What other services do you offer?' },
            { label: 'Done for now', action: 'suggest_query', payload: 'Thank you, that is all' },
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
          'We were unable to submit the enquiry automatically. Please try again or open our main Request a Quote form.',
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
      // Handle error
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
      className="fixed bottom-0 right-0 z-50 w-full sm:bottom-6 sm:right-6 sm:w-[420px] max-w-full sm:max-w-[calc(100vw-3rem)] h-[90vh] sm:h-[620px] max-h-[700px] flex flex-col bg-[#F8F7F4] border border-[#202024]/15 sm:rounded-2xl shadow-2xl overflow-hidden text-[#202024]"
    >
      {/* Header */}
      <div className="bg-[#390044] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#C8E80B]" />
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white">Laurrel Assistant</h2>
            <p className="text-[11px] text-white/70">Automated Service Assistant · Ottawa, ON</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close assistant"
          className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8E80B]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Transparency & Canadian Privacy Notice Banner */}
      <div className="bg-[#390044]/5 px-4 py-2 border-b border-[#202024]/10 text-[11px] text-[#202024]/75 flex items-center justify-between shrink-0">
        <span>Automated assistant grounded in Laurrel Services data.</span>
        <span className="font-semibold text-[#390044]">Ottawa, Canada</span>
      </div>

      {/* Message Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#390044] text-white rounded-br-none shadow-sm'
                    : 'bg-white text-[#202024] rounded-bl-none border border-[#202024]/10 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>

                {/* Inline Confirmation Summary Card */}
                {msg.showConfirmation && currentDraft && !msg.isConfirmed && (
                  <div className="mt-4 p-3 bg-[#F8F7F4] rounded-xl border border-[#202024]/15 text-xs text-[#202024]">
                    <div className="font-bold text-[#390044] mb-2 text-xs uppercase tracking-wider">
                      Enquiry Summary
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div>
                        <span className="font-medium text-[#202024]/60">Services: </span>
                        <span className="font-semibold text-[#202024] capitalize">
                          {currentDraft.services.join(', ') || 'Cleaning'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-[#202024]/60">Location: </span>
                        <span className="font-semibold text-[#202024]">
                          {currentDraft.serviceLocation || 'Ottawa, ON'}
                        </span>
                      </div>
                      {currentDraft.preferredDate && (
                        <div>
                          <span className="font-medium text-[#202024]/60">Timing: </span>
                          <span className="font-semibold text-[#202024]">{currentDraft.preferredDate}</span>
                        </div>
                      )}
                      {currentDraft.details && (
                        <div>
                          <span className="font-medium text-[#202024]/60">Details: </span>
                          <span className="text-[#202024]">{currentDraft.details}</span>
                        </div>
                      )}
                      {currentDraft.email && (
                        <div>
                          <span className="font-medium text-[#202024]/60">Contact Email: </span>
                          <span className="font-semibold text-[#390044]">{currentDraft.email}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmEnquirySubmission}
                      disabled={isSubmittingEnquiry}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#390044] text-white font-semibold text-xs hover:bg-[#390044]/90 transition-all disabled:opacity-50"
                    >
                      {isSubmittingEnquiry ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting enquiry...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm & Submit Enquiry</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#C8E80B]" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Inline Human Handoff Card */}
                {msg.isHandoff && (
                  <div className="mt-4 p-3 bg-[#F8F7F4] rounded-xl border border-[#202024]/15 text-xs text-[#202024]">
                    <div className="font-bold text-[#390044] mb-1.5 text-xs">
                      Request Human Follow-up
                    </div>
                    {handoffSubmitted ? (
                      <div className="space-y-1 py-1">
                        <div className="flex items-center gap-1.5 text-[#390044] font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Request Logged ({handoffReference})
                        </div>
                        <p className="text-[11px] text-[#202024]/75">
                          A Laurrel team coordinator will review your note and contact you at {handoffEmail}.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleHumanHandoffSubmit} className="space-y-2 mt-2">
                        <input
                          type="text"
                          placeholder="Your Name (optional)"
                          value={handoffName}
                          onChange={(e) => setHandoffName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-[#202024]/20 focus:outline-none focus:ring-1 focus:ring-[#390044]"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Your Email Address *"
                          value={handoffEmail}
                          onChange={(e) => setHandoffEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-[#202024]/20 focus:outline-none focus:ring-1 focus:ring-[#390044]"
                        />
                        <textarea
                          placeholder="Brief note or question for the team"
                          rows={2}
                          value={handoffNote}
                          onChange={(e) => setHandoffNote(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-white border border-[#202024]/20 focus:outline-none focus:ring-1 focus:ring-[#390044] resize-none"
                        />
                        <button
                          type="submit"
                          disabled={isLoading || !handoffEmail}
                          className="w-full py-2 bg-[#390044] text-white text-xs font-semibold rounded-md hover:bg-[#390044]/90 disabled:opacity-50"
                        >
                          Send Request to Team
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Action Chips */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.suggestedActions.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleActionClick(chip)}
                      className="px-2.5 py-1 bg-white hover:bg-[#C8E80B]/20 text-[#390044] font-medium text-xs rounded-full border border-[#202024]/15 transition-all text-left"
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
          <div className="flex items-center gap-2 text-xs text-[#202024]/60 px-2 py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#390044]" />
            <span>Laurrel Assistant is typing...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-[#202024]/15 flex items-center gap-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about cleaning, moving, or storage..."
          className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-lg bg-[#F8F7F4] border border-[#202024]/15 text-[#202024] placeholder-[#202024]/40 focus:outline-none focus:ring-2 focus:ring-[#390044]/20 focus:border-[#390044]"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          aria-label="Send message"
          className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#390044] text-white hover:bg-[#390044]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <Send className="w-4 h-4 text-[#C8E80B]" />
        </button>
      </form>
    </div>
  );
}
