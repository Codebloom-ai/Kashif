/**
 * Dedicated Semantic Severity Color Mapping
 * 
 * CRITICAL ARCHITECTURAL RULE:
 * These colors MUST NEVER change based on the app's theme/accent color, dark mode,
 * or future palette updates. They are fixed, hardcoded semantic risk indicators:
 * 
 * - Critique (Critical): Deep Red (#C0392B)
 * - Élevé (High): Orange (#E07B1A)
 * - Modéré (Medium): True Yellow (#D4A017 — distinct from orange, true sunny yellow)
 * - Faible (Low / Safe): Green (#2E7D4F)
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface SeverityStyle {
  key: SeverityLevel;
  labelFr: string;
  labelAr: string;
  labelEn: string;
  hex: string;
  hexBg: string;
  hexBorder: string;
  // Tailwind class combinations:
  badge: string;       // Tinted background, colored text, colored border
  badgeSolid: string;  // Solid color background with crisp white text
  text: string;        // Colored text class
  bg: string;          // Light background tint class
  border: string;      // Subtle border tint class
  dot: string;         // Solid dot indicator class
  barFill: string;     // Progress bar fill class
  hoverText: string;   // Hover text class for filter buttons
  ring: string;        // Active ring highlight class
}

export const FIXED_SEVERITY_STYLES: Record<SeverityLevel, SeverityStyle> = {
  critical: {
    key: 'critical',
    labelFr: 'Critique',
    labelAr: 'حرج',
    labelEn: 'Critical',
    hex: '#C0392B',
    hexBg: '#FEF2F2',
    hexBorder: '#FECACA',
    badge: 'text-[#C0392B] bg-[#FEF2F2] border-[#FECACA]',
    badgeSolid: 'bg-[#C0392B] text-white shadow-2xs',
    text: 'text-[#C0392B]',
    bg: 'bg-[#FEF2F2]',
    border: 'border-[#FECACA]',
    dot: 'bg-[#C0392B]',
    barFill: 'bg-[#C0392B]',
    hoverText: 'hover:text-[#C0392B]',
    ring: 'ring-2 ring-[#C0392B]/25',
  },
  high: {
    key: 'high',
    labelFr: 'Élevé',
    labelAr: 'عالي',
    labelEn: 'High',
    hex: '#E07B1A',
    hexBg: '#FFF7ED',
    hexBorder: '#FED7AA',
    badge: 'text-[#C2540A] bg-[#FFF7ED] border-[#FED7AA]',
    badgeSolid: 'bg-[#E07B1A] text-white shadow-2xs',
    text: 'text-[#C2540A]',
    bg: 'bg-[#FFF7ED]',
    border: 'border-[#FED7AA]',
    dot: 'bg-[#E07B1A]',
    barFill: 'bg-[#E07B1A]',
    hoverText: 'hover:text-[#E07B1A]',
    ring: 'ring-2 ring-[#E07B1A]/25',
  },
  medium: {
    key: 'medium',
    labelFr: 'Modéré',
    labelAr: 'متوسط',
    labelEn: 'Medium',
    hex: '#D4A017',
    hexBg: '#FEFCE8',
    hexBorder: '#FEF08A',
    badge: 'text-[#854D0E] bg-[#FEFCE8] border-[#FEF08A]',
    badgeSolid: 'bg-[#D4A017] text-white shadow-2xs',
    text: 'text-[#854D0E]',
    bg: 'bg-[#FEFCE8]',
    border: 'border-[#FEF08A]',
    dot: 'bg-[#D4A017]',
    barFill: 'bg-[#D4A017]',
    hoverText: 'hover:text-[#854D0E]',
    ring: 'ring-2 ring-[#D4A017]/25',
  },
  low: {
    key: 'low',
    labelFr: 'Faible',
    labelAr: 'منخفض',
    labelEn: 'Low',
    hex: '#2E7D4F',
    hexBg: '#F0FDF4',
    hexBorder: '#BBF7D0',
    badge: 'text-[#2E7D4F] bg-[#F0FDF4] border-[#BBF7D0]',
    badgeSolid: 'bg-[#2E7D4F] text-white shadow-2xs',
    text: 'text-[#2E7D4F]',
    bg: 'bg-[#F0FDF4]',
    border: 'border-[#BBF7D0]',
    dot: 'bg-[#2E7D4F]',
    barFill: 'bg-[#2E7D4F]',
    hoverText: 'hover:text-[#2E7D4F]',
    ring: 'ring-2 ring-[#2E7D4F]/25',
  },
};

/**
 * Maps a numerical exposure score (0-100) to its fixed severity tier
 */
export function getSeverityFromScore(score: number): SeverityLevel {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 26) return 'medium';
  return 'low';
}

/**
 * Returns the exact fixed badge styling class for a given severity level
 */
export function getSeverityBadgeClass(severity: SeverityLevel | string): string {
  const normalized = (severity || 'low').toLowerCase() as SeverityLevel;
  const style = FIXED_SEVERITY_STYLES[normalized] || FIXED_SEVERITY_STYLES.low;
  return style.badge;
}

/**
 * Returns the exact fixed badge styling class from a numerical score
 */
export function getSeverityBadgeClassFromScore(score: number): string {
  const tier = getSeverityFromScore(score);
  return FIXED_SEVERITY_STYLES[tier].badge;
}

/**
 * Returns the exact progress bar fill class for a given score
 */
export function getSeverityProgressBarClass(score: number): string {
  const tier = getSeverityFromScore(score);
  return FIXED_SEVERITY_STYLES[tier].barFill;
}
