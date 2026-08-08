import { Capacitor } from '@capacitor/core'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { migrateQuizNovaStorageKeys } from './utils/storageMigration'

migrateQuizNovaStorageKeys()

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('native-app')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
