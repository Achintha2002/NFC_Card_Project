'use client';
// StatsEditor.tsx

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup, addButton, removeButton, itemCard } from './editorStyles';

interface StatItem { value: number; label: string; suffix?: string; }
interface StatsEditorProps {
  content: { items: StatItem[] };
  onChange: (data: { items: StatItem[] }) => void;
}

export default function StatsEditor({ content, onChange }: StatsEditorProps) {
  const items = content.items ?? [];

  const update = (i: number, patch: Partial<StatItem>) => {
    onChange({ items: items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  };

  const add = () => onChange({ items: [...items, { value: 0, label: '', suffix: '+' }] });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ ...itemCard, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 120, ...editorFieldGroup }}>
            <label style={editorLabel}>Number</label>
            <input type="number" style={editorInput} value={item.value} onChange={(e) => update(i, { value: Number(e.target.value) })} />
          </div>
          <div style={{ width: 80, ...editorFieldGroup }}>
            <label style={editorLabel}>Suffix</label>
            <input style={editorInput} placeholder="+" value={item.suffix ?? ''} onChange={(e) => update(i, { suffix: e.target.value })} />
          </div>
          <div style={{ flex: 1, ...editorFieldGroup }}>
            <label style={editorLabel}>Label</label>
            <input style={editorInput} placeholder="Projects Completed" value={item.label} onChange={(e) => update(i, { label: e.target.value })} />
          </div>
          <div style={{ paddingTop: 20 }}>
            <button style={removeButton} onClick={() => remove(i)}>✕</button>
          </div>
        </div>
      ))}
      <button style={addButton} onClick={add}>+ Add Stat</button>
    </div>
  );
}
