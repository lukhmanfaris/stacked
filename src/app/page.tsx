import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Stacked — Your bookmarks, beautifully organized.',
  description:
    'A focused bookmark manager for people who actually use their saved links. Organize by category, monitor for broken links, share collections publicly.',
}

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div
      style={{
        background: 'var(--nd-bg)',
        color: 'var(--nd-text-primary)',
        minHeight: '100vh',
        fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
      }}
    >
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        style={{
          borderBottom: '1px solid var(--nd-border)',
          padding: '0 clamp(24px, 5vw, 48px)',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: 'var(--nd-bg)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-doto), monospace',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--nd-text-display)',
            letterSpacing: '-0.02em',
          }}
        >
          STACKED
        </span>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link
            href="/login"
            className="nd-label"
            style={{ color: 'var(--nd-text-secondary)', textDecoration: 'none' }}
          >
            SIGN IN
          </Link>
          <Link
            href="/signup"
            style={{
              background: 'var(--nd-text-display)',
              color: 'var(--nd-bg)',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '8px 20px',
              borderRadius: '999px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: 'clamp(64px, 10vh, 96px) clamp(24px, 5vw, 48px)',
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot-grid texture */}
        <div
          className="dot-grid-subtle"
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />

        {/* Tag */}
        <div
          className="nd-label"
          style={{ color: 'var(--nd-accent)', marginBottom: '32px', position: 'relative' }}
        >
          BOOKMARK MANAGER — FREE TO START
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: 'var(--font-doto), monospace',
            fontSize: 'clamp(60px, 10vw, 120px)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            fontWeight: 700,
            color: 'var(--nd-text-display)',
            margin: '0 0 40px',
            maxWidth: '760px',
            position: 'relative',
          }}
        >
          Your links,
          <br />
          finally
          <br />
          stacked.
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontSize: '18px',
            lineHeight: 1.65,
            color: 'var(--nd-text-secondary)',
            maxWidth: '480px',
            margin: '0 0 48px',
            position: 'relative',
          }}
        >
          A focused workspace for everything you&apos;ve saved. Organize by category,
          monitor for broken links, share collections publicly. Find anything
          instantly.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            flexWrap: 'wrap',
            position: 'relative',
          }}
        >
          <Link
            href="/signup"
            style={{
              background: 'var(--nd-text-display)',
              color: 'var(--nd-bg)',
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '13px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '14px 32px',
              borderRadius: '999px',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            style={{
              fontFamily: 'var(--font-space-mono), monospace',
              fontSize: '13px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--nd-text-secondary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Sign In →
          </Link>
        </div>

        {/* Stat strip */}
        <div
          style={{
            marginTop: '80px',
            paddingTop: '32px',
            borderTop: '1px solid var(--nd-border)',
            display: 'flex',
            gap: 'clamp(24px, 5vw, 56px)',
            flexWrap: 'wrap',
            position: 'relative',
          }}
        >
          {STATS.map(([value, label]) => (
            <div key={label}>
              <div
                style={{
                  fontFamily: 'var(--font-doto), monospace',
                  fontSize: '36px',
                  fontWeight: 700,
                  color: 'var(--nd-text-display)',
                  lineHeight: 1,
                  marginBottom: '6px',
                  letterSpacing: '-0.02em',
                }}
              >
                {value}
              </div>
              <div className="nd-label" style={{ color: 'var(--nd-text-disabled)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--nd-border)' }}>
        <div
          style={{
            padding: 'clamp(48px, 8vh, 80px) clamp(24px, 5vw, 48px)',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: '56px',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                fontWeight: 500,
                color: 'var(--nd-text-display)',
                letterSpacing: '-0.01em',
                margin: 0,
              }}
            >
              Features
            </h2>
            <span className="nd-label" style={{ color: 'var(--nd-text-disabled)' }}>
              06
            </span>
          </div>

          {/* Grid with hairline borders between cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
              gap: '1px',
              background: 'var(--nd-border)',
              border: '1px solid var(--nd-border)',
            }}
          >
            {FEATURES.map((feature, i) => (
              <div key={feature.title} style={{ background: 'var(--nd-bg)', padding: '32px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '12px',
                    marginBottom: '14px',
                  }}
                >
                  <span className="nd-label" style={{ color: 'var(--nd-text-disabled)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="nd-label" style={{ color: 'var(--nd-text-display)' }}>
                    {feature.title}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.65,
                    color: 'var(--nd-text-secondary)',
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT PRODUCT ────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--nd-border)' }}>
        <div
          style={{
            padding: 'clamp(48px, 8vh, 80px) clamp(24px, 5vw, 48px)',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          <div
            className="nd-label"
            style={{ color: 'var(--nd-text-secondary)', marginBottom: '40px' }}
          >
            ABOUT THE PRODUCT
          </div>

          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 52px)',
              fontWeight: 400,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: 'var(--nd-text-display)',
              maxWidth: '760px',
              margin: '0 0 48px',
            }}
          >
            Not read-later.
            <br />
            Not social bookmarking.
            <br />
            Just bookmarks — done right.
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
              gap: '40px',
              maxWidth: '880px',
              marginBottom: '64px',
            }}
          >
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.75,
                color: 'var(--nd-text-secondary)',
                margin: 0,
              }}
            >
              Most bookmark tools are designed for sharing or for reading later.
              Stacked is designed for people who actually go back to their saved links
              — developers, designers, researchers, and anyone who treats their browser
              as a working library.
            </p>
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.75,
                color: 'var(--nd-text-secondary)',
                margin: 0,
              }}
            >
              Clean organization. Keyboard-first navigation via Cmd+K. Automatic link
              health monitoring so nothing disappears quietly. Public sharing without
              friction. Free to start — no account required to view shared pages.
            </p>
          </div>

          {/* Accent CTA block */}
          <div
            style={{
              padding: '40px',
              border: '1px solid var(--nd-border-visible)',
              display: 'inline-flex',
              flexDirection: 'column',
              gap: '20px',
              minWidth: 'min(100%, 320px)',
            }}
          >
            <div className="nd-label" style={{ color: 'var(--nd-accent)' }}>
              FREE TO START
            </div>
            <p
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--nd-text-secondary)',
                margin: 0,
              }}
            >
              No credit card. No trial period.
              <br />
              Start organizing today.
            </p>
            <Link
              href="/signup"
              style={{
                background: 'var(--nd-text-display)',
                color: 'var(--nd-bg)',
                fontFamily: 'var(--font-space-mono), monospace',
                fontSize: '11px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '12px 24px',
                textDecoration: 'none',
                alignSelf: 'flex-start',
                display: 'inline-block',
              }}
            >
              Create Account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--nd-border)' }}>
        <div
          style={{
            padding: '32px clamp(24px, 5vw, 48px)',
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-doto), monospace',
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--nd-text-display)',
                letterSpacing: '-0.01em',
              }}
            >
              STACKED
            </span>
            <span className="nd-label" style={{ color: 'var(--nd-text-disabled)' }}>
              YOUR BOOKMARKS, BEAUTIFULLY ORGANIZED.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <Link
              href="/signup"
              className="nd-label"
              style={{ color: 'var(--nd-text-secondary)', textDecoration: 'none' }}
            >
              Terms
            </Link>
            <Link
              href="/signup"
              className="nd-label"
              style={{ color: 'var(--nd-text-secondary)', textDecoration: 'none' }}
            >
              Privacy
            </Link>
          </div>

          <span className="nd-label" style={{ color: 'var(--nd-text-disabled)' }}>
            © 2025 HALFX INDUSTRIES — V0.1.0
          </span>
        </div>
      </footer>
    </div>
  )
}

