import React, { useState } from 'react';
import { DrawResult, PrizeBond, MatchResult } from '../types';
import { PRIZE_AMOUNTS } from '../data/initialDraws';
import { Award, Calendar, FileText, CheckCircle2, Sparkles, Loader2, Plus, AlertCircle, Trash2, HelpCircle } from 'lucide-react';

interface RaffleCheckerProps {
  bonds: PrizeBond[];
  draws: DrawResult[];
  onAddDraw: (draw: DrawResult) => void;
  onDeleteDraw: (id: string) => void;
  matchResults: MatchResult[];
}

export default function RaffleChecker({ bonds, draws, onAddDraw, onDeleteDraw, matchResults }: RaffleCheckerProps) {
  // Parsing states
  const [rawText, setRawText] = useState('');
  const [drawTitleHint, setDrawTitleHint] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parserError, setParserError] = useState<string | null>(null);
  const [parserSuccess, setParserSuccess] = useState<string | null>(null);

  // Manual draw add form states
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState('');
  const [manual1st, setManual1st] = useState('');
  const [manual2nd, setManual2nd] = useState('');
  const [manual3rd, setManual3rd] = useState('');
  const [manual4th, setManual4th] = useState('');
  const [manual5th, setManual5th] = useState('');

  // Selected draw for looking up details
  const [selectedDrawId, setSelectedDrawId] = useState<string>(draws[0]?.id || '');

  const activeDraw = draws.find(d => d.id === selectedDrawId) || draws[0];

  // Call server-side API to parse results using Gemini AI
  const handleAIParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setParserError('Please paste some draw text first.');
      return;
    }

    setIsParsing(true);
    setParserError(null);
    setParserSuccess(null);

    try {
      const res = await fetch('/api/parse-draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: rawText,
          titleHint: drawTitleHint.trim() || undefined
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to parse results.');
      }

      const parsedDraw: Omit<DrawResult, 'id'> = await res.json();
      
      const completeDraw: DrawResult = {
        ...parsedDraw,
        id: `draw-${Date.now()}`
      };

      onAddDraw(completeDraw);
      setSelectedDrawId(completeDraw.id);
      setParserSuccess(`Successfully parsed "${completeDraw.title}"! Checked against your portfolio automatically.`);
      setRawText('');
      setDrawTitleHint('');
    } catch (err: any) {
      console.error(err);
      setParserError(err.message || 'An unexpected error occurred during AI parsing.');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle manual draw submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParserError(null);

    if (!manualTitle || !manualDate) {
      setParserError('Title and Date are required.');
      return;
    }

    const cleanList = (str: string) => 
      str.split(/[\s,]+/).map(num => num.trim().replace(/\D/g, '')).filter(num => num.length === 7);

    const first = cleanList(manual1st);
    const second = cleanList(manual2nd);
    const third = cleanList(manual3rd);
    const fourth = cleanList(manual4th);
    const fifth = cleanList(manual5th);

    if (first.length === 0 && second.length === 0 && third.length === 0 && fourth.length === 0 && fifth.length === 0) {
      setParserError('Please enter at least one valid 7-digit winning number.');
      return;
    }

    const newDraw: DrawResult = {
      id: `draw-${Date.now()}`,
      title: manualTitle,
      date: manualDate,
      firstPrize: first,
      secondPrize: second,
      thirdPrize: third,
      fourthPrize: fourth,
      fifthPrize: fifth
    };

    onAddDraw(newDraw);
    setSelectedDrawId(newDraw.id);
    setParserSuccess(`Added draw "${manualTitle}" manually!`);
    
    // reset form
    setManualTitle('');
    setManualDate('');
    setManual1st('');
    setManual2nd('');
    setManual3rd('');
    setManual4th('');
    setManual5th('');
    setShowManualForm(false);

    setTimeout(() => setParserSuccess(null), 4000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-slate-800" id="raffle-checker-module">
      
      {/* LEFT COLUMN: Draws Directory & AI / Manual Addition */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        
        {/* Draw Selector List */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm">
          <h2 className="text-md font-semibold tracking-tight text-slate-900 mb-3.5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Available Raffle Draws
            </span>
            <span className="text-xs text-slate-400 font-medium font-mono">{draws.length} Draws</span>
          </h2>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {draws.map((draw) => {
              const isSelected = draw.id === selectedDrawId;
              const matchesCount = matchResults.filter(r => r.drawId === draw.id).length;

              return (
                <div
                  key={draw.id}
                  onClick={() => setSelectedDrawId(draw.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/20 shadow-xs'
                      : 'bg-white/40 border-slate-200/50 hover:bg-white/70'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {draw.title}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(draw.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {matchesCount > 0 && (
                      <span className="bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                        <Award className="w-3 h-3" />
                        {matchesCount} Won
                      </span>
                    )}
                    {draws.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Are you sure you want to delete "${draw.title}"?`)) {
                            onDeleteDraw(draw.id);
                            if (selectedDrawId === draw.id) {
                              setSelectedDrawId(draws.find(d => d.id !== draw.id)?.id || '');
                            }
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded text-rose-500 transition-all cursor-pointer"
                        title="Delete draw"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI & MANUAL DRAW ADDER */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-md font-semibold tracking-tight text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Add New Draw Results
            </h2>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="text-[11px] text-blue-600 font-medium hover:underline cursor-pointer"
            >
              {showManualForm ? "Switch to AI Parser" : "Add Manually"}
            </button>
          </div>

          {parserError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs px-3 py-2 rounded-lg mb-3 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{parserError}</span>
            </div>
          )}

          {parserSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs px-3 py-2 rounded-lg mb-3 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{parserSuccess}</span>
            </div>
          )}

          {/* AI PARSER FORM */}
          {!showManualForm ? (
            <form onSubmit={handleAIParse} className="flex flex-col gap-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Copy and paste raw draw lists from Bangladesh Bank PDF, online newspapers, or any web portal. Our Gemini-powered extractor will parse numbers automatically.
              </p>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Draw Title Hint (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 116th Draw"
                  value={drawTitleHint}
                  onChange={(e) => setDrawTitleHint(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                  disabled={isParsing}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Pasted Draw Text Block</label>
                <textarea
                  placeholder="Paste raw page text containing winning numbers. E.g:&#10;1st Prize: 0543210&#10;2nd Prize: 0876543&#10;5th Prize: 0000123, 0051234, ..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full h-32 bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:ring-1 focus:ring-sky-400 focus:outline-hidden resize-none"
                  required
                  disabled={isParsing}
                />
              </div>

              <button
                type="submit"
                disabled={isParsing}
                className={`w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isParsing ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Parsing with Gemini AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Extract & Verify Draw
                  </>
                )}
              </button>
            </form>
          ) : (
            /* MANUAL ADDER FORM */
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Draw Title</label>
                  <input
                    type="text"
                    placeholder="e.g. 116th Draw"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">Draw Date</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-sky-400 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-indigo-600 mb-0.5 uppercase tracking-wider">1st Prize (1 number, 7 digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 0543210"
                  value={manual1st}
                  onChange={(e) => setManual1st(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-emerald-600 mb-0.5 uppercase tracking-wider">2nd Prize (1 number, 7 digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 0876543"
                  value={manual2nd}
                  onChange={(e) => setManual2nd(e.target.value)}
                  className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">3rd Prize (2 numbers)</label>
                  <input
                    type="text"
                    placeholder="separated by commas"
                    value={manual3rd}
                    onChange={(e) => setManual3rd(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">4th Prize (2 numbers)</label>
                  <input
                    type="text"
                    placeholder="separated by commas"
                    value={manual4th}
                    onChange={(e) => setManual4th(e.target.value)}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5 uppercase tracking-wider">5th Prize (40 numbers)</label>
                <textarea
                  placeholder="Paste or type forty 7-digit numbers separated by spaces/commas"
                  value={manual5th}
                  onChange={(e) => setManual5th(e.target.value)}
                  className="w-full h-16 bg-slate-50/80 border border-slate-200 rounded-lg p-2 text-xs font-mono resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-black text-white font-medium text-xs py-2 px-4 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Save Draw Results
              </button>
            </form>
          )}

        </div>
      </div>

      {/* RIGHT COLUMN: Active Draw Details Table */}
      <div className="lg:col-span-7 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm h-full max-h-[560px]">
        
        {activeDraw ? (
          <div className="flex flex-col h-full">
            
            {/* Draw Heading Stats */}
            <div className="border-b border-slate-100 pb-3 mb-3.5 flex justify-between items-start">
              <div>
                <h3 className="text-md font-bold text-slate-900 tracking-tight">{activeDraw.title}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Draw Date: {new Date(activeDraw.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
                  Dhaka draws
                </span>
              </div>
            </div>

            {/* Winning Numbers categories listing */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* 1st Prize Row */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mb-0.5">1st Prize</span>
                  <span className="text-xs text-slate-500">Amount: BDT {PRIZE_AMOUNTS["1st"].toLocaleString()}</span>
                </div>
                <div className="font-mono text-base font-black text-amber-800 tracking-wider">
                  {activeDraw.firstPrize.join(', ') || <span className="text-slate-300 italic">None</span>}
                </div>
              </div>

              {/* 2nd Prize Row */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest block mb-0.5">2nd Prize</span>
                  <span className="text-xs text-slate-500">Amount: BDT {PRIZE_AMOUNTS["2nd"].toLocaleString()}</span>
                </div>
                <div className="font-mono text-base font-black text-emerald-800 tracking-wider">
                  {activeDraw.secondPrize.join(', ') || <span className="text-slate-300 italic">None</span>}
                </div>
              </div>

              {/* 3rd & 4th Prize Rows Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block mb-0.5">3rd Prize (x2)</span>
                  <p className="text-[11px] text-slate-500 mb-2">Amount: BDT {PRIZE_AMOUNTS["3rd"].toLocaleString()}</p>
                  <div className="font-mono text-xs font-bold text-indigo-900 tracking-wider flex flex-wrap gap-1.5">
                    {activeDraw.thirdPrize.length > 0 ? (
                      activeDraw.thirdPrize.map(num => (
                        <span key={num} className="bg-white/80 px-2 py-1 rounded-md border border-indigo-150">{num}</span>
                      ))
                    ) : (
                      <span className="text-slate-300 italic">None</span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block mb-0.5">4th Prize (x2)</span>
                  <p className="text-[11px] text-slate-500 mb-2">Amount: BDT {PRIZE_AMOUNTS["4th"].toLocaleString()}</p>
                  <div className="font-mono text-xs font-bold text-slate-900 tracking-wider flex flex-wrap gap-1.5">
                    {activeDraw.fourthPrize.length > 0 ? (
                      activeDraw.fourthPrize.map(num => (
                        <span key={num} className="bg-white/80 px-2 py-1 rounded-md border border-slate-150">{num}</span>
                      ))
                    ) : (
                      <span className="text-slate-300 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 5th Prize list of 40 numbers */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block">5th Prize (x40)</span>
                    <span className="text-[11px] text-slate-500">Amount: BDT {PRIZE_AMOUNTS["5th"].toLocaleString()} each</span>
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {activeDraw.fifthPrize.length} numbers
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-1.5 font-mono text-[11px] text-slate-700 max-h-[160px] overflow-y-auto pr-1">
                  {activeDraw.fifthPrize.length > 0 ? (
                    activeDraw.fifthPrize.map(num => (
                      <div key={num} className="bg-white px-1.5 py-1 text-center rounded border border-slate-200 hover:bg-sky-50 hover:border-sky-200 transition-colors">
                        {num}
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-300 italic col-span-full py-4 text-center">No numbers parsed yet.</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <FileText className="w-10 h-10 text-slate-300" />
            <span className="text-xs font-medium">Select or create a raffle draw to inspect.</span>
          </div>
        )}

      </div>

    </div>
  );
}
