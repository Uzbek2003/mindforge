import { NUMBER_KINGDOM } from '../../config/numberKingdom'
import type { AdventureNodeId } from '../../types/adventure'
import { summarizeBattle } from '../../utils/adventureCombat'
import type { StoryBattleFinishPayload } from './StoryBattleScreen'
import { Header } from '../UI'

interface AdventureVictoryScreenProps {
  result: StoryBattleFinishPayload
  playerLevel: number
  totalXp: number
  kingdomComplete: boolean
  onContinueMap: () => void
  onHome: () => void
}

export function AdventureVictoryScreen({
  result,
  playerLevel,
  totalXp,
  kingdomComplete,
  onContinueMap,
  onHome,
}: AdventureVictoryScreenProps) {
  const summary = summarizeBattle(result.attempts)
  const node = NUMBER_KINGDOM.nodes.find((n) => n.id === result.nodeId)
  const isFinal = result.nodeId === ('echo-sovereign' as AdventureNodeId)

  return (
    <div className="screen adventure-screen">
      <Header onHome={onHome} showHome />

      <section className="adventure-hero adventure-hero-victory">
        <p className="adventure-eyebrow">
          {result.cleared ? (result.victory ? 'Encounter cleared' : 'Path cleared') : 'Retreat'}
        </p>
        <h2 className="adventure-title">
          {result.cleared
            ? result.victory
              ? `${result.enemyName} calmed`
              : `${result.nodeName} complete`
            : 'The chimes slip away'}
        </h2>
        <p className="adventure-keeper">
          Keeper Level {playerLevel} · {totalXp} XP
        </p>
      </section>

      <section className="panel">
        <h3>Battle summary</h3>
        <ul className="adventure-summary-list">
          <li>
            <span>XP earned</span>
            <strong>+{result.xpGained}</strong>
          </li>
          <li>
            <span>Harmony restored</span>
            <strong>{result.damageDealt}</strong>
          </li>
          <li>
            <span>First-try answers</span>
            <strong>{summary.correctFirstTry}</strong>
          </li>
          <li>
            <span>Second-try answers</span>
            <strong>{summary.correctSecondTry}</strong>
          </li>
          <li>
            <span>Missed</span>
            <strong>{summary.missed}</strong>
          </li>
        </ul>
        {node && (
          <p className="panel-hint">
            {result.cleared
              ? node.kind === 'boss'
                ? 'The Sovereign yields to clear thinking.'
                : node.synopsis
              : 'Try again from the map — first-try answers restore more harmony and XP.'}
          </p>
        )}
      </section>

      {kingdomComplete && isFinal && (
        <section className="panel adventure-story-panel">
          <h3>Epilogue</h3>
          <p className="adventure-story-line">{NUMBER_KINGDOM.epilogue}</p>
        </section>
      )}

      {kingdomComplete && (
        <section className="panel adventure-world-preview">
          <h3>World unlock preview</h3>
          <p className="panel-hint">These worlds stay locked for now — preview only.</p>
          <ul className="adventure-preview-grid">
            {NUMBER_KINGDOM.worldPreviews.map((world) => (
              <li key={world.id} className="adventure-preview-card locked">
                <strong>{world.name}</strong>
                <span>{world.tagline}</span>
                <span className="adventure-locked-tag">Coming soon</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="action-row adventure-victory-actions">
        <button type="button" className="btn btn-primary btn-large" onClick={onContinueMap}>
          {result.cleared ? 'Return to map' : 'Try again from map'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  )
}
