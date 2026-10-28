import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import type { RequestHandler } from './$types';

// PATCH — edit requirement
export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const fields = ['title', 'description', 'allocated_budget', 'priority', 'required_by_date', 'delivery_location', 'requested_by_name', 'requested_by_email'];
    for (const f of fields) {
      if (body[f] !== undefined) update[f] = body[f];
    }

    const { data, error } = await supabase
      .from('facility_requirements')
      .update(update)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ success: true, requirement: data });
  } catch {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};

// DELETE — delete requirement and its items
export const DELETE: RequestHandler = async ({ params }) => {
  try {
    const supabase = createServiceClient();
    await supabase.from('facility_requirement_items').delete().eq('requirement_id', params.id);
    const { error } = await supabase.from('facility_requirements').delete().eq('id', params.id);
    if (error) return json({ error: error.message }, { status: 500 });
    return json({ success: true });
  } catch {
    return json({ error: 'Delete failed' }, { status: 500 });
  }
};
