<script>
  import { onMount } from 'svelte';
  let theme = $state('light');

  onMount(() => {
    const saved = localStorage.getItem('atrium-theme') || 'light';
    theme = saved;
    document.documentElement.dataset.theme = saved;
  });

  function apply(t) {
    theme = t;
    document.documentElement.dataset.theme = t;
    localStorage.setItem('atrium-theme', t);
  }
</script>

<div class="theme-toggle" role="group" aria-label="Theme">
  <button aria-pressed={theme === 'light'} onclick={() => apply('light')} title="Light">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
  </button>
  <button aria-pressed={theme === 'dark'} onclick={() => apply('dark')} title="Dark">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  </button>
  <button aria-pressed={theme === 'cream'} onclick={() => apply('cream')} title="Cream">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" opacity="0.85"/></svg>
  </button>
</div>
