import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  MapPin,
  Building2,
  Calendar,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Pause,
  Play,
  FileText,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { Language } from '../../types.ts';
import { translations } from '../../i18n.ts';
import { FIXED_SEVERITY_STYLES, getSeverityFromScore } from '../../utils/severityColors.ts';

interface HeroLivePreviewReelProps {
  lang: Language;
}

interface PreviewSample {
  id: string;
  name: string;
  handle: string;
  city: string;
  avatarBg: string;
  avatarLetter: string;
  bio: string;
  posts: Array<{ label: string; icon: string; bg: string }>;
  tags: Array<{
    icon: string;
    text: string;
    color: string;
    bgColor: string;
    borderColor: string;
    top: string;
    left?: string;
    right?: string;
  }>;
  score: number;
  level: string;
  levelColor: string;
  levelBg: string;
  levelBorder: string;
  summary: string;
}

export const HeroLivePreviewReel: React.FC<HeroLivePreviewReelProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // 3 Rich Pre-scripted Sample Profiles (Moroccan realistic scenarios)
  const samples: Record<Language, PreviewSample[]> = {
    fr: [
      {
        id: 'casablanca_tech',
        name: 'Mehdi Benjelloun',
        handle: '@mehdi_b',
        city: 'Casablanca',
        avatarBg: 'from-[#7C3AED] to-[#6366F1]',
        avatarLetter: 'M',
        bio: 'Tech Lead @ CFC Lab 🚀 · Casablanca · Tech & Fin',
        posts: [
          { label: 'Badge & Bureau', icon: '🏢', bg: 'bg-[#F5F3FF]' },
          { label: 'CFC Rooftop', icon: '🌆', bg: 'bg-[#EDE9FE]' },
          { label: 'Café Anfa', icon: '☕', bg: 'bg-[#EFF6FF]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'Casablanca Finance City',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '22%',
            right: '8%',
          },
          {
            icon: '🏢',
            text: 'Badge entreprise exposé',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '52%',
            left: '8%',
          },
          {
            icon: '📅',
            text: 'Routine horaires déduite',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '74%',
            right: '10%',
          },
        ],
        score: 72,
        level: 'ÉLEVÉ',
        levelColor: 'text-[#C2540A]',
        levelBg: 'bg-[#FFF7ED]',
        levelBorder: 'border-[#FED7AA]',
        summary: '3 indices de géolocalisation & horaires de travail recoupés',
      },
      {
        id: 'rabat_arch',
        name: 'Salma Alami',
        handle: '@salma_arch',
        city: 'Rabat',
        avatarBg: 'from-[#6366F1] to-[#0284C7]',
        avatarLetter: 'S',
        bio: 'Architecture & Design urbain 🌿 · Agdal · UM5',
        posts: [
          { label: 'Campus Agdal', icon: '🏛️', bg: 'bg-[#F0FDF4]' },
          { label: 'Plans studio', icon: '📐', bg: 'bg-[#F5F3FF]' },
          { label: 'Rabat Ville', icon: '🚆', bg: 'bg-[#EFF6FF]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'Quartier Agdal identifié',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '24%',
            left: '8%',
          },
          {
            icon: '🎓',
            text: 'Campus UM5 repéré',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '54%',
            right: '8%',
          },
          {
            icon: '📱',
            text: 'Coordonnées bio publiques',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '76%',
            left: '10%',
          },
        ],
        score: 64,
        level: 'MODÉRÉ',
        levelColor: 'text-[#854D0E]',
        levelBg: 'bg-[#FEFCE8]',
        levelBorder: 'border-[#FEF08A]',
        summary: 'Établissement universitaire et quartier résidentiel exposés',
      },
      {
        id: 'kech_travel',
        name: 'Karim Tazi',
        handle: '@karim_tazi',
        city: 'Marrakech',
        avatarBg: 'from-[#8B5CF6] to-[#EC4899]',
        avatarLetter: 'K',
        bio: 'Voyages & Photographie 📸 · Marrakech ✈️ Paris',
        posts: [
          { label: 'Embarquement', icon: '🎫', bg: 'bg-[#EFF6FF]' },
          { label: 'Villa Palmeraie', icon: '🌴', bg: 'bg-[#F5F3FF]' },
          { label: 'Aéroport CMN', icon: '✈️', bg: 'bg-[#EDE9FE]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'Coordonnées GPS dans photos',
            color: 'text-[#C0392B]',
            bgColor: 'bg-[#FEF2F2]',
            borderColor: 'border-[#FECACA]',
            top: '20%',
            right: '8%',
          },
          {
            icon: '✈️',
            text: 'Dates de voyage prévisibles',
            color: 'text-[#C0392B]',
            bgColor: 'bg-[#FEF2F2]',
            borderColor: 'border-[#FECACA]',
            top: '50%',
            left: '8%',
          },
          {
            icon: '🎫',
            text: 'Billet avec nom de famille',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '74%',
            right: '12%',
          },
        ],
        score: 86,
        level: 'CRITIQUE',
        levelColor: 'text-[#C0392B]',
        levelBg: 'bg-[#FEF2F2]',
        levelBorder: 'border-[#FECACA]',
        summary: 'Métadonnées GPS brutes et dates d’absence du domicile',
      },
    ],
    ar: [
      {
        id: 'casablanca_tech',
        name: 'مهدي بنجلون',
        handle: '@mehdi_b',
        city: 'الدار البيضاء',
        avatarBg: 'from-[#7C3AED] to-[#6366F1]',
        avatarLetter: 'م',
        bio: 'مسؤول تقني بمختبر CFC 🚀 · الدار البيضاء',
        posts: [
          { label: 'بطاقة العمل', icon: '🏢', bg: 'bg-[#F5F3FF]' },
          { label: 'برج CFC', icon: '🌆', bg: 'bg-[#EDE9FE]' },
          { label: 'مقهى أنفا', icon: '☕', bg: 'bg-[#EFF6FF]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'القطب المالي للدار البيضاء',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '22%',
            left: '8%',
          },
          {
            icon: '🏢',
            text: 'شارة العمل مكشوفة',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '52%',
            right: '8%',
          },
          {
            icon: '📅',
            text: 'روتين أوقات العمل مستنتج',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '74%',
            left: '10%',
          },
        ],
        score: 72,
        level: 'عالي',
        levelColor: 'text-[#C2540A]',
        levelBg: 'bg-[#FFF7ED]',
        levelBorder: 'border-[#FED7AA]',
        summary: '3 مؤشرات دقيقة لموقع العمل والمواعيد اليومية',
      },
      {
        id: 'rabat_arch',
        name: 'سلمى العلمي',
        handle: '@salma_arch',
        city: 'الرباط',
        avatarBg: 'from-[#6366F1] to-[#0284C7]',
        avatarLetter: 'س',
        bio: 'هندسة معمارية وتصميم 🌿 · أكدال · جامعة محمد الخامس',
        posts: [
          { label: 'جامعة أكدال', icon: '🏛️', bg: 'bg-[#F0FDF4]' },
          { label: 'تصاميم استوديو', icon: '📐', bg: 'bg-[#F5F3FF]' },
          { label: 'محطة الرباط', icon: '🚆', bg: 'bg-[#EFF6FF]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'حي أكدال تم تحديده',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '24%',
            right: '8%',
          },
          {
            icon: '🎓',
            text: 'الحرم الجامعي مكشوف',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '54%',
            left: '8%',
          },
          {
            icon: '📱',
            text: 'بيانات التواصل عامة',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '76%',
            right: '10%',
          },
        ],
        score: 64,
        level: 'متوسط',
        levelColor: 'text-[#854D0E]',
        levelBg: 'bg-[#FEFCE8]',
        levelBorder: 'border-[#FEF08A]',
        summary: 'المؤسسة الجامعية والحي السكني قابلان للاستغلال',
      },
      {
        id: 'kech_travel',
        name: 'كريم التازي',
        handle: '@karim_tazi',
        city: 'مراكش',
        avatarBg: 'from-[#8B5CF6] to-[#EC4899]',
        avatarLetter: 'ك',
        bio: 'سفر وتصوير فوتوغرافي 📸 · مراكش ✈️ باريس',
        posts: [
          { label: 'تذكرة سفر', icon: '🎫', bg: 'bg-[#EFF6FF]' },
          { label: 'فيلا النخيل', icon: '🌴', bg: 'bg-[#F5F3FF]' },
          { label: 'مطار كازا', icon: '✈️', bg: 'bg-[#EDE9FE]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'إحداثيات GPS دقيقة بالصور',
            color: 'text-[#C0392B]',
            bgColor: 'bg-[#FEF2F2]',
            borderColor: 'border-[#FECACA]',
            top: '20%',
            left: '8%',
          },
          {
            icon: '✈️',
            text: 'مواعيد السفر والغياب معروفة',
            color: 'text-[#C0392B]',
            bgColor: 'bg-[#FEF2F2]',
            borderColor: 'border-[#FECACA]',
            top: '50%',
            right: '8%',
          },
          {
            icon: '🎫',
            text: 'تذكرة تحمل الاسم الكامل',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '74%',
            left: '12%',
          },
        ],
        score: 86,
        level: 'حرج',
        levelColor: 'text-[#C0392B]',
        levelBg: 'bg-[#FEF2F2]',
        levelBorder: 'border-[#FECACA]',
        summary: 'بيانات GPS جغرافية خام ومواعيد خلو المنزل',
      },
    ],
    en: [
      {
        id: 'casablanca_tech',
        name: 'Mehdi Benjelloun',
        handle: '@mehdi_b',
        city: 'Casablanca',
        avatarBg: 'from-[#7C3AED] to-[#6366F1]',
        avatarLetter: 'M',
        bio: 'Tech Lead @ CFC Lab 🚀 · Casablanca · Tech & Fin',
        posts: [
          { label: 'Office Badge', icon: '🏢', bg: 'bg-[#F5F3FF]' },
          { label: 'CFC Rooftop', icon: '🌆', bg: 'bg-[#EDE9FE]' },
          { label: 'Anfa Café', icon: '☕', bg: 'bg-[#EFF6FF]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'Casablanca Finance City',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '22%',
            right: '8%',
          },
          {
            icon: '🏢',
            text: 'Company badge visible',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '52%',
            left: '8%',
          },
          {
            icon: '📅',
            text: 'Regular office hours deduced',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '74%',
            right: '10%',
          },
        ],
        score: 72,
        level: 'HIGH',
        levelColor: 'text-[#C2540A]',
        levelBg: 'bg-[#FFF7ED]',
        levelBorder: 'border-[#FED7AA]',
        summary: '3 geolocation & weekly work schedule clues correlated',
      },
      {
        id: 'rabat_arch',
        name: 'Salma Alami',
        handle: '@salma_arch',
        city: 'Rabat',
        avatarBg: 'from-[#6366F1] to-[#0284C7]',
        avatarLetter: 'S',
        bio: 'Architecture & Urban Design 🌿 · Agdal · UM5',
        posts: [
          { label: 'Agdal Campus', icon: '🏛️', bg: 'bg-[#F0FDF4]' },
          { label: 'Studio blueprints', icon: '📐', bg: 'bg-[#F5F3FF]' },
          { label: 'Rabat Station', icon: '🚆', bg: 'bg-[#EFF6FF]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'Agdal neighborhood mapped',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '24%',
            left: '8%',
          },
          {
            icon: '🎓',
            text: 'UM5 Campus identified',
            color: 'text-[#854D0E]',
            bgColor: 'bg-[#FEFCE8]',
            borderColor: 'border-[#FEF08A]',
            top: '54%',
            right: '8%',
          },
          {
            icon: '📱',
            text: 'Direct contact in bio',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '76%',
            left: '10%',
          },
        ],
        score: 64,
        level: 'MEDIUM',
        levelColor: 'text-[#854D0E]',
        levelBg: 'bg-[#FEFCE8]',
        levelBorder: 'border-[#FEF08A]',
        summary: 'Academic institution & residential area exposed',
      },
      {
        id: 'kech_travel',
        name: 'Karim Tazi',
        handle: '@karim_tazi',
        city: 'Marrakech',
        avatarBg: 'from-[#8B5CF6] to-[#EC4899]',
        avatarLetter: 'K',
        bio: 'Travel & Photography 📸 · Marrakech ✈️ Paris',
        posts: [
          { label: 'Boarding pass', icon: '🎫', bg: 'bg-[#EFF6FF]' },
          { label: 'Palmeraie villa', icon: '🌴', bg: 'bg-[#F5F3FF]' },
          { label: 'CMN Airport', icon: '✈️', bg: 'bg-[#EDE9FE]' },
        ],
        tags: [
          {
            icon: '📍',
            text: 'Exact GPS EXIF in photos',
            color: 'text-[#C0392B]',
            bgColor: 'bg-[#FEF2F2]',
            borderColor: 'border-[#FECACA]',
            top: '20%',
            right: '8%',
          },
          {
            icon: '✈️',
            text: 'Predictable flight dates',
            color: 'text-[#C0392B]',
            bgColor: 'bg-[#FEF2F2]',
            borderColor: 'border-[#FECACA]',
            top: '50%',
            left: '8%',
          },
          {
            icon: '🎫',
            text: 'Ticket with full surname',
            color: 'text-[#C2540A]',
            bgColor: 'bg-[#FFF7ED]',
            borderColor: 'border-[#FED7AA]',
            top: '74%',
            right: '12%',
          },
        ],
        score: 86,
        level: 'CRITICAL',
        levelColor: 'text-[#C0392B]',
        levelBg: 'bg-[#FEF2F2]',
        levelBorder: 'border-[#FECACA]',
        summary: 'Raw GPS coordinates & home vacancy dates weaponizable',
      },
    ],
  };

  const sampleList = samples[lang] || samples.fr;
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const currentSample = sampleList[currentSampleIndex % sampleList.length];

  // 4-Phase Animation Engine
  // Phase 1: Scanning (0-3.5s)
  // Phase 2: Findings appear (3.5-7.0s)
  // Phase 3: Score reveal & count up (7.0-10.2s)
  // Phase 4: Hold completed result (10.2-12.8s) -> next sample
  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Fast count-up when reaching Phase 3
  useEffect(() => {
    if (phase === 3) {
      setAnimatedScore(0);
      const target = currentSample.score;
      const duration = 750;
      let start: number | null = null;
      let animId: number;

      const step = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setAnimatedScore(Math.floor(ease * target));
        if (progress < 1) {
          animId = requestAnimationFrame(step);
        }
      };
      animId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animId);
    } else if (phase === 4) {
      setAnimatedScore(currentSample.score);
    }
  }, [phase, currentSample.score]);

  // Main Phase Sequencer Loop
  useEffect(() => {
    if (prefersReducedMotion) {
      setPhase(3);
      setAnimatedScore(currentSample.score);
      return;
    }

    if (isHovered) {
      return; // Paused on hover
    }

    let timeout: NodeJS.Timeout;

    if (phase === 1) {
      timeout = setTimeout(() => {
        setPhase(2);
      }, 3400);
    } else if (phase === 2) {
      timeout = setTimeout(() => {
        setPhase(3);
      }, 3600);
    } else if (phase === 3) {
      timeout = setTimeout(() => {
        setPhase(4);
      }, 3200);
    } else if (phase === 4) {
      timeout = setTimeout(() => {
        // Advance to next sample
        setCurrentSampleIndex((prev) => (prev + 1) % sampleList.length);
        setPhase(1);
      }, 2600);
    }

    return () => clearTimeout(timeout);
  }, [phase, isHovered, prefersReducedMotion, sampleList.length]);

  return (
    <div
      className="relative w-full max-w-md mx-auto group/reel flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header Eyebrow Label directly above the animated preview card */}
      <div className="mb-3 sm:mb-4 flex flex-col items-start rtl:items-start text-left rtl:text-right space-y-1 animate-in fade-in duration-500">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F5F3FF] to-[#EFF6FF] border border-[#DDD6FE] text-xs font-bold uppercase tracking-widest text-[#7C3AED] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
          <span>{t.hero.howItWorksEyebrow}</span>
        </div>
        <p className="text-xs text-[#645D73] font-normal leading-relaxed pl-1 rtl:pr-1">
          {t.hero.howItWorksSub}
        </p>
      </div>

      {/* Card Container with Physical Offset Backdrop */}
      <div className="relative w-full">
        {/* Layered physical offset card backdrop */}
        <div
          className={`absolute -inset-2 sm:-inset-2.5 bg-gradient-to-br from-[#EDE8F7] to-[#E0E7FF] rounded-3xl -rotate-1 border border-[#DDD6EE] -z-10 transition-transform duration-500 ${
            isHovered ? 'translate-x-3.5 translate-y-3.5 -rotate-2 bg-[#E9D5FF]' : 'translate-x-2.5 translate-y-2.5'
          }`}
          aria-hidden="true"
        />

        {/* Main Foreground Frame */}
        <div className="relative bg-gradient-to-br from-white via-[#FCFAFF] to-[#F7F9FF] rounded-3xl p-5 sm:p-6 border border-[#E8E2EE] shadow-[0_16px_36px_-8px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden select-none min-h-[385px] flex flex-col justify-between">
        {/* Subtle Scan Beam (Phase 1 only) */}
        {phase === 1 && !prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_14px_rgba(139,92,246,0.6)] animate-scan-sweep" />
          </div>
        )}

        {/* Top Mini Chrome: Social Card Header + Phase Dots */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EDE8F7]">
          <div className="flex items-center gap-2.5">
            {/* User Avatar */}
            <div
              className={`w-9 h-9 rounded-full bg-gradient-to-tr ${currentSample.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-2xs`}
            >
              {currentSample.avatarLetter}
            </div>
            <div className="text-left rtl:text-right">
              <div className="text-xs font-bold text-[#161824] leading-tight flex items-center gap-1">
                <span>{currentSample.name}</span>
                <span className="text-[10px] text-[#16A34A]">✓</span>
              </div>
              <div className="text-[11px] font-mono text-[#867F95]">
                {currentSample.handle} · {currentSample.city}
              </div>
            </div>
          </div>

          {/* Right Header Status / Pause indicator */}
          <div className="flex items-center gap-2">
            {isHovered ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF8FF] border border-[#DDD6EE] text-[10px] font-mono text-[#706A82] shadow-2xs">
                <Pause className="w-2.5 h-2.5 text-[#7C3AED]" />
                <span className="hidden sm:inline">Pause</span>
              </span>
            ) : (
              /* Phase indicator step pills */
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      phase === step
                        ? 'w-4 bg-gradient-to-r from-[#6366F1] to-[#7C3AED]'
                        : phase > step
                        ? 'w-1.5 bg-[#16A34A]'
                        : 'w-1.5 bg-[#DDD6EE]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card Body Area: Dynamic Content Per Phase */}
        <div className="relative py-3 flex-1 flex flex-col justify-center">
          {/* PHASE 1 & 2: Mock profile card + floating finding tags */}
          {(phase === 1 || phase === 2) && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Bio Snippet */}
              <div className="p-2.5 rounded-xl bg-white/90 border border-[#EDE8F7] text-xs text-[#575146] leading-relaxed text-left rtl:text-right">
                {currentSample.bio}
              </div>

              {/* 3 Mock Post Thumbnails */}
              <div className="grid grid-cols-3 gap-2">
                {currentSample.posts.map((post, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-xl p-2.5 ${post.bg} border border-[#DDD6EE]/60 aspect-square flex flex-col items-center justify-between text-center transition-transform ${
                      phase === 2 ? 'scale-[0.98]' : ''
                    }`}
                  >
                    <span className="text-xl">{post.icon}</span>
                    <span className="text-[10px] font-medium text-[#4A4438] leading-tight truncate w-full">
                      {post.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status Badge at bottom during Phase 1 */}
              {phase === 1 && (
                <div className="pt-2 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#F5F3FF] to-[#EFF6FF] border border-[#DDD6FE] text-[11px] font-mono font-bold text-[#7C3AED] shadow-2xs animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
                    <span>
                      {lang === 'ar'
                        ? 'فحص عصبي للبيانات وEXIF...'
                        : lang === 'en'
                        ? 'Scanning metadata & EXIF landmarks...'
                        : 'Scan neuronal des métadonnées & EXIF...'}
                    </span>
                  </div>
                </div>
              )}

              {/* PHASE 2: Staggered Floating Callout Tags popping in */}
              {phase === 2 && (
                <div className="absolute inset-0 pointer-events-none">
                  {currentSample.tags.map((tag, tIdx) => {
                    const style: React.CSSProperties = {
                      top: tag.top,
                      ...(tag.left ? { left: tag.left } : {}),
                      ...(tag.right ? { right: tag.right } : {}),
                      animationDelay: `${tIdx * 280}ms`,
                    };

                    return (
                      <div
                        key={tIdx}
                        style={style}
                        className={`absolute z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${tag.bgColor} ${tag.borderColor} border shadow-md font-sans text-[11px] font-bold ${tag.color} animate-in zoom-in-95 slide-in-from-bottom-2 duration-300`}
                      >
                        <span className="text-xs">{tag.icon}</span>
                        <span className="whitespace-nowrap">{tag.text}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PHASE 3 & 4: Consolidated Score Reveal & Defense Summary */}
          {(phase === 3 || phase === 4) && (
            <div className="space-y-4 animate-in zoom-in-95 duration-400 text-left rtl:text-right">
              {/* Score Display */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] flex items-center justify-between gap-4 shadow-inner">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#706A82]">
                    {lang === 'ar' ? 'درجة التعرض الإجمالية' : lang === 'en' ? 'Threat Score' : 'Score d’exposition'}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono text-4xl sm:text-5xl font-black text-[#161824]">
                      {animatedScore}
                    </span>
                    <span className="text-xs font-semibold text-[#867F95]">/ 100</span>
                    {(() => {
                      const tier = getSeverityFromScore(currentSample.score);
                      const sev = FIXED_SEVERITY_STYLES[tier];
                      return (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ml-1.5 rtl:mr-1.5 ${sev.badge}`}
                        >
                          {currentSample.level}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] text-[#6366F1] border border-[#DDD6FE] flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              </div>

              {/* Key finding summary */}
              {(() => {
                const tier = getSeverityFromScore(currentSample.score);
                const sev = FIXED_SEVERITY_STYLES[tier];
                return (
                  <div
                    className={`p-3 rounded-2xl border text-xs flex items-start gap-2 shadow-2xs ${sev.bg} ${sev.border} ${sev.text}`}
                  >
                    <Sparkles
                      className={`w-4 h-4 shrink-0 mt-0.5 ${sev.text}`}
                    />
                    <span className="leading-snug font-medium">
                      {currentSample.summary}
                    </span>
                  </div>
                );
              })()}

              {/* Action teaser badges */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-white border border-[#DDD6EE] text-[#2E7D4F] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {lang === 'ar' ? 'خطة تصحيح جاهزة' : lang === 'en' ? 'Fix plan ready' : 'Plan d’action prêt'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-[#DDD6EE] text-[#E07B1A] font-semibold flex items-center gap-1.5 shadow-2xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {lang === 'ar' ? 'فحص التهديدات' : lang === 'en' ? 'Threat audit' : 'Audit des menaces'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Card Footer: Phase Label + Muted Sample Switcher */}
        <div className="pt-3 border-t border-[#EDE8F7] flex items-center justify-between text-[11px] text-[#706A82]">
          <div className="flex items-center gap-1.5 font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                phase === 1
                  ? 'bg-[#7C3AED] animate-pulse'
                  : phase === 2
                  ? 'bg-[#D97706]'
                  : 'bg-[#16A34A]'
              }`}
            />
            <span className="font-semibold text-[#161824]">
              {phase === 1
                ? (lang === 'ar' ? 'المرحلة 1 : فحص الحساب' : lang === 'en' ? 'Phase 1: Scanning profile' : 'Étape 1 : Scan du profil')
                : phase === 2
                ? (lang === 'ar' ? 'المرحلة 2 : استخراج الأدلة' : lang === 'en' ? 'Phase 2: Clues detected' : 'Étape 2 : Détection des indices')
                : phase === 3
                ? (lang === 'ar' ? 'المرحلة 3 : حساب النتيجة' : lang === 'en' ? 'Phase 3: Score calculation' : 'Étape 3 : Calcul du score')
                : (lang === 'ar' ? 'المرحلة 4 : ملخص التهديد' : lang === 'en' ? 'Phase 4: Threat summary' : 'Étape 4 : Synthèse d’exposition')}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] font-mono text-[#867F95]">
            <span>{currentSampleIndex + 1} / {sampleList.length}</span>
          </div>
        </div>
      </div>
    </div>

      {/* Small Muted Static Caption Beneath */}
      <div className="pt-2 text-center">
        <p className="text-[11px] font-mono text-[#8C8474] flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8A092]" />
          <span>{t.hero.previewCaption}</span>
        </p>
      </div>
    </div>
  );
};
