import type { Frame } from '../lib/frameExtractor'

interface Props {
  frames: Frame[]
  selectedRange: [number, number]
  onRangeChange: (range: [number, number]) => void
}

export default function FrameTimeline({ frames, selectedRange, onRangeChange }: Props) {
  function handleSelect(index: number) {
    const [start, end] = selectedRange
    if (index < start) {
      onRangeChange([index, end])
    } else if (index > end) {
      onRangeChange([start, index])
    } else if (index - start <= end - index) {
      onRangeChange([index, end])
    } else {
      onRangeChange([start, index])
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[var(--bg-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Keyframes ({frames.length})
        </h3>
        <span className="text-xs text-[var(--text-muted)]">
          Frame {selectedRange[0] + 1} - {selectedRange[1] + 1} &middot;{' '}
          {((frames[selectedRange[1]]?.timestamp || 0) - (frames[selectedRange[0]]?.timestamp || 0))}ms
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-2">
        {frames.map((frame, i) => {
          const isSelected = i >= selectedRange[0] && i <= selectedRange[1]
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`
                flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200
                ${isSelected
                  ? 'border-[#3cefff] shadow-[0_0_12px_rgba(60,239,255,0.2)]'
                  : 'border-transparent opacity-50 hover:opacity-80'
                }
              `}
            >
              <img
                src={frame.dataUrl}
                alt={`Frame ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
