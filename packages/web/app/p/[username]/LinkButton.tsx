'use client';
// ============================================================
//  NEXUS — Individual Link Button Component
//  Renders a single social/portfolio link with icon, label,
//  hover glow, and platform-specific branding.
// ============================================================

import React from 'react';
import { getPlatformIcon, platformColors } from './SocialIcons';

interface LinkButtonProps {
  linkId?: string;
  apiUrl?: string;
  platform: string;
  url: string;
  label: string;
  index: number; // For staggered animation delay
}

export function LinkButton({ linkId, apiUrl, platform, url, label, index }: LinkButtonProps) {
  const bgColor = platformColors[platform.toUpperCase()] ?? platformColors['CUSTOM'];
  const delay = Math.min(index * 0.08, 0.8); // Cap at 0.8s

  /** Triggers link click analytics asynchronously without delaying navigation */
  const handleClick = () => {
    if (linkId && apiUrl) {
      fetch(`${apiUrl}/api/v1/links/${linkId}/click`, {
        method: 'POST',
        keepalive: true,
      }).catch(() => {});
    }
  };

  /**
   * Build the correct href format.
   * Phone numbers → tel: URI, Emails → mailto: URI, Others → plain URL
   */
  const getHref = (): string => {
    if (platform === 'PHONE') {
      return url.startsWith('tel:') ? url : `tel:${url}`;
    }
    if (platform === 'EMAIL') {
      return url.startsWith('mailto:') ? url : `mailto:${url}`;
    }
    return url;
  };

  return (
    <a
      href={getHref()}
      onClick={handleClick}
      target={platform !== 'PHONE' && platform !== 'EMAIL' ? '_blank' : undefined}
      rel="noopener noreferrer"
      id={`link-${platform.toLowerCase()}-${index}`}
      className="link-btn flex items-center gap-4 w-full rounded-2xl px-4 py-3.5 
                 text-white/90 no-underline group animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
      aria-label={`Visit ${label}`}
    >
      {/* Platform Icon with coloured background */}
      <span
        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                   transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundColor: bgColor }}
      >
        {getPlatformIcon(platform, { size: 20, className: 'text-white' })}
      </span>

      {/* Label */}
      <span className="flex-1 text-sm font-semibold tracking-wide truncate">
        {label}
      </span>

      {/* Chevron Arrow */}
      <span
        className="flex-shrink-0 text-white/30 transition-all duration-300
                   group-hover:text-white/70 group-hover:translate-x-0.5"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          width={14}
          height={14}
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </a>
  );
}
