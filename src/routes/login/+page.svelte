<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Icon from '$lib/Icon.svelte';

  let { data } = $props();
  let tick = $state(0);
  let loading = $state(false);

  const TICKER = [
    { t: "0:02", c: "HYD", a: "REQ-1027 advanced to PO Issued", k: "advance" },
    { t: "0:05", c: "BLR", a: "Vendor matched · Tirupati Decor (94%)", k: "match" },
    { t: "0:11", c: "DEL", a: "REQ-1019 delivered · ₹84,200 settled", k: "done" },
    { t: "0:18", c: "BOM", a: "Quote received · Saraswati Press", k: "match" },
    { t: "0:24", c: "MAA", a: "REQ-1014 raised · Robotics Signage", k: "new" },
    { t: "0:31", c: "PNQ", a: "Approval routed to Ops Head", k: "advance" },
    { t: "0:37", c: "CCU", a: "REQ-1011 delivered · ₹1.2L settled", k: "done" },
    { t: "0:44", c: "AMD", a: "AI shortlisted 4 vendors", k: "match" },
  ];

  function tonecolor(k) {
    return k === "done" ? "var(--emerald)" : k === "match" ? "var(--violet)" : k === "new" ? "var(--amber)" : "var(--accent)";
  }

  onMount(() => {
    if (data.session) {
      goto('/control-center');
      return;
    }

    const { data: { subscription } } = data.supabase.auth.onAuthStateChange((_event, session) => {
      if (session) goto('/control-center');
    });

    const interval = setInterval(() => { tick = (tick + 1) % TICKER.length; }, 1800);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  });

  async function handleGoogleLogin() {
    loading = true;
    const { error } = await data.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { prompt: 'select_account' },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Login error:', error.message);
      loading = false;
    }
  }

  const kpiItems = [
    { v: "1,284", l: "IN-FLIGHT" },
    { v: "₹2.4Cr", l: "ORCHESTRATED" },
    { v: "14d", l: "CYCLE · ↓ 8d" },
    { v: "20/20", l: "CAMPUSES" },
  ];

  const statCards = [
    { label: "REQUESTS IN-FLIGHT", value: "1,284", color: "var(--emerald)", extra: "+14% MoM", icon: "arrowUp" },
    { label: "ACTIVE VENDORS", value: "114", extra: "live", dot: true },
    { label: "CAMPUSES", value: "20", extra: "PAN-INDIA" },
    { label: "AVG CYCLE", value: "14d", color: "var(--emerald)", extra: "−2d", icon: "arrowDown" },
  ];
</script>

