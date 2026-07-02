export default function Header() {
  return (
    <header className="relative px-6 pt-12 pb-8 text-center border-b border-white/5 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(60,239,255,0.06), transparent)',
      }} />
      <h1 className="relative text-4xl font-extrabold tracking-tight mb-2">
        <span className="bg-gradient-to-r from-[#3cefff] to-[#7b68ee] bg-clip-text text-transparent">Vid</span>
        <span className="text-[var(--text-primary)]">2</span>
        <span className="bg-gradient-to-r from-[#7b68ee] to-[#fc2f70] bg-clip-text text-transparent">CSS</span>
      </h1>
      <p className="relative text-[var(--text-secondary)] text-sm">
        Record it. Get the code.
      </p>
    </header>
  )
}
