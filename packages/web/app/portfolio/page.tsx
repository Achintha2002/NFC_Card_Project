'use client';

// ============================================================
//  TAGIT — Portfolio Dashboard Page
//  Route: /portfolio
//  Protected — must be logged in and have PREMIUM or CORPORATE tier.
//  Shows the PortfolioEditor or a premium upsell CTA for FREE users.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getMyPortfolio, createPortfolio } from '../../services/api';
import PortfolioEditor from './PortfolioEditor';

export default function PortfolioPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium =
    user?.subscriptionTier === 'PREMIUM' || user?.subscriptionTier === 'CORPORATE';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login?redirect=/portfolio');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isPremium || !isAuthenticated) {
      setLoading(false);
      return;
    }

    getMyPortfolio()
      .then((res) => {
        if (res.success) {
          setPortfolio(res.data);
        } else if ((res as any)?.status !== 404) {
          // 404 is expected when no portfolio exists yet — not an error
        }
      })
      .catch(() => {
        // 404 from the API means no portfolio created yet — that's fine
      })
      .finally(() => setLoading(false));
  }, [isPremium, isAuthenticated]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await createPortfolio();
      if (res.success) {
        setPortfolio(res.data);
      } else {
        setError(res.error ?? 'Failed to create portfolio');
      }
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to create portfolio');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#080810',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: '#f0f0f8',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 48,
              height: 48,
              border: '3px solid rgba(100,81,250,0.3)',
              borderTop: '3px solid #6451fa',
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading portfolio...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ── Upsell screen for FREE users ──────────────────────────────
  if (!isPremium) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(100,81,250,0.15) 0%, #080810 60%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: '#f0f0f8',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 520 }}>
          <div style={{ fontSize: '4rem', marginBottom: 24 }}>🔒</div>
          <h1
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            Portfolio is a{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6451fa, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Premium Feature
            </span>
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            Upgrade to an Executive card to unlock your personal portfolio
            website — a stunning mini-website that visitors see when they tap
            your NFC card.
          </p>

          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: 24,
              marginBottom: 32,
              textAlign: 'left',
            }}
          >
            {[
              '✅ Full portfolio with projects, skills & testimonials',
              '✅ 5 stunning themes (Midnight Luxe, Arctic Frost…)',
              '✅ Custom brand colors',
              '✅ Animated stats counters & skill bars',
              '✅ Gallery with lightbox',
              '✅ Live at /p/your-username',
            ].map((f) => (
              <p key={f} style={{ fontSize: '0.92rem', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
                {f}
              </p>
            ))}
          </div>

          <a
            href="/products"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 36px',
              borderRadius: 50,
              background: 'linear-gradient(135deg, #6451fa, #22d3ee)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 32px rgba(100,81,250,0.35)',
            }}
          >
            ⚡ Upgrade to Executive
          </a>
        </div>
      </div>
    );
  }

  // ── Create portfolio CTA (premium user, no portfolio yet) ────
  if (!portfolio) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(100,81,250,0.12) 0%, #080810 60%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          color: '#f0f0f8',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: '4rem', marginBottom: 24 }}>🚀</div>
          <h1
            style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            Create Your{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6451fa, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Portfolio
            </span>
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            You're an Executive member! Build your personal portfolio — a stunning
            website visitors see when they tap your NFC card.
          </p>

          {error && (
            <p
              style={{
                color: '#f87171',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: '0.88rem',
                marginBottom: 20,
              }}
            >
              {error}
            </p>
          )}

          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: '14px 40px',
              borderRadius: 50,
              border: 'none',
              cursor: 'pointer',
              background: creating ? 'rgba(100,81,250,0.4)' : 'linear-gradient(135deg, #6451fa, #22d3ee)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1rem',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 32px rgba(100,81,250,0.35)',
              transition: 'opacity 0.2s',
              opacity: creating ? 0.7 : 1,
            }}
          >
            {creating ? '⏳ Creating...' : '✨ Create My Portfolio'}
          </button>
        </div>
      </div>
    );
  }

  // ── Portfolio Editor ─────────────────────────────────────────
  return (
    <PortfolioEditor
      initialPortfolio={portfolio}
      username={user?.profile?.username ?? 'me'}
      profile={user?.profile}
    />
  );
}
