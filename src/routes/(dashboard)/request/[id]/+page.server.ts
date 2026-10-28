import { approvers } from '$lib/server/approvals';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  const [{ data: req }, { data: items }, { data: universities }] = await Promise.all([
    supabase.from('facility_requirements').select('*, vendor:vendors!assigned_vendor_id(*)').eq('id', params.id).single(),
    supabase.from('facility_requirement_items').select('*').eq('requirement_id', params.id).order('created_at'),
    supabase.from('universities').select('id, name, short_name'),
  ]);

  const uniMap = new Map((universities ?? []).map(u => [u.id, u]));
  const enriched = req ? { ...req, university: req.university_id ? uniMap.get(req.university_id) || null : null } : null;

  const a = approvers();
  const approverDefaults = { l1Name: a.l1Name, l1Email: a.l1Email, l2Name: a.l2Name, l2Email: a.l2Emails.join(', ') };

  return { req: enriched, items: items ?? [], approverDefaults };
};
