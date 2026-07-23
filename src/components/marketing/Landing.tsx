import Link from 'next/link'
import { StokedMark } from '@/components/brand/StokedLogo'
import { AccrionBadge } from '@/components/brand/AccrionBadge'

const GRAD = 'linear-gradient(120deg, #2BE089 0%, #17BE6B 100%)'

const FEATURES = [
  { icon: '🔒', title: 'Your circle, your rules', desc: 'Create a private group or connect 1-on-1. Your portfolio is only ever visible to the people you invite — no one else.' },
  { icon: '📈', title: 'See the whole picture', desc: 'Live NSE & BSE prices, real P&L, and annualized XIRR for every member. The numbers everyone actually cares about.' },
  { icon: '💬', title: 'Conviction, not just prices', desc: 'Every trade can carry a note. See who’s buying what — and, more importantly, why.' },
  { icon: '🏆', title: 'Leaderboards that matter', desc: 'Rank your circle by real annualized returns, not hype or screenshots.' },
]

const STEPS = [
  { n: '1', t: 'Start a circle', d: 'Create a group and share a secure invite, or connect with a friend.' },
  { n: '2', t: 'Log your trades', d: 'Add your NSE/BSE buys and sells — with the price, date, and your reasoning.' },
  { n: '3', t: 'Grow together', d: 'Everyone’s portfolios, P&L and leaderboards update live.' },
]

export default function Landing({ loginHref, signupHref }: { loginHref: string; signupHref: string }) {
  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 40 }}>
      {/* Sticky header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 18px 12px', background: 'rgba(10,11,15,0.72)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StokedMark size={24} />
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em' }}>STOKED</span>
        </div>
        <Link href={loginHref}>
          <button style={{ background: GRAD, color: '#04120A', fontWeight: 700, fontSize: 14, padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'Satoshi, sans-serif', boxShadow: '0 6px 18px -8px rgba(33,208,122,0.6)' }}>Login</button>
        </Link>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '48px 24px 12px' }}>
        <StokedMark size={72} className="logo-pulse" style={{ margin: '0 auto 24px' }} />
        <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
          Invest together.<br />
          <span style={{ background: GRAD, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' }}>Win together.</span>
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 340, margin: '0 auto 28px' }}>
          A private investing circle for serious Indian retail investors. Share your portfolio, track everyone’s conviction, and grow as a group.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
          <Link href={signupHref}><button className="btn-primary">Get started — it’s free</button></Link>
          <Link href={loginHref}><button className="btn-secondary">I already have an account</button></Link>
        </div>
      </section>

      {/* Trust strip */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '20px', color: 'var(--text-tertiary)', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em' }}>
        <span>🇮🇳 NSE + BSE</span>
        <span>·</span>
        <span>Live prices</span>
        <span>·</span>
        <span>Private by default</span>
      </div>

      {/* Features */}
      <section style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FEATURES.map((f) => (
          <div key={f.title} className="surface" style={{ borderRadius: 18, padding: '18px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{f.title}</div>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={{ padding: '36px 20px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', textAlign: 'center', marginBottom: 24 }}>How it works</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', border: '1.5px solid var(--green)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{s.t}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy reassurance */}
      <section style={{ padding: '36px 20px 0' }}>
        <div className="surface" style={{ borderRadius: 20, padding: '26px 22px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 90% at 50% 0%, rgba(33,208,122,0.14), transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>🛡️</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Private, always</div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
              Your holdings are never public. They’re shared only with the circles you join and the people you accept — enforced at the database level.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '40px 24px 8px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10 }}>Start your circle today</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>Free to join. Takes a minute.</p>
        <Link href={signupHref}><button className="btn-primary" style={{ maxWidth: 320, margin: '0 auto' }}>Create your account</button></Link>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 36, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 20px 0' }}>
        <AccrionBadge />
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.6 }}>
          © {new Date().getFullYear()} Accrion · STOKED<br />
          Markets involve risk. STOKED is a tracking tool, not investment advice.
        </div>
      </footer>
    </div>
  )
}
