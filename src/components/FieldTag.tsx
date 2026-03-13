const colorMap: Record<string, string> = {
  coral: 'bg-coral/15 text-coral',
  sage: 'bg-sage/15 text-sage',
  sky: 'bg-sky/15 text-sky',
  lavender: 'bg-lavender/15 text-lavender',
  amber: 'bg-amber/15 text-amber',
  peach: 'bg-peach/15 text-peach',
}

export default function FieldTag({
  field,
  color,
}: {
  field: string
  color: string
}) {
  const classes = colorMap[color] ?? 'bg-sand-dark text-charcoal-light'

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${classes}`}>
      {field}
    </span>
  )
}
