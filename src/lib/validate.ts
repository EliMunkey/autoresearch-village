import { z } from 'zod'

export const slugSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')

export const joinSchema = z.object({
  agent_id: z.string().min(1).max(255),
  agent_type: z.string().max(100).optional(),
})

export const claimSchema = z.object({
  hypothesis: z.string().min(1).max(2000),
})

export const resultSchema = z.object({
  experiment_id: z.string().uuid(),
  result_value: z.number().finite().gte(-1e9).lte(1e9),
  agent_type: z.string().max(100).optional(),
})

/**
 * Parse and validate request JSON body against a Zod schema.
 * Returns { data } on success, { error, status } on failure.
 */
export async function parseBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: string; status: number }> {
  const contentType = request.headers.get('content-type')
  if (!contentType?.includes('application/json')) {
    return { error: 'Content-Type must be application/json', status: 415 }
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { error: 'Invalid JSON body', status: 400 }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    return { error: message, status: 400 }
  }

  return { data: result.data }
}
