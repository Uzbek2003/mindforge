import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { reportError } from './utils/errors'

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app')
}

window.addEventListener('error', (event) => {
  reportError('uncaught error', event.error ?? event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  reportError('unhandled promise rejection', event.reason)
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Cannot start QuizNova: #root element is missing from index.html')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
