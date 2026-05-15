'use client'
import { useState, useRef } from 'react'
import Editor from '@monaco-editor/react'

interface Finding {
  line: number | null
  severity: string
  category: string
  message: string
  suggestion: string
}

interface ReviewResult {
  findings: Finding[]
  summary: string
  overall_severity: string
  language: string
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border border-red-200',
  high:     'bg-orange-100 text-orange-800 border border-orange-200',
  medium:   'bg-yellow-100 text-yellow-800 border border-yellow-200',
  low:      'bg-blue-100 text-blue-800 border border-blue-200',
  info:     'bg-gray-100 text-gray-700 border border-gray-200',
}

export default function Home() {
  const [code, setCode] = useState('# paste your code here')
  const [language, setLanguage] = useState('python')
  const [filename, setFilename] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [rawChunks, setRawChunks] = useState('')
  const wsRef = useRef<WebSocket | null>(null)

  const startReview = () => {
    setResult(null)
    setRawChunks('')
    setStreaming(true)

    const ws = new WebSocket('ws://localhost:8000/ws/review')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ code, language, filename, context }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'chunk') {
        setRawChunks(prev => prev + data.content)
      } else if (data.type === 'done') {
        setResult({ ...data.result, language })
        setStreaming(false)
      } else if (data.type === 'error') {
        console.error(data.detail)
        setStreaming(false)
      }
    }

    ws.onclose = () => setStreaming(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">AI Code Reviewer</h1>
          <p className="text-gray-400 text-sm mt-1">Security-focused analysis powered by Claude</p>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* Left — editor panel */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200"
              >
                {['python','javascript','typescript','go','java','rust','c','cpp'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <input
                placeholder="filename (optional)"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 flex-1"
              />
            </div>
            <input
              placeholder="context (optional) — e.g. auth module, payment handler"
              value={context}
              onChange={e => setContext(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200"
            />
            <div className="rounded-lg overflow-hidden border border-gray-700">
              <Editor
                height="480px"
                language={language}
                value={code}
                onChange={v => setCode(v ?? '')}
                theme="vs-dark"
                options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            </div>
            <button
              onClick={startReview}
              disabled={streaming}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors"
            >
              {streaming ? 'Analyzing...' : 'Review Code'}
            </button>
          </div>

          {/* Right — results panel */}
          <div className="flex flex-col gap-4">
            {streaming && !result && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Streaming response...</p>
                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">{rawChunks}</pre>
              </div>
            )}

            {result && (
              <>
                {/* Summary */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Summary</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[result.overall_severity]}`}>
                      {result.overall_severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{result.summary}</p>
                </div>

                {/* Findings */}
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] pr-1">
                  {result.findings.map((f, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[f.severity]}`}>
                          {f.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                          {f.category}
                        </span>
                        {f.line && (
                          <span className="text-xs text-gray-500">line {f.line}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 mb-2">{f.message}</p>
                      <p className="text-xs text-gray-400 border-t border-gray-700 pt-2">
                        💡 {f.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!streaming && !result && (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Paste code and click Review
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}