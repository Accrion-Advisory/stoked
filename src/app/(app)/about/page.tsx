'use client'
import { useRouter } from 'next/navigation'
import { StokedMark } from '@/components/brand/StokedLogo'

const POINTS = [
  { icon: '🔒', title: 'Private by default', desc: 'Your holdings are visible only to the circles you join and the people you accept — enforced in the database.' },
  { icon: '📈', title: 'Real numbers', desc: 'Live NSE & BSE prices, true P&L, and annualized XIRR for you and every member.' },
  { icon: '💬', title: 'Conviction, shared', desc: 'Every trade can carry a note, so your circle sees the “why”, not just the “what”.' },
]

export default function AboutPage() {
  const router = useRouter()
  return (
    <div className="mb-nav" style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 52px) 20px 0' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 24, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
        Back
      </button>

      {/* STOKED hero */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <StokedMark size={64} style={{ margin: '0 auto 18px' }} />
        <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 10 }}>
          <span style={{ color: 'var(--text-primary)' }}>ST</span>
          <span style={{ color: 'var(--green)' }}>O</span>
          <span style={{ color: 'var(--text-primary)' }}>KED</span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
          Private investing circles for serious Indian retail investors. Share your portfolio with your
          group and the people you trust — and track everyone&apos;s conviction, together.
        </div>
      </div>

      {/* Points */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {POINTS.map((p) => (
          <div key={p.title} className="surface" style={{ borderRadius: 16, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--green-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{p.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Accrion parent brand */}
      <div className="surface" style={{ borderRadius: 20, padding: '30px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 22 }}>A product of</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span className="accrion-chip" style={{ width: 72, height: 72, borderRadius: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/accrion/logo-mark.png" alt="Accrion" style={{ width: 52, height: 'auto' }} />
          </span>
          <span className="accrion-gradient-text" style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em' }}>Accrion</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 20 }}>
          <span className="accrion-gradient-text" style={{ fontWeight: 800 }}>Accrion</span> builds thoughtful
          tools and experiences for the modern Indian investor. STOKED is part of that mission.
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
        © {new Date().getFullYear()} Accrion · All rights reserved<br />
        Markets involve risk. STOKED is a tracking tool, not investment advice.
      </div>
    </div>
  )
}
