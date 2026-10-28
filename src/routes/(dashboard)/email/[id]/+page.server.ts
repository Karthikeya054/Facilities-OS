import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, locals: { supabase } }) => {
  const [{ data: req }, { data: universities }] = await Promise.all([
    supabase.from('facility_requirements').select('*, vendor:vendors!assigned_vendor_id(*)').eq('id', params.id).single(),
    supabase.from('universities').select('id, name, short_name'),
  ]);

  const uniMap = new Map((universities ?? []).map(u => [u.id, u]));
  const enriched = req ? { ...req, university: req.university_id ? uniMap.get(req.university_id) || null : null } : null;

  // Get vendor from query params if passed from AI match page
  const vendorId = url.searchParams.get('vendor_id');
  const vendorEmail = url.searchParams.get('vendor_email');
  let selectedVendor = enriched?.vendor || null;
  if (vendorId && !selectedVendor) {
    const { data: v } = await supabase.from('vendors').select('*').eq('id', vendorId).single();
    selectedVendor = v;
  }

  return { req: enriched, selectedVendor, vendorEmail, ccEmail: env.VENDOR_CC_EMAIL || '' };
};
