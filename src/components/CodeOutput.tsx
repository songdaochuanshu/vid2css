import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Props {
  code: string
  description?: string
}

export default function CodeOutput({ code, description }: Props) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Generated Three.js Code</h3>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
        )}
      </div>
      <div className="max-h-[400px] overflow-auto">
        <SyntaxHighlighter
          language="html"
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            background: '#0d0d12',
            borderRadius: 0,
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
