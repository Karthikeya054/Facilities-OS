import { env } from '$env/dynamic/private';

export async function notifyUniConnect(requirement: Record<string, unknown>, newStatus: string, extra?: Record<string, unknown>) {
  const url = env.UNICONNECT_WEBHOOK_URL;
  const secret = env.WEBHOOK_SECRET;
  if (!url || !requirement.budget_proposal_id) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret || ''
      },
      body: JSON.stringify({
        action: newStatus,
        budget_proposal_id: requirement.budget_proposal_id,
        requirement_id: requirement.id,
        status: newStatus,
        vendor_name: extra?.vendor_name,
        quoted_price: extra?.quoted_price,
        actual_cost: extra?.actual_cost,
        delivery_date: extra?.delivery_date,
        attachment_urls: extra?.attachment_urls,
        message: extra?.message
      })
    });
  } catch (e) {
    console.warn('[WEBHOOK] Failed to notify UniConnect:', e);
  }
}
