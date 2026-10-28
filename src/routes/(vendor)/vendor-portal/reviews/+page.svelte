<script>
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();
</script>

<h1 class="page-title">My Reviews</h1>
<div class="page-sub" style="margin-bottom:16px">See how the facilities team rated your work. Higher ratings = more orders via AI matching.</div>

{#if !data.vendorInfo}
<div class="card" style="background:var(--amber-soft);border-color:var(--amber)"><div class="card-body h gap-10"><Icon name="alert" size={16}/><div><span style="font-weight:600;color:var(--amber)">Profile not linked</span> — your email doesn't match any vendor. Contact the facilities team.</div></div></div>
{:else if data.reviews.length === 0}
<div class="empty" style="padding:60px"><Icon name="star" size={32}/><div style="font-size:15px;font-weight:500;margin-top:8px">No reviews yet</div><div class="xs muted" style="max-width:360px;text-align:center">After you complete an order, the facilities team will leave a review. It will appear here.</div></div>
{:else}
  <!-- Summary Card -->
  {#if data.avg}
  <div class="card" style="margin-bottom:20px">
    <div class="card-body" style="padding:20px;display:grid;grid-template-columns:auto 1fr;gap:24px">
      <div class="v center" style="text-align:center;padding:0 16px">
        <div style="font-size:48px;font-weight:700;font-family:var(--font-mono);line-height:1">{data.avg.overall}</div>
        <div class="h gap-2" style="justify-content:center;margin:6px 0">{#each [1,2,3,4,5] as s}<span style="font-size:20px;color:{s<=Math.round(data.avg.overall)?'var(--amber)':'var(--muted-3)'}">{s<=Math.round(data.avg.overall)?'★':'☆'}</span>{/each}</div>
        <div class="xs mono muted">{data.reviews.length} REVIEW{data.reviews.length!==1?'S':''}</div>
      </div>
      <div class="v gap-8">
        {#each [['Quality', data.avg.quality],['Communication', data.avg.communication],['Value for Money', data.avg.value]] as [label, val]}
        <div class="h gap-10" style="align-items:center">
          <span class="xs" style="width:130px;color:var(--muted)">{label}</span>
          <div style="flex:1;height:8px;background:var(--hairline);border-radius:4px;overflow:hidden"><div style="height:100%;width:{(val/5)*100}%;background:var(--amber);border-radius:4px"></div></div>
          <span class="mono xs" style="width:30px;text-align:right">{val}/5</span>
        </div>
        {/each}
        {#if data.avg.onTime !== null}
        <div class="h gap-10"><span class="xs" style="width:130px;color:var(--muted)">On-time delivery</span><span class="badge" data-tone={data.avg.onTime>=80?'emerald':'amber'}>{data.avg.onTime}%</span></div>
        {/if}
      </div>
    </div>
  </div>
  {/if}

  <!-- Individual Reviews -->
  <div class="v gap-10">
    {#each data.reviews as rv}
    <div class="card">
      <div class="card-body" style="padding:16px">
        <div class="h between" style="margin-bottom:8px">
          <div class="h gap-10">
            <div class="avatar" style="width:32px;height:32px;font-size:11px">{rv.reviewer_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
            <div><div style="font-weight:500;font-size:13px">{rv.reviewer_name}</div><div class="xs muted">{new Date(rv.created_at).toLocaleDateString()}</div></div>
          </div>
          <div class="h gap-2">{#each [1,2,3,4,5] as s}<span style="font-size:14px;color:{s<=rv.rating?'var(--amber)':'var(--muted-3)'}">{s<=rv.rating?'★':'☆'}</span>{/each}<span class="mono xs muted" style="margin-left:4px">{rv.rating}/5</span></div>
        </div>
        {#if rv.review_text}<p style="margin:0 0 10px;font-size:13px;color:var(--ink-2);line-height:1.6">{rv.review_text}</p>{/if}
        <div class="h gap-8" style="flex-wrap:wrap">
          {#if rv.delivery_on_time !== null}<span class="badge" data-tone={rv.delivery_on_time?'emerald':'rose'}>{rv.delivery_on_time?'✓ On time':'✗ Late'}</span>{/if}
          {#if rv.quality_rating}<span class="badge">Quality: {rv.quality_rating}/5</span>{/if}
          {#if rv.communication_rating}<span class="badge">Comm: {rv.communication_rating}/5</span>{/if}
          {#if rv.value_rating}<span class="badge">Value: {rv.value_rating}/5</span>{/if}
        </div>
      </div>
    </div>
    {/each}
  </div>
{/if}
