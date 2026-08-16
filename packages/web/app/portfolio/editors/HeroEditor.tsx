'use client';
// HeroEditor.tsx — Edit hero-level portfolio data (headline, subheadline, CTA, image)

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup } from './editorStyles';

interface HeroEditorProps {
  portfolio: {
    headline?: string | null;
    subheadline?: string | null;
    ctaText?: string | null;
    ctaUrl?: string | null;
    heroImageUrl?: string | null;
  };
  onChange: (data: Partial<HeroEditorProps['portfolio']>) => void;
}

export default function HeroEditor({ portfolio, onChange }: HeroEditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={editorFieldGroup}>
        <label style={editorLabel}>Headline</label>
        <input
          style={editorInput}
          placeholder="e.g. Full-Stack Developer & Designer"
          value={portfolio.headline ?? ''}
          onChange={(e) => onChange({ headline: e.target.value })}
          maxLength={120}
        />
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
          {(portfolio.headline ?? '').length}/120
        </span>
      </div>

      <div style={editorFieldGroup}>
        <label style={editorLabel}>Subheadline</label>
        <textarea
          style={{ ...editorInput, minHeight: 80, resize: 'vertical' }}
          placeholder="e.g. Building digital experiences that matter"
          value={portfolio.subheadline ?? ''}
          onChange={(e) => onChange({ subheadline: e.target.value })}
          maxLength={200}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={editorFieldGroup}>
          <label style={editorLabel}>CTA Button Text</label>
          <input
            style={editorInput}
            placeholder="Get in Touch"
            value={portfolio.ctaText ?? ''}
            onChange={(e) => onChange({ ctaText: e.target.value })}
            maxLength={40}
          />
        </div>
        <div style={editorFieldGroup}>
          <label style={editorLabel}>CTA Link URL</label>
          <input
            style={editorInput}
            placeholder="https://..."
            value={portfolio.ctaUrl ?? ''}
            onChange={(e) => onChange({ ctaUrl: e.target.value })}
          />
        </div>
      </div>

      <div style={editorFieldGroup}>
        <label style={editorLabel}>Hero Background Image URL (optional)</label>
        <input
          style={editorInput}
          placeholder="https://..."
          value={portfolio.heroImageUrl ?? ''}
          onChange={(e) => onChange({ heroImageUrl: e.target.value })}
        />
      </div>
    </div>
  );
}
