import { APP_NAME, APP_TAGLINE, APP_VERSION, SUPPORT_EMAIL } from '../constants'
import { LEGAL_SCREEN_TITLES, type LegalScreen } from '../utils/routes'
import { Header } from './UI'

interface LegalPageProps {
  type: LegalScreen
  onBack: () => void
}

export function LegalPage({ type, onBack }: LegalPageProps) {
  return (
    <div className="screen legal-screen">
      <Header onHome={onBack} showHome homeLabel="Back" />

      <article className="legal-content panel">
        <h2>{LEGAL_SCREEN_TITLES[type]}</h2>
        <p className="legal-updated">Last updated: August 4, 2026</p>

        {type === 'privacy' && (
          <>
            <section>
              <h3>Overview</h3>
              <p>
                {APP_NAME} is an educational puzzle and trivia app. We designed it to work without
                requiring an account. This policy explains what information the app handles.
              </p>
            </section>
            <section>
              <h3>Information we collect</h3>
              <p>
                We do not collect personal information such as your name, email address, phone
                number, or precise location. Puzzle progress, settings, and optional question
                reports are stored locally on your device using browser or app storage.
              </p>
            </section>
            <section>
              <h3>Local storage</h3>
              <p>
                Your completed puzzles, streaks, settings, and in-progress sessions are saved on
                your device. This data is not transmitted to our servers unless you manually export
                it.
              </p>
            </section>
            <section>
              <h3>Analytics and crash reporting</h3>
              <p>
                The current version does not use third-party analytics, advertising SDKs, or crash
                reporting services.
              </p>
            </section>
            <section>
              <h3>Data sharing</h3>
              <p>We do not sell, rent, or share your data with third parties.</p>
            </section>
            <section>
              <h3>Children</h3>
              <p>
                {APP_NAME} is intended for general audiences as an educational trivia app. It is
                not directed exclusively at children under 13, and we do not knowingly collect
                personal information from children.
              </p>
            </section>
            <section>
              <h3>Contact</h3>
              <p>
                Questions about this policy:{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              </p>
            </section>
          </>
        )}

        {type === 'terms' && (
          <>
            <section>
              <h3>Acceptance</h3>
              <p>
                By using {APP_NAME}, you agree to these Terms of Use. If you do not agree, please
                do not use the app.
              </p>
            </section>
            <section>
              <h3>Educational content</h3>
              <p>
                Questions and explanations are provided for educational and entertainment purposes.
                While we review content before release, errors may occur. Use the in-app report
                feature if you believe a question is incorrect.
              </p>
            </section>
            <section>
              <h3>License</h3>
              <p>
                We grant you a personal, non-commercial license to use the app. You may not copy,
                reverse engineer, or redistribute the app except as allowed by applicable law.
              </p>
            </section>
            <section>
              <h3>Disclaimer</h3>
              <p>
                The app is provided &quot;as is&quot; without warranties of any kind. We are not
                liable for any loss of locally stored progress or device-related issues.
              </p>
            </section>
            <section>
              <h3>Changes</h3>
              <p>We may update these terms. Continued use after changes means you accept the updated terms.</p>
            </section>
          </>
        )}

        {type === 'about' && (
          <>
            <section>
              <h3>{APP_NAME}</h3>
              <p>{APP_TAGLINE}</p>
              <p>Version {APP_VERSION}</p>
            </section>
            <section>
              <h3>What you get</h3>
              <ul>
                <li>100 puzzles across Math, Science, History, and Computer Science</li>
                <li>Easy, Medium, and Hard difficulty levels</li>
                <li>Hints, explanations, and progress tracking</li>
                <li>No ads and no account required</li>
              </ul>
            </section>
            <section>
              <h3>Offline use</h3>
              <p>
                The mobile app bundles all puzzle content locally, so you can play without an
                internet connection after installation.
              </p>
            </section>
          </>
        )}

        {type === 'contact' && (
          <>
            <section>
              <h3>Support</h3>
              <p>
                Need help, found a wrong answer, or have feedback? Email us at{' '}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
              </p>
            </section>
            <section>
              <h3>Report a question</h3>
              <p>
                During gameplay, tap &quot;Report incorrect question&quot; to open your email app with
                the puzzle ID, question, selected answer, and correct answer prefilled.
              </p>
            </section>
            <section>
              <h3>Response time</h3>
              <p>We aim to respond to support requests within 3 business days.</p>
            </section>
          </>
        )}
      </article>
    </div>
  )
}
