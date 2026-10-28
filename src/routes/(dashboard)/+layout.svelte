<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Icon from '$lib/Icon.svelte';
  import ThemeToggle from '$lib/ThemeToggle.svelte';

  let { data, children } = $props();
  let checked = $state(false);
  let user = $state(null);
  let userRole = $state('');
  let accessDenied = $state(false);

  onMount(async () => {
    if (!data.session) {
      goto('/login');
      return;
    }

    const { data: { user: u } } = await data.supabase.auth.getUser();
    if (!u) { goto('/login'); return; }

    const email = u.email || '';
    const name = u.user_metadata?.full_name || email.split('@')[0] || 'User';
    const parts = name.split(' ');
    const initials = parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
    user = { name, email, initials };

    // Check if user is in facility_team_members
    const res = await fetch('/api/team');
    const { members } = await res.json();
    const member = (members || []).find(m => m.email.toLowerCase() === email.toLowerCase() && m.is_active);

    if (!member) {
      accessDenied = true;
      return;
    }

    userRole = member.role;
    checked = true;

    const { data: { subscription } } = data.supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) goto('/login');
    });

    return () => subscription.unsubscribe();
  });

  async function handleLogout() {
    await data.supabase.auth.signOut();
    goto('/login');
  }

  function getActive(id) {
    const pathname = $page.url.pathname;
    if (id === 'control-center' && (pathname === '/' || pathname === '/control-center')) return true;
    return pathname.startsWith(`/${id}`);
  }

  function navigate(id) {
    if (id === 'control-center') goto('/control-center', { invalidateAll: true });
    else goto(`/${id}`, { invalidateAll: true });
  }

  const NAV_MEMBER = [
    { id: "control-center", label: "Control Center", icon: "dashboard" },
    { id: "request/new", label: "New Request", icon: "plus" },
    { id: "vendors", label: "Vendors", icon: "vendors" },
    { id: "team", label: "Campuses", icon: "building" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  const NAV_ADMIN = [
    { id: "control-center", label: "Control Center", icon: "dashboard" },
    { id: "my-requests", label: "My Requests", icon: "file" },
    { id: "request/new", label: "Raise Request", icon: "plus" },
    { id: "vendors", label: "Vendors", icon: "vendors" },
    { id: "admin", label: "Admin", icon: "admin" },
    { id: "team", label: "Campuses", icon: "building" },
    { id: "settings", label: "Settings", icon: "settings" },
  ];

  let navItems = $derived(userRole === 'admin' ? NAV_ADMIN : NAV_MEMBER);
</script>

{#if accessDenied}
  <div style="min-height:100vh;display:grid;place-items:center;background:var(--bg)">
    <div class="v gap-12 center" style="text-align:center;max-width:400px">
      <div style="width:56px;height:56px;border-radius:50%;background:var(--rose-soft);display:grid;place-items:center;color:var(--rose)"><Icon name="x" size={24}/></div>
      <h2 style="margin:0;font-size:20px">Access Denied</h2>
      <p class="muted" style="line-height:1.6">Your account <strong>{user?.email}</strong> is not a member of the Facilities team. Ask an admin to add you.</p>
      <button class="btn" onclick={handleLogout}><Icon name="arrow" size={14}/>Sign out</button>
    </div>
  </div>
{:else if !checked}
  <div style="min-height:100vh;display:grid;place-items:center;background:var(--bg)">
    <div class="xs muted mono" style="letter-spacing:0.1em">VERIFYING ACCESS...</div>
  </div>
{:else}
  <div class="app" data-sidebar="full">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mark"></div>
        <span class="brand-name">FundFlow<sup class="brand-tm">&trade;</sup></span>
      </div>
      <div class="sidebar-section">Workspace</div>
      {#each navItems as n}
        <button class="nav-item" data-active={getActive(n.id)} onclick={() => navigate(n.id)}>
          <Icon name={n.icon} size={15} class="nav-icon" />
          <span>{n.label}</span>
        </button>
      {/each}
      <div class="sidebar-foot" style="gap:8px">
        <div class="avatar">{user?.initials || '...'}</div>
        <div style="min-width:0;flex:1">
          <div style="font-size:12px;font-weight:500">{user?.name || 'Loading...'}</div>
          <div class="xs muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{user?.email || ''}</div>
          <div class="xs mono" style="color:var(--accent);margin-top:1px">{userRole.toUpperCase()}</div>
        </div>
        <button class="icon-btn" onclick={handleLogout} title="Sign out" style="flex-shrink:0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>

    <div class="main">
      <div class="topbar">
        <div class="breadcrumb">
          <Icon name="building" size={14} /><span>FundFlow</span><Icon name="chev" size={12} /><strong>Dashboard</strong>
        </div>
        <div class="topbar-actions">
          <div class="cmd"><Icon name="search" size={14} /><span>Search requests, vendors&hellip;</span><span class="cmd-kbd">&thinsp;&#8984;K</span></div>
          <ThemeToggle />
          <button class="btn accent" onclick={() => goto('/request/new')}><Icon name="plus" size={14} />New Request</button>
        </div>
      </div>
      <main class="content flush">
        {@render children()}
      </main>
    </div>

    <!-- Mobile Bottom Nav -->
    <nav class="mobile-nav">
      <div class="mobile-nav-inner">
        <button class="mobile-nav-item" data-active={getActive('control-center')} onclick={() => navigate('control-center')}>
          <Icon name="dashboard" size={20}/><span>Home</span>
        </button>
        {#if userRole === 'admin'}
        <button class="mobile-nav-item" data-active={getActive('my-requests')} onclick={() => navigate('my-requests')}>
          <Icon name="file" size={20}/><span>Requests</span>
        </button>
        {/if}
        <button class="mobile-nav-item" data-active={getActive('vendors')} onclick={() => navigate('vendors')}>
          <Icon name="vendors" size={20}/><span>Vendors</span>
        </button>
        {#if userRole === 'admin'}
        <button class="mobile-nav-item" data-active={getActive('admin')} onclick={() => navigate('admin')}>
          <Icon name="admin" size={20}/><span>Admin</span>
        </button>
        {/if}
        <button class="mobile-nav-item" data-active={getActive('settings')} onclick={() => navigate('settings')}>
          <Icon name="settings" size={20}/><span>Settings</span>
        </button>
      </div>
    </nav>
  </div>
{/if}
