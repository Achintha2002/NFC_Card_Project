'use client';

// ============================================================
//  TAGIT — PortfolioEditor Component
//  The main portfolio builder dashboard with:
//  - Theme & color selector
//  - Section manager (add, reorder, toggle, delete)
//  - Type-specific section content editors
//  - Publish/Unpublish control
//  - Live preview link
// ============================================================

import React, { useState, useCallback } from 'react';
import HeroEditor from './editors/HeroEditor';
import AboutEditor from './editors/AboutEditor';
import ExperienceEditor from './editors/ExperienceEditor';
import ProjectsEditor from './editors/ProjectsEditor';
import SkillsEditor from './editors/SkillsEditor';
import TestimonialsEditor from './editors/TestimonialsEditor';
import GalleryEditor from './editors/GalleryEditor';
import StatsEditor from './editors/StatsEditor';
import ContactEditor from './editors/ContactEditor';
import PortfolioView from '../p/[username]/PortfolioView';
import {
  updatePortfolio,
  togglePortfolioPublish,
  addPortfolioSection,
  updatePortfolioSection,
  deletePortfolioSection,
  reorderPortfolioSections,
  PortfolioUpdateData,
} from '../../services/api';

// ── Types ────────────────────────────────────────────────────
type PortfolioTheme = 'MIDNIGHT_LUXE' | 'ARCTIC_FROST' | 'SUNSET_EMBER' | 'OCEAN_DEPTH' | 'MONOCHROME_ELITE' | 'PURE_LIGHT';
type SectionType = 'HERO' | 'ABOUT' | 'EXPERIENCE' | 'PROJECTS' | 'SKILLS' | 'TESTIMONIALS' | 'GALLERY' | 'CONTACT' | 'STATS' | 'CUSTOM_HTML';

interface PortfolioSection {
  id: string;
  type: SectionType;
  title?: string | null;
  sortOrder: number;
  isVisible: boolean;
  content: Record<string, any>;
}

interface Portfolio {
  id: string;
  isPublished: boolean;
  theme: PortfolioTheme;
  primaryColor: string;
  accentColor: string;
  headline?: string | null;
  subheadline?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  heroImageUrl?: string | null;
  sections: PortfolioSection[];
}

interface PortfolioEditorProps {
  initialPortfolio: Portfolio;
  username: string;
  profile: any;
}

// ── Theme Config ─────────────────────────────────────────────
const THEMES: { id: PortfolioTheme; label: string; emoji: string; bg: string; accent: string }[] = [
  { id: 'MIDNIGHT_LUXE', label: 'Midnight Luxe', emoji: '🌌', bg: '#050507', accent: '#6451fa' },
  { id: 'ARCTIC_FROST', label: 'Arctic Frost', emoji: '❄️', bg: '#f0f4ff', accent: '#3b82f6' },
  { id: 'SUNSET_EMBER', label: 'Sunset Ember', emoji: '🌅', bg: '#0c0804', accent: '#f59e0b' },
  { id: 'OCEAN_DEPTH', label: 'Ocean Depth', emoji: '🌊', bg: '#030e1a', accent: '#06b6d4' },
  { id: 'MONOCHROME_ELITE', label: 'Mono Elite', emoji: '⬛', bg: '#0a0a0a', accent: '#ffffff' },
  { id: 'PURE_LIGHT', label: 'Pure Light', emoji: '☀️', bg: '#ffffff', accent: '#000000' },
];

const SECTION_TYPES: { type: SectionType; label: string; icon: string }[] = [
  { type: 'ABOUT', label: 'About Me', icon: '👤' },
  { type: 'EXPERIENCE', label: 'Experience', icon: '💼' },
  { type: 'PROJECTS', label: 'Projects', icon: '🚀' },
  { type: 'SKILLS', label: 'Skills', icon: '⚡' },
  { type: 'TESTIMONIALS', label: 'Testimonials', icon: '💬' },
  { type: 'GALLERY', label: 'Gallery', icon: '🖼️' },
  { type: 'STATS', label: 'Statistics', icon: '📊' },
  { type: 'CONTACT', label: 'Contact', icon: '📩' },
];

