'use client';
// TestimonialsEditor.tsx

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup, addButton, removeButton, itemCard } from './editorStyles';

interface TestimonialItem { quote: string; author: string; role?: string; company?: string; avatarUrl?: string | null; }
interface TestimonialsEditorProps {
  content: { items: TestimonialItem[] };
  onChange: (data: { items: TestimonialItem[] }) => void;
}

const blank: TestimonialItem = { quote: '', author: '', role: '', company: '', avatarUrl: null };

export default function TestimonialsEditor({ content, onChange }: TestimonialsEditorProps) {
  const items = content.items ?? [];

  const update = (i: number, patch: Partial<TestimonialItem>) => {
    onChange({ items: items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  };

  const add = () => onChange({ items: [...items, { ...blank }] });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((item, i) => (
        <div key={i} style={itemCard}>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Quote</label>
            <textarea style={{ ...editorInput, minHeight: 100, resize: 'vertical' }} placeholder="Working with them was an incredible experience..." value={item.quote} onChange={(e) => update(i, { quote: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Author Name</label>
              <input style={editorInput} placeholder="Jane Smith" value={item.author} onChange={(e) => update(i, { author: e.target.value })} />
            </div>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Role</label>
              <input style={editorInput} placeholder="CEO" value={item.role ?? ''} onChange={(e) => update(i, { role: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Company</label>
              <input style={editorInput} placeholder="Acme Corp" value={item.company ?? ''} onChange={(e) => update(i, { company: e.target.value })} />
            </div>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Avatar URL (optional)</label>
              <input style={editorInput} placeholder="https://..." value={item.avatarUrl ?? ''} onChange={(e) => update(i, { avatarUrl: e.target.value || null })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={removeButton} onClick={() => remove(i)}>✕ Remove</button>
          </div>
        </div>
      ))}
      <button style={addButton} onClick={add}>+ Add Testimonial</button>
    </div>
  );
}
