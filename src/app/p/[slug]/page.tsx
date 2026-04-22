import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PortableTheme } from '@/components/portable/portable-theme'
import { PortableHeader } from '@/components/portable/portable-header'
import { PortableGrid } from '@/components/portable/portable-grid'
import type { SharedLink } from '@/types/shared-link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('shared_links')
    .select('title, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!link) return { title: 'Not found' }

  return {
    title: link.title ?? 'Bookmark collection',
    description: link.description ?? undefined,
    openGraph: {
      title: link.title ?? 'Bookmark collection',
      description: link.description ?? undefined,
    },
  }
}

export default async function PublicSharedLinkPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch shared link (anon RLS allows is_active = true)
  const { data: link } = await supabase
    .from('shared_links')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!link) notFound()

  const sharedLink = link as SharedLink

  // Fetch bookmarks for this collection
  let bookmarksQuery = supabase
    .from('bookmarks')
    .select('id, url, title, domain, description, favicon_url, tags')
    .eq('user_id', sharedLink.user_id)
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (sharedLink.category_ids.length > 0) {
    bookmarksQuery = bookmarksQuery.in('category_id', sharedLink.category_ids)
  }

  const { data: bookmarks } = await bookmarksQuery

  // Increment view count (fire and forget)
  await supabase.rpc('increment_shared_link_views', { link_id: sharedLink.id })

  const bms = bookmarks ?? []

  return (
    <PortableTheme theme={sharedLink.theme}>
      <main className="mx-auto max-w-5xl">
        <PortableHeader
          title={sharedLink.title}
          description={sharedLink.description}
          viewCount={sharedLink.view_count + 1}
          linkCount={bms.length}
          theme={sharedLink.theme}
        />

        <section className="px-4 pb-16 sm:px-6">
          <PortableGrid
            bookmarks={bms}
            layout={sharedLink.layout}
            theme={sharedLink.theme}
            showFavicons={sharedLink.show_favicons}
            showDescriptions={sharedLink.show_descriptions}
            showTags={sharedLink.show_tags}
          />
        </section>

        <footer className="border-t px-4 py-6 sm:px-6" style={{ borderColor: sharedLink.theme === 'dark' ? '#262626' : '#f3f4f6' }}>
          <p className="text-center text-xs" style={{ color: sharedLink.theme === 'dark' ? '#404040' : '#d1d5db' }}>
            Powered by{' '}
            <a
              href="/"
              className="hover:underline"
              style={{ color: sharedLink.theme === 'dark' ? '#525252' : '#9ca3af' }}
            >
              Stacked
            </a>
          </p>
        </footer>
      </main>
    </PortableTheme>
  )
}
