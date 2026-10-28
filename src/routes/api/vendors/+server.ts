import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('vendors')
      .insert({
        name: body.name,
        category: body.category || 'General',
        contact_person: body.contact_person || null,
        email: body.email || null,
        phone: body.phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ success: true, vendor: data }, { status: 201 });
  } catch {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.id) return json({ error: 'id required' }, { status: 400 });

    const supabase = createServiceClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) update.name = body.name;
    if (body.category !== undefined) update.category = body.category;
    if (body.contact_person !== undefined) update.contact_person = body.contact_person;
    if (body.email !== undefined) update.email = body.email;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.avg_rating !== undefined) update.avg_rating = body.avg_rating;

    const { data, error } = await supabase
      .from('vendors')
      .update(update)
      .eq('id', body.id)
      .select()
      .single();

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ success: true, vendor: data });
  } catch {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};
