export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--nd-bg)] px-4 dot-grid">
      {/* Wordmark */}
      <div className="mb-12 text-center">
        <h1
          className="font-mono text-[13px] uppercase tracking-[0.24em] text-[var(--nd-text-display)]"
        >
          Stacked
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[var(--nd-text-disabled)]">
          Bookmarks, organized.
        </p>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm rounded-[12px] border border-[var(--nd-border-visible)] bg-[var(--nd-surface)] p-8">
        {children}
      </div>

      {/* Bottom mark */}
      <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--nd-text-disabled)]">
        © Stacked
      </p>
    </div>
  )
}
