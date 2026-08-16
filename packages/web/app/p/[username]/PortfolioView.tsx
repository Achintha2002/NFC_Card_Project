'use client';

// ============================================================
//  TAGIT — PortfolioView Component (Wow-Factor Edition)
//  Powered by Framer Motion for Next-Level Interactivity
// ============================================================

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, Code, Mail, Phone, ChevronDown } from 'lucide-react';
import './portfolio.css';

// ── Types ─────────────────────────────────────────────────────
interface PortfolioSection {
  id: string;
  type: string;
  title?: string | null;
  sortOrder: number;
  isVisible: boolean;
  content: Record<string, any>;
}

interface Portfolio {
  id: string;
  theme: 'MIDNIGHT_LUXE' | 'ARCTIC_FROST' | 'SUNSET_EMBER' | 'OCEAN_DEPTH' | 'MONOCHROME_ELITE' | 'PURE_LIGHT';
  primaryColor: string;
  accentColor: string;
  headline?: string | null;
  subheadline?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  heroImageUrl?: string | null;
  sections: PortfolioSection[];
}

interface ProfileMeta {
  displayName: string;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  profilePicture?: string | null;
}

interface PortfolioViewProps {
  portfolio: Portfolio;
  profile: ProfileMeta;
  username: string;
}

// ── Shared Animation Variants ─────────────────────────────────
const fadeUp: any = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

// ── Section Renderers ─────────────────────────────────────────

function HeroSection({ portfolio, profile }: { portfolio: Portfolio; profile: ProfileMeta }) {
  const ctaHref = portfolio.ctaUrl ?? `mailto:${profile.email ?? ''}`;
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <motion.section 
      className="portfolio-hero" 
      id="hero"
      style={{ y: y1, opacity }}
    >
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, type: "spring", bounce: 0.5 }}
        className="hero-avatar-wrapper"
      >
        <div className="hero-avatar-glow" />
        <div className="hero-avatar-inner">
          {profile.profilePicture || portfolio.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portfolio.heroImageUrl || profile.profilePicture || ""}
              alt={profile.displayName}
              className="hero-avatar-img"
            />
          ) : (
            <div
              style={{
                width: '100%', height: '100%', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', fontWeight: 900,
                background: `linear-gradient(135deg, var(--portfolio-accent), var(--portfolio-accent2))`,
                color: '#fff',
              }}
            >
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center z-10">
        <motion.h1 variants={fadeUp} className="portfolio-hero-name">
          {profile.displayName}
        </motion.h1>

        {(portfolio.headline ?? profile.jobTitle) && (
          <motion.p variants={fadeUp} className="text-xl md:text-2xl font-medium mb-6" style={{ color: 'var(--portfolio-accent)' }}>
            {portfolio.headline ?? profile.jobTitle}
          </motion.p>
        )}

        {portfolio.subheadline && (
          <motion.p variants={fadeUp} className="text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--portfolio-text-muted)' }}>
            {portfolio.subheadline}
          </motion.p>
        )}

        {portfolio.ctaText && (
          <motion.a 
            variants={fadeUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={ctaHref} 
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold tracking-wide shadow-2xl"
            style={{ background: 'linear-gradient(135deg, var(--portfolio-accent), var(--portfolio-accent2))', boxShadow: '0 12px 32px var(--portfolio-glow)' }}
          >
            {portfolio.ctaText}
            <Sparkles className="w-5 h-5" />
          </motion.a>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1, y: [0, 10, 0] }} 
        transition={{ delay: 2, duration: 2, repeat: Infinity }}
        className="absolute bottom-10 text-white/30"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.div>
    </motion.section>
  );
}

