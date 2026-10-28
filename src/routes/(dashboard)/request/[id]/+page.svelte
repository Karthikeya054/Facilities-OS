<script>
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Icon from '$lib/Icon.svelte';

  let { data } = $props();
  const SC = { received:"slate", vendor_search:"amber", vendor_assigned:"blue", vendor_confirmed:"blue", sample_ready:"violet", in_production:"violet", in_transit:"accent", delivered:"emerald", completed:"emerald" };
  const STAGES = ["received","vendor_search","vendor_assigned","vendor_confirmed","sample_ready","in_production","in_transit","delivered","completed"];
  let advancing = $state(false);
  let advanceMsg = $state('');
  let saving = $state(false);
  let saveMsg = $state('');

  let quotedPrice = $state('');
  let actualCost = $state('');
  let deliveryDate = $state('');
  let vendorNotes = $state('');

  // Review
  let rev = $state({ rating: 0, quality_rating: 0, communication_rating: 0, value_rating: 0, delivery_on_time: null, review_text: '' });
  let reviewSaving = $state(false);
  let reviewSubmitted = $state(false);

  async function submitReview() {
    const r = data.req;
    if (!r || !r.vendor || rev.rating === 0) return;
    reviewSaving = true;
    try {
      const res = await fetch(`/api/vendors/${r.vendor.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: r.id,
          reviewer_name: user?.name || 'Facilities Team',
          reviewer_email: user?.email || '',
          rating: rev.rating,
          review_text: rev.review_text || null,
          delivery_on_time: rev.delivery_on_time,
          quality_rating: rev.quality_rating || null,
          communication_rating: rev.communication_rating || null,
          value_rating: rev.value_rating || null,
          proposer_name: r.requested_by_name,
          proposer_email: r.requested_by_email,
          vendor_name: r.vendor.name,
        })
      });
      if (res.ok) reviewSubmitted = true;
    } catch (e) { console.error(e); }
    reviewSaving = false;
  }

  // Get logged-in user info for review
  let user = $state(null);

  onMount(async () => {
    const r = data.req;
    if (r) {
      quotedPrice = r.vendor_quoted_price ? String(r.vendor_quoted_price) : '';
      actualCost = r.actual_cost ? String(r.actual_cost) : '';
      deliveryDate = r.estimated_delivery_date || '';
      vendorNotes = r.delivery_notes || '';
    }
    // Get user info for reviews
    const { data: { user: u } } = await data.supabase.auth.getUser();
    if (u) {
      const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'User';
      user = { name, email: u.email || '' };
    }
    // Check if review already exists
    if (r?.vendor?.id) {
      const res = await fetch(`/api/vendors/${r.vendor.id}/reviews`);
      const { reviews } = await res.json();
      const existing = reviews?.find(rv => rv.requirement_id === r.id);
      if (existing) { rev = existing; reviewSubmitted = true; }
    }
    const channel = data.supabase
      .channel(`req-${$page.params.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facility_requirements', filter: `id=eq.${$page.params.id}` }, () => { invalidateAll(); })
      .subscribe();
    return () => { data.supabase.removeChannel(channel); };
  });

  async function advanceStatus() {
    const r = data.req;
    if (!r) return;
    const ci = STAGES.indexOf(r.status);
    if (ci >= STAGES.length - 1) return;
    const next = STAGES[ci + 1];
    advancing = true;
    try {
      const res = await fetch(`/api/requirements/${r.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, message: `Status advanced to ${next.replace(/_/g,' ')}`, vendor_quoted_price: quotedPrice ? Number(quotedPrice) : undefined, actual_cost: actualCost ? Number(actualCost) : undefined, estimated_delivery_date: deliveryDate || undefined })
      });
      if (res.ok) { advanceMsg = `Advanced to "${next.replace(/_/g,' ')}" — UniConnect notified`; await invalidateAll(); setTimeout(() => advanceMsg = '', 4000); }
    } catch (e) { console.error(e); }
    advancing = false;
  }

  async function saveUpdates() {
    const r = data.req;
    if (!r) return;
    saving = true; saveMsg = '';
    try {
      const res = await fetch(`/api/requirements/${r.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: r.status, vendor_quoted_price: quotedPrice ? Number(quotedPrice) : undefined, actual_cost: actualCost ? Number(actualCost) : undefined, estimated_delivery_date: deliveryDate || undefined, delivery_notes: vendorNotes || undefined, message: 'Details updated by facilities team' })
      });
      if (res.ok) { saveMsg = 'Saved & synced'; await invalidateAll(); } else { saveMsg = 'Failed'; }
    } catch { saveMsg = 'Error'; }
    saving = false;
    setTimeout(() => saveMsg = '', 3000);
  }
