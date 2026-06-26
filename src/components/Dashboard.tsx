import React, { useState, useMemo } from 'react';
import { PrizeBond, DrawResult, MatchResult } from '../types';
import { TrendingUp, Landmark, ShieldCheck, Trophy, Sparkles, ChevronRight, Coins, Plus, Calendar, HelpCircle, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  bonds: PrizeBond[];
  draws: DrawResult[];
  matchResults: MatchResult[];
  onNavigate: (tab: 'portfolio' | 'draws' | 'winners') => void;
  onInjectDemo: () => void;
}

export default function Dashboard({ bonds, draws, matchResults, onNavigate, onInjectDemo }: DashboardProps) {
  const [manualSearchNum, setManualSearchNum] = useState('');
  const [manualSearchResult, setManualSearchResult] = useState<string | null>(null);

  const totalPrizeWon = matchResults.reduce((sum, r) => sum + r.prizeAmount, 0);

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
      
      {/* SECTION 1: Bento Metrics Row */}
      <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        
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

        {/* SERIES DISTRIBUTION CHART */}
        <div className="bg-white/60 backdrop-blur-md border border-white/40 p-6 rounded-3xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-sky-500" />
                Series Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of prize bonds by their prefix series</p>
            </div>
            <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-full border border-sky-100">
              {seriesData.length} unique series
            </span>
          </div>

          <div className="h-48 w-full">
            {seriesData.length > 0 ? (
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
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
