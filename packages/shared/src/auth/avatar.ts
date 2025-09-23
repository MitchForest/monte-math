export interface DiceBearOptions {
  seed: string
  size?: number
  backgroundColor?: string
}

const DEFAULT_BACKGROUND = 'b6e3f4'

export function buildDiceBearUrl({
  seed,
  size = 96,
  backgroundColor = DEFAULT_BACKGROUND
}: DiceBearOptions): string {
  const params = new URLSearchParams({
    seed,
    size: size.toString(),
    backgroundColor
  })

  return `https://api.dicebear.com/7.x/micah/svg?${params.toString()}`
}
