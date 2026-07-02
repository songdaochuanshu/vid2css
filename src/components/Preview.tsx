import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'

interface Props {
  css: string
}

export default function Preview({ css }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    // 移除旧 style
    styleRef.current?.remove()
    // 注入新 style
    const style = document.createElement('style')
    style.textContent = css
    document.head.appendChild(style)
    styleRef.current = style
    return () => { style.remove() }
  }, [css])

  function handleCopy() {
    navigator.clipboard.writeText(css).then(() => {
      toast.success('CSS copied!', {
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

  return (
    <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Preview</h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#3cefff] text-black hover:brightness-110 transition-all"
        >
          Copy CSS
        </button>
      </div>
      <div
        ref={containerRef}
        className="flex items-center justify-center min-h-[200px] p-8 bg-gradient-to-b from-[#111118] to-[var(--bg-card)]"
      >
        <div className="preview-target" dangerouslySetInnerHTML={{ __html: '<!-- 动画预览区域 -->' }} />
      </div>
    </div>
  )
}