</script>

{#if !data.req}
  <div class="empty" style="padding:80px 20px"><div class="empty-mark"></div><div>Request not found</div><button class="btn" onclick={()=>goto('/control-center')}>Back</button></div>
{:else}
  {@const r = data.req}
  {@const items = data.items}
  {@const ci = STAGES.indexOf(r.status)}
  {@const fp = ci >= 0 ? (ci / (STAGES.length - 1)) * 100 : 0}
  {@const itot = items.reduce((a, it) => a + (it.total_price || it.quantity * (it.unit_price || 0)), 0)}
  {@const days = r.required_by_date ? Math.round((new Date(r.required_by_date).getTime() - Date.now()) / 86400000) : null}
  {@const overdue = days !== null && days < 0 && !['delivered','completed'].includes(r.status)}
  {@const cmaApproved = !!(r.cm_approved_by_name || r.cm_approved_at)}
  {@const isInternal = r.source === 'internal'}
  {@const l1Name = r.cm_approved_by_name || (isInternal ? data.approverDefaults?.l1Name : 'CMA Manager') || '—'}
  {@const l1Email = r.cm_approved_by_email || (isInternal ? data.approverDefaults?.l1Email : '') || '—'}
  {@const l2Name = r.admin_approved_by_name || (isInternal ? data.approverDefaults?.l2Name : 'Admin') || '—'}
  {@const l2Email = r.admin_approved_by_email || (isInternal ? data.approverDefaults?.l2Email : '') || '—'}
  {@const adminApproved = !!(r.admin_approved_by_name || r.admin_approved_at)}

  <div class="page-kicker h gap-8"><button class="icon-btn" onclick={()=>goto('/control-center')}><Icon name="chev" size={14}/></button><span>{r.university?.short_name || r.delivery_notes || '—'}</span><span class="dot-sep">&middot;</span><span>Detail</span></div>
  <div class="page-head"><div>
    <div class="h gap-10" style="margin-bottom:6px">
      <span class="badge mono">{r.university?.short_name || r.delivery_notes || '—'}</span>
      <span class="badge dot" data-tone={SC[r.status]||'slate'}>{r.status.replace(/_/g,' ')}</span>
      {#if r.priority}<span class="badge" data-tone={r.priority==='high'?'rose':r.priority==='medium'?'amber':'slate'}>{r.priority}</span>{/if}
      {#if cmaApproved}<span class="badge" data-tone="emerald">L1 Approved</span>{/if}
      {#if adminApproved && (isInternal || (r.allocated_budget || 0) >= 10000)}<span class="badge" data-tone="emerald">L2 Approved</span>{/if}
    </div>
    <h1 class="page-title" style="font-size:22px">{r.title || 'Untitled'}</h1>
    <div class="page-sub">{#if r.requested_by_name}Requested by {r.requested_by_name} &middot; {/if}{#if r.required_by_date}Need by <span class="mono">{r.required_by_date}</span> ({#if overdue}<span style="color:var(--rose)">{Math.abs(days)}d overdue</span>{:else}{days}d{/if}){/if}</div>
  </div><div class="h gap-8">
    <button class="btn sm" onclick={()=>goto(`/ai-match/${r.id}`)}><Icon name="sparkle" size={12}/>AI Match</button>
    <button class="btn sm" onclick={()=>goto(`/email/${r.id}`)}><Icon name="mail" size={12}/>Email Vendor</button>
    <button class="btn primary sm" onclick={advanceStatus} disabled={advancing || ci >= STAGES.length - 1}><Icon name="arrow" size={12}/>{advancing ? 'Updating...' : ci < STAGES.length - 1 ? `Advance → ${STAGES[ci+1].replace(/_/g,' ')}` : 'Completed'}</button>
  </div></div>

  {#if advanceMsg}
  <div class="card" style="margin-bottom:12px;background:var(--emerald-soft);border-color:var(--emerald)">
    <div class="card-body h gap-10"><Icon name="check" size={16}/><span style="font-weight:600;color:var(--emerald)">{advanceMsg}</span></div>
  </div>
  {/if}

  <!-- Quick Actions -->
  <div class="card" style="margin-bottom:16px;padding:12px 16px">
    <div class="h gap-8" style="flex-wrap:wrap">
      {#if !r.assigned_vendor_id && ['received','vendor_search'].includes(r.status)}
        <button class="btn accent" onclick={()=>goto(`/ai-match/${r.id}`)}><Icon name="sparkle" size={12}/>Step 1: AI Match Vendors</button>
      {/if}
      {#if r.assigned_vendor_id && ['vendor_assigned'].includes(r.status)}
        <button class="btn accent" onclick={()=>goto(`/email/${r.id}`)}><Icon name="mail" size={12}/>Step 2: Send RFQ Email</button>
      {/if}
      {#if ['vendor_confirmed','sample_ready','in_production','in_transit'].includes(r.status)}
        <span class="badge dot" data-tone="blue">Step 3: Tracking — update details below</span>
      {/if}
      {#if r.status === 'delivered'}<span class="badge dot" data-tone="emerald">Delivered — confirm and complete</span>{/if}
      {#if r.status === 'completed'}<span class="badge dot" data-tone="emerald">Completed</span>{/if}
      <div class="grow"></div>
      <span class="xs mono muted">₹{(r.allocated_budget||0).toLocaleString('en-IN')}{r.actual_cost ? ` → ₹${r.actual_cost.toLocaleString('en-IN')}` : ''}</span>
    </div>
  </div>

  <!-- Status Timeline -->
  <div class="card" style="padding:4px 20px 14px;margin-bottom:16px">
    <div class="h between" style="padding:10px 0 0"><span class="xs muted mono">STATUS TIMELINE</span><span class="xs muted mono">STAGE {ci+1} OF {STAGES.length}</span></div>
    <div class="rail"><div class="rail-fill" style="width:calc({fp}% * 0.89 + 5.5%)"></div>
    {#each STAGES as st,i}<div class="rail-stage" data-state={i<ci?'done':i===ci?'current':'future'}><div class="rail-node" data-state={i<ci?'done':i===ci?'current':'future'}></div><div class="rail-label">{st.replace(/_/g,' ')}</div></div>{/each}</div>
  </div>

  <!-- Approval Chain -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3 class="card-title">Approval Chain</h3></div>
    <div class="card-body">
      <div class="chain">
        <div class="chain-link">
          <div class="chain-step">01</div>
          <div style="width:8px;height:8px;border-radius:50%;background:var(--emerald);flex-shrink:0"></div>
          <div class="chain-info"><div class="chain-name">{r.requested_by_name || 'Unknown'}</div><div class="chain-role">{r.requested_by_email || 'Submitted'}</div></div>
          <div class="chain-status" style="color:var(--emerald)">Submitted</div>
        </div>
        <div class="chain-link">
          <div class="chain-step">02</div>
          <div style="width:8px;height:8px;border-radius:50%;background:{cmaApproved ? 'var(--emerald)' : 'var(--muted-3)'};flex-shrink:0"></div>
          <div class="chain-info"><div class="chain-name">{l1Name}</div><div class="chain-role">{l1Email}</div></div>
          <div class="chain-status" style="color:{cmaApproved ? 'var(--emerald)' : 'var(--amber)'}">{cmaApproved ? `Approved${r.cm_approved_at ? ' ' + new Date(r.cm_approved_at).toLocaleDateString() : ''}` : 'Pending'}</div>
        </div>
        {#if isInternal || (r.allocated_budget || 0) >= 10000}
        <div class="chain-link">
          <div class="chain-step">03</div>
          <div style="width:8px;height:8px;border-radius:50%;background:{adminApproved ? 'var(--emerald)' : 'var(--muted-3)'};flex-shrink:0"></div>
          <div class="chain-info"><div class="chain-name">{l2Name}</div><div class="chain-role">{l2Email || (isInternal ? 'L2 Approval' : 'Admin Approval (≥₹10K)')}</div></div>
          <div class="chain-status" style="color:{adminApproved ? 'var(--emerald)' : 'var(--amber)'}">{adminApproved ? `Approved${r.admin_approved_at ? ' ' + new Date(r.admin_approved_at).toLocaleDateString() : ''}` : 'Pending'}</div>
        </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="detail-grid"><div class="v gap-16">
    <!-- Items -->
    <div class="card"><div class="card-head"><h3 class="card-title">Items</h3><span class="xs muted mono">{items.length} ITEM{items.length!==1?'S':''}</span><div class="grow"></div>{#if itot>0}<span class="mono small">Total: ₹{itot.toLocaleString('en-IN')}</span>{/if}</div><div class="card-body v gap-12">
    {#if items.length===0}<div class="xs muted" style="padding:8px">No items</div>
    {:else}{#each items as it,idx}
      <div style="padding-bottom:12px;border-bottom:{idx<items.length-1?'1px solid var(--hairline)':'0'}">
        <div class="h between" style="margin-bottom:4px">
          <div class="h gap-10"><span class="badge" data-tone="slate">{String(idx+1).padStart(2,'0')}</span><div><span style="font-weight:600">{it.description || it.item_type}</span><div class="xs muted">{it.item_type} &middot; Qty: {it.quantity}</div></div></div>
          <div class="mono" style="font-weight:600">₹{(it.total_price || it.quantity * (it.unit_price || 0)).toLocaleString('en-IN')}</div>
        </div>
        <div class="h gap-12" style="margin-left:42px;margin-top:4px">
          <span class="xs mono muted">₹{(it.unit_price||0).toLocaleString('en-IN')} × {it.quantity}</span>
          {#if it.material}<span class="xs muted">Vendor: {it.material}</span>{/if}
          {#if it.design_notes}<a href={it.design_notes} target="_blank" class="xs" style="color:var(--accent)">Quotation</a>{/if}
        </div>
      </div>
    {/each}{/if}
    </div></div>

    <!-- Description -->
    {#if r.description}<div class="card"><div class="card-head"><h3 class="card-title">Description</h3></div><div class="card-body"><p style="margin:0;color:var(--ink-2);line-height:1.6;white-space:pre-wrap;font-size:12.5px">{r.description}</p></div></div>{/if}

    <!-- Attachments -->
    {#if data.items.some(it => (it.reference_image_urls?.length || 0) > 0 || (it.design_file_urls?.length || 0) > 0)}
    {@const allRefUrls = data.items.flatMap(it => it.reference_image_urls || [])}
    {@const allBillUrls = data.items.flatMap(it => it.design_file_urls || [])}
    {#if allRefUrls.length > 0 || allBillUrls.length > 0}
    <div class="card">
      <div class="card-head"><h3 class="card-title"><Icon name="file" size={14}/>Attachments</h3><span class="xs muted mono">{allRefUrls.length + allBillUrls.length} FILES</span></div>
      <div class="card-body v gap-10">
        {#if allRefUrls.length > 0}<div class="xs muted mono" style="letter-spacing:0.06em">REFERENCE / DESIGN FILES</div><div style="display:flex;flex-wrap:wrap;gap:8px">{#each allRefUrls as url, i}{@const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url)}{#if isImage}<a href={url} target="_blank" style="display:block;width:120px;height:90px;border-radius:6px;overflow:hidden;border:1px solid var(--hairline)"><img src={url} alt="Ref {i+1}" style="width:100%;height:100%;object-fit:cover"/></a>{:else}<a href={url} target="_blank" class="btn sm"><Icon name="file" size={12}/>{url.split('/').pop()?.slice(0,25) || `File ${i+1}`}</a>{/if}{/each}</div>{/if}
        {#if allBillUrls.length > 0}<div class="xs muted mono" style="letter-spacing:0.06em;margin-top:8px">BILLS / RECEIPTS</div><div style="display:flex;flex-wrap:wrap;gap:8px">{#each allBillUrls as url, i}<a href={url} target="_blank" class="btn sm"><Icon name="card" size={12}/>{url.split('/').pop()?.slice(0,25) || `Bill ${i+1}`}</a>{/each}</div>{/if}
      </div>
    </div>
    {/if}
    {/if}

    <!-- Facilities Team Updates -->
    <div class="card" style="border-color:var(--accent)">
      <div class="card-head" style="background:var(--accent-soft)"><h3 class="card-title" style="color:var(--accent-ink)"><Icon name="edit" size={14}/>Facilities Team Updates</h3>
        {#if saveMsg}<span class="badge" data-tone="emerald" style="margin-left:auto">{saveMsg}</span>{/if}
      </div>
      <div class="card-body v gap-12">
        <div style="display:grid;grid-template-columns:140px 1fr;gap:12px;align-items:center"><span class="xs muted mono">QUOTED PRICE ₹</span><input class="input mono" type="number" bind:value={quotedPrice} placeholder="Vendor's quoted price" style="width:200px"/></div>
        <div style="display:grid;grid-template-columns:140px 1fr;gap:12px;align-items:center"><span class="xs muted mono">ACTUAL COST ₹</span><input class="input mono" type="number" bind:value={actualCost} placeholder="Final cost" style="width:200px"/></div>
        <div style="display:grid;grid-template-columns:140px 1fr;gap:12px;align-items:center"><span class="xs muted mono">DELIVERY DATE</span><input class="input mono" type="date" bind:value={deliveryDate} style="width:200px"/></div>
        <div style="display:grid;grid-template-columns:140px 1fr;gap:12px;align-items:start"><span class="xs muted mono" style="padding-top:6px">NOTES</span><textarea class="input" bind:value={vendorNotes} placeholder="Vendor call notes, confirmations..." rows="3" style="height:auto;padding:8px;resize:vertical;width:100%"></textarea></div>
        <div class="h gap-8" style="margin-top:4px"><button class="btn accent" onclick={saveUpdates} disabled={saving}><Icon name="check" size={12}/>{saving ? 'Saving...' : isInternal ? 'Save & Notify Raiser' : 'Save & Sync to UniConnect'}</button></div>
      </div>
    </div>

  </div><div class="v gap-16">
    <!-- Cost -->
    <div class="card"><div class="card-head"><h3 class="card-title">Cost</h3></div><div class="card-body v gap-10">
      <div class="h between"><span class="xs muted mono">ALLOCATED</span><span class="mono" style="font-size:16px;font-weight:600">₹{(r.allocated_budget||0).toLocaleString('en-IN')}</span></div>
      <div class="h between"><span class="xs muted mono">QUOTED</span><span class="mono">{r.vendor_quoted_price?`₹${r.vendor_quoted_price.toLocaleString('en-IN')}`:'—'}</span></div>
      <div class="h between"><span class="xs muted mono">ACTUAL</span><span class="mono">{r.actual_cost?`₹${r.actual_cost.toLocaleString('en-IN')}`:'—'}</span></div>
      {#if r.actual_cost && r.allocated_budget}{@const sv = r.allocated_budget - r.actual_cost}<div class="h between"><span class="xs muted mono">SAVINGS</span><span class="mono" style="color:{sv>=0?'var(--emerald)':'var(--rose)'}">₹{Math.abs(sv).toLocaleString('en-IN')} {sv>=0?'saved':'over'}</span></div>{/if}
    </div></div>

    <!-- Vendor -->
    <div class="card"><div class="card-head"><h3 class="card-title">Vendor</h3>{#if r.vendor}<span class="badge" data-tone="emerald">Assigned</span>{/if}</div><div class="card-body">{#if r.vendor}<div class="v gap-6"><div style="font-size:13.5px;font-weight:600">{r.vendor.name}</div><div class="xs muted">{r.vendor.category}{r.vendor.phone?` · ${r.vendor.phone}`:''}</div>{#if r.vendor.email}<div class="xs muted">{r.vendor.email}</div>{/if}<div class="h gap-6" style="margin-top:4px"><button class="btn sm" onclick={()=>goto(`/email/${r.id}?vendor_id=${r.vendor.id}&vendor_email=${r.vendor.email||''}`)}><Icon name="mail" size={11}/>Send RFQ</button></div></div>{:else}<div class="v gap-10 center" style="padding:8px 0"><div class="empty-mark"></div><div class="small muted">No vendor assigned.</div><button class="btn sm accent" onclick={()=>goto(`/ai-match/${r.id}`)}><Icon name="sparkle" size={12}/>AI Match</button></div>{/if}</div></div>

    <!-- Details -->
    <div class="card"><div class="card-head"><h3 class="card-title">Details</h3></div><div class="card-body">
      <div class="spec-row"><span class="spec-k">Campus</span><span class="spec-v">{r.university?.short_name || r.university?.name || r.delivery_notes || '—'}</span></div>
      <div class="spec-row"><span class="spec-k">Venue</span><span class="spec-v">{r.delivery_location || '—'}</span></div>
      <div class="spec-row"><span class="spec-k">Status</span><span class="spec-v">{r.status.replace(/_/g,' ')}</span></div>
      <div class="spec-row"><span class="spec-k">Priority</span><span class="spec-v">{r.priority || '—'}</span></div>
      <div class="spec-row"><span class="spec-k">Source</span><span class="spec-v">{r.source || '—'}</span></div>
      <div class="spec-row"><span class="spec-k">Created</span><span class="spec-v mono">{new Date(r.created_at).toLocaleDateString()}</span></div>
      {#if r.required_by_date}<div class="spec-row"><span class="spec-k">Need by</span><span class="spec-v mono">{r.required_by_date}</span></div>{/if}
      {#if r.requested_by_name}<div class="spec-row"><span class="spec-k">Requester</span><span class="spec-v">{r.requested_by_name}</span></div>{/if}
      {#if r.requested_by_email}<div class="spec-row"><span class="spec-k">Email</span><span class="spec-v">{r.requested_by_email}</span></div>{/if}
    </div></div>

    <!-- Review Vendor (delivered/completed) -->
    {#if ['delivered','completed'].includes(r.status) && r.vendor}
    <div class="card" style="border-color:var(--emerald)">
      <div class="card-head" style="background:var(--emerald-soft)"><h3 class="card-title" style="color:var(--emerald)"><Icon name="star" size={14}/>Review Vendor</h3>
        {#if reviewSubmitted}<span class="badge" data-tone="emerald">Review submitted!</span>{/if}
      </div>
      {#if reviewSubmitted}
        <div class="card-body v gap-6" style="padding:16px">
          <div class="h gap-8"><span style="font-size:24px;color:var(--amber)">{#each Array(rev.rating) as _}★{/each}{#each Array(5 - rev.rating) as _}☆{/each}</span><span class="mono" style="font-size:16px;font-weight:600">{rev.rating}/5</span></div>
          {#if rev.review_text}<p style="margin:0;color:var(--ink-2);line-height:1.5;font-size:13px">"{rev.review_text}"</p>{/if}
          <div class="xs muted">Review submitted &middot; Proposer notified</div>
        </div>
      {:else}
        <div class="card-body v gap-12" style="padding:16px">
          <div class="xs muted">Rate {r.vendor.name}'s performance. This review helps AI match better and is sent to the proposer ({r.requested_by_name}).</div>

          <div class="v gap-4"><span class="xs muted mono">OVERALL RATING *</span>
            <div class="h gap-4">{#each [1,2,3,4,5] as star}<button style="background:none;border:none;cursor:pointer;font-size:26px;color:{star<=rev.rating?'var(--amber)':'var(--muted-3)'}" onclick={()=>rev.rating=star}>{star<=rev.rating?'★':'☆'}</button>{/each}<span class="mono small muted" style="margin-left:8px">{rev.rating}/5</span></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="v gap-4"><span class="xs muted mono">QUALITY</span>
              <div class="h gap-2">{#each [1,2,3,4,5] as s}<button style="background:none;border:none;cursor:pointer;font-size:16px;color:{s<=rev.quality_rating?'var(--amber)':'var(--muted-3)'}" onclick={()=>rev.quality_rating=s}>{s<=rev.quality_rating?'★':'☆'}</button>{/each}</div>
            </div>
            <div class="v gap-4"><span class="xs muted mono">COMMUNICATION</span>
              <div class="h gap-2">{#each [1,2,3,4,5] as s}<button style="background:none;border:none;cursor:pointer;font-size:16px;color:{s<=rev.communication_rating?'var(--amber)':'var(--muted-3)'}" onclick={()=>rev.communication_rating=s}>{s<=rev.communication_rating?'★':'☆'}</button>{/each}</div>
            </div>
            <div class="v gap-4"><span class="xs muted mono">VALUE FOR MONEY</span>
              <div class="h gap-2">{#each [1,2,3,4,5] as s}<button style="background:none;border:none;cursor:pointer;font-size:16px;color:{s<=rev.value_rating?'var(--amber)':'var(--muted-3)'}" onclick={()=>rev.value_rating=s}>{s<=rev.value_rating?'★':'☆'}</button>{/each}</div>
            </div>
          </div>

          <div class="h gap-12">
            <span class="xs muted mono">DELIVERED ON TIME?</span>
            <button class="btn sm" style={rev.delivery_on_time===true?'background:var(--emerald);color:white;border-color:var(--emerald)':''} onclick={()=>rev.delivery_on_time=true}><Icon name="check" size={11}/>Yes</button>
            <button class="btn sm" style={rev.delivery_on_time===false?'background:var(--rose);color:white;border-color:var(--rose)':''} onclick={()=>rev.delivery_on_time=false}><Icon name="x" size={11}/>No</button>
          </div>

          <div class="v gap-4"><span class="xs muted mono">REVIEW (OPTIONAL)</span>
            <textarea class="input" bind:value={rev.review_text} rows="3" style="height:auto;padding:8px;resize:vertical;width:100%" placeholder="How was the vendor's work? Quality, delivery, communication..."></textarea>
          </div>

          <button class="btn accent" onclick={submitReview} disabled={reviewSaving || rev.rating===0}><Icon name="send" size={12}/>{reviewSaving ? 'Submitting...' : 'Submit Review & Notify Proposer'}</button>
        </div>
      {/if}
    </div>
    {/if}
  </div></div>

  <!-- Full Lifecycle Summary — bottom, full width -->
  <div class="card" style="margin-top:20px">
    <div class="card-head"><h3 class="card-title"><Icon name="clock" size={14}/>Complete Lifecycle</h3></div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:14px">
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">CREATED</span><span class="mono small">{new Date(r.created_at).toLocaleDateString()}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">STATUS</span><span class="badge dot" data-tone={SC[r.status]||'slate'}>{r.status.replace(/_/g,' ')}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">BUDGET ALLOCATED</span><span class="mono small" style="font-weight:600">₹{(r.allocated_budget||0).toLocaleString('en-IN')}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">VENDOR QUOTED</span><span class="mono small">{r.vendor_quoted_price ? `₹${r.vendor_quoted_price.toLocaleString('en-IN')}` : '—'}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">ACTUAL COST</span><span class="mono small">{r.actual_cost ? `₹${r.actual_cost.toLocaleString('en-IN')}` : '—'}</span></div>
        {#if r.actual_cost && r.allocated_budget}{@const sv = r.allocated_budget - r.actual_cost}
        <div class="v gap-4" style="padding:10px;background:{sv>=0?'var(--emerald-soft)':'var(--rose-soft)'};border-radius:6px"><span class="xs muted mono">SAVINGS</span><span class="mono small" style="font-weight:600;color:{sv>=0?'var(--emerald)':'var(--rose)'}">₹{Math.abs(sv).toLocaleString('en-IN')} {sv>=0?'saved':'over budget'}</span></div>
        {/if}
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">VENDOR</span><span class="small">{r.vendor?.name || 'Not assigned'}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">DELIVERY DATE</span><span class="mono small">{r.estimated_delivery_date || r.actual_delivery_date || '—'}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">L1 APPROVAL</span><span class="small" style="color:{cmaApproved?'var(--emerald)':'var(--amber)'}">{cmaApproved ? `${l1Name} ✓` : `Pending — ${l1Name}`}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">L2 APPROVAL</span><span class="small" style="color:{adminApproved?'var(--emerald)':'var(--amber)'}">{adminApproved ? `${l2Name} ✓` : isInternal ? `Pending — ${l2Name}` : (r.allocated_budget||0) >= 10000 ? 'Pending' : 'Not required'}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">LAST UPDATED</span><span class="mono small">{new Date(r.updated_at).toLocaleDateString()}</span></div>
        <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">CAMPUS</span><span class="small">{r.university?.short_name || r.delivery_notes || '—'}</span></div>
      </div>
    </div>
  </div>
{/if}
