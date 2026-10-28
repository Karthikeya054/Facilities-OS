import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import { askGemini } from '$lib/gemini';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { requirement_id } = await request.json();
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

    const { data: vendors } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true);

    if (!vendors || vendors.length === 0) return json({ error: 'No vendors found' }, { status: 404 });

    // Build detailed items summary
    const itemsSummary = (items || []).map(i =>
      `- ${i.quantity}x ${i.description || i.item_type} | Category: ${i.item_type} | ₹${i.unit_price}/unit | Total: ₹${i.total_price || i.quantity * (i.unit_price || 0)}${i.material ? ' | Material: ' + i.material : ''}${i.sizes ? ' | Sizes: ' + JSON.stringify(i.sizes) : ''}`
    ).join('\n');

    // Build vendor list with all details
    const vendorList = vendors.map(v =>
      `ID:${v.id} | Name:${v.name} | Category:${v.category} | Rating:${v.avg_rating || 0}/5 | Past Orders:${v.total_orders} | Avg Delivery:${v.avg_delivery_days || 'N/A'}d | Phone:${v.phone || 'N/A'} | Email:${v.email || 'N/A'}`
    ).join('\n');

    const prompt = `You are an expert procurement AI for FundFlow Facilities, a university procurement team in India managing purchases across 20+ campuses.

YOUR TASK: Analyze the requirement below and match the BEST vendors from our directory. Read the FULL DESCRIPTION carefully to understand exactly what is needed — the type of items, the event context, the quantities, the urgency.

=== REQUIREMENT ===
Title: ${req.title}
Full Description: ${req.description || 'No detailed description provided'}
Campus: ${req.delivery_notes || 'Unknown'}
Venue: ${req.delivery_location || 'Campus'}
Budget: ₹${req.allocated_budget || 'Not specified'}
Priority: ${req.priority || 'medium'}
Required By: ${req.required_by_date || 'Not specified'}
Requester: ${req.requested_by_name || 'Unknown'}

=== ITEMS NEEDED ===
${itemsSummary || 'Items not itemized — read the description above to understand what is needed'}

=== VENDOR DIRECTORY (${vendors.length} vendors) ===
${vendorList}

=== MATCHING RULES ===
1. READ the description carefully. If it mentions T-shirts, match Printing/Apparel vendors. If it mentions trophies, match Trophy vendors. If it mentions food, match Catering vendors. etc.
2. Category match is the MOST important factor (weight 40%)
3. Past order count shows reliability (weight 25%)
4. Rating shows quality (weight 20%)
5. Delivery speed matters for urgent requests (weight 15%)
6. A vendor with 0 orders and no rating should score LOW (below 50)
7. Return TOP 10 matches, not just 5

RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks, no explanation):
[
  {"vendor_id": "exact-uuid-from-list", "score": 95, "reason": "One sentence explaining why this vendor matches this specific requirement"},
  {"vendor_id": "exact-uuid-from-list", "score": 88, "reason": "..."}
]`;

    const response = await askGemini(prompt);

    let matches;
    try {
      // Extract JSON from response — handle markdown wrapping
      let cleaned = response;
      const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
      if (jsonMatch) cleaned = jsonMatch[0];
      matches = JSON.parse(cleaned);
    } catch {
      // Fallback: category-based matching
      const desc = ((req.title || '') + ' ' + (req.description || '')).toLowerCase();
      const categoryScores: Record<string, number> = {};

      // Simple keyword matching
      const keywords: Record<string, string[]> = {
        'Printing': ['print', 'banner', 'poster', 'standee', 'certificate', 'report', 'brochure'],
        'Apparel': ['tshirt', 't-shirt', 'shirt', 'hoodie', 'jersey', 'uniform', 'cap', 'wear'],
        'Trophies': ['trophy', 'medal', 'award', 'prize', 'shield'],
        'Catering': ['food', 'catering', 'cake', 'snack', 'lunch', 'dinner', 'breakfast'],
        'Events': ['event', 'fest', 'festival', 'concert', 'show', 'stage', 'cultural'],
        'Photography': ['photo', 'video', 'camera', 'shoot'],
        'AV & Production': ['sound', 'light', 'audio', 'speaker', 'mic', 'projector'],
        'Stationery': ['pen', 'notebook', 'folder', 'stationery', 'diary'],
        'Signage': ['sign', 'board', 'acrylic', 'flex', 'vinyl'],
        'Transport': ['transport', 'travel', 'cab', 'bus', 'vehicle'],
      };

      for (const [cat, words] of Object.entries(keywords)) {
        for (const w of words) {
          if (desc.includes(w)) categoryScores[cat] = (categoryScores[cat] || 0) + 10;
        }
      }

      matches = vendors
        .map(v => {
          let score = 30; // base
          const catScore = categoryScores[v.category] || 0;
          score += catScore;
          if (v.avg_rating) score += v.avg_rating * 4;
          if (v.total_orders) score += Math.min(v.total_orders * 2, 20);
          return { vendor_id: v.id, score: Math.min(Math.round(score), 99), reason: `${v.category} vendor — ${v.total_orders || 0} orders, rating ${v.avg_rating || 'N/A'}` };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    }

    const vendorMap = new Map(vendors.map(v => [v.id, v]));
    const enriched = matches
      .filter((m: { vendor_id: string }) => vendorMap.has(m.vendor_id))
      .map((m: { vendor_id: string; score: number; reason: string }) => ({
        ...m,
        vendor: vendorMap.get(m.vendor_id),
      }));

    return json({ matches: enriched, model: 'gemini-2.5-flash', items_analyzed: items?.length || 0 });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error('AI match error:', errMsg);
    return json({ error: 'AI matching failed', detail: errMsg }, { status: 500 });
  }
};
