'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { bulkProvisionAdminNfcCard, getAdminInventory } from '../../../../services/api';
import { useAdminTheme } from '../../AdminThemeContext';

interface ProvisionedHistoryItem {
  id: string;
  uid: string;
  serialNumber: string;
  activationCode: string;
  activationUrl: string;
  alreadyProvisioned: boolean;
  timestamp: string;
}

export default function AdminProvisionStudioPage() {
  const { isLight } = useAdminTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>(`STUDIO-${new Date().toISOString().slice(0, 10)}-${Math.floor(100 + Math.random() * 900)}`);
  
  // Scanner modes: 'WEDGE' (USB Keyboard Wedge) | 'WEBNFC' (Web NDEFReader)
  const [scannerMode, setScannerMode] = useState<'WEDGE' | 'WEBNFC'>('WEDGE');
  const [isNfcSupported, setIsNfcSupported] = useState<boolean>(false);
  const [isScanningNfc, setIsScanningNfc] = useState<boolean>(false);
  
  // Wedge input buffer & manual UID field
  const [wedgeBuffer, setWedgeBuffer] = useState<string>('');
  const [manualUid, setManualUid] = useState<string>('');
  const wedgeInputRef = useRef<HTMLInputElement>(null);
  
  // Provisioning state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastCard, setLastCard] = useState<ProvisionedHistoryItem | null>(null);
  const [history, setHistory] = useState<ProvisionedHistoryItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check Web NFC support
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setIsNfcSupported(true);
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await getAdminInventory();
      if (res.success && res.data) {
        setProducts(res.data);
        if (res.data.length > 0) {
          setSelectedProductId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load inventory products:', err);
    }
  };

  // ── Audio Tone Generator (`AudioContext`) ───────────────────
  const playSound = (type: 'SUCCESS' | 'EXISTS' | 'ERROR') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      if (type === 'SUCCESS') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5 high beep
        osc.frequency.setValueAtTime(1318.5, now + 0.08); // E6 higher beep
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'EXISTS') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now); // Low buzz
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Audio autoplay restrictions or browser error
    }
  };

  // ── Auto-Provision Execution ────────────────────────────────
  const processUid = async (uidToProcess: string) => {
    const cleanedUid = uidToProcess.trim().toUpperCase();
    if (!cleanedUid) return;
    
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      const res = await bulkProvisionAdminNfcCard({
        uid: cleanedUid,
        productId: selectedProductId || undefined,
        batchNumber: batchNumber.trim() || undefined,
      });

      if (res.success && res.data) {
        const item: ProvisionedHistoryItem = {
          id: res.data.card.id || Math.random().toString(),
          uid: cleanedUid,
          serialNumber: res.data.card.serialNumber,
          activationCode: res.data.card.activationCode,
          activationUrl: res.data.activationUrl,
          alreadyProvisioned: res.data.alreadyProvisioned,
          timestamp: new Date().toLocaleTimeString(),
        };

        setLastCard(item);
        setHistory((prev) => [item, ...prev.filter((h) => h.uid !== cleanedUid)]);

        if (res.data.alreadyProvisioned) {
          playSound('EXISTS');
        } else {
          playSound('SUCCESS');
        }
      } else {
        setErrorMessage(res.message || 'Failed to provision NFC card');
        playSound('ERROR');
      }
    } catch (err: any) {
      console.error('Provisioning error:', err);
      setErrorMessage(err.message || 'Server error during card provisioning');
      playSound('ERROR');
    } finally {
      setIsProcessing(false);
      setManualUid('');
      setWedgeBuffer('');
      if (scannerMode === 'WEDGE' && wedgeInputRef.current) {
        wedgeInputRef.current.focus();
      }
    }
  };

  // ── Web NFC `NDEFReader` Handler ────────────────────────────
  const startWebNfcScan = async () => {
    if (!('NDEFReader' in window)) {
      alert('Web NFC is not supported on this browser/device. Please use Chrome on Android or switch to USB Wedge Scanner Mode.');
      return;
    }
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      setIsScanningNfc(true);
      setErrorMessage(null);

      ndef.onreading = (event: any) => {
        const serialNumber = event.serialNumber; // e.g. "12:34:56:78:9A:BC"
        if (serialNumber) {
          processUid(serialNumber);
        } else {
          setErrorMessage('Could not read hardware UID from NFC tag.');
          playSound('ERROR');
        }
      };

      ndef.onreadingerror = () => {
        setErrorMessage('NFC reading error. Try repositioning the card.');
        playSound('ERROR');
      };
    } catch (error: any) {
      console.error('Web NFC scan error:', error);
      setIsScanningNfc(false);
      setErrorMessage(`Web NFC scan stopped: ${error.message || 'Permission denied or unsupported'}`);
    }
  };

  // ── Keyboard Wedge Event Listener ───────────────────────────
  const handleWedgeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (wedgeBuffer.trim()) {
        processUid(wedgeBuffer);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${isLight ? 'border-neutral-200' : 'border-white/10'}`}>
        <div>
          <div className="flex items-center gap-2 text-xs font-mono mb-2">
            <Link href="/admin/cards" className="text-amber-500 hover:underline">
              ← Back to NFC Cards
            </Link>
            <span className="text-neutral-500">/</span>
            <span className={isLight ? 'text-neutral-700 font-bold' : 'text-neutral-300 font-bold'}>Provisioning Studio</span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
            NFC Auto-Provision{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Studio
            </span>
          </h1>
          <p className={`text-sm mt-1 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Rapid hardware chip enrollment. Place physical NFC cards on reader to auto-encode serial numbers and activation PINs.
          </p>
        </div>

        {/* Studio Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              soundEnabled
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-neutral-500/10 text-neutral-400 border-neutral-500/30'
            }`}
            title="Audio feedback on card scan"
          >
            <span>{soundEnabled ? '🔊 Audio ON' : '🔇 Audio OFF'}</span>
          </button>

          <div className={`flex rounded-xl p-1 border ${isLight ? 'bg-neutral-100 border-neutral-300' : 'bg-[#14141F] border-white/10'}`}>
            <button
              onClick={() => {
                setScannerMode('WEDGE');
                setTimeout(() => wedgeInputRef.current?.focus(), 50);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                scannerMode === 'WEDGE'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              ⌨️ USB Wedge Reader
            </button>
            <button
              onClick={() => {
                setScannerMode('WEBNFC');
                startWebNfcScan();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                scannerMode === 'WEBNFC'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              📱 Web NFC Reader
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Scanner & Target Batch Config */}
        <div className="lg:col-span-1 space-y-6">
          {/* Target SKU & Batch Configuration Card */}
          <div
            className={`p-6 rounded-2xl border shadow-xl ${
              isLight
                ? 'bg-white border-neutral-200 shadow-neutral-200/50'
                : 'bg-[#13131D]/80 border-white/10 shadow-black/40'
            }`}
          >
            <h3 className={`text-base font-bold pb-3 border-b ${isLight ? 'text-neutral-900 border-neutral-200' : 'text-white border-white/10'}`}>
              📦 Target Configuration
            </h3>
            <div className="space-y-4 mt-4">
              <div>
                <label className={`block text-xs font-mono uppercase mb-1.5 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                  Assign to Product SKU
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-emerald-500 outline-none border ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:bg-white'
                      : 'bg-[#0B0B11] border-white/10 text-white'
                  }`}
                >
                  <option value="">Unspecified SKU (Generic Card)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-mono uppercase mb-1.5 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
                  Session Batch Number
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-OCT-01"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-mono focus:border-emerald-500 outline-none border ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300 text-neutral-900 focus:bg-white'
                      : 'bg-[#0B0B11] border-white/10 text-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Active Reader Box */}
          <div
            className={`p-6 rounded-2xl border text-center shadow-xl transition-all ${
              isLight
                ? 'bg-white border-neutral-200 shadow-neutral-200/50'
                : 'bg-[#13131D]/80 border-white/10 shadow-black/40'
            }`}
          >
            {scannerMode === 'WEDGE' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto">
                  ⌨️
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                    USB Wedge Reader Ready
                  </h4>
                  <p className={`text-xs mt-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Click input box below and scan physical card with your USB RFID reader.
                  </p>
                </div>

                <div className="relative">
                  <input
                    ref={wedgeInputRef}
                    type="text"
                    value={wedgeBuffer}
                    onChange={(e) => setWedgeBuffer(e.target.value)}
                    onKeyDown={handleWedgeKeyDown}
                    placeholder="Auto-capture UID from reader..."
                    autoFocus
                    className={`w-full rounded-xl px-4 py-3 text-center font-mono text-sm tracking-widest font-bold border-2 focus:border-emerald-500 outline-none transition-all ${
                      isLight
                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900 placeholder:text-neutral-400'
                        : 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400 placeholder:text-neutral-600'
                    }`}
                  />
                  {wedgeBuffer && (
                    <button
                      onClick={() => setWedgeBuffer('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 text-xs font-mono"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-white/5">
                  <p className="text-[11px] text-neutral-500">
                    💡 <span className="font-semibold">Manual Entry:</span> Or type/paste UID and press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-[10px]">Enter</kbd>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto ${
                  isScanningNfc ? 'bg-emerald-500/20 text-emerald-400 animate-pulse' : 'bg-neutral-500/10 text-neutral-400'
                }`}>
                  📱
                </div>
                <div>
                  <h4 className={`font-bold text-base ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                    {isScanningNfc ? 'Web NFC Reader Listening...' : 'Web NFC Reader Idle'}
                  </h4>
                  <p className={`text-xs mt-1 max-w-xs mx-auto ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {isScanningNfc
                      ? 'Hold physical NFC card against the back of your Android phone or reader chip.'
                      : 'Click button below to request NFC browser permissions.'}
                  </p>
                </div>

                {!isScanningNfc && (
                  <button
                    onClick={startWebNfcScan}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-lg hover:scale-105 transition-all"
                  >
                    🚀 Start NFC Listening
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Card Preview & Scan History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Last Provisioned Hero Preview */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border shadow-2xl relative overflow-hidden ${
              isLight
                ? 'bg-gradient-to-br from-white via-emerald-50/30 to-white border-neutral-200 shadow-neutral-200/60'
                : 'bg-gradient-to-br from-[#13131D] via-[#1A2624] to-[#13131D] border-white/10 shadow-black/60'
            }`}
          >
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3 animate-fadeIn">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white font-mono text-sm font-bold">Encoding NFC Card UID...</p>
              </div>
            )}

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-500 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Latest Provisioned Card
              </span>
              {lastCard && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                  lastCard.alreadyProvisioned
                    ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                }`}>
                  {lastCard.alreadyProvisioned ? 'RE-SCANNED (EXISTING)' : 'NEWLY PROVISIONED ✨'}
                </span>
              )}
            </div>

            {lastCard ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Visual Card Mock */}
                <div className="sm:col-span-2 space-y-4">
                  <div>
                    <p className={`text-xs font-mono uppercase ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>Serial Number</p>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-500">
                      {lastCard.serialNumber}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-black/30 border-white/5'}`}>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase">Hardware UID</p>
                      <p className="font-mono font-bold text-sm truncate mt-0.5 text-neutral-300">{lastCard.uid}</p>
                    </div>

                    <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-neutral-200' : 'bg-black/30 border-white/5'}`}>
                      <p className="text-[10px] font-mono text-neutral-500 uppercase">Activation PIN</p>
                      <p className="font-mono font-bold text-sm tracking-widest mt-0.5 text-amber-400">{lastCard.activationCode}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-neutral-400 font-mono">
                      🔗 Activation URL: <span className="underline truncate text-neutral-300">{lastCard.activationUrl}</span>
                    </p>
                  </div>
                </div>

                {/* QR Code Graphic Box */}
                <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-black border border-neutral-300 shadow-md">
                  <div className="w-28 h-28 flex items-center justify-center bg-neutral-100 rounded-xl border border-neutral-200 text-center p-2 font-mono text-[10px] text-neutral-600">
                    <span>📱 QR Link to {lastCard.serialNumber}</span>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-neutral-800 mt-2">Scan to Activate</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2">
                <p className="text-3xl">📇</p>
                <h4 className={`font-bold text-base ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                  Waiting for First Card Scan
                </h4>
                <p className={`text-xs max-w-sm mx-auto ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Place a card on your USB wedge scanner or tap via Web NFC to auto-generate serial number and PIN immediately.
                </p>
              </div>
            )}
          </div>

          {/* Session Scan History */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border shadow-xl ${
              isLight
                ? 'bg-white border-neutral-200 shadow-neutral-200/50'
                : 'bg-[#13131D]/80 border-white/10 shadow-black/40'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                  Session Scan History (`Total: {history.length}`)
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 font-mono">
                  All hardware tags read during this browser window session.
                </p>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear Session History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-12 text-center text-neutral-500 text-xs font-mono">
                No cards provisioned in current session.
              </div>
            ) : (
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                      isLight ? 'border-neutral-200 text-neutral-500 bg-neutral-50' : 'border-white/10 text-neutral-400'
                    }`}>
                      <th className="py-2.5 px-3">Serial #</th>
                      <th className="py-2.5 px-3">UID</th>
                      <th className="py-2.5 px-3">PIN</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono text-xs ${isLight ? 'divide-neutral-200' : 'divide-white/5'}`}>
                    {history.map((h) => (
                      <tr key={h.id} className={`transition-colors ${isLight ? 'hover:bg-neutral-50' : 'hover:bg-white/[0.02]'}`}>
                        <td className="py-3 px-3 font-bold text-emerald-500">{h.serialNumber}</td>
                        <td className="py-3 px-3 text-neutral-300 font-semibold">{h.uid}</td>
                        <td className="py-3 px-3 text-amber-400 font-bold tracking-wider">{h.activationCode}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            h.alreadyProvisioned
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {h.alreadyProvisioned ? 'Existing' : 'New ✨'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-neutral-500 text-[11px]">{h.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
