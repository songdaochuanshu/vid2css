import { useRef } from 'react'
import { toast } from 'react-hot-toast'

interface Props {
  code: string
}

export default function Preview({ code }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Build sandboxed iframe with the Three.js HTML content
  const srcdoc = '<!DOCTYPE html>' + code.replace(/<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>/i, '').replace(/<\/html>/i, '').replace(/<\/body>/i, '')
    || '<html><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;color:#555;font-family:sans-serif;"><p>No preview available</p></body></html>'

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('Three.js code copied!', {
        style: {
          background: '#16161e',
          color: '#eeeef0',
          border: '1px solid rgba(60, 239, 255, 0.2)',
          borderRadius: '10px',
          fontSize: '0.85rem',
        },
      })
    })
  }

  function handleOpenFull() {
    const blob = new Blob([code], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Three.js Preview</h3>
        <div className="flex gap-2">
          <button
            onClick={handleOpenFull}
            className="px-3 py-1 text-xs font-semibold rounded-lg border border-white/10 text-[var(--text-secondary)] hover:bg-white/[0.05] transition-all"
          >
            Full Screen
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#3cefff] text-black hover:brightness-110 transition-all"
          >
            Copy Code
          </button>
        </div>
      </div>
      <div className="relative bg-[#0a0a0f]">
        <iframe
          ref={iframeRef}
          srcDoc={srcdoc}
          sandbox="allow-scripts allow-same-origin"
          className="w-full border-0"
          style={{ height: '400px' }}
          title="Three.js Preview"
        />
      </div>
    </div>
  )
}