/* ── UX CONTENT ─────────────────────────────────────────────────────────── */

const STATS: [string, string][] = [
  ['12', 'MODULES SHIPPED'],
  ['6', 'CORE FEATURES'],
  ['FREE', 'TO START'],
  ['100%', 'YOUR DATA'],
]

const FEATURES: { title: string; description: string }[] = [
  {
    title: 'COLLECTIONS',
    description:
      'Nested categories with custom colors. Your saved links organized the way you think — not the way browsers do.',
  },
  {
    title: 'LINK HEALTH',
    description:
      'Automated checks surface broken and redirected URLs before you need them. Nothing disappears quietly.',
  },
  {
    title: 'CMD + K',
    description:
      'The entire app accessible from a single keystroke. Navigate, create, switch views, change theme — no mouse required.',
  },
  {
    title: 'INSTANT SEARCH',
    description:
      'Full-text across titles, URLs, descriptions, and tags. Filter by status, category, or pinned state. Results appear as you type.',
  },
  {
    title: 'IMPORT / EXPORT',
    description:
      'Browser HTML, CSV, JSON — in and out. Your data stays portable and is never locked into this platform.',
  },
  {
    title: 'PUBLIC PAGES',
    description:
      'Share a curated collection at a custom URL. Choose a theme. No account needed to view — just send the link.',
  },
]
