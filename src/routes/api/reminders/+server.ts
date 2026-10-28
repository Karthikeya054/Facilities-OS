import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import { sendEmail } from '$lib/send-email';
import { dailyReminderEmail, approvalRequestEmail } from '$lib/email-templates';
import { env } from '$env/dynamic/private';
import { approvers, baseUrl } from '$lib/server/approvals';
import type { RequestHandler } from './$types';

// Call this endpoint via cron: GET /api/reminders?secret=$REMINDERS_SECRET
// Schedule: 9 AM, 2 PM, 6 PM IST

export const GET: RequestHandler = async ({ url }) => {
  const secret = url.searchParams.get('secret');
  if (!env.REMINDERS_SECRET || secret !== env.REMINDERS_SECRET) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { l1Email: L1_EMAIL, l1Name: L1_NAME, l2Emails: L2_EMAILS, l2Name } = approvers();

  const supabase = createServiceClient();
  const results: string[] = [];

  // Get pending L1 requests
  const { data: pendingL1 } = await supabase
    .from('facility_requirements')
    .select('*')
    .eq('status', 'pending_l1')
    .eq('source', 'internal');

  // Get pending L2 requests
  const { data: pendingL2 } = await supabase
    .from('facility_requirements')
    .select('*')
    .eq('status', 'pending_l2')
    .eq('source', 'internal');

  // Check urgency: if need_by_date is within 2 days, send individual emails too
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Send L1 reminders
  if (pendingL1 && pendingL1.length > 0) {
    // Calculate notification count (how many times we've reminded)
    // Simple: count days since created
    const notifyCount = Math.max(1, Math.ceil((now.getTime() - new Date(pendingL1[0].created_at).getTime()) / (24 * 60 * 60 * 1000)));

    if (L1_EMAIL) await sendEmail(
      L1_EMAIL,
      `⏰ ${pendingL1.length} pending L1 approval${pendingL1.length > 1 ? 's' : ''} — FundFlow Facilities`,
      dailyReminderEmail(L1_NAME, pendingL1, 'L1', notifyCount)
    );
    results.push(`L1 reminder sent to ${L1_EMAIL} for ${pendingL1.length} requests`);

    // For urgent ones (within 2 days), send individual detailed emails
    for (const req of pendingL1) {
      if (req.required_by_date && new Date(req.required_by_date) <= twoDaysFromNow) {
        const { data: items } = await supabase.from('facility_requirement_items').select('*').eq('requirement_id', req.id);
        await sendEmail(
          L1_EMAIL,
          `🚨 URGENT: "${req.title}" needs L1 approval — due ${req.required_by_date}`,
          approvalRequestEmail(req, items || [], L1_NAME, 'L1')
        );
        results.push(`URGENT L1 sent for: ${req.title}`);

        // Also notify the raiser about pending status
        if (req.requested_by_email) {
          await sendEmail(
            req.requested_by_email,
            `⏳ Your request "${req.title}" is still pending L1 approval (reminder #${notifyCount})`,
            `<div style="font-family:sans-serif;padding:20px;max-width:500px"><h3 style="color:#d97706">⏳ Still Pending L1 Approval</h3><p>Your requirement <strong>"${req.title}"</strong> (₹${(req.allocated_budget || 0).toLocaleString('en-IN')}) is still pending L1 approval from ${L1_NAME}.</p><p>Reminder count: <strong>#${notifyCount}</strong></p><p>Need by: <strong>${req.required_by_date || 'Not set'}</strong></p><a href="${baseUrl()}/my-requests" style="display:inline-block;background:#0a0a0a;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:10px">View My Requests →</a></div>`
          );
          results.push(`Raiser notified: ${req.requested_by_email}`);
        }
      }
    }
  }

  // Send L2 reminders
  if (pendingL2 && pendingL2.length > 0) {
    const notifyCount = Math.max(1, Math.ceil((now.getTime() - new Date(pendingL2[0].created_at).getTime()) / (24 * 60 * 60 * 1000)));

    for (const email of L2_EMAILS) {
      const name = l2Name;
      await sendEmail(
        email,
        `⏰ ${pendingL2.length} pending L2 approval${pendingL2.length > 1 ? 's' : ''} — FundFlow Facilities`,
        dailyReminderEmail(name, pendingL2, 'L2', notifyCount)
      );
      results.push(`L2 reminder sent to ${email} for ${pendingL2.length} requests`);
    }

    // Urgent individual L2 emails
    for (const req of pendingL2) {
      if (req.required_by_date && new Date(req.required_by_date) <= twoDaysFromNow) {
        const { data: items } = await supabase.from('facility_requirement_items').select('*').eq('requirement_id', req.id);
        for (const email of L2_EMAILS) {
          const name = l2Name;
          await sendEmail(
            email,
            `🚨 URGENT: "${req.title}" needs L2 approval — due ${req.required_by_date}`,
            approvalRequestEmail(req, items || [], name, 'L2')
          );
        }
        results.push(`URGENT L2 sent for: ${req.title}`);
      }
    }
  }

  if (results.length === 0) {
    results.push('No pending approvals — nothing to send');
  }

  return json({ success: true, results, pendingL1: pendingL1?.length || 0, pendingL2: pendingL2?.length || 0 });
};
