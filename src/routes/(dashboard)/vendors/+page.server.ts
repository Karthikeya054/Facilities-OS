import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data } = await supabase.from('vendors').select('*').eq('is_active', true).order('name');
  return { vendors: data ?? [] };
};
