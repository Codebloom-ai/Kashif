import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, Server, TrendingUp, Terminal, Sparkles } from 'lucide-react';
import { Language } from '../../types.ts';

interface UsageStats {
  total_requests: number;
  success_rate: number;
  avg_latency_ms: number;
  p95_latency_ms: number;
  fallback_rate: number;
  providers: Record<string, number>;
  recent_timeline: Array<{ time: string; requests: number; avg_latency_ms: number }>;
}

interface LogEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  latency_ms: number;
  status: string;
  fallback_used?: boolean;
}

interface MonitoringDashboardProps {
  lang: Language;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/monitoring/stats'),
        fetch('/api/monitoring/logs?limit=15'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (e) {
      console.error('Failed to load monitoring stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 text-left rtl:text-right">
      {/* Eyebrow and Headline */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F5F3FF] to-[#EFF6FF] border border-[#DDD6FE] text-xs font-bold uppercase tracking-widest text-[#7C3AED] shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>TÉLÉMÉTRIE EN TEMPS RÉEL</span>
        </div>
        <h1 className="font-serif-headline text-4xl sm:text-5xl font-normal text-[#161824] tracking-tight">
          Monitoring de Latence & Débit
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#645D73]">
          Suivi en continu de chaque appel LLM, des basculements de sécurité (fallback) et de la télémétrie enregistrée dans <code className="bg-[#EDE8F7] text-[#6D28D9] px-2 py-0.5 rounded-md text-xs font-mono">logs/usage.jsonl</code>.
        </p>
      </div>

      {/* Main Dashboard Card */}
      <div className="bg-white/95 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.02)] border border-[#E8E2EE] space-y-8">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EDE8F7]">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#7C3AED]" />
            <h2 className="text-lg font-bold text-[#161824]">
              Flux de Télémétrie Live
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-[#706A82] cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded text-[#7C3AED] focus:ring-[#7C3AED]"
              />
              <span>Actualisation automatique (5s)</span>
            </label>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#FAF8FF] border border-[#DDD6EE] hover:bg-[#EDE8F7] text-[#161824] transition-colors shadow-2xs"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-4 h-4 text-[#7C3AED] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                Requêtes Enregistrées
              </span>
              <div className="font-mono text-3xl font-black text-[#161824]">
                {stats.total_requests}
              </div>
              <span className="text-[11px] text-[#16A34A] font-semibold">
                {stats.success_rate}% de succès
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                Latence Moyenne
              </span>
              <div className="font-mono text-3xl font-black text-[#7C3AED]">
                {(stats.avg_latency_ms / 1000).toFixed(2)}s
              </div>
              <span className="text-[11px] text-[#706A82]">
                Temps de réponse réel
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                Latence p95
              </span>
              <div className="font-mono text-3xl font-black text-[#0284C7]">
                {(stats.p95_latency_ms / 1000).toFixed(2)}s
              </div>
              <span className="text-[11px] text-[#706A82]">
                95% sous ce seuil
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#706A82]">
                Taux de Fallback
              </span>
              <div className="font-mono text-3xl font-black text-[#D97706]">
                {stats.fallback_rate}%
              </div>
              <span className="text-[11px] text-[#706A82]">
                Basculements automatiques
              </span>
            </div>
          </div>
        )}

        {/* Provider Breakdown & Latency Timeline */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Provider Breakdown */}
            <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#7C3AED]" />
                Répartition des Fournisseurs d'IA
              </h3>
              <div className="space-y-3">
                {Object.keys(stats.providers).length === 0 ? (
                  <p className="text-xs text-[#867F95]">Aucune requête enregistrée pour l'instant.</p>
                ) : (
                  Object.entries(stats.providers).map(([provider, count]) => {
                    const pct = Math.round((count / stats.total_requests) * 100);
                    return (
                      <div key={provider} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold uppercase text-[#161824]">
                            {provider}
                          </span>
                          <span className="text-[#706A82]">
                            {count} appels ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#EDE8F7] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#6366F1] to-[#7C3AED] h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Timeline Bars */}
            <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-3 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#0284C7]" />
                Historique Récent par Tranche de Temps
              </h3>
              <div className="space-y-2">
                {stats.recent_timeline.length === 0 ? (
                  <p className="text-xs text-[#867F95]">En attente de nouvelles requêtes...</p>
                ) : (
                  stats.recent_timeline.slice(-5).map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-[#DDD6EE] flex items-center justify-between text-xs shadow-2xs"
                    >
                      <span className="font-mono text-[#706A82]">{point.time}</span>
                      <span className="font-bold text-[#161824]">{point.requests} requêtes</span>
                      <span className="font-mono text-[#7C3AED]">
                        moy: {(point.avg_latency_ms / 1000).toFixed(2)}s
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live Logs Stream */}
        <div className="space-y-3 pt-4 border-t border-[#EDE8F7]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#7C3AED]" />
              Journal des Requêtes (logs/usage.jsonl)
            </h3>
            <span className="text-[11px] font-mono text-[#867F95]">
              {logs.length} entrées récentes
            </span>
          </div>

          <div className="border border-[#DDD6EE] rounded-2xl overflow-hidden bg-[#181829] text-white p-4 font-mono text-xs max-h-72 overflow-y-auto space-y-2 shadow-inner">
            {logs.length === 0 ? (
              <p className="text-[#867F95] italic">En attente des premières requêtes...</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 hover:bg-white/5 px-2 rounded-lg"
                >
                  <span className="text-[#A5A0B2] text-[11px]">
                    {log.timestamp.substring(11, 19)}
                  </span>
                  <span className="text-[#38BDF8] font-bold uppercase">
                    [{log.provider}]
                  </span>
                  <span className="text-white/80 truncate max-w-xs">{log.model}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                      log.status === 'success'
                        ? 'bg-[#16A34A]/30 text-[#4ADE80]'
                        : log.status === 'fallback_success'
                        ? 'bg-[#D97706]/30 text-[#FBBF24]'
                        : 'bg-[#E11D48]/30 text-[#FDA4AF]'
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-white/60">{(log.latency_ms / 1000).toFixed(2)}s</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
