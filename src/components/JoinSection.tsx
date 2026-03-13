'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import CopyBlock from '@/components/CopyBlock'

export default function JoinSection({
  agentPrompt,
  manualSetup,
}: {
  agentPrompt: string
  manualSetup: string
}) {
  const [activeTab, setActiveTab] = useState<'agent' | 'manual'>('agent')
  const [copied, setCopied] = useState(false)

  async function handleCopyAgent() {
    setActiveTab('agent')
    try {
      await navigator.clipboard.writeText(agentPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Secure context required — user can use the copy icon in the block
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={handleCopyAgent}
          className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === 'agent'
              ? 'bg-coral text-white'
              : 'bg-sand-dark text-charcoal-light hover:bg-sand-dark/80'
          }`}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            'Copy and paste to your agent'
          )}
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
              Paste this to Claude Code, Cursor, Copilot, or any agent that
              can run commands.
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
