import React from 'react';
import { ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { Language } from '../types.ts';
import { translations } from '../i18n.ts';

interface HeaderProps {
  activeTab: 'scamShield' | 'exposureCheck' | 'benchmarks' | 'monitoring';
  setActiveTab: (tab: 'scamShield' | 'exposureCheck' | 'benchmarks' | 'monitoring') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  onPurgeSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onPurgeSession,
}) => {
  const t = translations[lang];

  return (
    <header className="w-full border-b border-[#E8E2EE] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-40 shadow-[0_2px_12px_-4px_rgba(99,102,241,0.04)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-24 flex items-center justify-between gap-4 sm:gap-6">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7C3AED] via-[#6366F1] to-[#38BDF8] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(99,102,241,0.25)]">
            <ShieldCheck className="w-5 h-5" strokeWidth={2.1} />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif-headline text-2xl font-bold tracking-tight text-[#161824]">
                Kashif
              </span>
              <span className="font-arabic text-lg font-semibold bg-gradient-to-r from-[#7C3AED] to-[#38BDF8] bg-clip-text text-transparent">
                كاشف
              </span>
            </div>
            <p className="hidden sm:block text-xs text-[#6B647B] font-medium tracking-tight">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Elevated Tactile Navigation Pill (smooth sliding indicator & minimal cyber icons) */}
        <nav
          className="hidden md:block relative w-[340px] sm:w-[390px] p-1.5 bg-[#EDE8F7]/80 border border-[#DDD6EE] rounded-2xl shadow-inner shadow-black/[0.03]"
          aria-label="Primary navigation"
        >
          <div className="grid grid-cols-2 relative">
            {/* Sliding Pill Indicator with violet accent edge & subtle glow */}
            <div
              className={`absolute top-0 bottom-0 w-1/2 rounded-xl bg-[#181829] shadow-[0_8px_20px_-4px_rgba(124,58,237,0.35),0_4px_10px_rgba(0,0,0,0.18)] border-b-2 border-[#7C3AED] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden ${
                activeTab === 'exposureCheck' ? 'start-0' : 'start-1/2'
              }`}
              aria-hidden="true"
            >
              {/* Internal glow line */}
              <div className="absolute inset-x-2 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#8B5CF6] to-[#38BDF8]" />
            </div>

            {/* Tab 1: Exposure Check */}
            <button
              onClick={() => setActiveTab('exposureCheck')}
              className={`group relative z-10 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200 ${
                activeTab === 'exposureCheck'
                  ? 'text-white'
                  : 'text-[#645D73] hover:text-[#161824]'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 transition-colors duration-200 shrink-0 ${
                  activeTab === 'exposureCheck'
                    ? 'text-[#A78BFA]'
                    : 'text-[#8E869E] group-hover:text-[#6366F1]'
                }`}
                strokeWidth={2.2}
              />
              <span className="truncate">{t.tabs.exposureCheck}</span>
            </button>

            {/* Tab 2: Scam Shield */}
            <button
              onClick={() => setActiveTab('scamShield')}
              className={`group relative z-10 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-bold tracking-tight transition-colors duration-200 ${
                activeTab === 'scamShield'
                  ? 'text-white'
                  : 'text-[#645D73] hover:text-[#161824]'
              }`}
            >
              <ShieldAlert
                className={`w-4 h-4 transition-colors duration-200 shrink-0 ${
                  activeTab === 'scamShield'
                    ? 'text-[#38BDF8]'
                    : 'text-[#8E869E] group-hover:text-[#6366F1]'
                }`}
                strokeWidth={2.2}
              />
              <span className="truncate">{t.tabs.scamShield}</span>
            </button>
          </div>
        </nav>

        {/* Right side: Secondary Subordinate Controls (Language Picker & Delete Session) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Toggle Pill */}
          <div className="flex items-center p-0.5 bg-[#EDE8F7]/80 rounded-xl text-xs font-medium text-[#5B546A] border border-[#DDD6EE]">
            {(['fr', 'ar', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`relative px-2.5 py-1 rounded-lg transition-all duration-200 ${
                  lang === l
                    ? 'bg-white text-[#161824] font-bold shadow-2xs scale-[1.02]'
                    : 'hover:text-[#161824] opacity-75 hover:opacity-100'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Purge Session button */}
          <button
            onClick={onPurgeSession}
            title={t.common.deleteSession}
            className="flex items-center gap-1.5 text-xs text-[#827A93] hover:text-[#7C3AED] px-2.5 py-1.5 rounded-xl hover:bg-[#F3E8FF]/70 transition-colors border border-transparent hover:border-[#DDD6FE]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline font-medium">{t.common.deleteSession}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar - Exposure Check & Scam Shield */}
      <div className="md:hidden border-t border-[#E8E2EE] bg-[#FAF8F5] px-3 py-2.5">
        <div className="grid grid-cols-2 relative p-1 bg-[#EDE8F7]/90 border border-[#DDD6EE] rounded-xl">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-[#181829] shadow-sm border-b-2 border-[#7C3AED] transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
              activeTab === 'exposureCheck' ? 'start-1' : 'start-[calc(50%+2px)]'
            }`}
            aria-hidden="true"
          />

          <button
            onClick={() => setActiveTab('exposureCheck')}
            className={`relative z-10 py-2 rounded-lg text-center flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === 'exposureCheck' ? 'text-white' : 'text-[#645D73]'
            }`}
          >
            <ShieldCheck
              className={`w-3.5 h-3.5 ${
                activeTab === 'exposureCheck' ? 'text-[#A78BFA]' : 'text-[#8E869E]'
              }`}
            />
            <span>{t.tabs.exposureCheck}</span>
          </button>

          <button
            onClick={() => setActiveTab('scamShield')}
            className={`relative z-10 py-2 rounded-lg text-center flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              activeTab === 'scamShield' ? 'text-white' : 'text-[#645D73]'
            }`}
          >
            <ShieldAlert
              className={`w-3.5 h-3.5 ${
                activeTab === 'scamShield' ? 'text-[#38BDF8]' : 'text-[#8E869E]'
              }`}
            />
            <span>{t.tabs.scamShield}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
