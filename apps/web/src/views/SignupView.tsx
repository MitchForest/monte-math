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

const signupBaseSchema = z.object({
  displayName: z.string().min(2, 'We need at least 2 letters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
})

const signupSchema = signupBaseSchema.superRefine((value, ctx) => {
  if (value.password !== value.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords need to match',
      path: ['confirmPassword'],
    })
  }
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

export function SignupView() {
  const [showPassword, setShowPassword] = useState(false)
  const hydrate = useSessionStore((state) => state.hydrate)
  const setStatus = useSessionStore((state) => state.setStatus)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const signupMutation = useMutation({
    mutationFn: async (values: { displayName?: string; email: string; password: string }) => {
      const result = await apiClient.auth.register(values)
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
        form.setFieldMeta('email', (previous) => ({
          ...previous,
          errorMap: {
            ...previous.errorMap,
            onSubmit: error.message,
          },
          errors: [error.message],
        }))
      }
    },
  })

  const form = useForm({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: validateFormWithSchema(signupSchema),
    },
    onSubmit: async ({ value }) => {
      await signupMutation.mutateAsync({
        email: value.email,
        password: value.password,
        displayName: value.displayName,
      })
    },
  })

  const formState = form.useStore((state) => ({
    submissionAttempts: state.submissionAttempts,
    formError: state.errorMap.onSubmit,
  }))

  return (
    <AuthLayout
      title="Create your Monte Math profile"
      description="Pick a playful nickname and start earning XP."
      footer={
        <span>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
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
        <form.Field
          name="displayName"
          validators={{ onChange: formatZodError(signupBaseSchema.shape.displayName) }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Display name</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Space Explorer"
                disabled={signupMutation.isPending}
              />
              <FormError message={getFieldError(field.state.meta, formState.submissionAttempts)} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="email"
          validators={{ onBlur: formatZodError(signupBaseSchema.shape.email) }}
        >
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
                disabled={signupMutation.isPending}
              />
              <FormError message={getFieldError(field.state.meta, formState.submissionAttempts)} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{ onChange: formatZodError(signupBaseSchema.shape.password) }}
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
                  placeholder="At least 8 characters"
                  disabled={signupMutation.isPending}
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

        <form.Field
          name="confirmPassword"
          validators={{ onChange: formatZodError(signupBaseSchema.shape.confirmPassword) }}
        >
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Confirm password</Label>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Repeat your password"
                disabled={signupMutation.isPending}
              />
              <FormError message={getFieldError(field.state.meta, formState.submissionAttempts)} />
            </div>
          )}
        </form.Field>

        <Button type="submit" size="lg" className="w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? 'Creating profile…' : 'Create account'}
        </Button>

        <FormError
          message={
            (typeof formState.formError === 'string' ? formState.formError : undefined) ??
            (signupMutation.error as Error | undefined)?.message
          }
        />
      </form>
    </AuthLayout>
  )
}
