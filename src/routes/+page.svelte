<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  onMount(() => { goto('/login'); });
</script>
<div style="min-height:100vh;display:grid;place-items:center;background:var(--bg)">
  <div class="xs muted mono" style="letter-spacing:0.1em">REDIRECTING...</div>
</div>
