declare module 'bun:sqlite' {
  const SQLite: any
  export default SQLite
}

interface ImportMeta {
  readonly dir?: string
}
