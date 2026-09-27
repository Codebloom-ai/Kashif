/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { AmbientBackground } from './components/AmbientBackground.tsx';
import { ScamShieldModule } from './components/ScamShield/ScamShieldModule.tsx';
import { ExposureCheckModule } from './components/ExposureCheck/ExposureCheckModule.tsx';
import { BenchmarkModule } from './components/Benchmark/BenchmarkModule.tsx';
import { MonitoringDashboard } from './components/Monitoring/MonitoringDashboard.tsx';
import { DebugModal } from './components/DebugModal.tsx';
import { Language, ScamShieldResponse, ExposureReport } from './types.ts';
import { translations } from './i18n.ts';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'exposureCheck' | 'scamShield' | 'benchmarks' | 'monitoring'>('exposureCheck');
  const [lang, setLang] = useState<Language>('fr');

  const [lastExecution, setLastExecution] = useState<{
    provider: string;
    model: string;
    latency_ms: number;
    fallback_used?: boolean;
  } | undefined>(undefined);

  const [lastScamResult, setLastScamResult] = useState<ScamShieldResponse | null>(null);
  const [exposureReport, setExposureReport] = useState<ExposureReport | null>(null);
  const [personalExposureCategories, setPersonalExposureCategories] = useState<string[]>([]);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [purgeAlert, setPurgeAlert] = useState<string | null>(null);

  // Subtle mouse parallax for background organic cutout shapes (4-8px offset)
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Small dampening factor: max 8px
      const x = ((e.clientX / window.innerWidth) - 0.5) * -14;
      const y = ((e.clientY / window.innerHeight) - 0.5) * -14;
      setMouseParallax({ x: Math.round(x), y: Math.round(y) });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Sync RTL and lang attribute on html tag
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Check ?debug=1 URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
      setIsDebugOpen(true);
    }
  }, []);

  const handlePurgeSession = async () => {
    try {
      await fetch('/api/session/purge', { method: 'POST' });
    } catch {
      // ignore
    }
    setLastScamResult(null);
    setExposureReport(null);
    setPersonalExposureCategories([]);
    setLastExecution(undefined);
    setPurgeAlert(translations[lang].header.purgeSuccess);
    setTimeout(() => setPurgeAlert(null), 4000);
  };

  const handleExposureCategoriesDiscovered = (cats: string[]) => {
    setPersonalExposureCategories((prev) => Array.from(new Set([...prev, ...cats])));
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#FAF8F5] selection:bg-[#7C3AED]/15 selection:text-[#6D28D9]">
      {/* Persistent Ambient Background with Organic Drifting Blobs & Tactile Grain */}
      <AmbientBackground />

      {/* Main interactive UI layer (positioned above ambient background at z-10) */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between">
        {/* Header with Exposure Check leading */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          setLang={setLang}
          onPurgeSession={handlePurgeSession}
        />

        {/* Transient Purge Notification */}
        {purgeAlert && (
          <div className="max-w-md mx-auto mt-4 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#F5F3FF] via-[#EEF2FF] to-[#F0F9FF] border border-[#DDD6FE] text-xs font-semibold text-[#4F46E5] flex items-center gap-2 shadow-[0_4px_16px_-4px_rgba(99,102,241,0.15)] animate-in slide-in-from-top">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#6366F1]" />
            <span>{purgeAlert}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {activeTab === 'exposureCheck' && (
            <ExposureCheckModule
              lang={lang}
              onExecutionComplete={setLastExecution}
              onExposureDetected={handleExposureCategoriesDiscovered}
              report={exposureReport}
              setReport={setExposureReport}
              onSwitchToScamShield={() => setActiveTab('scamShield')}
            />
          )}

          {activeTab === 'scamShield' && (
            <ScamShieldModule
              lang={lang}
              onExecutionComplete={setLastExecution}
              personalExposureCategories={personalExposureCategories}
              lastResult={lastScamResult}
              setLastResult={setLastScamResult}
            />
          )}

          {activeTab === 'benchmarks' && (
            <BenchmarkModule lang={lang} />
          )}

          {activeTab === 'monitoring' && (
            <MonitoringDashboard lang={lang} />
          )}
        </main>

        {/* Technical Footer */}
        <Footer
          lastExecution={lastExecution}
          onOpenDebug={() => setIsDebugOpen(true)}
          onOpenBenchmarks={() => setActiveTab('benchmarks')}
          lang={lang}
        />
      </div>

      {/* Hidden Dev Debug Panel (?debug=1) */}
      <DebugModal
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        lastScamResult={lastScamResult}
      />
    </div>
  );
}
