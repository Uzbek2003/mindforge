import { NUMBER_KINGDOM } from '../../config/numberKingdom'
import type { AdventureNodeId } from '../../types/adventure'
import { Header } from '../UI'

interface AdventureMapScreenProps {
  playerLevel: number
  xpCurrent: number
  xpNeeded: number
  totalXp: number
  highestClearedIndex: number
  clearedNodeIds: AdventureNodeId[]
  kingdomComplete: boolean
  onSelectNode: (nodeId: AdventureNodeId) => void
  onBack: () => void
}

export function AdventureMapScreen({
  playerLevel,
  xpCurrent,
  xpNeeded,
  totalXp,
  highestClearedIndex,
  clearedNodeIds,
  kingdomComplete,
  onSelectNode,
  onBack,
}: AdventureMapScreenProps) {
  const xpPct = Math.min(100, Math.round((xpCurrent / xpNeeded) * 100))

  return (
    <div className="screen adventure-screen">
      <Header onHome={onBack} showHome homeLabel="Home" />

      <section className="adventure-hero">
        <p className="adventure-eyebrow">Number Kingdom map</p>
        <h2 className="adventure-title">Restore the Counting Chimes</h2>
        <div className="adventure-level-card">
          <div className="adventure-level-row">
            <strong>Keeper Level {playerLevel}</strong>
            <span>{totalXp} XP total</span>
          </div>
          <div className="adventure-xp-bar" aria-hidden="true">
            <div className="adventure-xp-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <p className="panel-hint">
            {xpCurrent} / {xpNeeded} XP to next level
          </p>
        </div>
      </section>

      <section className="adventure-node-list" aria-label="Story stages">
        {NUMBER_KINGDOM.nodes.map((node, index) => {
          const unlocked = index <= highestClearedIndex + 1
          const cleared = clearedNodeIds.includes(node.id)
          const current = unlocked && !cleared && index === Math.min(highestClearedIndex + 1, NUMBER_KINGDOM.nodes.length - 1)
          const isBoss = node.kind === 'boss'
          const isEnemy = node.kind === 'enemy'
          const stageNumber =
            node.kind === 'stage'
              ? NUMBER_KINGDOM.nodes.slice(0, index + 1).filter((n) => n.kind === 'stage').length
              : 0

          return (
            <button
              key={node.id}
              type="button"
              className={[
                'adventure-node-card',
                cleared ? 'cleared' : '',
                current ? 'current' : '',
                !unlocked ? 'locked' : '',
                isBoss ? 'boss' : '',
                isEnemy ? 'enemy' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={!unlocked}
              onClick={() => onSelectNode(node.id)}
            >
              <span className="adventure-node-icon" aria-hidden="true">
                {node.enemy.icon}
              </span>
              <span className="adventure-node-body">
                <span className="adventure-node-meta">
                  <span className={`adventure-kind-badge kind-${node.kind}`}>
                    {node.kind === 'stage'
                      ? `Stage ${stageNumber}`
                      : node.kind === 'enemy'
                        ? 'Encounter'
                        : 'Final boss'}
                  </span>
                  {cleared && <span className="adventure-cleared-tag">Cleared</span>}
                  {current && <span className="adventure-current-tag">Next</span>}
                  {!unlocked && <span className="adventure-locked-tag">Locked</span>}
                </span>
                <strong className="adventure-node-name">{node.name}</strong>
                <span className="adventure-node-synopsis">{node.synopsis}</span>
              </span>
            </button>
          )
        })}
      </section>

      <section className="panel adventure-world-preview">
        <h3>Worlds beyond</h3>
        <p className="panel-hint">
          {kingdomComplete
            ? 'Number Kingdom restored — more story worlds will open here soon.'
            : 'A simple preview of future worlds. They stay locked in this prototype.'}
        </p>
        <ul className="adventure-preview-grid">
          {NUMBER_KINGDOM.worldPreviews.map((world) => (
            <li key={world.id} className="adventure-preview-card locked">
              <strong>{world.name}</strong>
              <span>{world.tagline}</span>
              <span className="adventure-locked-tag">Locked</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
