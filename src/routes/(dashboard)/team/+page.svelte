<script>
  let { data } = $props();
  let q = $state('');
  let filtered = $derived(data.universities.filter(u => !q || u.name.toLowerCase().includes(q.toLowerCase()) || (u.short_name||'').toLowerCase().includes(q.toLowerCase())));
</script>
<div class="page-kicker">Module 08 &middot; Campuses &amp; universities &middot; {data.universities.length} connected</div>
<div class="page-head"><div><h1 class="page-title">Campuses</h1><div class="page-sub">Universities connected to FundFlow &middot; {data.universities.length} total</div></div></div>
<div class="team-kpi-row"><div class="team-kpi"><div class="team-kpi-label">Total campuses</div><div class="team-kpi-value">{data.universities.length}</div></div></div>
<div class="filter-bar"><input class="input input-search" placeholder="Search by name or code..." bind:value={q} style="width:320px"/><div class="grow"></div><span class="xs mono muted">{filtered.length} CAMPUSES</span></div>
<div class="card"><table class="team-table"><thead><tr><th>Campus</th><th>Code</th><th style="width:120px">Requests</th><th style="width:180px">Joined</th></tr></thead><tbody>
{#each filtered as u}<tr><td><div class="h gap-10"><div class="avatar">{(u.short_name||u.name).slice(0,2).toUpperCase()}</div><span style="font-weight:600;font-size:13px">{u.name}</span></div></td><td class="mono" style="font-size:12px">{u.short_name||'—'}</td><td class="mono">{u.requestCount}</td><td class="xs muted">{new Date(u.created_at).toLocaleDateString()}</td></tr>{/each}
{#if filtered.length===0}<tr><td colspan="4"><div class="empty"><div class="empty-mark"></div>No campuses found</div></td></tr>{/if}
</tbody></table><div class="team-table-foot"><span class="xs muted mono">SHOWING {filtered.length} OF {data.universities.length}</span></div></div>
