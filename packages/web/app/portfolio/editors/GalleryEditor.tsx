'use client';
// GalleryEditor.tsx

import React from 'react';
import { editorInput, editorLabel, editorFieldGroup, addButton, removeButton, itemCard } from './editorStyles';

interface GalleryImage { url: string; caption?: string; alt?: string; }
interface GalleryEditorProps {
  content: { images: GalleryImage[]; layout?: 'grid' | 'masonry' };
  onChange: (data: { images: GalleryImage[]; layout?: 'grid' | 'masonry' }) => void;
}

export default function GalleryEditor({ content, onChange }: GalleryEditorProps) {
  const images = content.images ?? [];
  const layout = content.layout ?? 'grid';

  const update = (i: number, patch: Partial<GalleryImage>) => {
    onChange({ ...content, images: images.map((img, idx) => (idx === i ? { ...img, ...patch } : img)) });
  };

  const add = () => onChange({ ...content, images: [...images, { url: '', caption: '', alt: '' }] });
  const remove = (i: number) => onChange({ ...content, images: images.filter((_, idx) => idx !== i) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={editorFieldGroup}>
        <label style={editorLabel}>Layout Style</label>
        <select
          style={{ ...editorInput, cursor: 'pointer' }}
          value={layout}
          onChange={(e) => onChange({ ...content, layout: e.target.value as 'grid' | 'masonry' })}
        >
          <option value="grid">Grid</option>
          <option value="masonry">Masonry</option>
        </select>
      </div>

      {images.map((img, i) => (
        <div key={i} style={itemCard}>
          <div style={editorFieldGroup}>
            <label style={editorLabel}>Image URL</label>
            <input style={editorInput} placeholder="https://..." value={img.url} onChange={(e) => update(i, { url: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Caption</label>
              <input style={editorInput} placeholder="Beautiful sunset" value={img.caption ?? ''} onChange={(e) => update(i, { caption: e.target.value })} />
            </div>
            <div style={editorFieldGroup}>
              <label style={editorLabel}>Alt Text</label>
              <input style={editorInput} placeholder="A description for accessibility" value={img.alt ?? ''} onChange={(e) => update(i, { alt: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button style={removeButton} onClick={() => remove(i)}>✕ Remove</button>
          </div>
        </div>
      ))}
      <button style={addButton} onClick={add}>+ Add Image</button>
    </div>
  );
}
