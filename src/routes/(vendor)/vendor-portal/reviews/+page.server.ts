import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (!user) return { reviews: [], vendorInfo: null, avg: null };

  const email = user.email?.toLowerCase() || '';

  // Find vendor
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .ilike('email', email)
    .limit(1);

  const vendor = vendors?.[0] || null;
  if (!vendor) return { reviews: [], vendorInfo: null, avg: null };

  // Get reviews
  const { data: reviews } = await supabase
    .from('vendor_reviews')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });

  const revs = reviews || [];
  const avg = revs.length > 0 ? {
    overall: +(revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1),
    quality: +(revs.filter(r => r.quality_rating).reduce((s, r) => s + r.quality_rating, 0) / (revs.filter(r => r.quality_rating).length || 1)).toFixed(1),
    communication: +(revs.filter(r => r.communication_rating).reduce((s, r) => s + r.communication_rating, 0) / (revs.filter(r => r.communication_rating).length || 1)).toFixed(1),
    value: +(revs.filter(r => r.value_rating).reduce((s, r) => s + r.value_rating, 0) / (revs.filter(r => r.value_rating).length || 1)).toFixed(1),
    onTime: revs.filter(r => r.delivery_on_time !== null).length > 0
      ? Math.round(revs.filter(r => r.delivery_on_time).length / revs.filter(r => r.delivery_on_time !== null).length * 100) : null,
  } : null;

  return { reviews: revs, vendorInfo: vendor, avg };
};
