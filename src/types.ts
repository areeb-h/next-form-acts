// --------------------------------
// file: src/types.ts
// --------------------------------
import { z } from 'zod'

export type ActionResult<T = unknown> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; message?: string; fieldErrors?: Record<string, string[]> }

export interface ActionContext {
  revalidate: (paths: string[]) => Promise<void>
  revalidateTag: (tag: string) => Promise<void>
  redirect: (path: string) => Promise<never>
  now: () => Date
  // user-injected stuff via init()
  [key: string]: any
}

export type AnyZodObject = z.ZodObject<any, any, any, any, any>