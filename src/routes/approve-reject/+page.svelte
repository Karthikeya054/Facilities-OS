<script>
  import { page } from '$app/stores';
  import Icon from '$lib/Icon.svelte';

  let reason = $state('');
  let submitting = $state(false);
  let done = $state(false);

  async function submitRejection() {
    const id = $page.url.searchParams.get('id');
    const level = $page.url.searchParams.get('level');
    if (!id || !reason.trim()) return;
    submitting = true;
    try {
      const res = await fetch('/api/approve/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, level, reason, exp: $page.url.searchParams.get('exp'), sig: $page.url.searchParams.get('sig') })
      });
      if (res.ok) done = true;
    } catch (e) { console.error(e); }
    submitting = false;
  }
</script>

<div style="min-height:100vh;display:grid;place-items:center;background:var(--bg);padding:20px">
  <div style="max-width:500px;width:100%">
    {#if done}
      <div class="card" style="border-color:var(--rose)">
        <div class="card-body v gap-12 center" style="padding:40px;text-align:center">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--rose-soft);display:grid;place-items:center;color:var(--rose)"><Icon name="x" size={22}/></div>
          <h2 style="margin:0;font-size:18px">Requirement Rejected</h2>
          <p class="muted" style="line-height:1.5">The raiser has been notified with your reason.</p>
          <a href="/control-center" class="btn">Back to Dashboard</a>
        </div>
      </div>
    {:else}
      <div class="card">
        <div class="card-head" style="background:var(--rose-soft)"><h3 class="card-title" style="color:var(--rose)"><Icon name="x" size={14}/>Reject Requirement</h3></div>
        <div class="card-body v gap-12" style="padding:20px">
          <div class="xs muted">Please provide a reason for rejection. This will be sent to the person who raised the requirement.</div>
          <div class="v gap-4">
            <span class="xs muted mono">REASON FOR REJECTION *</span>
            <textarea class="input w-full" bind:value={reason} rows="4" style="height:auto;padding:10px;resize:vertical" placeholder="Why is this requirement being rejected? What needs to change?"></textarea>
          </div>
          <div class="h gap-8">
            <button class="btn accent" style="background:var(--rose);border-color:var(--rose)" onclick={submitRejection} disabled={submitting || !reason.trim()}><Icon name="send" size={12}/>{submitting ? 'Sending...' : 'Reject & Notify Raiser'}</button>
            <a href="/control-center" class="btn">Cancel</a>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
