<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Icon from '$lib/Icon.svelte';

  let { data, children } = $props();
  let checked = $state(false);
  let user = $state(null);

  const NAV = [
    { id: '/vendor-portal', label: 'My Orders', icon: 'inbox' },
    { id: '/vendor-portal/tracking', label: 'Track Delivery', icon: 'truck' },
    { id: '/vendor-portal/invoices', label: 'Invoices & Bills', icon: 'upload' },
    { id: '/vendor-portal/reviews', label: 'My Reviews', icon: 'star' },
  ];

  onMount(async () => {
    if (!data.session) {
      goto('/vendor-login');
      return;
    }
    const { data: { user: u } } = await data.supabase.auth.getUser();
    if (u) {
      const name = u.user_metadata?.full_name || u.email?.split('@')[0] || 'Vendor';
      user = { name, email: u.email || '', initials: name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() };
    }
    checked = true;
  });

  async function handleLogout() {
    await data.supabase.auth.signOut();
    goto('/vendor-login');
  }

  function isActive(path) {
    if (path === '/vendor-portal') return $page.url.pathname === '/vendor-portal';
    return $page.url.pathname.startsWith(path);
  }
</script>

{#if !checked}
  <div style="min-height:100vh;display:grid;place-items:center;background:var(--bg)"><div class="xs muted mono">LOADING...</div></div>
{:else}
  <div class="app" style="grid-template-columns:220px 1fr">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark"></div>
        <div class="v"><span class="brand-name" style="font-size:13px">FundFlow</span><span style="font-size:9px;color:var(--violet);font-family:var(--font-mono);letter-spacing:0.06em">VENDOR PORTAL</span></div>
      </div>
      <div class="sidebar-section">Navigation</div>
      {#each NAV as n}
        <button class="nav-item" data-active={isActive(n.id)} onclick={() => goto(n.id)}>
          <Icon name={n.icon} size={15} class="nav-icon"/><span>{n.label}</span>
        </button>
      {/each}
      <div class="sidebar-foot" style="gap:8px">
        <div class="avatar" style="background:var(--violet)">{user?.initials || '?'}</div>
        <div style="min-width:0;flex:1">
          <div style="font-size:12px;font-weight:500">{user?.name || ''}</div>
          <div class="xs muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{user?.email || ''}</div>
        </div>
        <button class="icon-btn" onclick={handleLogout} title="Sign out"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></button>
      </div>
    </aside>
    <div class="main">
      <div class="topbar">
        <div class="breadcrumb"><Icon name="vendors" size={14}/><span>Vendor Portal</span><Icon name="chev" size={12}/><strong>{NAV.find(n => isActive(n.id))?.label || 'Dashboard'}</strong></div>
      </div>
      <main class="content flush" style="padding:20px 24px">
        {@render children()}
      </main>
    </div>

    <!-- Mobile Bottom Nav -->
    <nav class="mobile-nav">
      <div class="mobile-nav-inner">
        {#each NAV as n}
          <button class="mobile-nav-item" data-active={isActive(n.id)} onclick={() => goto(n.id)}>
            <Icon name={n.icon} size={20}/><span>{n.label.split(' ')[0]}</span>
          </button>
        {/each}
      </div>
    </nav>
  </div>
{/if}
