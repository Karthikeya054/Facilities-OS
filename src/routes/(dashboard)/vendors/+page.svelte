<script>
  import { invalidateAll } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();
  let q = $state('');
  let cat = $state('all');
  let pageNum = $state(1);
  let perPage = $state(12);

  // Add vendor
  let showForm = $state(false);
  let saving = $state(false);
  let saveMsg = $state('');
  let form = $state({ name: '', category: '', contact_person: '', email: '', phone: '' });

  // Edit vendor
  let editVendor = $state(null);
  let editSaving = $state(false);

  let cats = $derived([...new Set(data.vendors.map(v => v.category).filter(Boolean))].sort());
  let rows = $derived(data.vendors.filter(v =>
    (cat === 'all' || v.category === cat) &&
    (!q || v.name.toLowerCase().includes(q.toLowerCase()) || (v.category || '').toLowerCase().includes(q.toLowerCase()) || (v.contact_person || '').toLowerCase().includes(q.toLowerCase()))
  ));
  let totalPages = $derived(Math.ceil(rows.length / perPage));
  let paged = $derived(rows.slice((pageNum - 1) * perPage, pageNum * perPage));

  $effect(() => { q; cat; perPage; pageNum = 1; });

  async function addVendor() {
    if (!form.name.trim()) return;
    saving = true; saveMsg = '';
    try {
      const res = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await res.json();
      if (res.ok) { saveMsg = `${form.name} added!`; form = { name: '', category: '', contact_person: '', email: '', phone: '' }; showForm = false; await invalidateAll(); }
      else saveMsg = result.error || 'Failed';
    } catch { saveMsg = 'Error'; }
    saving = false;
    setTimeout(() => saveMsg = '', 3000);
  }

  function openEdit(v) {
    editVendor = { ...v };
  }

  async function saveEdit() {
    if (!editVendor) return;
    editSaving = true;
    try {
      const res = await fetch('/api/vendors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editVendor) });
      if (res.ok) { editVendor = null; await invalidateAll(); }
    } catch (e) { console.error(e); }
    editSaving = false;
  }

  // Reviews modal
  let reviewVendor = $state(null);
  let vendorReviews = $state([]);
  let reviewAvg = $state(null);
  let loadingReviews = $state(false);

  async function openReviews(v) {
    reviewVendor = v;
    loadingReviews = true;
    try {
      const res = await fetch(`/api/vendors/${v.id}/reviews`);
      const result = await res.json();
      vendorReviews = result.reviews || [];
      reviewAvg = result.avg || null;
    } catch { vendorReviews = []; }
    loadingReviews = false;
  }
</script>

<div class="page-kicker">Module 02 &middot; {data.vendors.length} active vendors</div>
<div class="page-head">
  <div><h1 class="page-title">Vendor Directory</h1><div class="page-sub">Shared across all campuses &middot; Live from Supabase</div></div>
  <div class="h gap-8">
    {#if saveMsg}<span class="badge" data-tone="emerald">{saveMsg}</span>{/if}
    <button class="btn accent" onclick={() => showForm = !showForm}><Icon name="plus" size={14}/>{showForm ? 'Cancel' : 'Add Vendor'}</button>
  </div>
</div>

{#if showForm}
<div class="card" style="margin-bottom:14px;border-color:var(--accent)">
  <div class="card-head" style="background:var(--accent-soft)"><h3 class="card-title" style="color:var(--accent-ink)">Add New Vendor</h3></div>
  <div class="card-body" style="padding:16px">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="v gap-4"><span class="xs muted mono">NAME *</span><input class="input w-full" bind:value={form.name} placeholder="Vendor name"/></div>
      <div class="v gap-4"><span class="xs muted mono">CATEGORY</span><input class="input w-full" bind:value={form.category} placeholder="e.g. Printing, Events" list="cat-list"/><datalist id="cat-list">{#each cats as c}<option value={c}/>{/each}</datalist></div>
      <div class="v gap-4"><span class="xs muted mono">CONTACT PERSON</span><input class="input w-full" bind:value={form.contact_person} placeholder="Contact name"/></div>
      <div class="v gap-4"><span class="xs muted mono">PHONE</span><input class="input w-full" bind:value={form.phone} placeholder="9876543210"/></div>
      <div class="v gap-4"><span class="xs muted mono">EMAIL</span><input class="input w-full" bind:value={form.email} placeholder="vendor@email.com"/></div>
      <div class="v gap-4" style="justify-content:flex-end"><button class="btn accent" onclick={addVendor} disabled={saving || !form.name.trim()}><Icon name="check" size={12}/>{saving ? 'Saving...' : 'Save Vendor'}</button></div>
    </div>
  </div>
</div>
{/if}

<!-- Edit Modal -->
{#if editVendor}
<div class="modal-backdrop" onclick={() => editVendor = null}>
  <div class="modal" onclick={e => e.stopPropagation()} style="max-width:520px">
    <div class="modal-head"><div><h2 style="margin:0;font-size:16px;font-weight:600">Edit Vendor</h2><div class="xs muted">{editVendor.id.slice(0,8)}</div></div><button class="icon-btn" onclick={() => editVendor = null}><Icon name="x" size={16}/></button></div>
    <div class="modal-body" style="gap:12px">
      <div class="v gap-4"><span class="xs muted mono">NAME</span><input class="input w-full" bind:value={editVendor.name}/></div>
      <div class="v gap-4"><span class="xs muted mono">CATEGORY</span><input class="input w-full" bind:value={editVendor.category} list="cat-edit-list"/><datalist id="cat-edit-list">{#each cats as c}<option value={c}/>{/each}</datalist></div>
      <div class="v gap-4"><span class="xs muted mono">CONTACT PERSON</span><input class="input w-full" bind:value={editVendor.contact_person}/></div>
      <div class="v gap-4"><span class="xs muted mono">PHONE</span><input class="input w-full" bind:value={editVendor.phone}/></div>
      <div class="v gap-4"><span class="xs muted mono">EMAIL</span><input class="input w-full" bind:value={editVendor.email}/></div>
      <div class="v gap-4">
        <span class="xs muted mono">RATING</span>
        <div class="h gap-4">
          {#each [1,2,3,4,5] as star}
            <button style="background:none;border:none;cursor:pointer;font-size:22px;color:{star <= (editVendor.avg_rating || 0) ? 'var(--amber)' : 'var(--muted-3)'}" onclick={() => editVendor.avg_rating = star}>{star <= (editVendor.avg_rating || 0) ? '★' : '☆'}</button>
          {/each}
          <span class="mono small muted" style="margin-left:6px">{editVendor.avg_rating || 0}/5</span>
        </div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" onclick={() => editVendor = null}>Cancel</button><button class="btn accent" onclick={saveEdit} disabled={editSaving}><Icon name="check" size={12}/>{editSaving ? 'Saving...' : 'Save Changes'}</button></div>
  </div>
</div>
{/if}

<!-- Reviews Modal -->
{#if reviewVendor}
<div class="modal-backdrop" onclick={() => reviewVendor = null}>
  <div class="modal" onclick={e => e.stopPropagation()} style="max-width:600px">
    <div class="modal-head">
      <div>
        <h2 style="margin:0;font-size:16px;font-weight:600">{reviewVendor.name}</h2>
        <div class="xs muted">{reviewVendor.category} &middot; Reviews</div>
      </div>
      <button class="icon-btn" onclick={() => reviewVendor = null}><Icon name="x" size={16}/></button>
    </div>
    <div class="modal-body">
      {#if loadingReviews}
        <div class="empty" style="padding:30px"><div class="xs muted mono">LOADING REVIEWS...</div></div>
      {:else if vendorReviews.length === 0}
        <div class="empty" style="padding:30px">
          <Icon name="star" size={24}/>
          <div style="font-size:14px;font-weight:500;margin-top:8px">No reviews yet</div>
          <div class="xs muted">Reviews appear after a requirement is completed with this vendor.</div>
        </div>
      {:else}
        <!-- Average Summary -->
        {#if reviewAvg}
        <div style="display:grid;grid-template-columns:auto 1fr;gap:20px;padding:14px;background:var(--surface-2);border-radius:8px;margin-bottom:14px">
          <div class="v center" style="text-align:center">
            <div style="font-size:36px;font-weight:700;font-family:var(--font-mono)">{reviewAvg.overall}</div>
            <div class="h gap-2" style="justify-content:center">{#each [1,2,3,4,5] as s}<span style="font-size:16px;color:{s<=Math.round(reviewAvg.overall)?'var(--amber)':'var(--muted-3)'}">{s<=Math.round(reviewAvg.overall)?'★':'☆'}</span>{/each}</div>
            <div class="xs muted mono" style="margin-top:4px">{vendorReviews.length} REVIEW{vendorReviews.length !== 1 ? 'S' : ''}</div>
          </div>
          <div class="v gap-6">
            {#each [['Quality', reviewAvg.quality],['Communication', reviewAvg.communication],['Value for Money', reviewAvg.value]] as [label, val]}
            <div class="h gap-8" style="align-items:center"><span class="xs" style="width:110px;color:var(--muted)">{label}</span><div style="flex:1;height:6px;background:var(--hairline);border-radius:3px;overflow:hidden"><div style="height:100%;width:{(val/5)*100}%;background:var(--amber);border-radius:3px"></div></div><span class="mono xs" style="width:30px;text-align:right">{val}</span></div>
            {/each}
            {#if reviewAvg.onTime !== null}<div class="h gap-8"><span class="xs" style="width:110px;color:var(--muted)">On-time delivery</span><span class="mono xs" style="color:var(--emerald)">{reviewAvg.onTime}%</span></div>{/if}
          </div>
        </div>
        {/if}

        <!-- Individual Reviews -->
        {#each vendorReviews as rv}
        <div style="padding:12px 0;border-bottom:1px solid var(--hairline)">
          <div class="h between" style="margin-bottom:6px">
            <div class="h gap-8">
              <div class="avatar" style="width:28px;height:28px;font-size:10px">{rv.reviewer_name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
              <div><div style="font-weight:500;font-size:12.5px">{rv.reviewer_name}</div><div class="xs muted">{new Date(rv.created_at).toLocaleDateString()}</div></div>
            </div>
            <div class="h gap-2">{#each [1,2,3,4,5] as s}<span style="font-size:12px;color:{s<=rv.rating?'var(--amber)':'var(--muted-3)'}">{s<=rv.rating?'★':'☆'}</span>{/each}</div>
          </div>
          {#if rv.review_text}<p style="margin:0;font-size:12.5px;color:var(--ink-2);line-height:1.5">{rv.review_text}</p>{/if}
          <div class="h gap-10" style="margin-top:6px">
            {#if rv.delivery_on_time !== null}<span class="badge" data-tone={rv.delivery_on_time?'emerald':'rose'}>{rv.delivery_on_time?'On time':'Late'}</span>{/if}
            {#if rv.quality_rating}<span class="xs muted">Quality: {rv.quality_rating}/5</span>{/if}
            {#if rv.communication_rating}<span class="xs muted">Comm: {rv.communication_rating}/5</span>{/if}
            {#if rv.value_rating}<span class="xs muted">Value: {rv.value_rating}/5</span>{/if}
          </div>
        </div>
        {/each}
      {/if}
    </div>
    <div class="modal-foot"><button class="btn" onclick={() => reviewVendor = null}>Close</button></div>
  </div>
</div>
{/if}

<div class="filter-bar">
  <input class="input input-search" placeholder="Search by name, category, contact..." bind:value={q} style="width:300px"/>
  <select class="input" bind:value={cat}><option value="all">All categories ({cats.length})</option>{#each cats as c}<option>{c}</option>{/each}</select>
  <select class="input" bind:value={perPage} style="width:110px"><option value={12}>12 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option><option value={9999}>Show all</option></select>
  <div class="grow"></div>
  <span class="xs mono muted">{rows.length} VENDORS</span>
</div>

<div class="vgrid">
  {#each paged as v}
    <div class="vcard">
      <div class="vcard-head">
        <span class="vcard-num">#{v.id.slice(0,6)}</span>
        <span class="badge">{v.category || 'General'}</span>
      </div>
      <div class="vcard-name">{v.name}</div>
      <div class="vcard-info">
        {#if v.contact_person}<div class="vcard-info-row"><Icon name="user" size={12}/>{v.contact_person}</div>{/if}
        {#if v.email}<div class="vcard-info-row"><Icon name="mail" size={12}/>{v.email}</div>{/if}
        {#if v.phone}<div class="vcard-info-row"><Icon name="phone" size={12}/>{v.phone}</div>{/if}
        {#if !v.contact_person && !v.email && !v.phone}<div class="vcard-info-row xs muted">No contact info</div>{/if}
      </div>
      <!-- Rating — click to see reviews -->
      <button class="h gap-4" style="margin-top:4px;background:none;border:none;cursor:pointer;padding:2px 0;width:100%;text-align:left" onclick={() => openReviews(v)} title="View reviews">
        {#each [1,2,3,4,5] as star}
          <span style="font-size:14px;color:{star <= Math.round(v.avg_rating || 0) ? 'var(--amber)' : 'var(--muted-3)'}">{star <= Math.round(v.avg_rating || 0) ? '★' : '☆'}</span>
        {/each}
        <span class="mono xs muted" style="margin-left:2px">{v.avg_rating ? v.avg_rating.toFixed(1) : '0'}/5</span>
        <span class="mono xs muted">&middot; {v.total_orders} reviews</span>
      </button>
      <div class="vcard-foot">
        <button class="btn sm" style="flex:1" onclick={() => openEdit(v)}><Icon name="edit" size={11}/>Edit</button>
      </div>
    </div>
  {/each}
</div>

{#if totalPages > 1}
<div class="h between" style="margin-top:16px;padding:12px 14px;background:var(--surface);border:1px solid var(--hairline);border-radius:var(--r-lg)">
  <button class="btn sm" disabled={pageNum <= 1} onclick={() => pageNum--}>&larr; Previous</button>
  <div class="h gap-4">
    {#each Array(totalPages) as _, i}
      {#if totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i + 1 - pageNum) <= 1}
        <button class="btn sm" style={pageNum === i + 1 ? 'background:var(--ink);color:var(--bg);border-color:var(--ink)' : ''} onclick={() => pageNum = i + 1}>{i + 1}</button>
      {:else if i === 1 && pageNum > 3}<span class="xs muted">&hellip;</span>
      {:else if i === totalPages - 2 && pageNum < totalPages - 2}<span class="xs muted">&hellip;</span>
      {/if}
    {/each}
  </div>
  <button class="btn sm" disabled={pageNum >= totalPages} onclick={() => pageNum++}>Next &rarr;</button>
</div>
{/if}
<div class="xs muted mono" style="text-align:center;margin-top:8px">Showing {(pageNum-1)*perPage + 1}–{Math.min(pageNum*perPage, rows.length)} of {rows.length} vendors &middot; Page {pageNum} of {totalPages}</div>
