// --------------------------------
// file: src/form/index.tsx
// --------------------------------
'use client'

import React, { createContext, useContext, forwardRef } from 'react'
import { z } from 'zod'
import { useActionForm } from '../client'
import type { ActionResult } from '../types'

// Context shared by Field / Submit / FormStatus
const FormContext = createContext<{
  errors: Record<string, string>
  pending: boolean
  state: ActionResult<any>
} | null>(null)

export interface FormProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'action' | 'onError'> {
  // For URL forms (GET): pass a string. For server actions: pass a function.
  action: string | ((input: any) => Promise<ActionResult>)
  schema?: z.ZodTypeAny
  onSuccess?: (result: ActionResult) => void
  onError?: (result: ActionResult) => void
  children: React.ReactNode
  mode?: 'auto' | 'url' | 'action'
}

export const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ action, schema, onSuccess, onError, children, mode = 'auto', ...props }, ref) => {
    const isUrl = typeof action === 'string'
    const resolvedMode = mode === 'auto' ? (isUrl ? 'url' : 'action') : mode

    if (resolvedMode === 'url') {
      // Plain HTML form that issues a GET navigation
      return (
        <form ref={ref} action={action as string} method="get" {...props}>
          {children}
        </form>
      )
    }

    // Server Action mode
    const { formAction, pending, errors, state } = useActionForm({
      action: action as any,
      schema,
      onSuccess,
      onError,
    })

    return (
      <FormContext.Provider value={{ errors, pending, state }}>
        <form ref={ref} action={formAction} {...props}>
          {children}
        </form>
      </FormContext.Provider>
    )
  },
)
Form.displayName = 'Form'

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  label?: string
  error?: string
  required?: boolean
  children: React.ReactElement
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
  ({ name, label, error, required, children, ...rest }, ref) => {
    const ctx = useContext(FormContext)
    const fieldError = error ?? ctx?.errors?.[name]

    // Force cast props to a spreadable object
    const baseProps = (children.props ?? {}) as Record<string, unknown>

    const child = React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>, // <-- tell TS props are a string-keyed object
      {
        ...baseProps,
        name,
        id: name,
        required,
        'aria-invalid': !!fieldError,
        'aria-describedby': fieldError ? `${name}-error` : undefined,
      }
    )

    return (
      <div ref={ref} {...rest}>
        {label && (
          <label htmlFor={name} className="block text-sm font-medium mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {child}
        {fieldError && (
          <span id={`${name}-error`} role="alert" className="text-sm text-red-600 mt-1 block">
            {fieldError}
          </span>
        )}
      </div>
    )
  }
)

Field.displayName = 'Field'

export interface SubmitProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loadingText?: string
  loadingIcon?: React.ReactNode
}

export const Submit = forwardRef<HTMLButtonElement, SubmitProps>(
  ({ children, loadingText = 'Saving…', loadingIcon, disabled, ...rest }, ref) => {
    const ctx = useContext(FormContext)
    const isPending = ctx?.pending ?? false

    return (
      <button ref={ref} type="submit" disabled={disabled || isPending} {...rest}>
        {isPending ? (
          <span className="inline-flex items-center gap-2">
            {loadingIcon}
            {loadingText}
          </span>
        ) : (
          children
        )}
      </button>
    )
  },
)
Submit.displayName = 'Submit'

export function FormStatus({
  successMessage = 'Success!',
  className = 'mt-2 text-sm',
}: {
  successMessage?: string
  className?: string
}) {
  const ctx = useContext(FormContext)
  if (!ctx) return null
  const { state } = ctx

  // Show nothing if we have no message and no field errors on a failed state
  if (!state.ok && !state.message && !state.fieldErrors) return null

  return (
    <div className={className} role="status">
      {state.ok ? (
        <span className="text-green-600">✓ {state.message || successMessage}</span>
      ) : (
        <span className="text-red-600">✗ {state.message || 'Failed'}</span>
      )}
    </div>
  )
}

// Convenience wrappers -------------------------------------------------
export function SearchForm({
  action,
  placeholder = 'Search…',
  className,
  children,
}: {
  action: string
  placeholder?: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <Form action={action} mode="url" className={className}>
      <div className="flex gap-2">
        <Field name="q">
          <input type="search" placeholder={placeholder} className="flex-1 px-3 py-2 border rounded-md" />
        </Field>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">
          Search
        </button>
      </div>
      {children}
    </Form>
  )
}

export function FilterForm({
  schema,
  className,
  children,
}: {
  schema: z.ZodTypeAny
  className?: string
  children: React.ReactNode
}) {
  // Client-side helper is provided by caller; this wrapper keeps uniform API
  return <form className={className}>{children}</form>
}
