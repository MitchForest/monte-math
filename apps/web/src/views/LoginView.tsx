import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import type { FieldMeta } from '@tanstack/form-core'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSessionStore } from '@/stores/session-store'
import { apiClient } from '@/lib/orpc-client'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
})

const formatZodError =
  (schema: z.ZodTypeAny) =>
  ({ value }: { value: unknown }) => {
    const result = schema.safeParse(value)
    if (result.success) return undefined
    return result.error.issues[0]?.message ?? 'Invalid value'
  }

const validateFormWithSchema =
  <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  ({ value }: { value: z.infer<TSchema> }) => {
    const result = schema.safeParse(value)
    if (result.success) return undefined

    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      if (!path) continue
      if (typeof fieldErrors[path] === 'string') continue
      fieldErrors[path] = issue.message
    }

    return {
      form: result.error.formErrors.formErrors[0],
      fields: fieldErrors,
    }
  }

const getFieldError = (meta: FieldMeta, submissionAttempts: number) => {
  const { errorMap, errors, isTouched } = meta

  const message =
    (typeof errorMap.onChange === 'string' && errorMap.onChange) ||
    (typeof errorMap.onBlur === 'string' && errorMap.onBlur) ||
    (typeof errorMap.onSubmit === 'string' && errorMap.onSubmit) ||
    errors.find((error): error is string => typeof error === 'string')

  if (!message) return undefined
  if (isTouched || submissionAttempts > 0 || typeof errorMap.onSubmit === 'string') {
    return message
  }
  return undefined
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm font-semibold text-destructive">{message}</p>
}

export function LoginView() {
  const [showPassword, setShowPassword] = useState(false)
  const hydrate = useSessionStore((state) => state.hydrate)
  const setStatus = useSessionStore((state) => state.setStatus)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      const result = await apiClient.auth.login(values)
      hydrate(result)
      queryClient.setQueryData(['auth', 'me'], result)
      setStatus('authenticated')
      return result
    },
    onSuccess: () => {
      navigate({ to: '/app' })
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        form.setFieldMeta('email', (prev) => ({
          ...prev,
          errorMap: {
            ...prev.errorMap,
            onSubmit: error.message,
          },
          errors: [error.message],
        }))
      }
    },
  })

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: validateFormWithSchema(loginSchema),
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value)
    },
  })

  const formState = form.useStore((state) => ({
    submissionAttempts: state.submissionAttempts,
    formError: state.errorMap.onSubmit,
  }))

  return (
    <AuthLayout
      title="Welcome back, adventurer"
      description="Sign in to keep exploring your math universe."
      footer={
        <span>
          New here?{' '}
          <Link
            to="/signup"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </span>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
        className="space-y-6"
      >
        <form.Field name="email" validators={{ onBlur: formatZodError(loginSchema.shape.email) }}>
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="you@example.com"
                disabled={loginMutation.isPending}
              />
              <FormError message={getFieldError(field.state.meta, formState.submissionAttempts)} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{ onChange: formatZodError(loginSchema.shape.password) }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={field.name}
                  type={showPassword ? 'text' : 'password'}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Super secret"
                  disabled={loginMutation.isPending}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
              <FormError message={getFieldError(field.state.meta, formState.submissionAttempts)} />
            </div>
          )}
        </form.Field>

        <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <FormError
          message={
            (typeof formState.formError === 'string' ? formState.formError : undefined) ??
            (loginMutation.error as Error | undefined)?.message
          }
        />
      </form>
    </AuthLayout>
  )
}
