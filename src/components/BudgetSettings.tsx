/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Transaction } from '../types';
import { AlertOctagon, CheckCircle2, TrendingDown, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';

interface BudgetSettingsProps {
  transactions: Transaction[];
  budgets: { [category: string]: number };
  onSetBudget: (category: string, limit: number, alertOnCross: boolean) => void;
  t: (key: string) => string;
  formatMoney: (num: number) => string;
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other'
];

export default function BudgetSettings({ transactions, budgets, onSetBudget, t, formatMoney }: BudgetSettingsProps) {
  const [category, setCategory] = useState('Food');
  const [limit, setLimit] = useState('');
  const [alertOnCross, setAlertOnCross] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveBudget = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    const numLimit = parseFloat(limit);
    if (isNaN(numLimit) || numLimit <= 0) return;

    onSetBudget(category, numLimit, alertOnCross);
    setLimit('');
    setSuccessMsg(`✓ Budget settings applied for ${category}!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Compute budget state values
  const expenses = transactions.filter(t => t.type === 'expense');
  let totalBudgeted = 0;
  let totalSpent = 0;

  const budgetProgress = Object.entries(budgets).map(([cat, limitVal]) => {
    const spentObj = expenses.filter(e => e.category === cat);
    const spentCat = spentObj.reduce((acc, curr) => acc + curr.amount, 0);
    totalBudgeted += limitVal;
    totalSpent += spentCat;

    const percent = Math.min((spentCat / limitVal) * 100, 100);
    const remaining = limitVal - spentCat;

    // Determine bar color thresholds
    let barColor = 'bg-emerald-500'; // Under 75%
    let tagColor = 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/10';
    if (percent >= 100) {
      barColor = 'bg-rose-500'; // Exceeded limit
      tagColor = 'text-rose-400 bg-rose-955/40 border border-rose-500/10';
    } else if (percent >= 75) {
      barColor = 'bg-amber-500'; // Warn state
      tagColor = 'text-amber-400 bg-amber-955/40 border border-amber-500/10';
    }

    return {
      category: cat,
      limit: limitVal,
      spent: spentCat,
      percent,
      remaining,
      barColor,
      tagColor
    };
  });

  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <div className="space-y-6">
      
      {/* Set budget limits Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl max-w-xl mx-auto">
        <div className="border-b border-zinc-850 pb-4 mb-5">
          <h3 className="font-bold text-lg text-zinc-100 font-sans tracking-tight">{t('setBudTitle')}</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Define soft and hard targets on monthly expenses</p>
        </div>

        <form onSubmit={handleSaveBudget} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                {t('txCat')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 px-3 focus:outline-none text-sm text-zinc-200"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                {t('budAmtLabel')}
              </label>
              <input
                type="number"
                required
                min="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="₹ Limit"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 focus:outline-none text-sm text-zinc-100 font-mono placeholder-zinc-650"
              />
            </div>

          </div>

          {/* Toggle Alert */}
          <label className="flex items-center gap-2.5 select-none cursor-pointer mt-2 w-fit">
            <input
              type="checkbox"
              checked={alertOnCross}
              onChange={(e) => setAlertOnCross(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500 bg-zinc-950 border border-zinc-800"
            />
            <span className="text-xs font-semibold text-zinc-400 hover:text-zinc-300">
              {t('budAlertChk')}
            </span>
          </label>

          {successMsg && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl flex gap-2 items-center text-xs text-emerald-400 animate-slide-up">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* CTAs */}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 transform active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('saveBud')}</span>
          </button>

        </form>
      </div>

      {/* Budget Status Layout Overview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-5">
        
        {/* Statistics Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-850 pb-4">
          <div>
            <h3 className="font-bold text-md text-zinc-100 tracking-tight">{t('budStatusTitle')}</h3>
            <p className="text-xs text-zinc-500 font-mono">Consolidated tracking of set boundaries and real spendings</p>
          </div>
          
          <div className="flex gap-4 self-start sm:self-auto font-mono text-right flex-wrap">
            <div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t('totBudgeted')}</div>
              <div className="text-sm font-bold text-emerald-400">{formatMoney(totalBudgeted)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t('totSpent')}</div>
              <div className="text-sm font-bold text-red-400">{formatMoney(totalSpent)}</div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{t('remaining')}</div>
              <div className={`text-sm font-bold ${totalRemaining >= 0 ? 'text-zinc-200' : 'text-red-400 animate-pulse'}`}>
                {formatMoney(totalRemaining)}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Progress Stack */}
        {budgetProgress.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/30 rounded-2xl border border-zinc-850/60">
            <p className="text-zinc-500 text-xs font-mono">{t('noBudgets')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetProgress.map((bud) => (
              <div key={bud.category} className="bg-zinc-950/20 rounded-2xl border border-zinc-850/50 p-4 space-y-2.5">
                
                {/* Meta details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-200">{bud.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${bud.tagColor}`}>
                      {Math.round(bud.percent)}%
                    </span>
                  </div>
                  <div className="font-mono text-xs text-zinc-400 font-semibold">
                    {formatMoney(bud.spent)} / <span className="text-zinc-300 font-black">{formatMoney(bud.limit)}</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden flex border border-zinc-850">
                  <div className={`h-full transition-all duration-500 rounded-full ${bud.barColor}`} style={{ width: `${bud.percent}%` }} />
                </div>

                {/* Bottom indicators */}
                <div className="flex justify-between items-center text-[11px] font-mono">
                  {bud.remaining >= 0 ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 
                      <span>{formatMoney(bud.remaining)} remaining</span>
                    </span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-1.5 animate-pulse">
                      <AlertOctagon className="w-3.5 h-3.5" /> 
                      <span>Over budget by {formatMoney(Math.abs(bud.remaining))}</span>
                    </span>
                  )}
                  <span className="text-zinc-500">Target spending cap</span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
