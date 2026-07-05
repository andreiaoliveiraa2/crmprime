'use client'

import { useState, useEffect } from 'react'

const verses = [
  { text: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { text: "O Senhor é o meu pastor e nada me faltará.", ref: "Salmos 23:1" },
  { text: "Porque Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio.", ref: "2 Timóteo 1:7" },
  { text: "Entrega o teu caminho ao Senhor, confia nele, e ele tudo fará.", ref: "Salmos 37:5" },
  { text: "Seja forte e corajosa! Não se apavore, nem desanime, pois o Senhor estará com você.", ref: "Josué 1:9" },
  { text: "Porque eu bem sei os planos que tenho para vocês, planos de paz e não de mal.", ref: "Jeremias 29:11" },
  { text: "Deus é o nosso refúgio e a nossa fortaleza, socorro bem presente na angústia.", ref: "Salmos 46:1" },
  { text: "Confie no Senhor de todo o seu coração.", ref: "Provérbios 3:5" },
  { text: "Os que esperam no Senhor renovarão as suas forças.", ref: "Isaías 40:31" },
  { text: "O Senhor abençoe você e o guarde.", ref: "Números 6:24-25" },
  { text: "O Senhor é a minha luz e a minha salvação; de quem terei temor?", ref: "Salmos 27:1" },
  { text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", ref: "Isaías 41:10" },
  { text: "Se Deus é por nós, quem será contra nós?", ref: "Romanos 8:31" },
  { text: "A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.", ref: "Hebreus 11:1" },
  { text: "Buscai primeiro o Reino de Deus e a sua justiça.", ref: "Mateus 6:33" },
  { text: "Todas as coisas cooperam para o bem daqueles que amam a Deus.", ref: "Romanos 8:28" },
  { text: "Grandes coisas fez o Senhor por nós, por isso estamos alegres.", ref: "Salmos 126:3" },
  { text: "O choro pode durar uma noite, mas a alegria vem pela manhã.", ref: "Salmos 30:5" },
  { text: "A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.", ref: "2 Coríntios 12:9" },
  { text: "Deleita-te também no Senhor, e ele te concederá o que deseja o teu coração.", ref: "Salmos 37:4" },
]

export default function SplashScreen({ nome }: { nome: string }) {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  const today = new Date()
  const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) % verses.length
  const verse = verses[dayIndex]

  useEffect(() => {
    const shown = sessionStorage.getItem('splash-shown')
    if (shown) {
      setVisible(false)
    }
  }, [])

  function playSound() {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.1)
      gain.gain.linearRampToValueAtTime(0.12, now + i * 0.1 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5)
      osc.start(now + i * 0.1)
      osc.stop(now + i * 0.1 + 0.5)
    })
  }

  function handleEnter() {
    playSound()
    setFading(true)
    sessionStorage.setItem('splash-shown', '1')
    setTimeout(() => setVisible(false), 800)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700"
      style={{
        backgroundColor: '#2d1f4e',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              backgroundColor: 'rgba(184,154,106,0.6)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Logo placeholder */}
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'linear-gradient(135deg, #5b3fb5, #b89a6a)',
          boxShadow: '0 0 60px rgba(91,63,181,0.5), 0 0 120px rgba(184,154,106,0.2)',
          animation: 'splashPulse 2s ease-in-out infinite',
        }}
      >
        <span className="text-white font-extrabold text-lg tracking-tight">MPA</span>
      </div>

      <h2
        className="text-3xl font-extrabold mb-2"
        style={{
          background: 'linear-gradient(90deg, #c9a0ff, #d4a843)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Meu Dia, {nome} ☀️
      </h2>

      <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Sua equipe digital já está trabalhando
      </p>

      {/* Versículo */}
      <div
        className="max-w-md text-center px-6 py-5 rounded-2xl mb-8"
        style={{
          background: 'linear-gradient(135deg, rgba(91,63,181,0.15), rgba(184,154,106,0.1))',
          border: '1px solid rgba(91,63,181,0.25)',
        }}
      >
        <p className="text-base font-medium italic leading-relaxed" style={{ color: '#e8e4f5' }}>
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs font-bold mt-2" style={{ color: '#b89a6a' }}>— {verse.ref}</p>
      </div>

      <button
        onClick={handleEnter}
        className="px-8 py-3 rounded-full text-white font-bold text-sm transition-all hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #5b3fb5, #b89a6a)',
          boxShadow: '0 8px 30px rgba(91,63,181,0.4)',
        }}
      >
        Abrir meu dia →
      </button>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes splashPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(91,63,181,0.5); }
          50% { transform: scale(1.05); box-shadow: 0 0 100px rgba(91,63,181,0.7), 0 0 160px rgba(184,154,106,0.3); }
        }
      `}</style>
    </div>
  )
}
