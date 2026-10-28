import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createServiceClient } from '$lib/supabase';
import { sendEmail } from '$lib/send-email';
import { uniconnectRequestEmail } from '$lib/email-templates';
import type { RequestHandler } from './$types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Store attachments on the first item of a requirement
async function updateAttachments(supabase: ReturnType<typeof createServiceClient>, requirementId: string, attachments: Record<string, string>[]) {
  if (!attachments || attachments.length === 0) return;

  const supporting = attachments.filter(a => a.category !== 'BILL').map(a => a.file_url).filter(Boolean);
  const bills = attachments.filter(a => a.category === 'BILL').map(a => a.file_url).filter(Boolean);

  // Get first item to attach files to
  const { data: items } = await supabase
    .from('facility_requirement_items')
    .select('id')
    .eq('requirement_id', requirementId)
    .order('created_at')
    .limit(1);

  if (items && items.length > 0) {
    const update: Record<string, string[]> = {};
    if (supporting.length > 0) update.reference_image_urls = supporting;
    if (bills.length > 0) update.design_file_urls = bills;
    if (Object.keys(update).length > 0) {
      await supabase.from('facility_requirement_items').update(update).eq('id', items[0].id);
    }
  } else {
    // No items exist — create a placeholder item to hold attachments
    await supabase.from('facility_requirement_items').insert({
      requirement_id: requirementId,
      item_type: 'ATTACHMENTS',
      description: 'Uploaded files from UniConnect',
      quantity: attachments.length,
      unit_price: 0,
      total_price: 0,
      reference_image_urls: supporting.length > 0 ? supporting : null,
      design_file_urls: bills.length > 0 ? bills : null,
    });
  }
}

