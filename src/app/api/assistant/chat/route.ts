import { NextRequest, NextResponse } from 'next/server';
import { processAssistantChat } from '@/lib/assistant/engine';
import { AssistantChatRequest } from '@/lib/assistant/types';

// In-memory sliding rate-limiter for assistant requests (15 requests per 60 seconds per client IP)
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 15;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipRequestHistory.set(ip, validTimestamps);
    return false;
  }

  validTimestamps.push(now);
  ipRequestHistory.set(ip, validTimestamps);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a minute before sending another message.',
        },
        { status: 429 }
      );
    }

    const body: AssistantChatRequest = await req.json();

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required.' },
        { status: 400 }
      );
    }

    // Input validation: message size & history turn limits
    const sanitizedMessages = body.messages.slice(-10).map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: String(m.content || '').slice(0, 1000).trim(),
    }));

    const lastMessage = sanitizedMessages[sanitizedMessages.length - 1];
    if (!lastMessage || !lastMessage.content) {
      return NextResponse.json(
        { error: 'Message content cannot be empty.' },
        { status: 400 }
      );
    }

    // Forward to dedicated Render backend if configured
    const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL;
    if (backendUrl) {
      try {
        const target = `${backendUrl.replace(/\/$/, '')}/api/assistant/chat`;
        const res = await fetch(target, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': clientIp,
          },
          body: JSON.stringify({
            messages: sanitizedMessages,
            draft: body.draft,
            sessionId: body.sessionId,
          }),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (forwardErr) {
        console.warn('[Assistant API] Backend forward failed, falling back to local engine:', forwardErr);
      }
    }

    // Call server-side assistant engine
    const response = await processAssistantChat({
      messages: sanitizedMessages,
      draft: body.draft,
      sessionId: body.sessionId,
    });


    return NextResponse.json(response);
  } catch (error) {
    console.error('[Assistant Chat API error]:', error);
    return NextResponse.json(
      {
        reply:
          'Our assistant is experiencing a temporary connection issue. Please feel free to use our Request a Quote form or contact us directly at our contact page.',
        suggestedActions: [
          { label: 'Request a Quote', action: 'start_quote' },
          { label: 'Contact Us', action: 'human_handoff' },
        ],
      },
      { status: 200 } // Graceful recovery with 200 and helpful fallback
    );
  }
}
