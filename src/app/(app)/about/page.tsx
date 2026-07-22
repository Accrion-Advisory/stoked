'use client'
import { useRouter } from 'next/navigation'

export default function AboutPage() {
  const router = useRouter()
  return (
    <div className="mb-nav" style={{ padding: '52px 20px 0' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 20, fontSize: 14, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
        Back
      </button>

      {/* STOKED */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-primary)' }}>ST</span>
          <span style={{ color: 'var(--green)' }}>O</span>
          <span style={{ color: 'var(--text-primary)' }}>KED</span>
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
          Private investing circles for serious retail investors. Share your portfolio with your
          group and with people you trust — track everyone&apos;s conviction, together.
        </div>
      </div>

      {/* Accrion parent brand */}
      <div className="surface" style={{ borderRadius: 20, padding: '30px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 22 }}>
          A product of
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span className="accrion-chip" style={{ width: 76, height: 76, borderRadius: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/accrion/logo-mark.png" alt="Accrion" style={{ width: 54, height: 'auto' }} />
          </span>
          <span className="accrion-gradient-text" style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }}>Accrion</span>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginTop: 22 }}>
          <span className="accrion-gradient-text" style={{ fontWeight: 800 }}>Accrion</span> builds
          thoughtful tools and experiences for the modern Indian investor. STOKED is part of that mission.
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-tertiary)' }}>
        © {new Date().getFullYear()} Accrion · All rights reserved
      </div>
    </div>
  )
}
