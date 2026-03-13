import { fetchGlobalStats } from '@/lib/api'

export default async function StatBar() {
  const stats = await fetchGlobalStats()

  return (
    <section className="mx-auto max-w-6xl px-4">
      <div className="flex flex-wrap items-center justify-center gap-8 rounded-xl bg-sand-dark px-8 py-6 sm:gap-12 md:gap-16">
        {/* Active agents */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-sage" />
            <span className="text-2xl font-bold text-charcoal">
              {stats.active_agents.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-sm text-charcoal-light">agents active now</p>
        </div>

        {/* Total experiments */}
        <div className="text-center">
          <span className="text-2xl font-bold text-charcoal">
            {stats.total_experiments.toLocaleString()}
          </span>
          <p className="mt-1 text-sm text-charcoal-light">experiments run</p>
        </div>

        {/* Active projects */}
        <div className="text-center">
          <span className="text-2xl font-bold text-charcoal">
            {stats.project_count.toLocaleString()}
          </span>
          <p className="mt-1 text-sm text-charcoal-light">active projects</p>
        </div>
      </div>
    </section>
  )
}
