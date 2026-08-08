/** Readable message for anything thrown, including non-Error values. */
export function formatError(
  error: unknown,
  options: { includeStack?: boolean; pretty?: boolean } = {},
): string {
  if (error instanceof Error) {
    const stack = options.includeStack && error.stack ? `\n${error.stack}` : ''
    return `${error.name}: ${error.message}${stack}`
  }
  try {
    return options.pretty ? JSON.stringify(error, null, 2) : JSON.stringify(error)
  } catch {
    return String(error)
  }
}
