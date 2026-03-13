# AutoResearch Village Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a beautiful, Anthropic-styled community platform for discovering and contributing AI agents to open research projects.

**Architecture:** Next.js App Router with static data (JSON). All pages server-rendered. Mock dashboard stats with realistic data. Deployed to Vercel.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 4, Recharts, TypeScript, Vercel

**Design Reference:** Anthropic's visual language — warm cream/sand backgrounds (#FAF9F6), deep charcoal text (#1a1a1a), coral/orange accents (#E07A5F), Inter font, generous whitespace, card-based UI.

**IMPORTANT:** Use the `frontend-design` skill when building each page component. Every page should feel distinctly designed — not generic, not template-like. Anthropic-quality.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `public/` directory

**Step 1: Initialize Next.js project**

Run from `/Users/eliasmunk/Projects/AutoReseach Village`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Accept defaults. If prompted about existing `docs/` folder, continue.

**Step 2: Install dependencies**

```bash
npm install recharts lucide-react
```

**Step 3: Configure Tailwind for Anthropic palette**

Update `src/app/globals.css` with custom CSS variables:
- `--color-sand`: #FAF9F6
- `--color-sand-dark`: #F0EDE8
- `--color-charcoal`: #1A1A1A
- `--color-charcoal-light`: #4A4A4A
- `--color-coral`: #E07A5F
- `--color-coral-light`: #F4A483
- `--color-sage`: #6B8F71
- `--color-sky`: #5B8BA0

Body should use `--color-sand` background and `--color-charcoal` text. Font: Inter from Google Fonts.

**Step 4: Set up base layout**

`src/app/layout.tsx`: Import Inter from `next/font/google`. Set metadata title "AutoResearch Village" and description. Apply font and background color classes to body.

**Step 5: Verify it runs**

```bash
npm run dev
```

Expected: App runs on localhost:3000 with cream background.

**Step 6: Initialize git and commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind and Anthropic palette"
```

---

### Task 2: Data Layer — Seed Projects & Types

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/projects.ts`

**Step 1: Define TypeScript types**

`src/data/types.ts`:
```typescript
export interface ProjectMetric {
  name: string
  unit: string
  baseline: number
  current_best: number
  direction: 'lower' | 'higher'
}

export interface ExperimentResult {
  timestamp: string
  value: number
  hypothesis: string
  agent_type?: string
}

export interface ProjectStats {
  active_agents: number
  total_experiments: number
  contributors: number
  best_result: number
  history: { timestamp: string; value: number }[]
  recent_experiments: ExperimentResult[]
}

export interface Project {
  name: string
  slug: string
  field: string
  field_color: string
  description: string
  long_description: string
  repo_url: string
  metric: ProjectMetric
  mutable_files: string[]
  time_budget: string
  program_md: string
  agent_prompt: string
  manual_setup: string
  stats: ProjectStats
}
```

**Step 2: Create seed project data**

`src/data/projects.ts`: Export an array of 5 `Project` objects with realistic mock data:

1. **autoresearch-at-home** (ML/AI) — val_bpb, baseline 1.12, best 1.08, 23 active agents, 1,847 experiments
2. **ReProver** (Theorem Proving) — miniF2F pass rate, baseline 57.6%, best 62.3%, 8 active agents, 423 experiments
3. **GNINA** (Drug Discovery) — docking success rate, baseline 73%, best 78.4%, 12 active agents, 956 experiments
4. **OpenFold** (Protein Folding) — lDDT-Ca, baseline 0.902, best 0.921, 15 active agents, 634 experiments
5. **NeuralGCM** (Climate/Weather) — 5-day forecast RMSE, baseline 3.2K, best 2.8K, 6 active agents, 287 experiments

Each project needs:
- Realistic `history` array (20-30 data points over ~2 weeks showing gradual improvement)
- 5-10 `recent_experiments` with hypothesis descriptions
- `agent_prompt` — a natural language prompt someone can paste to their agent
- `manual_setup` — shell commands for manual setup
- `program_md` — research guidance for agents
- `field_color` — a Tailwind-compatible color class per field

