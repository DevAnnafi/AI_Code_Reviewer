'use client'
import { useState, useRef, useCallback } from 'react'
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

const LANGUAGE_MAP: Record<string, string> = {
  'py': 'python', 'js': 'javascript', 'ts': 'typescript',
  'go': 'go', 'java': 'java', 'rs': 'rust',
  'c': 'c', 'cpp': 'cpp', 'rb': 'ruby', 'php': 'php',
}

export default function Home() {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('python')
  const [filename, setFilename] = useState('')
  const [context, setContext] = useState('')
  const [result, setResult] = useState<ReviewResult | null>(null)
  const [streaming, setStreaming] = useState(false)
  const [rawChunks, setRawChunks] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'paste' | 'upload'>('paste')
  const wsRef = useRef<WebSocket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const detectedLang = LANGUAGE_MAP[ext] ?? 'plaintext'
    setUploadedFile(file)
    setFilename(file.name)
    setLanguage(detectedLang)

    // also load into editor for preview
    const reader = new FileReader()
    reader.onload = (e) => setCode(e.target?.result as string ?? '')
    reader.readAsText(file)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const startReview = async () => {
    setResult(null)
    setRawChunks('')
    setStreaming(true)

    if (mode === 'upload' && uploadedFile) {
      // use REST upload endpoint for file mode
      const formData = new FormData()
      formData.append('file', uploadedFile)
      if (context) formData.append('context', context)

      try {
        const res = await fetch('http://localhost:8000/api/review/upload', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        setResult({ ...data, language })
      } catch (e) {
        console.error(e)
      } finally {
        setStreaming(false)
      }
      return
    }

    // paste mode — use WebSocket for streaming
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

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">AI Code Reviewer</h1>
          <p className="text-gray-400 text-sm mt-1">Security-focused analysis powered by Claude</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left panel */}
          <div className="flex flex-col gap-3">

            {/* Mode toggle */}
            <div className="flex bg-gray-800 rounded-lg p-1 w-fit gap-1">
              {(['paste', 'upload'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    mode === m ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {m === 'paste' ? 'Paste Code' : 'Upload File'}
                </button>
              ))}
            </div>

            {mode === 'upload' ? (
              /* Drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-950'
                    : uploadedFile
                    ? 'border-green-600 bg-green-950'
                    : 'border-gray-600 hover:border-gray-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".py,.js,.ts,.go,.java,.rs,.c,.cpp,.rb,.php"
                  onChange={onFileInput}
                />
                {uploadedFile ? (
                  <div>
                    <p className="text-green-400 font-medium">{uploadedFile.name}</p>
                    <p className="text-gray-400 text-sm mt-1">{language} · {(uploadedFile.size / 1024).toFixed(1)}kb</p>
                    <p className="text-gray-500 text-xs mt-2">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-300 font-medium">Drop a file here</p>
                    <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                    <p className="text-gray-600 text-xs mt-3">.py .js .ts .go .java .rs .c .cpp .rb .php</p>
                  </div>
                )}
              </div>
            ) : (
              /* Editor mode */
              <>
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
                <div className="rounded-lg overflow-hidden border border-gray-700">
                  <Editor
                    height="440px"
                    language={language}
                    value={code}
                    onChange={v => setCode(v ?? '')}
                    theme="vs-dark"
                    options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false }}
                  />
                </div>
              </>
            )}

            {/* Preview uploaded file in editor */}
            {mode === 'upload' && uploadedFile && code && (
              <div className="rounded-lg overflow-hidden border border-gray-700">
                <div className="bg-gray-800 px-3 py-1.5 text-xs text-gray-400 border-b border-gray-700">
                  Preview — {filename}
                </div>
                <Editor
                  height="300px"
                  language={language}
                  value={code}
                  theme="vs-dark"
                  options={{ fontSize: 12, minimap: { enabled: false }, readOnly: true, scrollBeyondLastLine: false }}
                />
              </div>
            )}

            <input
              placeholder="context (optional) — e.g. auth module, payment handler"
              value={context}
              onChange={e => setContext(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200"
            />

            <button
              onClick={startReview}
              disabled={streaming || (mode === 'upload' && !uploadedFile) || (mode === 'paste' && !code)}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors"
            >
              {streaming ? 'Analyzing...' : 'Review Code'}
            </button>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {streaming && !result && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Streaming response...</p>
                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">{rawChunks}</pre>
              </div>
            )}

            {result && (
              <>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Summary</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[result.overall_severity]}`}>
                      {result.overall_severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{result.summary}</p>
                </div>

                <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                  {result.findings.map((f, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[f.severity]}`}>
                          {f.severity.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{f.category}</span>
                        {f.line && <span className="text-xs text-gray-500">line {f.line}</span>}
                      </div>
                      <p className="text-sm text-gray-200 mb-2">{f.message}</p>
                      <p className="text-xs text-gray-400 border-t border-gray-700 pt-2">💡 {f.suggestion}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {!streaming && !result && (
              <div className="flex items-center justify-center h-full text-gray-600 text-sm">
                Paste code or upload a file and click Review
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}