import { useState, useRef } from 'react'

interface Props {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export default function UploadZone({ onFileSelected, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith('video/') || file.type === 'image/gif')) {
      onFileSelected(file)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${isDragging
          ? 'border-[#3cefff] bg-[#3cefff]/5 shadow-[0_0_40px_rgba(60,239,255,0.08)]'
          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
        }
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/gif"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="text-4xl mb-3">🎬</div>
      <p className="text-[var(--text-primary)] font-medium mb-1">
        Drop a video or GIF here
      </p>
      <p className="text-[var(--text-muted)] text-sm">
        or click to browse &middot; MP4, WebM, GIF
      </p>
    </div>
  )
}
