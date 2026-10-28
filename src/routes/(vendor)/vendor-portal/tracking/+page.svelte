<script>
  import { goto } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  const STAGES = ["vendor_assigned","vendor_confirmed","sample_ready","in_production","in_transit","delivered","completed"];
  const SC = { vendor_assigned:"blue", vendor_confirmed:"blue", sample_ready:"violet", in_production:"violet", in_transit:"accent", delivered:"emerald", completed:"emerald" };
  function sl(s) { return (s||'').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()); }
</script>

<h1 class="page-title">Track Delivery</h1>
<div class="page-sub" style="margin-bottom:16px">Track the status of all your active orders.</div>

{#if data.orders.length === 0}
<div class="empty" style="padding:60px"><Icon name="truck" size={32}/><div style="font-size:15px;font-weight:500;margin-top:8px">No active deliveries</div><div class="xs muted">Once you confirm an order, you can track its progress here.</div></div>
{:else}
<div class="v gap-14">
  {#each data.orders as o}
    {@const ci = STAGES.indexOf(o.status)}
    <div class="card">
      <div class="card-head">
        <h3 class="card-title" style="font-size:14px">{o.title?.slice(0,50)}</h3>
        <span class="badge dot" data-tone={SC[o.status]||'slate'}>{sl(o.status)}</span>
        <div class="grow"></div>
        <span class="mono small">₹{(o.allocated_budget||0).toLocaleString('en-IN')}</span>
      </div>
      <div class="card-body" style="padding:16px">
        <!-- Progress bar -->
        <div style="display:flex;gap:4px;margin-bottom:14px">
          {#each STAGES as st, i}
            <div style="flex:1;height:6px;border-radius:3px;background:{i <= ci ? (i === ci ? 'var(--accent)' : 'var(--emerald)') : 'var(--hairline)'}"></div>
          {/each}
        </div>
        <!-- Stage labels -->
        <div style="display:flex;justify-content:space-between;margin-bottom:14px">
          {#each STAGES as st, i}
            <div style="text-align:center;flex:1">
              <div style="width:12px;height:12px;border-radius:50%;margin:0 auto 4px;background:{i < ci ? 'var(--emerald)' : i === ci ? 'var(--accent)' : 'var(--hairline)'}"></div>
              <div class="xs" style="color:{i <= ci ? 'var(--ink)' : 'var(--muted-3)'}; font-size:9px">{sl(st)}</div>
            </div>
          {/each}
        </div>
        <div class="h between">
          <div class="xs muted">{o.delivery_notes || '—'} &middot; {o.requested_by_name || '—'}</div>
          <button class="btn sm" onclick={() => goto(`/vendor-portal/order/${o.id}`)}><Icon name="arrow" size={11}/>Update Status</button>
        </div>
      </div>
    </div>
  {/each}
</div>
{/if}
