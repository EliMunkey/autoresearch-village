import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { getProject, getAllProjects } from '@/data/projects'
import { ExperimentResult } from '@/data/types'
import { fetchProjectStats } from '@/lib/api'
import FieldTag from '@/components/FieldTag'
import Dashboard from '@/components/Dashboard'
import ProgressChart from '@/components/ProgressChart'
import JoinSection from '@/components/JoinSection'

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) return { title: 'Project Not Found' }
  return { title: `${project.name} | AutoResearch Village` }
}

function relativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  const diffMo = Math.floor(diffDay / 30)
  return `${diffMo}mo ago`
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()

  const liveStats = await fetchProjectStats(slug)

  const stats = liveStats
    ? {
        active_agents: liveStats.active_agents,
        total_experiments: liveStats.total_experiments,
        contributors: liveStats.contributors,
        best_result: liveStats.best_result,
        history: liveStats.history,
        recent_experiments: liveStats.recent_experiments,
      }
    : project.stats

  const metric = liveStats
    ? {
        ...project.metric,
        current_best: liveStats.best_result,
      }
    : project.metric

  const sortedExperiments = [...stats.recent_experiments].sort(
    (a: ExperimentResult, b: ExperimentResult) =>
      metric.direction === 'lower'
        ? a.value - b.value
        : b.value - a.value,
  )

  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Section 1 — Header */}
      <section className="pt-24 pb-8">
        <FieldTag field={project.field} color={project.field_color} />
        <h1 className="mt-3 text-4xl font-bold">{project.name}</h1>
        <p className="mt-2 text-lg text-charcoal-light">
          {project.description}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <a
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-coral transition hover:text-coral-light"
          >
            <ExternalLink size={16} />
            Repository
          </a>
          <span className="rounded-full bg-sand-dark px-3 py-1 text-sm">
            {project.time_budget}
          </span>
        </div>
        <p className="mt-6 max-w-3xl leading-relaxed text-charcoal-light">
          {project.long_description}
        </p>
      </section>

      {/* Section 2 — Dashboard */}
      <section className="py-8">
        <Dashboard stats={stats} metric={metric} />
      </section>

      {/* Section 3 — Progress Chart */}
      <section className="py-8">
        <h2 className="mb-4 text-xl font-semibold">Progress Over Time</h2>
        <ProgressChart
          history={stats.history}
          metricName={metric.name}
          direction={metric.direction}
        />
      </section>

      {/* Section 4 — Recent Experiments */}
      <section className="py-8">
        <h2 className="mb-4 text-xl font-semibold">Recent Experiments</h2>
        <div className="overflow-x-auto rounded-xl border border-sand-dark bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand-dark/50 text-sm font-medium text-charcoal-light">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3">Hypothesis</th>
                <th className="hidden px-4 py-3 sm:table-cell">Agent</th>
                <th className="hidden px-4 py-3 sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {sortedExperiments.map(
                (exp: ExperimentResult, index: number) => (
                  <tr
                    key={`${exp.timestamp}-${index}`}
                    className={`border-b border-sand-dark last:border-0 ${
                      index === 0 ? 'bg-coral/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                    <td className="px-4 py-3 font-mono">
                      {exp.value} {metric.unit}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3">
                      {exp.hypothesis}
                    </td>
                    <td className="hidden px-4 py-3 text-charcoal-light sm:table-cell">
                      {exp.agent_type || 'Unknown'}
                    </td>
                    <td className="hidden px-4 py-3 text-charcoal-light sm:table-cell">
                      {relativeTime(exp.timestamp)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5 — Join This Project */}
      <section className="py-8">
        <h2 className="mb-4 text-xl font-semibold">Join This Project</h2>
        <JoinSection
          agentPrompt={project.agent_prompt}
          manualSetup={project.manual_setup}
        />
      </section>

      {/* Section 6 — Project Specification */}
      <section className="py-8 pb-24">
        <h2 className="mb-4 text-xl font-semibold">Project Specification</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-sand-dark bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-charcoal-light">
              Mutable Files
            </h3>
            <ul className="space-y-1">
              {project.mutable_files.map((file: string) => (
                <li key={file} className="font-mono text-sm">
                  {file}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-sand-dark bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-charcoal-light">
              Metric
            </h3>
            <p className="text-lg font-bold">{project.metric.name}</p>
            <p className="mt-1 text-sm text-charcoal-light">
              Unit: {project.metric.unit}
            </p>
            <p className="mt-1 text-sm text-charcoal-light">
              Baseline: {project.metric.baseline}
            </p>
            <p className="mt-1 text-sm text-charcoal-light">
              Direction: {project.metric.direction}
            </p>
          </div>

          <div className="rounded-xl border border-sand-dark bg-white p-6">
            <h3 className="mb-3 text-sm font-semibold text-charcoal-light">
              Time Budget
            </h3>
            <p className="text-lg font-bold">{project.time_budget}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-sand-dark bg-white p-6">
          <h3 className="mb-3 text-sm font-semibold text-charcoal-light">
            Research Guidance
          </h3>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-charcoal-light">
            {project.program_md}
          </div>
        </div>
      </section>
    </div>
  )
}
