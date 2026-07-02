import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Header from './components/Header'
import UploadZone from './components/UploadZone'
import FrameTimeline from './components/FrameTimeline'
import Preview from './components/Preview'
import CodeOutput from './components/CodeOutput'
import { extractFramesFromBlob, type Frame } from './lib/frameExtractor'
import { analyzeFrames, type AiResult } from './lib/aiEngine'

type Step = 'upload' | 'frames' | 'analyzing' | 'result'

const STORAGE_KEY = 'vid2css_api_key'

export default function App() {
  const [step, setStep] = useState<Step>('upload')
  const [frames, setFrames] = useState<Frame[]>([])
  const [selectedRange, setSelectedRange] = useState<[number, number]>([0, 0])
  const [result, setResult] = useState<AiResult | null>(null)
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      if (apiKey) {
        localStorage.setItem(STORAGE_KEY, apiKey)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch { /* ignore */ }
  }, [apiKey])

  async function handleFileSelected(file: File) {
    setError(null)
    try {
      const extracted = await extractFramesFromBlob(file, {
        intervalMs: 100,
        maxFrames: 20,
      })
      if (extracted.length === 0) {
        setError('Could not extract frames from this file.')
        return
      }
      setFrames(extracted)
      setSelectedRange([0, extracted.length - 1])
      setStep('frames')
    } catch {
      setError('Failed to process the file. Try a different format.')
    }
  }

  async function handleAnalyze() {
    if (!apiKey) {
      setError('Please enter your Agnes API key.')
      return
    }
    setStep('analyzing')
    setError(null)
    try {
      const selected = frames.slice(selectedRange[0], selectedRange[1] + 1)
      const r = await analyzeFrames(selected, apiKey)
      setResult(r)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
      setStep('frames')
    }
  }

  function handleReset() {
    setStep('upload')
    setFrames([])
    setResult(null)
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="bottom-center" />
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <label className="text-xs text-[var(--text-muted)] whitespace-nowrap">Agnes API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-secondary)] border border-white/5 text-[var(--text-primary)] outline-none focus:border-[#3cefff]/30 transition-colors"
          />
          {apiKey && (
            <span className="text-xs text-green-400/60">\u2713 saved</span>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 'upload' && (
          <UploadZone onFileSelected={handleFileSelected} />
        )}

        {(step === 'frames' || step === 'analyzing') && (
          <>
            <FrameTimeline
              frames={frames}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />
            <div className="flex gap-3">
              <button onClick={handleReset}
                className="px-4 py-2 text-sm rounded-xl border border-white/10 text-[var(--text-secondary)] hover:bg-white/[0.03] transition-all">Start Over</button>
              <button onClick={handleAnalyze} disabled={step === 'analyzing'}
                className="flex-1 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-[#3cefff] to-[#7b68ee] text-black disabled:opacity-50 transition-all">
                {step === 'analyzing' ? 'Analyzing...' : 'Generate Three.js'}
              </button>
            </div>
          </>
        )}

        {step === 'result' && result && (
          <>
            <Preview code={result.code} />
            <CodeOutput code={result.code} description={result.description} />
            <button onClick={handleReset}
              className="px-4 py-2 text-sm rounded-xl border border-white/10 text-[var(--text-secondary)] hover:bg-white/[0.03] transition-all">Start Over</button>
          </>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-white/5">
        <a href="https://github.com/songdaochuanshu/vid2css" target="_blank" className="hover:text-[var(--accent)] transition-colors">GitHub</a>{' \u00b7 '}MIT License
      </footer>
    </div>
  )
}
