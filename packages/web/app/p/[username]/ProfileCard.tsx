'use client';
// ============================================================
//  NEXUS — Profile Card (Client Component)
//  The main glassmorphism card displayed when an NFC card is tapped.
//  Receives pre-fetched profile data from the Server Component parent.
// ============================================================

import React, { useState } from 'react';
import Image from 'next/image';
import { LinkButton } from './LinkButton';
import { LeadCaptureModal } from '../../../components/LeadCaptureModal';

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
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

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
            className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-40 blur-2xl"
            style={{ background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)' }}
          />
        </div>

        {/* ── Avatar & Identity Section ──────────────────────── */}
        <div className="px-6 pb-2 -mt-14 flex flex-col items-center text-center relative z-10">
          <div className="relative w-28 h-28 rounded-full border-4 border-[#0d1326] shadow-xl overflow-hidden bg-slate-800">
            <Image
              src={profile.profilePicture || avatarFallbackUrl}
              alt={`${profile.displayName}'s profile picture`}
              fill
              className="object-cover"
              sizes="112px"
              priority
            />
          </div>

          <h1 className="mt-3 text-2xl font-bold text-white tracking-tight">
            {profile.displayName}
          </h1>

          {profile.jobTitle && profile.company ? (
            <p className="text-sm font-medium text-cyan-400 mt-0.5">
              {profile.jobTitle} <span className="text-white/40">at</span> {profile.company}
            </p>
          ) : profile.jobTitle ? (
            <p className="text-sm font-medium text-cyan-400 mt-0.5">{profile.jobTitle}</p>
          ) : profile.company ? (
            <p className="text-sm font-medium text-cyan-400 mt-0.5">{profile.company}</p>
          ) : null}

          {profile.bio && (
            <p className="mt-3 text-sm text-white/70 max-w-xs leading-relaxed">
              {profile.bio}
            </p>
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

        {/* ── Contact Exchange & Add to Contacts CTAs ────────── */}
        <div className="px-4 pt-4 pb-6 space-y-3 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            id="exchange-contacts-btn"
            onClick={() => setIsLeadModalOpen(true)}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-3 font-bold text-white text-base
                       bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600
                       shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] transition cursor-pointer"
            aria-label="Exchange contacts with card owner"
          >
            <span className="text-xl">📇</span>
            <span>Exchange Contacts / Connect</span>
          </button>

          <button
            id="add-to-contacts-btn"
            onClick={handleAddToContacts}
            disabled={isDownloading}
            className="btn-cta w-full rounded-2xl py-3.5 flex items-center justify-center gap-2.5
                       font-semibold text-white/90 hover:text-white text-sm cursor-pointer border border-white/15 bg-white/5 hover:bg-white/10
                       disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition"
            aria-label="Add this person to your contacts"
          >
            {isDownloading ? (
              <>
                <svg
                  className="animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
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
                  width={18}
                  height={18}
                  aria-hidden="true"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
                </svg>
                Save vCard to Contacts
              </>
            )}
          </button>
        </div>
      </article>

      {/* Lead Capture Modal */}
      <LeadCaptureModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        targetUsername={profile.username}
        targetDisplayName={profile.displayName}
        apiUrl={apiUrl}
      />

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
