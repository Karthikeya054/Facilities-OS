<script>
  import { goto, invalidateAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import Icon from '$lib/Icon.svelte';

  let { data } = $props();
  const SC = { received:"slate", vendor_search:"amber", vendor_assigned:"blue", vendor_confirmed:"blue", sample_ready:"violet", in_production:"violet", in_transit:"accent", delivered:"emerald", completed:"emerald" };
  let view = $state('table');
  let q = $state('');

  // Auto-refresh: listen for realtime changes on facility_requirements
  onMount(() => {
    const channel = data.supabase
      .channel('facility_requirements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facility_requirements' }, () => {
        invalidateAll();
      })
      .subscribe();

    return () => { data.supabase.removeChannel(channel); };
  });

  function du(ds) { if (!ds) return null; return Math.round((new Date(ds).getTime() - Date.now()) / 86400000); }
  function sl(s) { return (s || '').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

  let rows = $derived((data.requirements || []).filter(r => !q || (r.title||'').toLowerCase().includes(q.toLowerCase()) || (r.requested_by_name||'').toLowerCase().includes(q.toLowerCase())));
  let stats = $derived({
    total: rows.length,
    pending: rows.filter(r => ['received','vendor_search'].includes(r.status)).length,
    active: rows.filter(r => ['vendor_assigned','vendor_confirmed','sample_ready','in_production','in_transit'].includes(r.status)).length,
    done: rows.filter(r => ['delivered','completed'].includes(r.status)).length,
    budget: rows.reduce((a, r) => a + (r.allocated_budget || 0), 0),
  });

  const kanbanCols = [
    { key: "received", label: "Received", match: ["received"], tone: "slate" },
    { key: "sourcing", label: "Sourcing", match: ["vendor_search","vendor_assigned"], tone: "amber" },
    { key: "production", label: "Production", match: ["vendor_confirmed","sample_ready","in_production"], tone: "violet" },
    { key: "transit", label: "In Transit", match: ["in_transit"], tone: "accent" },
    { key: "done", label: "Done", match: ["delivered","completed"], tone: "emerald" },
  ];
</script>

<div class="page-kicker">Module 01 &middot; Request Lifecycle</div>
<div class="page-head">
  <div><h1 class="page-title">Control Center</h1><div class="page-sub">Live pipeline &middot; {data.requirements.length} requests &middot; Auto-refreshing</div></div>
  <div class="h gap-8"><div class="seg"><button aria-pressed={view==='table'} onclick={()=>view='table'}><Icon name="table" size={12}/>Table</button><button aria-pressed={view==='kanban'} onclick={()=>view='kanban'}><Icon name="kanban" size={12}/>Pipeline</button></div></div>
</div>
<div class="kpi-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:14px">
  <div class="kpi"><span class="kpi-label">Total</span><span class="kpi-value">{stats.total}</span></div>
  <div class="kpi"><span class="kpi-label">Pending</span><span class="kpi-value" style="color:var(--amber)">{stats.pending}</span></div>
  <div class="kpi"><span class="kpi-label">Active</span><span class="kpi-value" style="color:var(--blue)">{stats.active}</span></div>
  <div class="kpi"><span class="kpi-label">Completed</span><span class="kpi-value" style="color:var(--emerald)">{stats.done}</span></div>
  <div class="kpi"><span class="kpi-label">Budget</span><span class="kpi-value">₹{(stats.budget/100000).toFixed(1)}<span class="kpi-unit">L</span></span></div>
</div>
<div class="filter-bar"><input class="input input-search" placeholder="Search by title, requester..." bind:value={q} style="width:320px"/><div class="grow"></div><span class="xs mono muted">{rows.length} REQUESTS</span></div>

{#if rows.length === 0}
  <div class="empty" style="padding:60px 20px"><div class="empty-mark"></div><div style="font-size:15px;font-weight:600;margin-bottom:4px">No requests yet</div><div class="small muted">Requests from UniConnect will appear here automatically.</div></div>
{:else if view==='table'}
  <div class="card" style="padding:0;overflow:hidden"><table class="tbl"><thead><tr><th style="width:50px">Sl.</th><th>Title</th><th style="width:80px">Campus</th><th style="width:120px">Status</th><th style="width:100px">Budget</th><th style="width:90px">Need By</th><th style="width:120px">Requester</th><th style="width:70px">Priority</th></tr></thead><tbody>
  {#each rows as r, idx}
    {@const d=du(r.required_by_date)}{@const ov=d!==null&&d<0&&!['delivered','completed'].includes(r.status)}
    <tr onclick={()=>goto(`/request/${r.id}`)}>
      <td class="mono muted">{idx + 1}</td>
      <td><div style="font-weight:500">{(r.title||'Untitled').slice(0,55)}{(r.title||'').length>55?'...':''}</div></td>
      <td class="mono xs">{r.university?.short_name || r.delivery_notes || '—'}</td>
      <td><span class="badge dot" data-tone={SC[r.status]||'slate'}>{sl(r.status)}</span></td>
      <td><span class="mono tnum">{r.allocated_budget?`₹${r.allocated_budget.toLocaleString('en-IN')}`:'—'}</span></td>
      <td class="mono" style="color:{ov?'var(--rose)':'var(--ink-2)'}; font-size:11px">{d!==null?(ov?`${Math.abs(d)}d over`:`${d}d`):'—'}</td>
      <td class="xs">{r.requested_by_name||'—'}</td>
      <td><span class="badge" data-tone={r.priority==='high'?'rose':r.priority==='medium'?'amber':'slate'}>{r.priority||'—'}</span></td>
    </tr>
  {/each}
  </tbody></table></div>
{:else}
  <div class="kanban">
  {#each kanbanCols as col}
    {@const items=rows.filter(r=>col.match.includes(r.status))}
    <div class="kanban-col"><div class="kanban-head"><span class="dot" style="background:var(--{col.tone})"></span>{col.label}<span class="count">{items.length}</span></div><div class="kanban-body">
    {#each items as r}<div class="kcard" role="button" tabindex="0" onclick={()=>goto(`/request/${r.id}`)} onkeydown={e=>e.key==='Enter'&&goto(`/request/${r.id}`)}><div class="kcard-head"><span class="kcard-id">{r.university?.short_name || r.delivery_notes || '—'}</span><span class="badge dot" data-tone={SC[r.status]||'slate'}>{sl(r.status)}</span></div><div class="kcard-title">{(r.title||'Untitled').slice(0,50)}</div><div class="kcard-meta"><span class="mono tnum">{r.allocated_budget?`₹${r.allocated_budget.toLocaleString('en-IN')}`:'—'}</span><span class="xs muted">{r.requested_by_name}</span></div></div>{/each}
    {#if items.length===0}<div class="empty"><div class="empty-mark"></div>No requests</div>{/if}
    </div></div>
  {/each}
  </div>
{/if}
