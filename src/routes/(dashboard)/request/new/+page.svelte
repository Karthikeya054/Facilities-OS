<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import Icon from '$lib/Icon.svelte';
  import { createRequirement, createRequirementItems } from '$lib/queries';

  let { data } = $props();
  let step = $state(1);
  let saving = $state(false);
  let d = $state({ title:'', description:'', requested_by_name:'', requested_by_email:'', required_by_date:'', allocated_budget:0, priority:'medium', delivery_location:'' });
  let items = $state([{ id:1, item_type:'General', description:'', quantity:1, unit_price:0, link:'' }]);
  let docFile = $state(null);
  let docName = $state('');
  let docText = $state('');
  let docHtml = $state('');
  let analyzing = $state(false);
  let analyzeMsg = $state('');
  let total = $derived(items.reduce((a, it) => a + it.quantity * it.unit_price, 0));

  onMount(async () => {
    const { data: { user } } = await data.supabase.auth.getUser();
    if (user) {
      d.requested_by_name = user.user_metadata?.full_name || user.email?.split('@')[0] || '';
      d.requested_by_email = user.email || '';
    }
  });

  let docReady = $state(false);

  function handleDocUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    docFile = file;
    docName = file.name;
    docReady = false;
    analyzeMsg = `Reading ${file.name}...`;
    analyzing = true;

    // For txt/md/csv — read directly as text
    if (file.name.match(/\.(txt|md|csv|rtf)$/i)) {
      const reader = new FileReader();
      reader.onload = () => {
        docText = reader.result?.toString() || '';
        docReady = true;
        analyzeDoc();
      };
      reader.readAsText(file);
    } else {
      // For doc/docx/pdf — send to server to parse
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/ai/parse-doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_data: reader.result, file_name: file.name, file_type: file.type })
          });
          const result = await res.json();
          if (res.ok && result.success) {
            docText = result.text;
            if (result.html) docHtml = result.html;
            docReady = true;

            if (result.extracted && result.extracted.items && result.extracted.items.length > 0) {
              const ex = result.extracted;
              if (ex.title) d.title = ex.title;
              if (ex.totalBudget) d.allocated_budget = ex.totalBudget;
              items = ex.items.map((it, idx) => ({
                id: idx + 1,
                item_type: 'Equipment',
                description: it.description || '',
                quantity: it.quantity || 1,
                unit_price: it.unit_price || 0,
                link: it.link || '',
              }));
              analyzeMsg = `✅ Extracted "${ex.title.slice(0,40)}" — ${ex.items.length} items, ₹${(ex.totalBudget || 0).toLocaleString('en-IN')} total`;
              analyzing = false;
              return;
            }
            analyzeMsg = `Parsed (${result.chars} chars). Analyzing with Gemini...`;
            await analyzeDoc();
          } else {
            analyzeMsg = '❌ ' + (result.error || 'Could not read file — try pasting content');
            analyzing = false;
          }
        } catch {
          analyzeMsg = '❌ Failed to parse file';
          analyzing = false;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async function analyzeDoc() {
    if (!docText) { analyzeMsg = 'No content to analyze. Paste text or upload a file.'; return; }
    analyzing = true;
    analyzeMsg = 'Gemini is reading your document...';
    try {
      const res = await fetch('/api/ai/analyze-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: docText, file_name: docName || 'document' })
      });
      const result = await res.json();
      if (res.ok && result.success && result.data) {
        const ai = result.data;
        if (ai.title) d.title = ai.title;
        if (ai.description) d.description = ai.description;
        if (ai.priority) d.priority = ai.priority;
        if (ai.estimated_budget) d.allocated_budget = ai.estimated_budget;
        if (ai.items && ai.items.length > 0) {
          items = ai.items.map((it, idx) => ({
            id: idx + 1,
            item_type: it.item_type || 'General',
            description: it.description || '',
            quantity: it.quantity || 1,
            unit_price: it.unit_price || 0,
            link: it.link || '',
          }));
        }
        analyzeMsg = `✅ Extracted: "${ai.title}" — ${ai.items?.length || 0} items, ₹${(ai.estimated_budget || 0).toLocaleString('en-IN')} budget`;
      } else {
        analyzeMsg = '❌ ' + (result.error || result.detail || 'Failed — try pasting content directly');
      }
    } catch (e) { analyzeMsg = '❌ Network error — try again'; }
    analyzing = false;
  }

  async function handleSubmit() {
    saving = true;
    try {
      const req = await createRequirement({
        title: d.title,
        description: d.description || undefined,
        requested_by_name: d.requested_by_name || undefined,
        requested_by_email: d.requested_by_email || undefined,
        required_by_date: d.required_by_date || undefined,
        allocated_budget: d.allocated_budget || total || undefined,
        priority: d.priority,
        delivery_location: d.delivery_location || undefined,
        status: 'pending_l1',
        source: 'internal',
      });

      if (items.length > 0 && items[0].description) {
        await createRequirementItems(req.id, items.map(it => ({
          item_type: it.item_type, description: it.description,
          quantity: it.quantity, unit_price: it.unit_price,
          total_price: it.quantity * it.unit_price,
          design_notes: it.link || null,
        })));
      }

      // Upload doc if attached
      if (docFile) {
        const reader = new FileReader();
        reader.onload = async () => {
          await fetch('/api/vendor-portal/upload-bill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requirement_id: req.id, file_name: docName, file_type: docFile.type, file_data: reader.result })
          });
        };
        reader.readAsDataURL(docFile);
      }

      // Trigger L1 approval email
      await fetch('/api/approve/send-l1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirement_id: req.id })
      });

      step = 3;
    } catch (err) { console.error(err); alert('Failed to create request.'); }
    finally { saving = false; }
  }
