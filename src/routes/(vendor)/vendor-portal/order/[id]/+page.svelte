<script>
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  const SC = { received:"slate", vendor_search:"amber", vendor_assigned:"blue", vendor_confirmed:"blue", sample_ready:"violet", in_production:"violet", in_transit:"accent", delivered:"emerald", completed:"emerald" };
  const STAGES = ["vendor_assigned","vendor_confirmed","sample_ready","in_production","in_transit","delivered"];

  let confirming = $state(false);
  let updating = $state(false);
  let updateMsg = $state('');

  // Vendor inputs
  let quotedPrice = $state('');
  let deliveryDate = $state('');
  let vendorNotes = $state('');

  // Bill upload
  let uploading = $state(false);
  let uploadMsg = $state('');
  let billUrl = $state('');

  import { onMount } from 'svelte';
  onMount(() => {
    if (data.order) {
      quotedPrice = data.order.vendor_quoted_price ? String(data.order.vendor_quoted_price) : '';
      deliveryDate = data.order.estimated_delivery_date || '';
    }
  });

  async function confirmOrder() {
    confirming = true;
    try {
      const res = await fetch(`/api/requirements/${$page.params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'vendor_confirmed',
          vendor_quoted_price: quotedPrice ? Number(quotedPrice) : undefined,
          estimated_delivery_date: deliveryDate || undefined,
          message: 'Vendor confirmed order'
        })
      });
      if (res.ok) { updateMsg = 'Order confirmed! Facilities team notified.'; await invalidateAll(); }
    } catch (e) { console.error(e); }
    confirming = false;
    setTimeout(() => updateMsg = '', 4000);
  }

  async function updateStatus(newStatus) {
    updating = true;
    try {
      const res = await fetch(`/api/requirements/${$page.params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          vendor_quoted_price: quotedPrice ? Number(quotedPrice) : undefined,
          estimated_delivery_date: deliveryDate || undefined,
          delivery_notes: vendorNotes || undefined,
          message: `Vendor updated status to ${newStatus.replace(/_/g,' ')}`
        })
      });
      if (res.ok) { updateMsg = `Status updated to "${newStatus.replace(/_/g,' ')}"!`; await invalidateAll(); }
    } catch (e) { console.error(e); }
    updating = false;
    setTimeout(() => updateMsg = '', 4000);
  }

  async function uploadBill(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploading = true;
    uploadMsg = '';

    try {
      const res = await fetch('/api/vendor-portal/upload-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: $page.params.id,
          file_name: file.name,
          file_type: file.type,
          file_data: await fileToBase64(file),
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        uploadMsg = 'Bill/invoice uploaded successfully!';
        billUrl = result.url || '';
        await invalidateAll();
      } else {
        uploadMsg = result.error || 'Upload failed';
      }
    } catch { uploadMsg = 'Upload failed'; }
    uploading = false;
  }

  function fileToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }
</script>

