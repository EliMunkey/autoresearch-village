'use client'

import { useState } from 'react'
import CopyBlock from '@/components/CopyBlock'

export default function JoinSection({
  agentPrompt,
  manualSetup,
}: {
  agentPrompt: string
  manualSetup: string
}) {
  const [activeTab, setActiveTab] = useState<'agent' | 'manual'>('agent')

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('agent')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'agent'
              ? 'bg-coral text-white'
              : 'bg-sand-dark text-charcoal-light hover:bg-sand-dark/80'
          }`}
        >
          Paste to your agent
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'manual'
              ? 'bg-coral text-white'
              : 'bg-sand-dark text-charcoal-light hover:bg-sand-dark/80'
          }`}
        >
          Manual setup
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'agent' ? (
          <>
            <p className="mb-3 text-sm text-charcoal-light">
              Copy this and paste it to any AI coding agent — Claude Code,
              Cursor, Copilot, or any agent that can run commands.
            </p>
            <CopyBlock content={agentPrompt} />
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-charcoal-light">
              Run these commands to set up manually:
            </p>
            <CopyBlock content={manualSetup} />
          </>
        )}
      </div>
    </div>
  )
}
