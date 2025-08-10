
// --------------------------------
// file: src/server/index.ts
// --------------------------------
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect as nextRedirect } from 'next/navigation'
import { z } from 'zod'
import type { ActionResult, ActionContext, AnyZodObject } from '../types'
import { normalizeFieldErrors } from '../shared/normalizeFieldErrors';

let globalContext: Partial<ActionContext> = {}

export function init(context: Partial<ActionContext> = {}) {
  globalContext = { ...globalContext, ...context }
  return globalContext
}

function fdToObject(formData: FormData): Record<string, any> {
  const obj: Record<string, any> = {}
  for (const [key, value] of formData.entries()) {
    if (key.endsWith('[]')) {
      const k = key.slice(0, -2)
      obj[k] = Array.isArray(obj[k]) ? [...obj[k], value] : [value]
      continue
    }
    if (key in obj) {
      const prev = obj[key]
      obj[key] = Array.isArray(prev) ? [...prev, value] : [prev, value]
      continue
    }
    if (typeof value === 'string' && ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']')))) {
      try { obj[key] = JSON.parse(value) } catch { obj[key] = value }
    } else {
      obj[key] = value
    }
  }
  return obj
}

// Flexible server action that accepts (prevState, FormData) | (FormData) | (input, meta)
export function defineAction<TSchema extends z.ZodTypeAny>(opts: {
  schema: TSchema
  handler: (params: { input: z.infer<TSchema>; ctx: ActionContext; meta?: any }) => Promise<ActionResult>
  middleware?: Array<(ctx: ActionContext) => Promise<ActionContext | void>>
}) {
  return async function action(
    prevOrInput: ActionResult | z.infer<TSchema> | FormData,
    formDataOrMeta?: FormData | any,
  ): Promise<ActionResult> {
    try {
      let input: unknown
      let meta: any

      if (prevOrInput instanceof FormData) {
        input = fdToObject(prevOrInput)
        meta = formDataOrMeta
      } else if (formDataOrMeta instanceof FormData) {
        input = fdToObject(formDataOrMeta)
      } else if (typeof prevOrInput === 'object' && prevOrInput && 'ok' in (prevOrInput as any)) {
        throw new Error('Invalid action call signature')
      } else {
        input = prevOrInput
        meta = formDataOrMeta
      }

      const parsed = await opts.schema.parseAsync(input)

      // Build ctx
      let ctx: ActionContext = {
        revalidate: async (paths: string[]) => { for (const p of paths) revalidatePath(p) },
        revalidateTag: async (tag: string) => revalidateTag(tag),
        redirect: async (path: string) => nextRedirect(path),
        now: () => new Date(),
        ...globalContext,
      }

      if (opts.middleware?.length) {
        for (const mw of opts.middleware) {
          const res = await mw(ctx)
          if (res) ctx = res
        }
      }

      return await opts.handler({ input: parsed, ctx, meta })
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = normalizeFieldErrors(err.flatten().fieldErrors);
        return { ok: false, message: 'Validation failed', fieldErrors };
      }
      return { ok: false, message: err instanceof Error ? err.message : 'Unknown error' }
    }
  }
}

// CRUD scaffold (object schemas only)
export function defineCRUD<TSchema extends AnyZodObject>(opts: {
  name: string
  schema: TSchema
  tags?: string[]
  // Optional hooks you can wire to your DB
  onCreate?: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<void>
  onUpdate?: (input: z.infer<TSchema & z.ZodObject<{ id: z.ZodString }>>, ctx: ActionContext) => Promise<void>
  onDelete?: (id: string, ctx: ActionContext) => Promise<void>
}) {
  const { schema, tags = [] } = opts

  const revalidateAll = async (ctx: ActionContext) => {
    for (const t of tags) await ctx.revalidateTag(t)
  }

  return {
    create: defineAction({
      schema,
      handler: async ({ input, ctx }) => {
        await opts.onCreate?.(input as any, ctx)
        await revalidateAll(ctx)
        return { ok: true, message: 'Created successfully' }
      },
    }),

    update: defineAction({
      schema: schema.partial().extend({ id: z.string() }),
      handler: async ({ input, ctx }) => {
        await opts.onUpdate?.(input as any, ctx)
        await revalidateAll(ctx)
        return { ok: true, message: 'Updated successfully' }
      },
    }),

    delete: defineAction({
      schema: z.object({ id: z.string() }),
      handler: async ({ input, ctx }) => {
        await opts.onDelete?.(input.id, ctx)
        await revalidateAll(ctx)
        return { ok: true, message: 'Deleted successfully' }
      },
    }),
  }
}

export const middleware = {
  auth:
    (check: (ctx: ActionContext) => boolean | Promise<boolean>) =>
    async (ctx: ActionContext) => {
      const ok = await check(ctx)
      if (!ok) throw new Error('Unauthorized')
      return ctx
    },

  log:
    (label?: string) =>
    async (ctx: ActionContext) => {
      console.log(label ?? 'Action executed', { at: ctx.now().toISOString() })
      return ctx
    },
}