// Map UniConnect approval_status to our facility status
function mapStatus(proposal: Record<string, unknown>): string {
  const status = (proposal.approval_status as string || '').toUpperCase();
  const canProceed = proposal.can_proceed as boolean;

  if (status === 'EVENT_COMPLETED') return 'completed';
  if (status === 'DELIVERED') return 'delivered';
  if (status === 'IN_TRANSIT') return 'in_transit';
  if (status === 'IN_PRODUCTION') return 'in_production';
  if (status === 'APPROVED' || (status === 'APPROVED_L1' && canProceed)) return 'received';
  if (status === 'APPROVED_L1') return 'received';
  if (status === 'REJECTED') return 'received';
  if (status === 'SUBMITTED' || status === 'PENDING') return 'received';
  return 'received';
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const secret = request.headers.get('x-webhook-secret') || request.headers.get('authorization')?.replace('Bearer ', '');
    if (env.WEBHOOK_SECRET && secret !== env.WEBHOOK_SECRET) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createServiceClient();

    const proposal = body.proposal || body;
    const items = body.items || [];
    const approvals = body.approvals || [];

    const cmaApproval = approvals.find((a: Record<string, string>) => a.role === 'CMA_MANAGER');
    // Also check proposal-level approval fields (UniConnect sends these directly)
    const cmaName = cmaApproval?.name || proposal.cm_approved_by_name || proposal.approved_by_name || proposal.approver_name || null;
    const cmaEmail = cmaApproval?.email || proposal.cm_approved_by_email || proposal.approved_by_email || proposal.approver_email || null;
    const cmaAt = cmaApproval?.approved_at || proposal.cm_approved_at || proposal.approved_at || (cmaName ? new Date().toISOString() : null);

    const budgetAmount = proposal.approved_total_budget || proposal.estimated_total_budget || proposal.budget || 0;
    const adminApproval = budgetAmount >= 10000 ? approvals.find((a: Record<string, string>) => a.role === 'ADMIN') : null;

    const proposalId = proposal.id && UUID_RE.test(proposal.id) ? proposal.id : null;

    let universityId: string | null = null;
    if (proposal.university_id && UUID_RE.test(proposal.university_id)) {
      universityId = proposal.university_id;
    }

    const itemsTotal = items.reduce((sum: number, i: Record<string, unknown>) => {
      const qty = (i.qty as number) || (i.quantity as number) || 1;
      const cost = (i.unit_cost as number) || (i.unit_price as number) || 0;
      return sum + qty * cost;
    }, 0);
    const budget = proposal.approved_total_budget || proposal.estimated_total_budget || proposal.budget || itemsTotal || 0;
    const priority = (proposal.priority || 'medium').toLowerCase().replace('med', 'medium');
    const universityName = proposal.university_name || null;
    const facilityStatus = mapStatus(proposal);

    // Check for existing requirement with same budget_proposal_id
    if (proposalId) {
      const { data: existing } = await supabase
        .from('facility_requirements')
        .select('id, status')
        .eq('budget_proposal_id', proposalId)
        .limit(1);

      if (existing && existing.length > 0) {
        // UPDATE existing requirement with latest data from UniConnect
        const existingId = existing[0].id;

        // Only update status if the new status is further along or the existing is still 'received'
        const shouldUpdateStatus = existing[0].status === 'received' || facilityStatus === 'completed' || facilityStatus === 'delivered';

        const updateData: Record<string, unknown> = {
          // Always update approval info
          cm_approved_by_name: cmaName || undefined,
          cm_approved_by_email: cmaEmail || undefined,
          cm_approved_at: cmaAt || undefined,
          admin_approved_by_name: adminApproval?.name || undefined,
          admin_approved_by_email: adminApproval?.email || undefined,
          admin_approved_at: adminApproval?.approved_at || undefined,
          // Only update budget if new value is greater than 0 (never overwrite with 0)
          allocated_budget: budget > 0 ? budget : undefined,
          // Update title/description if changed
          title: proposal.title || undefined,
          description: proposal.description || undefined,
          // Update university info
          delivery_notes: universityName || undefined,
          delivery_location: proposal.venue || undefined,
          priority,
          updated_at: new Date().toISOString(),
        };

        if (shouldUpdateStatus) {
          updateData.status = facilityStatus;
        }

        // Remove undefined values
        const cleanUpdate: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(updateData)) {
          if (v !== undefined) cleanUpdate[k] = v;
        }

        const { data: updated, error: updateErr } = await supabase
          .from('facility_requirements')
          .update(cleanUpdate)
          .eq('id', existingId)
          .select()
          .single();

        if (updateErr) return json({ error: updateErr.message }, { status: 500 });

        // Update attachments on existing items
        await updateAttachments(supabase, existingId, body.attachments || []);

        return json({ success: true, requirement_id: existingId, status: 'updated', facility_status: updated.status }, { status: 200 });
      }
    }

    // INSERT new requirement
    const { data: req, error: reqErr } = await supabase
      .from('facility_requirements')
      .insert({
        budget_proposal_id: proposalId,
        source: 'uniconnect',
        title: proposal.title || proposal.description || 'New request from UniConnect',
        description: proposal.description || null,
        university_id: universityId,
        requested_by_name: proposal.proposer_name || proposal.requester_name || 'Unknown',
        requested_by_email: proposal.proposer_email || proposal.requester_email || 'unknown@uniconnect.app',
        cm_approved_by_name: cmaName || null,
        cm_approved_by_email: cmaEmail || null,
        cm_approved_at: cmaAt || null,
        admin_approved_by_name: adminApproval?.name || null,
        admin_approved_by_email: adminApproval?.email || null,
        admin_approved_at: adminApproval?.approved_at || null,
        allocated_budget: budget,
        required_by_date: proposal.proposed_date || proposal.need_by_date || null,
        delivery_location: proposal.venue || null,
        delivery_notes: universityName,
        priority,
        status: facilityStatus,
      })
      .select()
      .single();

    if (reqErr) return json({ error: reqErr.message }, { status: 500 });

    // Insert items
    if (items.length > 0) {
      const itemRows = items.map((item: Record<string, unknown>) => {
        const qty = (item.qty as number) || (item.quantity as number) || 1;
        const unitCost = (item.unit_cost as number) || (item.unit_price as number) || 0;
        const total = (item.amount as number) || (item.total_price as number) || qty * unitCost;
        return {
          requirement_id: req.id,
          item_type: (item.category as string) || (item.type as string) || (item.item_type as string) || 'General',
          description: (item.description as string) || (item.label as string) || (item.name as string) || null,
          quantity: qty,
          unit_price: unitCost,
          total_price: total,
          material: (item.vendor_name as string) || null,
          design_notes: (item.quotation_url as string) || null,
        };
      });
      await supabase.from('facility_requirement_items').insert(itemRows);
    }

    // Store attachments on items
    await updateAttachments(supabase, req.id, body.attachments || []);

    // Auto-notify all facilities team members via email
    try {
      const { data: teamMembers } = await supabase.from('facility_team_members').select('email, name').eq('is_active', true);
      if (teamMembers && teamMembers.length > 0) {
        const teamEmails = teamMembers.map(m => m.email);
        const { data: reqItems } = await supabase.from('facility_requirement_items').select('*').eq('requirement_id', req.id);
        const emailHtml = uniconnectRequestEmail(req, reqItems || []);
        const campus = universityName || 'Campus';
        await sendEmail(
          teamEmails,
          `🔔 New Request: ${req.title} — ${campus} — ₹${(budget || 0).toLocaleString('en-IN')}`,
          emailHtml
        );
      }
    } catch (emailErr) {
      console.warn('[WEBHOOK] Team notification email failed:', emailErr);
    }

    return json({ success: true, requirement_id: req.id, status: 'created', facility_status: facilityStatus }, { status: 201 });
  } catch (e) {
    console.error('Webhook error:', e);
    return json({ error: 'Invalid request body' }, { status: 400 });
  }
};

export const GET: RequestHandler = async () => {
  return json({ status: 'ok', endpoint: 'uniconnect-webhook', version: '3.0' });
};
