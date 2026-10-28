import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data: universities } = await supabase
    .from('universities')
    .select('*')
    .order('name');

  // Count requirements per university
  const { data: reqs } = await supabase
    .from('facility_requirements')
    .select('university_id');

  const countMap: Record<string, number> = {};
  (reqs ?? []).forEach(r => { if (r.university_id) countMap[r.university_id] = (countMap[r.university_id] || 0) + 1; });

  return {
    universities: (universities ?? []).map(u => ({ ...u, requestCount: countMap[u.id] || 0 })),
  };
};
