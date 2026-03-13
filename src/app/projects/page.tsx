'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { getAllProjects } from '@/data/projects'
import ProjectCard from '@/components/ProjectCard'

const FIELDS = ['All', 'ML / AI', 'Mathematics', 'Drug Discovery', 'Biology', 'Climate', 'Fun']

const allProjects = getAllProjects()

export default function ProjectsPage() {
  const [activeField, setActiveField] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = allProjects.filter((p) => {
    if (activeField !== 'All' && p.field !== activeField) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <>
      {/* Header */}
      <section className="mx-auto max-w-6xl px-6 pt-24 pb-8">
        <h1 className="text-4xl font-bold">Projects</h1>
        <p className="mt-2 text-lg text-charcoal-light">
          Find research to accelerate
        </p>
      </section>

      {/* Filter / Search */}
      <section className="mx-auto mt-8 max-w-6xl px-6">
        <div className="flex flex-wrap gap-2">
          {FIELDS.map((field) => (
            <button
              key={field}
              onClick={() => setActiveField(field)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                activeField === field
                  ? 'bg-coral text-white'
                  : 'bg-sand-dark text-charcoal-light hover:bg-sand-dark/80'
              }`}
            >
              {field}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-light" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-sand-dark bg-white px-4 py-2 pl-10 text-sm text-charcoal outline-none focus:border-coral focus:ring-1 focus:ring-coral"
          />
        </div>
      </section>

      {/* Project Grid */}
      <section className="mx-auto mt-8 max-w-6xl px-6 pb-16">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProjectCard project={p} key={p.slug} />
            ))}
          </div>
        ) : (
          <p className="py-24 text-center text-charcoal-light">
            No projects match your filters
          </p>
        )}
      </section>
    </>
  )
}
