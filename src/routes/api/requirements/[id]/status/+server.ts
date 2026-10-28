import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createServiceClient } from '$lib/supabase';
import { sendEmail } from '$lib/send-email';
import { baseUrl } from '$lib/server/approvals';
import type { RequestHandler } from './$types';

async function notifyUniConnect(requirement: Record<string, unknown>, newStatus: string, extra?: Record<string, unknown>) {
  const url = env.UNICONNECT_WEBHOOK_URL;
  const secret = env.WEBHOOK_SECRET;
  if (!url || !requirement.budget_proposal_id) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret || '' },
      body: JSON.stringify({
        action: newStatus, budget_proposal_id: requirement.budget_proposal_id,
        requirement_id: requirement.id, status: newStatus,
        vendor_name: extra?.vendor_name, quoted_price: extra?.quoted_price,
        actual_cost: extra?.actual_cost, delivery_date: extra?.delivery_date,
        message: extra?.message, items_summary: extra?.items_summary,
        vendor_details: extra?.vendor_details,
      })
    });
  } catch (e) { console.warn('[WEBHOOK] Failed:', e); }
}

function statusLabel(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }

async function notifyRaiser(req: Record<string, unknown>, newStatus: string, extra?: Record<string, unknown>) {
  const email = req.requested_by_email as string;
  if (!email || req.source !== 'internal') return;

  const vendor = req.vendor as Record<string, unknown> | null;
  const title = req.title as string;
  const budget = (req.allocated_budget as number) || 0;

  const statusInfo: Record<string, string> = {
    'vendor_search': 'Your request is now in vendor search phase. The facilities team is finding the best vendor.',
    'vendor_assigned': `A vendor has been assigned: <strong>${vendor?.name || extra?.vendor_name || 'TBD'}</strong>. An RFQ email will be sent to them.`,
    'vendor_confirmed': `The vendor <strong>${vendor?.name || ''}</strong> has confirmed the order. Quoted price: <strong>₹${((req.vendor_quoted_price as number) || (extra?.quoted_price as number) || 0).toLocaleString('en-IN')}</strong>.`,
    'sample_ready': `Sample is ready from <strong>${vendor?.name || ''}</strong>. The facilities team will review it.`,
    'in_production': `Your order is now in production with <strong>${vendor?.name || ''}</strong>.`,
    'in_transit': `Your order has been shipped by <strong>${vendor?.name || ''}</strong>. Expected delivery: ${(req.estimated_delivery_date as string) || 'Soon'}.`,
    'delivered': `Your order has been delivered! Actual cost: <strong>₹${((req.actual_cost as number) || 0).toLocaleString('en-IN')}</strong>.`,
    'completed': 'Your request has been completed and closed. Thank you!',
  };

  const info = statusInfo[newStatus] || `Status updated to: ${statusLabel(newStatus)}`;
  const BASE = baseUrl();

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#0a0a0a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <table width="100%"><tr><td><span style="font-weight:600;font-size:14px;color:#fff">🟥 FundFlow Facilities</span></td><td style="text-align:right"><span style="background:#3b82f6;color:#fff;padding:3px 10px;border-radius:4px;font-size:10px">STATUS UPDATE</span></td></tr></table>
    <div style="margin-top:12px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em">YOUR REQUEST UPDATE</div>
    <div style="margin-top:6px;font-size:18px;font-weight:600;color:#fff">${title}</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;margin-bottom:16px">
      <div style="font-weight:600;color:#1e40af;font-size:13px">Status: ${statusLabel(newStatus)}</div>
      <div style="color:#1e40af;font-size:12px;margin-top:6px;line-height:1.5">${info}</div>
    </div>
    <table style="width:100%;font-size:13px;margin-bottom:14px">
      <tr><td style="padding:5px 0;color:#999;width:100px">Budget</td><td style="font-family:monospace;font-weight:600">₹${budget.toLocaleString('en-IN')}</td></tr>
      ${(req.vendor_quoted_price as number) ? `<tr><td style="padding:5px 0;color:#999">Quoted</td><td style="font-family:monospace">₹${((req.vendor_quoted_price as number) || 0).toLocaleString('en-IN')}</td></tr>` : ''}
      ${(req.actual_cost as number) ? `<tr><td style="padding:5px 0;color:#999">Actual Cost</td><td style="font-family:monospace">₹${((req.actual_cost as number) || 0).toLocaleString('en-IN')}</td></tr>` : ''}
      ${vendor ? `<tr><td style="padding:5px 0;color:#999">Vendor</td><td style="font-weight:500">${vendor.name}${vendor.phone ? ' · ' + vendor.phone : ''}</td></tr>` : ''}
      ${(req.estimated_delivery_date as string) ? `<tr><td style="padding:5px 0;color:#999">Delivery</td><td style="font-family:monospace">${req.estimated_delivery_date}</td></tr>` : ''}
    </table>
    ${extra?.message ? `<div style="background:#f9fafb;padding:10px;border-radius:6px;font-size:12px;color:#333;margin-bottom:14px;border:1px solid #eee"><strong>Note:</strong> ${extra.message}</div>` : ''}
    <a href="${BASE}/my-requests" style="display:block;background:#0a0a0a;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px">View My Request →</a>
  </div>
  <div style="padding:12px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · Status Update · Internal Request</div>
</div></body></html>`;

  await sendEmail(email, `📋 ${statusLabel(newStatus)}: ${title} — FundFlow Facilities`, html);
}

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const newStatus = body.status;
    if (!newStatus) return json({ error: 'status is required' }, { status: 400 });

    const update: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };

    if (body.assigned_vendor_id) update.assigned_vendor_id = body.assigned_vendor_id;
    if (body.vendor_quoted_price) update.vendor_quoted_price = body.vendor_quoted_price;
    if (body.actual_cost) update.actual_cost = body.actual_cost;
    if (body.estimated_delivery_date) update.estimated_delivery_date = body.estimated_delivery_date;
    if (body.actual_delivery_date) update.actual_delivery_date = body.actual_delivery_date;
    if (body.delivery_notes) update.delivery_notes = body.delivery_notes;

    if (newStatus === 'vendor_assigned' && body.assigned_vendor_id) {
      update.vendor_email_sent_at = new Date().toISOString();
    }
    if (newStatus === 'vendor_confirmed') {
      update.vendor_confirmed_at = new Date().toISOString();
    }

    const { data: req, error } = await supabase
      .from('facility_requirements')
      .update(update)
      .eq('id', params.id)
      .select('*, vendor:vendors!assigned_vendor_id(*)')
      .single();

    if (error) return json({ error: error.message }, { status: 500 });

    const { data: items } = await supabase
      .from('facility_requirement_items')
      .select('description, quantity, item_type')
      .eq('requirement_id', params.id);
    const itemsSummary = (items || []).map(i => `${i.quantity}x ${i.description || i.item_type}`).join(', ');

    // Notify UniConnect (for uniconnect-sourced requests)
    await notifyUniConnect(req, newStatus, {
      vendor_name: req.vendor?.name || body.vendor_name,
      quoted_price: req.vendor_quoted_price,
      actual_cost: req.actual_cost,
      delivery_date: req.estimated_delivery_date || req.actual_delivery_date,
      message: body.message,
      items_summary: itemsSummary,
      vendor_details: req.vendor ? { name: req.vendor.name, quoted_price: req.vendor_quoted_price, delivery_date: req.estimated_delivery_date } : null,
    });

    // Notify raiser via email (for internal requests)
    await notifyRaiser(req, newStatus, {
      vendor_name: req.vendor?.name || body.vendor_name,
      quoted_price: req.vendor_quoted_price,
      message: body.message,
    });

    return json({ success: true, requirement: req });
  } catch (e) {
    console.error('Status update error:', e);
    return json({ error: 'Failed to update status' }, { status: 500 });
  }
};
