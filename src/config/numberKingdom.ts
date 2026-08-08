import type { NumberKingdomStory } from '../types/adventure'

/**
 * Number Kingdom — short original story path for the adventure prototype.
 * Puzzle ids reference the existing reviewed math bank (unchanged content).
 */
export const NUMBER_KINGDOM: NumberKingdomStory = {
  worldId: 'math-kingdom',
  title: 'Number Kingdom',
  prologue: [
    'Long ago, the Number Kingdom kept every sum, pattern, and proof in perfect balance.',
    'Then the Echo Sovereign scattered the Counting Chimes — tiny bells that hold the realm’s order.',
    'As a budding Number Keeper, you must restore the chimes through three training stages, face the Sum-Stealer, and calm the Sovereign with clear thinking — not force.',
  ],
  epilogue:
    'The Counting Chimes ring again. The Echo Sovereign bows, the Sum-Stealer returns what it borrowed, and Number Kingdom remembers your name. More worlds wait beyond the mist — when they open, your Keeper level will travel with you.',
  nodes: [
    {
      id: 'gate-of-counting',
      kind: 'stage',
      name: 'Gate of Counting',
      synopsis: 'Warm up at the kingdom gate. Steady answers clear the Counting Mist.',
      puzzleIds: [1, 2, 3],
      enemy: {
        id: 'counting-mist',
        name: 'Counting Mist',
        title: 'Training spirit',
        blurb: 'A soft fog that thins when sums come out right.',
        maxHp: 40,
        icon: '🌫',
      },
      xpFull: 12,
      damageFull: 20,
    },
    {
      id: 'bridge-of-patterns',
      kind: 'stage',
      name: 'Bridge of Patterns',
      synopsis: 'Cross the bridge by spotting patterns before the sparks scatter.',
      puzzleIds: [4, 5, 6],
      enemy: {
        id: 'pattern-sparks',
        name: 'Pattern Sparks',
        title: 'Playful ward',
        blurb: 'Bright motes that settle when patterns click into place.',
        maxHp: 40,
        icon: '✨',
      },
      xpFull: 12,
      damageFull: 20,
    },
    {
      id: 'sum-stealer',
      kind: 'enemy',
      name: 'Sum-Stealer Ambush',
      synopsis: 'A mischievous thief snatches half-finished sums. Answer to reclaim them.',
      puzzleIds: [9, 10, 11],
      enemy: {
        id: 'sum-stealer',
        name: 'Sum-Stealer',
        title: 'Chime thief',
        blurb: 'It never fights — it just runs off with unfinished answers until you solve them.',
        maxHp: 50,
        icon: '🦊',
      },
      xpFull: 16,
      damageFull: 25,
    },
    {
      id: 'spire-of-solutions',
      kind: 'stage',
      name: 'Spire of Solutions',
      synopsis: 'Climb the spire where tougher puzzles unlock the Sovereign’s hall.',
      puzzleIds: [12, 13, 14],
      enemy: {
        id: 'spire-echoes',
        name: 'Spire Echoes',
        title: 'Hall guardians',
        blurb: 'Whispering echoes that fade when solutions ring true.',
        maxHp: 45,
        icon: '🕯',
      },
      xpFull: 14,
      damageFull: 22,
    },
    {
      id: 'echo-sovereign',
      kind: 'boss',
      name: 'Echo Sovereign',
      synopsis: 'Calm the Sovereign with your sharpest answers and restore the Counting Chimes.',
      puzzleIds: [18, 19, 20, 21],
      enemy: {
        id: 'echo-sovereign',
        name: 'Echo Sovereign',
        title: 'Final guardian',
        blurb: 'A proud spirit of mirrored numbers — it yields only to clear reasoning.',
        maxHp: 75,
        icon: '👑',
      },
      xpFull: 20,
      damageFull: 30,
    },
  ],
  worldPreviews: [
    {
      id: 'science-lab',
      name: 'Science Lab',
      tagline: 'Experiments wait beyond the mist',
      locked: true,
      unlockHint: 'Complete Number Kingdom to preview unlock',
    },
    {
      id: 'history-museum',
      name: 'History Museum',
      tagline: 'Stories of ages yet to open',
      locked: true,
      unlockHint: 'Coming after more Keeper quests',
    },
    {
      id: 'coding-academy',
      name: 'Coding Academy',
      tagline: 'Logic towers under construction',
      locked: true,
      unlockHint: 'Coming after more Keeper quests',
    },
  ],
}

export function getNumberKingdomNode(nodeId: string) {
  return NUMBER_KINGDOM.nodes.find((node) => node.id === nodeId) ?? null
}

export function getNumberKingdomNodeIndex(nodeId: string): number {
  return NUMBER_KINGDOM.nodes.findIndex((node) => node.id === nodeId)
}

export function isNumberKingdomComplete(clearedNodeIds: string[]): boolean {
  return NUMBER_KINGDOM.nodes.every((node) => clearedNodeIds.includes(node.id))
}
