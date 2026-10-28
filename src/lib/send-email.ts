import { env } from '$env/dynamic/private';
import { baseUrl } from '$lib/server/approvals';

export async function sendEmail(to: string | string[], subject: string, html: string, cc?: string) {
  const host = env.SMTP_HOST;
  const user = env.SMTP_USER;
  const pass = env.SMTP_PASS;
  const from = env.SMTP_FROM || user;

  if (!host || !user || !pass || pass === 'pending_app_password') {
    console.log('[EMAIL] SMTP not configured. Would send to:', Array.isArray(to) ? to.join(', ') : to);
    console.log('[EMAIL] Subject:', subject);
    return { sent: false, reason: 'SMTP not configured' };
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: env.SMTP_PORT === '465',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"FundFlow Facilities" <${from}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc || undefined,
      subject,
      html,
    });

    return { sent: true };
  } catch (e) {
    console.error('[EMAIL] Send failed:', e);
    return { sent: false, reason: String(e) };
  }
}

export function newRequestEmailHtml(req: Record<string, unknown>, items: Record<string, unknown>[]): string {
  const itemsHtml = items.map((i, idx) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${idx + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:500">${i.description || i.item_type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-family:monospace">₹${((i.unit_price as number) || 0).toLocaleString('en-IN')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-family:monospace;font-weight:600">₹${((i.total_price as number) || ((i.quantity as number) || 0) * ((i.unit_price as number) || 0)).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const totalBudget = (req.allocated_budget as number) || 0;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">

  <!-- Header -->
  <div style="background:#0a0a0a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:24px;height:24px;background:#e54d2e;border-radius:4px"></div>
      <span style="font-weight:600;font-size:15px">FundFlow Facilities</span>
    </div>
    <div style="margin-top:12px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em">NEW PROCUREMENT REQUEST</div>
    <div style="margin-top:6px;font-size:20px;font-weight:600">${req.title}</div>
  </div>

  <!-- Body -->
  <div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">

    <!-- KPIs -->
    <div style="display:flex;gap:12px;margin-bottom:20px">
      <div style="flex:1;background:#f5f4ef;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em">Budget</div>
        <div style="font-size:18px;font-weight:700;font-family:monospace;margin-top:4px">₹${totalBudget.toLocaleString('en-IN')}</div>
      </div>
      <div style="flex:1;background:#f5f4ef;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em">Priority</div>
        <div style="font-size:14px;font-weight:600;margin-top:6px;color:${(req.priority as string) === 'high' ? '#e54d2e' : '#d97706'}">${((req.priority as string) || 'medium').toUpperCase()}</div>
      </div>
      <div style="flex:1;background:#f5f4ef;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em">Campus</div>
        <div style="font-size:14px;font-weight:600;margin-top:6px">${req.delivery_notes || '—'}</div>
      </div>
    </div>

    <!-- Details -->
    <table style="width:100%;font-size:13px;margin-bottom:16px">
      <tr><td style="padding:6px 0;color:#999;width:120px">Requester</td><td style="padding:6px 0;font-weight:500">${req.requested_by_name || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Email</td><td style="padding:6px 0">${req.requested_by_email || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Need By</td><td style="padding:6px 0;font-family:monospace">${req.required_by_date || 'Not specified'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Venue</td><td style="padding:6px 0">${req.delivery_location || '—'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Source</td><td style="padding:6px 0">${req.source || 'UniConnect'}</td></tr>
    </table>

    <!-- Items -->
    ${items.length > 0 ? `
    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">ITEMS (${items.length})</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <thead>
        <tr style="background:#f5f4ef">
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#999;text-transform:uppercase">#</th>
          <th style="padding:8px 12px;text-align:left;font-size:10px;color:#999;text-transform:uppercase">Item</th>
          <th style="padding:8px 12px;text-align:center;font-size:10px;color:#999;text-transform:uppercase">Qty</th>
          <th style="padding:8px 12px;text-align:right;font-size:10px;color:#999;text-transform:uppercase">Unit</th>
          <th style="padding:8px 12px;text-align:right;font-size:10px;color:#999;text-transform:uppercase">Total</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    ` : ''}

    <!-- CTA -->
    <a href="${baseUrl()}/control-center" style="display:block;background:#0a0a0a;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:16px">
      View in Control Center →
    </a>
  </div>

  <!-- Footer -->
  <div style="padding:16px 24px;text-align:center;font-size:11px;color:#999;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px;background:#fafaf7">
    FundFlow Facilities &middot; Automated notification &middot; Do not reply to this email
  </div>

</div>
</body>
</html>`;
}
