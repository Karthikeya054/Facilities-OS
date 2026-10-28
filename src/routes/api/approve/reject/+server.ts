import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import { sendEmail } from '$lib/send-email';
import { rejectionEmail } from '$lib/email-templates';
import { approvers, verifyApprovalToken } from '$lib/server/approvals';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { id, level, reason, exp, sig } = await request.json();
    if (!id || !reason) return json({ error: 'id and reason required' }, { status: 400 });
    if (!verifyApprovalToken(id, level, 'reject', exp, sig)) return json({ error: 'Invalid or expired link' }, { status: 403 });

    const supabase = createServiceClient();
    const { data: req } = await supabase.from('facility_requirements').select('*').eq('id', id).single();
    if (!req) return json({ error: 'Not found' }, { status: 404 });

    const { l1Name, l2Name } = approvers();
    const rejectorName = level === 'L1' ? l1Name : l2Name;

    // Update status
    await supabase.from('facility_requirements').update({
      status: 'rejected',
      delivery_notes: req.delivery_notes, // preserve
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    // Notify raiser
    if (req.requested_by_email) {
      await sendEmail(
        req.requested_by_email,
        `✗ Rejected: ${req.title} — ${level}`,
        rejectionEmail(req, rejectorName, level, reason)
      );
    }

    return json({ success: true });
  } catch (e) {
    console.error('Reject error:', e);
    return json({ error: 'Failed' }, { status: 500 });
  }
};
