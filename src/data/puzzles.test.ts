import { describe, expect, it } from 'vitest'
import { ALL_PUZZLES } from './index'
import type { Category, Difficulty } from '../types'

/** Preserve the original per-category difficulty mix. */
const EXPECTED_DISTRIBUTION: Record<Category, Record<Difficulty, number>> = {
  math: { easy: 8, medium: 9, hard: 8 },
  science: { easy: 8, medium: 9, hard: 8 },
  history: { easy: 8, medium: 8, hard: 9 },
  'computer-science': { easy: 8, medium: 8, hard: 9 },
}

const CATEGORIES = Object.keys(EXPECTED_DISTRIBUTION) as Category[]

function normalizeQuestion(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, ' ')
}

describe('puzzle bank validation', () => {
  it('contains exactly 100 puzzles', () => {
    expect(ALL_PUZZLES).toHaveLength(100)
  })

  it('uses unique ids covering 1 through 100', () => {
    const ids = ALL_PUZZLES.map((puzzle) => puzzle.id).sort((a, b) => a - b)
    expect(ids).toEqual(Array.from({ length: 100 }, (_, index) => index + 1))
  })

  it('keeps 25 puzzles in each category', () => {
    for (const category of CATEGORIES) {
      const count = ALL_PUZZLES.filter((puzzle) => puzzle.category === category).length
      expect(count, `${category} count`).toBe(25)
    }
  })

  it('preserves the category and difficulty distribution', () => {
    for (const category of CATEGORIES) {
      for (const difficulty of ['easy', 'medium', 'hard'] as Difficulty[]) {
        const count = ALL_PUZZLES.filter(
          (puzzle) => puzzle.category === category && puzzle.difficulty === difficulty,
        ).length
        expect(count, `${category}/${difficulty}`).toBe(EXPECTED_DISTRIBUTION[category][difficulty])
      }
    }
  })

  it('has no duplicate questions', () => {
    const seen = new Map<string, number>()
    const duplicates: string[] = []

    for (const puzzle of ALL_PUZZLES) {
      const key = normalizeQuestion(puzzle.question)
      if (seen.has(key)) {
        duplicates.push(`#${seen.get(key)} and #${puzzle.id}: ${puzzle.question}`)
      } else {
        seen.set(key, puzzle.id)
      }
    }

    expect(duplicates, duplicates.join('\n')).toEqual([])
  })

  it('has valid correct answers and option sets', () => {
    for (const puzzle of ALL_PUZZLES) {
      expect(puzzle.options, `options for #${puzzle.id}`).toHaveLength(4)
      expect([0, 1, 2, 3]).toContain(puzzle.correctIndex)

      for (const [index, option] of puzzle.options.entries()) {
        expect(option.trim().length, `option ${index} on #${puzzle.id}`).toBeGreaterThan(0)
      }

      const uniqueOptions = new Set(puzzle.options.map((option) => option.trim().toLowerCase()))
      expect(uniqueOptions.size, `unique options on #${puzzle.id}`).toBe(4)

      const answer = puzzle.options[puzzle.correctIndex]
      expect(answer.trim().length, `correct answer on #${puzzle.id}`).toBeGreaterThan(0)
    }
  })

  it('requires non-empty hints and useful explanations', () => {
    for (const puzzle of ALL_PUZZLES) {
      expect(puzzle.question.trim().length, `question #${puzzle.id}`).toBeGreaterThan(10)
      expect(puzzle.hint.trim().length, `hint #${puzzle.id}`).toBeGreaterThan(5)
      expect(puzzle.explanation.trim().length, `explanation #${puzzle.id}`).toBeGreaterThan(40)

      const explanation = puzzle.explanation.toLowerCase()
      // Old bug truncated "Atomicity" to "Atomicit" — allow the full word only.
      expect(/atomicit(?!y)/i.test(puzzle.explanation), `truncated Atomicit in #${puzzle.id}`).toBe(
        false,
      )

      // Reject leftover template filler from the old expand-explanations script.
      expect(
        explanation.includes('this idea describes a real pattern in nature'),
        `template filler in #${puzzle.id}`,
      ).toBe(false)
      expect(
        explanation.includes('practicing similar problems helps you solve them faster'),
        `template filler in #${puzzle.id}`,
      ).toBe(false)
      expect(
        explanation.includes('this event or figure matters because it shaped decisions'),
        `template filler in #${puzzle.id}`,
      ).toBe(false)
      expect(
        explanation.includes('in computer science, this concept helps programs, networks'),
        `template filler in #${puzzle.id}`,
      ).toBe(false)
    }
  })
})
