import React, { useState, useMemo } from 'react';
import { PrizeBond } from '../types';
import { Plus, Trash2, Search, SlidersHorizontal, BookOpen, Layers, Sparkles, HelpCircle, Edit2, Check, X } from 'lucide-react';

interface MyBondsProps {
  bonds: PrizeBond[];
  onAddBonds: (newBonds: Omit<PrizeBond, 'id' | 'createdAt'>[]) => void;
  onDeleteBonds: (ids: string[]) => void;
  onUpdateBond: (id: string, updatedFields: Partial<PrizeBond>) => void;
  onClearAll: () => void;
  userRole: 'general' | 'admin';
}

export default function MyBonds({ bonds, onAddBonds, onDeleteBonds, onUpdateBond, onClearAll, userRole }: MyBondsProps) {
  // Input states
  const [activeTab, setActiveTab] = useState<'single' | 'range' | 'bulk'>('single');
  
  // Single bond
  const [singleNumber, setSingleNumber] = useState('');
  const [singleSeries, setSingleSeries] = useState('কখ');
  const [singleNote, setSingleNote] = useState('');

  // Range bond
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeSeries, setRangeSeries] = useState('কখ');
  const [rangeNote, setRangeNote] = useState('');

  // Bulk paste
  const [bulkText, setBulkText] = useState('');
  const [bulkSeries, setBulkSeries] = useState('কখ');
  const [bulkNote, setBulkNote] = useState('');

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Error/Success messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editSeries, setEditSeries] = useState('');
  const [editNote, setEditNote] = useState('');

  const handleStartEdit = (bond: PrizeBond) => {
    setError(null);
    setSuccess(null);
    setEditingId(bond.id);
    setEditNumber(bond.number);
    setEditSeries(bond.series || 'কখ');
    setEditNote(bond.note || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    setError(null);
    setSuccess(null);

    const cleanNum = editNumber.trim();
    if (!validate7Digits(cleanNum)) {
      setError('Prize Bond number must be exactly 7 digits (e.g. 0123456).');
      return;
    }

    onUpdateBond(id, {
      number: cleanNum,
      series: editSeries,
      note: editNote.trim() || undefined
    });

    setSuccess(`Successfully updated bond details.`);
    setEditingId(null);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Quick helper to fill some test bonds for the user
  const handleQuickDemo = () => {
    const demoBonds = [
      { number: '0543210', series: 'কখ', note: 'Demo - 115th Draw 1st Prize' },
      { number: '0876543', series: 'কখ', note: 'Demo - 115th Draw 2nd Prize' },
      { number: '0112233', series: 'কগ', note: 'Demo - 115th Draw 3rd Prize' },
      { number: '0256841', series: 'কখ', note: 'Demo - 114th Draw 1st Prize' },
      { number: '0941258', series: 'কঘ', note: 'Demo - 114th Draw 2nd Prize' },
      { number: '0000123', series: 'কখ', note: 'Demo - 115th Draw 5th Prize' },
      { number: '0121212', series: 'কখ', note: 'Demo - 114th Draw 5th Prize' },
      // Sequential booklet of 10 bonds
      ...Array.from({ length: 10 }).map((_, i) => ({
        number: String(1234500 + i).padStart(7, '0'),
        series: 'কখ',
        note: `Demo Booklet - Series ${1234500 + i}`
      }))
    ];
    onAddBonds(demoBonds);
    setSuccess('Injected 17 demo bonds into your list! Try clicking "Raffle Checker" next.');
    setTimeout(() => setSuccess(null), 5000);
  };

  // Series options for dropdowns
  const seriesList = ['কক', 'কখ', 'কগ', 'কঘ', 'কঙ', 'কচ', 'কছ', 'কজ', 'কঝ', 'কঞ', 'কট', 'কঠ', 'কড', 'কঢ', 'কত', 'ক্থ', 'কদ', 'কধ', 'কন', 'কপ', 'কফ', 'কব', 'কভ', 'কম', 'কয', 'কর', 'কল', 'কশ', 'কষ', 'কস', 'কহ', 'খক', 'খখ', 'খগ', 'খঘ', 'খঙ'];

  const validate7Digits = (num: string) => /^\d{7}$/.test(num.trim());

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanNum = singleNumber.trim();
    if (!validate7Digits(cleanNum)) {
      setError('Prize Bond number must be exactly 7 digits (e.g. 0123456).');
      return;
    }

    onAddBonds([{
      number: cleanNum,
      series: singleSeries,
      note: singleNote.trim() || undefined
    }]);

    setSuccess(`Added Bond ${singleSeries} ${cleanNum} successfully!`);
    setSingleNumber('');
    setSingleNote('');
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleAddRange = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const start = rangeStart.trim();
    const end = rangeEnd.trim();

    if (!validate7Digits(start) || !validate7Digits(end)) {
      setError('Both start and end numbers must be exactly 7 digits.');
      return;
    }

    const startVal = parseInt(start, 10);
    const endVal = parseInt(end, 10);

    if (startVal > endVal) {
      setError('Start number cannot be greater than end number.');
      return;
    }

    const count = endVal - startVal + 1;
    if (count > 500) {
      setError('To protect performance, you can add a maximum of 500 bonds in a single range.');
      return;
    }

    const newBonds: Omit<PrizeBond, 'id' | 'createdAt'>[] = [];
    for (let val = startVal; val <= endVal; val++) {
      newBonds.push({
        number: String(val).padStart(7, '0'),
        series: rangeSeries,
        note: rangeNote.trim() ? `${rangeNote.trim()} (${newBonds.length + 1}/${count})` : undefined
      });
    }

    onAddBonds(newBonds);
    setSuccess(`Successfully added range of ${count} bonds from ${start} to ${end}!`);
    setRangeStart('');
    setRangeEnd('');
    setRangeNote('');
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleAddBulk = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Extract all 7 digit blocks
    const numbersFound = bulkText.match(/\b\d{7}\b/g) || [];
    
    if (numbersFound.length === 0) {
      setError('No valid 7-digit numbers were found in the text. Please separate numbers with commas, spaces, or new lines.');
      return;
    }

    const newBonds = numbersFound.map(num => ({
      number: num,
      series: bulkSeries,
      note: bulkNote.trim() || undefined
    }));

    onAddBonds(newBonds);
    setSuccess(`Successfully parsed and added ${newBonds.length} bonds!`);
    setBulkText('');
    setBulkNote('');
    setTimeout(() => setSuccess(null), 5000);
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = (filteredBonds: PrizeBond[]) => {
    if (selectedIds.size === filteredBonds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBonds.map(b => b.id)));
    }
  };

  const handleDeleteSelected = () => {
    onDeleteBonds(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSuccess('Selected bonds deleted.');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Filtering & Search
  const filteredBonds = useMemo(() => {
    return bonds.filter(bond => {
      const matchesSearch = 
        bond.number.includes(searchQuery) || 
        (bond.note && bond.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (bond.series && bond.series.includes(searchQuery));
      
      const matchesSeries = selectedSeriesFilter === 'all' || bond.series === selectedSeriesFilter;

      return matchesSearch && matchesSeries;
    });
  }, [bonds, searchQuery, selectedSeriesFilter]);

  // Unique series present in the active inventory
  const activeSeriesFilters = useMemo(() => {
    const seriesSet = new Set<string>();
    bonds.forEach(b => {
      if (b.series) seriesSet.add(b.series);
    });
    return Array.from(seriesSet);
  }, [bonds]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-slate-800" id="my-bonds-module">
      
      {/* LEFT: Add Bonds Forms */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-md font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-500" />
              Add Prize Bonds
            </h2>
            <button 
              onClick={handleQuickDemo}
              className="text-xs bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 font-medium px-2.5 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer"
              title="Quickly populate your list with test bonds matching historical draws for testing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Fill Quick Demo
            </button>
          </div>

          {/* Form Tabs */}
          <div className="flex bg-slate-100/80 p-1 rounded-lg gap-1 mb-4 border border-slate-200/50">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Single Bond
            </button>
            <button
              onClick={() => setActiveTab('range')}
              className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'range'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sequential Book
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === 'bulk'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/30'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bulk Paste
            </button>
          </div>

          {/* Form Alerts */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs px-3 py-2 rounded-lg mb-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs px-3 py-2 rounded-lg mb-3">
              {success}
            </div>
          )}

          {/* TAB 1: SINGLE */}
          {activeTab === 'single' && (
            <form onSubmit={handleAddSingle} className="flex flex-col gap-3.5">
              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Series (Prefix)</label>
                  <select 
                    value={singleSeries}
                    onChange={(e) => setSingleSeries(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                  >
                    {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">7-Digit Number</label>
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="e.g. 0543210"
                    value={singleNumber}
                    onChange={(e) => setSingleNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden font-mono tracking-wider"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Personal savings, Gift from uncle"
                  value={singleNote}
                  onChange={(e) => setSingleNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add This Bond
              </button>
            </form>
          )}

          {/* TAB 2: RANGE / BOOK */}
          {activeTab === 'range' && (
            <form onSubmit={handleAddRange} className="flex flex-col gap-3.5">
              <p className="text-[11px] text-slate-500 mb-1">
                Ideal for series books. Enter the start and end of the sequential numbers.
              </p>
              
              <div className="flex gap-2">
                <div className="w-1/4">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Series</label>
                  <select 
                    value={rangeSeries}
                    onChange={(e) => setRangeSeries(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                  >
                    {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Start Number</label>
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="e.g. 0543200"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden font-mono tracking-wider"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">End Number</label>
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="e.g. 0543299"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden font-mono tracking-wider"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Booklet Label / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Booklet Series A"
                  value={rangeNote}
                  onChange={(e) => setRangeNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Layers className="w-4 h-4" /> Add Sequential Range
              </button>
            </form>
          )}

          {/* TAB 3: BULK */}
          {activeTab === 'bulk' && (
            <form onSubmit={handleAddBulk} className="flex flex-col gap-3.5">
              <p className="text-[11px] text-slate-500 mb-1">
                Paste any messy text block. We will automatically grab all 7-digit numbers.
              </p>

              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Series for All</label>
                  <select 
                    value={bulkSeries}
                    onChange={(e) => setBulkSeries(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                  >
                    {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Label/Note</label>
                  <input
                    type="text"
                    placeholder="e.g. Pasted batch 1"
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Raw Numbers Text Block</label>
                <textarea
                  placeholder="Paste numbers here, separated by space, line, commas:&#10;0543210 0332211&#10;0112233, 0876543"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <BookOpen className="w-4 h-4" /> Extract & Add Bonds
              </button>
            </form>
          )}
        </div>

        {/* Informative Help Guide Card */}
        <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-4 text-xs text-sky-950 flex gap-3">
          <HelpCircle className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-sky-900">How checking works:</span>
            <span>Prize bond draws in Bangladesh apply to <strong>all prefixes/series</strong>. For instance, if <code className="bg-sky-100 font-bold px-1 rounded">0123456</code> is drawn, and you own <code className="bg-sky-100 font-bold px-1 rounded">কখ 0123456</code> or <code className="bg-sky-100 font-bold px-1 rounded">কগ 0123456</code>, you win! The app checks matching numbers instantly.</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Bonds Table View */}
      <div className="lg:col-span-7 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm h-full max-h-[560px]">
        
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-md font-semibold tracking-tight text-slate-900">
              My Bonds Inventory
            </h2>
            <span className="bg-slate-200/60 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              {bonds.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100/80 px-2.5 py-1.5 rounded-lg border border-rose-200 font-medium transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedIds.size})
              </button>
            )}

            {bonds.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-all border border-slate-200 cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bond number or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
            />
          </div>
          
          <div className="flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSeriesFilter}
              onChange={(e) => setSelectedSeriesFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 focus:outline-hidden"
            >
              <option value="all">All Series</option>
              {activeSeriesFilters.map(sf => (
                <option key={sf} value={sf}>{sf}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50/50">
          {filteredBonds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <Layers className="w-8 h-8 text-slate-300" />
              <span className="text-xs">
                {bonds.length === 0 
                  ? "No prize bonds added yet." 
                  : "No bonds match your filters."}
              </span>
              {bonds.length === 0 && (
                <button
                  onClick={handleQuickDemo}
                  className="text-xs text-sky-500 hover:underline font-medium mt-1 cursor-pointer"
                >
                  Load sample bonds
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 z-10 backdrop-blur-xs">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredBonds.length > 0 && selectedIds.size === filteredBonds.length}
                      onChange={() => toggleSelectAll(filteredBonds)}
                      className="rounded-sm border-slate-300 text-sky-500 focus:ring-sky-400 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-32">Bond Code</th>
                  <th className="py-2.5 px-3">Note/Label</th>
                  <th className="py-2.5 px-3 text-right w-24">Added On</th>
                  <th className="py-2.5 px-3 text-center w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBonds.map((bond) => {
                  const isSelected = selectedIds.has(bond.id);
                  const isEditing = editingId === bond.id;
                  return (
                    <tr 
                      key={bond.id}
                      onClick={() => {
                        if (!isEditing) {
                          toggleSelect(bond.id);
                        }
                      }}
                      className={`hover:bg-slate-100/50 transition-colors ${
                        isEditing 
                          ? 'bg-sky-50/50' 
                          : isSelected 
                            ? 'bg-sky-500/10 hover:bg-sky-500/15 cursor-pointer' 
                            : 'cursor-pointer'
                      }`}
                    >
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isEditing}
                          onChange={() => toggleSelect(bond.id)}
                          className="rounded-sm border-slate-300 text-sky-500 focus:ring-sky-400 cursor-pointer disabled:opacity-30"
                        />
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900 tracking-wider" onClick={(e) => isEditing && e.stopPropagation()}>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editSeries}
                              onChange={(e) => setEditSeries(e.target.value)}
                              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-bold text-sky-600 focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                            >
                              {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input
                              type="text"
                              maxLength={7}
                              value={editNumber}
                              onChange={(e) => setEditNumber(e.target.value.replace(/\D/g, ''))}
                              className="w-16 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-slate-950 focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                            />
                          </div>
                        ) : (
                          <>
                            <span className="text-sky-600 bg-sky-50 font-semibold px-1.5 py-0.5 rounded text-[10px] mr-1.5 border border-sky-100">
                              {bond.series || 'None'}
                            </span>
                            {bond.number}
                          </>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500" onClick={(e) => isEditing && e.stopPropagation()}>
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Add note..."
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                          />
                        ) : (
                          <span className="max-w-[200px] truncate block" title={bond.note}>
                            {bond.note || <span className="text-slate-300 italic">No note</span>}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400 text-[10px]">
                        {new Date(bond.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(bond.id)}
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="Save Changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(bond)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                            title="Edit Bond"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info stats */}
        <div className="mt-3 text-[10px] text-slate-400 flex justify-between items-center px-1">
          <span>Showing {filteredBonds.length} of {bonds.length} bonds</span>
          <span>Face value: BDT {bonds.length * 100}</span>
        </div>
      </div>

    </div>
  );
}
