<script>
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import Icon from '$lib/Icon.svelte';
  let { data } = $props();

  let toEmail = $state(data.vendorEmail || data.selectedVendor?.email || data.req?.vendor?.email || '');
  let subject = $state('');
  let body = $state('');
  let generating = $state(false);
  let sending = $state(false);
  let sent = $state(false);
  let sendStatus = $state('');

  const cacheKey = `ai-email-${$page.params.id}`;

  onMount(() => {
    // Check cache
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        subject = parsed.subject || '';
        body = parsed.body || '';
        if (parsed.to && !toEmail) toEmail = parsed.to;
      } catch { generateEmail(); }
    } else if (data.req) {
      generateEmail();
    }
  });

  async function generateEmail() {
    generating = true;
    try {
      const res = await fetch('/api/ai/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirement_id: $page.params.id,
          vendor_id: data.selectedVendor?.id || data.req?.vendor?.id,
          vendor_email: toEmail,
        })
      });
      const result = await res.json();
      if (result.subject) subject = result.subject;
      if (result.body) body = result.body;
      if (result.to && !toEmail) toEmail = result.to;
      // Cache
      sessionStorage.setItem(cacheKey, JSON.stringify({ subject, body, to: toEmail }));
    } catch (e) { console.error(e); }
    generating = false;
  }

  async function sendEmail() {
    if (!toEmail || !subject || !body) return;
    sending = true;
    try {
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toEmail, subject, body, cc: data.ccEmail || undefined })
      });
      const result = await res.json();
      if (result.success) {
        sent = true;
        sendStatus = result.message || 'Email sent!';
        // Clear cache after sending
        sessionStorage.removeItem(cacheKey);
      } else {
        sendStatus = result.error || 'Failed to send';
      }
    } catch (e) { sendStatus = 'Network error'; }
    sending = false;
  }
</script>
{#if !data.req}<div class="empty"><div class="empty-mark"></div>Request not found</div>
{:else}
{@const r = data.req}
{@const vendor = data.selectedVendor || r.vendor}
<div class="page-kicker h gap-8"><button class="icon-btn" onclick={()=>goto(`/request/${r.id}`)}><Icon name="chev" size={14}/></button><span>{r.university?.short_name || r.delivery_notes || '—'}</span><span class="dot-sep">&middot;</span><span>Step 2: RFQ Email</span></div>
<div class="page-head"><div><h1 class="page-title" style="display:flex;align-items:center;gap:10px"><Icon name="mail" size={20}/>Compose vendor RFQ</h1><div class="page-sub">{generating ? 'Gemini is drafting...' : sent ? 'Email sent successfully!' : 'AI-drafted. Edit freely before sending.'}</div></div>
<div class="h gap-8">
  {#if !sent}
    <button class="btn sm" onclick={generateEmail} disabled={generating}><Icon name="refresh" size={12}/>{generating ? 'Drafting...' : 'Regenerate'}</button>
    <button class="btn accent" onclick={sendEmail} disabled={sending || !body || !toEmail}><Icon name="send" size={12}/>{sending ? 'Sending...' : 'Send Email'}</button>
  {:else}
    <button class="btn accent" onclick={()=>goto(`/request/${r.id}`)}><Icon name="arrow" size={12}/>Back to Requirement →</button>
  {/if}
</div></div>

<!-- Steps indicator -->
<div class="steps" style="margin-bottom:16px">
  <div class="step" data-done={true}><span class="step-num">01</span><span>AI Match</span><Icon name="check" size={12}/></div>
  <div class="step" data-active={!sent}><span class="step-num">02</span><span>Send RFQ Email</span></div>
  <div class="step" data-active={sent}><span class="step-num">03</span><span>Track & Complete</span></div>
</div>

{#if sent}
<div class="card" style="margin-bottom:14px;background:var(--emerald-soft);border-color:var(--emerald)">
  <div class="card-body v gap-8" style="padding:20px">
    <div class="h gap-10"><Icon name="check" size={18}/><span style="font-weight:600;color:var(--emerald);font-size:15px">{sendStatus}</span></div>
    <div class="xs" style="color:var(--emerald)">The vendor will receive the RFQ email. When they reply or call, update the details on the requirement page.</div>
    <div class="h gap-8" style="margin-top:8px">
      <button class="btn" onclick={()=>goto(`/request/${r.id}`)}><Icon name="arrow" size={12}/>Go to Requirement Detail</button>
      <button class="btn sm" onclick={()=>goto('/control-center')}>Control Center</button>
    </div>
  </div>
</div>
{/if}

<div style="display:grid;grid-template-columns:1fr 300px;gap:20px">
<div class="email-shell" style={sent?'opacity:0.6;pointer-events:none':''}>
  <div class="email-field"><span style="padding:10px 14px;font-family:var(--font-mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em">To</span><input bind:value={toEmail} placeholder="vendor@email.com"/></div>
  <div class="email-field"><span style="padding:10px 14px;font-family:var(--font-mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em">Cc</span><input value={data.ccEmail || '—'} disabled/></div>
  <div class="email-field"><span style="padding:10px 14px;font-family:var(--font-mono);font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em">Subject</span><input bind:value={subject}/></div>
  {#if generating}
    <div class="email-body" style="display:grid;place-items:center;min-height:340px"><div class="v gap-8 center"><Icon name="sparkle" size={24}/><div class="xs muted mono">GEMINI IS DRAFTING A DETAILED RFQ...</div></div></div>
  {:else}
    <textarea class="email-body" bind:value={body} style="border:0;width:100%;resize:vertical;outline:none;background:transparent;font-family:inherit;min-height:340px"></textarea>
  {/if}
  <div class="h between" style="padding:12px;border-top:1px solid var(--hairline);background:var(--surface-2)">
    <span class="xs muted mono">POWERED BY GEMINI 2.5 FLASH &middot; CACHED</span>
  </div>
</div>
<div class="v gap-12">
  {#if vendor}
  <div class="card"><div class="card-head"><h3 class="card-title">Recipient</h3></div><div class="card-body v gap-6">
    <div style="font-size:13px;font-weight:600">{vendor.name}</div>
    <div class="xs muted">{vendor.category}</div>
    {#if vendor.email}<div class="h gap-6 small muted"><Icon name="mail" size={12}/>{vendor.email}</div>{/if}
    {#if vendor.phone}<div class="h gap-6 small muted"><Icon name="phone" size={12}/>{vendor.phone}</div>{/if}
    {#if vendor.avg_rating}<div class="h gap-6 small"><Icon name="star" size={12}/>Rating: {vendor.avg_rating}</div>{/if}
  </div></div>
  {/if}
  <div class="card"><div class="card-head"><h3 class="card-title">Requirement</h3></div><div class="card-body v gap-6">
    <div style="font-size:13px;font-weight:600">{r.title}</div>
    <div class="xs muted">Budget: ₹{(r.allocated_budget||0).toLocaleString('en-IN')}</div>
    {#if r.required_by_date}<div class="xs muted">Need by: {r.required_by_date}</div>{/if}
    {#if r.delivery_location}<div class="xs muted">Venue: {r.delivery_location}</div>{/if}
  </div></div>
  <div class="card" style="background:var(--accent-soft);border-color:var(--accent)"><div class="card-body v gap-6"><div class="h gap-8"><Icon name="sparkle" size={14}/><span style="font-weight:600;color:var(--accent-ink);font-size:12.5px">Drafted by Gemini</span></div><div class="xs" style="color:var(--accent-ink);line-height:1.55">Includes detailed items table, reply instructions, and contact details. The vendor can reply to this email or call directly.</div></div></div>
</div>
</div>
{/if}
