'use client';
// ============================================================
//  NEXUS — Profile Card (Client Component)
//  The main glassmorphism card displayed when an NFC card is tapped.
//  Receives pre-fetched profile data from the Server Component parent.
// ============================================================

import React, { useState } from 'react';
import Image from 'next/image';
import { LinkButton } from './LinkButton';

interface Link {
  id: string;
  platform: string;
  url: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

interface ProfileData {
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
  links: Link[];
}

interface ProfileCardProps {
  profile: ProfileData;
  apiUrl: string;
}

export function ProfileCard({ profile, apiUrl }: ProfileCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  /** Triggers the vCard download from the backend API */
  const handleAddToContacts = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`${apiUrl}/api/v1/profile/${profile.username}/vcard`);
      if (!res.ok) throw new Error('Failed to generate contact file');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.username}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('vCard download failed:', error);
      // Fallback: direct href navigation
      window.location.href = `${apiUrl}/api/v1/profile/${profile.username}/vcard`;
    } finally {
      setIsDownloading(false);
    }
  };

  /** Fallback avatar using DiceBear initials */
  const avatarFallbackUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(profile.displayName)}&backgroundColor=6451fa,22d3ee&backgroundType=gradientLinear&fontSize=40&bold=true`;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-start px-4 py-8 safe-area-top safe-area-bottom">

      {/* ── Profile Card Container ─────────────────────────── */}
      <article
        className="glass-card w-full max-w-md rounded-3xl overflow-hidden animate-scale-in"
        style={{ animationDelay: '0.1s' }}
      >

        {/* ── Header Banner ─────────────────────────────────── */}
        <div
          className="relative w-full h-28"
          style={{
            background: 'linear-gradient(135deg, #1e0d61 0%, #130d32 40%, #0d1a3a 100%)',
          }}
          aria-hidden="true"
        >
          {/* Abstract grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(100,81,250,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(100,81,250,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px',
            }}
          />
          {/* Glow orb */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       w-32 h-32 rounded-full opacity-30 blur-2xl"
            style={{ background: 'radial-gradient(circle, #6451fa 0%, transparent 70%)' }}
          />
        </div>

        {/* ── Avatar ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center -mt-14 px-6">
          <div className="avatar-ring animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="avatar-ring-inner">
              <div className="w-24 h-24 rounded-full overflow-hidden relative">
                <Image
                  src={profile.profilePicture ?? avatarFallbackUrl}
                  alt={`${profile.displayName}'s profile photo`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  priority
                />
              </div>
            </div>
          </div>

          {/* ── Identity ──────────────────────────────────────── */}
          <div className="text-center mt-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {profile.displayName}
            </h1>

            {(profile.jobTitle || profile.company) && (
              <p className="text-sm text-white/60 mt-1 font-medium">
                {[profile.jobTitle, profile.company].filter(Boolean).join(' · ')}
              </p>
            )}

            {profile.bio && (
              <p className="text-sm text-white/50 mt-3 leading-relaxed max-w-xs mx-auto">
                {profile.bio}
              </p>
            )}
          </div>

          {/* ── Company Logo ──────────────────────────────────── */}
          {profile.companyLogo && (
            <div
              className="mt-4 px-4 py-2 rounded-xl animate-fade-in-up"
              style={{
                background: 'rgba(255,255,255,0.06)',
                animationDelay: '0.25s',
              }}
            >
              <Image
                src={profile.companyLogo}
                alt={`${profile.company ?? 'Company'} logo`}
                width={120}
                height={36}
                className="object-contain max-h-8 opacity-80"
              />
            </div>
          )}

          {/* ── Quick Contact Info ─────────────────────────────── */}
          {(profile.phone || profile.email) && (
            <div
              className="flex flex-wrap justify-center gap-2 mt-4 animate-fade-in-up"
              style={{ animationDelay: '0.28s' }}
            >
              {profile.phone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="flex items-center gap-1.5 text-xs text-white/50 
                             hover:text-cyan-400 transition-colors duration-200"
                  aria-label={`Call ${profile.phone}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width={12} height={12} aria-hidden="true">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                  {profile.phone}
                </a>
              )}
              {profile.phone && profile.email && (
                <span className="text-white/20" aria-hidden="true">·</span>
              )}
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-1.5 text-xs text-white/50 
                             hover:text-nexus-400 transition-colors duration-200 truncate max-w-[160px]"
                  aria-label={`Email ${profile.email}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width={12} height={12} aria-hidden="true">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  {profile.email}
                </a>
              )}
            </div>
          )}
        </div>

        {/* ── Divider ───────────────────────────────────────── */}
        <div className="mx-6 mt-6 mb-0 h-px bg-white/10" aria-hidden="true" />

        {/* ── Social Links Section ───────────────────────────── */}
        {profile.links.length > 0 && (
          <section className="px-4 pt-4 pb-2" aria-label="Social links">
            <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest px-2 mb-3">
              Connect
            </h2>
            <div className="flex flex-col gap-2">
              {profile.links.map((link, index) => (
                <LinkButton
                  key={link.id}
                  linkId={link.id}
                  apiUrl={apiUrl}
                  platform={link.platform}
                  url={link.url}
                  label={link.label}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Add to Contacts CTA ───────────────────────────── */}
        <div className="px-4 pt-4 pb-6 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            id="add-to-contacts-btn"
            onClick={handleAddToContacts}
            disabled={isDownloading}
            className="btn-cta w-full rounded-2xl py-4 flex items-center justify-center gap-3
                       font-semibold text-white text-base cursor-pointer
                       disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            aria-label="Add this person to your contacts"
          >
            {isDownloading ? (
              <>
                <svg
                  className="animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  width={20}
                  height={20}
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating Contact...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width={20}
                  height={20}
                  aria-hidden="true"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
                Add to Contacts
              </>
            )}
          </button>
        </div>
      </article>

      {/* ── TAGIT Branding Footer ──────────────────────────── */}
      <footer
        className="mt-8 flex flex-col items-center gap-1 animate-fade-in"
        style={{ animationDelay: '0.7s' }}
      >
        <p className="text-xs text-white/25">Powered by</p>
        <span className="gradient-text text-sm font-black tracking-widest">
          TAGIT
        </span>
      </footer>
    </main>
  );
}
