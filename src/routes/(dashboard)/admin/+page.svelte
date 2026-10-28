<script>
  import { onMount } from 'svelte';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  let topCats = $derived.by(() => {
    const cc = {};
    data.vendors.forEach(v => { cc[v.category || 'Other'] = (cc[v.category || 'Other'] || 0) + 1; });
    return Object.entries(cc).sort((a, b) => b[1] - a[1]).slice(0, 10);
  });
  let maxCat = $derived(topCats.length > 0 ? topCats[0][1] : 1);

  // Team management
  let members = $state([]);
  let loadingTeam = $state(true);
  let showAddForm = $state(false);
  let addForm = $state({ name: '', email: '', role: 'member' });
  let addSaving = $state(false);
  let addMsg = $state('');

  onMount(async () => {
    await loadTeam();
  });

  async function loadTeam() {
    loadingTeam = true;
    const res = await fetch('/api/team');
    const result = await res.json();
    members = result.members || [];
    loadingTeam = false;
  }

  async function addMember() {
    if (!addForm.name.trim() || !addForm.email.trim()) return;
    addSaving = true;
    addMsg = '';
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        addMsg = `${addForm.name} added as ${addForm.role}`;
        addForm = { name: '', email: '', role: 'member' };
        showAddForm = false;
        await loadTeam();
      } else {
        addMsg = result.error || 'Failed to add';
      }
    } catch { addMsg = 'Network error'; }
    addSaving = false;
    setTimeout(() => addMsg = '', 4000);
  }

  async function removeMember(id, name) {
    if (!confirm(`Remove ${name} from the team? They won't be able to login.`)) return;
    try {
      const res = await fetch('/api/team', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) await loadTeam();
    } catch (e) { console.error(e); }
  }
</script>

<div class="page-kicker">Module 03 &middot; Admin Dashboard</div>
<div class="page-head"><div><h1 class="page-title">Admin Dashboard</h1><div class="page-sub">Cross-campus procurement health &middot; Team management</div></div></div>

<div class="kpi-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:14px">
  <div class="kpi"><span class="kpi-label">Total Requests</span><span class="kpi-value">{data.totalRequests}</span></div>
  <div class="kpi"><span class="kpi-label">Active</span><span class="kpi-value">{data.activeRequests}</span></div>
  <div class="kpi"><span class="kpi-label">Overdue</span><span class="kpi-value" style="color:var(--rose)">{data.overdueRequests}</span></div>
  <div class="kpi"><span class="kpi-label">Vendors</span><span class="kpi-value">{data.totalVendors}</span></div>
  <div class="kpi"><span class="kpi-label">Team</span><span class="kpi-value">{members.length}</span></div>
</div>

<!-- Team Management -->
<div class="card" style="margin-bottom:14px">
  <div class="card-head">
    <h3 class="card-title"><Icon name="user" size={14}/>Facilities Team Members</h3>
    <span class="xs muted mono">{members.length} MEMBERS</span>
    <div class="grow"></div>
    {#if addMsg}<span class="badge" data-tone="emerald">{addMsg}</span>{/if}
    <button class="btn accent sm" onclick={() => showAddForm = !showAddForm}><Icon name="plus" size={12}/>{showAddForm ? 'Cancel' : 'Add Member'}</button>
  </div>

  {#if showAddForm}
  <div style="padding:14px 16px;border-bottom:1px solid var(--hairline);background:var(--accent-soft)">
    <div style="display:grid;grid-template-columns:1fr 1fr 120px auto;gap:10px;align-items:end">
      <div class="v gap-4"><span class="xs muted mono">NAME *</span><input class="input w-full" bind:value={addForm.name} placeholder="Full name"/></div>
      <div class="v gap-4"><span class="xs muted mono">EMAIL *</span><input class="input w-full" bind:value={addForm.email} placeholder="name@company.com"/></div>
      <div class="v gap-4"><span class="xs muted mono">ROLE</span><select class="input w-full" bind:value={addForm.role}><option value="member">Member</option><option value="admin">Admin</option></select></div>
      <button class="btn accent" onclick={addMember} disabled={addSaving || !addForm.name.trim() || !addForm.email.trim()}><Icon name="check" size={12}/>{addSaving ? 'Adding...' : 'Add'}</button>
    </div>
  </div>
  {/if}

  <div style="padding:0">
    {#if loadingTeam}
      <div class="empty" style="padding:30px"><div class="xs muted mono">LOADING TEAM...</div></div>
    {:else}
      <table class="tbl">
        <thead><tr><th>Name</th><th>Email</th><th style="width:100px">Role</th><th style="width:120px">Added</th><th style="width:60px"></th></tr></thead>
        <tbody>
        {#each members as m}
          <tr>
            <td><div class="h gap-10"><div class="avatar" style="background:{m.role==='admin'?'var(--accent)':'var(--blue)'}">{m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div><span style="font-weight:500">{m.name}</span></div></td>
            <td class="xs mono muted">{m.email}</td>
            <td><span class="badge" data-tone={m.role==='admin'?'accent':'blue'}>{m.role}</span></td>
            <td class="xs muted">{new Date(m.created_at).toLocaleDateString()}</td>
            <td><button class="icon-btn" onclick={() => removeMember(m.id, m.name)} title="Remove"><Icon name="trash" size={13}/></button></td>
          </tr>
        {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
  <div class="card"><div class="card-head"><h3 class="card-title">Vendors by category</h3><span class="xs muted mono">{data.totalVendors} TOTAL</span></div><div class="card-body" style="padding:4px 16px 14px">{#each topCats as [cat,count]}<div class="bar-row"><span class="bar-name">{cat}</span><div class="bar-track"><div class="bar-fill" style="width:{(count/maxCat)*100}%"></div></div><span class="bar-val">{count}</span></div>{/each}</div></div>
  <div class="card"><div class="card-head"><h3 class="card-title">Recent Requests</h3><span class="xs muted mono">{data.totalRequests} TOTAL</span></div><div class="card-body v gap-8" style="padding:10px 14px">{#each data.requirements.slice(0,8) as r}<div class="h between" style="padding:6px 0;border-bottom:1px solid var(--hairline);font-size:12px"><div class="v"><span style="font-weight:500">{(r.title||'Untitled').slice(0,40)}</span><span class="xs muted mono">{r.university?.short_name || r.delivery_notes || '—'} &middot; {r.status.replace(/_/g,' ')}</span></div><span class="mono xs muted">₹{((r.allocated_budget||0)/1000).toFixed(0)}k</span></div>{/each}</div></div>
</div>
