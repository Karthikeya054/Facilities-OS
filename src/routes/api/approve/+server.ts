import { error, redirect } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import { sendEmail } from '$lib/send-email';
import { approvalCompleteEmail, approvalRequestEmail } from '$lib/email-templates';
import { approvers, baseUrl, verifyApprovalToken } from '$lib/server/approvals';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const BASE_URL = baseUrl();
  const { l1Email, l1Name, l2Emails, l2Name, executorEmail } = approvers();
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action'); // approve or reject
  const level = url.searchParams.get('level'); // L1 or L2
  const exp = url.searchParams.get('exp');
  const sig = url.searchParams.get('sig');

  if (!id || !action || !level) {
    redirect(303, `${BASE_URL}/control-center`);
  }

  if (!verifyApprovalToken(id, level, action, exp, sig)) {
    error(403, 'This approval link is invalid or has expired.');
  }

  const supabase = createServiceClient();

  // Get requirement
  const { data: req } = await supabase.from('facility_requirements').select('*').eq('id', id).single();
  if (!req) redirect(303, `${BASE_URL}/control-center`);

  if (action === 'reject') {
    // Show reject page with reason textbox (carries the signed token through)
    redirect(303, `${BASE_URL}/approve-reject?${url.searchParams.toString()}`);
  }

  // APPROVE
  const now = new Date().toISOString();

  if (level === 'L1') {
    await supabase.from('facility_requirements').update({
      cm_approved_by_name: l1Name,
      cm_approved_by_email: l1Email,
      cm_approved_at: now,
      status: 'pending_l2',
      updated_at: now,
    }).eq('id', id);

    // Send L2 approval request
    const { data: items } = await supabase.from('facility_requirement_items').select('*').eq('requirement_id', id);
    const updatedReq = { ...req, cm_approved_by_name: l1Name };
    for (const email of l2Emails) {
      await sendEmail(email, `🔔 L2 Approval Needed: ${req.title} — ₹${(req.allocated_budget || 0).toLocaleString('en-IN')}`, approvalRequestEmail(updatedReq, items || [], l2Name, 'L2'));
    }

    // Notify raiser that L1 approved
    if (req.requested_by_email) {
      await sendEmail(req.requested_by_email, `✓ L1 Approved: ${req.title}`, `<div style="font-family:sans-serif;padding:20px"><h2 style="color:#059669">✓ L1 Approved</h2><p>Your requirement "${req.title}" has been approved by ${l1Name} (L1). It is now pending L2 approval.</p><a href="${BASE_URL}/request/${id}">View details →</a></div>`);
    }

  } else if (level === 'L2') {
    await supabase.from('facility_requirements').update({
      admin_approved_by_name: l2Name,
      admin_approved_by_email: l2Emails.join(', '),
      admin_approved_at: now,
      status: 'received', // fully approved, ready for procurement
      updated_at: now,
    }).eq('id', id);

    // Notify executor — all approvals done
    const { data: items } = await supabase.from('facility_requirement_items').select('*').eq('requirement_id', id);
    const fullReq = { ...req, cm_approved_by_name: req.cm_approved_by_name || l1Name, admin_approved_by_name: l2Name };
    if (executorEmail) {
      await sendEmail(executorEmail, `✅ All Approved — Ready: ${req.title} — ₹${(req.allocated_budget || 0).toLocaleString('en-IN')}`, approvalCompleteEmail(fullReq, items || []));
    }

    // Notify raiser
    if (req.requested_by_email) {
      await sendEmail(req.requested_by_email, `✅ Fully Approved: ${req.title}`, `<div style="font-family:sans-serif;padding:20px"><h2 style="color:#059669">✅ Fully Approved</h2><p>Your requirement "${req.title}" has received all approvals (L1 + L2). The procurement team has been notified to begin sourcing.</p><a href="${BASE_URL}/request/${id}">View details →</a></div>`);
    }
  }

  // Redirect to a success page
  redirect(303, `${BASE_URL}/request/${id}`);
};
