// ============================================================
//  TAGIT — Public Profile / Portfolio Page (Server Component)
//  Route: /p/[username]
//
//  Decision logic:
//   1. Fetch profile data from the backend
//   2. If the profile has a published portfolio → render PortfolioView
//   3. Otherwise → render the classic ProfileCard (backward compatible)
// ============================================================

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileCard } from './ProfileCard';
import { StealthPlaceholder } from './StealthPlaceholder';
import PortfolioView from './PortfolioView';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface PageProps {
  params: { username: string };
}

/** Shape returned by GET /api/v1/profile/:username */
interface ProfileApiResponse {
  success: boolean;
  data?: {
    id: string;
    username: string;
    displayName: string;
    bio?: string | null;
    phone?: string | null;
    email?: string | null;
    company?: string | null;
    jobTitle?: string | null;
    website?: string | null;
    profilePicture?: string | null;
    companyLogo?: string | null;
    status: 'ACTIVE' | 'SUSPENDED' | 'STEALTH';
    tapCount: number;
    links: Array<{
      id: string;
      platform: string;
      url: string;
      label: string;
      sortOrder: number;
      isActive: boolean;
    }>;
  };
  error?: string;
  message?: string;
}

/** Shape returned by GET /api/v1/portfolio/:username */
interface PortfolioApiResponse {
  success: boolean;
  data?: {
    portfolio: {
      id: string;
      theme: 'MIDNIGHT_LUXE' | 'ARCTIC_FROST' | 'SUNSET_EMBER' | 'OCEAN_DEPTH' | 'MONOCHROME_ELITE' | 'PURE_LIGHT';
      primaryColor: string;
      accentColor: string;
      headline?: string | null;
      subheadline?: string | null;
      ctaText?: string | null;
      ctaUrl?: string | null;
      heroImageUrl?: string | null;
      sections: Array<{
        id: string;
        type: string;
        title?: string | null;
        sortOrder: number;
        isVisible: boolean;
        content: Record<string, unknown>;
      }>;
    };
    profile: {
      displayName: string;
      jobTitle?: string | null;
      email?: string | null;
      phone?: string | null;
      profilePicture?: string | null;
    };
  };
  error?: string;
}

/**
 * Fetches the public profile from the backend API.
 */
async function fetchProfile(
  username: string,
): Promise<ProfileApiResponse['data'] | null | 'stealth' | 'suspended'> {
  try {
    const res = await fetch(`${API_URL}/api/v1/profile/${encodeURIComponent(username)}`, {
      next: {
        revalidate: 60,
        tags: [`profile-${username}`],
      },
    });

    if (res.status === 404) return null;
    if (res.status === 403) return 'suspended';

    const json: ProfileApiResponse = await res.json();
    if (!json.success) return null;
    if (json.data?.status === 'STEALTH') return 'stealth';
    if (json.data?.status === 'SUSPENDED') return 'suspended';

    return json.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Attempts to fetch a published portfolio for the given username.
 * Returns null if the portfolio doesn't exist or isn't published.
 */
async function fetchPortfolio(username: string): Promise<PortfolioApiResponse['data'] | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/portfolio/${encodeURIComponent(username)}`, {
      next: {
        revalidate: 30, // Portfolio can change; revalidate more often
        tags: [`portfolio-${username}`],
      },
    });

    if (!res.ok) return null;

    const json: PortfolioApiResponse = await res.json();
    return json.success ? (json.data ?? null) : null;
  } catch {
    return null;
  }
}

// ── Dynamic Metadata ──────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await Promise.resolve(params);
  const [profile, portfolioData] = await Promise.all([
    fetchProfile(username),
    fetchPortfolio(username),
  ]);

  if (!profile || profile === 'stealth' || profile === 'suspended') {
    return {
      title: 'Profile Not Available | TAGIT',
      description: 'This TAGIT digital business card profile is not currently available.',
    };
  }

  if (portfolioData) {
    const { portfolio, profile: meta } = portfolioData;
    const title = `${meta.displayName}${meta.jobTitle ? ` — ${meta.jobTitle}` : ''} | Portfolio`;
    const description =
      portfolio.subheadline ??
      `Explore ${meta.displayName}'s professional portfolio — powered by TAGIT Executive NFC.`;

    return {
      title,
      description,
      openGraph: {
        type: 'profile',
        title,
        description,
        images: meta.profilePicture
          ? [{ url: meta.profilePicture, width: 400, height: 400, alt: meta.displayName }]
          : [],
      },
      twitter: { card: 'summary_large_image', title, description },
      robots: 'index, follow',
    };
  }

  // Standard card metadata
  const title = `${profile.displayName} — TAGIT Digital Card`;
  const description = profile.bio
    ? `${profile.bio.substring(0, 150)}${profile.bio.length > 150 ? '...' : ''}`
    : `Connect with ${profile.displayName}${profile.company ? ` from ${profile.company}` : ''} via TAGIT NFC Business Card.`;

  return {
    title,
    description,
    openGraph: {
      type: 'profile',
      title,
      description,
      images: profile.profilePicture
        ? [{ url: profile.profilePicture, width: 400, height: 400, alt: profile.displayName }]
        : [],
    },
    twitter: { card: 'summary', title, description, images: profile.profilePicture ? [profile.profilePicture] : [] },
    robots: 'index, follow',
  };
}

// ── Page Component ────────────────────────────────────────────

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await Promise.resolve(params);

  // Parallel fetch — profile + portfolio check
  const [profile, portfolioData] = await Promise.all([
    fetchProfile(username),
    fetchPortfolio(username),
  ]);

  // Hard 404
  if (profile === null) {
    notFound();
  }

  // STEALTH — show placeholder
  if (profile === 'stealth') {
    return <StealthPlaceholder isSuspended={false} />;
  }

  // SUSPENDED
  if (profile === 'suspended') {
    return <StealthPlaceholder isSuspended={true} />;
  }

  // ✨ EXECUTIVE PORTFOLIO — render full portfolio experience
  if (portfolioData) {
    return (
      <PortfolioView
        portfolio={portfolioData.portfolio}
        profile={portfolioData.profile}
        username={username}
      />
    );
  }

  // STANDARD CARD — render classic glassmorphism card (backward compatible)
  return <ProfileCard profile={profile as any} apiUrl={API_URL} />;
}
