import { IEmailProvider } from './types';
import { ResendEmailProvider } from './resendProvider';
import { SmtpEmailProvider } from './smtpProvider';

let providerInstance: IEmailProvider | null = null;

export function getEmailProvider(): IEmailProvider {
  if (!providerInstance) {
    const providerType = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase().trim();

    if (providerType === 'smtp') {
      console.log('[Email Dispatcher] Initializing SMTP Email Provider');
      providerInstance = new SmtpEmailProvider();
    } else {
      console.log('[Email Dispatcher] Initializing Resend Email Provider');
      providerInstance = new ResendEmailProvider();
    }
  }

  return providerInstance;
}

export * from './types';
