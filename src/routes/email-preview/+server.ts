import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>FundFlow — Email Templates</title>
<style>body{margin:0;padding:40px;background:#e5e5e5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}.tl{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:12px;padding-left:4px}.sp{height:40px}</style>
</head><body>
<div style="text-align:center;font-size:24px;font-weight:700;margin-bottom:8px">FundFlow Facilities — Email Templates</div>
<div style="text-align:center;font-size:14px;color:#666;margin-bottom:40px">5 templates for the complete procurement lifecycle</div>

<div class="tl">TEMPLATE 1 — UniConnect New Request (to all team)</div>
<div style="max-width:600px;margin:0 auto 20px">
<div style="background:#0a0a0a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
<table width="100%"><tr><td><span style="font-weight:600;font-size:14px;color:#fff">🟥 FundFlow Facilities</span></td><td style="text-align:right"><span style="background:#7c3aed;color:#fff;padding:3px 10px;border-radius:4px;font-size:10px">UNICONNECT</span></td></tr></table>
<div style="margin-top:12px;font-size:10px;color:#888;text-transform:uppercase;letter-spacing:0.08em">NEW PROCUREMENT REQUEST</div>
<div style="margin-top:6px;font-size:20px;font-weight:600;color:#fff">Arts Club Activity — Cultural Event Supplies</div>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
<table width="100%" style="margin-bottom:16px"><tr>
<td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center;width:33%"><div style="font-size:10px;color:#999;text-transform:uppercase">Budget</div><div style="font-size:18px;font-weight:700;font-family:monospace;margin-top:4px">₹5,450</div></td>
<td style="width:8px"></td>
<td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center;width:33%"><div style="font-size:10px;color:#999;text-transform:uppercase">Priority</div><div style="font-size:14px;font-weight:600;margin-top:6px;color:#d97706">HIGH</div></td>
<td style="width:8px"></td>
<td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center;width:33%"><div style="font-size:10px;color:#999;text-transform:uppercase">Campus</div><div style="font-size:14px;font-weight:600;margin-top:6px">SGU</div></td>
</tr></table>
<table style="width:100%;font-size:13px;margin-bottom:16px">
<tr><td style="padding:6px 0;color:#999;width:110px">Requester</td><td style="padding:6px 0;font-weight:500">Alex Rivera</td></tr>
<tr><td style="padding:6px 0;color:#999">Email</td><td>someone@example.com</td></tr>
<tr><td style="padding:6px 0;color:#999">Need By</td><td style="font-family:monospace">2026-05-10</td></tr>
<tr><td style="padding:6px 0;color:#999">Venue</td><td>SGU Campus Hall</td></tr>
</table>
<div style="font-size:10px;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">ITEMS (3)</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px"><thead><tr style="background:#f5f4ef"><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999">#</th><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999">Item</th><th style="padding:8px 12px;text-align:center;font-size:10px;color:#999">Qty</th><th style="padding:8px 12px;text-align:right;font-size:10px;color:#999">Unit</th><th style="padding:8px 12px;text-align:right;font-size:10px;color:#999">Total</th></tr></thead><tbody>
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">1</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">Prize Goodies — First Place</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">1</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">₹800</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-weight:600">₹800</td></tr>
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">2</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">Stage Banner — 20ft Flex</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">2</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">₹1,200</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-weight:600">₹2,400</td></tr>
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666">3</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">Event T-shirts — Cotton 180 GSM</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">50</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">₹280</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:monospace;font-weight:600">₹14,000</td></tr>
</tbody></table>
<a href="#" style="display:block;background:#0a0a0a;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View in Control Center →</a>
</div>
<div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · Automated · Source: UniConnect</div>
</div>

<div class="sp"></div>
<div class="tl">TEMPLATE 2 — L1/L2 Approval Request (to approver with Approve/Reject buttons)</div>
<div style="max-width:600px;margin:0 auto 20px">
<div style="background:#0a0a0a;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
<table width="100%"><tr><td><span style="font-weight:600;font-size:14px;color:#fff">🟥 FundFlow Facilities</span></td><td style="text-align:right"><span style="background:#d97706;color:#fff;padding:3px 10px;border-radius:4px;font-size:10px">L1 APPROVAL NEEDED</span></td></tr></table>
<div style="margin-top:12px;font-size:10px;color:#888;text-transform:uppercase">INTERNAL PROCUREMENT REQUEST</div>
<div style="margin-top:6px;font-size:20px;font-weight:600;color:#fff">Office Chairs — NIAT Campus Renovation</div>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:16px"><div style="font-weight:600;color:#92400e">Hi L1 Approver,</div><div style="color:#92400e;font-size:12px;margin-top:4px">A new procurement request needs your L1 approval.</div></div>
<table width="100%" style="margin-bottom:16px"><tr>
<td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center"><div style="font-size:10px;color:#999;text-transform:uppercase">Budget</div><div style="font-size:20px;font-weight:700;font-family:monospace;margin-top:4px">₹45,000</div></td>
<td style="width:8px"></td>
<td style="background:#f5f4ef;padding:12px;border-radius:8px;text-align:center"><div style="font-size:10px;color:#999;text-transform:uppercase">Priority</div><div style="font-size:14px;font-weight:600;margin-top:6px;color:#e54d2e">HIGH</div></td>
</tr></table>
<table style="width:100%;font-size:13px;margin-bottom:14px">
<tr><td style="padding:5px 0;color:#999;width:110px">Raised By</td><td style="font-weight:500">Jordan Lee</td></tr>
<tr><td style="padding:5px 0;color:#999">Email</td><td>someone@example.com</td></tr>
<tr><td style="padding:5px 0;color:#999">Need By</td><td style="font-family:monospace">2026-05-15</td></tr>
<tr><td style="padding:5px 0;color:#999">Location</td><td>NIAT-BITS Campus, Hyderabad</td></tr>
</table>
<div style="font-size:10px;color:#999;text-transform:uppercase;margin-bottom:6px">DESCRIPTION</div>
<div style="background:#f9fafb;padding:12px;border-radius:6px;font-size:12.5px;color:#333;line-height:1.6;margin-bottom:14px;border:1px solid #eee">Need 30 ergonomic office chairs for the new admin block. Current chairs damaged. Need lumbar support, adjustable height, armrests.</div>
<div style="font-size:10px;color:#999;text-transform:uppercase;margin-bottom:6px">ITEMS (2)</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:14px"><thead><tr style="background:#f5f4ef"><th style="padding:6px 10px;text-align:left;font-size:10px;color:#999">#</th><th style="padding:6px 10px;text-align:left;font-size:10px;color:#999">ITEM</th><th style="padding:6px 10px;text-align:center;font-size:10px;color:#999">QTY</th><th style="padding:6px 10px;text-align:right;font-size:10px;color:#999">TOTAL</th></tr></thead><tbody>
<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">1</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:500">Ergonomic Office Chair — Mesh Back</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">30</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">₹42,000</td></tr>
<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#666">2</td><td style="padding:6px 10px;border-bottom:1px solid #eee;font-weight:500">Chair Floor Protector Mats</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">30</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;font-family:monospace">₹3,000</td></tr>
</tbody></table>
<div style="margin-bottom:14px"><a href="#" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f5f4ef;border:1px solid #ddd;border-radius:6px;text-decoration:none;color:#333;font-size:12px;font-weight:500">📎 View Attached Document — specs.pdf</a></div>
<table width="100%"><tr>
<td style="width:48%"><a href="#" style="display:block;background:#059669;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">✓ Approve</a></td>
<td style="width:4%"></td>
<td style="width:48%"><a href="#" style="display:block;background:#dc2626;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">✗ Reject</a></td>
</tr></table>
<div style="text-align:center;margin-top:10px"><a href="#" style="color:#666;font-size:12px;text-decoration:none">View full details in Portal →</a></div>
</div>
<div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · L1 Approval · Internal</div>
</div>

<div class="sp"></div>
<div class="tl">TEMPLATE 3 — All Approved (sent to executor — green, ready to go)</div>
<div style="max-width:600px;margin:0 auto 20px">
<div style="background:#059669;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
<table width="100%"><tr><td><span style="font-weight:600;font-size:14px;color:#fff">⬜ FundFlow Facilities</span></td><td style="text-align:right"><span style="background:#fff;color:#059669;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600">✓ ALL APPROVED</span></td></tr></table>
<div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase">READY FOR PROCUREMENT</div>
<div style="margin-top:6px;font-size:20px;font-weight:600;color:#fff">Office Chairs — NIAT Campus</div>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
<div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:14px 16px;margin-bottom:16px"><div style="font-weight:600;color:#065f46">All approvals received!</div><div style="color:#065f46;font-size:12px;margin-top:4px">Proceed with vendor matching and procurement.</div></div>
<table style="width:100%;font-size:13px;margin-bottom:14px">
<tr><td style="padding:5px 0;color:#999;width:110px">Raised By</td><td style="font-weight:500">Jordan Lee</td></tr>
<tr><td style="padding:5px 0;color:#999">Budget</td><td style="font-family:monospace;font-weight:700;font-size:16px">₹45,000</td></tr>
<tr><td style="padding:5px 0;color:#999">L1</td><td style="color:#059669;font-weight:500">✓ L1 Approver</td></tr>
<tr><td style="padding:5px 0;color:#999">L2</td><td style="color:#059669;font-weight:500">✓ L2 Approver</td></tr>
</table>
<ul style="margin:0 0 14px;padding-left:18px"><li style="padding:4px 0;font-size:12.5px">Ergonomic Chair — Qty: 30, ₹42,000</li><li style="padding:4px 0;font-size:12.5px">Floor Mats — Qty: 30, ₹3,000</li></ul>
<a href="#" style="display:block;background:#059669;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open & Start Procurement →</a>
</div>
<div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · All Approved</div>
</div>

<div class="sp"></div>
<div class="tl">TEMPLATE 4 — Rejection (sent back to raiser — red)</div>
<div style="max-width:600px;margin:0 auto 20px">
<div style="background:#dc2626;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
<table width="100%"><tr><td><span style="font-weight:600;font-size:14px;color:#fff">⬜ FundFlow Facilities</span></td><td style="text-align:right"><span style="background:#fff;color:#dc2626;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600">✗ REJECTED</span></td></tr></table>
<div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase">REQUIREMENT REJECTED · L1</div>
<div style="margin-top:6px;font-size:20px;font-weight:600;color:#fff">Office Chairs — NIAT Campus</div>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:14px 16px;margin-bottom:16px"><div style="font-weight:600;color:#991b1b">Rejected by L1 Approver (L1)</div><div style="color:#991b1b;font-size:12px;margin-top:6px;line-height:1.5"><strong>Reason:</strong> Budget exceeds quarterly allocation for furniture. Please reduce quantity to 20 and resubmit, or provide signed justification from campus director.</div></div>
<table style="width:100%;font-size:13px;margin-bottom:14px">
<tr><td style="padding:5px 0;color:#999;width:110px">Budget</td><td style="font-family:monospace;font-weight:600">₹45,000</td></tr>
<tr><td style="padding:5px 0;color:#999">Priority</td><td>HIGH</td></tr>
</table>
<a href="#" style="display:block;background:#0a0a0a;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View Details & Revise →</a>
</div>
<div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · Rejection</div>
</div>

<div class="sp"></div>
<div class="tl">TEMPLATE 5 — Daily 6 PM Reminder (to approvers with pending requests)</div>
<div style="max-width:600px;margin:0 auto 20px">
<div style="background:#d97706;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
<table width="100%"><tr><td><span style="font-weight:600;font-size:14px;color:#fff">⬜ FundFlow Facilities</span></td><td style="text-align:right"><span style="background:#fff;color:#d97706;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:600">⏰ REMINDER #3</span></td></tr></table>
<div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,0.7);text-transform:uppercase">PENDING L1 APPROVALS</div>
<div style="margin-top:6px;font-size:20px;font-weight:600;color:#fff">2 requests awaiting your approval</div>
</div>
<div style="background:#fff;padding:24px;border:1px solid #e8e6de;border-top:none">
<div style="margin-bottom:14px;font-size:13px;color:#333">Hi L1 Approver, these are still pending your L1 approval:</div>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px"><thead><tr style="background:#f5f4ef"><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999">Request</th><th style="padding:8px 12px;text-align:right;font-size:10px;color:#999">Budget</th><th style="padding:8px 12px;text-align:left;font-size:10px;color:#999">By</th><th style="padding:8px 12px;text-align:center;font-size:10px;color:#999">Status</th></tr></thead><tbody>
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">Office Chairs — NIAT</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:right">₹45,000</td><td style="padding:8px 12px;border-bottom:1px solid #eee">Jordan Lee</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px">Pending</span></td></tr>
<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:500">Lab Signage</td><td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:monospace;text-align:right">₹12,000</td><td style="padding:8px 12px;border-bottom:1px solid #eee">Student Engagement</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center"><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:11px">Pending</span></td></tr>
</tbody></table>
<a href="#" style="display:block;background:#d97706;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Review & Approve Now →</a>
</div>
<div style="padding:14px 24px;text-align:center;font-size:11px;color:#999;background:#fafaf7;border:1px solid #e8e6de;border-top:none;border-radius:0 0 10px 10px">FundFlow Facilities · Daily Reminder (6 PM IST) · #3</div>
</div>

<div style="height:40px"></div>
<div style="text-align:center;font-size:12px;color:#999;padding:20px">— End of Templates —</div>
</body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
};
