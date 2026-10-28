import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) return { orders: [] };

  const email = user.email?.toLowerCase() || '';
  const { data: allAssigned } = await supabase
    .from('facility_requirements')
    .select('*, vendor:vendors!assigned_vendor_id(*)')
    .not('assigned_vendor_id', 'is', null)
    .order('updated_at', { ascending: false });

  const orders = (allAssigned || []).filter(r =>
    r.vendor?.email?.toLowerCase() === email
  );

  return { orders };
};
