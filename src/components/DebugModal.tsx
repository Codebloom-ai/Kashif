import React from 'react';
import { X, Terminal, Cpu, ShieldAlert, Layers } from 'lucide-react';
import { ScamShieldResponse } from '../types.ts';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  lastScamResult: ScamShieldResponse | null;
}

export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose, lastScamResult }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#16181D] text-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 max-h-[85vh] flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#8B5CF6]" />
            <h2 className="font-mono text-base font-bold text-white">
              Kashif Dev Panel (?debug=1)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto space-y-6 text-xs font-mono pr-2">
          {/* Stack summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/5 p-4 rounded-xl border border-white/5">
            <div>
              <span className="text-white/40 block text-[10px]">FOURNISSEUR</span>
              <span className="text-[#38BDF8] font-bold">
                {lastScamResult?.provider_used || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">MODÈLE</span>
              <span className="text-white font-bold truncate block">
                {lastScamResult?.model_used || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">LATENCE RÉELLE</span>
              <span className="text-[#34D399] font-bold">
                {lastScamResult ? `${lastScamResult.latency_ms} ms` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-white/40 block text-[10px]">FALLBACK DÉCLENCHÉ</span>
              <span className={lastScamResult?.fallback_used ? 'text-[#FBBF24] font-bold' : 'text-white/60 font-bold'}>
                {lastScamResult?.fallback_used ? 'OUI' : 'NON'}
              </span>
            </div>
          </div>

          {/* Guardrail Rules Fired */}
          <div className="space-y-2">
            <span className="text-[#C4B5FD] font-bold uppercase tracking-wider text-[11px] block">
              1. RÉSULTAT GARDE-FOU DÉTERMINISTE (PARALLÈLE)
            </span>
            <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-1 text-white/80">
              <div>Verdict Garde-Fou : <span className="text-white font-bold">{lastScamResult?.guardrail_verdict || 'Aucun test actif'}</span></div>
              <div>Escalade Forcée : <span className="text-white font-bold">{lastScamResult?.guardrail_escalated ? 'OUI' : 'NON'}</span></div>
              {lastScamResult?.debug_info?.guardrail && (
                <div className="pt-2 border-t border-white/10 space-y-1">
                  <div>Règles déclenchées :</div>
                  {lastScamResult.debug_info.guardrail.triggered_rules.length === 0 ? (
                    <span className="text-white/40 italic">Aucune règle stricte déclenchée</span>
                  ) : (
                    lastScamResult.debug_info.guardrail.triggered_rules.map((r, i) => (
                      <div key={i} className="text-[#F43F5E] pl-2">• {r}</div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Merge Logic Result */}
          <div className="space-y-2">
            <span className="text-[#38BDF8] font-bold uppercase tracking-wider text-[11px] block">
              2. FUSION DES VERDICTS (MERGE RESOLUTION)
            </span>
            <div className="p-3 bg-black/50 rounded-xl border border-white/5 space-y-1 text-white/80">
              <div>Verdict LLM : <span className="text-white font-bold">{lastScamResult?.llm_verdict || 'N/A'}</span></div>
              <div>Verdict Final Fusionné : <span className="text-[#8B5CF6] font-bold text-sm">{lastScamResult?.verdict || 'N/A'}</span></div>
              <div className="text-[11px] text-white/50 pt-1">
                Règle : Max(LLM, Garde-fou) où Safe &lt; Suspicious &lt; Scam. Le garde-fou ne peut qu'escalader.
              </div>
            </div>
          </div>

          {/* Raw LLM JSON */}
          <div className="space-y-2">
            <span className="text-white/60 font-bold uppercase tracking-wider text-[11px] block">
              3. SORTIE BRUTE MODÈLE JSON (RAW OUTPUT)
            </span>
            <pre className="p-4 bg-black/80 rounded-xl border border-white/5 text-[11px] overflow-x-auto text-[#A5D6A7] leading-relaxed">
              {lastScamResult?.debug_info?.raw_llm_json
                ? JSON.stringify(lastScamResult.debug_info.raw_llm_json, null, 2)
                : '// Effectuez une analyse dans Scam Shield pour visualiser le JSON brut'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            Fermer le panel
          </button>
        </div>
      </div>
    </div>
  );
};
