import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from('facility_requirements').select('*').eq('id', params.id).single(),
    supabase.from('facility_requirement_items').select('*').eq('requirement_id', params.id).order('created_at'),
  ]);
  return { order, items: items ?? [] };
};
