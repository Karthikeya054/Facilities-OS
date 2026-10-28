import { supabase } from '$lib/supabase-browser';

/* ------------------------------------------------------------------ */
/*  Types — matching REAL facility_requirements schema                 */
/* ------------------------------------------------------------------ */

export interface FacilityRequirement {
  id: string;
  budget_proposal_id: string | null;
  source: string | null;
  title: string;
  description: string | null;
  university_id: string | null;
  requested_by_name: string | null;
  requested_by_email: string | null;
  requested_by_user_id: string | null;
  cm_approved_by_name: string | null;
  cm_approved_by_email: string | null;
  cm_approved_at: string | null;
  admin_approved_by_name: string | null;
  admin_approved_by_email: string | null;
  admin_approved_at: string | null;
  allocated_budget: number | null;
  vendor_quoted_price: number | null;
  actual_cost: number | null;
  required_by_date: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: string;
  priority: string | null;
  assigned_vendor_id: string | null;
  vendor_email_sent_at: string | null;
  vendor_confirmed_at: string | null;
  delivery_location: string | null;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
  vendor?: DbVendor | null;
  university?: University | null;
}

export interface FacilityRequirementItem {
  id: string;
  requirement_id: string;
  item_type: string;
  description: string | null;
  quantity: number;
  sizes: Record<string, unknown> | null;
  measurements: string | null;
  material: string | null;
  color_codes: string | null;
  branding_specs: string | null;
  design_file_urls: string[] | null;
  design_notes: string | null;
  reference_image_urls: string[] | null;
  unit_price: number | null;
  total_price: number | null;
  created_at: string;
}

export interface DbVendor {
  id: string;
  name: string;
  category: string;
  contact_person: string;
  email: string;
  phone: string;
  is_active: boolean;
  item_types: string[];
  avg_rating: number;
  total_orders: number;
  avg_delivery_days: number;
  budget_range: string;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  short_name: string | null;
  slug: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

export async function fetchRequirements() {
  const { data, error } = await supabase
    .from('facility_requirements')
    .select('*, vendor:vendors!assigned_vendor_id(*), university:universities!university_id(*)')
    .order('created_at', { ascending: false });
  if (error) console.error('fetchRequirements:', error.message);
  return (data ?? []) as FacilityRequirement[];
}

export async function fetchRequirement(id: string) {
  const { data, error } = await supabase
    .from('facility_requirements')
    .select('*, vendor:vendors!assigned_vendor_id(*), university:universities!university_id(*)')
    .eq('id', id)
    .single();
  if (error) console.error('fetchRequirement:', error.message);
  return data as FacilityRequirement | null;
}

export async function fetchRequirementItems(requirementId: string) {
  const { data, error } = await supabase
    .from('facility_requirement_items')
    .select('*')
    .eq('requirement_id', requirementId)
    .order('created_at');
  if (error) console.error('fetchRequirementItems:', error.message);
  return (data ?? []) as FacilityRequirementItem[];
}

export async function fetchVendors() {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) console.error('fetchVendors:', error.message);
  return (data ?? []) as DbVendor[];
}

export async function fetchUniversities() {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('name');
  if (error) console.error('fetchUniversities:', error.message);
  return (data ?? []) as University[];
}

export async function createRequirement(req: Partial<FacilityRequirement>) {
  const { data, error } = await supabase
    .from('facility_requirements')
    .insert({ ...req, status: req.status || 'received' })
    .select()
    .single();
  if (error) throw error;
  return data as FacilityRequirement;
}

export async function createRequirementItems(
  requirementId: string,
  items: Partial<FacilityRequirementItem>[]
) {
  const rows = items.map((item) => ({ ...item, requirement_id: requirementId }));
  const { error } = await supabase.from('facility_requirement_items').insert(rows);
  if (error) throw error;
}
