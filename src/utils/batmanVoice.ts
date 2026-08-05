function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return []
  const voices = window.speechSynthesis.getVoices()
  return voices
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices()
  }
}

function pickBatmanVoice(): SpeechSynthesisVoice | undefined {
  const voices = loadVoices()
  const deepNames = ['david', 'mark', 'james', 'daniel', 'aaron', 'guy', 'fred', 'microsoft david']
  return (
    voices.find((v) => deepNames.some((n) => v.name.toLowerCase().includes(n))) ??
    voices.find((v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('male')) ??
    voices.find((v) => v.lang.startsWith('en-US')) ??
    voices.find((v) => v.lang.startsWith('en'))
  )
}

export function stopBatmanVoice() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function speakBatmanIncorrect(
  explanation: string,
  correctAnswer: string,
  enabled: boolean,
) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) return

  stopBatmanVoice()

  const script = [
    "I'm Batman.",
    'That answer was incorrect.',
    `The correct answer is ${correctAnswer}.`,
    explanation,
  ].join(' ')

  const utterance = new SpeechSynthesisUtterance(script)
  utterance.rate = 0.82
  utterance.pitch = 0.55
  utterance.volume = 1

  const voice = pickBatmanVoice()
  if (voice) utterance.voice = voice

  window.speechSynthesis.speak(utterance)
}
