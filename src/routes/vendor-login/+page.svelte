<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';

  let { data } = $props();
  let loading = $state(false);

  onMount(() => {
    if (data.session) goto('/vendor-portal');
  });

  async function handleLogin() {
    loading = true;
    const { error } = await data.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { prompt: 'select_account' },
        redirectTo: `${window.location.origin}/auth/callback?next=/vendor-portal`,
      },
    });
    if (error) { console.error(error); loading = false; }
  }
</script>

<div style="min-height:100vh;display:grid;grid-template-columns:1fr 1fr;background:var(--bg)">
  <!-- Left: Login -->
  <div style="display:flex;flex-direction:column;justify-content:center;padding:60px 80px">
    <div class="h gap-10" style="margin-bottom:40px">
      <div class="brand-mark" style="width:28px;height:28px"></div>
      <span style="font-weight:600;font-size:16px">FundFlow</span>
      <span class="badge" data-tone="violet">Vendor Portal</span>
    </div>

    <h1 style="font-size:32px;font-weight:500;letter-spacing:-0.02em;line-height:1.1;margin:0 0 12px">Manage your orders<br>in one place.</h1>
    <p style="color:var(--muted);font-size:14px;line-height:1.6;max-width:380px;margin:0 0 32px">View assigned procurement orders, confirm quotes, track deliveries, and submit invoices — all through the FundFlow Vendor Portal.</p>

    <button style="display:inline-flex;align-items:center;gap:10px;padding:0 20px;height:46px;background:var(--ink);color:var(--bg);border:none;border-radius:var(--r);font-weight:500;font-size:14px;cursor:pointer" onclick={handleLogin} disabled={loading}>
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.2-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 35.1 44 29.9 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
      {loading ? 'Signing in...' : 'Sign in with Google'}
      <Icon name="arrow" size={14}/>
    </button>

    <div style="margin-top:14px;font-family:var(--font-mono);font-size:10.5px;color:var(--muted-2);text-transform:uppercase;letter-spacing:0.06em">USE YOUR GMAIL ACCOUNT &middot; NO REGISTRATION NEEDED</div>

    <div style="margin-top:48px;font-family:var(--font-mono);font-size:10px;color:var(--muted-3);letter-spacing:0.06em">ATRIUM &middot; VENDOR PORTAL &middot; v1.0</div>
  </div>

  <!-- Right: Features -->
  <div style="background:var(--surface-2);border-left:1px solid var(--hairline);padding:60px 48px;display:flex;flex-direction:column;justify-content:center;gap:20px">
    <div style="font-family:var(--font-mono);font-size:10.5px;color:var(--muted-2);letter-spacing:0.1em;margin-bottom:8px">WHAT YOU CAN DO</div>

    {#each [
      { icon: 'inbox', title: 'View Assigned Orders', desc: 'See all procurement orders assigned to you by the FundFlow Facilities team. Each order shows items, quantities, specs, and budget.' },
      { icon: 'check', title: 'Confirm & Quote', desc: 'Review order details and submit your quotation with pricing and delivery timeline. The facilities team gets notified instantly.' },
      { icon: 'truck', title: 'Track Delivery', desc: 'Update order status as you progress — sample ready, in production, shipped, delivered. The requester sees real-time tracking.' },
      { icon: 'upload', title: 'Upload Bills & Invoices', desc: 'Submit your bill, invoice, or receipt (PDF/image). It gets attached to the order for the facilities team to process payment.' },
      { icon: 'star', title: 'Build Your Rating', desc: 'After each order, the facilities team rates your work. Higher ratings mean you get matched to more orders via AI.' },
    ] as f}
      <div style="display:flex;gap:14px;padding:14px;background:var(--surface);border:1px solid var(--hairline);border-radius:10px">
        <div style="width:36px;height:36px;border-radius:8px;background:var(--violet-soft);display:grid;place-items:center;flex-shrink:0;color:var(--violet)"><Icon name={f.icon} size={16}/></div>
        <div><div style="font-weight:600;font-size:13px;margin-bottom:2px">{f.title}</div><div style="font-size:11.5px;color:var(--muted);line-height:1.5">{f.desc}</div></div>
      </div>
    {/each}
  </div>
</div>
