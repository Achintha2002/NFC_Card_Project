'use client';
// ContactEditor.tsx

import React from 'react';
import { editorLabel, editorFieldGroup } from './editorStyles';

interface ContactContent { showEmail?: boolean; showPhone?: boolean; showForm?: boolean; formWebhook?: string | null; }
interface ContactEditorProps {
  content: ContactContent;
  onChange: (data: ContactContent) => void;
}

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 0' }}>
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? '#6451fa' : 'rgba(255,255,255,0.12)',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </div>
    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>{label}</span>
  </label>
);

export default function ContactEditor({ content, onChange }: ContactEditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Toggle
        checked={content.showEmail ?? true}
        onChange={(v) => onChange({ ...content, showEmail: v })}
        label="Show email address"
      />
      <Toggle
        checked={content.showPhone ?? true}
        onChange={(v) => onChange({ ...content, showPhone: v })}
        label="Show phone number"
      />
      <Toggle
        checked={content.showForm ?? false}
        onChange={(v) => onChange({ ...content, showForm: v })}
        label="Show contact form (coming soon)"
      />
      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
        Contact details are pulled from your profile settings.
      </p>
    </div>
  );
}
