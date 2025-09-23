declare module '*.md?raw' {
  const content: string
  export default content
}

declare module '@docs/*.json' {
  const value: unknown
  export default value
}

declare module '@docs/*.md?raw' {
  const content: string
  export default content
}
