<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  let matches = $state([]);
  let loading = $state(false);
  let model = $state('gemini-2.5-flash');
  let itemsCount = $state(0);
  let selectedIdx = $state(-1);
  let assigning = $state(false);
  let assignError = $state('');

  // Manual vendor selection
  let showManual = $state(false);
  let vendorSearch = $state('');
  let vendorCat = $state('all');
  let manualSelectedId = $state('');

  const cacheKey = `ai-match-${$page.params.id}`;

  onMount(() => {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        matches = parsed.matches || [];
        model = parsed.model || 'gemini-2.5-flash';
        itemsCount = parsed.items_analyzed || 0;
      } catch { runMatch(); }
    } else {
      runMatch();
    }
  });

  async function runMatch() {
    loading = true;
    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement_id: $page.params.id })
      });
      const result = await res.json();
      if (result.matches) {
        matches = result.matches;
        model = result.model || 'gemini-2.5-flash';
        itemsCount = result.items_analyzed || 0;
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      }
    } catch (e) { console.error(e); }
    loading = false;
  }

  async function selectVendor(vendorId) {
    assigning = true;
    assignError = '';
    try {
      const res = await fetch(`/api/requirements/${$page.params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'vendor_assigned', assigned_vendor_id: vendorId, message: 'Vendor assigned' })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        goto(`/email/${$page.params.id}?vendor_id=${vendorId}`);
      } else {
        assignError = result.error || 'Failed to assign vendor';
      }
    } catch (e) { assignError = 'Network error'; console.error(e); }
    assigning = false;
  }

  let showAll = $state(false);
  let visibleMatches = $derived(showAll ? matches : matches.slice(0, 5));

  // Filter vendors for manual selection
  let vendorCats = $derived([...new Set(data.vendors.map(v => v.category).filter(Boolean))].sort());
  let filteredVendors = $derived(data.vendors.filter(v =>
    (vendorCat === 'all' || v.category === vendorCat) &&
    (!vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || (v.category || '').toLowerCase().includes(vendorSearch.toLowerCase()) || (v.contact_person || '').toLowerCase().includes(vendorSearch.toLowerCase()))
  ));
</script>

{#if !data.req}<div class="empty"><div class="empty-mark"></div>Request not found</div>
{:else}
{@const r = data.req}
<div class="page-kicker h gap-8"><button class="icon-btn" onclick={()=>goto(`/request/${r.id}`)}><Icon name="chev" size={14}/></button><span>{r.university?.short_name || r.delivery_notes || '—'}</span><span class="dot-sep">&middot;</span><span>Step 1: Vendor Matching</span></div>
<div class="page-head"><div><h1 class="page-title" style="display:flex;align-items:center;gap:10px"><Icon name="sparkle" size={20}/>Vendor Selection</h1><div class="page-sub">{r.title} &middot; Budget: ₹{(r.allocated_budget||0).toLocaleString('en-IN')}</div></div>
<div class="h gap-8">
  <button class="btn sm" onclick={runMatch} disabled={loading}><Icon name="refresh" size={12}/>{loading ? 'Analyzing...' : 'Re-analyze'}</button>
  <button class="btn" onclick={()=>goto(`/request/${r.id}`)}><Icon name="chev" size={12}/>Back to Detail</button>
</div></div>

<div class="steps" style="margin-bottom:16px">
  <div class="step" data-active={true}><span class="step-num">01</span><span>Select Vendor</span></div>
  <div class="step"><span class="step-num">02</span><span>Send RFQ Email</span></div>
  <div class="step"><span class="step-num">03</span><span>Track & Complete</span></div>
</div>

{#if assignError}
<div class="card" style="margin-bottom:12px;background:var(--rose-soft);border-color:var(--rose)"><div class="card-body h gap-10"><Icon name="alert" size={16}/><span style="font-weight:600;color:var(--rose)">{assignError}</span></div></div>
{/if}

<!-- Tab: AI Suggested vs Manual -->
<div class="seg" style="margin-bottom:14px">
  <button aria-pressed={!showManual} onclick={()=>showManual=false}><Icon name="sparkle" size={12}/>AI Suggested</button>
  <button aria-pressed={showManual} onclick={()=>showManual=true}><Icon name="vendors" size={12}/>Choose from All Vendors</button>
</div>

{#if !showManual}
  <!-- AI Suggested Section -->
  {#if loading}
    <div class="empty" style="padding:60px 20px"><div class="xs muted mono" style="letter-spacing:0.1em">ANALYZING {data.vendors.length} VENDORS WITH GEMINI...</div><div class="small muted" style="margin-top:8px">Results will be cached.</div></div>
  {:else if matches.length > 0}
    <div class="card" style="margin-bottom:14px;padding:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
      {#each [['Vendors scored',String(data.vendors.length)],['Top matches',String(matches.length)],['Items analyzed',String(itemsCount)],['Model',model]] as [k,v]}
      <div class="v gap-2"><span class="xs muted mono">{k.toUpperCase()}</span><span class="mono" style="font-size:15px;font-weight:600">{v}</span></div>
      {/each}
    </div>
    <div class="v gap-10">
      {#each visibleMatches as m, i}
      <div class="match-card" data-best={i===0} style={selectedIdx===i?'border-color:var(--emerald);box-shadow:0 0 0 3px var(--emerald-soft)':''}>
        <div class="match-score"><svg width="72" height="72"><circle cx="36" cy="36" r="28" stroke="var(--hairline)" stroke-width="6" fill="none"/><circle cx="36" cy="36" r="28" stroke={selectedIdx===i?'var(--emerald)':'var(--accent)'} stroke-width="6" fill="none" stroke-dasharray={2*Math.PI*28} stroke-dashoffset={2*Math.PI*28-(m.score/100)*2*Math.PI*28} stroke-linecap="round" style="transform:rotate(-90deg);transform-origin:center"/></svg><div class="match-score-text">{m.score}</div></div>
        <div class="match-body">
          <div class="h gap-8">{#if i===0}<span class="badge" data-tone="accent">Top match</span>{/if}{#if selectedIdx===i}<span class="badge" data-tone="emerald">Selected</span>{/if}<span class="match-name">{m.vendor?.name}</span><span class="xs muted mono">{m.vendor?.category}</span></div>
          <div class="match-reason">{m.reason}</div>
          <div class="match-chips">
            {#if m.vendor?.avg_rating}<span class="badge">Rating {m.vendor.avg_rating}</span>{/if}
            {#if m.vendor?.total_orders}<span class="badge mono">{m.vendor.total_orders} orders</span>{/if}
            {#if m.vendor?.phone}<span class="badge">{m.vendor.phone}</span>{/if}
            {#if m.vendor?.email}<span class="badge">{m.vendor.email}</span>{/if}
          </div>
        </div>
        <div class="v gap-6">
          {#if selectedIdx === i}
            <button class="btn accent" onclick={()=>selectVendor(m.vendor?.id)} disabled={assigning}><Icon name="arrow" size={12}/>{assigning ? 'Assigning...' : 'Proceed to Email →'}</button>
          {:else}
            <button class="btn accent" onclick={()=>{selectedIdx=i;manualSelectedId=''}}><Icon name="check" size={12}/>Select</button>
          {/if}
        </div>
      </div>
      {/each}
    </div>
    {#if matches.length > 5 && !showAll}
      <button class="btn" style="margin-top:12px;width:100%;justify-content:center" onclick={()=>showAll=true}><Icon name="arrowDown" size={12}/>View {matches.length - 5} more AI suggestions</button>
    {/if}
    {#if showAll && matches.length > 5}
      <button class="btn" style="margin-top:12px;width:100%;justify-content:center" onclick={()=>showAll=false}><Icon name="arrowUp" size={12}/>Show less</button>
    {/if}

    <div style="margin-top:16px;text-align:center"><span class="xs muted">Don't like these suggestions?</span> <button class="btn sm" style="display:inline-flex" onclick={()=>showManual=true}><Icon name="vendors" size={12}/>Choose from all {data.vendors.length} vendors</button></div>
  {:else}
    <div class="empty" style="padding:40px 20px">
      <Icon name="sparkle" size={32}/>
      <div style="font-size:15px;font-weight:600;margin:8px 0 4px">No AI matches yet</div>
      <div class="h gap-8" style="margin-top:12px">
        <button class="btn accent" onclick={runMatch}><Icon name="refresh" size={12}/>Run AI Match</button>
        <button class="btn" onclick={()=>showManual=true}><Icon name="vendors" size={12}/>Choose manually</button>
      </div>
    </div>
  {/if}

{:else}
  <!-- Manual Vendor Selection -->
  <div class="filter-bar" style="margin-bottom:14px">
    <input class="input input-search" placeholder="Search vendors by name, category..." bind:value={vendorSearch} style="width:300px"/>
    <select class="input" bind:value={vendorCat}>
      <option value="all">All categories ({vendorCats.length})</option>
      {#each vendorCats as c}<option>{c}</option>{/each}
    </select>
    <div class="grow"></div>
    <span class="xs mono muted">{filteredVendors.length} vendors</span>
  </div>

  <div class="card" style="padding:0;overflow:hidden;max-height:600px;overflow-y:auto">
    <table class="tbl">
      <thead><tr><th style="width:40px"></th><th>Vendor</th><th style="width:140px">Category</th><th style="width:80px">Rating</th><th style="width:80px">Orders</th><th style="width:120px">Contact</th><th style="width:100px">Action</th></tr></thead>
      <tbody>
      {#each filteredVendors as v}
        <tr style={manualSelectedId===v.id?'background:var(--emerald-soft)':''}>
          <td>{#if manualSelectedId===v.id}<Icon name="check" size={14}/>{/if}</td>
          <td><div style="font-weight:500">{v.name}</div>{#if v.contact_person}<div class="xs muted">{v.contact_person}</div>{/if}</td>
          <td><span class="badge">{v.category || 'General'}</span></td>
          <td class="mono">{v.avg_rating ? v.avg_rating + '/5' : '—'}</td>
          <td class="mono">{v.total_orders || 0}</td>
          <td class="xs">{v.phone || v.email || '—'}</td>
          <td>
            {#if manualSelectedId === v.id}
              <button class="btn accent sm" onclick={()=>selectVendor(v.id)} disabled={assigning}><Icon name="arrow" size={11}/>{assigning ? '...' : 'Proceed →'}</button>
            {:else}
              <button class="btn sm" onclick={()=>{manualSelectedId=v.id;selectedIdx=-1}}><Icon name="check" size={11}/>Select</button>
            {/if}
          </td>
        </tr>
      {/each}
      </tbody>
    </table>
  </div>

  {#if manualSelectedId}
    {@const sv = data.vendors.find(v => v.id === manualSelectedId)}
    {#if sv}
    <div class="card" style="margin-top:14px;border-color:var(--emerald);background:var(--emerald-soft)">
      <div class="card-body h between" style="padding:14px 16px">
        <div class="h gap-12">
          <Icon name="check" size={18}/>
          <div>
            <div style="font-weight:600">{sv.name}</div>
            <div class="xs">{sv.category} &middot; {sv.phone || sv.email || 'No contact'}</div>
          </div>
        </div>
        <button class="btn accent" onclick={()=>selectVendor(sv.id)} disabled={assigning}><Icon name="arrow" size={12}/>{assigning ? 'Assigning...' : 'Assign & Proceed to Email →'}</button>
      </div>
    </div>
    {/if}
  {/if}
{/if}
{/if}
