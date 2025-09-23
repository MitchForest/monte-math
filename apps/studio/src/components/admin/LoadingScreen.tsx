export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm font-medium text-muted-foreground">Preparing studio workspace…</p>
      </div>
    </div>
  )
}
