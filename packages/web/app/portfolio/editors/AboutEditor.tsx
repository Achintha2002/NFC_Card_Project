'use client';
// AboutEditor.tsx

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup } from './editorStyles';

interface AboutContent { text: string; imageUrl?: string | null; }
interface AboutEditorProps {
  content: AboutContent;
  onChange: (data: AboutContent) => void;
}

export default function AboutEditor({ content, onChange }: AboutEditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={editorFieldGroup}>
        <label style={editorLabel}>About Text</label>
        <textarea
          style={{ ...editorInput, minHeight: 160, resize: 'vertical' }}
          placeholder="Write a compelling paragraph about yourself..."
          value={content.text ?? ''}
          onChange={(e) => onChange({ ...content, text: e.target.value })}
        />
      </div>
      <div style={editorFieldGroup}>
        <label style={editorLabel}>Image URL (optional)</label>
        <input
          style={editorInput}
          placeholder="https://..."
          value={content.imageUrl ?? ''}
          onChange={(e) => onChange({ ...content, imageUrl: e.target.value || null })}
        />
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
          Displays alongside your text in a split layout
        </span>
      </div>
    </div>
  );
}
