'use client';
// ExperienceEditor.tsx

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup, addButton, removeButton, itemCard } from './editorStyles';

interface ExperienceItem { company: string; role: string; period: string; description?: string; logoUrl?: string | null; }
interface ExperienceEditorProps {
  content: { items: ExperienceItem[] };
  onChange: (data: { items: ExperienceItem[] }) => void;
}

const blank: ExperienceItem = { company: '', role: '', period: '', description: '', logoUrl: null };

export default function ExperienceEditor({ content, onChange }: ExperienceEditorProps) {
  const items = content.items ?? [];

  const update = (i: number, patch: Partial<ExperienceItem>) => {
    const updated = items.map((item, idx) => (idx === i ? { ...item, ...patch } : item));
    onChange({ items: updated });
  };

  const add = () => onChange({ items: [...items, { ...blank }] });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((item, i) => (
        <div key={i} style={itemCard}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Company</label>
              <input style={editorInput} placeholder="Acme Corp" value={item.company} onChange={(e) => update(i, { company: e.target.value })} />
            </div>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Role / Title</label>
              <input style={editorInput} placeholder="Senior Engineer" value={item.role} onChange={(e) => update(i, { role: e.target.value })} />
            </div>
          </div>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Period</label>
            <input style={editorInput} placeholder="Jan 2022 – Present" value={item.period} onChange={(e) => update(i, { period: e.target.value })} />
          </div>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Description</label>
            <textarea style={{ ...editorInput, minHeight: 80, resize: 'vertical' }} placeholder="Key responsibilities and achievements..." value={item.description ?? ''} onChange={(e) => update(i, { description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={removeButton} onClick={() => remove(i)}>✕ Remove</button>
          </div>
        </div>
      ))}
      <button style={addButton} onClick={add}>+ Add Experience</button>
    </div>
  );
}
