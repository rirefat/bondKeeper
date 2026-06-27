import React, { useState, useMemo } from 'react';
import { PrizeBond, DrawResult, MatchResult } from '../types';
import { TrendingUp, Landmark, ShieldCheck, Trophy, Sparkles, ChevronRight, Coins, Plus, Calendar, HelpCircle, BarChart3, ExternalLink, BookOpen } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  bonds: PrizeBond[];
  draws: DrawResult[];
  matchResults: MatchResult[];
  onNavigate: (tab: 'portfolio' | 'draws' | 'winners') => void;
  onInjectDemo: () => void;
  userRole: 'general' | 'admin';
}

export default function Dashboard({ bonds, draws, matchResults, onNavigate, onInjectDemo, userRole }: DashboardProps) {
  const [manualSearchNum, setManualSearchNum] = useState('');
  const [manualSearchResult, setManualSearchResult] = useState<string | null>(null);
  const [helpTab, setHelpTab] = useState<'serial' | 'draws'>('serial');
  const [chartType, setChartType] = useState<'series' | 'growth'>('series');

  const totalPrizeWon = matchResults.reduce((sum, r) => sum + r.prizeAmount, 0);

  // Calculate portfolio growth over time (Invested + Winnings)
  const growthData = useMemo(() => {
    if (bonds.length === 0) return [];

    // Collect unique dates from bond creation and matched wins
    const datesSet = new Set<string>();
    bonds.forEach(b => {
      if (b.createdAt) {
        datesSet.add(b.createdAt.split('T')[0]);
      }
    });
    matchResults.forEach(m => {
      if (m.drawDate) {
        datesSet.add(m.drawDate);
      }
    });

    const sortedDates = Array.from(datesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // If we only have 1 date or fewer, add a baseline date (e.g., 30 days before the first date)
    if (sortedDates.length === 1) {
      const d = new Date(sortedDates[0]);
      d.setDate(d.getDate() - 30);
      sortedDates.unshift(d.toISOString().split('T')[0]);
    } else if (sortedDates.length === 0) {
      const today = new Date().toISOString().split('T')[0];
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return [
        { date: monthAgo.toISOString().split('T')[0], invested: 0, winnings: 0, total: 0 },
        { date: today, invested: 0, winnings: 0, total: 0 }
      ];
    }

    return sortedDates.map(dateStr => {
      // Find bonds created on or before this date
      const bondsCount = bonds.filter(b => {
        const bDate = b.createdAt ? b.createdAt.split('T')[0] : '';
        return bDate && bDate <= dateStr;
      }).length;

      // Find winnings matched on or before this date
      const winningsAmt = matchResults.filter(m => {
        const mDate = m.drawDate || '';
        return mDate && mDate <= dateStr;
      }).reduce((sum, m) => sum + m.prizeAmount, 0);

      const invested = bondsCount * 100; // 100 BDT per bond face value
      const total = invested + winningsAmt;

      return {
        dateKey: dateStr,
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }),
        invested,
        winnings: winningsAmt,
        total
      };
    });
  }, [bonds, matchResults]);

  // Find the most recent draw
  const mostRecentDraw = useMemo(() => {
    if (!draws || draws.length === 0) return null;
    return [...draws].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [draws]);

  // Calculate unique series count in portfolio
  const uniqueSeriesCount = useMemo(() => {
    const seriesSet = new Set(bonds.map(b => b.series).filter(Boolean));
    return seriesSet.size;
  }, [bonds]);

  // Total potential prize pool based on the most recent draw and unique series
  // (Each series in Bangladesh Prize Bond participates in parallel with a total of 1,625,000 BDT in prizes)
  const totalPotentialPrizePool = useMemo(() => {
    return uniqueSeriesCount * 1625000;
  }, [uniqueSeriesCount]);

  // Winnings actually matched in the most recent draw
  const recentDrawMatchesCount = useMemo(() => {
    if (!mostRecentDraw) return 0;
    return matchResults.filter(m => m.drawId === mostRecentDraw.id).length;
  }, [mostRecentDraw, matchResults]);

  const recentDrawWinnings = useMemo(() => {
    if (!mostRecentDraw) return 0;
    return matchResults
      .filter(m => m.drawId === mostRecentDraw.id)
      .reduce((sum, m) => sum + m.prizeAmount, 0);
  }, [mostRecentDraw, matchResults]);

  // Group and count bonds by their series prefix
  const seriesData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    bonds.forEach(bond => {
      const s = bond.series || 'Unspecified';
      counts[s] = (counts[s] || 0) + 1;
    });

    return Object.keys(counts)
      .map(key => ({
        name: key,
        count: counts[key],
      }))
      .sort((a, b) => b.count - a.count);
  }, [bonds]);

  // Quick manual lookup against all known draws
  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = manualSearchNum.trim();
    if (!/^\d{7}$/.test(query)) {
      setManualSearchResult('Please enter a valid 7-digit number.');
      return;
    }

    const matchingDraws: string[] = [];
    draws.forEach(draw => {
      let prizeType = '';
      if (draw.firstPrize.includes(query)) prizeType = '1st Prize';
      else if (draw.secondPrize.includes(query)) prizeType = '2nd Prize';
      else if (draw.thirdPrize.includes(query)) prizeType = '3rd Prize';
      else if (draw.fourthPrize.includes(query)) prizeType = '4th Prize';
      else if (draw.fifthPrize.includes(query)) prizeType = '5th Prize';

      if (prizeType) {
        matchingDraws.push(`${prizeType} in "${draw.title}" (${new Date(draw.date).toLocaleDateString()})`);
      }
    });

    if (matchingDraws.length > 0) {
      setManualSearchResult(`✨ WINNER! Number ${query} won: ${matchingDraws.join(' & ')}!`);
    } else {
      setManualSearchResult(`❌ Number ${query} did not win in any of the currently available ${draws.length} draws.`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-800" id="dashboard-module">
      
      {/* Admin System Banner */}
      {userRole === 'admin' && (
        <div className="col-span-12 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-sm border border-indigo-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-300 border border-white/10 mt-0.5 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">BondKeeper Administrative Console</h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                You are logged in with the <span className="font-semibold text-indigo-300">System Admin</span> role. You have master permissions to add, edit, or delete official draw results via the "Raffle Checker" tab.
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onInjectDemo}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/10 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Inject Demo Bonds
            </button>
            <button
              onClick={() => onNavigate('draws')}
              className="bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              Manage Draws
            </button>
          </div>
        </div>
      )}
      
      {/* SECTION 1: Bento Metrics Row */}
      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Total Bonds */}
        <div 
          onClick={() => onNavigate('portfolio')}
          className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-xs hover:bg-white/80 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Tracked Bonds</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight font-mono">{bonds.length}</h2>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-sky-500 font-medium group-hover:underline flex items-center gap-1">
              Manage Portfolio <ChevronRight className="w-3.5 h-3.5" />
            </span>
            <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 border border-sky-100">
              <Coins className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 2: Estimated Value */}
        <div 
          className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-xs flex flex-col justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Face Value</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight font-mono">৳ {(bonds.length * 100).toLocaleString()}</h2>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-400">Denomination: 100 BDT each</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Metric 3: Match Success */}
        <div 
          onClick={() => onNavigate('winners')}
          className="bg-gradient-to-br from-amber-500/10 via-amber-600/10 to-amber-700/15 backdrop-blur-md border border-amber-500/25 p-6 rounded-3xl shadow-xs hover:from-amber-500/15 hover:via-amber-600/15 hover:to-amber-700/20 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Total Prize Wins</p>
            <h2 className="text-4xl font-black text-amber-900 tracking-tight font-mono">৳ {totalPrizeWon.toLocaleString()}</h2>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-amber-700 font-bold group-hover:underline flex items-center gap-1">
              {matchResults.length > 0 ? `View ${matchResults.length} winning match tickets` : "No wins tracked yet"} <ChevronRight className="w-3.5 h-3.5" />
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 border border-amber-500/30">
              <Trophy className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Metric 4: Potential Draw Winnings */}
        <div 
          onClick={() => onNavigate('draws')}
          className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-xs hover:bg-white/80 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1">
              Latest Draw Potential
            </p>
            <h2 className="text-4xl font-black text-indigo-900 tracking-tight font-mono">
              ৳ {totalPotentialPrizePool.toLocaleString()}
            </h2>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-indigo-500 font-medium group-hover:underline flex items-center gap-1">
              {mostRecentDraw ? `${mostRecentDraw.title.slice(0, 18)}` : 'Latest Draw Pools'} <ChevronRight className="w-3.5 h-3.5" />
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: Split Content */}
      {/* LEFT: Quick Search & Introduction */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        
        {/* Manual Instant Check Card */}
        <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-xs">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            Instant Number Search
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Quickly check if a single 7-digit bond number won in any of your available drawing databases.
          </p>

          <form onSubmit={handleManualSearch} className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Enter 7-Digit Number</label>
              <input 
                type="text" 
                maxLength={7}
                placeholder="e.g. 0543210" 
                value={manualSearchNum}
                onChange={(e) => {
                  setManualSearchNum(e.target.value.replace(/\D/g, ''));
                  setManualSearchResult(null);
                }}
                className="w-full bg-white/85 border border-slate-200/80 rounded-xl px-4 py-2 text-sm font-mono tracking-wider focus:outline-hidden focus:ring-1 focus:ring-sky-400"
                required
              />
            </div>
            
            <button 
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Run Instant Check
            </button>
          </form>

          {manualSearchResult && (
            <div className={`mt-3.5 p-3 rounded-xl text-xs font-medium border leading-relaxed ${
              manualSearchResult.includes('WINNER') 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-900' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              {manualSearchResult}
            </div>
          )}
        </div>

        {/* Demo trigger card for empty portfolios */}
        {bonds.length === 0 && (
          <div className="bg-sky-50/70 border border-sky-100 rounded-3xl p-5 text-sky-950 flex flex-col gap-3">
            <div className="flex gap-2.5">
              <Sparkles className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="font-bold text-sky-900 text-sm">Welcome to BondKeeper</span>
                <span className="text-xs text-sky-900/80 leading-relaxed">
                  Start by adding your list of physical Bangladesh Prize Bonds. To quickly try all matching features, you can inject our demo dataset!
                </span>
              </div>
            </div>
            <button
              onClick={onInjectDemo}
              className="mt-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer self-start"
            >
              🚀 Inject Mock Demo Data
            </button>
          </div>
        )}

        {/* Help & Tips Card */}
        <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-xs flex flex-col" id="dashboard-help-tips">
          <div className="flex items-center gap-1.5 mb-4">
            <HelpCircle className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-slate-900">Help & Tips</h3>
          </div>

          {/* Tab buttons */}
          <div className="flex bg-slate-100/80 p-1 rounded-xl mb-4 text-xs font-semibold">
            <button
              onClick={() => setHelpTab('serial')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                helpTab === 'serial'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              How to Read Bonds
            </button>
            <button
              onClick={() => setHelpTab('draws')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                helpTab === 'draws'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Where to Find Draws
            </button>
          </div>

          {/* Tab Content */}
          <div className="text-xs space-y-3 leading-relaxed">
            {helpTab === 'serial' ? (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-white/40 border border-slate-100 p-3 rounded-2xl">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                    Understand the 2-Part Format
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Every Bangladesh Prize Bond consists of a <strong className="text-slate-800">2-character Series Prefix</strong> (like কখ, খগ, ঘঙ) and a <strong className="text-slate-800">7-digit Serial Number</strong> (e.g. <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700">0123456</span>).
                  </p>
                </div>

                <div className="bg-white/40 border border-slate-100 p-3 rounded-2xl">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Entering Single vs Series
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    When adding, select the Series first, then enter the 7-digit number. Leading zeros (e.g. <span className="font-mono">0045231</span>) are crucial! For range imports, enter starting and ending numbers.
                  </p>
                </div>

                <div className="bg-white/40 border border-slate-100 p-3 rounded-2xl">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Visual Check Guide
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    The serial number is printed in bold red/black on both top-left and top-right of physical bonds. Do not confuse other numbers (like sheet counters) with the bond serial.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-white/40 border border-slate-100 p-3 rounded-2xl">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Bangladesh Bank Official
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    The central bank of Bangladesh official website hosts the legal and authoritative draw bulletins. Check their website under the public services section.
                  </p>
                  <a
                    href="https://www.bb.org.bd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-sky-600 font-bold hover:underline inline-flex items-center gap-0.5 mt-1"
                  >
                    Visit Bangladesh Bank <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                <div className="bg-white/40 border border-slate-100 p-3 rounded-2xl">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Quarterly Draw Dates
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Raffles occur <strong className="text-slate-800">four times a year</strong>: January 31, April 30, July 31, and October 31. Bulletins are usually published on the same day or the following morning.
                  </p>
                </div>

                <div className="bg-white/40 border border-slate-100 p-3 rounded-2xl">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    AI Extraction Tool
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Copy the raw numbers list from a daily newspaper or PDF, then paste them into our <strong className="text-slate-800">AI Raffle Checker</strong> to extract winning numbers instantly!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT: Recent Activity & Draw overview + Series Distribution Chart */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        
        {/* HOW TO TRACK */}
        <div className="bg-white/60 backdrop-blur-md border border-white/40 rounded-3xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/20 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900">How to Track Prize Bonds</h3>
              <p className="text-xs text-slate-400 mt-0.5">Step-by-step roadmap for Bangladesh Bank draw validation</p>
            </div>
            <button 
              onClick={() => onNavigate('portfolio')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Go to portfolio &rarr;
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/40 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-100 font-mono text-xs font-bold text-sky-700 flex items-center justify-center">1</div>
              <h4 className="text-xs font-bold text-slate-900">Entry / Import Bonds</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Enter single bonds, booklet series, or paste list text. Your bonds are saved securely on your device.
              </p>
            </div>

            <div className="bg-white/40 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 font-mono text-xs font-bold text-indigo-700 flex items-center justify-center">2</div>
              <h4 className="text-xs font-bold text-slate-900">Load Raffle Drawings</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Check default drawing calendars, or paste raw bank bulletins to let our **Gemini AI Extraction engine** parse winners.
              </p>
            </div>

            <div className="bg-white/40 border border-slate-100 p-4 rounded-2xl flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 font-mono text-xs font-bold text-emerald-700 flex items-center justify-center">3</div>
              <h4 className="text-xs font-bold text-slate-900">Instant Winning Match</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Our background script automatically screens every prefix and number series, instantly flagging matching winnings!
              </p>
            </div>
          </div>

          {/* Dynamic Draw & Match Activity list */}
          <div className="p-6 bg-slate-50/50 border-t border-white/20 mt-auto flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-800">Current Status Summary</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span><strong>{bonds.length}</strong> Tracked bonds</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                <span><strong>{draws.length}</strong> Known drawings in database</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className={`w-2 h-2 rounded-full ${matchResults.length > 0 ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
                <span><strong>{matchResults.length}</strong> Matched wins detected</span>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE VISUALIZATION CARD */}
        <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                {chartType === 'series' ? (
                  <>
                    <BarChart3 className="w-4 h-4 text-sky-500" />
                    Series Distribution
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Portfolio Growth Over Time
                  </>
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {chartType === 'series' 
                  ? 'Distribution of physical prize bonds by their prefix series' 
                  : 'Cumulative asset value growth including physical bonds and matched winnings'
                }
              </p>
            </div>

            {/* Switch pills */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl text-[11px] font-bold self-start sm:self-auto shrink-0">
              <button
                onClick={() => setChartType('series')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  chartType === 'series'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Series
              </button>
              <button
                onClick={() => setChartType('growth')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  chartType === 'growth'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Asset Growth
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            {chartType === 'series' ? (
              seriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white/95 backdrop-blur-md border border-white/50 p-2.5 rounded-xl shadow-md text-xs">
                              <p className="font-bold text-slate-900">Series: {label}</p>
                              <p className="text-sky-500 font-semibold mt-0.5">Bonds count: {payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {seriesData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index % 2 === 0 ? '#0ea5e9' : '#6366f1'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 py-10">
                  <BarChart3 className="w-8 h-8 text-slate-300" />
                  <span className="text-xs font-semibold">No series data available</span>
                  <span className="text-[10px] text-slate-400">Add bonds under "My Portfolio" or load Demo data.</span>
                </div>
              )
            ) : (
              growthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `৳${val}`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-md border border-white/50 p-3 rounded-2xl shadow-lg text-xs space-y-1">
                              <p className="font-bold text-slate-900">{data.date}</p>
                              <div className="text-[10px] space-y-0.5">
                                <p className="text-sky-600 font-semibold flex justify-between gap-6">
                                  <span>Invested Bonds:</span> <span>৳{data.invested.toLocaleString()}</span>
                                </p>
                                <p className="text-emerald-600 font-semibold flex justify-between gap-6">
                                  <span>Winnings Matched:</span> <span>৳{data.winnings.toLocaleString()}</span>
                                </p>
                                <div className="border-t border-slate-100 my-1 pt-1 font-bold text-slate-950 flex justify-between gap-6">
                                  <span>Total Value:</span> <span>৳{data.total.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="invested" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorInvested)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1.5 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 py-10">
                  <TrendingUp className="w-8 h-8 text-slate-300" />
                  <span className="text-xs font-semibold">No growth history available</span>
                  <span className="text-[10px] text-slate-400">Add bonds under "My Portfolio" or load Demo data.</span>
                </div>
              )
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
