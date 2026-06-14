/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Transaction } from '../types';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  t: (key: string) => string;
  formatMoney: (num: number) => string;
}

export default function TransactionList({ transactions, t, formatMoney }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'income' | 'expense'>('All');

  // Calculations
  const inc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const exp = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const net = inc - exp;

  // Filters
  const filtered = [...transactions]
    .filter(tx => {
      const matchSearch = tx.desc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = catFilter === 'All' || tx.category === catFilter;
      const matchType = typeFilter === 'All' || tx.type === typeFilter;
      return matchSearch && matchCat && matchType;
    })
    .reverse(); // Newest first

  // Unique categories for filters
  const categories = ['All', ...Array.from(new Set(transactions.map(tx => tx.category)))];

  // CSV Exporter
  const handleExportCSV = () => {
    const lines = [
      '=== FINANCE TRACKER REPORT ===',
      `Generated,${new Date().toLocaleString()}`,
      '','=== SUMMARY ===',
      `Total Income,${inc}`,
      `Total Expenses,${exp}`,
      `Net Balance,${net}`,
      '','=== TRANSACTIONS ===',
      'ID,Date,Type,Description,Category,Amount,Running Balance'
    ];
    
    let running = 0;
    // Sort chronologically for running balance
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(t => {
      running += t.type === 'income' ? t.amount : -t.amount;
      lines.push(`${t.id},${t.date},${t.type},"${t.desc.replace(/"/g, '""')}",${t.category},${t.type === 'income' ? '+' : '-'}${t.amount},${running}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Summary Horizontal Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-full bg-emerald-950/40 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/10">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('income')}</div>
            <div className="font-bold font-mono text-emerald-400 text-md tracking-tight">{formatMoney(inc)}</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-full bg-red-950/40 text-red-400 flex items-center justify-center flex-shrink-0 border border-red-500/10">
            <ArrowDownRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('expenses')}</div>
            <div className="font-bold font-mono text-red-500 text-md tracking-tight">{formatMoney(exp)}</div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-md">
          <div className="w-10 h-10 rounded-full bg-zinc-805 text-zinc-300 flex items-center justify-center flex-shrink-0 border border-zinc-700/20">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('balance')}</div>
            <div className={`font-bold font-mono text-md tracking-tight ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(net)}
            </div>
          </div>
        </div>

      </div>

      {/* Main Table + Filtration Search Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        
        {/* Custom Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-850 pb-4">
          <div>
            <h3 className="font-bold text-md text-zinc-100 tracking-tight">{t('allTxTitle')}</h3>
            <p className="text-xs text-zinc-500 font-mono">Filter and extract full transaction logs history</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="self-start sm:self-auto py-2 px-4 bg-emerald-950/30 hover:bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportCsv')}</span>
          </button>
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Term */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search description..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2 pl-10 pr-4 text-xs text-zinc-100 focus:outline-none placeholder-zinc-600"
            />
          </div>

          {/* Type Filter */}
          <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-xl text-xs gap-1">
            {(['All', 'income', 'expense'] as const).map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`flex-1 py-1 text-center font-bold rounded-lg transition-all capitalize ${
                  typeFilter === type
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {type === 'All' ? 'All Types' : type === 'income' ? t('incomeLabel') : t('expenseLabel')}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-300 focus:outline-none appearance-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Results Info */}
        <div className="text-[11px] font-mono text-zinc-500 px-1 py-0.5">
          Showing <span className="text-zinc-300 font-bold">{filtered.length}</span> of {transactions.length} total transaction logs.
        </div>

        {/* Table Body */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-zinc-950/40 rounded-2xl border border-zinc-850/50">
            <p className="text-zinc-500 text-xs font-mono">{t('noTxYet')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-zinc-850 bg-zinc-950/30">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-850 bg-zinc-900/40">
                  <th className="p-3.5 font-bold text-zinc-400 uppercase tracking-wider">ID</th>
                  <th className="p-3.5 font-bold text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="p-3.5 font-bold text-zinc-400 uppercase tracking-wider">Type</th>
                  <th className="p-3.5 font-bold text-zinc-400 uppercase tracking-wider">Description</th>
                  <th className="p-3.5 font-bold text-zinc-400 uppercase tracking-wider">Category</th>
                  <th className="p-3.5 font-bold text-zinc-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="p-3.5 font-mono text-zinc-500">#{tx.id}</td>
                    <td className="p-3.5 text-zinc-300 font-mono">{tx.date}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.type === 'income' 
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/10' 
                          : 'bg-rose-955/50 text-rose-400 border border-rose-500/10'
                      }`}>
                        {tx.type === 'income' ? t('incomeLabel') : t('expenseLabel')}
                      </span>
                    </td>
                    <td className="p-3.5 text-zinc-200 font-sans font-medium">{tx.desc}</td>
                    <td className="p-3.5 text-zinc-400 font-sans">{tx.category}</td>
                    <td className={`p-3.5 font-mono font-bold text-right text-sm ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
