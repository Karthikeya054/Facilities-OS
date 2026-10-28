import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const [{ data: requirements }, { data: universities }] = await Promise.all([
    supabase.from('facility_requirements').select('*, vendor:vendors!assigned_vendor_id(*)').order('created_at', { ascending: false }),
    supabase.from('universities').select('id, name, short_name'),
  ]);

  // Map university data onto requirements
  const uniMap = new Map((universities ?? []).map(u => [u.id, u]));
  const enriched = (requirements ?? []).map(r => ({
    ...r,
    university: r.university_id ? uniMap.get(r.university_id) || null : null,
  }));

  return { requirements: enriched };
};
