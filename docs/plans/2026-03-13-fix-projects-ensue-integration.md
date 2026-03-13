# Fix Project Definitions & Ensue Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all 7 project definitions match their real GitHub repos, add compute tier labels, and integrate Ensue's public API for live autoresearch-at-home data.

**Architecture:** Three changes: (1) add `compute_tier` field to the Project type and tag each project, (2) fix mutable_files/metrics/setup in projects.ts to match real repos, (3) add `src/lib/ensue.ts` to fetch live data from Ensue's public JSON-RPC API for autoresearch-at-home, wired into the existing `fetchProjectStats` path.

**Tech Stack:** Next.js 16, TypeScript, Ensue public JSON-RPC API (`https://api.ensue-network.ai/public`)

---

### Task 1: Add compute_tier to Project type

**Files:**
- Modify: `src/data/types.ts`

**Step 1: Add compute_tier field to Project interface**

```typescript
// Add to Project interface, after field_color:
compute_tier: 'cpu' | 'single-gpu' | 'multi-gpu'
```

**Step 2: Verify build**

Run: `cd "/Users/eliasmunk/Projects/AutoReseach Village" && npx tsc --noEmit 2>&1 | head -20`
Expected: Type errors in projects.ts (missing compute_tier) — confirms the field is required.

---

### Task 2: Show compute tier badge on ProjectCard

**Files:**
- Modify: `src/components/ProjectCard.tsx`

**Step 1: Add tier badge next to FieldTag**

After the `<FieldTag>` line, add:

```tsx
<span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
  project.compute_tier === 'cpu'
    ? 'bg-sage/20 text-sage'
    : project.compute_tier === 'single-gpu'
      ? 'bg-amber/20 text-amber'
      : 'bg-coral/20 text-coral'
}`}>
  {project.compute_tier === 'cpu' ? 'CPU' : project.compute_tier === 'single-gpu' ? 'GPU' : 'Multi-GPU'}
</span>
```

---

### Task 3: Fix autoresearch-at-home project definition

**Files:**
- Modify: `src/data/projects.ts` (project 1, lines ~5-193)

**Changes:**
- Add `compute_tier: 'single-gpu'`
- Update `metric.current_best` from `1.037` to `0.9597` (real Ensue data)
- Update `metric.baseline` from `1.12` to `1.12` (keep — Karpathy's original baseline is correct)
- Update `stats` to reflect real numbers: `active_agents: 54`, `total_experiments: 1600`, `contributors: 54`, `best_result: 0.9597`
- Rewrite `agent_prompt` to point agents at the real repo setup (uv sync, Ensue registration via coordinator.py)
- Rewrite `manual_setup` to match real Quick Start (uv sync, register with Ensue, use coordinator.py)
- Add attribution: update `long_description` to credit Ensue and link to their dashboard
- Update `history` to reflect the real trajectory (from ~1.12 down to ~0.96)

**Key: the join flow should tell agents to use the real Ensue coordinator, not Village API endpoints.**

---

### Task 4: Fix ReProver project definition

**Files:**
- Modify: `src/data/projects.ts` (project 2, lines ~195-395)

**Changes:**
- Add `compute_tier: 'single-gpu'`
- Fix `mutable_files`: change `'prover/search.py'` to `'prover/proof_search.py'`
- Fix `metric.name`: change from `'miniF2F Pass Rate'` to `'LeanDojo Benchmark Pass Rate'` (the repo's actual benchmark)
- Update `agent_prompt` to reference correct file `prover/proof_search.py` instead of `prover/search.py`
- Update `agent_prompt` setup to use the repo's actual install process (no fabricated scripts)
- Update `manual_setup` to match real repo setup

---

### Task 5: Fix GNINA-Torch project definition

**Files:**
- Modify: `src/data/projects.ts` (project 3, lines ~396-593)

**Changes:**
- Add `compute_tier: 'single-gpu'`
- Keep `mutable_files` as-is (both `gninatorch/models.py` and `gninatorch/training.py` are correct)
- Fix `agent_prompt` setup: no `requirements.txt` (use `conda env create -f devtools/conda-envs/gninatorch.yaml` and `pip install -e .`), no `scripts/download_data.py` or `scripts/download_models.py` (these don't exist), training via `python -m gninatorch.training` not `python train.py`, evaluation via `python -m gninatorch.inference` not `python evaluate.py`
- Fix `manual_setup` to match real install process

---

### Task 6: Fix OpenFold project definition

**Files:**
- Modify: `src/data/projects.ts` (project 4, lines ~594-786)

**Changes:**
- Add `compute_tier: 'multi-gpu'`
- Keep `mutable_files` as-is (both `openfold/model/evoformer.py` and `openfold/model/model.py` are correct)
- Fix `agent_prompt` setup to reference real repo install (pip install, `scripts/` for downloads, `train_openfold.py` for training, `run_pretrained_openfold.py` for inference)
- Fix `manual_setup` to match

---

### Task 7: Fix NeuralGCM project definition

**Files:**
- Modify: `src/data/projects.ts` (project 5, lines ~786-980)

**Changes:**
- Add `compute_tier: 'multi-gpu'`
- Fix `mutable_files`: change `'neuralgcm/physics_parameterization.py'` (doesn't exist) to `['neuralgcm/experimental/atmosphere/parameterizations.py']` (the real file)
- Fix `agent_prompt` setup: no `requirements.txt` (uses `pyproject.toml` / `pip install -e .`), no `scripts/download_era5_subset.py` or `scripts/download_weights.py`, no `train.py` or `evaluate.py`
- Fix `manual_setup` to match
- Update `program_md` references to the correct file path

---

### Task 8: Fix Sunfish project definition

**Files:**
- Modify: `src/data/projects.ts` (project 6, lines ~980-1089)

**Changes:**
- Add `compute_tier: 'cpu'`
- Keep `mutable_files` as-is (`sunfish.py` is correct)
- Fix description: change "131 lines" to match README ("131 lines" is the README's claim, keep it)
- Fix `agent_prompt` benchmark commands: use `python -m tools.tester bench` and `python -m tools.tester best` (actual commands from repo)
- Note in setup that ELO estimation requires external `cutechess-cli` for engine-vs-engine matches

---

### Task 9: Fix Tetris AI project definition

**Files:**
- Modify: `src/data/projects.ts` (project 7, lines ~1089-1195)

**Changes:**
- Add `compute_tier: 'cpu'`
- Keep `mutable_files` as-is (both `dqn_agent.py` and `tetris.py` are correct)
- Fix `agent_prompt` to reference real repo files: `run.py` for training, `run_model.py` for evaluation, `requirements.txt` exists (correct)

---

### Task 10: Create Ensue API client

**Files:**
- Create: `src/lib/ensue.ts`

**Step 1: Write the Ensue public API client**

```typescript
const ENSUE_PUBLIC = 'https://api.ensue-network.ai/public'

