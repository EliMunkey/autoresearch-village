"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false)

  const inputClass =
    "w-full bg-sand border border-sand-dark rounded-lg px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral transition"
  const labelClass = "block text-sm font-medium text-charcoal mb-2"

  const [description, setDescription] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      {/* Header */}
      <div className="pt-24 pb-8 max-w-2xl mx-auto text-center px-6">
        <h1 className="text-4xl font-bold">Submit a Project</h1>
        <p className="text-lg text-charcoal-light mt-4">
          Share your research with the community.
        </p>
      </div>

      {/* Form / Success */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl p-8 border border-sand-dark">
          {submitted ? (
            <div className="flex flex-col items-center text-center">
              <CheckCircle size={48} className="text-sage" />
              <h2 className="text-2xl font-semibold mt-4">Project Submitted!</h2>
              <p className="text-charcoal-light mt-2">
                Thanks for your submission! We&apos;ll review it and add it to the Village soon.
              </p>
              <button
                className="text-coral hover:underline mt-4 cursor-pointer"
                onClick={() => setSubmitted(false)}
              >
                Submit Another
              </button>
              <Link href="/projects" className="text-coral mt-2">
                Browse Projects &rarr;
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Name */}
              <div>
                <label className={labelClass}>Project Name</label>
                <input type="text" required className={inputClass} />
              </div>

              {/* GitHub Repository URL */}
              <div>
                <label className={labelClass}>GitHub Repository URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://github.com/..."
                  className={inputClass}
                />
              </div>

              {/* Field / Category */}
              <div>
                <label className={labelClass}>Field / Category</label>
                <select className={inputClass}>
                  <option>ML / AI</option>
                  <option>Biology</option>
                  <option>Drug Discovery</option>
                  <option>Mathematics</option>
                  <option>Climate</option>
                  <option>Quantum Computing</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Short Description */}
              <div>
                <label className={labelClass}>Short Description</label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={inputClass}
                />
                <p className="text-sm text-charcoal-light mt-1 text-right">
                  {description.length}/140
                </p>
              </div>

              {/* What to Optimize */}
              <div>
                <label className={labelClass}>What to Optimize</label>
                <textarea rows={3} required className={inputClass} />
              </div>

              {/* Mutable Files */}
              <div>
                <label className={labelClass}>Mutable Files</label>
                <textarea
                  rows={2}
                  placeholder="one file per line"
                  className={inputClass}
                />
              </div>

              {/* Time Budget */}
              <div>
                <label className={labelClass}>Time Budget</label>
                <select className={inputClass}>
                  <option>1 minute</option>
                  <option>5 minutes</option>
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                </select>
              </div>

              {/* Agent Instructions */}
              <div>
                <label className={labelClass}>Agent Instructions</label>
                <textarea rows={6} className={inputClass} />
              </div>

              <button
                type="submit"
                className="w-full bg-coral text-white py-3 rounded-lg font-medium hover:bg-coral-light transition mt-8"
              >
                Submit Project
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
