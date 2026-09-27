import React from 'react';
import { Cpu, Terminal } from 'lucide-react';
import { Language } from '../types.ts';
import { translations } from '../i18n.ts';

interface FooterProps {
  lastExecution?: {
    provider: string;
    model: string;
    latency_ms: number;
    fallback_used?: boolean;
  };
  onOpenDebug: () => void;
  onOpenBenchmarks?: () => void;
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({
  lastExecution,
  onOpenDebug,
  onOpenBenchmarks,
  lang,
}) => {
  const t = translations[lang];

  return (
    <footer className="w-full border-t border-[#E8E2EE] bg-[#FAF8F5]/90 py-6 mt-16 text-xs text-[#706A82]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-4">
        {/* Top footer row: Technical indicator & Benchmark link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-[#E8E2EE]/70">
          {/* Real measured technical indicator */}
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#8B5CF6]" />
            {lastExecution ? (
              <span>
                {t.footer.poweredBy}{' '}
                <span className="font-semibold text-[#161824]">
                  {lastExecution.provider.toUpperCase()} ({lastExecution.model})
                </span>{' '}
                · {(lastExecution.latency_ms / 1000).toFixed(2)}s
                {lastExecution.fallback_used && (
                  <span className="ml-2 rtl:mr-2 text-xs px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-medium">
                    {t.footer.autoFallback}
                  </span>
                )}
              </span>
            ) : (
              <span>{t.footer.stackDesc}</span>
            )}
          </div>

          {/* Small footer link opening the Reliability & Benchmarks page */}
          {onOpenBenchmarks && (
            <button
              onClick={onOpenBenchmarks}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#161824] hover:text-[#7C3AED] transition-colors underline decoration-[#7C3AED]/30 underline-offset-4 hover:decoration-[#7C3AED]"
            >
              <span>{t.footer.reliabilityLink}</span>
            </button>
          )}
        </div>

        {/* Bottom footer row: Responsible AI Disclaimer & Debug Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#867F95]">
          <span>
            {t.footer.zeroPersistence}
          </span>
          <button
            onClick={onOpenDebug}
            className="flex items-center gap-1.5 text-[#6B647B] hover:text-[#7C3AED] hover:underline transition-colors"
            title="Inspect raw model payload and guardrail debug logs"
          >
            <Terminal className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span className="font-mono text-[11px]">{t.footer.debugPanel}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
