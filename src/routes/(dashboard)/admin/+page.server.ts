import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const [{ data: requirements }, { data: vendors }, { data: universities }] = await Promise.all([
    supabase.from('facility_requirements').select('*').order('created_at', { ascending: false }),
    supabase.from('vendors').select('*').eq('is_active', true),
    supabase.from('universities').select('id, name, short_name'),
  ]);

  const uniMap = new Map((universities ?? []).map(u => [u.id, u]));
  const enrichedReqs = (requirements ?? []).map(r => ({
    ...r,
    university: r.university_id ? uniMap.get(r.university_id) || null : null,
  }));

  return {
    totalRequests: enrichedReqs.length,
    activeRequests: enrichedReqs.filter(r => !['delivered','completed'].includes(r.status)).length,
    overdueRequests: enrichedReqs.filter(r => r.required_by_date && new Date(r.required_by_date) < new Date() && !['delivered','completed'].includes(r.status)).length,
    totalVendors: vendors?.length ?? 0,
    totalUniversities: universities?.length ?? 0,
    requirements: enrichedReqs,
    vendors: vendors ?? [],
  };
};