</script>

<div class="page-kicker h gap-8"><button class="icon-btn" onclick={() => goto('/control-center')}><Icon name="chev" size={14}/></button><span>New Request</span></div>
<div class="page-head"><div><h1 class="page-title">Raise Internal Request</h1><div class="page-sub">Upload a document or fill manually. Goes through L1 → L2 approval.</div></div></div>

<div class="steps" style="margin-bottom:20px">
  {#each [{n:1,l:'Details & Items'},{n:2,l:'Review & Submit'},{n:3,l:'Sent for Approval'}] as s}
    <div class="step" data-active={step===s.n} data-done={step>s.n}><span class="step-num">0{s.n}</span><span>{s.l}</span>{#if step>s.n}<Icon name="check" size={12}/>{/if}</div>
  {/each}
</div>

<div style="display:grid;grid-template-columns:1fr 300px;gap:20px">
<div class="card">
{#if step===1}
<div class="card-body" style="padding:12px 20px 20px">

  <!-- AI Document Analyzer -->
  <div style="background:var(--accent-soft);border:1px solid var(--accent);border-radius:8px;padding:16px;margin-bottom:16px">
    <div class="h gap-8" style="margin-bottom:10px"><Icon name="sparkle" size={16}/><span style="font-weight:600;color:var(--accent-ink);font-size:14px">AI Document Analyzer</span></div>
    <div class="xs" style="color:var(--accent-ink);margin-bottom:12px">Paste your document content below OR upload a text file. Gemini will auto-fill title, items, quantities, prices, and product links.</div>

    <!-- Paste content (primary method) -->
    <textarea class="input w-full" bind:value={docText} rows="6" style="height:auto;padding:10px;resize:vertical;font-size:12px;margin-bottom:10px;background:var(--surface)" placeholder="Paste your full document content here...&#10;&#10;Example:&#10;Item | Qty | Link | Cost&#10;Cricket Bats | 2 | https://amzn.in/... | 4000&#10;Stumps | 1 | https://amzn.in/... | 1000"></textarea>

    <div class="h gap-8">
      <button class="btn accent" onclick={analyzeDoc} disabled={analyzing || !docText}><Icon name="sparkle" size={12}/>{analyzing ? 'Analyzing with Gemini...' : 'Analyze & Auto-Fill'}</button>
      <label class="btn" style="cursor:pointer"><Icon name="upload" size={12}/>{docName || 'Or Upload File'}<input type="file" accept=".txt,.md,.rtf,.csv,.doc,.docx,.pdf" onchange={handleDocUpload} style="display:none"/></label>
    </div>
    {#if analyzeMsg}<div style="margin-top:8px;padding:8px 12px;border-radius:6px;font-size:12px;background:{analyzeMsg.startsWith('✅')?'var(--emerald-soft)':analyzeMsg.startsWith('❌')?'var(--rose-soft)':'var(--surface)'};color:{analyzeMsg.startsWith('✅')?'var(--emerald)':analyzeMsg.startsWith('❌')?'var(--rose)':'var(--muted)'}">{analyzeMsg}</div>{/if}
  </div>

  <!-- Document Preview -->
  {#if docHtml}
  <div class="card" style="margin-bottom:16px">
    <div class="card-head"><h3 class="card-title"><Icon name="file" size={14}/>Document Preview — {docName}</h3></div>
    <div class="card-body" style="max-height:300px;overflow-y:auto;font-size:12px;line-height:1.6">
      <style>
        .doc-preview table { width:100%;border-collapse:collapse;margin:10px 0 }
        .doc-preview th,.doc-preview td { border:1px solid var(--hairline);padding:6px 10px;font-size:11.5px;text-align:left }
        .doc-preview th { background:var(--surface-2);font-weight:600;font-size:10.5px }
        .doc-preview a { color:var(--accent) }
        .doc-preview h1,.doc-preview h2,.doc-preview h3 { font-size:14px;margin:12px 0 6px }
        .doc-preview p { margin:4px 0 }
        .doc-preview ul,.doc-preview ol { padding-left:18px;margin:4px 0 }
      </style>
      <div class="doc-preview">{@html docHtml}</div>
    </div>
  </div>
  {/if}

  <div style="border-top:1px solid var(--hairline);padding-top:12px"></div>

  <!-- Manual form fields -->
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">TITLE *</div><input class="input w-full" placeholder="What do you need?" bind:value={d.title}/></div>
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">DESCRIPTION</div><textarea class="input w-full" rows="3" style="height:auto;padding:10px;resize:vertical" placeholder="Full details, specs..." bind:value={d.description}></textarea></div>
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">YOUR NAME</div><input class="input w-full" bind:value={d.requested_by_name}/></div>
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">YOUR EMAIL</div><input class="input w-full" bind:value={d.requested_by_email}/></div>
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">NEED BY</div><input class="input mono" type="date" bind:value={d.required_by_date} style="width:180px"/></div>
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">BUDGET ₹</div><input class="input mono" type="number" bind:value={d.allocated_budget} style="width:180px" placeholder="0"/></div>
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">PRIORITY</div><select class="input" bind:value={d.priority}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
  <div style="display:grid;grid-template-columns:140px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid var(--hairline)"><div class="xs muted mono" style="padding-top:6px">LOCATION</div><input class="input w-full" placeholder="Campus, venue..." bind:value={d.delivery_location}/></div>

  <!-- Line Items -->
  <div class="section-head" style="margin-top:16px"><h3>Items</h3><div class="line"></div><span class="mono small">₹{total.toLocaleString('en-IN')}</span></div>
  {#each items as it, idx}
    <div style="padding:8px 0;border-bottom:1px solid var(--hairline)">
      <div class="h gap-8">
        <span class="badge" data-tone="slate">{String(idx+1).padStart(2,'0')}</span>
        <input class="input" placeholder="Item description" bind:value={it.description} style="flex:2"/>
        <select class="input" bind:value={it.item_type}>{#each ['General','T-shirt','Banner','Trophy','Stationery','Tent','Hoodie','Mug','Equipment','Service','Printing','ID Cards','Sports','Awards'] as t}<option>{t}</option>{/each}</select>
        <input class="input mono" type="number" placeholder="Qty" bind:value={it.quantity} style="width:60px"/>
        <input class="input mono" type="number" placeholder="₹ Unit" bind:value={it.unit_price} style="width:80px"/>
        {#if items.length>1}<button class="icon-btn" onclick={() => items=items.filter((_,i)=>i!==idx)}><Icon name="trash" size={14}/></button>{/if}
      </div>
      {#if it.link}
        <div class="h gap-6" style="margin-top:4px;margin-left:42px"><Icon name="arrow" size={11}/><a href={it.link} target="_blank" class="xs" style="color:var(--accent)">{it.link.slice(0,60)}...</a></div>
      {/if}
    </div>
  {/each}
  <button class="btn" style="margin-top:10px" onclick={() => items=[...items,{id:Date.now(),item_type:'General',description:'',quantity:1,unit_price:0,link:''}]}><Icon name="plus" size={12}/>Add item</button>
</div>

{:else if step===2}
<div class="card-body" style="padding:20px">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
    {#each [['Title',d.title||'—'],['Requester',d.requested_by_name||'—'],['Need by',d.required_by_date||'—'],['Budget',`₹${(d.allocated_budget||total).toLocaleString('en-IN')}`],['Priority',d.priority],['Location',d.delivery_location||'—']] as [k,v]}
      <div class="v gap-4" style="padding:10px;background:var(--surface-2);border-radius:6px"><span class="xs muted mono">{k.toUpperCase()}</span><span class="small" style="font-weight:500">{v}</span></div>
    {/each}
  </div>
  {#if items.filter(i => i.description).length > 0}
  <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">ITEMS ({items.filter(i => i.description).length})</div>
  {#each items.filter(i => i.description) as it, idx}
    <div class="h between" style="padding:6px 0;border-bottom:1px solid var(--hairline);font-size:12.5px">
      <div class="h gap-8"><span class="badge mono">{String(idx+1).padStart(2,'0')}</span><span style="font-weight:500">{it.description}</span></div>
      <span class="mono">₹{(it.quantity * it.unit_price).toLocaleString('en-IN')}</span>
    </div>
  {/each}
  {/if}
  {#if docName}<div class="h gap-8" style="margin-top:12px"><Icon name="file" size={14}/><span class="xs">Attached: {docName}</span></div>{/if}
  <div style="background:var(--amber-soft);border:1px solid var(--amber);border-radius:8px;padding:12px;font-size:12px;color:var(--amber);margin-top:14px">
    <strong>Approval flow:</strong> L1 approver → L2 approvers → procurement executor
  </div>
</div>

{:else}
<div class="card-body center v gap-12" style="padding:60px 20px;text-align:center">
  <div style="width:48px;height:48px;border-radius:50%;background:var(--amber-soft);display:grid;place-items:center;color:var(--amber)"><Icon name="send" size={22}/></div>
  <h3 style="font-size:18px;font-weight:600;margin:0">Sent for L1 Approval</h3>
  <div class="muted small" style="max-width:380px">The L1 approver has been emailed. You'll be notified when approved or rejected.</div>
  <div class="h gap-8"><button class="btn" onclick={() => goto('/my-requests')}>View My Requests</button><button class="btn" onclick={() => goto('/control-center')}>Dashboard</button></div>
</div>
{/if}
</div>

<!-- Sidebar -->
<div class="v gap-12">
  <div class="card"><div class="card-head"><h3 class="card-title">Summary</h3></div><div class="card-body v gap-10">
    <div class="h between"><span class="xs muted mono">ITEMS</span><span class="mono">{items.filter(i=>i.description).length}</span></div>
    <div class="h between"><span class="xs muted mono">TOTAL</span><span class="mono" style="font-size:16px;font-weight:600">₹{(d.allocated_budget||total).toLocaleString('en-IN')}</span></div>
    {#if docName}<div class="h gap-6 xs muted"><Icon name="file" size={11}/>{docName}</div>{/if}
  </div></div>
  <div class="card"><div class="card-head"><h3 class="card-title">Approval Chain</h3></div><div class="card-body v gap-8" style="font-size:12px">
    <div class="h gap-8"><span style="width:8px;height:8px;border-radius:50%;background:var(--emerald)"></span><span>You raise request</span></div>
    <div class="h gap-8"><span style="width:8px;height:8px;border-radius:50%;background:var(--amber)"></span><span>L1: Approver</span></div>
    <div class="h gap-8"><span style="width:8px;height:8px;border-radius:50%;background:var(--amber)"></span><span>L2: Approvers</span></div>
    <div class="h gap-8"><span style="width:8px;height:8px;border-radius:50%;background:var(--muted-3)"></span><span>Procurement executes</span></div>
  </div></div>
</div>
</div>

{#if step<3}
<div class="h between" style="margin-top:20px">
  <button class="btn" disabled={step===1} onclick={() => step--}>&larr; Back</button>
  <div class="xs muted mono">STEP {step} OF 3</div>
  {#if step===1}<button class="btn primary" onclick={() => step=2} disabled={!d.title}>Review &rarr;</button>
  {:else}<button class="btn accent" onclick={handleSubmit} disabled={saving}>{saving ? 'Submitting...' : 'Submit for Approval'}</button>{/if}
</div>
{/if}
