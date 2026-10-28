<script>
  import { goto } from '$app/navigation';
  import { invalidateAll } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  let uploading = $state(false);
  let uploadMsg = $state('');
  let selectedOrderId = $state('');

  function sl(s) { return (s||'').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase()); }

  // Get bills for each order
  function getBills(orderId) {
    return data.items
      .filter(i => i.requirement_id === orderId)
      .flatMap(i => i.design_file_urls || []);
  }

  async function uploadBill(event) {
    const file = event.target.files?.[0];
    if (!file || !selectedOrderId) return;
    uploading = true;
    uploadMsg = '';
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const res = await fetch('/api/vendor-portal/upload-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requirement_id: selectedOrderId, file_name: file.name, file_type: file.type, file_data: reader.result })
        });
        const result = await res.json();
        uploadMsg = result.success ? `${file.name} uploaded!` : (result.error || 'Failed');
        uploading = false;
        if (result.success) await invalidateAll();
      };
      reader.readAsDataURL(file);
    } catch { uploadMsg = 'Upload failed'; uploading = false; }
  }
</script>

<h1 class="page-title">Invoices & Bills</h1>
<div class="page-sub" style="margin-bottom:16px">Upload and manage your invoices, bills, and receipts.</div>

<!-- Upload Section -->
<div class="card" style="margin-bottom:20px;border-color:var(--violet)">
  <div class="card-head" style="background:var(--violet-soft)"><h3 class="card-title" style="color:var(--violet)"><Icon name="upload" size={14}/>Upload New Invoice</h3></div>
  <div class="card-body v gap-12" style="padding:16px">
    {#if data.orders.length === 0}
      <div class="xs muted">No orders assigned yet. Upload will be available once you have orders.</div>
    {:else}
      <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end">
        <div class="v gap-4">
          <span class="xs muted mono">SELECT ORDER</span>
          <select class="input w-full" bind:value={selectedOrderId}>
            <option value="">— Choose an order —</option>
            {#each data.orders as o}<option value={o.id}>{o.title?.slice(0,50)} — ₹{(o.allocated_budget||0).toLocaleString('en-IN')}</option>{/each}
          </select>
        </div>
        <label class="btn accent" style="cursor:pointer;height:28px">
          <Icon name="upload" size={12}/>{uploading ? 'Uploading...' : 'Choose File'}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onchange={uploadBill} style="display:none" disabled={uploading || !selectedOrderId}/>
        </label>
      </div>
      {#if uploadMsg}<div class="xs" style="color:{uploadMsg.includes('uploaded')?'var(--emerald)':'var(--rose)'}">{uploadMsg}</div>{/if}
      <div class="xs muted">Supported: PDF, JPG, PNG. Max 10MB.</div>
    {/if}
  </div>
</div>

<!-- Bills per Order -->
{#if data.orders.length === 0}
<div class="empty" style="padding:40px"><Icon name="upload" size={28}/><div style="font-size:14px;font-weight:500;margin-top:8px">No invoices yet</div><div class="xs muted">Upload bills and invoices for your orders here.</div></div>
{:else}
<div class="v gap-10">
  {#each data.orders as o}
    {@const bills = getBills(o.id)}
    <div class="card">
      <div class="card-head">
        <h3 class="card-title" style="font-size:13px">{o.title?.slice(0,45)}</h3>
        <span class="badge dot" data-tone={o.status==='completed'?'emerald':o.status==='delivered'?'emerald':'blue'}>{sl(o.status)}</span>
        <div class="grow"></div>
        <span class="mono small">₹{(o.allocated_budget||0).toLocaleString('en-IN')}</span>
      </div>
      <div class="card-body" style="padding:12px 16px">
        {#if bills.length > 0}
          <div class="xs muted mono" style="margin-bottom:8px">{bills.length} FILE{bills.length>1?'S':''} UPLOADED</div>
          <div class="h gap-8" style="flex-wrap:wrap">
            {#each bills as url, i}
              <a href={url.startsWith('bill:')?'#':url} target="_blank" class="btn sm"><Icon name="file" size={12}/>{url.startsWith('bill:') ? url.split(':')[1]?.slice(0,20) : `Invoice ${i+1}`}</a>
            {/each}
          </div>
        {:else}
          <div class="h between">
            <div class="xs muted">No invoices uploaded for this order</div>
            <label class="btn sm" style="cursor:pointer">
              <Icon name="upload" size={11}/>Upload
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onchange={(e) => { selectedOrderId = o.id; uploadBill(e); }} style="display:none"/>
            </label>
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>
{/if}