{#if !data.order}
  <div class="empty" style="padding:60px"><div class="empty-mark"></div><div>Order not found</div><button class="btn" onclick={() => goto('/vendor-portal')}>Back</button></div>
{:else}
  {@const o = data.order}
  {@const items = data.items}
  {@const ci = STAGES.indexOf(o.status)}
  {@const itot = items.reduce((a, i) => a + (i.total_price || i.quantity * (i.unit_price || 0)), 0)}

  <div class="h gap-8" style="margin-bottom:16px"><button class="btn sm" onclick={() => goto('/vendor-portal')}><Icon name="chev" size={12}/>Back to Orders</button></div>

  {#if updateMsg}
  <div class="card" style="margin-bottom:12px;background:var(--emerald-soft);border-color:var(--emerald)">
    <div class="card-body h gap-10"><Icon name="check" size={16}/><span style="font-weight:600;color:var(--emerald)">{updateMsg}</span></div>
  </div>
  {/if}

  <div class="page-head" style="margin-bottom:20px"><div>
    <div class="h gap-10" style="margin-bottom:6px">
      <span class="badge dot" data-tone={SC[o.status]||'slate'}>{o.status.replace(/_/g,' ')}</span>
      {#if o.priority}<span class="badge" data-tone={o.priority==='high'?'rose':'slate'}>{o.priority}</span>{/if}
      {#if o.status==='vendor_assigned'}<span class="badge" data-tone="amber">Please Confirm</span>{/if}
    </div>
    <h1 class="page-title" style="font-size:22px">{o.title}</h1>
    <div class="page-sub">Campus: {o.delivery_notes || '—'} &middot; Venue: {o.delivery_location || '—'}{o.required_by_date ? ` · Need by: ${o.required_by_date}` : ''}</div>
  </div></div>

  <!-- Status Progress -->
  <div class="card" style="margin-bottom:16px;padding:14px 20px">
    <div class="xs muted mono" style="margin-bottom:10px">ORDER PROGRESS</div>
    <div class="h gap-6" style="flex-wrap:wrap">
      {#each STAGES as st, i}
        <div class="h gap-6">
          <span class="badge dot" data-tone={i <= ci ? 'emerald' : 'slate'} style={i === ci ? 'font-weight:700' : ''}>{st.replace(/_/g,' ')}</span>
          {#if i < STAGES.length - 1}<Icon name="chev" size={12}/>{/if}
        </div>
      {/each}
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:20px">
    <div class="v gap-16">
      <!-- Items Required -->
      <div class="card">
        <div class="card-head"><h3 class="card-title">Items Required</h3><span class="xs muted mono">{items.length} ITEMS</span><div class="grow"></div><span class="mono small">Total: ₹{itot.toLocaleString('en-IN')}</span></div>
        <div class="card-body v gap-10">
          {#each items as it, idx}
            <div class="h between" style="padding-bottom:8px;border-bottom:{idx<items.length-1?'1px solid var(--hairline)':'0'}">
              <div class="h gap-10"><span class="badge" data-tone="slate">{String(idx+1).padStart(2,'0')}</span><div><span style="font-weight:600">{it.description || it.item_type}</span><div class="xs muted">{it.item_type} &middot; Qty: {it.quantity}</div></div></div>
              <div class="v" style="text-align:right"><div class="mono" style="font-weight:600">₹{(it.total_price || it.quantity * (it.unit_price || 0)).toLocaleString('en-IN')}</div><div class="xs muted mono">₹{it.unit_price || 0} × {it.quantity}</div></div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Description -->
      {#if o.description}
      <div class="card"><div class="card-head"><h3 class="card-title">Description</h3></div><div class="card-body"><p style="margin:0;color:var(--ink-2);line-height:1.6;font-size:12.5px;white-space:pre-wrap">{o.description}</p></div></div>
      {/if}

      <!-- Confirm Order (only when vendor_assigned) -->
      {#if o.status === 'vendor_assigned'}
      <div class="card" style="border-color:var(--accent)">
        <div class="card-head" style="background:var(--accent-soft)"><h3 class="card-title" style="color:var(--accent-ink)"><Icon name="check" size={14}/>Confirm This Order</h3></div>
        <div class="card-body v gap-12" style="padding:16px">
          <div class="xs muted">Review the items above and confirm. Provide your quoted price and estimated delivery date.</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="v gap-4"><span class="xs muted mono">YOUR QUOTED PRICE ₹ *</span><input class="input mono w-full" type="number" bind:value={quotedPrice} placeholder="Total quote"/></div>
            <div class="v gap-4"><span class="xs muted mono">DELIVERY DATE *</span><input class="input mono w-full" type="date" bind:value={deliveryDate}/></div>
          </div>
          <button class="btn accent" onclick={confirmOrder} disabled={confirming || !quotedPrice}><Icon name="check" size={12}/>{confirming ? 'Confirming...' : 'Confirm Order & Submit Quote'}</button>
        </div>
      </div>
      {/if}

      <!-- Update Status (after confirmation) -->
      {#if ['vendor_confirmed','sample_ready','in_production','in_transit'].includes(o.status)}
      <div class="card" style="border-color:var(--blue)">
        <div class="card-head" style="background:var(--blue-soft)"><h3 class="card-title" style="color:var(--blue)"><Icon name="arrow" size={14}/>Update Status</h3></div>
        <div class="card-body v gap-10" style="padding:16px">
          <div class="v gap-4"><span class="xs muted mono">NOTES</span><textarea class="input w-full" bind:value={vendorNotes} rows="2" style="height:auto;padding:8px;resize:vertical" placeholder="Update notes..."></textarea></div>
          <div class="h gap-8" style="flex-wrap:wrap">
            {#if o.status === 'vendor_confirmed'}<button class="btn accent" onclick={() => updateStatus('sample_ready')} disabled={updating}>Sample Ready</button><button class="btn" onclick={() => updateStatus('in_production')} disabled={updating}>Start Production</button>{/if}
            {#if o.status === 'sample_ready'}<button class="btn accent" onclick={() => updateStatus('in_production')} disabled={updating}>Start Production</button>{/if}
            {#if o.status === 'in_production'}<button class="btn accent" onclick={() => updateStatus('in_transit')} disabled={updating}>Mark as Shipped</button>{/if}
            {#if o.status === 'in_transit'}<button class="btn accent" onclick={() => updateStatus('delivered')} disabled={updating}>Mark as Delivered</button>{/if}
          </div>
        </div>
      </div>
      {/if}
    </div>

    <div class="v gap-16">
      <!-- Order Summary -->
      <div class="card"><div class="card-head"><h3 class="card-title">Order Summary</h3></div><div class="card-body v gap-8">
        <div class="h between"><span class="xs muted mono">BUDGET</span><span class="mono" style="font-size:16px;font-weight:600">₹{(o.allocated_budget||0).toLocaleString('en-IN')}</span></div>
        {#if o.vendor_quoted_price}<div class="h between"><span class="xs muted mono">YOUR QUOTE</span><span class="mono">₹{o.vendor_quoted_price.toLocaleString('en-IN')}</span></div>{/if}
        {#if o.estimated_delivery_date}<div class="h between"><span class="xs muted mono">DELIVERY</span><span class="mono">{o.estimated_delivery_date}</span></div>{/if}
        <div class="h between"><span class="xs muted mono">REQUESTER</span><span class="xs">{o.requested_by_name || '—'}</span></div>
        <div class="h between"><span class="xs muted mono">CAMPUS</span><span class="xs">{o.delivery_notes || '—'}</span></div>
        <div class="h between"><span class="xs muted mono">CREATED</span><span class="xs mono">{new Date(o.created_at).toLocaleDateString()}</span></div>
      </div></div>

      <!-- Upload Bill/Invoice -->
      <div class="card" style="border-color:var(--violet)">
        <div class="card-head" style="background:var(--violet-soft)"><h3 class="card-title" style="color:var(--violet)"><Icon name="upload" size={14}/>Upload Bill / Invoice</h3></div>
        <div class="card-body v gap-8" style="padding:16px">
          <div class="xs muted">Upload your bill, invoice, or receipt. Supported: PDF, images (JPG, PNG).</div>
          <label class="btn" style="cursor:pointer;justify-content:center">
            <Icon name="upload" size={12}/>{uploading ? 'Uploading...' : 'Choose File'}
            <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif" onchange={uploadBill} style="display:none" disabled={uploading}/>
          </label>
          {#if uploadMsg}<div class="xs" style="color:{uploadMsg.includes('success')?'var(--emerald)':'var(--rose)'}">{uploadMsg}</div>{/if}
          {#if billUrl}<a href={billUrl} target="_blank" class="btn sm" style="margin-top:4px"><Icon name="file" size={12}/>View uploaded bill</a>{/if}

          <!-- Show existing uploads -->
          {#if data.items.some(it => (it.design_file_urls?.length || 0) > 0)}
            <div class="xs muted mono" style="margin-top:8px">UPLOADED BILLS</div>
            {#each data.items.flatMap(it => it.design_file_urls || []) as url, i}
              <a href={url} target="_blank" class="btn sm"><Icon name="file" size={12}/>Bill {i+1}</a>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Status: Completed -->
      {#if ['delivered','completed'].includes(o.status)}
      <div class="card" style="background:var(--emerald-soft);border-color:var(--emerald)">
        <div class="card-body v gap-6" style="padding:16px">
          <div class="h gap-8"><Icon name="check" size={18}/><span style="font-weight:600;color:var(--emerald);font-size:15px">Order {o.status === 'completed' ? 'Completed' : 'Delivered'}</span></div>
          <div class="xs" style="color:var(--emerald)">Thank you for fulfilling this order. The facilities team will review and settle payment.</div>
        </div>
      </div>
      {/if}
    </div>
  </div>
{/if}