**Step 3: Create helper functions**

Add to `src/data/projects.ts`:
- `getProject(slug: string): Project | undefined`
- `getAllProjects(): Project[]`
- `getGlobalStats(): { active_agents, total_experiments, project_count }`
- `getFeaturedProjects(): Project[]` (returns top 4 by active agents)

**Step 4: Commit**

```bash
git add src/data/
git commit -m "feat: add project types and seed data for 5 research projects"
```

---

### Task 3: Shared Components — Navigation & Footer

**Files:**
- Create: `src/components/Nav.tsx`
- Create: `src/components/Footer.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Build navigation**

`src/components/Nav.tsx`: Clean top nav with:
- Logo/wordmark "AutoResearch Village" on left (text, no image needed)
- Links: Projects, How to Join, Submit a Project
- Mobile-responsive (hamburger on small screens)
- Sticky, with subtle backdrop blur on scroll
- Use Anthropic styling: clean, minimal

**Step 2: Build footer**

`src/components/Footer.tsx`:
- Three columns: About (short description), Links (same as nav), Community (GitHub link)
- "Built for the research community" tagline
- Warm, simple

**Step 3: Integrate into layout**

Update `src/app/layout.tsx` to include Nav and Footer wrapping `{children}`.

**Step 4: Verify and commit**

```bash
npm run dev
```
Check nav and footer render. Then:
```bash
git add src/components/ src/app/layout.tsx
git commit -m "feat: add navigation and footer components"
```

---

### Task 4: Shared Components — Stats & Cards

**Files:**
- Create: `src/components/StatBar.tsx`
- Create: `src/components/ProjectCard.tsx`
- Create: `src/components/FieldTag.tsx`

**Step 1: Build global stats bar**

`src/components/StatBar.tsx`: Horizontal bar showing 3 stats:
- Active agents (with subtle pulse dot)
- Total experiments
- Active projects
- Warm background, large numbers, small labels below

**Step 2: Build field tag**

`src/components/FieldTag.tsx`: Small colored pill badge for field names (ML/AI, Biology, etc.) Each field gets a distinct earth-tone color.

**Step 3: Build project card**

`src/components/ProjectCard.tsx`: Card for catalog/homepage:
- Field tag top-left
- Project name (large)
- One-line description
- Metric: "current_best (↑X% from baseline)" or similar
- Bottom row: active agents count, total experiments
- Hover: subtle lift shadow
- Links to `/projects/[slug]`

**Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add stat bar, project card, and field tag components"
```

---

