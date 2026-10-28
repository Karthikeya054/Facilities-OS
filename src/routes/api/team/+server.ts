import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import type { RequestHandler } from './$types';

// GET — list all team members
export const GET: RequestHandler = async () => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('facility_team_members')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ members: data });
};

// POST — add a team member
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.email || !body.name) return json({ error: 'email and name required' }, { status: 400 });

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('facility_team_members')
      .insert({
        email: body.email.toLowerCase().trim(),
        name: body.name.trim(),
        role: body.role || 'member',
        added_by: body.added_by || null,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('duplicate')) return json({ error: 'This email is already a team member' }, { status: 409 });
      return json({ error: error.message }, { status: 500 });
    }
    return json({ success: true, member: data }, { status: 201 });
  } catch {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};

// DELETE — remove a team member
export const DELETE: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.id) return json({ error: 'id required' }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('facility_team_members')
      .delete()
      .eq('id', body.id);

    if (error) return json({ error: error.message }, { status: 500 });
    return json({ success: true });
  } catch {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};