interface EnsueRpcResponse {
  jsonrpc: string
  id: number
  result?: {
    content: { type: string; text: string }[]
  }
  error?: { code: number; message: string }
}

async function ensueRpc(method: string, args: Record<string, unknown>): Promise<unknown | null> {
  try {
    const res = await fetch(ENSUE_PUBLIC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: method, arguments: args },
        id: 1,
      }),
      next: { revalidate: 60 },
    })

    const raw = await res.text()
    const line = raw.startsWith('data: ') ? raw.slice(6) : raw
    const parsed: EnsueRpcResponse = JSON.parse(line.trim())
    if (parsed.error || !parsed.result) return null

    const text = parsed.result.content[0]?.text
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

export async function fetchEnsueStats() {
  // Fetch best metadata
  const bestData = await ensueRpc('public_get_memory', {
    path: 'autoresearch-at-home/best/metadata',
  }) as { value?: string } | null

  if (!bestData?.value) return null

  const best = JSON.parse(bestData.value)

  // Fetch recent results for experiment feed
  const recentKeys = await ensueRpc('public_list_keys', {
    path: 'autoresearch-at-home/results',
    limit: 20,
  }) as { keys?: { key_name: string; description: string; author_org_name: string; updated_at: number }[] } | null

  // Fetch agent bests for leaderboard/contributor count
  const agentKeys = await ensueRpc('public_list_keys', {
    path: 'autoresearch-at-home/best/agent',
    limit: 100,
  }) as { keys?: { key_name: string; author_org_name: string; size: number }[] } | null

  const contributors = agentKeys?.keys?.length ?? 0

  // Fetch active claims for active agent count
  const claimKeys = await ensueRpc('public_list_keys', {
    path: 'autoresearch-at-home/claims',
    limit: 100,
  }) as { keys?: { key_name: string; updated_at: number }[] } | null

  const fifteenMinAgo = Math.floor(Date.now() / 1000) - 900
  const activeClaims = claimKeys?.keys?.filter(k => k.updated_at > fifteenMinAgo) ?? []

  // Build recent experiments from result descriptions
  const recentExperiments = (recentKeys?.keys ?? []).map(k => {
    const valMatch = k.description.match(/val_bpb=([0-9.]+)/)
    return {
      timestamp: new Date(k.updated_at * 1000).toISOString(),
      value: valMatch ? parseFloat(valMatch[1]) : 0,
      hypothesis: k.description
        .replace(/\[autoresearch\] Result: /, '')
        .replace(/\[.*?SUCCESS\] /, '')
        .slice(0, 200),
      agent_type: k.author_org_name,
    }
  }).filter(e => e.value > 0)

  return {
    active_agents: activeClaims.length,
    total_experiments: recentKeys?.keys?.length ?? 0, // approximate from visible results
    contributors,
    best_result: best.val_bpb,
    best_agent: best.agent_id,
    best_description: best.description,
    history: [], // Ensue doesn't expose time-series; use mock history updated with real endpoint
    recent_experiments: recentExperiments,
  }
}
```

---

### Task 11: Wire Ensue stats into fetchProjectStats

**Files:**
- Modify: `src/lib/api.ts`

**Step 1: Import and use Ensue for autoresearch-at-home**

```typescript
import { fetchEnsueStats } from './ensue'

export async function fetchProjectStats(slug: string) {
  // For autoresearch-at-home, try Ensue API first
  if (slug === 'autoresearch-at-home') {
    const ensueStats = await fetchEnsueStats()
    if (ensueStats) return ensueStats
  }

  // Fall through to existing logic for other projects / Ensue failure
  if (!API_BASE) return getMockProjectStats(slug)
  // ... rest unchanged
}
```

---

### Task 12: Build, verify, commit, push

**Step 1: Run build**
Run: `cd "/Users/eliasmunk/Projects/AutoReseach Village" && npm run build`

**Step 2: Fix any type/build errors**

**Step 3: Commit all changes**
```bash
git add -A
git commit -m "fix: correct all project definitions to match real repos, add Ensue integration for autoresearch-at-home live data, add compute tier labels"
```

**Step 4: Push to main**
```bash
git push origin main
```
