import React, { useState, useEffect, useMemo } from 'react';
import { PrizeBond, DrawResult, MatchResult } from './types';
import { INITIAL_DRAWS } from './data/initialDraws';
import Dashboard from './components/Dashboard';
import MyBonds from './components/MyBonds';
import RaffleChecker from './components/RaffleChecker';
import Winners from './components/Winners';
import { LayoutDashboard, Layers, CalendarRange, Trophy, ArrowUpRight, ArrowDownLeft, Moon, Sun, Download, Upload } from 'lucide-react';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'draws' | 'winners'>('dashboard');

  // Loaded Prize Bonds from localStorage
  const [bonds, setBonds] = useState<PrizeBond[]>([]);

  // Stored Raffle Draws (initialize with sample draws, fallback to localStorage if updated)
  const [draws, setDraws] = useState<DrawResult[]>([]);

  // Load state on mount
  useEffect(() => {
    const storedBonds = localStorage.getItem('bondkeeper_bonds') || localStorage.getItem('bondvault_bonds');
    if (storedBonds) {
      try {
        setBonds(JSON.parse(storedBonds));
      } catch (e) {
        console.error('Failed to parse stored bonds', e);
      }
    }

    const storedDraws = localStorage.getItem('bondkeeper_draws') || localStorage.getItem('bondvault_draws');
    if (storedDraws) {
      try {
        setDraws(JSON.parse(storedDraws));
      } catch (e) {
        console.error('Failed to parse stored draws', e);
        setDraws(INITIAL_DRAWS);
      }
    } else {
      setDraws(INITIAL_DRAWS);
    }
  }, []);

  // Save state on updates
  const saveBonds = (newBonds: PrizeBond[]) => {
    setBonds(newBonds);
    localStorage.setItem('bondkeeper_bonds', JSON.stringify(newBonds));
  };

  const saveDraws = (newDraws: DrawResult[]) => {
    setDraws(newDraws);
    localStorage.setItem('bondkeeper_draws', JSON.stringify(newDraws));
  };

  // Portfolio Handlers
  const handleAddBonds = (newBondsRaw: Omit<PrizeBond, 'id' | 'createdAt'>[]) => {
    const updated = [
      ...bonds,
      ...newBondsRaw.map(raw => ({
        ...raw,
        id: `bond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString()
      }))
    ];
    saveBonds(updated);
  };

  const handleDeleteBonds = (ids: string[]) => {
    const updated = bonds.filter(b => !ids.includes(b.id));
    saveBonds(updated);
  };

  const handleUpdateBond = (id: string, updatedFields: Partial<PrizeBond>) => {
    const updated = bonds.map(b => b.id === id ? { ...b, ...updatedFields } : b);
    saveBonds(updated);
  };

  const handleClearAllBonds = () => {
    if (confirm('Are you sure you want to delete all tracked bonds from your catalog?')) {
      saveBonds([]);
    }
  };

  // Draw Handlers
  const handleAddDraw = (newDraw: DrawResult) => {
    // Avoid duplicate IDs or titles
    const updated = [newDraw, ...draws.filter(d => d.title !== newDraw.title)];
    saveDraws(updated);
  };

  const handleDeleteDraw = (id: string) => {
    const updated = draws.filter(d => d.id !== id);
    saveDraws(updated);
  };

  // Demo injector for rapid testing
  const handleInjectDemo = () => {
    const demoBonds = [
      { id: 'b-demo-1', number: '0543210', series: 'কখ', createdAt: new Date().toISOString(), note: 'Demo - 115th Draw 1st Prize' },
      { id: 'b-demo-2', number: '0876543', series: 'কখ', createdAt: new Date().toISOString(), note: 'Demo - 115th Draw 2nd Prize' },
      { id: 'b-demo-3', number: '0112233', series: 'কগ', createdAt: new Date().toISOString(), note: 'Demo - 115th Draw 3rd Prize' },
      { id: 'b-demo-4', number: '0256841', series: 'কখ', createdAt: new Date().toISOString(), note: 'Demo - 114th Draw 1st Prize' },
      { id: 'b-demo-5', number: '0941258', series: 'কঘ', createdAt: new Date().toISOString(), note: 'Demo - 114th Draw 2nd Prize' },
      { id: 'b-demo-6', number: '0000123', series: 'কখ', createdAt: new Date().toISOString(), note: 'Demo - 115th Draw 5th Prize' },
      { id: 'b-demo-7', number: '0121212', series: 'কখ', createdAt: new Date().toISOString(), note: 'Demo - 114th Draw 5th Prize' },
      // booklet set
      ...Array.from({ length: 5 }).map((_, i) => ({
        id: `b-demo-seq-${i}`,
        number: String(1234500 + i).padStart(7, '0'),
        series: 'কখ',
        createdAt: new Date().toISOString(),
        note: `Demo Sequential Booklet ${i + 1}`
      }))
    ];
    saveBonds(demoBonds);
  };

  // Import / Export JSON Catalog
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bonds, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bondkeeper-catalog-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          // simple validation check
          const isValid = parsed.every(item => typeof item === 'object' && item.number);
          if (isValid) {
            const updated = [...bonds, ...parsed.map(b => ({
              ...b,
              id: b.id || `bond-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              createdAt: b.createdAt || new Date().toISOString()
            }))];
            saveBonds(updated);
            alert(`Imported ${parsed.length} prize bonds successfully!`);
          } else {
            alert('Invalid JSON structure: Each element must have a "number" field.');
          }
        } else {
          alert('Invalid file format: JSON must be an array of prize bond items.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Dynamic Raffle Checking Algorithm
  const matchResults = useMemo((): MatchResult[] => {
    const matches: MatchResult[] = [];
    
    bonds.forEach(bond => {
      draws.forEach(draw => {
        let prizeCategory: '1st' | '2nd' | '3rd' | '4th' | '5th' | null = null;
        let prizeAmount = 0;

        if (draw.firstPrize.includes(bond.number)) {
          prizeCategory = '1st';
          prizeAmount = 600000;
        } else if (draw.secondPrize.includes(bond.number)) {
          prizeCategory = '2nd';
          prizeAmount = 325000;
        } else if (draw.thirdPrize.includes(bond.number)) {
          prizeCategory = '3rd';
          prizeAmount = 100000;
        } else if (draw.fourthPrize.includes(bond.number)) {
          prizeCategory = '4th';
          prizeAmount = 50000;
        } else if (draw.fifthPrize.includes(bond.number)) {
          prizeCategory = '5th';
          prizeAmount = 10000;
        }

        if (prizeCategory) {
          matches.push({
            id: `${bond.id}-${draw.id}`,
            bond,
            drawId: draw.id,
            drawTitle: draw.title,
            drawDate: draw.date,
            prizeCategory,
            prizeAmount
          });
        }
      });
    });

    return matches;
  }, [bonds, draws]);

  return (
    <div 
      className="min-h-screen bg-[#f3f5f8] font-sans flex text-[#1d1d1f] antialiased selection:bg-sky-500/20"
      style={{
        backgroundImage: 'radial-gradient(circle at 0% 0%, #e0f2fe 0%, transparent 45%), radial-gradient(circle at 100% 100%, #e0e7ff 0%, transparent 45%)'
      }}
      id="app-container"
    >
      <div className="flex w-full max-w-7xl mx-auto my-0 md:my-6 md:rounded-3xl border-0 md:border border-white/40 shadow-2xl overflow-hidden bg-slate-50/20 backdrop-blur-3xl flex-col md:flex-row">
        
        {/* SIDEBAR: macOS Glass Navigation & Utilities */}
        <aside className="w-full md:w-64 bg-white/40 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/20 flex flex-col p-5 shrink-0">
          
          {/* macOS window circles */}
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" title="Close"></div>
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" title="Minimize"></div>
              <div className="w-3 h-3 rounded-full bg-[#28c840]" title="Maximize"></div>
            </div>
            <span className="ml-3 font-bold text-base tracking-tight bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent">
              BondKeeper
            </span>
            <span className="text-[10px] bg-slate-200/60 font-semibold px-2 py-0.5 rounded-full text-slate-500 ml-auto">
              v1.0
            </span>
          </div>
          
          {/* Main Navigation Links */}
          <nav className="space-y-1 flex md:flex-col flex-row overflow-x-auto pb-2 md:pb-0 gap-1 md:gap-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-sky-500/10 text-sky-600 border border-sky-500/10'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer shrink-0 ${
                activeTab === 'portfolio'
                  ? 'bg-sky-500/10 text-sky-600 border border-sky-500/10'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              My Portfolio
            </button>
            <button
              onClick={() => setActiveTab('draws')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer shrink-0 ${
                activeTab === 'draws'
                  ? 'bg-sky-500/10 text-sky-600 border border-sky-500/10'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              Raffle Checker
            </button>
            <button
              onClick={() => setActiveTab('winners')}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-full text-left cursor-pointer shrink-0 relative ${
                activeTab === 'winners'
                  ? 'bg-sky-500/10 text-sky-600 border border-sky-500/10'
                  : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Winners list
              {matchResults.length > 0 && (
                <span className="absolute right-2 top-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              )}
            </button>
          </nav>

          {/* Catalog backup utils */}
          <div className="mt-4 md:mt-auto pt-4 border-t border-slate-200/50 flex flex-col gap-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Backup & Restore</span>
            
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[10px] font-medium transition-all cursor-pointer hover:bg-white/30 p-1.5 rounded-lg"
              title="Download portfolio as JSON file"
            >
              <Download className="w-3 h-3 text-slate-400" />
              Export Catalog (.json)
            </button>

            <label
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[10px] font-medium transition-all cursor-pointer hover:bg-white/30 p-1.5 rounded-lg"
              title="Import portfolio from JSON file"
            >
              <Upload className="w-3 h-3 text-slate-400" />
              Import Catalog (.json)
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportData} 
                className="hidden" 
              />
            </label>
          </div>

          {/* Quick Stats sidebar widget */}
          <div className="hidden md:block mt-5 p-4 bg-white/30 rounded-2xl border border-white/40">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Raffle draws info</p>
            <p className="text-xs font-bold text-slate-800">4 Draws Annually</p>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Draws take place on Jan 31, Apr 30, July 31, and Oct 31 of each calendar year.
            </p>
          </div>

        </aside>

        {/* MAIN DISPLAY PORT */}
        <main className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/10">
          
          {/* Header Title */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200/30">
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight capitalize">
                {activeTab === 'dashboard' && 'Overview'}
                {activeTab === 'portfolio' && 'Manage Portfolio'}
                {activeTab === 'draws' && 'Raffle draw results'}
                {activeTab === 'winners' && 'Match winners'}
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeTab === 'dashboard' && 'Portfolio summary, quick stats & tools.'}
                {activeTab === 'portfolio' && 'Register, label, and manage your physical Bangladesh prize bonds.'}
                {activeTab === 'draws' && 'Analyze winning lists. Auto-extracted using Gemini AI.'}
                {activeTab === 'winners' && 'Matched tickets showing exact prize values in BDT.'}
              </p>
            </div>

            {/* Quick action button */}
            <div className="flex items-center gap-3">
              {activeTab !== 'portfolio' && (
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className="bg-slate-900 hover:bg-black text-white px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Quick Add Bond
                </button>
              )}
            </div>
          </header>

          {/* Tab content wrapper with smooth scroll */}
          <div className="p-6 flex-1 overflow-y-auto">
            
            {activeTab === 'dashboard' && (
              <Dashboard 
                bonds={bonds}
                draws={draws}
                matchResults={matchResults}
                onNavigate={setActiveTab}
                onInjectDemo={handleInjectDemo}
              />
            )}

            {activeTab === 'portfolio' && (
              <MyBonds 
                bonds={bonds}
                onAddBonds={handleAddBonds}
                onDeleteBonds={handleDeleteBonds}
                onUpdateBond={handleUpdateBond}
                onClearAll={handleClearAllBonds}
              />
            )}

            {activeTab === 'draws' && (
              <RaffleChecker 
                bonds={bonds}
                draws={draws}
                onAddDraw={handleAddDraw}
                onDeleteDraw={handleDeleteDraw}
                matchResults={matchResults}
              />
            )}

            {activeTab === 'winners' && (
              <Winners 
                matchResults={matchResults}
              />
            )}

          </div>

        </main>

      </div>
    </div>
  );
}
