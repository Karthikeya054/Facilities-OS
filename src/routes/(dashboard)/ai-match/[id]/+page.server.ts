import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const [{ data: req }, { data: vendors }, { data: universities }] = await Promise.all([
    supabase.from('facility_requirements').select('*, vendor:vendors!assigned_vendor_id(*)').eq('id', params.id).single(),
    supabase.from('vendors').select('*').eq('is_active', true).order('avg_rating', { ascending: false }).limit(20),
    supabase.from('universities').select('id, name, short_name'),
  ]);

  const uniMap = new Map((universities ?? []).map(u => [u.id, u]));
  const enriched = req ? { ...req, university: req.university_id ? uniMap.get(req.university_id) || null : null } : null;

  return { req: enriched, vendors: vendors ?? [] };
};
