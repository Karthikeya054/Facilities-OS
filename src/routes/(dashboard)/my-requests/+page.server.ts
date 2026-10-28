import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  const email = user?.email?.toLowerCase() || '';

  const { data } = await supabase
    .from('facility_requirements')
    .select('*')
    .eq('source', 'internal')
    .order('created_at', { ascending: false });

  // Filter to requests raised by this user OR show all for admins
  const requests = (data || []).filter(r =>
    r.requested_by_email?.toLowerCase() === email || !r.requested_by_email
  );

  return { requests, allInternal: data || [], userEmail: email };
};
