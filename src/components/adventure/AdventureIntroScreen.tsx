import { NUMBER_KINGDOM } from '../../config/numberKingdom'
import { Header } from '../UI'

interface AdventureIntroScreenProps {
  playerLevel: number
  totalXp: number
  onBegin: () => void
  onBack: () => void
}

export function AdventureIntroScreen({
  playerLevel,
  totalXp,
  onBegin,
  onBack,
}: AdventureIntroScreenProps) {
  return (
    <div className="screen adventure-screen">
      <Header onHome={onBack} showHome homeLabel="Leave" />

      <section className="adventure-hero adventure-hero-intro">
        <p className="adventure-eyebrow">Story adventure</p>
        <h2 className="adventure-title">{NUMBER_KINGDOM.title}</h2>
        <p className="adventure-keeper">
          Number Keeper · Level {playerLevel} · {totalXp} XP
        </p>
      </section>

      <section className="panel adventure-story-panel">
        <h3>The Counting Chimes</h3>
        {NUMBER_KINGDOM.prologue.map((line) => (
          <p key={line} className="adventure-story-line">
            {line}
          </p>
        ))}
      </section>

      <section className="panel adventure-path-preview">
        <h3>Your path</h3>
        <ol className="adventure-path-list">
          {NUMBER_KINGDOM.nodes.map((node) => (
            <li key={node.id}>
              <span className={`adventure-kind-badge kind-${node.kind}`}>
                {node.kind === 'stage' ? 'Stage' : node.kind === 'enemy' ? 'Encounter' : 'Boss'}
              </span>
              <span>{node.name}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="action-row">
        <button type="button" className="btn btn-primary btn-large" onClick={onBegin}>
          Enter Number Kingdom
        </button>
      </div>
    </div>
  )
}
