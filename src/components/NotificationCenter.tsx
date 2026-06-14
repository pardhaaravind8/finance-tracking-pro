/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SystemNotification, UserProfile } from '../types';
import { Mail, Smartphone, AlertOctagon, TrendingUp, HelpCircle, CheckCircle, Info } from 'lucide-react';

interface NotificationCenterProps {
  notifications: SystemNotification[];
  profile: UserProfile | null;
  emailAlertsActive: boolean;
  smsAlertsActive: boolean;
  budgetAlertsActive: boolean;
  txAlertsActive: boolean;
  onToggleEmailAlerts: () => void;
  onToggleSmsAlerts: () => void;
  onToggleBudgetAlerts: () => void;
  onToggleTxAlerts: () => void;
  t: (key: string) => string;
}

export default function NotificationCenter({
  notifications,
  profile,
  emailAlertsActive,
  smsAlertsActive,
  budgetAlertsActive,
  txAlertsActive,
  onToggleEmailAlerts,
  onToggleSmsAlerts,
  onToggleBudgetAlerts,
  onToggleTxAlerts,
  t
}: NotificationCenterProps) {
  
  // Deliverability math
  const emailLogs = notifications.filter(n => n.channels.some(c => c.type === 'email')).length;
  const smsLogs = notifications.filter(n => n.channels.some(c => c.type === 'sms')).length;
  const budgetLogs = notifications.filter(n => n.tag === 'budget').length;
  const txLogs = notifications.filter(n => n.tag === 'transaction').length;

  const maskContact = (val: string) => {
    if (!val) return t('notLinked');
    const isEmail = val.includes('@');
    if (isEmail) {
      const [u, d] = val.split('@');
      return u.slice(0, 2) + '***@' + d;
    }
    return val.slice(0, 2) + '******' + val.slice(-2);
  };

  const getContactDisplay = (type: 'email' | 'sms') => {
    if (!profile) return t('notLinked');
    const isProfileEmail = profile.contact.includes('@');
    if (type === 'email' && isProfileEmail) return maskContact(profile.contact);
    if (type === 'sms' && !isProfileEmail) return maskContact(profile.contact);
    return t('notLinked');
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Rules & Delivery Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Rules Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="border-b border-zinc-850 pb-3">
            <h4 className="font-bold text-sm text-zinc-200 tracking-tight">{t('alertPrefsTitle')}</h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Configure active alert channels for automated notifications</p>
          </div>

          <div className="divide-y divide-zinc-850">
            
            {/* Email rules */}
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{t('emailAlerts')}</span>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  {getContactDisplay('email') !== t('notLinked') 
                    ? `${t('linkedGroup')}: ${getContactDisplay('email')}` 
                    : t('notLinked')}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlertsActive}
                  onChange={onToggleEmailAlerts}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {/* SMS rules */}
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{t('smsAlerts')}</span>
                <span className="text-[10px] text-zinc-500 font-mono block">
                  {getContactDisplay('sms') !== t('notLinked') 
                    ? `${t('linkedGroup')}: ${getContactDisplay('sms')}` 
                    : t('notLinked')}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={smsAlertsActive}
                  onChange={onToggleSmsAlerts}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {/* Budget Crossed rules */}
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{t('budCrossedAlert')}</span>
                <span className="text-[10px] text-zinc-500 block">Deliver warnings on exceeding limits</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={budgetAlertsActive}
                  onChange={onToggleBudgetAlerts}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

            {/* Transaction Receipts rules */}
            <div className="flex items-center justify-between py-3">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">{t('notifyEveryTx')}</span>
                <span className="text-[10px] text-zinc-500 block">Dispatch audit notification on transaction actions</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={txAlertsActive}
                  onChange={onToggleTxAlerts}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white peer-checked:after:border-transparent"></div>
              </label>
            </div>

          </div>

          <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-850 flex items-start gap-2.5 text-xs text-zinc-400 leading-relaxed">
            <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              {t('setupEmailJS')}
            </span>
          </div>

        </div>

        {/* Deliverability Statistics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
          <div className="border-b border-zinc-850 pb-3">
            <h4 className="font-bold text-sm text-zinc-200 tracking-tight">{t('budgetAlertSummary')}</h4>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Analytical logging counters of active alerts sent</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            
            <div className="p-4 bg-zinc-950/30 rounded-2xl border border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email Alerts Sent
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 mt-2">
                {emailLogs}
              </div>
            </div>

            <div className="p-4 bg-zinc-950/30 rounded-2xl border border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> SMS Warnings Issued
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 mt-2">
                {smsLogs}
              </div>
            </div>

            <div className="p-4 bg-zinc-950/30 rounded-2xl border border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <AlertOctagon className="w-3 h-3" /> Budget Limits Alerts
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-red-400 mt-2">
                {budgetLogs}
              </div>
            </div>

            <div className="p-4 bg-zinc-950/30 rounded-2xl border border-zinc-850 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Transaction Alerts
              </span>
              <div className="text-2xl font-bold font-mono tracking-tight text-emerald-400 mt-2">
                {txLogs}
              </div>
            </div>

          </div>

          {/* Prompt warning of not linkage */}
          {notifications.length === 0 && (
            <div className="text-center py-6 text-zinc-650 text-xs font-mono">
              No alert logs emitted.
            </div>
          )}

        </div>

      </div>

      {/* Dynamic Alerts Logs Chrono Queue */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="border-b border-zinc-850 pb-3">
          <h4 className="font-bold text-sm text-zinc-200 tracking-tight">{t('notifLogTitle')}</h4>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Auditing queue of live system transmissions</p>
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 text-center bg-zinc-950/40 rounded-2xl border border-zinc-855">
            <p className="text-zinc-500 text-xs font-mono">{t('noNotifsYet')}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div key={notif.id} className="bg-zinc-955 rounded-2xl border border-zinc-850 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-200">{notif.title}</span>
                  <span className="text-[10px] text-zinc-550 font-mono">{notif.time}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans pr-4">{notif.body}</p>
                
                {/* Active channel badges */}
                {notif.channels.length > 0 && (
                  <div className="flex gap-2 pt-1">
                    {notif.channels.map((ch, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] font-bold rounded-md font-mono text-emerald-400">
                        {ch.type === 'email' ? '📧 Email alert delivered' : '📱 SMS alert delivered'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
