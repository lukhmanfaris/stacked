'use client'

import { Share2 } from 'lucide-react'

export default function SharedLinksPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-lg font-semibold">Shared Links</h1>
        <p className="text-sm text-muted-foreground">
          Share curated collections of bookmarks publicly.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Share2 className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Coming soon</p>
          <p className="text-xs text-muted-foreground">
            Shared links let you publish bookmark collections with a public URL.
          </p>
        </div>
      </div>
    </div>
  )
}
