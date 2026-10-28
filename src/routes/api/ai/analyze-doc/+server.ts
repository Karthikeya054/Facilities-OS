import { json } from '@sveltejs/kit';
import { askGemini } from '$lib/gemini';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { text, file_name } = await request.json();
    if (!text) return json({ error: 'No text provided' }, { status: 400 });

    const prompt = `You are an AI assistant for FundFlow Facilities, a university procurement team.

A user uploaded a document (${file_name || 'document'}) for creating a procurement request.
Read the document content below and extract ALL relevant information.

DOCUMENT CONTENT:
${text.slice(0, 15000)}

EXTRACT THE FOLLOWING AND RESPOND IN EXACTLY THIS JSON FORMAT (no markdown, no code blocks):
{
  "title": "Short title for this procurement request (max 60 chars)",
  "description": "Brief description of what this is for (2-3 sentences)",
  "priority": "low" or "medium" or "high",
  "estimated_budget": total budget as a number (just the number, no currency symbol),
  "items": [
    {
      "description": "Item name/description",
      "item_type": "General" or "Equipment" or "T-shirt" or "Banner" or "Trophy" or "Stationery" or "Service" or "Printing",
      "quantity": number,
      "unit_price": number (just the number),
      "link": "product URL if mentioned, or null"
    }
  ]
}

RULES:
- Extract EVERY item mentioned in the document, especially from tables, lists, or equipment sections
- If quantities are mentioned, use them. If not, default to 1.
- If prices are mentioned (in ₹ or Rs or INR), extract the number
- If Amazon/Flipkart/product links are mentioned, include them
- If no items table exists, create items from whatever is described
- Calculate total budget from all items if not explicitly stated
- title should be concise — event name + what's needed
- priority: urgent/immediate = high, normal = medium, no rush = low`;

    const response = await askGemini(prompt);

    let parsed;
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else parsed = JSON.parse(cleaned);
    } catch {
      return json({ error: 'Failed to parse document. Try a simpler format.', raw: response.slice(0, 500) }, { status: 422 });
    }

    return json({ success: true, data: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('Analyze doc error:', msg);
    return json({ error: 'Analysis failed', detail: msg }, { status: 500 });
  }
};
