import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants'
import { readStorageKey } from '../utils/storageMigration'
import { NUMBER_KINGDOM, getNumberKingdomNodeIndex, isNumberKingdomComplete } from '../config/numberKingdom'
import {
  EMPTY_ADVENTURE_PROGRESS,
  levelFromXp,
  xpIntoLevel,
  type AdventureNodeId,
  type AdventureProgress,
} from '../types/adventure'

function loadAdventureProgress(): AdventureProgress {
  try {
    const raw = readStorageKey('adventure')
    if (!raw) return { ...EMPTY_ADVENTURE_PROGRESS }
    const parsed = { ...EMPTY_ADVENTURE_PROGRESS, ...JSON.parse(raw) } as AdventureProgress
    if (parsed.version !== 1) return { ...EMPTY_ADVENTURE_PROGRESS }
    return {
      version: 1,
      totalXp: Math.max(0, Number(parsed.totalXp) || 0),
      highestClearedIndex: Number.isFinite(parsed.highestClearedIndex)
        ? parsed.highestClearedIndex
        : -1,
      clearedNodeIds: Array.isArray(parsed.clearedNodeIds)
        ? parsed.clearedNodeIds.filter((id): id is AdventureNodeId =>
            NUMBER_KINGDOM.nodes.some((node) => node.id === id),
          )
        : [],
      activeNodeId:
        parsed.activeNodeId && NUMBER_KINGDOM.nodes.some((node) => node.id === parsed.activeNodeId)
          ? parsed.activeNodeId
          : null,
    }
  } catch {
    return { ...EMPTY_ADVENTURE_PROGRESS }
  }
}

function saveAdventureProgress(progress: AdventureProgress) {
  localStorage.setItem(STORAGE_KEYS.adventure, JSON.stringify(progress))
}

export function useAdventureProgress() {
  const [progress, setProgress] = useState<AdventureProgress>(loadAdventureProgress)

  useEffect(() => {
    saveAdventureProgress(progress)
  }, [progress])

  const levelInfo = useMemo(() => xpIntoLevel(progress.totalXp), [progress.totalXp])
  const level = levelInfo.level
  const kingdomComplete = isNumberKingdomComplete(progress.clearedNodeIds)

  const nextPlayableIndex = useMemo(() => {
    const next = progress.highestClearedIndex + 1
    if (next >= NUMBER_KINGDOM.nodes.length) return NUMBER_KINGDOM.nodes.length - 1
    return Math.max(0, next)
  }, [progress.highestClearedIndex])

  const isNodeUnlocked = useCallback(
    (nodeId: AdventureNodeId) => {
      const index = getNumberKingdomNodeIndex(nodeId)
      if (index < 0) return false
      return index <= progress.highestClearedIndex + 1
    },
    [progress.highestClearedIndex],
  )

  const isNodeCleared = useCallback(
    (nodeId: AdventureNodeId) => progress.clearedNodeIds.includes(nodeId),
    [progress.clearedNodeIds],
  )

  const setActiveNode = useCallback((nodeId: AdventureNodeId | null) => {
    setProgress((prev) => ({ ...prev, activeNodeId: nodeId }))
  }, [])

  const awardXp = useCallback((amount: number) => {
    if (amount <= 0) return
    setProgress((prev) => ({ ...prev, totalXp: prev.totalXp + amount }))
  }, [])

  /** Mark a node cleared. XP should already be awarded via awardXp during battle. */
  const clearNode = useCallback((nodeId: AdventureNodeId) => {
    setProgress((prev) => {
      const index = getNumberKingdomNodeIndex(nodeId)
      const clearedNodeIds = prev.clearedNodeIds.includes(nodeId)
        ? prev.clearedNodeIds
        : [...prev.clearedNodeIds, nodeId]
      return {
        ...prev,
        highestClearedIndex: Math.max(prev.highestClearedIndex, index),
        clearedNodeIds,
        activeNodeId: null,
      }
    })
  }, [])

  const resetAdventure = useCallback(() => {
    setProgress({ ...EMPTY_ADVENTURE_PROGRESS })
  }, [])

  return {
    progress,
    level,
    levelInfo,
    kingdomComplete,
    nextPlayableIndex,
    isNodeUnlocked,
    isNodeCleared,
    setActiveNode,
    awardXp,
    clearNode,
    resetAdventure,
    levelFromXp,
  }
}
