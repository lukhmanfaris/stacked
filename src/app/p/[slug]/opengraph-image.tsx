import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function OGImage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: link } = await supabase
    .from('shared_links')
    .select('title, description, view_count')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  const title = link?.title ?? 'Bookmark collection'
  const description = link?.description ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
          padding: '64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Grid decoration */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Stacked wordmark */}
        <div
          style={{
            position: 'absolute',
            top: '64px',
            left: '64px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '14px', height: '14px', backgroundColor: '#0a0a0a', borderRadius: '2px' }} />
          </div>
          <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, letterSpacing: '-0.02em' }}>
            stacked
          </span>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
          <h1
            style={{
              margin: 0,
              fontSize: title.length > 40 ? '48px' : '64px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: '24px',
                color: '#737373',
                lineHeight: 1.4,
                maxWidth: '800px',
              }}
            >
              {description.length > 120 ? description.slice(0, 120) + '…' : description}
            </p>
          )}
          <p style={{ margin: 0, fontSize: '16px', color: '#404040' }}>
            stacked.app/p/{slug}
          </p>
        </div>
      </div>
    ),
    { ...size },
  )
}
