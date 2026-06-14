/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Layers, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  t: (key: string) => string;
  formatMoney: (num: number) => string;
  onNavigateAdded: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981',        // emerald-500
  Transport: '#06b6d4',   // cyan-500
  Shopping: '#f59e0b',    // amber-500
  Bills: '#ef4444',       // red-500
  Health: '#ec4899',      // pink-505
  Entertainment: '#8b5cf6', // violet-500
  Other: '#71717a'        // zinc-500
};

export default function Dashboard({ transactions, t, formatMoney, onNavigateAdded }: DashboardProps) {
  // Calculations
  const incomeItems = transactions.filter(t => t.type === 'income');
  const expenseItems = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeItems.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenseItems.reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const recentTransactions = [...transactions].slice(-5).reverse();

  // Recharts Bar Data: Income vs Expense
  const barData = [
    { name: t('incomeLabel'), value: totalIncome, fill: '#10b981' },
    { name: t('expenseLabel'), value: totalExpense, fill: '#f43f5e' }
  ];

  // Recharts Pie Data: Expenses by Category
  const expenseByCategory: Record<string, number> = {};
  expenseItems.forEach(item => {
    expenseByCategory[item.category] = (expenseByCategory[item.category] || 0) + item.amount;
  });

  const pieData = Object.entries(expenseByCategory).map(([cat, amt]) => ({
    name: cat,
    value: amt,
    color: CATEGORY_COLORS[cat] || '#a1a1aa'
  }));

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Balance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('balance')}</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${netBalance >= 0 ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-bold font-mono tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatMoney(netBalance)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Available spending funds</p>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('income')}</span>
            <div className="w-8 h-8 bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {formatMoney(totalIncome)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">From salaries & revenue sources</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('expenses')}</span>
            <div className="w-8 h-8 bg-red-950/40 rounded-full flex items-center justify-center text-red-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-red-400 tracking-tight">
              {formatMoney(totalExpense)}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">From billing & category targets</p>
          </div>
        </div>

        {/* Total Entries */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t('entries')}</span>
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">
              {transactions.length}
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Total logs submitted</p>
          </div>
        </div>

      </div>

      {/* Visual Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Income vs Expense Bar Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-zinc-850 pb-3 flex items-center justify-between">
            <h4 className="font-bold text-sm text-zinc-200 tracking-tight">Income vs Expense</h4>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Interactive Bar Chart</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {totalIncome === 0 && totalExpense === 0 ? (
              <div className="text-zinc-500 text-xs font-mono text-center">No transactions data submitted yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--zinc-800)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--zinc-400)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--zinc-400)" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--zinc-900)', borderColor: 'var(--zinc-800)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--zinc-400)', fontWeight: 'bold' }}
                    itemStyle={{ color: 'var(--zinc-200)' }}
                    formatter={(value) => [formatMoney(Number(value)), 'Total']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={60}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses by Category Pie Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-zinc-850 pb-3 flex items-center justify-between">
            <h4 className="font-bold text-sm text-zinc-200 tracking-tight">Expense Categories Allocation</h4>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Interactive Pie Chart</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-zinc-500 text-xs font-mono text-center">No expense logs registered yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--zinc-900)', borderColor: 'var(--zinc-800)', borderRadius: '12px' }}
                    itemStyle={{ color: 'var(--zinc-200)', fontSize: '12px' }}
                    formatter={(value) => [formatMoney(Number(value)), 'Spent']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span className="text-zinc-350 text-xs font-sans capitalize">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Recent Submissions Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="border-b border-zinc-850 pb-3 flex items-center justify-between">
          <h4 className="font-bold text-sm text-zinc-200 tracking-tight">{t('recentTx')}</h4>
          <span className="text-[10px] font-mono text-zinc-500 uppercase">Live Queue</span>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-zinc-850/50">
            <p className="text-sm text-zinc-500 mb-3">{t('noTxYet')}</p>
            <button
              onClick={onNavigateAdded}
              className="px-4 py-2 bg-emerald-900/40 hover:bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg transition-colors"
            >
              + Create First Entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-zinc-950/30">
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
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/40 transition-colors">
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