function AboutSection({ section }: { section: PortfolioSection }) {
  const { text, imageUrl } = section.content as { text: string; imageUrl?: string };
  return (
    <div className="portfolio-section" id="about">
      <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="portfolio-section-title">
        {section.title ?? 'About <span>Me</span>'}
      </motion.h2>
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="portfolio-section-divider" style={{ transformOrigin: "left" }} />
      
      <div className="grid md:grid-cols-12 gap-12 items-center">
        {imageUrl && (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="md:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--portfolio-accent)] to-[var(--portfolio-accent2)] blur-3xl opacity-20 rounded-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="About" className="w-full h-auto rounded-3xl object-cover shadow-2xl relative z-10 border border-[var(--portfolio-border)]" />
          </motion.div>
        )}
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          className={`${imageUrl ? 'md:col-span-7' : 'md:col-span-12'}`}
        >
          <div className="premium-glass-card p-8 md:p-12 text-lg leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--portfolio-text-muted)' }}>
            {text}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ExperienceSection({ section }: { section: PortfolioSection }) {
  const { items = [] } = section.content as {
    items: Array<{ company: string; role: string; period: string; description?: string }>;
  };
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  return (
    <div className="portfolio-section" id="experience">
      <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="portfolio-section-title">
        Work <span>Experience</span>
      </motion.h2>
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="portfolio-section-divider" style={{ transformOrigin: "left" }} />
      
      <div ref={containerRef} className="timeline-container mt-12">
        <div className="timeline-line-track" />
        <motion.div className="timeline-line-fill" style={{ scaleY: scrollYProgress, transformOrigin: "top" }} />
        
        <div className="space-y-16">
          {items.map((item, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative pl-8 md:pl-16"
            >
              <div className="timeline-dot" />
              <div className="premium-glass-card p-6 md:p-8 hover:-translate-y-1 transition-transform">
                <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--portfolio-text)' }}>{item.role}</h3>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="font-semibold text-lg" style={{ color: 'var(--portfolio-accent)' }}>{item.company}</span>
                  <span className="text-sm px-3 py-1 rounded-full border border-[var(--portfolio-border)]" style={{ color: 'var(--portfolio-text-muted)', background: 'var(--portfolio-surface)' }}>{item.period}</span>
                </div>
                {item.description && <p className="leading-relaxed" style={{ color: 'var(--portfolio-text-muted)' }}>{item.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectsSection({ section }: { section: PortfolioSection }) {
  const { items = [] } = section.content as {
    items: Array<{ title: string; description?: string; imageUrl?: string; liveUrl?: string; githubUrl?: string; tags?: string[] }>;
  };

  return (
    <div className="portfolio-section" id="projects">
      <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="portfolio-section-title">
        Featured <span>Projects</span>
      </motion.h2>
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="portfolio-section-divider" style={{ transformOrigin: "left" }} />
      
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        {items.map((project, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 50 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="premium-glass-card group flex flex-col h-full"
          >
            {project.imageUrl && (
              <div className="w-full h-56 md:h-64 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
              </div>
            )}
            <div className="p-8 flex flex-col flex-grow">
              <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--portfolio-text)' }}>{project.title}</h3>
              {project.description && (
                <p className="mb-6 flex-grow leading-relaxed" style={{ color: 'var(--portfolio-text-muted)' }}>{project.description}</p>
              )}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-xs font-semibold px-3 py-1.5 rounded-md" style={{ background: 'var(--portfolio-surface)', color: 'var(--portfolio-accent)', border: '1px solid var(--portfolio-border)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 mt-auto">
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:opacity-80 transition-opacity" style={{ color: 'var(--portfolio-text)' }}>
                    <ExternalLink className="w-4 h-4" /> Live Site
                  </a>
                )}
                {project.githubUrl && (
                  <a href={project.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:opacity-80 transition-opacity" style={{ color: 'var(--portfolio-text-muted)' }}>
                    <Code className="w-4 h-4" /> Source
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function SkillsSection({ section }: { section: PortfolioSection }) {
  const { categories = [] } = section.content as {
    categories: Array<{ name: string; skills: Array<{ name: string; proficiency: number }> }>;
  };

  return (
    <div className="portfolio-section" id="skills">
      <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="portfolio-section-title">
        Core <span>Proficiencies</span>
      </motion.h2>
      <motion.div initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} className="portfolio-section-divider" style={{ transformOrigin: "left" }} />
      
      <div className="grid md:grid-cols-2 gap-12 mt-12">
        {categories.map((cat, i) => (
          <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="premium-glass-card p-8">
            <h3 className="text-xl font-bold mb-8 uppercase tracking-widest" style={{ color: 'var(--portfolio-text)' }}>{cat.name}</h3>
            <div className="space-y-6">
              {cat.skills.map((skill, j) => (
                <div key={j}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span style={{ color: 'var(--portfolio-text-muted)' }}>{skill.name}</span>
                    <span style={{ color: 'var(--portfolio-accent)' }}>{skill.proficiency}%</span>
                  </div>
                  <div className="skill-bar-track">
                    <motion.div 
                      className="skill-bar-fill" 
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.proficiency}%` }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: j * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ContactSection({ section, profile }: { section: PortfolioSection; profile: ProfileMeta }) {
  return (
    <div className="portfolio-section" id="contact">
      <motion.div 
        initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        className="premium-glass-card p-12 md:p-20 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--portfolio-accent)]/10 pointer-events-none" />
        
        <h2 className="text-4xl md:text-5xl font-black mb-6" style={{ color: 'var(--portfolio-text)' }}>Let's Build Something.</h2>
        <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto" style={{ color: 'var(--portfolio-text-muted)' }}>
          I'm always open to discussing new projects, creative ideas or opportunities to be part of your visions.
        </p>
        
        <div className="flex flex-wrap justify-center gap-6 relative z-10">
          {profile.email && (
            <motion.a 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              href={`mailto:${profile.email}`} 
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-lg"
              style={{ background: 'var(--portfolio-surface)', color: 'var(--portfolio-text)', border: '1px solid var(--portfolio-border)' }}
            >
              <Mail className="w-5 h-5 text-[var(--portfolio-accent)]" /> 
              {profile.email}
            </motion.a>
          )}
          {profile.phone && (
            <motion.a 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              href={`tel:${profile.phone}`} 
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold shadow-lg"
              style={{ background: 'var(--portfolio-surface)', color: 'var(--portfolio-text)', border: '1px solid var(--portfolio-border)' }}
            >
              <Phone className="w-5 h-5 text-[var(--portfolio-accent2)]" /> 
              {profile.phone}
            </motion.a>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function PortfolioView({ portfolio: initialPortfolio, profile, username }: PortfolioViewProps) {
  const { scrollYProgress } = useScroll();
  const [portfolio, setPortfolio] = useState(initialPortfolio);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'UPDATE_PORTFOLIO') {
        setPortfolio(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Sort and filter active sections
  const activeSections = [...portfolio.sections]
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="portfolio-root" data-theme={portfolio.theme}>
      
      {/* ── Scroll Progress Bar ── */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 z-50 origin-left"
        style={{ scaleX: scrollYProgress, background: 'linear-gradient(90deg, var(--portfolio-accent), var(--portfolio-accent2))' }}
      />

      {/* ── Ambient Background ── */}
      <div className="portfolio-ambient-bg">
        <div className="portfolio-orb portfolio-orb-1" />
        <div className="portfolio-orb portfolio-orb-2" />
      </div>

      <div className="portfolio-content-wrapper">
        <HeroSection portfolio={portfolio} profile={profile} />

        {activeSections.map((section) => {
          switch (section.type) {
            case 'ABOUT':
              return <AboutSection key={section.id} section={section} />;
            case 'EXPERIENCE':
              return <ExperienceSection key={section.id} section={section} />;
            case 'PROJECTS':
              return <ProjectsSection key={section.id} section={section} />;
            case 'SKILLS':
              return <SkillsSection key={section.id} section={section} />;
            case 'CONTACT':
              return <ContactSection key={section.id} section={section} profile={profile} />;
            // Add other sections here as needed (TESTIMONIALS, GALLERY, STATS)
            default:
              return null;
          }
        })}
      </div>

      {/* ── TAGIT Watermark ── */}
      <a href="https://tagit.lk" target="_blank" rel="noreferrer" className="tagit-watermark">
        <Sparkles className="tagit-watermark-icon" />
        POWERED BY TAGIT
      </a>
    </div>
  );
}
