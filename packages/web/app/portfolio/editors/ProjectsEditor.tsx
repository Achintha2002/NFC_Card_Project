'use client';
// ProjectsEditor.tsx

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup, addButton, removeButton, itemCard } from './editorStyles';

interface ProjectItem { title: string; description?: string; imageUrl?: string | null; liveUrl?: string | null; githubUrl?: string | null; tags?: string[]; }
interface ProjectsEditorProps {
  content: { items: ProjectItem[] };
  onChange: (data: { items: ProjectItem[] }) => void;
}

const blank: ProjectItem = { title: '', description: '', imageUrl: null, liveUrl: null, githubUrl: null, tags: [] };

export default function ProjectsEditor({ content, onChange }: ProjectsEditorProps) {
  const items = content.items ?? [];

  const update = (i: number, patch: Partial<ProjectItem>) => {
    onChange({ items: items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)) });
  };

  const add = () => onChange({ items: [...items, { ...blank }] });
  const remove = (i: number) => onChange({ items: items.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {items.map((item, i) => (
        <div key={i} style={itemCard}>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Project Title</label>
            <input style={editorInput} placeholder="My Awesome Project" value={item.title} onChange={(e) => update(i, { title: e.target.value })} />
          </div>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Description</label>
            <textarea style={{ ...editorInput, minHeight: 80, resize: 'vertical' }} placeholder="What does this project do?" value={item.description ?? ''} onChange={(e) => update(i, { description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Live URL</label>
              <input style={editorInput} placeholder="https://myproject.com" value={item.liveUrl ?? ''} onChange={(e) => update(i, { liveUrl: e.target.value || null })} />
            </div>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>GitHub URL</label>
              <input style={editorInput} placeholder="https://github.com/..." value={item.githubUrl ?? ''} onChange={(e) => update(i, { githubUrl: e.target.value || null })} />
            </div>
          </div>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Image URL</label>
            <input style={editorInput} placeholder="https://..." value={item.imageUrl ?? ''} onChange={(e) => update(i, { imageUrl: e.target.value || null })} />
          </div>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Tags (comma separated)</label>
            <input style={editorInput} placeholder="React, TypeScript, Node.js" value={(item.tags ?? []).join(', ')} onChange={(e) => update(i, { tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={removeButton} onClick={() => remove(i)}>✕ Remove</button>
          </div>
        </div>
      ))}
      <button style={addButton} onClick={add}>+ Add Project</button>
    </div>
  );
}
