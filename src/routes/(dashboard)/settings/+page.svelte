<script>
  import { onMount } from 'svelte';
  import Icon from '$lib/Icon.svelte';

  let { data } = $props();
  let tab = $state('profile');
  let userName = $state('');
  let userEmail = $state('');
  let userInitials = $state('');
  let userRole = $state('');

  onMount(async () => {
    const { data: { user } } = await data.supabase.auth.getUser();
    if (user) {
      userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      userEmail = user.email || '';
      const parts = userName.split(' ');
      userInitials = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : userName.slice(0, 2).toUpperCase();
    }
    // Get role
    const res = await fetch('/api/team');
    const { members } = await res.json();
    const me = (members || []).find(m => m.email.toLowerCase() === userEmail.toLowerCase());
    userRole = me?.role || 'member';
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'user', desc: 'Your account & sign-in' },
    { id: 'workspace', label: 'Workspace', icon: 'building', desc: 'Facilities OS config' },
    { id: 'approval', label: 'Approval Routing', icon: 'check', desc: 'Who signs off on what' },
    { id: 'ai', label: 'AI Preferences', icon: 'sparkle', desc: 'Gemini match weights' },
  ];

  let match = $state(60);
</script>

<div class="settings-shell">
  <aside class="settings-rail">
    <h1 class="page-title" style="margin-bottom:4px">Settings</h1>
    <div class="page-sub" style="margin-bottom:22px;font-size:12.5px">Your account and workspace config.</div>
    <nav class="settings-nav">
      {#each tabs as t}
        <button class="settings-nav-item" class:active={tab===t.id} onclick={()=>tab=t.id}>
          <Icon name={t.icon} size={14}/>
          <div class="v"><span class="settings-nav-label">{t.label}</span><span class="settings-nav-desc">{t.desc}</span></div>
        </button>
      {/each}
    </nav>
  </aside>

  <section class="settings-body">
    {#if tab === 'profile'}
      <div class="settings-card">
        <div class="settings-card-head"><div><div class="xs muted mono" style="letter-spacing:0.08em;margin-bottom:4px">01 · IDENTITY</div><h2 class="settings-card-title">Your profile</h2></div></div>
        <div class="settings-card-body">
          <div class="profile-head">
            <div class="profile-avatar">{userInitials || '...'}</div>
            <div class="grow">
              <div style="font-size:18px;font-weight:600">{userName || 'Loading...'}</div>
              <div class="xs muted mono" style="margin-top:4px">{userRole.toUpperCase()} &middot; Facilities Team</div>
            </div>
          </div>
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">Email</div><div class="setting-row-sub">Google SSO — managed by your workspace.</div></div><div class="setting-row-control"><input class="input" value={userEmail} disabled style="width:300px"/></div></div>
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">Role</div><div class="setting-row-sub">{userRole === 'admin' ? 'Full access including team management.' : 'Can manage requests, vendors, and emails.'}</div></div><div class="setting-row-control"><span class="badge" data-tone={userRole==='admin'?'accent':'blue'}>{userRole}</span></div></div>
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">Sign-in method</div><div class="setting-row-sub">Google OAuth via Supabase Auth.</div></div><div class="setting-row-control"><span class="badge" data-tone="emerald"><Icon name="check" size={10}/>Active</span></div></div>
        </div>
      </div>

    {:else if tab === 'workspace'}
      <div class="settings-card">
        <div class="settings-card-head"><div><div class="xs muted mono" style="letter-spacing:0.08em;margin-bottom:4px">01 · WORKSPACE</div><h2 class="settings-card-title">Facilities OS</h2></div></div>
        <div class="settings-card-body">
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">App Name</div></div><div class="setting-row-control"><input class="input" value="FundFlow — Facilities OS" disabled style="width:280px"/></div></div>
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">Currency</div></div><div class="setting-row-control"><span class="mono">INR (₹)</span></div></div>
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">AI Model</div><div class="setting-row-sub">Used for vendor matching and email drafting.</div></div><div class="setting-row-control"><span class="mono">Gemini 2.5 Flash</span></div></div>
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">UniConnect Webhook</div><div class="setting-row-sub">Receives budget proposals from UniConnect.</div></div><div class="setting-row-control"><span class="badge" data-tone="emerald">Connected</span></div></div>
          <div class="setting-row"><div class="setting-row-text"><div class="setting-row-title">SMTP Email</div><div class="setting-row-sub">For sending RFQ emails to vendors.</div></div><div class="setting-row-control"><span class="badge" data-tone="amber">Pending setup</span></div></div>
        </div>
      </div>

    {:else if tab === 'approval'}
      <div class="settings-card">
        <div class="settings-card-head"><div><div class="xs muted mono" style="letter-spacing:0.08em;margin-bottom:4px">01 · ROUTING RULES</div><h2 class="settings-card-title">Approval thresholds</h2></div></div>
        <div class="settings-card-body"><div class="rules-list">
          {#each [
            { range:'< ₹10,000', who:'L1 — CMA Manager', sub:'Single approval. Budget proposals under ₹10K.', color:'var(--emerald)' },
            { range:'≥ ₹10,000', who:'L1 + Admin', sub:'Dual approval required. CMA Manager → Admin.', color:'var(--amber)' },
          ] as r}
            <div class="rule-row"><div class="rule-range" style="border-color:{r.color};color:{r.color}">{r.range}</div><div class="rule-arrow">&rarr;</div><div class="grow"><div style="font-weight:600">{r.who}</div><div class="xs muted">{r.sub}</div></div></div>
          {/each}
        </div></div>
      </div>

    {:else if tab === 'ai'}
      <div class="settings-card">
        <div class="settings-card-head"><div><div class="xs muted mono" style="letter-spacing:0.08em;margin-bottom:4px">01 · VENDOR MATCHING</div><h2 class="settings-card-title">AI match weights</h2></div></div>
        <div class="settings-card-body">
          {#each [['Category relevance', 40], ['Past order count', 25], ['Vendor rating', 20], ['Delivery speed', 15]] as [label, val]}
            <div class="weight-row"><div class="weight-label">{label}</div><input type="range" min="0" max="100" value={val} class="weight-slider" disabled/><div class="weight-val mono">{val}%</div></div>
          {/each}
        </div>
      </div>
    {/if}
  </section>
</div>
