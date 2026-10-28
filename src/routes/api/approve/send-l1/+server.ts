import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import { sendEmail } from '$lib/send-email';
import { approvalRequestEmail } from '$lib/email-templates';
import { approvers } from '$lib/server/approvals';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { requirement_id } = await request.json();
    const supabase = createServiceClient();

    const { data: req } = await supabase.from('facility_requirements').select('*').eq('id', requirement_id).single();
    if (!req) return json({ error: 'Not found' }, { status: 404 });

    const { data: items } = await supabase.from('facility_requirement_items').select('*').eq('requirement_id', requirement_id);

    // Send L1 approval email
    const { l1Email, l1Name } = approvers();
    if (!l1Email) return json({ error: 'L1_APPROVER_EMAIL not configured' }, { status: 500 });
    await sendEmail(
      l1Email,
      `🔔 L1 Approval Needed: ${req.title} — ₹${(req.allocated_budget || 0).toLocaleString('en-IN')}`,
      approvalRequestEmail(req, items || [], l1Name, 'L1')
    );

    return json({ success: true });
  } catch (e) {
    console.error('Send L1 error:', e);
    return json({ error: 'Failed' }, { status: 500 });
  }
};
