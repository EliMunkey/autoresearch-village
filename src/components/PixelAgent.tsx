'use client'

import { useState, useEffect } from 'react'

// Pixel scientist: lab coat (3), goggles (2), body (1)
const PIXEL_MAP = [
  [0, 0, 0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 2, 2, 1, 2, 2, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0, 0],
  [0, 3, 3, 1, 1, 1, 3, 3, 0],
  [0, 3, 3, 3, 3, 3, 3, 3, 0],
  [0, 3, 3, 0, 3, 0, 3, 3, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 0, 0, 0, 1, 1, 0],
]

const SIZES = { sm: 4, md: 6, lg: 8 } as const

export default function PixelAgent({
  size = 'md',
  message,
}: {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}) {
  const px = SIZES[size]
  const cols = PIXEL_MAP[0].length
  const [blinking, setBlinking] = useState(false)

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const interval = setInterval(() => {
      setBlinking(true)
      timeoutId = setTimeout(() => setBlinking(false), 150)
    }, 3500)
    return () => {
      clearInterval(interval)
      clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="animate-float"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${px}px)`,
        }}
      >
        {PIXEL_MAP.flat().map((cell, i) => (
          <div
            key={i}
            style={{
              width: px,
              height: px,
              backgroundColor:
                cell === 2
                  ? blinking
                    ? 'var(--color-sage)'
                    : 'var(--color-charcoal)'
                  : cell === 3
                    ? 'white'
                    : cell === 1
                      ? 'var(--color-coral)'
                      : 'transparent',
              borderRadius: cell > 0 ? 1 : 0,
              transition: 'background-color 0.08s',
            }}
          />
        ))}
      </div>
      {message && (
        <p className="text-sm text-charcoal-light">{message}</p>
      )}
    </div>
  )
}
