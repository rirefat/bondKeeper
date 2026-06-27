import React, { useEffect } from 'react';
import { MatchResult } from '../types';
import { Award, Trophy, PartyPopper, Landmark, FileText, CheckCircle2, ChevronRight, HelpCircle, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WinnersProps {
  matchResults: MatchResult[];
}

export default function Winners({ matchResults }: WinnersProps) {
  
  // Trigger a celebration confetti effect if there are matches
  useEffect(() => {
    if (matchResults.length > 0) {
      // First immediate burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Side cannons for a continuous effect
      const end = Date.now() + 2 * 1000;
      const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

      (function frame() {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }, [matchResults.length]);

  // Calculate total winnings
  const totalPrizeAmount = matchResults.reduce((sum, match) => sum + match.prizeAmount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-slate-800" id="winners-module">
      
      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block col-span-12 border-b border-slate-300 pb-4 mb-5">
        <div className="flex justify-between items-baseline">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">BondKeeper Matches Report</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Official Prize Bond Winners List</p>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Date Generated: {new Date().toLocaleString()}</span>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block tracking-wider">Matched Tickets</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{matchResults.length} Bonds</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block tracking-wider">Total Prize Value</span>
            <span className="text-sm font-bold text-emerald-600 font-mono">৳ {totalPrizeAmount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 uppercase font-bold block tracking-wider">Claim Status</span>
            <span className="text-sm font-bold text-amber-600 uppercase tracking-wider text-[11px]">Unclaimed</span>
          </div>
        </div>
      </div>

      {/* LEFT COLUMN: Congratulatory card & Total Earnings */}
      <div className="lg:col-span-4 flex flex-col gap-5 print:hidden">
        
        {/* Celebration Glass Card */}
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/10 to-amber-700/15 backdrop-blur-md rounded-2xl p-6 border border-amber-500/25 shadow-sm text-center flex flex-col items-center justify-center relative overflow-hidden">
          {/* Decorative backdrops */}
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-500/10 rounded-full blur-xl"></div>
          <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl"></div>

          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 mb-4 animate-bounce">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-lg font-black tracking-tight text-amber-950 mb-1">
            {matchResults.length > 0 ? "Congratulations! 🌟" : "No Winners Yet"}
          </h2>
          <p className="text-xs text-amber-900/80 max-w-xs leading-relaxed">
            {matchResults.length > 0 
              ? `You have matched ${matchResults.length} winning prize bond ticket${matchResults.length > 1 ? 's' : ''} across your tracked draws!`
              : "Keep adding your prize bonds and scanning raffle draws. Your lucky draw could be next!"
            }
          </p>

          <div className="mt-6 w-full bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/80">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total Winnings</span>
            <span className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              ৳ {totalPrizeAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 block mt-1.5">
              Based on {matchResults.length} winning tickets
            </span>
          </div>
        </div>

        {/* BDT claim instruction guides */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm text-xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 mb-3">
            <Landmark className="w-4 h-4 text-emerald-600" />
            Claiming Prize Money
          </h3>

          <ul className="space-y-3.5 text-slate-600">
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-slate-100 rounded-full text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
              <span>Prizes can be claimed from any branch of <strong>Bangladesh Bank</strong>, scheduled commercial banks, or Post Offices.</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-slate-100 rounded-full text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
              <span>Claim requests must be filed within <strong>2 years</strong> of the draw date. Unclaimed winnings expire!</span>
            </li>
            <li className="flex gap-2">
              <span className="w-5 h-5 bg-slate-100 rounded-full text-slate-700 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
              <span>Winnings are subject to a standard <strong>20% income tax deduction</strong> at source.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* RIGHT COLUMN: Matching items table */}
      <div className="lg:col-span-8 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm h-full max-h-[560px] print:col-span-12 print:bg-transparent print:border-none print:shadow-none print:p-0 print:max-h-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-md font-semibold tracking-tight text-slate-900">
              Matched Prize Winners List
            </h2>
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full print:hidden">
              {matchResults.length} Match{matchResults.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {matchResults.length > 0 && (
            <button
              onClick={() => window.print()}
              className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer print:hidden"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Print Report
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto border border-slate-150 rounded-xl bg-slate-50/50 print:overflow-visible print:border-none print:bg-transparent">
          {matchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-2">
              <Award className="w-10 h-10 text-slate-300" />
              <span className="text-xs">No active winning tickets identified.</span>
              <p className="text-[10px] text-slate-400 max-w-xs text-center mt-1">
                Verify you have added some prize bonds and at least one draw under the Draws section.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100/80 text-slate-500 font-semibold sticky top-0 border-b border-slate-200 z-10 print:bg-transparent print:border-b-2 print:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Ticket / Series</th>
                  <th className="py-2.5 px-3">Raffle Draw</th>
                  <th className="py-2.5 px-3">Prize Tier</th>
                  <th className="py-2.5 px-3 text-right">Prize Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                {matchResults.map((match) => (
                  <tr 
                    key={match.id}
                    className="hover:bg-amber-500/5 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-emerald-50 text-emerald-600 font-semibold px-2 py-0.5 rounded text-[10px] border border-emerald-100 font-mono print:border-slate-300 print:bg-slate-100 print:text-slate-800">
                          {match.bond.series}
                        </span>
                        <span className="font-mono font-bold text-slate-950 tracking-wider">
                          {match.bond.number}
                        </span>
                      </div>
                      {match.bond.note && (
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px] print:max-w-none">
                          Note: {match.bond.note}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">{match.drawTitle}</div>
                      <div className="text-[10px] text-slate-400">{new Date(match.drawDate).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${
                        match.prizeCategory === '1st' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        match.prizeCategory === '2nd' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        match.prizeCategory === '3rd' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                        'bg-slate-100 text-slate-700'
                      } print:bg-slate-100 print:text-slate-800 print:border-slate-300`}>
                        <PartyPopper className="w-2.5 h-2.5 shrink-0 print:hidden" />
                        {match.prizeCategory} Prize
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ৳ {match.prizeAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {matchResults.length > 0 && (
          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between print:mt-6 print:bg-slate-50 print:border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 print:text-slate-700" />
              <span className="text-[11px] font-medium text-emerald-950 print:text-slate-800">
                You have matched {matchResults.length} total tickets. Head to your nearest bank or post office with your physical bond.
              </span>
            </div>
            <a 
              href="https://www.bb.org.bd/en/index.php/investing/prizebond" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[10px] text-emerald-700 font-bold hover:underline shrink-0 flex items-center gap-0.5 print:hidden"
            >
              Official BB Rules <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        )}

      </div>

    </div>
  );
}

