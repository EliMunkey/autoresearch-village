'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyBlock({
  content,
  label,
}: {
  content: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-lg bg-charcoal p-4">
      {label && (
        <p className="mb-2 text-xs font-medium text-sand/60">{label}</p>
      )}
      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm text-sand/90">
        {content}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 rounded p-1 text-sand/60 transition hover:text-sand"
        aria-label="Copy to clipboard"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  )
}
