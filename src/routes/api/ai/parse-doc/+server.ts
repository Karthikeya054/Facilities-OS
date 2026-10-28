import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { file_data, file_name, file_type } = await request.json();
    if (!file_data) return json({ error: 'No file data' }, { status: 400 });

    const base64 = file_data.split(',')[1] || file_data;
    const buffer = Buffer.from(base64, 'base64');
    const name = (file_name || '').toLowerCase();

    let text = '';
    let html = '';

    if (name.endsWith('.docx') || file_type?.includes('wordprocessingml') || file_type?.includes('openxmlformats')) {
      const mammoth = await import('mammoth');
      const textResult = await mammoth.default.extractRawText({ buffer });
      text = textResult.value;
      const htmlResult = await mammoth.default.convertToHtml({ buffer });
      html = htmlResult.value;
    } else if (name.endsWith('.doc') || file_type?.includes('msword')) {
      try {
        const mammoth = await import('mammoth');
        const textResult = await mammoth.default.extractRawText({ buffer });
        text = textResult.value;
        const htmlResult = await mammoth.default.convertToHtml({ buffer });
        html = htmlResult.value;
      } catch {
        text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      }
    } else if (name.endsWith('.pdf') || file_type?.includes('pdf')) {
      try {
        // @ts-ignore
        const pdfParse = (await import('pdf-parse')).default ?? (await import('pdf-parse'));
        const data = await pdfParse(buffer);
        text = data.text;
      } catch {
        text = '';
      }
    } else {
      text = buffer.toString('utf-8');
    }

    if (!text || text.trim().length < 10) {
      return json({ error: 'Could not extract text. Try .docx format or paste content directly.' }, { status: 422 });
    }

    // Extract items from HTML tables (most reliable)
    const items = html ? extractFromHtml(html) : extractFromText(text);

    // Find title
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let title = lines[0] || '';
    if (title.length > 80) title = title.slice(0, 80);

    // Find total budget
    let totalBudget = 0;
    const totalMatch = text.match(/(?:total|grand total)[:\s]*₹?\s*([\d,]+)/i);
    if (totalMatch) totalBudget = parseInt(totalMatch[1].replace(/,/g, ''));
    if (!totalBudget) totalBudget = items.reduce((s, i) => s + (i.total_price || 0), 0);

    return json({
      success: true,
      text: text.slice(0, 20000),
      html: html ? html.slice(0, 30000) : undefined,
      chars: text.length,
      extracted: { title, items, totalBudget }
    });
  } catch (e) {
    console.error('Parse doc error:', e);
    return json({ error: 'Failed to parse: ' + (e instanceof Error ? e.message : '') }, { status: 500 });
  }
};

// Parse HTML tables — most reliable for DOCX
function extractFromHtml(html: string) {
  const items: { description: string; quantity: number; unit_price: number; total_price: number; link: string }[] = [];

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
  const linkRegex = /href="([^"]+)"/;
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, '').trim();

  // First pass: detect column headers
  const rows: { cells: string[]; links: string[] }[] = [];
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    const links: string[] = [];
    let cellMatch;
    cellRegex.lastIndex = 0;
    while ((cellMatch = cellRegex.exec(match[1])) !== null) {
      cells.push(stripTags(cellMatch[1]));
      const lm = cellMatch[1].match(linkRegex);
      links.push(lm ? lm[1] : '');
    }
    rows.push({ cells, links });
  }

  if (rows.length < 2) return items;

  // Detect column mapping from header row
  const header = rows[0].cells.map(c => c.toLowerCase().trim());
  let colItem = header.findIndex(h => h.includes('item') || h.includes('name') || h.includes('description'));
  let colQty = header.findIndex(h => h.includes('qty') || h.includes('quantity'));
  let colLink = header.findIndex(h => h.includes('link') || h.includes('url'));
  let colCost = header.findIndex(h => h.includes('cost') || h.includes('price') || h.includes('unit'));
  let colTotal = header.findIndex(h => h.includes('total') || h.includes('amount'));

  // Defaults if not found
  if (colItem === -1) colItem = 0;
  if (colQty === -1) colQty = 1;

  // Process data rows
  for (let r = 1; r < rows.length; r++) {
    const { cells, links } = rows[r];
    if (cells.length < 2) continue;

    let name = cells[colItem] || '';
    if (!name || name === '-' || name === '') continue;

    // Parse quantity — might be embedded in item name like "Badminton Trophies - 2"
    let qty = 0;
    if (colQty >= 0 && colQty < cells.length) {
      // Take only the first number before any parenthesis — "2 (12 balls)" → 2
      const qtyCell = cells[colQty].trim();
      const qtyMatch = qtyCell.match(/^(\d+)/);
      qty = qtyMatch ? parseInt(qtyMatch[1]) : 0;
    }
    // If qty is 0 or "-", check if name contains "- N"
    if (!qty) {
      const nameQtyMatch = name.match(/[-–]\s*(\d+)$/);
      if (nameQtyMatch) {
        qty = parseInt(nameQtyMatch[1]);
        name = name.replace(/\s*[-–]\s*\d+$/, '').trim();
      }
    }
    if (!qty) qty = 1;

    // Get link
    const link = links.find(l => l && l.startsWith('http')) || '';

    // Get cost (unit price) and total
    let cost = 0, total = 0;
    if (colCost >= 0 && colCost < cells.length) {
      cost = parseInt(cells[colCost].replace(/[^\d]/g, '')) || 0;
    }
    if (colTotal >= 0 && colTotal < cells.length) {
      total = parseInt(cells[colTotal].replace(/[^\d]/g, '')) || 0;
    }

    // Calculate missing values
    if (total && !cost && qty) cost = Math.round(total / qty);
    if (cost && !total && qty) total = cost * qty;
    if (!cost && !total) continue; // Skip rows with no price data (like totals row)

    items.push({ description: name, quantity: qty, unit_price: cost, total_price: total, link });
  }

  return items;
}

// Fallback: parse from plain text
function extractFromText(text: string) {
  const items: { description: string; quantity: number; unit_price: number; total_price: number; link: string }[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const parts = line.split(/[\t|]/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const name = parts[0];
      if (name.toLowerCase() === 'item' || name.toLowerCase() === 'qty' || name === '#') continue;

      let qty = 0, cost = 0, total = 0, link = '';
      for (const p of parts.slice(1)) {
        if (p.match(/^https?:\/\//)) { link = p; continue; }
        if (p === '-') continue;
        const num = parseInt(p.replace(/[^\d]/g, ''));
        if (!isNaN(num) && num > 0) {
          if (qty === 0) qty = num;
          else if (cost === 0) cost = num;
          else if (total === 0) total = num;
        }
      }
      if (name && name.length > 1 && (qty > 0 || cost > 0)) {
        if (!total && qty && cost) total = qty * cost;
        items.push({ description: name, quantity: qty || 1, unit_price: cost || total, total_price: total || cost, link });
      }
    }
  }
  return items;
}
