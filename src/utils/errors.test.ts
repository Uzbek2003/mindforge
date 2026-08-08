import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireAndForget, formatError, reportError } from './errors'

describe('error reporting helpers', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('formats errors, plain objects, and primitives', () => {
    expect(formatError(new Error('boom'))).toContain('Error: boom')
    expect(formatError({ code: 5 })).toBe('{"code":5}')
    expect(formatError(undefined)).toBe('undefined')
  })

  it('formats values JSON cannot serialize', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(formatError(circular)).toBe('[object Object]')
  })

  it('logs the context alongside the failure', () => {
    reportError('saving progress', new Error('nope'))
    expect(console.error).toHaveBeenCalledWith(
      '[QuizNova] saving progress:',
      expect.stringContaining('Error: nope'),
    )
  })

  it('logs rejections of promises the caller does not await', async () => {
    fireAndForget(Promise.reject(new Error('async boom')), 'speaking')
    await Promise.resolve()
    await Promise.resolve()
    expect(console.error).toHaveBeenCalledWith(
      '[QuizNova] speaking:',
      expect.stringContaining('async boom'),
    )
  })
})
