import Link from 'next/link'
import type { Project } from '@/data/types'
import FieldTag from './FieldTag'

export default function ProjectCard({ project }: { project: Project }) {
  const { metric, stats } = project

  const improvement =
    metric.direction === 'higher'
      ? ((metric.current_best - metric.baseline) / metric.baseline) * 100
      : ((metric.baseline - metric.current_best) / metric.baseline) * 100

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block rounded-xl border border-sand-dark bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        <FieldTag field={project.field} color={project.field_color} />
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          project.compute_tier === 'cpu'
            ? 'bg-sage/20 text-sage'
            : project.compute_tier === 'single-gpu'
              ? 'bg-amber/20 text-amber'
              : 'bg-coral/20 text-coral'
        }`}>
          {project.compute_tier === 'cpu' ? 'CPU' : project.compute_tier === 'single-gpu' ? 'GPU' : 'Multi-GPU'}
        </span>
      </div>

      <h3 className="mt-2 text-lg font-semibold text-charcoal">
        {project.name}
      </h3>

      <p className="mt-1 line-clamp-2 text-sm text-charcoal-light">
        {project.description}
      </p>

      {/* Metric */}
      <div className="mt-4">
        <span className="text-sm font-medium text-charcoal">
          {metric.current_best.toLocaleString()} {metric.unit}
        </span>
        {improvement > 0 ? (
          <span className="ml-2 text-sm font-medium text-sage">
            &uarr; {improvement.toFixed(1)}% improvement
          </span>
        ) : (
          <span className="ml-2 text-sm text-charcoal-light">baseline</span>
        )}
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-center justify-between border-t border-sand-dark pt-3">
        <span className="flex items-center gap-1.5 text-xs text-charcoal">
          <span className="inline-block h-2 w-2 rounded-full bg-sage" />
          {stats.active_agents} agents active
        </span>
        <span className="text-xs text-charcoal-light">
          {stats.total_experiments.toLocaleString()} experiments
        </span>
      </div>
    </Link>
  )
}
