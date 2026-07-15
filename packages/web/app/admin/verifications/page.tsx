'use client';

import React, { useEffect, useState } from 'react';
import { getAdminVerifications, moderateAdminVerification, bulkModerateAdminVerifications } from '../../../services/api';
import { useAdminTheme } from '../AdminThemeContext';

export default function AdminVerificationsPage() {
  const { isLight } = useAdminTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Mode: 'RAPID' (Tinder-style deck with shortcuts) | 'GRID' (Multi-select batch view)
  const [viewMode, setViewMode] = useState<'RAPID' | 'GRID'>('RAPID');
  
  // Rapid Mode active card index
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  
  // Batch Grid selected IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await getAdminVerifications();
      if (res.success && res.data) {
        setRequests(res.data);
        setActiveDeckIndex(0);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error('Failed to load verifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'PENDING');
  const reviewedRequests = requests.filter((r) => r.status !== 'PENDING');
  const currentCard = pendingRequests[activeDeckIndex] || null;

  // ── Keyboard Shortcuts Listener (Rapid Mode) ────────────────
  useEffect(() => {
    if (viewMode !== 'RAPID' || !currentCard || updatingId || batchProcessing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleSingleModerate(currentCard.id, 'APPROVED');
      } else if (e.key === 'ArrowLeft' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleSingleModerate(currentCard.id, 'REJECTED');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Skip to next card in deck
        if (activeDeckIndex < pendingRequests.length - 1) {
          setActiveDeckIndex((prev) => prev + 1);
        } else {
          setActiveDeckIndex(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentCard, updatingId, batchProcessing, activeDeckIndex, pendingRequests.length]);

  // ── Single Item Moderation Handler ──────────────────────────
  const handleSingleModerate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdatingId(id);
    try {
      await moderateAdminVerification(id, { status });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, reviewedAt: new Date().toISOString() } : r))
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      // Adjust index if needed
      if (activeDeckIndex >= pendingRequests.length - 1 && activeDeckIndex > 0) {
        setActiveDeckIndex((prev) => prev - 1);
      }
    } catch (err) {
      alert(`Failed to ${status.toLowerCase()} request.`);
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Batch Moderation Handler (`bulkModerateAdminVerifications`) ──
  const handleBatchModerate = async (status: 'APPROVED' | 'REJECTED') => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} ${selectedIds.size} verification requests simultaneously?`)) return;

    setBatchProcessing(true);
    try {
      const idsArray = Array.from(selectedIds);
      await bulkModerateAdminVerifications({ ids: idsArray, status });
      
      setRequests((prev) =>
        prev.map((r) => (selectedIds.has(r.id) ? { ...r, status, reviewedAt: new Date().toISOString() } : r))
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(err.message || `Failed to perform batch ${status.toLowerCase()}`);
    } finally {
      setBatchProcessing(false);
    }
  };

  // Checkbox toggle logic
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === pendingRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRequests.map((r) => r.id)));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${isLight ? 'border-neutral-200' : 'border-white/10'}`}>
        <div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
            Content & Logo{' '}
            <span className="bg-gradient-to-r from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-200 bg-clip-text text-transparent">
              Moderation Studio
            </span>
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Rapidly inspect and approve/reject profile changes, links, or logo uploads (`Pending: {pendingRequests.length}`).
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className={`flex rounded-xl p-1 border ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-[#14141F] border-white/10'}`}>
            <button
              onClick={() => setViewMode('RAPID')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'RAPID'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>⚡ Rapid Deck</span>
              <span className="px-1.5 py-0.2 rounded bg-black/20 text-[10px]">{pendingRequests.length}</span>
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'GRID'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <span>📦 Batch Grid</span>
              {selectedIds.size > 0 && <span className="px-1.5 py-0.2 rounded bg-amber-400 text-black text-[10px] font-extrabold">{selectedIds.size}</span>}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-neutral-500">Loading pending verification requests...</p>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div
          className={`p-12 rounded-2xl border text-center space-y-3 shadow-xl ${
            isLight
              ? 'bg-white border-neutral-200 shadow-neutral-200/50'
              : 'bg-[#13131D]/80 border-white/10 shadow-black/40'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto">
            🎉
          </div>
          <h3 className={`text-lg font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>Queue Completely Clean!</h3>
          <p className="text-neutral-500 text-sm max-w-md mx-auto">
            All submitted profile verifications, custom titles, and corporate logos have been reviewed. No items pending moderation.
          </p>
        </div>
      ) : viewMode === 'RAPID' ? (
        /* ── 1. RAPID TINDER-STYLE DECK MODE ──────────────────── */
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-full max-w-2xl">
            {/* Keyboard Shortcuts Hint Bar */}
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-t border-x text-xs font-mono ${
              isLight ? 'bg-neutral-100 border-neutral-300 text-neutral-600' : 'bg-white/5 border-white/10 text-neutral-400'
            }`}>
              <div className="flex items-center gap-3">
                <span>⚡ Shortcuts:</span>
                <span className="text-emerald-500 font-bold"><kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/10 text-[11px]">[→] or [A]</kbd> Approve</span>
                <span className="text-red-400 font-bold"><kbd className="px-1.5 py-0.5 rounded bg-black/20 border border-white/10 text-[11px]">[←] or [R]</kbd> Reject</span>
              </div>
              <div>
                <span>Card {activeDeckIndex + 1} of {pendingRequests.length}</span>
              </div>
            </div>

            {/* Active Card Body */}
            {currentCard && (
              <div
                className={`p-6 sm:p-8 rounded-b-2xl border shadow-2xl transition-all relative overflow-hidden ${
                  isLight
                    ? 'bg-white border-neutral-300 shadow-amber-500/10'
                    : 'bg-gradient-to-b from-[#161622] to-[#12121A] border-white/15 shadow-black/80'
                }`}
              >
                {updatingId === currentCard.id && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2 animate-fadeIn">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white font-mono text-xs font-bold">Processing Decision...</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-lg">
                      {currentCard.profile?.displayName?.charAt(0) || currentCard.profile?.username?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className={`text-lg font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                        {currentCard.profile?.displayName || 'Unnamed User'}
                      </h3>
                      <p className="text-xs font-mono text-amber-500 font-bold">
                        @{currentCard.profile?.username || 'user'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                      isLight ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      Field: {currentCard.fieldName}
                    </span>
                    <p className="text-[11px] font-mono text-neutral-500 mt-1">
                      Submitted: {new Date(currentCard.requestedAt).toLocaleDateString()} {new Date(currentCard.requestedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Proposed Content / Diff */}
                <div className="my-8 space-y-4">
                  <div className={`p-5 rounded-2xl border font-mono ${
                    isLight ? 'bg-neutral-50 border-neutral-200 text-neutral-900' : 'bg-[#0A0A10] border-white/10 text-white'
                  }`}>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 block mb-2">
                      Proposed New Value for Approval
                    </span>
                    <div className={`text-base font-bold break-all sm:text-lg ${
                      isLight ? 'text-emerald-700' : 'text-emerald-400'
                    }`}>
                      {currentCard.newValue}
                    </div>
                  </div>

                  {currentCard.fieldName.toLowerCase().includes('logo') || currentCard.fieldName.toLowerCase().includes('picture') ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-xs font-mono text-neutral-400 mb-2">Image Asset Preview:</p>
                      <img
                        src={currentCard.newValue}
                        alt="Proposed upload"
                        className="max-h-48 max-w-full mx-auto rounded-lg border shadow-md object-contain bg-neutral-900 p-2"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Big Action Buttons */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <button
                    disabled={updatingId === currentCard.id}
                    onClick={() => handleSingleModerate(currentCard.id, 'REJECTED')}
                    className={`py-4 px-6 rounded-2xl font-extrabold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 border shadow-lg ${
                      isLight
                        ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-300 shadow-red-500/10 active:scale-95'
                        : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/40 shadow-red-500/10 active:scale-95'
                    }`}
                  >
                    <span>✕ Reject</span>
                    <span className="text-[10px] font-mono opacity-60">[← / R]</span>
                  </button>

                  <button
                    disabled={updatingId === currentCard.id}
                    onClick={() => handleSingleModerate(currentCard.id, 'APPROVED')}
                    className="py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-extrabold text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <span>✓ Approve</span>
                    <span className="text-[10px] font-mono bg-black/20 px-1.5 py-0.5 rounded text-black font-bold">[→ / A]</span>
                  </button>
                </div>

                {/* Deck Paginator */}
                {pendingRequests.length > 1 && (
                  <div className="flex items-center justify-between pt-6 mt-4 border-t border-white/5 text-xs font-mono text-neutral-500">
                    <button
                      onClick={() => setActiveDeckIndex((prev) => (prev > 0 ? prev - 1 : pendingRequests.length - 1))}
                      className="hover:text-amber-400 transition-colors"
                    >
                      ← Previous Card
                    </button>
                    <div className="flex items-center gap-1.5">
                      {pendingRequests.slice(0, 10).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveDeckIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === activeDeckIndex ? 'bg-amber-500 w-4' : 'bg-neutral-600 hover:bg-neutral-400'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveDeckIndex((prev) => (prev < pendingRequests.length - 1 ? prev + 1 : 0))}
                      className="hover:text-amber-400 transition-colors"
                    >
                      Skip Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── 2. MULTI-SELECT BATCH GRID MODE ──────────────────── */
        <div className="space-y-6">
          {/* Batch Action Bar */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight
                ? 'bg-neutral-100 border-neutral-300 text-neutral-800'
                : 'bg-[#161622] border-white/10 text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === pendingRequests.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-amber-500 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-xs font-mono font-bold">
                {selectedIds.size === 0 ? 'Select All Pending' : `${selectedIds.size} of ${pendingRequests.length} Selected`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={selectedIds.size === 0 || batchProcessing}
                onClick={() => handleBatchModerate('REJECTED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border disabled:opacity-40 ${
                  isLight
                    ? 'bg-red-100 hover:bg-red-200 text-red-700 border-red-300'
                    : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/40'
                }`}
              >
                ✕ Batch Reject ({selectedIds.size})
              </button>
              <button
                disabled={selectedIds.size === 0 || batchProcessing}
                onClick={() => handleBatchModerate('APPROVED')}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-bold font-mono text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all"
              >
                {batchProcessing ? 'Batch Processing...' : `✓ Batch Approve (${selectedIds.size})`}
              </button>
            </div>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isUpdating = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? isLight
                        ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-400'
                        : 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500'
                      : isLight
                        ? 'bg-white border-neutral-200 hover:border-neutral-300'
                        : 'bg-[#13131D] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-amber-500 text-amber-500"
                      />
                      <div>
                        <h4 className={`font-bold text-sm ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                          @{item.profile?.username}
                        </h4>
                        <p className="text-[11px] font-mono text-neutral-500">{item.profile?.displayName}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-white/5 text-amber-400'
                    }`}>
                      {item.fieldName}
                    </span>
                  </div>

                  <div className="py-3 font-mono text-xs">
                    <span className="text-neutral-500 text-[10px] uppercase block">Proposed Value:</span>
                    <p className={`font-bold mt-0.5 break-all ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      {item.newValue}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                    <span>{new Date(item.requestedAt).toLocaleTimeString()}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={isUpdating || batchProcessing}
                        onClick={() => handleSingleModerate(item.id, 'APPROVED')}
                        className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-500 font-bold hover:bg-emerald-500/25 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        disabled={isUpdating || batchProcessing}
                        onClick={() => handleSingleModerate(item.id, 'REJECTED')}
                        className="px-2.5 py-1 rounded bg-red-500/15 text-red-400 font-bold hover:bg-red-500/25 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Table */}
      {reviewedRequests.length > 0 && (
        <div
          className={`p-6 sm:p-8 rounded-2xl border shadow-xl ${
            isLight
              ? 'bg-white border-neutral-200 shadow-neutral-200/50'
              : 'bg-[#13131D]/80 border-white/10 shadow-black/40'
          }`}
        >
          <h3 className={`text-lg font-bold pb-6 border-b ${isLight ? 'text-neutral-900 border-neutral-200' : 'text-white border-white/10'}`}>
            Recent Moderation History (`{reviewedRequests.length} Reviewed`)
          </h3>
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className={`border-b uppercase tracking-wider ${isLight ? 'border-neutral-200 text-neutral-500 bg-neutral-50' : 'border-white/10 text-neutral-500'}`}>
                  <th className="py-3 px-4">Profile</th>
                  <th className="py-3 px-4">Field</th>
                  <th className="py-3 px-4">Value</th>
                  <th className="py-3 px-4">Decision</th>
                  <th className="py-3 px-4">Reviewed At</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-sm ${isLight ? 'divide-neutral-200' : 'divide-white/5'}`}>
                {reviewedRequests.slice(0, 15).map((r) => (
                  <tr key={r.id} className={`transition-colors ${isLight ? 'hover:bg-neutral-50' : 'hover:bg-white/[0.02]'}`}>
                    <td className={`py-3 px-4 font-bold font-sans ${isLight ? 'text-neutral-900' : 'text-white'}`}>@{r.profile?.username}</td>
                    <td className={`py-3 px-4 ${isLight ? 'text-amber-700 font-bold' : 'text-amber-400'}`}>{r.fieldName}</td>
                    <td className={`py-3 px-4 max-w-xs truncate ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`}>{r.newValue}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] uppercase font-bold border ${
                          r.status === 'APPROVED'
                            ? isLight ? 'bg-emerald-500/15 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isLight ? 'bg-red-500/15 text-red-800 border-red-300' : 'bg-red-500/10 text-red-400 border-red-500/30'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-xs ${isLight ? 'text-neutral-500' : 'text-neutral-500'}`}>
                      {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
