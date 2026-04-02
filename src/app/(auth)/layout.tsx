export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Stacked</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your bookmarks, beautifully organized.
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
