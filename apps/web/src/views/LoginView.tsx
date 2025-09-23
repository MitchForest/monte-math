import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { zodValidator } from '@/lib/zod-validator'

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
      navigate({ to: '/' })
    },
  })

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: zodValidator(loginSchema),
    },
    onSubmit: async ({ value }) => {
      await loginMutation.mutateAsync(value)
    },
  })

  const emailField = form.useField({
    name: 'email',
    validators: { onChange: zodValidator(loginSchema.shape.email) },
  })

  const passwordField = form.useField({
    name: 'password',
    validators: { onChange: zodValidator(loginSchema.shape.password) },
  })

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
            Create an account
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
        <emailField.Field>
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
              <FormError message={field.state.meta.errors[0]} />
            </div>
          )}
        </emailField.Field>

        <passwordField.Field>
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
              <FormError message={field.state.meta.errors[0]} />
            </div>
          )}
        </passwordField.Field>

        <Button type="submit" size="lg" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
        </Button>

        <FormError message={(loginMutation.error as Error | undefined)?.message} />
      </form>
    </AuthLayout>
  )
}
