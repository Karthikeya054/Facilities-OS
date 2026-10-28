<script>
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import '../app.css';

  let { data, children } = $props();

  onMount(() => {
    const { data: { subscription } } = data.supabase.auth.onAuthStateChange((_event, session) => {
      invalidate('supabase:auth');
    });
    return () => subscription.unsubscribe();
  });
</script>

{@render children()}
