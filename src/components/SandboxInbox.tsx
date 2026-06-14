/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Mail, X, Copy, Check, Settings, ShieldCheck, MailQuestion, Info, RefreshCw } from 'lucide-react';
import { EmailSettings } from '../types';

export interface SandboxEmail {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  otp: string;
  purpose: string;
  timestamp: string;
  htmlContent: string;
}

interface SandboxInboxProps {
  emails: SandboxEmail[];
  onClear: () => void;
  settings: EmailSettings;
  onUpdateSettings: (s: EmailSettings) => void;
}

export default function SandboxInbox({ emails, onClear, settings, onUpdateSettings }: SandboxInboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SandboxEmail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'inbox' | 'setup'>('inbox');

  // Sync settings inputs
  const [publicKey, setPublicKey] = useState(settings.publicKey);
  const [serviceId, setServiceId] = useState(settings.serviceId);
  const [templateId, setTemplateId] = useState(settings.templateId);
  const [useRealEmail, setUseRealEmail] = useState(settings.useRealEmail);
  const [useMongoOtp, setUseMongoOtp] = useState(settings.useMongoOtp ?? false);

  useEffect(() => {
    if (emails.length > 0 && !selectedEmail) {
      setSelectedEmail(emails[0]);
    }
  }, [emails, selectedEmail]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSettings = () => {
    onUpdateSettings({
      publicKey: publicKey.trim(),
      serviceId: serviceId.trim(),
      templateId: templateId.trim(),
      useRealEmail,
      useMongoOtp
    });
    setActiveTab('inbox');
  };

  return (
    <>
      {/* Floating Toggle Button with alert badge */}
      <button
        id="sandbox-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        <Mail className="w-5 h-5 animate-pulse" />
        <span className="font-semibold text-sm">Sandbox Email Inbox</span>
        {emails.length > 0 && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </button>

      {/* Slide-out Sidebar Inbox */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-slide-in">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-emerald-400 font-sans tracking-tight">Mail Server Sandbox</h3>
                  <p className="text-xs text-zinc-400 font-mono">Catch emails instantly & test OTP configs</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md text-xs transition-colors"
              >
                Close (ESC)
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-zinc-800">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 py-3 text-center border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'inbox' 
                    ? 'border-emerald-500 text-emerald-400 bg-zinc-900/20' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Virtual Mailbox ({emails.length})
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                className={`flex-1 py-3 text-center border-b-2 font-medium text-sm transition-all ${
                  activeTab === 'setup' 
                    ? 'border-emerald-500 text-emerald-400 bg-zinc-900/20' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Setup Real EmailJS
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-hidden flex flex-col bg-zinc-900/20">
              {activeTab === 'inbox' ? (
                /* INBOX VIEW */
                emails.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
                    <MailQuestion className="w-16 h-16 text-zinc-600 mb-4 stroke-1" />
                    <h4 className="font-semibold text-lg text-zinc-400 mb-1 font-sans">No Emails Received Yet</h4>
                    <p className="text-sm text-zinc-500 max-w-sm mb-6">
                      Trigger registration, sign-in, or budget alerts in the application to instantly simulate beautiful OTP logs.
                    </p>
                    <div className="text-xs font-mono bg-zinc-900 border border-zinc-800/60 rounded-lg p-3 text-left max-w-md text-emerald-500/80">
                      💡 When you add transaction details, set category limits, or login, automatic secured system emails show up right here!
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Email list */}
                    <div className="w-2/5 border-r border-zinc-800 overflow-y-auto bg-zinc-950/40">
                      <div className="p-2 border-b border-zinc-800/40 bg-zinc-900/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-400 font-mono">INBOX ITEMS</span>
                        <button 
                          onClick={onClear}
                          className="text-[10px] text-red-400/80 hover:text-red-400 font-mono uppercase tracking-wider"
                        >
                          Clear All
                        </button>
                      </div>
                      {emails.map((email) => (
                        <button
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className={`w-full text-left p-3.5 border-b border-zinc-850 transition-colors flex flex-col gap-1.5 ${
                            selectedEmail?.id === email.id
                              ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500'
                              : 'hover:bg-zinc-900/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-300 font-mono truncate max-w-[120px]">
                              {email.recipient.split('@')[0]}
                            </span>
                            <span className="text-[9px] text-zinc-500 font-mono">{email.timestamp}</span>
                          </div>
                          <div className="text-xs font-semibold text-emerald-400/90 truncate">{email.subject}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] font-mono bg-emerald-900/30 text-emerald-400 px-1.5 py-0.5 rounded font-black tracking-wider">
                              Code: {email.otp}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-sans tracking-wide uppercase px-1 bg-zinc-800 rounded">
                              {email.purpose}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Right Panel: Selected Email Render */}
                    <div className="w-3/5 overflow-y-auto bg-zinc-900/10 flex flex-col">
                      {selectedEmail ? (
                        <div className="flex flex-col h-full">
                          {/* Subject Header */}
                          <div className="p-4 border-b border-zinc-800 bg-zinc-950/40 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono text-zinc-500">From: {selectedEmail.sender}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-emerald-400 font-mono bg-emerald-950 px-2 py-0.5 rounded">
                                  OTP: {selectedEmail.otp}
                                </span>
                                <button
                                  onClick={() => handleCopy(selectedEmail.otp, 'viewer')}
                                  className="p-1 text-zinc-400 hover:text-emerald-400 bg-zinc-800 rounded hover:scale-105 active:scale-95 transition-all"
                                  title="Copy OTP"
                                >
                                  {copiedId === 'viewer' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                            <h4 className="font-bold text-md text-zinc-200 heading-sans leading-tight">
                              {selectedEmail.subject}
                            </h4>
                            <div className="text-xs font-semibold text-emerald-300">
                              Recipient: <span className="underline font-mono text-zinc-300">{selectedEmail.recipient}</span>
                            </div>
                          </div>

                          {/* Email Body HTML Frame */}
                          <div className="flex-1 p-4 overflow-y-auto">
                            <div className="bg-zinc-950 rounded-xl border border-zinc-850 p-4 shadow-inner">
                              <div 
                                className="html-preview"
                                dangerouslySetInnerHTML={{ __html: selectedEmail.htmlContent }}
                              />
                            </div>
                          </div>

                          <div className="p-3 border-t border-zinc-800 text-center bg-zinc-950 flex gap-2 items-center justify-center">
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Simulator engine perfectly running
                            </span>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center text-zinc-600">
                          Select an email to view contents
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                /* SETUP VIEW */
                <div className="flex-1 p-6 overflow-y-auto bg-zinc-950/40">
                  <div className="max-w-md mx-auto space-y-5">
                    <div className="bg-emerald-950/15 border border-emerald-500/30 p-4 rounded-xl flex items-start gap-3">
                      <Settings className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-sm text-emerald-300 mb-1">Make Email OTP Deliverable Internationally</h4>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          This system supports instant real-world email OTP delivery! By default it simulates locally, but if you have an <strong>EmailJS</strong> account, insert your credentials below to push actual login verifications straight to your inbox.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* ── MongoDB + Nodemailer Toggle ── */}
                      <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">🍃</span>
                          <span className="text-sm font-bold text-blue-300">MongoDB + Nodemailer (Recommended)</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          OTPs are generated server-side, stored in <strong className="text-blue-400">MongoDB</strong> with a TTL index, and delivered via <strong className="text-blue-400">Nodemailer</strong> SMTP. Run the backend (<code className="text-blue-300 text-[10px]">npm run server</code>) with your <code className="text-[10px]">.env</code> configured.
                        </p>
                        <label className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-blue-500/40 transition-all">
                          <div>
                            <span className="text-sm font-semibold text-zinc-300 block">Use MongoDB OTP Backend</span>
                            <span className="text-xs text-zinc-500 block">Real email via SMTP · OTPs stored in MongoDB</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={useMongoOtp}
                            onChange={(e) => setUseMongoOtp(e.target.checked)}
                            className="w-4 h-4 accent-blue-500 rounded"
                          />
                        </label>
                        {useMongoOtp && (
                          <div className="text-xs text-blue-300 bg-blue-950/30 border border-blue-500/20 rounded-lg p-3 space-y-1">
                            <p className="font-bold">Setup checklist:</p>
                            <ol className="list-decimal list-inside space-y-0.5 text-zinc-400">
                              <li>Copy <code className="text-blue-200">.env.example</code> → <code className="text-blue-200">.env</code>, fill in <code className="text-blue-200">MONGODB_URI</code> + <code className="text-blue-200">SMTP_*</code></li>
                              <li>Run <code className="text-blue-200">npm install</code> to get new packages</li>
                              <li>Start backend: <code className="text-blue-200">npm run server</code> or <code className="text-blue-200">npm run dev:all</code></li>
                            </ol>
                          </div>
                        )}
                      </div>

                      {/* Connection Toggle */}
                      <label className="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer hover:border-emerald-500/40 transition-all">
                        <div>
                          <span className="text-sm font-semibold text-zinc-300 block">Deliver via Real EmailJS</span>
                          <span className="text-xs text-zinc-500 block">When active, letters are distributed to real inboxes</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={useRealEmail}
                          onChange={(e) => setUseRealEmail(e.target.checked)}
                          className="w-4 h-4 accent-emerald-500 rounded"
                        />
                      </label>

                      {/* Inputs */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                            EmailJS Public Key
                          </label>
                          <input
                            type="text"
                            value={publicKey}
                            onChange={(e) => setPublicKey(e.target.value)}
                            placeholder="e.g. user_G4d86E9v..."
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                            EmailJS Service ID (e.g. Gmail)
                          </label>
                          <input
                            type="text"
                            value={serviceId}
                            onChange={(e) => setServiceId(e.target.value)}
                            placeholder="e.g. service_gmail"
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                            EmailJS Template ID
                          </label>
                          <input
                            type="text"
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            placeholder="e.g. template_otp"
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-zinc-200 font-mono"
                          />
                        </div>
                      </div>

                      {/* Instructions */}
                      <div className="p-4 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-3.5">
                        <h5 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-zinc-500" />
                          Template variables required in your EmailJS template:
                        </h5>
                        <ul className="text-xs text-zinc-400 list-disc list-inside space-y-1.5 pl-1.5 font-sans leading-relaxed">
                          <li><code className="text-[11px] font-mono text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded">{"{{to_email}}"}</code> (Recipient address)</li>
                          <li><code className="text-[11px] font-mono text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded">{"{{otp}}"}</code> (The 6-digit numeric OTP)</li>
                          <li><code className="text-[11px] font-mono text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded">{"{{purpose}}"}</code> ("Login Auth", "Registration Verification", etc.)</li>
                          <li><code className="text-[11px] font-mono text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded">{"{{app_name}}"}</code> (Set to "Finance Tracker Pro")</li>
                        </ul>
                      </div>

                      {/* Submit */}
                      <button
                        onClick={handleSaveSettings}
                        className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
