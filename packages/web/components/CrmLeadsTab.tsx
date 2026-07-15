'use client';
// ============================================================
//  TAGIT — CRM Leads & Contact Management Tab
//  Displays visitors who submitted contact forms via NFC profiles.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  Mail,
  Phone,
  Building2,
  Trash2,
  Download,
  Search,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface LeadItem {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  createdAt: string;
}

interface CrmLeadsTabProps {
  theme?: 'light' | 'dark';
  apiUrl?: string;
}

export function CrmLeadsTab({
  theme = 'light',
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
}: CrmLeadsTabProps) {
  const isLight = theme === 'light';
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('nexus_access_token') || localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/v1/leads/my-profile`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch captured leads.');
      }
      setLeads(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Error loading CRM leads.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact lead?')) return;
    try {
      const token = localStorage.getItem('nexus_access_token') || localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/v1/leads/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const exportCsv = () => {
    if (leads.length === 0) return;
    const headers = ['Name', 'Email', 'Phone', 'Company/Title', 'Notes', 'Captured Date'];
    const rows = leads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(l.createdAt).toLocaleDateString()}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tagit_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.phone && l.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Bar */}
      <div
        className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-neutral-200/80' : 'bg-neutral-900 border-neutral-800'
        }`}
      >
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-cyan-500" />
            <span>Captured Contact Leads ({leads.length})</span>
          </h2>
          <p className={`text-sm mt-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            Contacts who submitted their information after tapping your TAGIT digital card.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchLeads}
            disabled={isLoading}
            className={`p-2.5 rounded-xl border transition ${
              isLight
                ? 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-700'
                : 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-300'
            }`}
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={exportCsv}
            disabled={leads.length === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search leads by name, email, phone, or company..."
          className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm transition focus:outline-none focus:ring-2 ${
            isLight
              ? 'bg-white border-neutral-200 focus:border-cyan-500 focus:ring-cyan-500/20 text-neutral-800 placeholder-neutral-400 shadow-sm'
              : 'bg-neutral-900 border-neutral-800 focus:border-cyan-500 focus:ring-cyan-500/20 text-white placeholder-neutral-500'
          }`}
        />
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-500 mb-3" />
          <p className="text-sm font-medium opacity-70">Loading captured contact leads...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-bold">Failed to load CRM leads</p>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div
          className={`py-16 px-6 rounded-3xl border text-center ${
            isLight ? 'bg-white border-neutral-200/80 text-neutral-600' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-500 mx-auto mb-4">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-neutral-900' : 'text-white'}`}>No contact leads captured yet</h3>
          <p className="text-sm max-w-md mx-auto opacity-80">
            When someone taps your TAGIT card and clicks "Exchange Contacts / Connect 📇", their contact information will automatically appear right here!
          </p>
        </div>
      ) : (
        /* Leads Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`p-5 rounded-2xl border transition shadow-sm hover:shadow-md relative group flex flex-col justify-between ${
                isLight
                  ? 'bg-white border-neutral-200/80 hover:border-cyan-300'
                  : 'bg-neutral-900 border-neutral-800 hover:border-cyan-500/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className={`font-bold text-base tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                      {lead.name}
                    </h4>
                    {lead.company && (
                      <p className="text-xs font-semibold text-cyan-500 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{lead.company}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition"
                    title="Delete Lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 mt-3 text-sm">
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className={`flex items-center gap-2 truncate ${
                        isLight ? 'text-neutral-600 hover:text-cyan-600' : 'text-neutral-300 hover:text-cyan-400'
                      }`}
                    >
                      <Mail className="w-4 h-4 flex-shrink-0 opacity-60" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className={`flex items-center gap-2 ${
                        isLight ? 'text-neutral-600 hover:text-cyan-600' : 'text-neutral-300 hover:text-cyan-400'
                      }`}
                    >
                      <Phone className="w-4 h-4 flex-shrink-0 opacity-60" />
                      <span>{lead.phone}</span>
                    </a>
                  )}
                  {lead.notes && (
                    <div
                      className={`p-2.5 rounded-xl text-xs mt-3 ${
                        isLight ? 'bg-neutral-100 text-neutral-700' : 'bg-neutral-800/80 text-neutral-300'
                      }`}
                    >
                      <p className="font-semibold uppercase text-[10px] opacity-60 mb-1">Note / Context:</p>
                      <p className="italic leading-relaxed">"{lead.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs opacity-60 ${isLight ? 'border-neutral-100' : 'border-neutral-800'}`}>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                </span>
                <span>TAGIT CRM</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
