import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/supabase';
import { vendors, universities } from '$lib/data';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
  const supabase = createServiceClient();
  const results: Record<string, string> = {};

  const uniRows = universities.map(u => ({
    code: u.code, name: u.name, city: u.city, students: u.students, is_active: true
  }));
  const { error: uniErr } = await supabase.from("universities").upsert(uniRows, { onConflict: "code" });
  results.universities = uniErr ? `ERROR: ${uniErr.message}` : `${uniRows.length} upserted`;

  const vendorRows = vendors.map(v => ({
    vendor_code: `V-${v.id}`, name: v.name, category: v.category, contact_name: v.contact,
    phone: v.phone || null, email: v.email || null, city: v.city, rating: v.rating,
    total_jobs: v.jobs, is_preferred: v.preferred
  }));
  const { error: vendorErr } = await supabase.from("vendors").upsert(vendorRows, { onConflict: "vendor_code" });
  results.vendors = vendorErr ? `ERROR: ${vendorErr.message}` : `${vendorRows.length} upserted`;

  return json({ success: true, results });
};

export const GET: RequestHandler = async () => {
  return json({
    message: "POST to seed the database.",
    vendors_count: vendors.length,
    universities_count: universities.length
  });
};
