/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Transaction, TxType } from '../types';
import { Sparkles, CheckCircle } from 'lucide-react';

interface AddTransactionProps {
  onAddTransaction: (type: TxType, desc: string, amount: number, category: string, date: string) => void;
  t: (key: string) => string;
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other',
  'Salary',
  'Freelance'
];

export default function AddTransaction({ onAddTransaction, t }: AddTransactionProps) {
  const [type, setType] = useState<TxType>('expense');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!desc.trim()) return;
    const numAmt = parseFloat(amount);
    if (isNaN(numAmt) || numAmt <= 0) return;

    onAddTransaction(type, desc.trim(), numAmt, category, date);
    
    // Feedback
    setSuccessMsg('✓ Transaction saved successfully!');
    setDesc('');
    setAmount('');
    
    // Auto clear feedback after seconds
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  const handleClear = () => {
    setDesc('');
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setSuccessMsg('');
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="border-b border-zinc-850 pb-4">
          <h3 className="font-bold text-lg text-zinc-100 font-sans tracking-tight">{t('addTxTitle')}</h3>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Submit incoming or outgoing financial events</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Type Toggle Slider */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              {t('txType')}
            </label>
            <div className="grid grid-cols-2 bg-zinc-950 p-1.5 rounded-xl gap-1.5 border border-zinc-850">
              <button
                type="button"
                onClick={() => { setType('income'); setCategory('Salary'); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t('incomeLabel')}
              </button>
              <button
                type="button"
                onClick={() => { setType('expense'); setCategory('Food'); }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t('expenseLabel')}
              </button>
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              {t('txDesc')}
            </label>
            <input
              type="text"
              required
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Grocery purchase, Freelance project payoff..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 focus:outline-none text-sm text-zinc-100 placeholder-zinc-650"
            />
          </div>

          {/* Amount & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                {t('txAmount')}
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ Amount"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 focus:outline-none text-sm text-zinc-100 font-mono placeholder-zinc-650"
              />
            </div>

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
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
              {t('txDate')}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 px-4 focus:outline-none text-sm text-zinc-100 font-mono"
            />
          </div>

          {/* Prompt Status Notification */}
          {successMsg && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-3 rounded-xl flex gap-2 items-center text-xs text-emerald-400 animate-slide-up">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 transform active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('saveTx')}</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm rounded-xl transition-colors cursor-pointer"
            >
              {t('clear')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
