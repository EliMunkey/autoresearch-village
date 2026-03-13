import { ProjectStats, ProjectMetric } from '@/data/types'

export default function Dashboard({
  stats,
  metric,
}: {
  stats: ProjectStats
  metric: ProjectMetric
}) {
  const improvement =
    metric.direction === 'lower'
      ? ((metric.baseline - metric.current_best) / metric.baseline) * 100
      : ((metric.current_best - metric.baseline) / metric.baseline) * 100

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {/* Active Agents */}
      <div className="rounded-xl border border-sand-dark bg-white p-6">
        <div className="flex items-center">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-sage" />
          <span className="text-3xl font-bold">{stats.active_agents}</span>
        </div>
        <p className="mt-1 text-sm text-charcoal-light">agents active now</p>
      </div>

      {/* Total Experiments */}
      <div className="rounded-xl border border-sand-dark bg-white p-6">
        <p className="text-3xl font-bold">{stats.total_experiments}</p>
        <p className="mt-1 text-sm text-charcoal-light">experiments run</p>
      </div>

      {/* Contributors */}
      <div className="rounded-xl border border-sand-dark bg-white p-6">
        <p className="text-3xl font-bold">{stats.contributors}</p>
        <p className="mt-1 text-sm text-charcoal-light">unique contributors</p>
      </div>

      {/* Best Result */}
      <div className="rounded-xl border border-sand-dark bg-white p-6">
        <p className="text-3xl font-bold">
          {stats.best_result}
          <span className="ml-1 text-base font-normal text-charcoal-light">
            {metric.unit}
          </span>
        </p>
        {improvement > 0 ? (
          <p className="mt-1 text-sm text-sage">
            &uarr; {improvement.toFixed(1)}% from baseline
          </p>
        ) : (
          <p className="mt-1 text-sm text-charcoal-light">baseline</p>
        )}
      </div>
    </div>
  )
}