### Task 5: Homepage

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/HowItWorks.tsx`

**Step 1: Build the homepage**

USE THE `frontend-design` SKILL for this page. It should feel like an Anthropic product page.

`src/app/page.tsx` sections:
1. **Hero**: Large heading "Accelerate science with your AI agent". Subtitle: "Join a global community where AI agents collaborate on open research — from protein folding to theorem proving." CTA button: "Browse Projects" → /projects. Secondary: "Learn How" → /how-to-join
2. **Global stats bar** (StatBar component)
3. **Featured projects** (4 ProjectCards in a grid)
4. **How it works** section: 3 steps with icons from lucide-react
   - Step 1: "Browse" — Find a project that excites you
   - Step 2: "Copy" — Get the setup prompt for your agent
   - Step 3: "Contribute" — Your agent runs experiments and shares results
5. **Call to action**: "Your agent can help fold proteins tonight." with button to /projects

**Step 2: Verify and commit**

```bash
npm run dev
```
Check homepage renders beautifully at desktop and mobile widths.
```bash
git add src/app/page.tsx src/components/HowItWorks.tsx
git commit -m "feat: build homepage with hero, stats, featured projects, and how-it-works"
```

---

### Task 6: Project Catalog Page

**Files:**
- Create: `src/app/projects/page.tsx`
- Create: `src/components/ProjectFilters.tsx`

**Step 1: Build the catalog page**

USE THE `frontend-design` SKILL.

`src/app/projects/page.tsx`:
- Page header: "Projects" with subtitle "Find research to accelerate"
- Filter bar: clickable field tags (All, ML/AI, Biology, Drug Discovery, Math, Climate, Quantum) — client component for interactivity
- Search input (filters by name/description, client-side)
- Sort dropdown: Most Active, Newest, Most Improved
- Grid of ProjectCards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- All filtering/sorting happens client-side since data is static

**Step 2: Commit**

```bash
git add src/app/projects/
git commit -m "feat: build project catalog with filtering, search, and sorting"
```

---

### Task 7: Project Detail Page — Header & Dashboard

**Files:**
- Create: `src/app/projects/[slug]/page.tsx`
- Create: `src/components/Dashboard.tsx`
- Create: `src/components/ProgressChart.tsx`

**Step 1: Build project detail page**

USE THE `frontend-design` SKILL.

`src/app/projects/[slug]/page.tsx` — uses `generateStaticParams` from project slugs.

Top section:
- Field tag + project name (large heading)
- One-line description
- Repo link (external, with icon)
- Long description paragraph

**Step 2: Build dashboard component**

`src/components/Dashboard.tsx`: Grid of 4 stat cards:
- Active agents (big number + green pulse dot)
- Total experiments (big number)
- Contributors (big number)
- Best result vs baseline (big number + "↑X% improvement" in green or coral)

Each card: cream background, subtle border, warm shadow.

**Step 3: Build progress chart**

`src/components/ProgressChart.tsx`: Recharts line chart showing metric value over time.
- Clean, minimal styling matching Anthropic aesthetic
- Coral line color
- Subtle grid, no chartjunk
- Tooltip showing value and date
- Y-axis labeled with metric name

**Step 4: Commit**

```bash
git add src/app/projects/ src/components/Dashboard.tsx src/components/ProgressChart.tsx
git commit -m "feat: build project detail page with live dashboard and progress chart"
```

---

### Task 8: Project Detail Page — Leaderboard & Join Section

**Files:**
- Create: `src/components/Leaderboard.tsx`
- Create: `src/components/JoinSection.tsx`
- Create: `src/components/CopyBlock.tsx`
- Modify: `src/app/projects/[slug]/page.tsx`

**Step 1: Build leaderboard**

`src/components/Leaderboard.tsx`: Table/list of recent experiments:
- Columns: Rank, Result value, Hypothesis, Time ago
- Top result highlighted
- Clean table styling, no heavy borders

**Step 2: Build copy block**

`src/components/CopyBlock.tsx`: A code block with a "Copy" button:
- Dark background (charcoal), monospace text
- Click to copy with visual feedback ("Copied!")
- Reusable for both agent prompt and manual setup

**Step 3: Build join section**

`src/components/JoinSection.tsx`: Two tabs: "Paste to your agent" and "Manual setup"
- Agent tab: the `agent_prompt` in a CopyBlock with intro text "Copy this and paste it to any AI coding agent (Claude Code, Cursor, Copilot, etc.)"
- Manual tab: the `manual_setup` in a CopyBlock with step-by-step shell commands

**Step 4: Add project spec section**

Below the join section on the detail page, show:
- Mutable files (list)
- Metric definition
- Time budget
- program.md content (in a styled block)

**Step 5: Commit**

```bash
git add src/components/ src/app/projects/
git commit -m "feat: add leaderboard, join section with copy-paste, and project spec"
```

---

### Task 9: How to Join Page

**Files:**
- Create: `src/app/how-to-join/page.tsx`

**Step 1: Build the page**

USE THE `frontend-design` SKILL.

`src/app/how-to-join/page.tsx`:

Sections:
1. **Hero**: "Join the Village" — "Contributing is simple. Pick a project, copy the prompt, let your agent do the rest."
2. **3-step guide** (expanded from homepage):
   - Step 1: Browse projects — screenshot/visual of catalog, link to /projects
   - Step 2: Copy the setup prompt — show example CopyBlock with a sample prompt
   - Step 3: Let your agent work — explain what happens (claims experiments, runs, reports back)
3. **What agents work?** — list of compatible agents: Claude Code, Cursor, GitHub Copilot, Aider, Devin, any agent that can run shell commands and edit files
4. **FAQ**:
   - "Do I need a GPU?" — Depends on the project. Some need GPU, some don't. Each project page specifies requirements.
   - "How does coordination work?" — Agents connect to a coordination API, claim experiments to avoid duplicates, publish results, and share discoveries.
   - "Can I watch my agent work?" — Yes! Your agent runs locally, you can watch it in your terminal.
   - "Is my code/data safe?" — Agents run on your machine. Nothing is uploaded except experiment results.
   - "How do I stop?" — Just stop your agent. Claimed experiments expire after 15 minutes.

**Step 2: Commit**

```bash
git add src/app/how-to-join/
git commit -m "feat: build how-to-join page with guide and FAQ"
```

---

### Task 10: Submit a Project Page

**Files:**
- Create: `src/app/submit/page.tsx`

**Step 1: Build the page**

USE THE `frontend-design` SKILL.

`src/app/submit/page.tsx`: Client component with form.

Form fields:
- Project name (text input)
- GitHub repo URL (url input)
- Field/category (select: ML/AI, Biology, Drug Discovery, Math, Climate, Quantum, Other)
- Short description (text input, max 140 chars)
- What to optimize — metric name and description (textarea)
- Mutable files — which files agents can modify (textarea)
- Time budget per experiment (select: 1m, 5m, 15m, 30m, 1h)
- Agent instructions (textarea — the program.md equivalent)

On submit: show a success modal/message: "Thanks for submitting! We'll review your project and add it to the Village soon." No actual backend call.

Styling: clean form with Anthropic aesthetics, labeled inputs, generous spacing.

**Step 2: Commit**

```bash
git add src/app/submit/
git commit -m "feat: build submit project page with form"
```

---

### Task 11: Polish & Responsive Design

**Files:**
- Modify: All page and component files as needed

**Step 1: Mobile responsiveness pass**

Check every page at 375px, 768px, and 1280px widths. Fix:
- Nav hamburger works on mobile
- Card grids stack on mobile
- Charts are readable on small screens
- Copy blocks don't overflow
- Form inputs are full-width on mobile

**Step 2: Visual polish**

- Consistent spacing across all pages
- Hover states on all interactive elements
- Focus states for accessibility
- Smooth page transitions
- Loading states where appropriate
- Ensure the pulse animation on active agent counts works

**Step 3: Metadata & SEO**

Add proper `metadata` exports to each page:
- Title: "Projects | AutoResearch Village", etc.
- Description: relevant per page
- OpenGraph image (can be a simple colored card for now)

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: responsive design, polish, and metadata"
```

---

### Task 12: Build & Deploy Verification

**Step 1: Production build**

```bash
npm run build
```

Expected: Build succeeds with no errors. Fix any TypeScript or build issues.

**Step 2: Test production build locally**

```bash
npm run start
```

Navigate through all pages, verify everything renders correctly.

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: resolve any build issues for production"
```

**Step 4: Deploy to Vercel (if user confirms)**

```bash
npx vercel
```

Follow prompts to link project and deploy.

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|-------------|
| 1 | Project scaffolding | None |
| 2 | Data layer — types & seed projects | Task 1 |
| 3 | Nav & Footer components | Task 1 |
| 4 | Stats, cards, field tag components | Tasks 2, 3 |
| 5 | Homepage | Task 4 |
| 6 | Project catalog page | Task 4 |
| 7 | Project detail — header & dashboard | Tasks 2, 4 |
| 8 | Project detail — leaderboard & join | Task 7 |
| 9 | How to Join page | Task 3 |
| 10 | Submit a Project page | Task 3 |
| 11 | Polish & responsive | Tasks 5-10 |
| 12 | Build & deploy | Task 11 |

**Parallelizable:** Tasks 5, 6, 9, 10 can run in parallel after Task 4. Tasks 7+8 are sequential.
