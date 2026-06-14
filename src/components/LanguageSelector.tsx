/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LanguageCode } from '../types';
import { Globe, ArrowRight } from 'lucide-react';

interface LanguageSelectorProps {
  onLanguageSelected: (lang: LanguageCode) => void;
  savedLang?: LanguageCode;
}

export default function LanguageSelector({ onLanguageSelected, savedLang = 'en' }: LanguageSelectorProps) {
  const [selected, setSelected] = useState<LanguageCode>(() => {
    if (savedLang === 'en') return 'english' as LanguageCode;
    if (savedLang === 'hi') return 'hindi' as LanguageCode;
    if (savedLang === 'te') return 'telugu' as LanguageCode;
    return savedLang;
  });

  const options = [
    { code: 'english' as LanguageCode, label: 'English', sub: 'English', flag: '🇬🇧' },
    { code: 'hindi' as LanguageCode, label: 'Hindi', sub: 'हिंदी', flag: '🇮🇳' },
    { code: 'telugu' as LanguageCode, label: 'Telugu', sub: 'తెలుగు', flag: '🗣️' },
  ];

  return (
    <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center p-4 z-[2000]">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl space-y-6 text-center transform transition-all duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-emerald-950 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-2">
            <Globe className="w-8 h-8 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 font-sans tracking-tight">Finance Tracker Pro</h2>
          <p className="text-sm text-zinc-400">
            Choose your language / अपनी भाषा चुनें / మీ భాషను ఎంచుకోండి
          </p>
        </div>

        {/* Option Grid */}
        <div className="grid grid-cols-3 gap-3">
          {options.map((opt) => (
            <button
              key={opt.code}
              onClick={() => setSelected(opt.code)}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all duration-200 ${
                selected === opt.code
                  ? 'border-emerald-500 bg-emerald-950/25 text-emerald-400'
                  : 'border-zinc-850 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-850/50 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="text-3xl leading-none select-none">{opt.flag}</span>
              <div className="space-y-0.5">
                <span className="text-xs font-bold block leading-tight">{opt.label}</span>
                <span className="text-[10px] opacity-70 block font-sans">{opt.sub}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Proceed Button */}
        <button
          onClick={() => onLanguageSelected(selected)}
          className="w-full group mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-950/20 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-98"
        >
          <span>Continue / आगे बढ़ें / కొనసాగించు</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
