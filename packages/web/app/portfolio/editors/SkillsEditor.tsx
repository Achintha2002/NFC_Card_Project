'use client';
// SkillsEditor.tsx

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup, addButton, removeButton, itemCard } from './editorStyles';

interface SkillItem { name: string; proficiency: number; category?: string; }
interface SkillsEditorProps {
  content: { items: SkillItem[] };
  onChange: (data: { items: SkillItem[] }) => void;
}

export default function SkillsEditor({ content, onChange }: SkillsEditorProps) {
  const items = content.items ?? [];

  const update = (i: number, patch: Partial<SkillItem>) => {
    onChange({ items: items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  };

  const add = () => onChange({ items: [...items, { name: '', proficiency: 80, category: '' }] });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, i) => (
        <div key={i} style={{ ...itemCard, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, ...editorFieldGroup }}>
            <label style={editorLabel}>Skill</label>
            <input style={editorInput} placeholder="React" value={item.name} onChange={(e) => update(i, { name: e.target.value })} />
          </div>
          <div style={{ width: 100, ...editorFieldGroup }}>
            <label style={editorLabel}>Level %</label>
            <input type="number" min={0} max={100} style={editorInput} value={item.proficiency} onChange={(e) => update(i, { proficiency: Number(e.target.value) })} />
          </div>
          <div style={{ flex: 1, ...editorFieldGroup }}>
            <label style={editorLabel}>Category</label>
            <input style={editorInput} placeholder="Frontend" value={item.category ?? ''} onChange={(e) => update(i, { category: e.target.value })} />
          </div>
          <div style={{ paddingTop: 20 }}>
            <button style={removeButton} onClick={() => remove(i)}>✕</button>
          </div>
        </div>
      ))}
      <button style={addButton} onClick={add}>+ Add Skill</button>
    </div>
  );
}
