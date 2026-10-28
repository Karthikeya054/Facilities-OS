<script>
  import { goto, invalidateAll } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  const SC = { pending_l1:"amber", pending_l2:"blue", received:"slate", rejected:"rose", vendor_search:"amber", vendor_assigned:"blue", vendor_confirmed:"blue", in_production:"violet", delivered:"emerald", completed:"emerald" };
  function sl(s) { return (s||'').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()); }

  // Edit modal
  let editReq = $state(null);
  let editSaving = $state(false);

  function openEdit(r) {
    editReq = { ...r };
  }

  async function saveEdit() {
    if (!editReq) return;
    editSaving = true;
    try {
      const res = await fetch(`/api/requirements/${editReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editReq.title,
          description: editReq.description,
          allocated_budget: editReq.allocated_budget,
          priority: editReq.priority,
          required_by_date: editReq.required_by_date,
          delivery_location: editReq.delivery_location,
        })
      });
      if (res.ok) { editReq = null; await invalidateAll(); }
    } catch (e) { console.error(e); }
    editSaving = false;
  }

  async function deleteReq(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/requirements/${id}`, { method: 'DELETE' });
      if (res.ok) await invalidateAll();
    } catch (e) { console.error(e); }
  }

  async function resendL1(id) {
    await fetch('/api/approve/send-l1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requirement_id: id })
    });
    alert('L1 approval reminder sent to the approver!');
  }
</script>

<div class="page-kicker">Internal Requirements</div>
<div class="page-head">
  <div><h1 class="page-title">My Requests</h1><div class="page-sub">Requests raised internally by the facilities team &middot; Track approvals</div></div>
  <button class="btn accent" onclick={() => goto('/request/new')}><Icon name="plus" size={14}/>Raise New Request</button>
</div>

<div class="kpi-row" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
  <div class="kpi"><span class="kpi-label">Total Raised</span><span class="kpi-value">{data.allInternal.length}</span></div>
  <div class="kpi"><span class="kpi-label">Pending L1</span><span class="kpi-value" style="color:var(--amber)">{data.allInternal.filter(r => r.status === 'pending_l1').length}</span></div>
  <div class="kpi"><span class="kpi-label">Pending L2</span><span class="kpi-value" style="color:var(--blue)">{data.allInternal.filter(r => r.status === 'pending_l2').length}</span></div>
  <div class="kpi"><span class="kpi-label">Approved</span><span class="kpi-value" style="color:var(--emerald)">{data.allInternal.filter(r => !['pending_l1','pending_l2','rejected'].includes(r.status)).length}</span></div>
</div>

{#if data.allInternal.length === 0}
  <div class="empty" style="padding:60px"><Icon name="inbox" size={28}/><div style="font-size:15px;font-weight:500;margin-top:8px">No internal requests yet</div><div class="xs muted">Click "Raise New Request" to create one. It will go through L1 → L2 approval.</div></div>
{:else}
  <div class="card" style="padding:0;overflow:hidden"><table class="tbl"><thead><tr><th style="width:40px">Sl.</th><th>Title</th><th style="width:110px">Status</th><th style="width:90px">Budget</th><th style="width:90px">Need By</th><th style="width:110px">Raised By</th><th style="width:130px">Actions</th></tr></thead><tbody>
  {#each data.allInternal as r, idx}
    <tr>
      <td class="mono muted">{idx+1}</td>
      <td><div style="font-weight:500;cursor:pointer" onclick={() => goto(`/request/${r.id}`)}>{r.title?.slice(0,45)}{(r.title||'').length>45?'...':''}</div></td>
      <td><span class="badge dot" data-tone={SC[r.status]||'slate'}>{sl(r.status)}</span></td>
      <td class="mono tnum">₹{(r.allocated_budget||0).toLocaleString('en-IN')}</td>
      <td class="mono xs">{r.required_by_date||'—'}</td>
      <td class="xs">{r.requested_by_name||'—'}</td>
      <td>
        <div class="h gap-4">
          <button class="icon-btn" onclick={() => goto(`/request/${r.id}`)} title="View"><Icon name="eye" size={13}/></button>
          {#if ['pending_l1','pending_l2','rejected'].includes(r.status)}
            <button class="icon-btn" onclick={() => openEdit(r)} title="Edit"><Icon name="edit" size={13}/></button>
            <button class="icon-btn" onclick={() => deleteReq(r.id, r.title)} title="Delete"><Icon name="trash" size={13}/></button>
          {/if}
          {#if r.status === 'pending_l1'}
            <button class="btn sm" onclick={() => resendL1(r.id)} title="Resend L1 email"><Icon name="send" size={11}/>Nudge</button>
          {/if}
        </div>
      </td>
    </tr>
  {/each}
  </tbody></table></div>
{/if}

<!-- Edit Modal -->
{#if editReq}
<div class="modal-backdrop" onclick={() => editReq = null}>
  <div class="modal" onclick={e => e.stopPropagation()} style="max-width:560px">
    <div class="modal-head"><div><h2 style="margin:0;font-size:16px;font-weight:600">Edit Request</h2></div><button class="icon-btn" onclick={() => editReq = null}><Icon name="x" size={16}/></button></div>
    <div class="modal-body" style="gap:12px">
      <div class="v gap-4"><span class="xs muted mono">TITLE</span><input class="input w-full" bind:value={editReq.title}/></div>
      <div class="v gap-4"><span class="xs muted mono">DESCRIPTION</span><textarea class="input w-full" bind:value={editReq.description} rows="3" style="height:auto;padding:8px;resize:vertical"></textarea></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="v gap-4"><span class="xs muted mono">BUDGET ₹</span><input class="input w-full mono" type="number" bind:value={editReq.allocated_budget}/></div>
        <div class="v gap-4"><span class="xs muted mono">PRIORITY</span><select class="input w-full" bind:value={editReq.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="v gap-4"><span class="xs muted mono">NEED BY</span><input class="input w-full mono" type="date" bind:value={editReq.required_by_date}/></div>
        <div class="v gap-4"><span class="xs muted mono">LOCATION</span><input class="input w-full" bind:value={editReq.delivery_location}/></div>
      </div>
    </div>
    <div class="modal-foot"><button class="btn" onclick={() => editReq = null}>Cancel</button><button class="btn accent" onclick={saveEdit} disabled={editSaving}><Icon name="check" size={12}/>{editSaving ? 'Saving...' : 'Save Changes'}</button></div>
  </div>
</div>
{/if}
