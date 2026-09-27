import React, { useState } from 'react';
import { Play, Activity, Layers, AlertTriangle, Sparkles } from 'lucide-react';
import { Language, BenchmarkReport } from '../../types.ts';
import { translations } from '../../i18n.ts';

interface BenchmarkModuleProps {
  lang: Language;
}

export const BenchmarkModule: React.FC<BenchmarkModuleProps> = ({ lang }) => {
  const t = translations[lang];
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<'dev' | 'held_out'>('held_out');

  const runBenchmark = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/benchmark/run', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Benchmark run failed');
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing benchmark run.');
    } finally {
      setIsRunning(false);
    }
  };

  const activeSet = report ? (selectedSet === 'dev' ? report.dev_set : report.held_out_set) : null;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 text-left rtl:text-right">
      {/* Eyebrow and Headline */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F5F3FF] to-[#EFF6FF] border border-[#DDD6FE] text-xs font-bold uppercase tracking-widest text-[#7C3AED] shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>{t.benchmarks.eyebrow}</span>
        </div>
        <h1 className="font-serif-headline text-4xl sm:text-5xl font-normal text-[#161824] tracking-tight">
          {t.benchmarks.title}
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#645D73]">
          {t.benchmarks.subtitle}
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white/95 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.02)] border border-[#E8E2EE] space-y-8">
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EDE8F7]">
          <div>
            <h2 className="text-lg font-bold text-[#161824]">
              {t.benchmarks.title}
            </h2>
            <p className="text-xs text-[#706A82]">
              {report ? `${new Date(report.timestamp).toLocaleTimeString()} (${new Date(report.timestamp).toLocaleDateString()})` : t.benchmarks.subtitle}
            </p>
          </div>

          <button
            onClick={runBenchmark}
            disabled={isRunning}
            className={`px-7 py-3.5 rounded-full font-bold text-xs sm:text-sm text-white transition-all flex items-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.25)] ${
              isRunning
                ? 'bg-[#B0A8C0] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#2563EB] hover:scale-[1.02] active:scale-[0.99]'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{t.benchmarks.runningBtn}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{t.benchmarks.runBtn}</span>
              </>
            )}
          </button>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#E11D48] flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#E11D48]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {report && (
          <div className="space-y-8 animate-in fade-in">
            {/* Set Toggle Pill */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1.5 bg-[#EDE8F7]/80 rounded-2xl text-xs font-bold text-[#645D73] border border-[#DDD6EE]">
                <button
                  onClick={() => setSelectedSet('held_out')}
                  className={`px-5 py-2 rounded-xl transition-all ${
                    selectedSet === 'held_out' ? 'bg-white text-[#161824] shadow-2xs font-extrabold' : 'hover:text-[#161824]'
                  }`}
                >
                  {t.benchmarks.setHeldOut}
                </button>
                <button
                  onClick={() => setSelectedSet('dev')}
                  className={`px-5 py-2 rounded-xl transition-all ${
                    selectedSet === 'dev' ? 'bg-white text-[#161824] shadow-2xs font-extrabold' : 'hover:text-[#161824]'
                  }`}
                >
                  {t.benchmarks.setDev}
                </button>
              </div>
            </div>

            {/* Performance Metrics Cards */}
            {activeSet && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                    {t.benchmarks.accuracy}
                  </span>
                  <div className="font-mono text-3xl font-black text-[#161824]">
                    {activeSet.accuracy}%
                  </div>
                  <span className="text-[11px] text-[#16A34A] font-semibold">
                    {activeSet.total_cases - (activeSet.confusion_matrix.false_positives + activeSet.confusion_matrix.false_negatives)} / {activeSet.total_cases}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                    {t.benchmarks.recall}
                  </span>
                  <div className="font-mono text-3xl font-black text-[#7C3AED]">
                    {activeSet.recall}%
                  </div>
                  <span className="text-[11px] text-[#706A82]">
                    {activeSet.confusion_matrix.true_positives} / {activeSet.confusion_matrix.true_positives + activeSet.confusion_matrix.false_negatives}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                    {t.benchmarks.precision}
                  </span>
                  <div className="font-mono text-3xl font-black text-[#0284C7]">
                    {activeSet.precision}%
                  </div>
                  <span className="text-[11px] text-[#706A82]">
                    FP: {activeSet.confusion_matrix.false_positives}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                    {t.benchmarks.latencyAvg} / p95
                  </span>
                  <div className="font-mono text-2xl font-black text-[#161824]">
                    {(activeSet.avg_latency_ms / 1000).toFixed(2)}s
                  </div>
                  <span className="text-[11px] font-mono text-[#706A82]">
                    p95: {(activeSet.p95_latency_ms / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>
            )}

            {/* Confusion Matrix & Exposure Summary */}
            {activeSet && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Confusion Matrix Table */}
                <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-3 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#7C3AED]" />
                    Matrice de Confusion ({activeSet.setName})
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3.5 rounded-xl bg-white border border-[#DDD6EE] shadow-2xs">
                      <span className="text-[#16A34A] font-bold block">Vrais Positifs (TP)</span>
                      <span className="font-mono text-xl font-bold">{activeSet.confusion_matrix.true_positives}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-[#DDD6EE] shadow-2xs">
                      <span className="text-[#D97706] font-bold block">Faux Positifs (FP)</span>
                      <span className="font-mono text-xl font-bold">{activeSet.confusion_matrix.false_positives}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-[#DDD6EE] shadow-2xs">
                      <span className="text-[#E11D48] font-bold block">Faux Négatifs (FN)</span>
                      <span className="font-mono text-xl font-bold">{activeSet.confusion_matrix.false_negatives}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white border border-[#DDD6EE] shadow-2xs">
                      <span className="text-[#16A34A] font-bold block">Vrais Négatifs (TN)</span>
                      <span className="font-mono text-xl font-bold">{activeSet.confusion_matrix.true_negatives}</span>
                    </div>
                  </div>
                </div>

                {/* Exposure Benchmark Summary */}
                <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-3 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#6366F1]" />
                    Benchmark Exposure Check (12 Profils Marocains)
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-[#DDD6EE] shadow-2xs">
                      <span className="text-[#706A82]">Précision de catégorisation de risque</span>
                      <span className="font-mono font-bold text-[#161824]">
                        {report.exposure_benchmark.tier_accuracy}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-[#DDD6EE] shadow-2xs">
                      <span className="text-[#706A82]">Taux de rappel des indices critiques</span>
                      <span className="font-mono font-bold text-[#16A34A]">
                        {report.exposure_benchmark.recall_rate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white border border-[#DDD6EE] shadow-2xs">
                      <span className="text-[#706A82]">Écart type score d'exposition</span>
                      <span className="font-mono font-bold text-[#161824]">
                        ±{report.exposure_benchmark.avg_score_deviation} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
