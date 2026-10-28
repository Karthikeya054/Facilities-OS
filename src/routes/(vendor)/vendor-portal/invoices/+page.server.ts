import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) return { orders: [] };

  const email = user.email?.toLowerCase() || '';
  const { data: allAssigned } = await supabase
    .from('facility_requirements')
    .select('*, vendor:vendors!assigned_vendor_id(*)')
    .not('assigned_vendor_id', 'is', null)
    .order('created_at', { ascending: false });

  const orders = (allAssigned || []).filter(r =>
    r.vendor?.email?.toLowerCase() === email
  );

  // Get items with bill URLs for these orders
  const orderIds = orders.map(o => o.id);
  let items: unknown[] = [];
  if (orderIds.length > 0) {
    const { data } = await supabase
      .from('facility_requirement_items')
      .select('*')
      .in('requirement_id', orderIds);
    items = data || [];
  }

  return { orders, items };
};
