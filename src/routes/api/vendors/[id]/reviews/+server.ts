import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createServiceClient } from '$lib/supabase';
import type { RequestHandler } from './$types';

// GET — all reviews for a vendor
export const GET: RequestHandler = async ({ params }) => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('vendor_reviews')
    .select('*')
    .eq('vendor_id', params.id)
    .order('created_at', { ascending: false });

  if (error) return json({ error: error.message }, { status: 500 });

  // Calculate averages
  const reviews = data || [];
  const avg = reviews.length > 0
    ? {
        overall: +(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        quality: +(reviews.filter(r => r.quality_rating).reduce((s, r) => s + r.quality_rating, 0) / (reviews.filter(r => r.quality_rating).length || 1)).toFixed(1),
        communication: +(reviews.filter(r => r.communication_rating).reduce((s, r) => s + r.communication_rating, 0) / (reviews.filter(r => r.communication_rating).length || 1)).toFixed(1),
        value: +(reviews.filter(r => r.value_rating).reduce((s, r) => s + r.value_rating, 0) / (reviews.filter(r => r.value_rating).length || 1)).toFixed(1),
        onTime: reviews.filter(r => r.delivery_on_time !== null).length > 0
          ? Math.round(reviews.filter(r => r.delivery_on_time).length / reviews.filter(r => r.delivery_on_time !== null).length * 100)
          : null,
      }
    : null;

  return json({ reviews, avg, total: reviews.length });
};

// POST — submit a review + update vendor avg_rating + notify proposer
export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    const { data: review, error } = await supabase
      .from('vendor_reviews')
      .insert({
        vendor_id: params.id,
        requirement_id: body.requirement_id,
        reviewer_name: body.reviewer_name || 'Facilities Team',
        reviewer_email: body.reviewer_email || '',
        rating: body.rating,
        review_text: body.review_text || null,
        delivery_on_time: body.delivery_on_time ?? null,
        quality_rating: body.quality_rating || null,
        communication_rating: body.communication_rating || null,
        value_rating: body.value_rating || null,
        proposer_name: body.proposer_name || null,
        proposer_email: body.proposer_email || null,
      })
      .select()
      .single();

    if (error) return json({ error: error.message }, { status: 500 });

    // Recalculate vendor avg_rating from all reviews
    const { data: allReviews } = await supabase
      .from('vendor_reviews')
      .select('rating')
      .eq('vendor_id', params.id);

    if (allReviews && allReviews.length > 0) {
      const newAvg = +(allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1);
      await supabase.from('vendors').update({
        avg_rating: newAvg,
        total_orders: allReviews.length,
        updated_at: new Date().toISOString(),
      }).eq('id', params.id);
    }

    // Notify proposer via UniConnect if they have an email
    if (body.proposer_email && body.requirement_id) {
      const { data: req } = await supabase
        .from('facility_requirements')
        .select('budget_proposal_id, title')
        .eq('id', body.requirement_id)
        .single();

      if (req?.budget_proposal_id) {
        const url = env.UNICONNECT_WEBHOOK_URL;
        const secret = env.WEBHOOK_SECRET;
        if (url) {
          try {
            await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-webhook-secret': secret || '' },
              body: JSON.stringify({
                action: 'review_submitted',
                budget_proposal_id: req.budget_proposal_id,
                requirement_id: body.requirement_id,
                review: {
                  rating: body.rating,
                  review_text: body.review_text,
                  reviewer_name: body.reviewer_name,
                  quality_rating: body.quality_rating,
                  delivery_on_time: body.delivery_on_time,
                },
                vendor_name: body.vendor_name,
                message: `Review submitted for "${req.title}". Please rate your satisfaction.`,
                proposer_review_link: true,
              })
            });
          } catch (e) { console.warn('Failed to notify proposer:', e); }
        }
      }
    }

    return json({ success: true, review }, { status: 201 });
  } catch {
    return json({ error: 'Invalid request' }, { status: 400 });
  }
};
