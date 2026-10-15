import { Router, Request, Response } from 'express';
import { processAssistantChat } from '../services/assistant/engine';

export const assistantRouter = Router();

// In-memory sliding rate-limiter: Max 15 messages per 60s per IP
const chatLimits = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = chatLimits.get(ip) || [];
  const valid = timestamps.filter((t) => now - t < 60000);

  if (valid.length >= 15) {
    chatLimits.set(ip, valid);
    return false;
  }

  valid.push(now);
  chatLimits.set(ip, valid);
  return true;
}

assistantRouter.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    if (!checkRateLimit(ip)) {
      res.status(429).json({
        error: 'Rate limit exceeded. Please wait a minute before sending another message.',
      });
      return;
    }

    const { messages, draft, sessionId } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    const sanitized = messages.slice(-10).map((m: any) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: String(m.content || '').slice(0, 1000).trim(),
    }));

    const response = await processAssistantChat({
      messages: sanitized,
      draft,
      sessionId,
    });

    res.status(200).json(response);
  } catch (error: any) {
    console.error('[Assistant Chat Error]:', error.message);
    res.status(200).json({
      reply: 'Our assistant is experiencing a temporary connection issue. Please feel free to use our Request a Quote form or contact us directly.',
      suggestedActions: [
        { label: 'Request a Quote', action: 'start_quote' },
        { label: 'Contact Us', action: 'human_handoff' },
      ],
    });
  }
});
