import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { zodValidator } from '@/lib/zod-validator'

import { AuthLayout } from '@/components/auth/AuthLayout'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/stores/session-store'
import { apiClient } from '@/lib/orpc-client'

const signupBaseSchema = z.object({
  displayName: z.string().min(2, 'Include at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password')
})

const signupSchema = signupBaseSchema.superRefine((value, ctx) => {
  if (value.password !== value.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Passwords must match',
      path: ['confirmPassword']
    })
  }
})

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm font-medium text-destructive">{message}</p>
}

export function SignupView() {
  const hydrate = useSessionStore((state) => state.hydrate)
  const setStatus = useSessionStore((state) => state.setStatus)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const signupMutation = useMutation({
    mutationFn: async (values: { email: string; password: string; displayName?: string }) => {
      const result = await apiClient.auth.register(values)
      hydrate(result)
      queryClient.setQueryData(['auth', 'me'], result)
      setStatus('authenticated')
      return result
    },
    onSuccess: () => {
      navigate({ to: '/' })
    }
  })

  const form = useForm({
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validators: {
      onSubmit: zodValidator(signupSchema)
    },
    onSubmit: async ({ value }) => {
      await signupMutation.mutateAsync({
        email: value.email,
        password: value.password,
        displayName: value.displayName
      })
    }
  })

  const displayNameField = form.useField({ name: 'displayName', validators: { onChange: zodValidator(signupBaseSchema.shape.displayName) } })
  const emailField = form.useField({ name: 'email', validators: { onChange: zodValidator(signupBaseSchema.shape.email) } })
  const passwordField = form.useField({ name: 'password', validators: { onChange: zodValidator(signupBaseSchema.shape.password) } })
  const confirmPasswordField = form.useField({ name: 'confirmPassword', validators: { onChange: zodValidator(signupBaseSchema.shape.confirmPassword) } })

  return (
    <AuthLayout
      title="Request studio access"
      description="Create a profile to manage curriculum tools. Requests are reviewed by the Monte team."
      footer={
        <span>
          Already onboarded?{' '}
          <Link to="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
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
        className="space-y-5"
      >
        <displayNameField.Field>
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Full name</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Jordan Rivera"
                disabled={signupMutation.isPending}
              />
              <FormError message={field.state.meta.errors[0]} />
            </div>
          )}
        </displayNameField.Field>

        <emailField.Field>
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Work email</Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="you@school.org"
                disabled={signupMutation.isPending}
              />
              <FormError message={field.state.meta.errors[0]} />
            </div>
          )}
        </emailField.Field>

        <passwordField.Field>
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Password</Label>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="At least 8 characters"
                disabled={signupMutation.isPending}
              />
              <FormError message={field.state.meta.errors[0]} />
            </div>
          )}
        </passwordField.Field>

        <confirmPasswordField.Field>
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>Confirm password</Label>
              <Input
                id={field.name}
                type="password"
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                onBlur={field.handleBlur}
                placeholder="Repeat password"
                disabled={signupMutation.isPending}
              />
              <FormError message={field.state.meta.errors[0]} />
            </div>
          )}
        </confirmPasswordField.Field>

        <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? 'Submitting…' : 'Submit request'}
        </Button>

        <FormError message={(signupMutation.error as Error | undefined)?.message} />
      </form>
    </AuthLayout>
  )
}
