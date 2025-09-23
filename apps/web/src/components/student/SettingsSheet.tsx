import { useEffect, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { zodValidator } from '@/lib/zod-validator'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSessionStore } from '@/stores/session-store'
import { apiClient } from '@/lib/orpc-client'

const profileSchema = z.object({
  displayName: z.string().min(1, 'Pick a nickname to show your friends')
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Your password should be at least 8 characters'),
    newPassword: z.string().min(8, 'Make your new password at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your new password')
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Passwords need to match',
        path: ['confirmPassword']
      })
    }
  })

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FormError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm font-semibold text-destructive">{message}</p>
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const user = useSessionStore((state) => state.user)
  const setUser = useSessionStore((state) => state.setUser)
  const queryClient = useQueryClient()

  const profileMutation = useMutation({
    mutationFn: async ({ displayName }: { displayName: string }) => {
      const updated = await apiClient.profile.updateDisplayName({ displayName })
      setUser(updated)
      queryClient.setQueryData(['auth', 'me'], (current: unknown) => {
        if (!current || typeof current !== 'object') return current
        return {
          ...(current as Record<string, unknown>),
          user: updated
        }
      })
      return updated
    }
  })

  const avatarMutation = useMutation({
    mutationFn: async () => {
      const updated = await apiClient.profile.regenerateAvatar({})
      setUser(updated)
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      return updated
    }
  })

  const passwordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
      await apiClient.profile.changePassword({ currentPassword, newPassword })
      return true
    }
  })

  const profileForm = useForm({
    defaultValues: {
      displayName: user?.displayName ?? ''
    },
    validators: {
      onSubmit: zodValidator(profileSchema)
    },
    onSubmit: async ({ value }) => {
      await profileMutation.mutateAsync({ displayName: value.displayName })
    }
  })

  const displayNameField = profileForm.useField({
    name: 'displayName',
    validators: {
      onChange: zodValidator(profileSchema.shape.displayName)
    }
  })

  useEffect(() => {
    const nextName = user?.displayName ?? ''
    profileForm.update({
      defaultValues: {
        displayName: nextName
      }
    })
    displayNameField.setValue(nextName)
  }, [user?.displayName, profileForm, displayNameField])

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validators: {
      onSubmit: zodValidator(passwordSchema)
    },
    onSubmit: async ({ value, formApi }) => {
      await passwordMutation.mutateAsync({ currentPassword: value.currentPassword, newPassword: value.newPassword })
      formApi.reset()
    }
  })

  const currentPasswordField = passwordForm.useField({
    name: 'currentPassword',
    validators: { onChange: zodValidator(passwordSchema.shape.currentPassword) }
  })
  const newPasswordField = passwordForm.useField({
    name: 'newPassword',
    validators: { onChange: zodValidator(passwordSchema.shape.newPassword) }
  })
  const confirmPasswordField = passwordForm.useField({
    name: 'confirmPassword',
    validators: { onChange: zodValidator(passwordSchema.shape.confirmPassword) }
  })

  useEffect(() => {
    if (!open) {
      profileForm.reset()
      passwordForm.reset()
    }
  }, [open, profileForm, passwordForm])

  const avatarInitials = useMemo(() => {
    if (!user?.displayName) return 'MM'
    const parts = user.displayName.trim().split(' ').filter(Boolean)
    if (parts.length === 0) return 'MM'
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  }, [user?.displayName])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-lg">
        <SheetHeader>
          <SheetTitle>Your Explorer Settings</SheetTitle>
          <SheetDescription>Keep your Monte Math profile fresh and ready for learning adventures.</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="profile" className="mt-8">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="security">Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void profileForm.handleSubmit()
              }}
              className="space-y-6"
            >
              <displayNameField.Field>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Display name</Label>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Space Explorer"
                      disabled={profileMutation.isPending}
                    />
                    <FormError message={field.state.meta.errors[0]} />
                  </div>
                )}
              </displayNameField.Field>

              <div className="flex items-center justify-between rounded-[calc(var(--radius)/1.3)] bg-muted/60 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email ?? 'No email on file'}</p>
                </div>
              </div>

              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="avatar">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatarUrl ?? undefined} alt="Avatar preview" />
                  <AvatarFallback>{avatarInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">Shake up your look!</p>
                  <p className="text-sm text-muted-foreground">
                    Tap regenerate until you find the buddy that feels just right.
                  </p>
                </div>
              </div>
              <Button type="button" onClick={() => avatarMutation.mutate()} disabled={avatarMutation.isPending}>
                {avatarMutation.isPending ? 'Generating…' : 'Regenerate avatar'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void passwordForm.handleSubmit()
              }}
              className="space-y-6"
            >
              <currentPasswordField.Field>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Current password</Label>
                    <Input
                      id={field.name}
                      type="password"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="••••••••"
                      disabled={passwordMutation.isPending}
                    />
                    <FormError message={field.state.meta.errors[0]} />
                  </div>
                )}
              </currentPasswordField.Field>

              <Separator />

              <newPasswordField.Field>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>New password</Label>
                    <Input
                      id={field.name}
                      type="password"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="New secret phrase"
                      disabled={passwordMutation.isPending}
                    />
                    <FormError message={field.state.meta.errors[0]} />
                  </div>
                )}
              </newPasswordField.Field>

              <confirmPasswordField.Field>
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Confirm password</Label>
                    <Input
                      id={field.name}
                      type="password"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Repeat new password"
                      disabled={passwordMutation.isPending}
                    />
                    <FormError message={field.state.meta.errors[0]} />
                  </div>
                )}
              </confirmPasswordField.Field>

              <Button type="submit" variant="secondary" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
