// --------------------------------
// file: src/client/index.ts
// --------------------------------
'use client'

import {
  useActionState,
  useOptimistic as useOptimisticReact,
  startTransition,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo } from 'react'
import { z } from 'zod'
import type { ActionResult } from '../types'
import { normalizeFieldErrors } from '../shared/normalizeFieldErrors'

// ---------- useActionForm ----------
export function useActionForm<T = unknown>(options: {
  action: (input: any) => Promise<ActionResult<T>>
  schema?: z.ZodTypeAny
  onSuccess?: (result: ActionResult<T>) => void
  onError?: (result: ActionResult<T>) => void
  initialState?: ActionResult<T>
}) {
  const {
    action,
    schema,
    onSuccess,
    onError,
    initialState = { ok: false } as ActionResult<T>,
  } = options

  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<T>, formData: FormData) => {
      let input: any = formData

      if (schema) {
        const obj = Object.fromEntries(formData.entries())
        const parsed = await schema.safeParseAsync(obj)
        if (!parsed.success) {
          return {
            ok: false,
            message: 'Validation failed',
            fieldErrors: normalizeFieldErrors(
              parsed.error.flatten().fieldErrors
            ),
          } as ActionResult<T>
        }
        input = parsed.data
      }

      const result = await action(input)
      if (result.ok) onSuccess?.(result)
      else onError?.(result)
      return result
    },
    initialState
  )

  const errors = useMemo(() => {
    if (state.ok || !state.fieldErrors) return {}
    return Object.fromEntries(
      Object.entries(state.fieldErrors).map(([k, v]) => [
        k,
        v?.[0] ?? 'Invalid',
      ])
    )
  }, [state]) as Record<string, string>

  return { formAction, pending, errors, state }
}

// ---------- useOptimisticList ----------
export function useOptimisticList<T extends { id: string | number }>(
  initial: T[]
) {
  const [list, apply] = useOptimisticReact(
    initial,
    (state: T[], action: any): T[] => {
      switch (action?.type) {
        case 'add':
          return [action.item as T, ...state]
        case 'update':
          return state.map((it) =>
            it.id === action.id
              ? { ...it, ...(action.updates as Partial<T>) }
              : it
          )
        case 'remove':
          return state.filter((it) => it.id !== action.id)
        case 'replace':
          return action.items as T[]
        default:
          return state
      }
    }
  )

  const mutate = {
    add: (item: T) => apply({ type: 'add', item }),
    update: (id: string | number, updates: Partial<T>) =>
      apply({ type: 'update', id, updates }),
    remove: (id: string | number) => apply({ type: 'remove', id }),
    replace: (items: T[]) => apply({ type: 'replace', items }),
    custom: (action: any) => apply(action),
  }

  return [list, mutate] as const
}

// ---------- useURLFilters ----------
export function useURLFilters<T extends z.ZodTypeAny>(schema: T) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters = useMemo(() => {
    const raw = Object.fromEntries(
      searchParams.entries()
    ) as Record<string, any>

    // Convert comma lists to arrays for parsing
    for (const k of Object.keys(raw)) {
      if (
        typeof raw[k] === 'string' &&
        (raw[k] as string).includes(',')
      ) {
        raw[k] = (raw[k] as string).split(',').filter(Boolean)
      }
    }

    const res = schema.safeParse(raw)
    return res.success
      ? res.data
      : (schema.parse({}) as z.infer<T>)
  }, [searchParams, schema]) as z.infer<T>

  const setFilters = useCallback(
    (updates: Partial<z.infer<T>>) => {
      startTransition(() => {
        const next = { ...filters, ...updates }
        const params = new URLSearchParams()
        Object.entries(next).forEach(([k, v]) => {
          if (v === undefined || v === null) return
          if (Array.isArray(v)) {
            if (v.length) params.set(k, v.join(','))
          } else if (v !== '') {
            params.set(k, String(v))
          }
        })
        router.push(`?${params.toString()}`)
      })
    },
    [filters, router]
  )

  const clear = useCallback(() => router.push('?'), [router])

  const searchAction = useCallback(
    (formData: FormData) => {
      const obj = Object.fromEntries(
        formData.entries()
      ) as Record<string, any>
      setFilters(obj as Partial<z.infer<T>>)
    },
    [setFilters]
  )

  const toggleInArray = useCallback(
    (key: keyof z.infer<T>, value: string) => {
      const curr = (filters[key] as unknown as string[]) || []
      const exists = curr.includes(value)
      const next = exists
        ? curr.filter((v) => v !== value)
        : [...curr, value]
      setFilters({ [key]: next } as Partial<z.infer<T>>)
    },
    [filters, setFilters]
  )

  return { filters, setFilters, clear, searchAction, toggleInArray }
}
