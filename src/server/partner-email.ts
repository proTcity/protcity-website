import type { PartnerWorkerBindings } from '../partner-worker';
import { processPartnerNotifications, type PartnerAdminEnv, type PartnerNotification } from './partner-admin';

export interface PartnerEmailEnv extends PartnerAdminEnv {
  PARTNER_EMAIL?: PartnerWorkerBindings['PARTNER_EMAIL'];
  PARTNER_NOTIFICATION_TO?: string;
}

/** Neither recipient nor content may be supplied by an applicant or an Admin request.
 * Cloudflare owns Message-ID; the X header is correlation only, not deduplication. */
export async function sendPartnerNotification(env: PartnerEmailEnv, notification: PartnerNotification): Promise<void> {
  const recipient = env.PARTNER_NOTIFICATION_TO?.trim();
  if (!env.PARTNER_EMAIL || !recipient || recipient.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(recipient)
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(notification.applicationId)) {
    throw new Error('partner_email_not_configured');
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      env.PARTNER_EMAIL.send({
        to: recipient,
        from: 'notifications@protcity.com',
        subject: 'proTcity - Nuova candidatura partner',
        text: `È stata ricevuta una nuova candidatura partner.\n\nRiferimento: ${notification.applicationId}\n\nAccedi alla console Admin per consultarla e aggiornarne lo stato:\nhttps://admin.protcity.com/partner-applications\n\nQuesta email è un avviso interno. I dati del candidato sono disponibili nella console protetta.`,
        headers: { 'Auto-Submitted': 'auto-generated', 'X-Protcity-Application': notification.applicationId }
      }),
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('partner_email_timeout')), 20_000);
      })
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/** Scheduled only: a batch of ten bounded sends can exceed request waitUntil's
 * 30-second lifetime. The durable outbox survives failed/crashed cron invocations. */
export async function runPartnerEmailNotifications(env: PartnerEmailEnv) {
  if (env.PARTNER_EMAIL_ENABLED !== 'true') return;
  if (!env.PARTNER_EMAIL || !env.PARTNER_NOTIFICATION_TO) throw new Error('partner_email_not_configured');
  try {
    const result = await processPartnerNotifications(env, notification => sendPartnerNotification(env, notification));
    if (result.sent || result.failed) console.info(JSON.stringify({ event: 'partner_email_batch', ...result }));
  } catch {
    console.error(JSON.stringify({ event: 'partner_email_batch_failed' }));
    throw new Error('partner_email_batch_failed');
  }
}
