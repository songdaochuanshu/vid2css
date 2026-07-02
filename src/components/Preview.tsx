import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'react-hot-toast'

interface Props {
  css: string
}

// 从 CSS 中提取选择器，生成预览用的占位 HTML
function generatePreviewHtml(css: string): string {
  const elements: string[] = []
  const seen = new Set<string>()

  // 匹配选择器：.class、#id、tag（排除 @keyframes 和注释）
  const selectorRegex = /^\s*([.#]?[a-zA-Z_][\w-]*)\s*\{/gm
  let match

  while ((match = selectorRegex.exec(css)) !== null) {
    const raw = match[1].trim()

    // 跳过 @keyframes 内的百分比、@media 等
    if (/^\d/.test(raw) || raw.startsWith('@')) continue

    const key = raw.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    if (raw.startsWith('.')) {
      // class selector
      const cls = raw.slice(1)
      if (cls === 'preview-target') continue
      elements.push('<div class="' + cls + '">' + cls + '</div>')
    } else if (raw.startsWith('#')) {
      const id = raw.slice(1)
      elements.push('<div id="' + id + '">' + id + '</div>')
    } else {
      // tag selector - 只保留合理的 HTML 标签
      const validTags = ['div', 'button', 'span', 'p', 'h1', 'h2', 'h3', 'a', 'input', 'section', 'article']
      if (validTags.includes(raw)) {
        elements.push('<' + raw + '>' + raw + '</' + raw + '>')
      } else {
        elements.push('<div class="' + raw + '">' + raw + '</div>')
      }
    }
  }

  if (elements.length === 0) {
    return '<div style="color:#5c5c72;font-size:0.85rem;">No previewable elements found in CSS.</div>'
  }

  return '<div style="display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:center;">'
    + elements.join('\n')
    + '</div>'
}

export default function Preview({ css }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  const previewHtml = useMemo(() => generatePreviewHtml(css), [css])

  useEffect(() => {
    styleRef.current?.remove()
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
        dangerouslySetInnerHTML={{ __html: previewHtml }}
      />
    </div>
  )
}
