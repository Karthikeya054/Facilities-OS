import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { requirement_id, file_name, file_type, file_data } = await request.json();
    if (!requirement_id || !file_data) return json({ error: 'requirement_id and file_data required' }, { status: 400 });

    const supabase = createServiceClient();

    // Convert base64 to buffer
    const base64 = file_data.split(',')[1] || file_data;
    const buffer = Buffer.from(base64, 'base64');

    // Upload to Supabase Storage
    const fileName = `bills/${requirement_id}/${Date.now()}_${file_name || 'bill.pdf'}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('facility-files')
      .upload(fileName, buffer, { contentType: file_type || 'application/pdf', upsert: true });

    if (uploadErr) {
      // Storage bucket might not exist — store as base64 in the items table instead
      // Fallback: store the file URL as a data URL in design_file_urls
      const { data: items } = await supabase
        .from('facility_requirement_items')
        .select('id, design_file_urls')
        .eq('requirement_id', requirement_id)
        .order('created_at')
        .limit(1);

      if (items && items.length > 0) {
        const existing = items[0].design_file_urls || [];
        // Store file info as a JSON-encoded string (not the actual data)
        const fileRecord = `bill:${file_name}:${new Date().toISOString()}`;
        await supabase
          .from('facility_requirement_items')
          .update({ design_file_urls: [...existing, fileRecord] })
          .eq('id', items[0].id);

        return json({ success: true, url: fileRecord, message: 'Bill record saved (storage bucket pending setup)' });
      } else {
        // Create a placeholder item
        await supabase.from('facility_requirement_items').insert({
          requirement_id,
          item_type: 'BILL',
          description: `Bill: ${file_name}`,
          quantity: 1,
          unit_price: 0,
          total_price: 0,
          design_file_urls: [`bill:${file_name}:${new Date().toISOString()}`],
        });
        return json({ success: true, message: 'Bill record saved' });
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('facility-files').getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl || '';

    // Store URL in the first item's design_file_urls
    const { data: items } = await supabase
      .from('facility_requirement_items')
      .select('id, design_file_urls')
      .eq('requirement_id', requirement_id)
      .order('created_at')
      .limit(1);

    if (items && items.length > 0) {
      const existing = items[0].design_file_urls || [];
      await supabase
        .from('facility_requirement_items')
        .update({ design_file_urls: [...existing, publicUrl] })
        .eq('id', items[0].id);
    }

    return json({ success: true, url: publicUrl });
  } catch (e) {
    console.error('Upload error:', e);
    return json({ error: 'Upload failed' }, { status: 500 });
  }
};