<div class="login-shell">
  <div class="login-left">
    <div class="h between" style="align-items: flex-start">
      <div class="h gap-10">
        <div class="brand-mark" style="width: 26px; height: 26px"></div>
        <span class="brand-name" style="font-size: 15px">FundFlow<sup class="brand-tm">&trade;</sup></span>
      </div>
      <div class="xs muted mono" style="letter-spacing: 0.06em; display: flex; gap: 18px">
        <a>PRODUCT</a><a>CHANGELOG</a><a>DOCS</a>
        <a style="display: inline-flex; align-items: center; gap: 5px">STATUS<span style="color: var(--emerald)">&#9679;</span></a>
      </div>
    </div>

    <div style="margin-top: 24px; max-width: 520px">
      <div class="h between" style="margin-bottom: 10px">
        <div class="xs muted mono" style="letter-spacing: 0.1em">LIVE &middot; ATRIUM NETWORK</div>
        <div class="h gap-6 xs mono" style="color: var(--emerald)">
          <span class="live-dot"></span>STREAMING &middot; 20/20
        </div>
      </div>
      <div style="border: 1px solid var(--hairline); border-radius: 12px; background: var(--surface); overflow: hidden">
        <div style="padding: 12px 14px">
          <div class="xs mono" style="color: var(--muted-2); letter-spacing: 0.08em; margin-bottom: 8px">EVENT STREAM &middot; LAST 1H</div>
          {#each TICKER as e, i}
            {@const active = i === tick}
            {@const recent = i <= tick}
            <div style="display: grid; grid-template-columns: 26px 32px 1fr; align-items: baseline; gap: 6px; padding: 4px 6px; border-radius: 3px; background: {active ? 'var(--accent-soft)' : 'transparent'}; opacity: {recent ? 1 : 0.32}; transition: all 220ms">
              <span style="font-family: var(--font-mono); font-size: 8.5px; color: var(--muted-2)">-{e.t}</span>
              <span style="font-family: var(--font-mono); font-size: 9px; color: {tonecolor(e.k)}; font-weight: 700">{e.c}</span>
              <span style="font-size: 10.5px; color: {active ? 'var(--ink)' : 'var(--ink-2)'}; line-height: 1.3">{e.a}</span>
            </div>
          {/each}
        </div>
        <div style="border-top: 1px solid var(--hairline); padding: 12px 14px; background: var(--surface-2)">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px">
            {#each kpiItems as k, i}
              <div style="border-left: {i === 0 ? 'none' : '1px solid var(--hairline)'}; padding-left: {i === 0 ? '0' : '10px'}">
                <div style="font-family: var(--font-mono); font-size: 14px; font-weight: 600">{k.v}</div>
                <div class="xs mono" style="color: var(--muted-2); margin-top: 1px; font-size: 8.5px">{k.l}</div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <div class="login-hero">
      <div class="xs muted mono" style="margin-bottom: 16px; letter-spacing: 0.1em">SIGN IN &middot; FACILITIES OS</div>
      <h1 class="login-h1">Procurement that runs <em>itself</em>.</h1>
      <p class="login-sub">FundFlow orchestrates requests, vendors, and budgets across 20 campuses. One sign-in, full control of the pipeline.</p>
      <button class="login-google" onclick={handleGoogleLogin} disabled={loading}>
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.8 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.2-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41 35.1 44 29.9 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
        <Icon name="arrow" size={14} />
      </button>
      <div class="login-foot">USE YOUR ATRIUM-ISSUED GOOGLE ACCOUNT &middot; NO PASSWORDS &middot; SSO BY DEFAULT</div>
    </div>
    <div class="xs muted mono" style="letter-spacing: 0.08em">v4.2 &middot; ATRIUM &middot; EST 2024 &middot; HYDERABAD</div>
  </div>

  <div class="login-right">
    <div class="login-ribbon"></div>
    <div style="position: relative; z-index: 1">
      <div class="xs muted mono" style="margin-bottom: 14px; letter-spacing: 0.1em">LIVE &middot; OPERATIONS SNAPSHOT</div>
      <div class="v gap-10">
        {#each statCards as s}
          <div class="login-stat-card">
            <div>
              <div class="xs muted mono">{s.label}</div>
              <div class="mono" style="font-size: 22px; font-weight: 600">{s.value}</div>
            </div>
            {#if s.icon}
              <div class="h gap-4 xs mono" style="color: {s.color}"><Icon name={s.icon} size={11} />{s.extra}</div>
            {:else if s.dot}
              <div class="h gap-4 xs mono"><span class="live-dot"></span>{s.extra}</div>
            {:else}
              <div class="xs muted mono">{s.extra}</div>
            {/if}
          </div>
        {/each}
        <div class="login-stat-card" style="background: var(--ink); color: var(--bg); border-color: var(--ink)">
          <div>
            <div class="xs mono" style="color: var(--muted-3)">AI ACTIONS TODAY</div>
            <div class="mono" style="font-size: 22px; font-weight: 600">47 matches &middot; 63 drafts</div>
          </div>
          <Icon name="sparkle" size={18} class="accent-ink" />
        </div>
      </div>
    </div>
  </div>
</div>
