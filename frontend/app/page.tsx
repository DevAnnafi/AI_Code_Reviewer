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

const SEVERITY_CONFIG: Record<string, { label: string; dot: string; text: string; border: string; darkText: string; darkBorder: string }> = {
  critical: { label: 'CRIT', dot: '#ef4444', text: '#dc2626', border: 'rgba(239,68,68,0.2)', darkText: '#f87171', darkBorder: 'rgba(239,68,68,0.3)' },
  high:     { label: 'HIGH', dot: '#f97316', text: '#ea580c', border: 'rgba(249,115,22,0.2)', darkText: '#fb923c', darkBorder: 'rgba(249,115,22,0.3)' },
  medium:   { label: 'MED',  dot: '#eab308', text: '#ca8a04', border: 'rgba(234,179,8,0.2)',  darkText: '#facc15', darkBorder: 'rgba(234,179,8,0.3)'  },
  low:      { label: 'LOW',  dot: '#3b82f6', text: '#2563eb', border: 'rgba(59,130,246,0.2)', darkText: '#60a5fa', darkBorder: 'rgba(59,130,246,0.3)' },
  info:     { label: 'INFO', dot: '#6b7280', text: '#4b5563', border: 'rgba(107,114,128,0.2)',darkText: '#9ca3af', darkBorder: 'rgba(107,114,128,0.3)'},
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
  const [dark, setDark] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const d = dark

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    setUploadedFile(file)
    setFilename(file.name)
    setLanguage(LANGUAGE_MAP[ext] ?? 'plaintext')
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

  const startReview = async () => {
    setResult(null)
    setRawChunks('')
    setStreaming(true)

    if (mode === 'upload' && uploadedFile) {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      if (context) formData.append('context', context)
      try {
        const res = await fetch('http://localhost:8000/api/review/upload', { method: 'POST', body: formData })
        const data = await res.json()
        setResult({ ...data, language })
      } catch (e) { console.error(e) }
      finally { setStreaming(false) }
      return
    }

    const ws = new WebSocket('ws://localhost:8000/ws/review')
    wsRef.current = ws
    ws.onopen = () => ws.send(JSON.stringify({ code, language, filename, context }))
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'chunk') setRawChunks(prev => prev + data.content)
      else if (data.type === 'done') { setResult({ ...data.result, language }); setStreaming(false) }
      else if (data.type === 'error') { console.error(data.detail); setStreaming(false) }
    }
    ws.onclose = () => setStreaming(false)
  }

  const bg       = d ? '#0f0f0d' : '#F5F2ED'
  const surface  = d ? '#1a1a18' : '#ffffff'
  const surfaceAlt = d ? '#222220' : '#F5F2ED'
  const border   = d ? 'rgba(255,255,255,0.08)' : 'rgba(26,26,24,0.1)'
  const borderHover = d ? 'rgba(255,255,255,0.16)' : 'rgba(26,26,24,0.25)'
  const text     = d ? '#e8e5e0' : '#1a1a18'
  const textMuted = d ? 'rgba(232,229,224,0.35)' : 'rgba(26,26,24,0.35)'
  const textDim  = d ? 'rgba(232,229,224,0.18)' : 'rgba(26,26,24,0.18)'
  const inputBg  = d ? 'rgba(255,255,255,0.05)' : 'rgba(26,26,24,0.04)'
  const btnBg    = d ? '#e8e5e0' : '#1a1a18'
  const btnText  = d ? '#0f0f0d' : '#F5F2ED'
  const cardBg   = d ? '#1c1c1a' : '#ffffff'
  const summaryBg = d ? '#e8e5e0' : '#1a1a18'
  const summaryText = d ? '#1a1a18' : 'rgba(245,242,237,0.75)'
  const summaryLabel = d ? 'rgba(26,26,24,0.45)' : 'rgba(245,242,237,0.35)'
  const editorTheme = d ? 'vs-dark' : 'light'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; font-family: 'DM Sans', sans-serif; transition: background 0.25s; }
        .grain { position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0.02;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px #22c55e}50%{opacity:0.5;box-shadow:0 0 3px #22c55e} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        .finding-card { animation: slideIn 0.2s ease both; }
        .finding-card:hover { transform: translateX(2px) !important; }
        input, select { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${border}; border-radius: 4px; }
      `}</style>

      <div className="grain" />

      <div style={{ width: '100%' }}>

        {/* Topbar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 40px', borderBottom:`1px solid ${border}`, transition:'border-color 0.25s' }}>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:13, fontWeight:500, letterSpacing:'0.08em', color:text, display:'flex', alignItems:'center', gap:10, transition:'color 0.25s' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', animation:'pulse 2s ease-in-out infinite' }} />
            CODEGUARD
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted, letterSpacing:'0.05em' }}>
              AI-POWERED SECURITY ANALYSIS
            </div>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!d)}
              style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 14px', borderRadius:20, border:`1px solid ${border}`, background: inputBg, color:text, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', gap:6 }}
            >
              {d ? '○ LIGHT' : '● DARK'}
            </button>
          </div>
        </div>

        {/* Layout */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', height:'calc(100vh - 61px)', overflow:'hidden' }}>

          {/* Left panel */}
          <div style={{ padding:'32px 40px', borderRight:`1px solid ${border}`, display:'flex', flexDirection:'column', gap:20, transition:'border-color 0.25s', height:'100%', overflowY:'auto' }}>

            {/* Mode toggle */}
            <div>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.12em', color:textMuted, textTransform:'uppercase', marginBottom:8 }}>Input mode</div>
              <div style={{ display:'flex', background:inputBg, borderRadius:8, padding:3, width:'fit-content', gap:2 }}>
                {(['paste','upload'] as const).map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ fontFamily:'DM Mono, monospace', fontSize:11, fontWeight:500, letterSpacing:'0.06em', padding:'6px 18px', borderRadius:6, border:'none', cursor:'pointer', transition:'all 0.15s', background: mode === m ? btnBg : 'transparent', color: mode === m ? btnText : textMuted }}>
                    {m === 'paste' ? 'PASTE' : 'UPLOAD'}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'paste' && (
              <>
                <div style={{ display:'flex', gap:10 }}>
                  <select value={language} onChange={e => setLanguage(e.target.value)}
                    style={{ fontFamily:'DM Mono, monospace', fontSize:12, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'8px 12px', color:text, transition:'all 0.2s', cursor:'pointer' }}>
                    {['python','javascript','typescript','go','java','rust','c','cpp','ruby','php'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename.py"
                    style={{ fontFamily:'DM Mono, monospace', fontSize:12, flex:1, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'8px 12px', color:text, transition:'all 0.2s' }} />
                </div>
                <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${border}`, flex:1 }}>
                  <Editor height="420px" language={language} value={code} onChange={v => setCode(v ?? '')}
                    theme={editorTheme}
                    options={{ fontSize:12, minimap:{enabled:false}, scrollBeyondLastLine:false, fontFamily:'DM Mono, monospace', lineHeight:20 }} />
                </div>
              </>
            )}

            {mode === 'upload' && (
              <>
                <input ref={fileInputRef} type="file" style={{ display:'none' }}
                  accept=".py,.js,.ts,.go,.java,.rs,.c,.cpp,.rb,.php"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border:`1.5px dashed ${isDragging ? '#22c55e' : uploadedFile ? '#22c55e' : border}`, borderStyle: uploadedFile ? 'solid' : 'dashed', borderRadius:12, padding:'48px 24px', textAlign:'center', cursor:'pointer', transition:'all 0.2s', minHeight:200, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, background: isDragging || uploadedFile ? 'rgba(34,197,94,0.04)' : 'transparent' }}>
                  {uploadedFile ? (
                    <>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:14, fontWeight:500, color:'#22c55e' }}>{uploadedFile.name}</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted }}>{language} · {(uploadedFile.size/1024).toFixed(1)} kb</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textDim, marginTop:4 }}>click to replace</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:13, fontWeight:500, color:text }}>drop file here</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted }}>or click to browse</div>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textDim, marginTop:8 }}>py · js · ts · go · java · rs · c · cpp</div>
                    </>
                  )}
                </div>
                {uploadedFile && code && (
                  <div style={{ borderRadius:10, overflow:'hidden', border:`1px solid ${border}` }}>
                    <div style={{ padding:'8px 14px', background: d ? '#111110' : '#1a1a18', fontFamily:'DM Mono, monospace', fontSize:10, color:'rgba(245,242,237,0.3)', letterSpacing:'0.08em', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                      PREVIEW — {filename}
                    </div>
                    <Editor height="280px" language={language} value={code} theme="vs-dark"
                      options={{ fontSize:12, minimap:{enabled:false}, readOnly:true, scrollBeyondLastLine:false, fontFamily:'DM Mono, monospace', lineHeight:20 }} />
                  </div>
                )}
              </>
            )}

            <input value={context} onChange={e => setContext(e.target.value)}
              placeholder="context — e.g. auth module, payment handler"
              style={{ fontFamily:'DM Mono, monospace', fontSize:12, background:inputBg, border:`1px solid ${border}`, borderRadius:8, padding:'10px 14px', color:text, width:'100%', transition:'all 0.2s' }} />

            <button onClick={startReview}
              disabled={streaming || (mode==='upload' && !uploadedFile) || (mode==='paste' && !code)}
              style={{ fontFamily:'DM Mono, monospace', fontSize:12, fontWeight:500, letterSpacing:'0.08em', padding:'13px 24px', background: btnBg, color: btnText, border:'none', borderRadius:10, cursor:'pointer', transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: (streaming || (mode==='upload' && !uploadedFile) || (mode==='paste' && !code)) ? 0.35 : 1 }}>
              {streaming
                ? <><div style={{ width:12, height:12, border:`1.5px solid ${btnText}30`, borderTopColor:btnText, borderRadius:'50%', animation:'spin 0.7s linear infinite' }} /> ANALYZING</>
                : '→ RUN ANALYSIS'}
            </button>
          </div>

          {/* Right panel */}
          <div style={{ padding:'32px 40px', overflowY:'auto', height:'100%', background: d ? '#0f0f0d' : '#F5F2ED', transition:'background 0.25s' }}>
            {!streaming && !result && (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, opacity:0.25 }}>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:32 }}>⌥</div>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:12, color:text }}>awaiting input</div>
              </div>
            )}

            {streaming && !result && (
              <>
                <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, letterSpacing:'0.1em', color:textMuted, marginBottom:12, textTransform:'uppercase', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', animation:'pulse 1s ease-in-out infinite' }} />
                  live stream
                </div>
                <div style={{ background:'#1a1a18', borderRadius:12, padding:20, fontFamily:'DM Mono, monospace', fontSize:11, color:'#22c55e', whiteSpace:'pre-wrap', lineHeight:1.6, maxHeight:500, overflowY:'auto' }}>
                  {rawChunks}
                </div>
              </>
            )}

            {result && (() => {
              const os = SEVERITY_CONFIG[result.overall_severity] ?? SEVERITY_CONFIG.info
              return (
                <>
                  <div style={{ background:summaryBg, borderRadius:14, padding:24, marginBottom:20, transition:'background 0.25s' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                      <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.12em', color:summaryLabel, textTransform:'uppercase' }}>Analysis complete</div>
                      <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.1em', padding:'4px 10px', borderRadius:20, border:`1px solid ${d ? os.darkBorder : os.border}`, color: d ? os.darkText : os.text, whiteSpace:'nowrap', flexShrink:0 }}>
                        {os.label}
                      </span>
                    </div>
                    <div style={{ fontSize:13, color:summaryText, lineHeight:1.65, fontWeight:300 }}>{result.summary}</div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                    <div style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.12em', color:textMuted, textTransform:'uppercase' }}>Findings</div>
                    <div style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:textMuted }}>{result.findings.length} issue{result.findings.length !== 1 ? 's' : ''}</div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {result.findings.map((f, i) => {
                      const s = SEVERITY_CONFIG[f.severity] ?? SEVERITY_CONFIG.info
                      return (
                        <div key={i} className="finding-card" style={{ background:cardBg, borderRadius:12, padding:'18px 20px', border:`1px solid ${border}`, transition:'border-color 0.15s, transform 0.15s, background 0.25s' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                            <div style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
                            <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, fontWeight:500, letterSpacing:'0.1em', color: d ? s.darkText : s.text }}>{s.label}</span>
                            <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, background:inputBg, color:textMuted, padding:'2px 8px', borderRadius:4 }}>{f.category}</span>
                            {f.line && <span style={{ fontFamily:'DM Mono, monospace', fontSize:10, color:textDim, marginLeft:'auto' }}>:{f.line}</span>}
                          </div>
                          <div style={{ fontSize:13, color:text, lineHeight:1.6, marginBottom:10, fontWeight:400 }}>{f.message}</div>
                          <div style={{ fontSize:12, color:textMuted, lineHeight:1.6, borderTop:`1px solid ${border}`, paddingTop:10, fontWeight:300 }}>
                            <span style={{ color:'#22c55e', marginRight:4, fontWeight:500 }}>→</span>{f.suggestion}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </>
  )
}