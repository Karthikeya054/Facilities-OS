import { baseUrl, signedApprovalQuery } from '$lib/server/approvals';


// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 1: New Request from UniConnect (to all team members)
// ═══════════════════════════════════════════════════════════════════

export function uniconnectRequestEmail(req: Record<string, unknown>, items: Record<string, unknown>[]): string {
  const itemsHtml = items.map((i, idx) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;color:#666">${idx + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;font-weight:500">${i.description || i.item_type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-family:monospace">₹${((i.unit_price as number) || 0).toLocaleString('en-IN')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-family:monospace;font-weight:600">₹${((i.total_price as number) || ((i.quantity as number) || 0) * ((i.unit_price as number) || 0)).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const budget = (req.allocated_budget as number) || 0;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#0a0a0a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <table width="100%"><tr><td><div style="display:inline-flex;align-items:center;gap:10px"><div style="width:20px;height:20px;background:#e54d2e;border-radius:3px"></div><span style="font-weight:600;font-size:14px">FundFlow Facilities</span></div></td><td style="text-align:right"><span style="background:#7c3aed;color:#fff;padding:3px 10px;border-radius:4px;font-size:10px;letter-spacing:0.05em">UNICONNECT</span></td></tr></table>
    <div style="margin-top:14px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em">NEW PROCUREMENT REQUEST</div>
    <div style="margin-top:6px;font-size:20px;font-weight:600;line-height:1.2">${req.title}</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
    <table width="100%" style="margin-bottom:16px"><tr>
      <td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center;width:33%"><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em">Budget</div><div style="font-size:18px;font-weight:700;font-family:monospace;margin-top:4px">₹${budget.toLocaleString('en-IN')}</div></td>
      <td style="width:8px"></td>
      <td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center;width:33%"><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em">Priority</div><div style="font-size:14px;font-weight:600;margin-top:6px;color:${(req.priority as string)==='high'?'#e54d2e':'#d97706'}">${((req.priority as string)||'medium').toUpperCase()}</div></td>
      <td style="width:8px"></td>
      <td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center;width:33%"><div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em">Campus</div><div style="font-size:14px;font-weight:600;margin-top:6px">${req.delivery_notes||'—'}</div></td>
    </tr></table>
    <table style="width:100%;font-size:13px;margin-bottom:16px">
      <tr><td style="padding:6px 0;color:#999;width:110px">Requester</td><td style="padding:6px 0;font-weight:500">${req.requested_by_name||'—'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Email</td><td style="padding:6px 0">${req.requested_by_email||'—'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Need By</td><td style="padding:6px 0;font-family:monospace">${req.required_by_date||'Not specified'}</td></tr>
      <tr><td style="padding:6px 0;color:#999">Venue</td><td style="padding:6px 0">${req.delivery_location||'—'}</td></tr>
    </table>
    ${items.length > 0 ? `<div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">ITEMS (${items.length})</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px"><thead><tr style="background:#f5f4ef"><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999;text-transform:uppercase">#</th><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999;text-transform:uppercase">Item</th><th style="padding:8px 12px;text-align:center;font-size:10px;color:#999;text-transform:uppercase">Qty</th><th style="padding:8px 12px;text-align:right;font-size:10px;color:#999;text-transform:uppercase">Unit</th><th style="padding:8px 12px;text-align:right;font-size:10px;color:#999;text-transform:uppercase">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>` : ''}
    <a href="${baseUrl()}/control-center" style="display:block;background:#0a0a0a;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View in Control Center →</a>
  </div>
  <div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · Automated notification · Source: UniConnect</div>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 2: Internal Request — Approval Required (L1/L2)
// ═══════════════════════════════════════════════════════════════════

export function approvalRequestEmail(
  req: Record<string, unknown>,
  items: Record<string, unknown>[],
  approverName: string,
  level: 'L1' | 'L2',
  docUrl?: string | null
): string {
  const itemsHtml = items.map((i, idx) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;color:#666">${idx+1}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;font-weight:500">${i.description||i.item_type}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:center">${i.quantity}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #eee;font-size:12px;text-align:right;font-family:monospace">₹${((i.total_price as number)||((i.quantity as number)||0)*((i.unit_price as number)||0)).toLocaleString('en-IN')}</td>
    </tr>`).join('');

  const budget = (req.allocated_budget as number) || 0;
  const approveUrl = `${baseUrl()}/api/approve?${signedApprovalQuery(String(req.id), level, 'approve')}`;
  const rejectUrl = `${baseUrl()}/api/approve?${signedApprovalQuery(String(req.id), level, 'reject')}`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#0a0a0a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <table width="100%"><tr><td><div style="display:inline-flex;align-items:center;gap:10px"><div style="width:20px;height:20px;background:#e54d2e;border-radius:3px"></div><span style="font-weight:600;font-size:14px">FundFlow Facilities</span></div></td><td style="text-align:right"><span style="background:#d97706;color:#fff;padding:3px 10px;border-radius:4px;font-size:10px;letter-spacing:0.05em">${level} APPROVAL NEEDED</span></td></tr></table>
    <div style="margin-top:14px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em">INTERNAL PROCUREMENT REQUEST</div>
    <div style="margin-top:6px;font-size:20px;font-weight:600;line-height:1.2">${req.title}</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:16px">
      <div style="font-weight:600;color:#92400e;font-size:13px">Hi ${approverName},</div>
      <div style="color:#92400e;font-size:12px;margin-top:4px">A new procurement request needs your ${level} approval. Please review the details below and approve or reject.</div>
    </div>
    <table width="100%" style="margin-bottom:16px"><tr>
      <td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center"><div style="font-size:10px;color:#999;text-transform:uppercase">Budget</div><div style="font-size:20px;font-weight:700;font-family:monospace;margin-top:4px">₹${budget.toLocaleString('en-IN')}</div></td>
      <td style="width:8px"></td>
      <td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center"><div style="font-size:10px;color:#999;text-transform:uppercase">Priority</div><div style="font-size:14px;font-weight:600;margin-top:6px;color:${(req.priority as string)==='high'?'#e54d2e':'#d97706'}">${((req.priority as string)||'medium').toUpperCase()}</div></td>
    </tr></table>
    <table style="width:100%;font-size:13px;margin-bottom:14px">
      <tr><td style="padding:5px 0;color:#999;width:110px">Raised By</td><td style="padding:5px 0;font-weight:500">${req.requested_by_name||'—'}</td></tr>
      <tr><td style="padding:5px 0;color:#999">Email</td><td style="padding:5px 0">${req.requested_by_email||'—'}</td></tr>
      <tr><td style="padding:5px 0;color:#999">Need By</td><td style="padding:5px 0;font-family:monospace">${req.required_by_date||'ASAP'}</td></tr>
      <tr><td style="padding:5px 0;color:#999">Location</td><td style="padding:5px 0">${req.delivery_location||'—'}</td></tr>
    </table>
    ${req.description ? `<div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">DESCRIPTION</div><div style="background:#f9fafb;padding:12px;border-radius:6px;font-size:12.5px;color:#333;line-height:1.6;margin-bottom:14px;border:1px solid #eee;max-height:150px;overflow:hidden">${(req.description as string).slice(0,500)}</div>` : ''}
    ${items.length > 0 ? `<div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">ITEMS (${items.length})</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px"><thead><tr style="background:#f5f4ef"><th style="padding:6px 10px;text-align:left;font-size:10px;color:#999">#</th><th style="padding:6px 10px;text-align:left;font-size:10px;color:#999">ITEM</th><th style="padding:6px 10px;text-align:center;font-size:10px;color:#999">QTY</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#999">TOTAL</th></tr></thead><tbody>${itemsHtml}</tbody></table>` : ''}
    ${docUrl ? `<div style="margin-bottom:14px"><a href="${docUrl}" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f5f4ef;border:1px solid #ddd;border-radius:6px;text-decoration:none;color:#333;font-size:12px;font-weight:500">📎 View Attached Document</a></div>` : ''}
    <table width="100%" style="margin-top:16px"><tr>
      <td style="width:48%"><a href="${approveUrl}" style="display:block;background:#059669;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">✓ Approve</a></td>
      <td style="width:4%"></td>
      <td style="width:48%"><a href="${rejectUrl}" style="display:block;background:#dc2626;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">✗ Reject</a></td>
    </tr></table>
    <div style="text-align:center;margin-top:10px"><a href="${baseUrl()}/request/${req.id}" style="color:#666;font-size:12px;text-decoration:none">View full details in Facilities Portal →</a></div>
  </div>
  <div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · ${level} Approval Request · Internal</div>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 3: Approval Complete — Notify executor
// ═══════════════════════════════════════════════════════════════════

export function approvalCompleteEmail(req: Record<string, unknown>, items: Record<string, unknown>[]): string {
  const itemsList = items.map((i, idx) => `<li style="padding:4px 0;font-size:12.5px">${i.description||i.item_type} — Qty: ${i.quantity}, ₹${((i.total_price as number)||0).toLocaleString('en-IN')}</li>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#059669;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <table width="100%"><tr><td><div style="display:inline-flex;align-items:center;gap:10px"><div style="width:20px;height:20px;background:#fff;border-radius:3px"></div><span style="font-weight:600;font-size:14px">FundFlow Facilities</span></div></td><td style="text-align:right"><span style="background:#fff;color:#059669;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:0.05em">✓ ALL APPROVED</span></td></tr></table>
    <div style="margin-top:14px;font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.08em">READY FOR PROCUREMENT</div>
    <div style="margin-top:6px;font-size:20px;font-weight:600;line-height:1.2">${req.title}</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 16px;margin-bottom:16px">
      <div style="font-weight:600;color:#065f46;font-size:13px">All approvals received!</div>
      <div style="color:#065f46;font-size:12px;margin-top:4px">This requirement has been approved by all levels. You can now proceed with vendor matching and procurement.</div>
    </div>
    <table style="width:100%;font-size:13px;margin-bottom:14px">
      <tr><td style="padding:5px 0;color:#999;width:110px">Raised By</td><td style="padding:5px 0;font-weight:500">${req.requested_by_name||'—'}</td></tr>
      <tr><td style="padding:5px 0;color:#999">Budget</td><td style="padding:5px 0;font-family:monospace;font-weight:700;font-size:16px">₹${((req.allocated_budget as number)||0).toLocaleString('en-IN')}</td></tr>
      <tr><td style="padding:5px 0;color:#999">Priority</td><td style="padding:5px 0;font-weight:500">${((req.priority as string)||'medium').toUpperCase()}</td></tr>
      <tr><td style="padding:5px 0;color:#999">Need By</td><td style="padding:5px 0;font-family:monospace">${req.required_by_date||'ASAP'}</td></tr>
      <tr><td style="padding:5px 0;color:#999">L1 Approved</td><td style="padding:5px 0;color:#059669;font-weight:500">✓ ${req.cm_approved_by_name||'Approved'}</td></tr>
      <tr><td style="padding:5px 0;color:#999">L2 Approved</td><td style="padding:5px 0;color:#059669;font-weight:500">✓ ${req.admin_approved_by_name||'Approved'}</td></tr>
    </table>
    ${items.length > 0 ? `<div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">ITEMS</div><ul style="margin:0 0 14px;padding-left:18px">${itemsList}</ul>` : ''}
    <a href="${baseUrl()}/request/${req.id}" style="display:block;background:#059669;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open Requirement & Start Procurement →</a>
  </div>
  <div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · All Approvals Complete</div>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 4: Rejection notification (back to raiser)
// ═══════════════════════════════════════════════════════════════════

export function rejectionEmail(req: Record<string, unknown>, rejectorName: string, level: string, reason: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#dc2626;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <table width="100%"><tr><td><div style="display:inline-flex;align-items:center;gap:10px"><div style="width:20px;height:20px;background:#fff;border-radius:3px"></div><span style="font-weight:600;font-size:14px">FundFlow Facilities</span></div></td><td style="text-align:right"><span style="background:#fff;color:#dc2626;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:0.05em">✗ REJECTED</span></td></tr></table>
    <div style="margin-top:14px;font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.08em">REQUIREMENT REJECTED · ${level}</div>
    <div style="margin-top:6px;font-size:20px;font-weight:600;line-height:1.2">${req.title}</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-bottom:16px">
      <div style="font-weight:600;color:#991b1b;font-size:13px">Rejected by ${rejectorName} (${level})</div>
      <div style="color:#991b1b;font-size:12px;margin-top:6px;line-height:1.5"><strong>Reason:</strong> ${reason || 'No reason provided'}</div>
    </div>
    <table style="width:100%;font-size:13px;margin-bottom:14px">
      <tr><td style="padding:5px 0;color:#999;width:110px">Budget</td><td style="padding:5px 0;font-family:monospace;font-weight:600">₹${((req.allocated_budget as number)||0).toLocaleString('en-IN')}</td></tr>
      <tr><td style="padding:5px 0;color:#999">Priority</td><td style="padding:5px 0">${((req.priority as string)||'medium').toUpperCase()}</td></tr>
    </table>
    <a href="${baseUrl()}/request/${req.id}" style="display:block;background:#0a0a0a;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Details & Revise →</a>
  </div>
  <div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · Rejection Notification</div>
</div></body></html>`;
}

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE 5: Daily reminder for pending approvals (6 PM)
// ═══════════════════════════════════════════════════════════════════

export function dailyReminderEmail(approverName: string, pendingRequests: Record<string, unknown>[], level: string, notifyCount: number): string {
  const rows = pendingRequests.map(r => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12.5px;font-weight:500">${r.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12.5px;font-family:monospace;text-align:right">₹${((r.allocated_budget as number)||0).toLocaleString('en-IN')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12.5px">${r.requested_by_name||'—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12.5px;text-align:center"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px">Pending</span></td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#d97706;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <table width="100%"><tr><td><div style="display:inline-flex;align-items:center;gap:10px"><div style="width:20px;height:20px;background:#fff;border-radius:3px"></div><span style="font-weight:600;font-size:14px">FundFlow Facilities</span></div></td><td style="text-align:right"><span style="background:#fff;color:#d97706;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600">⏰ REMINDER #${notifyCount}</span></td></tr></table>
    <div style="margin-top:14px;font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.08em">PENDING ${level} APPROVALS</div>
    <div style="margin-top:6px;font-size:20px;font-weight:600">${pendingRequests.length} request${pendingRequests.length !== 1 ? 's' : ''} awaiting your approval</div>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
    <div style="margin-bottom:14px;font-size:13px;color:#333">Hi ${approverName}, these requirements are still pending your ${level} approval:</div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px"><thead><tr style="background:#f5f4ef"><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999;text-transform:uppercase">Request</th><th style="padding:8px 12px;text-align:right;font-size:10px;color:#999;text-transform:uppercase">Budget</th><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999;text-transform:uppercase">Raised By</th><th style="padding:8px 12px;text-align:center;font-size:10px;color:#999;text-transform:uppercase">Status</th></tr></thead><tbody>${rows}</tbody></table>
    <a href="${baseUrl()}/control-center" style="display:block;background:#d97706;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Review & Approve Now →</a>
  </div>
  <div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · Daily Reminder (6 PM IST) · Notification #{notifyCount}</div>
</div></body></html>`;
}
