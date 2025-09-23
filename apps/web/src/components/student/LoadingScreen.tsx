export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-16 w-16 animate-pulse rounded-[28px] bg-primary/30" />
        <p className="text-base font-semibold text-muted-foreground">
          Getting your adventure ready…
        </p>
      </div>
    </div>
  )
}
