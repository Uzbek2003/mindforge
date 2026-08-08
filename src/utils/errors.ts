const LOG_PREFIX = '[QuizNova]'

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    // The stack already starts with "Name: message".
    return error.stack ?? `${error.name}: ${error.message}`
  }
  try {
    // JSON.stringify returns undefined for undefined and functions.
    return JSON.stringify(error) ?? String(error)
  } catch {
    return String(error)
  }
}

/**
 * Logs a non-fatal failure. Always reaches the console (including production
 * builds) so degraded behaviour is diagnosable instead of invisible.
 */
export function reportError(context: string, error: unknown): void {
  console.error(`${LOG_PREFIX} ${context}:`, formatError(error))
}

/** Runs a promise the caller does not await, logging rejections instead of dropping them. */
export function fireAndForget(promise: Promise<unknown>, context: string): void {
  void promise.catch((error: unknown) => reportError(context, error))
}
