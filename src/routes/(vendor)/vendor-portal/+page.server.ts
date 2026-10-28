import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) return { orders: [], vendorInfo: null };

  const email = user.email?.toLowerCase() || '';

  // Find vendor records matching this email
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .ilike('email', email);

  // Also find by matching vendor phone/name loosely
  const vendorIds = (vendors || []).map(v => v.id);

  // Get all requirements assigned to any of these vendors
  let orders: unknown[] = [];
  if (vendorIds.length > 0) {
    const { data } = await supabase
      .from('facility_requirements')
      .select('*')
      .in('assigned_vendor_id', vendorIds)
      .order('created_at', { ascending: false });
    orders = data || [];
  }

  // Also get orders where vendor email was used (even if vendor record doesn't match)
  // This covers cases where the vendor was assigned but email doesn't match exactly
  const { data: allAssigned } = await supabase
    .from('facility_requirements')
    .select('*, vendor:vendors!assigned_vendor_id(*)')
    .not('assigned_vendor_id', 'is', null)
    .order('created_at', { ascending: false });

  // Filter to orders where the assigned vendor's email matches
  const emailOrders = (allAssigned || []).filter(r =>
    r.vendor?.email?.toLowerCase() === email
  );

  // Merge and deduplicate
  const allOrders = [...orders, ...emailOrders];
  const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());

  return {
    orders: uniqueOrders,
    vendorInfo: vendors?.[0] || null,
    vendorEmail: email,
  };
};