// ── Styles ───────────────────────────────────────────────────
const S = {
  root: {
    fontFamily: "'Inter', system-ui, sans-serif",
    background: '#080810',
    color: '#f0f0f8',
    minHeight: '100vh',
  } as React.CSSProperties,
  topBar: {
    background: 'rgba(255,255,255,0.03)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(20px)',
  } as React.CSSProperties,
  body: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr 450px',
    minHeight: 'calc(100vh - 65px)',
  } as React.CSSProperties,
  sidebar: {
    background: 'rgba(255,255,255,0.02)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    overflowY: 'auto' as const,
    height: 'calc(100vh - 65px)',
    position: 'sticky' as const,
    top: 65,
  },
  panel: {
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,
  panelTitle: {
    fontSize: '0.72rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
  } as React.CSSProperties,
  input: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '9px 13px',
    color: '#f0f0f8',
    fontSize: '0.9rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
  } as React.CSSProperties,
};

// ── Main Component ─────────────────────────────────────────────
export default function PortfolioEditor({ initialPortfolio, username, profile }: PortfolioEditorProps) {
  const [portfolio, setPortfolio] = useState<Portfolio>(initialPortfolio);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Scale for iPhone mockup to fit small screens
  const [mockupScale, setMockupScale] = React.useState(1);
  React.useEffect(() => {
    const updateScale = () => {
      const availableHeight = window.innerHeight - 80; // 65px navbar + 15px padding
      setMockupScale(Math.min(1.15, availableHeight / 820));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Portfolio-level settings save ──────────────────────────
  const saveSettings = async (patch: PortfolioUpdateData) => {
    setSaving(true);
    try {
      const res = await updatePortfolio(patch);
      if (res.success) {
        setPortfolio((p) => ({ ...p, ...patch }));
        showToast('Saved!');
      }
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Publish toggle ─────────────────────────────────────────
  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await togglePortfolioPublish();
      if (res.success) {
        setPortfolio((p) => ({ ...p, isPublished: !p.isPublished }));
        showToast(res.message ?? 'Updated!');
      }
    } catch {
      showToast('Failed to update', 'error');
    } finally {
      setPublishing(false);
    }
  };

  // ── Section operations ─────────────────────────────────────
  const handleAddSection = async (type: SectionType) => {
    setShowAddMenu(false);
    const defaultContent: Record<SectionType, any> = {
      HERO: {},
      ABOUT: { text: '' },
      EXPERIENCE: { items: [] },
      PROJECTS: { items: [] },
      SKILLS: { items: [] },
      TESTIMONIALS: { items: [] },
      GALLERY: { images: [], layout: 'grid' },
      CONTACT: { showEmail: true, showPhone: true, showForm: false },
      STATS: { items: [] },
      CUSTOM_HTML: { html: '' },
    };

    try {
      const res = await addPortfolioSection({ type, content: defaultContent[type] });
      if (res.success) {
        setPortfolio((p) => ({
          ...p,
          sections: [...p.sections, res.data].sort((a, b) => a.sortOrder - b.sortOrder),
        }));
        setExpandedSection(res.data.id);
        showToast('Section added!');
      }
    } catch {
      showToast('Failed to add section', 'error');
    }
  };

  const handleSectionContentChange = async (sectionId: string, content: Record<string, any>) => {
    // Optimistic update
    setPortfolio((p) => ({
      ...p,
      sections: p.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)),
    }));
    try {
      await updatePortfolioSection(sectionId, { content });
    } catch {
      showToast('Auto-save failed', 'error');
    }
  };

  const handleToggleVisibility = async (sectionId: string) => {
    const section = portfolio.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const newVal = !section.isVisible;
    setPortfolio((p) => ({
      ...p,
      sections: p.sections.map((s) => (s.id === sectionId ? { ...s, isVisible: newVal } : s)),
    }));
    await updatePortfolioSection(sectionId, { isVisible: newVal });
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Remove this section?')) return;
    try {
      await deletePortfolioSection(sectionId);
      setPortfolio((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== sectionId) }));
      showToast('Section removed');
    } catch {
      showToast('Failed to remove', 'error');
    }
  };

  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const sections = [...portfolio.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [sections[idx], sections[swapIdx]] = [sections[swapIdx], sections[idx]];
    const reordered = sections.map((s, i) => ({ ...s, sortOrder: i }));
    setPortfolio((p) => ({ ...p, sections: reordered }));
    await reorderPortfolioSections(reordered.map((s) => s.id));
  };

  const renderSectionEditor = (section: PortfolioSection) => {
    const onChange = (content: any) => handleSectionContentChange(section.id, content);
    switch (section.type) {
      case 'ABOUT': return <AboutEditor content={section.content as any} onChange={onChange} />;
      case 'EXPERIENCE': return <ExperienceEditor content={section.content as any} onChange={onChange} />;
      case 'PROJECTS': return <ProjectsEditor content={section.content as any} onChange={onChange} />;
      case 'SKILLS': return <SkillsEditor content={section.content as any} onChange={onChange} />;
      case 'TESTIMONIALS': return <TestimonialsEditor content={section.content as any} onChange={onChange} />;
      case 'GALLERY': return <GalleryEditor content={section.content as any} onChange={onChange} />;
      case 'STATS': return <StatsEditor content={section.content as any} onChange={onChange} />;
      case 'CONTACT': return <ContactEditor content={section.content as any} onChange={onChange} />;
      default: return <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>This section type has no editor yet.</p>;
    }
  };

  const sortedSections = [...portfolio.sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div style={S.root}>
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .portfolio-editor-no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        /* Hide scrollbar for IE, Edge and Firefox */
        .portfolio-editor-no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: toast.type === 'success' ? '#86efac' : '#fca5a5',
          fontSize: '0.9rem', fontWeight: 600,
        }}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Top Bar */}
      <div style={S.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Portfolio Editor</p>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Changes save automatically
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {portfolio.isPublished && (
            <a
              href={`/p/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem',
                textDecoration: 'none', fontWeight: 500,
              }}
            >
              ↗ Preview Live
            </a>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{
              padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
              fontWeight: 700, fontSize: '0.88rem', fontFamily: 'Inter, sans-serif',
              background: portfolio.isPublished
                ? 'rgba(239,68,68,0.15)'
                : 'linear-gradient(135deg, #6451fa, #22d3ee)',
              color: portfolio.isPublished ? '#f87171' : '#fff',
              border: portfolio.isPublished ? '1px solid rgba(239,68,68,0.3)' : 'none',
              transition: 'opacity 0.2s',
              opacity: publishing ? 0.6 : 1,
            }}
          >
            {publishing ? '...' : portfolio.isPublished ? '⬇ Unpublish' : '🚀 Publish Portfolio'}
          </button>
        </div>
      </div>

      <div style={S.body}>
        {/* LEFT SIDEBAR — Settings */}
        <div style={S.sidebar} className="portfolio-editor-no-scrollbar">

          {/* Hero Settings */}
          <div style={S.panel}>
            <p style={S.panelTitle}>Hero Content</p>
            <HeroEditor
              portfolio={portfolio}
              onChange={(data) => {
                setPortfolio((p) => ({ ...p, ...data }));
              }}
            />
            <button
              onClick={() => saveSettings({
                headline: portfolio.headline,
                subheadline: portfolio.subheadline,
                ctaText: portfolio.ctaText,
                ctaUrl: portfolio.ctaUrl,
                heroImageUrl: portfolio.heroImageUrl,
              })}
              disabled={saving}
              style={{
                marginTop: 16, width: '100%', padding: '10px', borderRadius: 8,
                background: 'rgba(100,81,250,0.2)', border: '1px solid rgba(100,81,250,0.3)',
                color: '#a78bfa', fontSize: '0.88rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {saving ? 'Saving...' : 'Save Hero'}
            </button>
          </div>

          {/* Theme Selector */}
          <div style={S.panel}>
            <p style={S.panelTitle}>Theme</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => saveSettings({ theme: theme.id })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 10, cursor: 'pointer', border: 'none',
                    background: portfolio.theme === theme.id
                      ? 'rgba(100,81,250,0.2)'
                      : 'rgba(255,255,255,0.04)',
                    outline: portfolio.theme === theme.id
                      ? '2px solid rgba(100,81,250,0.5)'
                      : '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 6,
                    background: theme.bg,
                    border: `2px solid ${theme.accent}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}>
                    {theme.emoji}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 500, color: '#f0f0f8' }}>
                    {theme.label}
                  </span>
                  {portfolio.theme === theme.id && (
                    <span style={{ marginLeft: 'auto', color: '#a78bfa', fontSize: '0.8rem' }}>✓ Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Colors */}
          <div style={S.panel}>
            <p style={S.panelTitle}>Brand Colors</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'primaryColor' as const, label: 'Primary Accent', value: portfolio.primaryColor },
                { key: 'accentColor' as const, label: 'Secondary Accent', value: portfolio.accentColor },
              ].map(({ key, label, value }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => setPortfolio((p) => ({ ...p, [key]: e.target.value }))}
                    onBlur={(e) => saveSettings({ [key]: e.target.value })}
                    style={{ width: 40, height: 40, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none' }}
                  />
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{label}</p>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publish Status */}
          <div style={{ ...S.panel, background: portfolio.isPublished ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)' }}>
            <p style={S.panelTitle}>Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: portfolio.isPublished ? '#22c55e' : 'rgba(255,255,255,0.2)',
                boxShadow: portfolio.isPublished ? '0 0 6px #22c55e' : 'none',
              }} />
              <span style={{ fontSize: '0.88rem', color: portfolio.isPublished ? '#86efac' : 'rgba(255,255,255,0.5)' }}>
                {portfolio.isPublished ? 'Live at /p/' + username : 'Not published'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Section Manager */}
        <div style={{ padding: 32, overflowY: 'auto', maxHeight: 'calc(100vh - 65px)' }} className="portfolio-editor-no-scrollbar">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Sections</h1>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                Build your portfolio by adding and customizing sections
              </p>
            </div>

            {/* Add Section Button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowAddMenu((v) => !v)}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #6451fa, #22d3ee)',
                  color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                  fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                + Add Section
              </button>

              {showAddMenu && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0, zIndex: 100,
                  background: '#13131f', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: 8, minWidth: 200,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                }}>
                  {SECTION_TYPES.map(({ type, label, icon }) => (
                    <button
                      key={type}
                      onClick={() => handleAddSection(type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '10px 14px', borderRadius: 8,
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        color: '#f0f0f8', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
                        textAlign: 'left',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortedSections.map((section, idx) => (
              <div
                key={section.id}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${expandedSection === section.id ? 'rgba(100,81,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Section Header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px', cursor: 'pointer',
                  }}
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                >
                  {/* Reorder buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(section.id, 'up'); }}
                      disabled={idx === 0}
                      style={{
                        padding: '2px 6px', border: 'none', borderRadius: 4, cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.65rem',
                        opacity: idx === 0 ? 0.3 : 1,
                      }}
                    >▲</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMoveSection(section.id, 'down'); }}
                      disabled={idx === sortedSections.length - 1}
                      style={{
                        padding: '2px 6px', border: 'none', borderRadius: 4, cursor: idx === sortedSections.length - 1 ? 'not-allowed' : 'pointer',
                        background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.65rem',
                        opacity: idx === sortedSections.length - 1 ? 0.3 : 1,
                      }}
                    >▼</button>
                  </div>

                  <span style={{ fontSize: '1.2rem' }}>
                    {SECTION_TYPES.find((s) => s.type === section.type)?.icon ?? '📄'}
                  </span>

                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {section.title ?? section.type}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{section.type}</p>
                  </div>

                  {/* Visibility toggle */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleVisibility(section.id); }}
                    title={section.isVisible ? 'Hide' : 'Show'}
                    style={{
                      padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, background: 'transparent', cursor: 'pointer',
                      color: section.isVisible ? '#86efac' : 'rgba(255,255,255,0.3)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {section.isVisible ? '👁' : '🙈'}
                  </button>

                  {/* Delete */}
                  {section.type !== 'HERO' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                      style={{
                        padding: '6px 10px', border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 6, background: 'rgba(239,68,68,0.08)', cursor: 'pointer',
                        color: '#f87171', fontSize: '0.85rem',
                      }}
                    >
                      🗑
                    </button>
                  )}

                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                    {expandedSection === section.id ? '▲' : '▼'}
                  </span>
                </div>

                {/* Section Editor (expanded) */}
                {expandedSection === section.id && (
                  <div style={{
                    padding: '0 20px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: 20,
                  }}>
                    {renderSectionEditor(section)}
                  </div>
                )}
              </div>
            ))}

            {sortedSections.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '60px 20px',
                color: 'rgba(255,255,255,0.3)', fontSize: '0.95rem',
              }}>
                <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>📭</p>
                <p>No sections yet. Click "Add Section" to start building!</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHTMOST PANEL — Live Mobile Preview */}
        <div style={{
          background: '#030305',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          position: 'sticky',
          top: 65,
          height: 'calc(100vh - 65px)',
          overflow: 'hidden'
        }}>
          {/* iPhone 17 Pro Mockup Frame */}
          <div style={{
            position: 'relative',
            width: 380,
            height: 820,
            flexShrink: 0,
            transform: `scale(${mockupScale})`,
            transformOrigin: 'center center',
            borderRadius: 55,
            background: '#151515', // Titanium edge
            boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 0 0 2px #333, inset 0 0 0 8px #000',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Hardware Buttons (Action Button, Volume, Power) */}
            <div style={{ position: 'absolute', left: -2, top: 120, width: 3, height: 26, background: '#333', borderRadius: '4px 0 0 4px' }} />
            <div style={{ position: 'absolute', left: -2, top: 180, width: 3, height: 50, background: '#333', borderRadius: '4px 0 0 4px' }} />
            <div style={{ position: 'absolute', left: -2, top: 240, width: 3, height: 50, background: '#333', borderRadius: '4px 0 0 4px' }} />
            <div style={{ position: 'absolute', right: -2, top: 190, width: 3, height: 80, background: '#333', borderRadius: '0 4px 4px 0' }} />

            {/* Screen Area */}
            <div style={{
              width: '100%',
              height: '100%',
              background: '#000',
              borderRadius: 48,
              position: 'relative',
              overflow: 'hidden',
            }}>

              {/* Dynamic Island */}
              <div style={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 35,
                background: '#000',
                borderRadius: 24,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)'
              }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0a0a0a', border: '1px solid #1a1a1a' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#0a0a0a', border: '2px solid #1a1a1a', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 3, background: '#101010', borderRadius: '50%' }} />
                </div>
              </div>

              {/* Scrollable Content Container (Traps fixed elements) */}
              <div
                className="portfolio-editor-no-scrollbar"
                style={{
                  width: '100%', height: '100%',
                  overflowY: 'auto', overflowX: 'hidden',
                  transform: 'scale(1)', // Creates a containing block for position: fixed
                  position: 'relative',
                }}
              >
                <PortfolioView portfolio={portfolio} profile={profile} username={username} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
