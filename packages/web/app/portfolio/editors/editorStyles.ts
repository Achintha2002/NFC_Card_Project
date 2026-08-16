// ============================================================
//  Shared editor styles — used by all section editors
// ============================================================

import React from 'react';

export const editorFieldGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

export const editorLabel: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.6)',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

export const editorInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#f0f0f8',
  fontSize: '0.92rem',
  outline: 'none',
  width: '100%',
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.2s',
};

export const editorButton: React.CSSProperties = {
  padding: '8px 18px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '0.85rem',
  fontFamily: 'Inter, sans-serif',
};

export const addButton: React.CSSProperties = {
  ...editorButton,
  background: 'rgba(100,81,250,0.2)',
  color: '#a78bfa',
  border: '1px dashed rgba(100,81,250,0.4)',
  width: '100%',
  padding: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

export const removeButton: React.CSSProperties = {
  ...editorButton,
  background: 'rgba(239,68,68,0.15)',
  color: '#f87171',
  border: '1px solid rgba(239,68,68,0.2)',
  padding: '6px 12px',
  fontSize: '0.78rem',
};

export const itemCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};
