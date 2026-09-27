import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { UsageLogEntry } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const logsDir = path.join(rootDir, 'logs');
const logFilePath = path.join(logsDir, 'usage.jsonl');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// In-memory buffer of recent logs for fast dashboard querying
const recentLogs: UsageLogEntry[] = [];

// Seed existing logs from disk if file exists
try {
  if (fs.existsSync(logFilePath)) {
    const lines = fs.readFileSync(logFilePath, 'utf-8').split('\n').filter(Boolean);
    const parsed = lines.slice(-200).map(l => {
      try {
        return JSON.parse(l) as UsageLogEntry;
      } catch {
        return null;
      }
    }).filter((x): x is UsageLogEntry => x !== null);
    recentLogs.push(...parsed);
  }
} catch (e) {
  console.warn('Could not read existing usage log:', e);
}

export function logUsage(entry: Omit<UsageLogEntry, 'id' | 'timestamp'>): UsageLogEntry {
  const fullEntry: UsageLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  recentLogs.push(fullEntry);
  if (recentLogs.length > 500) {
    recentLogs.shift();
  }

  // Append to logs/usage.jsonl asynchronously
  fs.appendFile(logFilePath, JSON.stringify(fullEntry) + '\n', (err) => {
    if (err) {
      console.error('Failed to append to usage.jsonl:', err);
    }
  });

  return fullEntry;
}

export function getUsageLogs(limit = 100): UsageLogEntry[] {
  return recentLogs.slice(-limit).reverse();
}

export function getMonitoringStats() {
  const count = recentLogs.length;
  if (count === 0) {
    return {
      total_requests: 0,
      avg_latency_ms: 0,
      p95_latency_ms: 0,
      fallback_rate: 0,
      success_rate: 100,
      providers: {},
      models: {},
      recent_timeline: [],
    };
  }

  const latencies = recentLogs.map(l => l.latency_ms).sort((a, b) => a - b);
  const avg_latency_ms = Math.round(latencies.reduce((a, b) => a + b, 0) / count);
  const p95Index = Math.min(Math.floor(count * 0.95), count - 1);
  const p95_latency_ms = Math.round(latencies[p95Index] || 0);

  const fallbackCount = recentLogs.filter(l => l.fallback_used).length;
  const successCount = recentLogs.filter(l => l.status === 'success' || l.status === 'fallback_success').length;

  const providers: Record<string, number> = {};
  const models: Record<string, number> = {};

  for (const log of recentLogs) {
    providers[log.provider] = (providers[log.provider] || 0) + 1;
    models[log.model] = (models[log.model] || 0) + 1;
  }

  // Group by minute for timeline
  const timelineMap: Record<string, { requests: number; avg_latency: number; total_lat: number }> = {};
  for (const log of recentLogs.slice(-60)) {
    const timeKey = log.timestamp.substring(11, 16); // HH:mm
    if (!timelineMap[timeKey]) {
      timelineMap[timeKey] = { requests: 0, avg_latency: 0, total_lat: 0 };
    }
    timelineMap[timeKey].requests += 1;
    timelineMap[timeKey].total_lat += log.latency_ms;
  }

  const recent_timeline = Object.entries(timelineMap).map(([time, data]) => ({
    time,
    requests: data.requests,
    avg_latency_ms: Math.round(data.total_lat / data.requests),
  }));

  return {
    total_requests: count,
    avg_latency_ms,
    p95_latency_ms,
    fallback_rate: Math.round((fallbackCount / count) * 100),
    success_rate: Math.round((successCount / count) * 100),
    providers,
    models,
    recent_timeline,
  };
}
