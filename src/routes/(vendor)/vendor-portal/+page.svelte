<script>
  import { goto } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  const SC = { received:"slate", vendor_search:"amber", vendor_assigned:"blue", vendor_confirmed:"blue", sample_ready:"violet", in_production:"violet", in_transit:"accent", delivered:"emerald", completed:"emerald" };
  function sl(s) { return (s||'').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()); }

  let filter = $state('all');
  let filtered = $derived(filter === 'all' ? data.orders : data.orders.filter(o => {
    if (filter === 'action') return o.status === 'vendor_assigned';
    if (filter === 'active') return ['vendor_confirmed','sample_ready','in_production','in_transit'].includes(o.status);
    if (filter === 'done') return ['delivered','completed'].includes(o.status);
    return true;
  }));
</script>

<h1 class="page-title">My Orders</h1>
<div class="page-sub" style="margin-bottom:16px">All procurement orders assigned to you.</div>

{#if data.vendorInfo}
<div class="card" style="margin-bottom:16px;padding:14px 16px">
  <div class="h gap-16">
    <div class="avatar" style="width:44px;height:44px;font-size:16px;background:var(--violet)">{data.vendorInfo.name.slice(0,2).toUpperCase()}</div>
    <div class="grow"><div style="font-weight:600">{data.vendorInfo.name}</div><div class="xs muted">{data.vendorInfo.category} &middot; {data.vendorInfo.email || data.vendorEmail}</div></div>
    <div class="h gap-2">{#each [1,2,3,4,5] as s}<span style="color:{s<=Math.round(data.vendorInfo.avg_rating||0)?'var(--amber)':'var(--muted-3)'}">{s<=Math.round(data.vendorInfo.avg_rating||0)?'★':'☆'}</span>{/each}<span class="mono xs muted" style="margin-left:4px">{data.vendorInfo.avg_rating||0}/5</span></div>
  </div>
</div>
{:else}
<div class="card" style="margin-bottom:16px;background:var(--amber-soft);border-color:var(--amber)"><div class="card-body h gap-10"><Icon name="alert" size={16}/><div><span style="font-weight:600;color:var(--amber)">Profile not linked</span> — Your email ({data.vendorEmail}) doesn't match any vendor. Ask the facilities team to update your vendor email.</div></div></div>
{/if}

<div class="kpi-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
  <div class="kpi"><span class="kpi-label">Total</span><span class="kpi-value">{data.orders.length}</span></div>
  <div class="kpi"><span class="kpi-label">Action Required</span><span class="kpi-value" style="color:var(--amber)">{data.orders.filter(o=>o.status==='vendor_assigned').length}</span></div>
  <div class="kpi"><span class="kpi-label">In Progress</span><span class="kpi-value" style="color:var(--blue)">{data.orders.filter(o=>['vendor_confirmed','sample_ready','in_production','in_transit'].includes(o.status)).length}</span></div>
  <div class="kpi"><span class="kpi-label">Completed</span><span class="kpi-value" style="color:var(--emerald)">{data.orders.filter(o=>['delivered','completed'].includes(o.status)).length}</span></div>
</div>

<div class="seg" style="margin-bottom:14px">
  <button aria-pressed={filter==='all'} onclick={()=>filter='all'}>All ({data.orders.length})</button>
  <button aria-pressed={filter==='action'} onclick={()=>filter='action'}>⚡ Action ({data.orders.filter(o=>o.status==='vendor_assigned').length})</button>
  <button aria-pressed={filter==='active'} onclick={()=>filter='active'}>In Progress</button>
  <button aria-pressed={filter==='done'} onclick={()=>filter='done'}>Done</button>
</div>

{#if filtered.length === 0}
<div class="empty" style="padding:40px"><Icon name="inbox" size={28}/><div style="font-size:14px;font-weight:500;margin-top:8px">{filter==='all' ? 'No orders yet' : 'No orders in this category'}</div><div class="xs muted">Orders assigned to you will appear here.</div></div>
{:else}
<div class="card" style="padding:0;overflow:hidden"><table class="tbl"><thead><tr><th style="width:40px">Sl.</th><th>Order</th><th style="width:100px">Status</th><th style="width:100px">Budget</th><th style="width:90px">Need By</th><th style="width:60px"></th></tr></thead><tbody>
{#each filtered as o, idx}
  <tr onclick={() => goto(`/vendor-portal/order/${o.id}`)}>
    <td class="mono muted">{idx+1}</td>
    <td><div style="font-weight:500">{o.title?.slice(0,50)}</div><div class="xs muted">{o.delivery_notes||'—'} &middot; {o.requested_by_name||'—'}</div></td>
    <td><span class="badge dot" data-tone={SC[o.status]||'slate'}>{sl(o.status)}</span></td>
    <td class="mono tnum">₹{(o.allocated_budget||0).toLocaleString('en-IN')}</td>
    <td class="mono xs">{o.required_by_date||'—'}</td>
    <td><Icon name="chev" size={14}/></td>
  </tr>
{/each}
</tbody></table></div>
{/if}
