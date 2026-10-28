import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import { askGemini } from '$lib/gemini';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { requirement_id, vendor_id, vendor_email } = await request.json();
    const supabase = createServiceClient();

    const { data: req } = await supabase
      .from('facility_requirements')
      .select('*')
      .eq('id', requirement_id)
      .single();
    if (!req) return json({ error: 'Requirement not found' }, { status: 404 });

    const { data: items } = await supabase
      .from('facility_requirement_items')
      .select('*')
      .eq('requirement_id', requirement_id);

    let vendor = null;
    if (vendor_id) {
      const { data: v } = await supabase.from('vendors').select('*').eq('id', vendor_id).single();
      vendor = v;
    }

    // Build a clear items table that MUST appear in the email
    const itemLines = (items || []).map((i, idx) => {
      const total = i.total_price || (i.quantity || 0) * (i.unit_price || 0);
      return `| ${idx + 1} | ${i.description || i.item_type} | ${i.item_type} | ${i.quantity} | ₹${(i.unit_price || 0).toLocaleString('en-IN')} | ₹${total.toLocaleString('en-IN')} |`;
    }).join('\n');

    const totalBudget = (items || []).reduce((sum, i) => sum + (i.total_price || (i.quantity || 0) * (i.unit_price || 0)), 0);
    const campusName = req.delivery_notes || 'University Campus';
    const hasItems = items && items.length > 0;

    // Build a plain text items list as fallback
    const itemsPlainList = (items || []).map((i, idx) => {
      const total = i.total_price || (i.quantity || 0) * (i.unit_price || 0);
      return `${idx + 1}. ${i.description || i.item_type} — Qty: ${i.quantity}, Unit: ₹${i.unit_price || 0}, Total: ₹${total}`;
    }).join('\n');

    const prompt = `Write a professional RFQ email for FundFlow Facilities (university procurement team, India).

TO: ${vendor?.name || 'Vendor'} (${vendor?.category || 'General'})

REQUIREMENT: ${req.title}
CAMPUS: ${campusName}
EVENT/PURPOSE: ${req.description ? req.description.slice(0, 300) : req.title}
DELIVERY LOCATION: ${req.delivery_location || campusName}
NEEDED BY: ${req.required_by_date || 'ASAP'}
BUDGET RANGE: Around ₹${(req.allocated_budget || totalBudget || 0).toLocaleString('en-IN')}

${hasItems ? `ITEMS TO QUOTE (${items.length} items — YOU MUST LIST ALL OF THESE IN THE EMAIL):

| # | Item | Category | Qty | Unit Price | Total |
|---|------|----------|-----|-----------|-------|
${itemLines}

GRAND TOTAL (indicative): ₹${totalBudget.toLocaleString('en-IN')}` : 'No itemized list — quote based on the requirement description above.'}

INSTRUCTIONS FOR THE EMAIL:
1. Start with "Dear ${vendor?.name || 'Sir/Madam'},"
2. Introduce: "We are FundFlow Facilities, the procurement division managing university operations across India."
3. Brief context about the event/requirement (2 sentences from the description)
4. ${hasItems ? `LIST ALL ${items.length} ITEMS in a clear numbered format. For EACH item include: name, quantity, and indicative unit price. DO NOT skip any item. DO NOT summarize — list every single one.` : 'Describe what we need based on the title.'}
5. After the items list, add a line: "Total indicative value: ₹${totalBudget.toLocaleString('en-IN')}"
6. Ask them to provide: (a) itemwise pricing, (b) delivery timeline, (c) GST details separately, (d) sample availability if applicable
7. Mention: "Please reply to this email or call our facilities team. Respond within 2 business days."
8. Sign off as:
   Warm regards,
   Facilities Procurement Team
   FundFlow — University Operations
   Email: ${env.VENDOR_CC_EMAIL || 'facilities@example.com'}

CRITICAL: ${hasItems ? `The email MUST contain ALL ${items.length} items listed clearly. Here they are again for reference:
${itemsPlainList}

If you skip any item, the email is useless.` : ''}

Write ONLY the email body. No subject line.`;

    const emailBody = await askGemini(prompt);
    const subject = `[RFQ] ${req.title?.slice(0, 60)} — ${campusName} — FundFlow Facilities`;

    return json({
      subject,
      body: emailBody,
      to: vendor_email || vendor?.email || '',
      vendor_name: vendor?.name || 'Vendor',
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('AI email error:', errMsg);
    return json({ error: 'Email generation failed', detail: errMsg }, { status: 500 });
  }
};
