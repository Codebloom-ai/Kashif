import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Eye,
  Crosshair,
  ListOrdered,
  FileText,
  RotateCcw,
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
  Info,
  UploadCloud,
  Check,
  Zap,
  Lock,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  MapPin,
  Search,
  MessageCircle,
  Tag,
  Clock,
  Archive,
  Download,
  Share2,
  Film,
  Video,
  Mic,
  Volume2,
} from 'lucide-react';
import { Language, ExposureReport, SyntheticProfile } from '../../types.ts';
import { translations } from '../../i18n.ts';
import { HeroLivePreviewReel } from './HeroLivePreviewReel.tsx';
import { SafetyTipsCarousel } from './SafetyTipsCarousel.tsx';
import {
  FIXED_SEVERITY_STYLES,
  getSeverityBadgeClass,
  getSeverityFromScore,
} from '../../utils/severityColors.ts';

interface ExposureCheckModuleProps {
  lang: Language;
  onExecutionComplete: (info: { provider: string; model: string; latency_ms: number; fallback_used?: boolean }) => void;
  onExposureDetected: (categories: string[]) => void;
  report: ExposureReport | null;
  setReport: (r: ExposureReport | null) => void;
  onSwitchToScamShield?: () => void;
}

// Client-side image resizing helper (max 1024px)
async function resizeImageClient(file: File, maxDim = 1024): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve({ base64: (reader.result as string).split(',')[1], mimeType: file.type });
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType: 'image/jpeg',
        });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Counting up number animation for trust metrics
const CountUp: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
  end,
  suffix = '',
  duration = 1000,
}) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setVal(Math.floor(ease * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration]);
  return <span>{val}{suffix}</span>;
};

export const ExposureCheckModule: React.FC<ExposureCheckModuleProps> = ({
  lang,
  onExecutionComplete,
  onExposureDetected,
  report,
  setReport,
  onSwitchToScamShield,
}) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  // Exposure Check Two Modes: 'full' (Audit complet, default/primary) vs 'quick' (Scan rapide, secondary)
  const [checkMode, setCheckMode] = useState<'full' | 'quick'>('full');

  // Step-by-step export guide platform tabs
  const [guidePlatform, setGuidePlatform] = useState<'instagram' | 'facebook' | 'tiktok'>('instagram');

  // Ownership verification states
  const [claimedEmail, setClaimedEmail] = useState('');
  const [claimedUsername, setClaimedUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStep, setVerificationStep] = useState<'initial' | 'codeSent' | 'verified'>('initial');
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  // Uploaded archive state (Mode 1 - Full Check)
  const [zipFile, setZipFile] = useState<{ file: File; name: string; sizeMb: string; base64?: string } | null>(null);

  // Uploaded images state (Mode 2 - Pre-Publish Check)
  const [images, setImages] = useState<Array<{ base64: string; mimeType: string; preview: string; name: string }>>([]);
  // Uploaded video state (Mode 2 - Pre-Publish Video)
  const [videoFile, setVideoFile] = useState<{
    file: File;
    name: string;
    sizeMb: string;
    base64: string;
    mimeType: string;
    previewUrl?: string;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Attack simulation state
  const [simulation, setSimulation] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Synthetic demo profiles
  const [demoProfiles, setDemoProfiles] = useState<SyntheticProfile[]>([]);
  const [selectedDemoProfile, setSelectedDemoProfile] = useState<SyntheticProfile | null>(null);
  const [tierFilter, setTierFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [showAllDemos, setShowAllDemos] = useState(false);

  // Interactive resolved checklist items for live simulation in results view
  const [resolvedChecklistItems, setResolvedChecklistItems] = useState<number[]>([]);

  // Load demo profiles on mount
  useEffect(() => {
    fetch('/api/synthetic/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDemoProfiles(data);
      })
      .catch((e) => console.warn('Could not load synthetic profiles:', e));
  }, []);

  // Handle ZIP file upload for Full Check
  const handleZipFile = (file: File) => {
    if (!file.name.endsWith('.zip') && !file.type.includes('zip')) {
      setErrorMessage(
        lang === 'fr'
          ? 'Veuillez sélectionner un fichier archive .zip officiel.'
          : lang === 'ar'
          ? 'يرجى اختيار ملف أرشيف رسمي بصيغة zip.'
          : 'Please select an official .zip archive file.'
      );
      return;
    }
    setErrorMessage(null);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = (reader.result as string).split(',')[1];
      setZipFile({
        file,
        name: file.name,
        sizeMb,
        base64: base64Str,
      });
      setSelectedDemoProfile(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle files selection for Pre-Publish Check (1-3 images OR 1 short video clip)
  const handlePrePublishFiles = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const incomingFiles = Array.from(fileList);
    // Check if any incoming file is a video
    const vid = incomingFiles.find(
      (f) => f.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(f.name)
    );

    if (vid) {
      if (vid.size > 50 * 1024 * 1024) {
        setErrorMessage(
          lang === 'fr'
            ? 'La vidéo dépasse 50 Mo (durée max recommandée : 30 secondes).'
            : lang === 'ar'
            ? 'حجم الفيديو يتجاوز 50 ميغابايت (المدة القصوى الموصى بها: 30 ثانية).'
            : 'Video exceeds 50MB (max recommended duration: 30s).'
        );
        return;
      }

      const sizeMb = (vid.size / (1024 * 1024)).toFixed(1);
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = (reader.result as string).split(',')[1];
        setVideoFile({
          file: vid,
          name: vid.name,
          sizeMb,
          base64: base64Str,
          mimeType: vid.type || 'video/mp4',
          previewUrl: URL.createObjectURL(vid),
        });
        setImages([]);
        setSelectedDemoProfile(null);
      };
      reader.readAsDataURL(vid);
      return;
    }

    // Otherwise handle image files (1 to 3)
    setVideoFile(null);
    const newImgs: typeof images = [...images];

    for (const f of incomingFiles) {
      if (newImgs.length >= 3) break;
      if (!f.type.startsWith('image/')) continue;
      try {
        const resized = await resizeImageClient(f);
        newImgs.push({
          base64: resized.base64,
          mimeType: resized.mimeType,
          preview: `data:${resized.mimeType};base64,${resized.base64}`,
          name: f.name || `capture_${newImgs.length + 1}.jpg`,
        });
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }

    setImages(newImgs.slice(0, 3));
    setSelectedDemoProfile(null);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
  };

  // Ownership: request code
  const handleRequestCode = async () => {
    if (!claimedEmail || !claimedUsername) {
      setErrorMessage(
        lang === 'fr'
          ? 'Veuillez renseigner votre email et nom d’utilisateur.'
          : lang === 'ar'
          ? 'يرجى إدخال بريدك الإلكتروني واسم المستخدم.'
          : 'Please provide both your email and claimed username.'
      );
      return;
    }
    setErrorMessage(null);
    try {
      const res = await fetch('/api/exposure/verify-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: claimedEmail, username: claimedUsername, isDemo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVerificationStep('codeSent');
      if (data.demoCode) {
        setVerificationCode(data.demoCode);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error requesting verification OTP.');
    }
  };

  // Ownership: verify code
  const handleConfirmCode = async () => {
    if (!verificationCode) return;
    setErrorMessage(null);
    try {
      const res = await fetch('/api/exposure/verify-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: claimedEmail,
          username: claimedUsername,
          code: verificationCode,
          isDemo: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setVerifiedToken(data.verifiedToken);
      setVerificationStep('verified');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code.');
    }
  };

  // Run Full Check (.zip archive or simulated export)
  // Reset simulation when running new analysis
  const handleRunFullCheck = async () => {
    if (!zipFile?.base64 && !selectedDemoProfile?.simulated_export) {
      setErrorMessage(
        lang === 'fr'
          ? 'Veuillez déposer une archive .zip ou charger un profil marocain de démonstration.'
          : lang === 'ar'
          ? 'يرجى إيداع ملف أرشيف zip. أو تحميل ملف تجريبي مغربي.'
          : 'Please drop a .zip archive or select a synthetic demo profile.'
      );
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setSimulation(null);
    setStatusMessage(t.fullDropzone.scanning);

    try {
      const payload: any = {
        claimedUsername,
        verifiedToken,
        userLanguage: lang,
      };

      if (zipFile?.base64) {
        payload.zipBase64 = zipFile.base64;
      } else if (selectedDemoProfile?.simulated_export) {
        payload.simulatedExport = selectedDemoProfile.simulated_export;
      }

      const res = await fetch('/api/exposure/analyze-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to complete export audit.');
      }

      const reportData: ExposureReport = await res.json();
      setReport(reportData);
      setResolvedChecklistItems([]);

      const categories = reportData.findings.map((f) => f.category);
      onExposureDetected(Array.from(new Set(categories)));

      onExecutionComplete({
        provider: reportData.provider_used,
        model: reportData.model_used,
        latency_ms: reportData.total_latency_ms,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during archive analysis.');
    } finally {
      setIsScanning(false);
      setStatusMessage('');
    }
  };

  // Run Pre-Publish Check (1-3 images OR 1 short video clip)
  const handleRunQuickScan = async () => {
    if (!videoFile && images.length === 0) {
      setErrorMessage(
        lang === 'fr'
          ? 'Veuillez déposer une capture (1-3 images) ou une courte vidéo avant publication.'
          : lang === 'ar'
          ? 'يرجى وضع صورة (1-3 لقطات) أو مقطع فيديو قصير قبل النشر.'
          : 'Please upload an image (1-3 screenshots) or a short video clip before posting.'
      );
      return;
    }

    setIsScanning(true);
    setErrorMessage(null);
    setSimulation(null);

    // Case 1: Video File uploaded
    if (videoFile) {
      setStatusMessage(t.quickDropzone.extractingFrames);

      const timer1 = setTimeout(() => {
        setStatusMessage(t.quickDropzone.transcribingAudio);
      }, 1200);

      const timer2 = setTimeout(() => {
        setStatusMessage(t.quickDropzone.analyzingContent);
      }, 2800);

      try {
        const res = await fetch('/api/exposure/analyze-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoBase64: videoFile.base64,
            mimeType: videoFile.mimeType,
            claimedUsername,
            verifiedToken,
            isPrePublish: true,
            userLanguage: lang,
          }),
        });

        clearTimeout(timer1);
        clearTimeout(timer2);

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || (lang === 'fr' ? 'Erreur lors du traitement de la vidéo.' : lang === 'ar' ? 'خطأ أثناء معالجة مقطع الفيديو.' : 'Error during video processing.'));
        }

        const reportData: ExposureReport = await res.json();
        setReport(reportData);
        setResolvedChecklistItems([]);

        const categories = reportData.findings.map((f) => f.category);
        onExposureDetected(Array.from(new Set(categories)));

        onExecutionComplete({
          provider: reportData.provider_used,
          model: reportData.model_used,
          latency_ms: reportData.total_latency_ms,
        });
      } catch (err: any) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        setErrorMessage(err.message || (lang === 'fr' ? 'Erreur lors de l’analyse vidéo.' : lang === 'ar' ? 'خطأ أثناء تحليل الفيديو.' : 'Error during video analysis.'));
      } finally {
        setIsScanning(false);
        setStatusMessage('');
      }
      return;
    }

    // Case 2: Images uploaded
    setStatusMessage(t.quickDropzone.scanning);

    try {
      const res = await fetch('/api/exposure/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img) => ({ base64: img.base64, mimeType: img.mimeType })),
          claimedUsername,
          verifiedToken,
          isPrePublish: true,
          userLanguage: lang,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to complete quick scan.');
      }

      const reportData: ExposureReport = await res.json();
      setReport(reportData);
      setResolvedChecklistItems([]);

      const categories = reportData.findings.map((f) => f.category);
      onExposureDetected(Array.from(new Set(categories)));

      onExecutionComplete({
        provider: reportData.provider_used,
        model: reportData.model_used,
        latency_ms: reportData.total_latency_ms,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during quick scan.');
    } finally {
      setIsScanning(false);
      setStatusMessage('');
    }
  };

  // Run Defensive Attack Simulation
  const handleRunSimulation = async () => {
    if (!report) return;
    setIsSimulating(true);
    try {
      const res = await fetch('/api/exposure/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, userLanguage: lang }),
      });
      const simData = await res.json();
      if (!res.ok) throw new Error(simData.error);
      setSimulation(simData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Load a synthetic Moroccan demo profile
  const handleLoadDemoProfile = (p: SyntheticProfile) => {
    setSelectedDemoProfile(p);
    setClaimedUsername(p.username);
    setClaimedEmail(`${p.username}@demo.ma`);
    setVerificationStep('verified');
    setVideoFile(null);

    if (checkMode === 'full') {
      setZipFile({
        file: new File([], `${p.username}_instagram_export.zip`),
        name: `${p.username}_instagram_export.zip`,
        sizeMb: '42.8',
      });
    } else {
      const svgCard = `data:image/svg+xml;utf8,${encodeURIComponent(p.profileCardSvg)}`;
      const postSvgs = p.posts.map((post) => ({
        base64: btoa(unescape(encodeURIComponent(post.image_svg))),
        mimeType: 'image/svg+xml',
        preview: `data:image/svg+xml;utf8,${encodeURIComponent(post.image_svg)}`,
        name: `${post.id}.svg`,
      }));

      setImages([
        {
          base64: btoa(unescape(encodeURIComponent(p.profileCardSvg))),
          mimeType: 'image/svg+xml',
          preview: svgCard,
          name: 'profile_card.svg',
        },
        ...postSvgs,
      ]);
    }
  };

  // If the user switches languages while a report is currently displayed, re-run analysis in the new language
  const prevLangRef = useRef<Language>(lang);
  useEffect(() => {
    if (prevLangRef.current !== lang) {
      prevLangRef.current = lang;
      if (report && !isScanning) {
        if (checkMode === 'full' && (zipFile?.base64 || selectedDemoProfile?.simulated_export)) {
          handleRunFullCheck();
        } else if (checkMode === 'quick' && (videoFile || images.length > 0)) {
          handleRunQuickScan();
        }
      }
    }
  }, [lang, report, isScanning, checkMode, zipFile, selectedDemoProfile, videoFile, images]);

  // Calculate dynamic simulated score when user checks off items in the checklist
  const computedScore = report
    ? Math.max(0, report.score - resolvedChecklistItems.length * 15)
    : 0;

  return (
    <div className="w-full space-y-12">
      {/* 1. RESTORED BIG HERO SECTION WITH LIVE AUTO-PLAYING PREVIEW REEL */}
      {!report && (
        <section className="relative text-left rtl:text-right pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column (7 cols): Eyebrow, Asymmetric Headline, Subtext, Trust Strip, and Switch Card */}
            <div className="lg:col-span-7 space-y-6">
              {/* Eyebrow Label */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F5F3FF] to-[#EFF6FF] border border-[#DDD6FE] text-xs font-bold uppercase tracking-widest text-[#7C3AED] shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
                <span>{t.hero.eyebrow}</span>
              </div>

              {/* Large Dynamic Headline with Accent Keyword */}
              <h1 className="font-serif-headline text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-normal text-[#161824] tracking-tight leading-[1.12]">
                {t.hero.headlinePrefix}{' '}
                <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0284C7] bg-clip-text text-transparent italic font-serif font-semibold">
                  {t.hero.headlineAccent}
                </span>{' '}
                {t.hero.headlineSuffix}
              </h1>

              {/* Subtext explaining 1-3 screenshots or official data export */}
              <p className="text-base sm:text-lg text-[#645D73] font-normal leading-relaxed max-w-2xl">
                {t.hero.subheadline}
              </p>

              {/* Live Trust Metrics Strip with Animated Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#E8E2EE] max-w-2xl">
                <div className="space-y-1">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-[#161824]">
                    <CountUp end={15} suffix="+" />
                  </div>
                  <div className="text-xs text-[#706A82] font-medium leading-tight">
                    {t.hero.stat1Label}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-[#16A34A]">
                    <CountUp end={100} suffix="%" />
                  </div>
                  <div className="text-xs text-[#706A82] font-medium leading-tight">
                    {t.hero.stat2Label}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-2xl sm:text-3xl font-black text-[#7C3AED]">
                    <CountUp end={0} suffix="" />
                  </div>
                  <div className="text-xs text-[#706A82] font-medium leading-tight">
                    {t.hero.stat3Label}
                  </div>
                </div>
              </div>

              {/* Scam Shield Switch Prompt Card */}
              {onSwitchToScamShield && (
                <div
                  onClick={onSwitchToScamShield}
                  className="group p-4 rounded-3xl bg-white/90 border border-[#E8E2EE] hover:border-[#A78BFA] transition-all cursor-pointer shadow-2xs hover:shadow-[0_8px_24px_-6px_rgba(124,58,237,0.12)] flex items-center justify-between gap-4 max-w-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] text-[#6366F1] border border-[#DDD6FE] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-[#161824] group-hover:text-[#7C3AED] transition-colors">
                        {t.hero.scamShieldSwitchPrompt}
                      </div>
                      <div className="text-xs text-[#706A82]">
                        {t.hero.scamShieldSwitchSub}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#8E869E] group-hover:text-[#7C3AED] transition-transform shrink-0 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                </div>
              )}
            </div>

            {/* Right Column (5 cols): The Live Auto-Playing Preview Reel */}
            <div className="lg:col-span-5 flex justify-center items-center">
              <HeroLivePreviewReel lang={lang} />
            </div>
          </div>
        </section>
      )}

      {/* TIPS & AWARENESS SECTION DIRECTLY BELOW HERO */}
      {!report && (
        <SafetyTipsCarousel lang={lang} />
      )}

      {/* 2. MODE TOGGLE (AUDIT COMPLET VS VÉRIFIER AVANT DE PUBLIER) */}
      {!report && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-[#EDE8F7]/70 rounded-3xl border border-[#DDD6EE] shadow-2xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Mode 1: Audit complet (Default / Primary) */}
              <button
                onClick={() => {
                  setCheckMode('full');
                  setErrorMessage(null);
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  checkMode === 'full'
                    ? 'bg-[#181829] text-white shadow-md'
                    : 'text-[#645D73] hover:text-[#161824] hover:bg-white/60'
                }`}
              >
                <Archive className={`w-4 h-4 ${checkMode === 'full' ? 'text-[#A78BFA]' : ''}`} />
                <span>{t.modes.fullTab}</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-[#6366F1] to-[#7C3AED] text-white font-extrabold shadow-2xs">
                  {t.modes.fullBadge}
                </span>
              </button>

              {/* Mode 2: Scan rapide (Secondary) */}
              <button
                onClick={() => {
                  setCheckMode('quick');
                  setErrorMessage(null);
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  checkMode === 'quick'
                    ? 'bg-[#181829] text-white shadow-md'
                    : 'text-[#645D73] hover:text-[#161824] hover:bg-white/60'
                }`}
              >
                <Camera className={`w-4 h-4 ${checkMode === 'quick' ? 'text-[#38BDF8]' : 'text-[#0284C7]'}`} />
                <span>{t.modes.quickTab}</span>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#E0E7FF] text-[#4338CA] font-medium hidden md:inline">
                  {t.modes.quickBadge}
                </span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs text-[#706A82] px-3 font-medium">
              <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>{t.modes.trustNotice}</span>
            </div>
          </div>

          {/* Active Mode Banner & Drop Zone Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left explainer text (7 cols) */}
            <div className="lg:col-span-7 text-left rtl:text-right space-y-4">
              <h2 className="font-serif-headline text-2xl sm:text-3xl font-normal text-[#161824] leading-snug">
                {checkMode === 'full' ? t.modes.fullHeroTitle : t.modes.quickHeroTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#645D73] leading-relaxed">
                {checkMode === 'full' ? t.modes.fullHeroSub : t.modes.quickHeroSub}
              </p>
            </div>

            {/* Right Drop Zone with Physical Layered Depth (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div
                className={`absolute -inset-2 bg-gradient-to-br from-[#EDE8F7] to-[#E0E7FF] rounded-3xl -rotate-1 border border-[#DDD6EE] -z-10 transition-all duration-300 ${
                  isDragging ? 'translate-x-4 translate-y-4 -rotate-2 bg-[#E9D5FF]' : 'translate-x-2.5 translate-y-2.5'
                }`}
                aria-hidden="true"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (checkMode === 'full') {
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleZipFile(e.dataTransfer.files[0]);
                    }
                  } else {
                    handlePrePublishFiles(e.dataTransfer.files);
                  }
                }}
                className={`relative bg-gradient-to-br from-white via-[#FCFAFF] to-[#F7F9FF] rounded-3xl p-6 sm:p-7 border-2 transition-all duration-300 shadow-[0_16px_36px_-8px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.02)] ${
                  isDragging
                    ? 'border-[#7C3AED] rotate-1 scale-[1.01]'
                    : 'border-[#E4E0F4] hover:border-[#8B5CF6]/70'
                }`}
              >
                {checkMode === 'full' ? (
                  /* Full Check ZIP Drop Zone */
                  <div className="space-y-4">
                    {!zipFile ? (
                      <div
                        onClick={() => document.getElementById('fullZipFileInput')?.click()}
                        className="cursor-pointer group space-y-4 text-center"
                      >
                        <input
                          id="fullZipFileInput"
                          type="file"
                          accept=".zip,application/zip"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleZipFile(e.target.files[0]);
                            }
                          }}
                        />

                        <div className="relative mx-auto w-48 h-36 bg-[#FAF8FF] rounded-2xl border border-[#DDD6EE] p-4 overflow-hidden shadow-inner flex flex-col justify-between group-hover:border-[#8B5CF6]/50 transition-colors">
                          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent animate-scan-subtle pointer-events-none" />

                          <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] text-[#6366F1] border border-[#DDD6FE] flex items-center justify-center font-bold shadow-2xs">
                              <Archive className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-mono uppercase font-bold text-[#6D657E] bg-white px-2 py-0.5 rounded-full border border-[#DDD6EE]">
                              {t.fullDropzone.badge}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-left rtl:text-right pt-2">
                            <div className="h-2 w-32 bg-[#DDD6FE]/60 rounded-full" />
                            <div className="h-1.5 w-24 bg-[#E0E7FF] rounded-full" />
                            <div className="h-1.5 w-20 bg-[#EDE9FE] rounded-full" />
                          </div>

                          <div className="text-[10px] font-mono text-center text-[#16A34A] font-bold">
                            <span>✓ {t.fullDropzone.processingNote}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="font-serif-headline text-lg sm:text-xl font-bold text-[#161824] group-hover:text-[#7C3AED] transition-colors flex items-center justify-center gap-2">
                            <span>{t.fullDropzone.title}</span>
                            <UploadCloud className="w-5 h-5 text-[#7C3AED]" />
                          </div>
                          <p className="text-xs text-[#645D73] max-w-xs mx-auto leading-relaxed">
                            {t.fullDropzone.subtitle}
                          </p>
                          <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-mono text-[#867F95]">
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E2EE]">
                              {t.fullDropzone.badge}
                            </span>
                            <span>{t.fullDropzone.processingNote}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ZIP File Ready State */
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center font-bold shadow-2xs">
                              <Archive className="w-5 h-5" />
                            </div>
                            <div className="text-left rtl:text-right">
                              <div className="text-xs font-bold text-[#161824] truncate max-w-[200px]">
                                {zipFile.name}
                              </div>
                              <div className="text-[11px] text-[#15803D]">
                                {t.fullDropzone.sizeLabel} : {zipFile.sizeMb} Mo · {t.fullDropzone.readyForAnalysis}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setZipFile(null)}
                            className="text-xs text-[#7C3AED] hover:underline font-bold"
                          >
                            {t.fullDropzone.changeFile}
                          </button>
                        </div>

                        <button
                          onClick={handleRunFullCheck}
                          disabled={isScanning}
                          className={`w-full py-4 px-6 rounded-full font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.25)] ${
                            isScanning
                              ? 'bg-[#A8A29E] cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#2563EB] hover:scale-[1.01]'
                          }`}
                        >
                          {isScanning ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{statusMessage || t.fullDropzone.scanning}</span>
                            </>
                          ) : (
                            <>
                              <span>{t.fullDropzone.startBtn}</span>
                              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Pre-Publish Check Drop Zone (Accepts Images and Video) */
                  <div className="space-y-4">
                    {/* Hidden unified file input */}
                    <input
                      id="prePublishFileInput"
                      type="file"
                      multiple
                      accept="image/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                      className="hidden"
                      onChange={(e) => handlePrePublishFiles(e.target.files)}
                    />

                    {/* Case 1: Video File Loaded */}
                    {videoFile ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#161824] flex items-center gap-1.5">
                            <Film className="w-4 h-4 text-[#7C3AED]" />
                            <span>{t.quickDropzone.videoLoaded}</span>
                          </span>
                          <button
                            onClick={handleRemoveVideo}
                            className="text-[11px] font-bold text-[#7C3AED] hover:underline"
                          >
                            {t.quickDropzone.addReplace}
                          </button>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-2.5">
                          {videoFile.previewUrl && (
                            <div className="rounded-xl overflow-hidden bg-black/90 max-h-48 flex items-center justify-center">
                              <video
                                src={videoFile.previewUrl}
                                controls
                                preload="metadata"
                                className="w-full max-h-48 object-contain"
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs pt-1">
                            <div className="truncate max-w-[220px] font-semibold text-[#161824]">
                              {videoFile.name}
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#DDD6EE] text-[#6D657E]">
                              {videoFile.sizeMb} Mo
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6D657E] leading-relaxed">
                            {t.quickDropzone.videoLimitNote}
                          </p>
                        </div>

                        <button
                          onClick={handleRunQuickScan}
                          disabled={isScanning}
                          className={`w-full py-4 px-6 rounded-full font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.25)] ${
                            isScanning
                              ? 'bg-[#A8A29E] cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#2563EB] hover:scale-[1.01]'
                          }`}
                        >
                          {isScanning ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{statusMessage || t.quickDropzone.scanning}</span>
                            </>
                          ) : (
                            <>
                              <span>{t.quickDropzone.startBtn}</span>
                              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </button>
                      </div>
                    ) : images.length > 0 ? (
                      /* Case 2: Images Loaded */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#161824] flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-[#0284C7]" />
                            <span>{t.quickDropzone.readyCount} ({images.length} / 3)</span>
                          </span>
                          <button
                            onClick={() => document.getElementById('prePublishFileInput')?.click()}
                            className="text-[11px] font-bold text-[#7C3AED] hover:underline"
                          >
                            {t.quickDropzone.addReplace}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          {images.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group/thumb rounded-xl overflow-hidden border border-[#DDD6EE] bg-[#FAF8FF] aspect-square flex flex-col items-center justify-center p-1"
                            >
                              <img
                                src={img.preview}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <button
                                onClick={() => handleRemoveImage(idx)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#181829]/80 hover:bg-[#7C3AED] text-white text-[10px] flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                title={lang === 'ar' ? 'حذف' : lang === 'en' ? 'Remove' : 'Supprimer'}
                              >
                                ✕
                              </button>
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-[#181829]/75 text-white text-[9px] font-mono">
                                #{idx + 1}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={handleRunQuickScan}
                          disabled={isScanning}
                          className={`w-full py-4 px-6 rounded-full font-bold text-sm text-white transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(99,102,241,0.25)] ${
                            isScanning
                              ? 'bg-[#A8A29E] cursor-not-allowed'
                              : 'bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#2563EB] hover:scale-[1.01]'
                          }`}
                        >
                          {isScanning ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>{statusMessage || t.quickDropzone.scanning}</span>
                            </>
                          ) : (
                            <>
                              <span>{t.quickDropzone.startBtn}</span>
                              <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* Case 3: Empty State Dropzone */
                      <div
                        onClick={() => document.getElementById('prePublishFileInput')?.click()}
                        className="cursor-pointer group space-y-4 text-center"
                      >
                        <div className="relative mx-auto w-52 h-36 bg-[#FAF8FF] rounded-2xl border border-[#DDD6EE] p-3 overflow-hidden shadow-inner flex flex-col justify-between group-hover:border-[#8B5CF6]/50 transition-colors">
                          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent animate-scan-subtle pointer-events-none" />

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-7 h-7 rounded-xl bg-[#EFF6FF] text-[#0284C7] border border-[#BFDBFE] flex items-center justify-center shadow-2xs">
                                <Camera className="w-3.5 h-3.5" />
                              </div>
                              <div className="w-7 h-7 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shadow-2xs">
                                <Film className="w-3.5 h-3.5" />
                              </div>
                            </div>
                            <span className="text-[9px] font-mono uppercase font-bold text-[#6D657E] bg-white px-2 py-0.5 rounded-full border border-[#DDD6EE]">
                              {lang === 'fr' ? 'Avant Publication' : lang === 'ar' ? 'قبل النشر' : 'Pre-Publish'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 pt-1">
                            <div className="h-10 rounded-xl bg-white/80 border border-[#DDD6EE] flex items-center justify-center text-[10px] text-[#706A82]">
                              📸 #1
                            </div>
                            <div className="h-10 rounded-xl bg-white/80 border border-[#DDD6EE] flex items-center justify-center text-[10px] text-[#706A82]">
                              📸 #2
                            </div>
                            <div className="h-10 rounded-xl bg-gradient-to-br from-[#F5F3FF] to-[#EFF6FF] border border-[#DDD6FE] flex items-center justify-center text-[10px] text-[#7C3AED] font-semibold">
                              🎬 Vidéo
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-center text-[#706A82] flex items-center justify-center gap-1.5">
                            <Zap className="w-3 h-3 text-[#7C3AED]" />
                            <span>{t.quickDropzone.badge}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="font-serif-headline text-lg sm:text-xl font-bold text-[#161824] group-hover:text-[#7C3AED] transition-colors flex items-center justify-center gap-2">
                            <span>{t.quickDropzone.title}</span>
                            <UploadCloud className="w-5 h-5 text-[#7C3AED]" />
                          </div>
                          <p className="text-xs text-[#645D73] max-w-xs mx-auto leading-relaxed">
                            {t.quickDropzone.subtitle}
                          </p>
                          <div className="pt-1 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono text-[#867F95]">
                            <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E2EE]">
                              {t.quickDropzone.badge}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED]">
                              {t.quickDropzone.videoBadge}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. STATIC STEP-BY-STEP EXPORT GUIDE WITH EXACT MENU PATHS */}
      {!report && checkMode === 'full' && (
        <section className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-[#E8E2EE] shadow-2xs space-y-5 text-left rtl:text-right">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#161824] flex items-center gap-2">
                <Download className="w-4 h-4 text-[#7C3AED]" />
                <span>{t.exportGuide.title}</span>
              </h3>
              <p className="text-xs text-[#706A82] mt-0.5">
                {t.exportGuide.subtitle}
              </p>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex items-center p-1 bg-[#EDE8F7]/80 rounded-2xl border border-[#DDD6EE] text-xs font-semibold">
              <button
                onClick={() => setGuidePlatform('instagram')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  guidePlatform === 'instagram' ? 'bg-[#181829] text-white shadow-2xs' : 'text-[#645D73] hover:text-[#161824]'
                }`}
              >
                {t.exportGuide.tabs.instagram}
              </button>
              <button
                onClick={() => setGuidePlatform('facebook')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  guidePlatform === 'facebook' ? 'bg-[#181829] text-white shadow-2xs' : 'text-[#645D73] hover:text-[#161824]'
                }`}
              >
                {t.exportGuide.tabs.facebook}
              </button>
              <button
                onClick={() => setGuidePlatform('tiktok')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  guidePlatform === 'tiktok' ? 'bg-[#16181D] text-white shadow-xs' : 'text-[#706A5F] hover:text-[#16181D]'
                }`}
              >
                {t.exportGuide.tabs.tiktok}
              </button>
            </div>
          </div>

          {/* Guide Path Details */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-3 font-mono text-xs">
            {guidePlatform === 'instagram' && (
              <div className="space-y-2 text-[#2C2A36]">
                <div className="text-[#7C3AED] font-bold font-sans">
                  {t.exportGuide.instagramLabel}
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#DDD6EE] leading-relaxed shadow-2xs">
                  {t.exportGuide.instagramPath}
                </div>
                <p className="text-[11px] text-[#706A82] font-sans">
                  {t.exportGuide.instagramNote}
                </p>
              </div>
            )}

            {guidePlatform === 'facebook' && (
              <div className="space-y-2 text-[#2C2A24]">
                <div className="text-[#2F7D5B] font-bold font-sans">
                  {t.exportGuide.facebookLabel}
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5E0D6] leading-relaxed">
                  {t.exportGuide.facebookPath}
                </div>
                <p className="text-[11px] text-[#706A5F] font-sans">
                  {t.exportGuide.facebookNote}
                </p>
              </div>
            )}

            {guidePlatform === 'tiktok' && (
              <div className="space-y-2 text-[#2C2A24]">
                <div className="text-[#C98A1B] font-bold font-sans">
                  {t.exportGuide.tiktokLabel}
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E5E0D6] leading-relaxed">
                  {t.exportGuide.tiktokPath}
                </div>
                <p className="text-[11px] text-[#706A5F] font-sans">
                  {t.exportGuide.tiktokNote}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. SYNTHETIC DEMO PROFILES SECTION */}
      {!report && (
        <section className="space-y-4 text-left rtl:text-right">
          {/* User-appropriate single callout line (No dev/hackathon words) */}
          <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-[#F5F3FF] via-[#EEF2FF] to-[#F0F9FF] border border-[#DDD6FE] flex items-center gap-3 text-xs sm:text-sm text-[#4338CA] shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#7C3AED] shrink-0" />
            <p className="font-medium">
              {t.demoProfiles.callout}
            </p>
          </div>

          {/* Procedural Moroccan Demo Profiles Showcase */}
          <div className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-[#E8E2EE] shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824]">
                  {t.demoProfiles.title}{' '}
                  <span className="text-[#706A82] font-normal">
                    {checkMode === 'full' ? t.demoProfiles.fullModeSub : t.demoProfiles.quickModeSub}
                  </span>
                </h3>
              </div>

              {/* Severity Tier Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EDE8F7]/80 rounded-2xl border border-[#DDD6EE] text-[11px] font-semibold">
                <button
                  onClick={() => setTierFilter('all')}
                  className={`px-2.5 py-1 rounded-xl transition-all ${
                    tierFilter === 'all'
                      ? 'bg-[#181829] text-white shadow-2xs'
                      : 'text-[#645D73] hover:text-[#161824]'
                  }`}
                >
                  {lang === 'fr' ? 'Tous' : lang === 'ar' ? 'الكل' : 'All'} ({demoProfiles.length})
                </button>
                <button
                  onClick={() => setTierFilter('critical')}
                  className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                    tierFilter === 'critical'
                      ? FIXED_SEVERITY_STYLES.critical.badgeSolid
                      : `text-[#645D73] ${FIXED_SEVERITY_STYLES.critical.hoverText}`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${FIXED_SEVERITY_STYLES.critical.dot} inline-block`} />
                  <span>{t.demoProfiles.tiers.critical}</span>
                </button>
                <button
                  onClick={() => setTierFilter('high')}
                  className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                    tierFilter === 'high'
                      ? FIXED_SEVERITY_STYLES.high.badgeSolid
                      : `text-[#645D73] ${FIXED_SEVERITY_STYLES.high.hoverText}`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${FIXED_SEVERITY_STYLES.high.dot} inline-block`} />
                  <span>{t.demoProfiles.tiers.high}</span>
                </button>
                <button
                  onClick={() => setTierFilter('medium')}
                  className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                    tierFilter === 'medium'
                      ? FIXED_SEVERITY_STYLES.medium.badgeSolid
                      : `text-[#645D73] ${FIXED_SEVERITY_STYLES.medium.hoverText}`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${FIXED_SEVERITY_STYLES.medium.dot} inline-block`} />
                  <span>{t.demoProfiles.tiers.medium}</span>
                </button>
                <button
                  onClick={() => setTierFilter('low')}
                  className={`px-2.5 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                    tierFilter === 'low'
                      ? FIXED_SEVERITY_STYLES.low.badgeSolid
                      : `text-[#645D73] ${FIXED_SEVERITY_STYLES.low.hoverText}`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${FIXED_SEVERITY_STYLES.low.dot} inline-block`} />
                  <span>{t.demoProfiles.tiers.low}</span>
                </button>
              </div>
            </div>

            {/* Profiles Grid */}
            {(() => {
              const filtered = tierFilter === 'all'
                ? demoProfiles
                : demoProfiles.filter((p) => p.severity === tierFilter);
              const toShow = showAllDemos || tierFilter !== 'all' ? filtered : filtered.slice(0, 6);

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {toShow.map((p) => {
                      const isSelected = selectedDemoProfile?.id === p.id;
                      const sevStyle = FIXED_SEVERITY_STYLES[p.severity || 'low'];
                      const tierColor = sevStyle.badge;

                      const tierName =
                        p.severity === 'critical'
                          ? t.demoProfiles.tiers.critical
                          : p.severity === 'high'
                          ? t.demoProfiles.tiers.high
                          : p.severity === 'medium'
                          ? t.demoProfiles.tiers.medium
                          : t.demoProfiles.tiers.low;

                      return (
                        <button
                          key={p.id}
                          onClick={() => handleLoadDemoProfile(p)}
                          className={`text-left rtl:text-right p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? `${sevStyle.border} ${sevStyle.bg} shadow-2xs ${sevStyle.ring}`
                              : 'border-[#E8E2EE] bg-[#FAF8FF] hover:border-[#8B5CF6]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-[#161824] truncate">
                              {p.name}
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${tierColor}`}>
                              {tierName}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#706A82] truncate">
                            {p.city} · @{p.username}
                          </p>
                          <div className="mt-2 text-[10px] text-[#16A34A] font-semibold flex items-center gap-1">
                            <span>✓ {checkMode === 'full' ? t.demoProfiles.readyFull : t.demoProfiles.readyQuick}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {tierFilter === 'all' && filtered.length > 6 && (
                    <div className="flex justify-center pt-1">
                      <button
                        onClick={() => setShowAllDemos(!showAllDemos)}
                        className="text-xs text-[#706A82] hover:text-[#161824] font-bold px-3.5 py-1.5 rounded-xl border border-[#DDD6EE] bg-[#FAF8FF] hover:bg-[#EDE8F7] transition-all"
                      >
                        {showAllDemos
                          ? (lang === 'fr' ? 'Afficher moins' : lang === 'ar' ? 'عرض أقل' : 'Show less')
                          : (lang === 'fr' ? `Afficher tous les profils (${filtered.length})` : lang === 'ar' ? `عرض كل الملفات (${filtered.length})` : `Show all ${filtered.length} profiles`)}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Quick launch button if synthetic profile is chosen */}
            {selectedDemoProfile && (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E8E2EE]">
                <span className="text-xs text-[#645D73]">
                  {t.demoProfiles.selectedLabel} <strong>{selectedDemoProfile.name}</strong> (@{selectedDemoProfile.username})
                </span>
                <button
                  onClick={checkMode === 'full' ? handleRunFullCheck : handleRunQuickScan}
                  disabled={isScanning}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-full font-bold text-xs bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#2563EB] text-white transition-all shadow-[0_4px_16px_rgba(99,102,241,0.25)] flex items-center justify-center gap-2"
                >
                  {isScanning ? t.fullDropzone.scanning : `${t.demoProfiles.auditAction} (${selectedDemoProfile.name})`}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 5. ANTI-MISUSE & OWNERSHIP VERIFICATION CARD (Full Audit mode only) */}
      {!report && checkMode === 'full' && (
        <section className="bg-white/95 rounded-3xl p-6 sm:p-7 border border-[#E8E2EE] shadow-2xs space-y-4 text-left rtl:text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#16A34A]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824]">
                {t.ownership.title}
              </h3>
            </div>
            {verificationStep === 'verified' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7F3ED] text-[#2F7D5B] border border-[#CDE5D8]">
                {t.ownership.verifiedBadge}
              </span>
            )}
          </div>

          <p className="text-xs text-[#706A5F] leading-relaxed">
            {t.ownership.expl}
          </p>

          {verificationStep !== 'verified' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-[#645D73] mb-1">
                  {t.ownership.usernameLabel}
                </label>
                <input
                  type="text"
                  value={claimedUsername}
                  onChange={(e) => setClaimedUsername(e.target.value)}
                  placeholder="@votre_compte"
                  className="w-full text-xs p-2.5 rounded-xl border border-[#DDD6EE] bg-[#FAF8FF] focus:bg-white focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#645D73] mb-1">
                  {t.ownership.emailLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={claimedEmail}
                    onChange={(e) => setClaimedEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="flex-1 text-xs p-2.5 rounded-xl border border-[#DDD6EE] bg-[#FAF8FF] focus:bg-white focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 outline-none transition-all"
                  />
                  <button
                    onClick={handleRequestCode}
                    className="px-3.5 py-2.5 rounded-xl bg-[#181829] hover:bg-[#2C2A40] text-white text-xs font-bold transition-all shrink-0 shadow-2xs"
                  >
                    {t.ownership.otpBtn}
                  </button>
                </div>
              </div>

              {verificationStep === 'codeSent' && (
                <div className="sm:col-span-2 pt-1 flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    className="w-28 font-mono text-center tracking-widest text-xs p-2 rounded-xl border border-[#DDD6EE] bg-white focus:border-[#7C3AED] outline-none"
                  />
                  <button
                    onClick={handleConfirmCode}
                    className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold transition-all shadow-2xs"
                  >
                    {t.ownership.verifyBtn}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#16A34A] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{t.ownership.accountValidated}</span>
              </div>
              <div className="text-[11px] text-[#15803D]">
                {t.ownership.associatedWith} <strong>@{claimedUsername || 'demo'}</strong>.
              </div>
            </div>
          )}
        </section>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs sm:text-sm text-[#E11D48] flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#E11D48]" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 6. EXPOSURE CHECK RESULTS SCREEN */}
      {report && (
        <div className="bg-white/95 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.02)] border border-[#E8E2EE] space-y-10 animate-in fade-in text-left rtl:text-right">
          {/* Top Score Reveal */}
          <div className="relative">
            <div
              className="absolute -inset-1.5 bg-gradient-to-br from-[#EDE8F7] to-[#E0E7FF] rounded-3xl -rotate-0.5 translate-x-2 translate-y-2 border border-[#DDD6EE] -z-10"
              aria-hidden="true"
            />

            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FAF8FF] via-white to-[#F5F8FF] border border-[#E8E2EE] space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-[#8A8275]">
                    {report.is_pre_publish ? t.report.prePublishScoreTitle : t.report.scoreTitle}
                  </span>
                  <div className="flex items-baseline gap-3 mt-1.5">
                    <span className="font-mono text-5xl sm:text-7xl font-black text-[#161824]">
                      {computedScore}
                    </span>
                    <span className="text-base font-semibold text-[#867F95]">
                      / 100
                    </span>
                    {(() => {
                      const tier = getSeverityFromScore(computedScore);
                      const sev = FIXED_SEVERITY_STYLES[tier];
                      const levelLabel =
                        tier === 'critical'
                          ? t.report.levelCritical
                          : tier === 'high'
                          ? t.report.levelHigh
                          : tier === 'medium'
                          ? t.report.levelMedium
                          : t.report.levelLow;
                      return (
                        <span
                          className={`ml-2 rtl:mr-2 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-2xs ${sev.badge}`}
                        >
                          {levelLabel}
                        </span>
                      );
                    })()}
                  </div>
                  {resolvedChecklistItems.length > 0 && (
                    <p className="text-xs text-[#16A34A] font-semibold mt-1">
                      {t.report.simulatedScoreNote} {resolvedChecklistItems.length} {t.report.actionsResolvedSuffix}
                    </p>
                  )}
                </div>

                <div className="text-right rtl:text-left text-xs text-[#645D73] space-y-1.5 bg-white/90 p-4 rounded-2xl border border-[#E8E2EE] shadow-2xs">
                  <div>
                    {t.report.accountLabel} <strong>@{report.claimed_username || t.report.anonymousUser}</strong>
                  </div>
                  {report.is_full_export ? (
                    <div>
                      {t.report.archiveLabel} <strong>{report.export_platform?.toUpperCase() || 'META'} .ZIP</strong>
                    </div>
                  ) : report.video_metadata ? (
                    <div>
                      {t.report.videoAnalyzedLabel}{' '}
                      <strong>{report.video_metadata.duration_sec}s ({report.video_metadata.frames_extracted} frames)</strong>
                    </div>
                  ) : (
                    <div>
                      {t.report.captionsProcessed} <strong>{report.images_analyzed}</strong>
                    </div>
                  )}
                  <div>
                    {t.report.auditLatency} <strong>{(report.total_latency_ms / 1000).toFixed(2)}s</strong>
                  </div>
                  {report.verified_via_email && (
                    <div className="text-[#16A34A] font-bold">{t.report.verifiedOwner}</div>
                  )}
                </div>
              </div>

              {/* Progress Meter with Fixed Severity Color */}
              <div className="w-full bg-[#EDE8F7] h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    FIXED_SEVERITY_STYLES[getSeverityFromScore(computedScore)].barFill
                  }`}
                  style={{ width: `${computedScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Pre-Publish Preventive Reframe Banner */}
          {report.is_pre_publish && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#F5F3FF] border border-[#FDE68A] text-xs sm:text-sm text-[#92400E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0 shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-[#161824] text-sm">
                    {t.report.prePublishTitle}
                  </div>
                  <div className="text-xs text-[#92400E] mt-0.5">
                    {t.report.prePublishSub}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-[#92400E] bg-white px-3 py-1 rounded-full border border-[#FDE68A] shrink-0 shadow-2xs">
                {t.report.preventiveAuditBadge}
              </span>
            </div>
          )}

          {/* Video Metadata & Certified Keyframe Sampling Note */}
          {report.video_metadata && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] border border-[#DDD6FE] space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#3730A3]">
                  <Film className="w-4 h-4 text-[#6366F1] shrink-0" />
                  <span>{report.video_metadata.note}</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white border border-[#DDD6FE] text-[#4F46E5] shrink-0 shadow-2xs">
                  {t.report.videoHonestyNote}
                </span>
              </div>

              {/* Audio Track Transcript */}
              {report.video_metadata.transcript && (
                <div className="p-3.5 rounded-2xl bg-white border border-[#E0E7FF] text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4F46E5]">
                    <Mic className="w-3.5 h-3.5 text-[#4F46E5]" />
                    <span>{t.report.transcriptTitle} :</span>
                  </div>
                  <p className="font-mono text-xs text-[#374151] italic leading-relaxed">
                    "{report.video_metadata.transcript}"
                  </p>
                </div>
              )}

              {/* Spoken Disclosure Risks */}
              {report.video_metadata.audio_findings && report.video_metadata.audio_findings.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-[#7C3AED] flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>{t.report.spokenRisksTitle} :</span>
                  </div>
                  <div className="space-y-1">
                    {report.video_metadata.audio_findings.map((af, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white/90 border border-[#DDD6FE] text-xs text-[#575146]">
                        {af}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dedicated "Recommandations concrètes avant publication" Section */}
          {report.pre_publish_recommendations && report.pre_publish_recommendations.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#E8E2EE]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#7C3AED]" />
                  <span>{t.report.recommendationsTitle}</span>
                </h3>
                <span className="text-xs text-[#706A82]">{t.report.recommendationsSub}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {report.pre_publish_recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-3xl bg-gradient-to-br from-white via-[#FCFAFF] to-[#F7F9FF] border border-[#E8E2EE] hover:border-[#8B5CF6]/60 transition-all space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-[#161824] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                        {rec.action}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#DDD6EE] text-[#706A82]">
                        {rec.category}
                      </span>
                    </div>
                    <div className="text-xs text-[#575146] bg-white/90 p-2.5 rounded-2xl border border-[#E8E2EE] leading-relaxed">
                      <strong className="text-[#161824]">{t.report.concreteEditLabel}</strong> {rec.concrete_edit}
                    </div>
                    <div className="text-[11px] text-[#16A34A] font-medium flex items-center gap-1">
                      <span>✓ {t.report.impactLabel}</span>
                      <span>{rec.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXIF Metadata Card */}
          <div className="p-4 rounded-3xl bg-[#FAF8FF] border border-[#DDD6EE] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#7C3AED] shrink-0" />
              <span className="text-[#575146]">
                <strong className="text-[#161824]">{t.report.exifTitle}</strong>{' '}
                {report.per_image_results[0]?.exif_data?.note || (lang === 'fr' ? 'Audit certifié en mémoire volatile conforme aux normes de protection.' : lang === 'ar' ? 'تدقيق معتمد في الذاكرة المؤقتة متوافق مع معايير حماية البيانات.' : 'Certified in-memory audit compliant with privacy protection standards.')}
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#706A82] px-2.5 py-0.5 rounded-full bg-white border border-[#DDD6EE] shrink-0 shadow-2xs">
              {t.report.gdprNotice}
            </span>
          </div>

          {/* Full Export Summary Metric Strip */}
          {report.is_full_export && report.export_summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] shadow-2xs">
                <div className="text-[11px] text-[#706A82] font-semibold">{t.report.postsFound}</div>
                <div className="font-mono text-xl font-bold text-[#161824] mt-0.5">
                  {report.export_summary.total_posts}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] shadow-2xs">
                <div className="text-[11px] text-[#706A82] font-semibold">{t.report.publicComments}</div>
                <div className="font-mono text-xl font-bold text-[#161824] mt-0.5">
                  {report.export_summary.total_comments}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] shadow-2xs">
                <div className="text-[11px] text-[#706A82] font-semibold">{t.report.savedSearches}</div>
                <div className="font-mono text-xl font-bold text-[#161824] mt-0.5">
                  {report.export_summary.total_searches}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] shadow-2xs">
                <div className="text-[11px] text-[#706A82] font-semibold">{t.report.photosAndFaces}</div>
                <div className="font-mono text-xl font-bold text-[#16A34A] mt-0.5">
                  {report.export_summary.photos_analyzed} / {report.export_summary.total_photos}
                </div>
              </div>
            </div>
          )}

          {/* Location Timeline Section (Striking finding in Full Check) */}
          {report.location_timeline && report.location_timeline.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#E8E2EE]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#7C3AED]" />
                  <span>{t.report.locationTimelineTitle}</span>
                </h3>
                <span className="text-xs text-[#706A82]">{t.report.locationTimelineSub}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.location_timeline.map((loc, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#706A82]">
                      <span className="font-mono">{loc.timestamp}</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white border border-[#DDD6EE]">
                        {loc.source}
                      </span>
                    </div>
                    <div className="font-bold text-xs text-[#161824]">{loc.name}</div>
                    {loc.lat && loc.lon && (
                      <div className="text-[10px] font-mono text-[#7C3AED]">
                        GPS : {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search History Highlights (Forgotten Searches) */}
          {report.search_history_highlights && report.search_history_highlights.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#E8E2EE]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#D97706] flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#D97706]" />
                  <span>{t.report.searchHistoryTitle}</span>
                </h3>
                <span className="text-xs text-[#706A82]">{t.report.searchHistorySub}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {report.search_history_highlights.map((s, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs font-mono text-[#92400E] shadow-2xs"
                  >
                    🔍 "{s}"
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inferred Ad Interests */}
          {report.ad_interests && report.ad_interests.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#E8E2EE]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#16A34A]" />
                  <span>{t.report.adInterestsTitle}</span>
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {report.ad_interests.map((ad, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-1 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-xs font-medium text-[#16A34A] shadow-2xs"
                  >
                    #{ad}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings Breakdown */}
          <div className="space-y-4 pt-4 border-t border-[#E8E2EE]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#161824] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#7C3AED]" />
                <span>{t.report.findingsTitle} ({report.findings.length})</span>
              </h3>
              <span className="text-xs text-[#706A82]">{t.report.weightedBySeverity}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.findings.map((f, idx) => {
                const sevLevel = f.severity || 'low';
                const sevStyle = FIXED_SEVERITY_STYLES[sevLevel] || FIXED_SEVERITY_STYLES.low;
                const sevLabel =
                  sevLevel === 'critical'
                    ? t.demoProfiles.tiers.critical
                    : sevLevel === 'high'
                    ? t.demoProfiles.tiers.high
                    : sevLevel === 'medium'
                    ? t.demoProfiles.tiers.medium
                    : t.demoProfiles.tiers.low;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-3xl bg-[#FAF8FF] border border-[#E8E2EE] hover:border-[#8B5CF6]/60 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#161824]">{f.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${sevStyle.badge}`}>
                            {sevLabel}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full border border-[#DDD6FE]">
                            +{f.weight_points} pts
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-[#575146] leading-relaxed">{f.detail}</p>
                    </div>
                    <div className="text-[10px] font-mono text-[#706A82]">
                      {t.report.sourceLabel} {f.where_seen}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attack Paths */}
          {report.attack_paths.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#E8E2EE]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C3AED] flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-[#7C3AED]" />
                  <span>{t.report.attackPathsTitle}</span>
                </h3>
                <span className="text-xs text-[#706A82]">{t.report.attackPathsSub}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.attack_paths.map((ap, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-3xl bg-gradient-to-br from-[#FAF8FF] via-white to-[#F5F3FF] border border-[#DDD6FE] space-y-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                      <span className="text-xs font-bold text-[#161824]">{ap.title}</span>
                    </div>
                    <p className="text-xs text-[#575146] leading-relaxed">{ap.description}</p>
                    {ap.exploited_clues && ap.exploited_clues.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ap.exploited_clues.map((c, cIdx) => (
                          <span
                            key={cIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#DDD6FE] text-[#7C3AED]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fix Checklist */}
          {report.fix_checklist.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-[#E8E2EE]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-[#16A34A]" />
                  <span>{t.report.fixChecklistTitle}</span>
                </h3>
                <span className="text-xs text-[#706A82]">{t.report.fixChecklistSub}</span>
              </div>

              <div className="space-y-2.5">
                {report.fix_checklist.map((item, idx) => {
                  const isChecked = resolvedChecklistItems.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setResolvedChecklistItems((prev) =>
                          isChecked ? prev.filter((i) => i !== idx) : [...prev, idx]
                        );
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 shadow-2xs ${
                        isChecked
                          ? 'bg-[#E7F3ED] border-[#A8D5BC]'
                          : 'bg-[#F0FDF4] border-[#BBF7D0] hover:border-[#16A34A]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                          isChecked ? 'bg-[#16A34A] text-white' : 'bg-white border border-[#A8D5BC] text-[#16A34A]'
                        }`}
                      >
                        {isChecked ? '✓' : item.priority}
                      </div>
                      <div className="text-xs sm:text-sm flex-1">
                        <p className={`font-bold text-[#161824] ${isChecked ? 'line-through opacity-70' : ''}`}>
                          {item.action}
                        </p>
                        <p className="text-xs text-[#15803D] mt-0.5">{item.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Defensive Spear-Phishing Attack Simulation */}
          <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-[#FAF8FF] to-[#F5F8FF] border border-[#DDD6EE] space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-[#161824] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#7C3AED]" />
                  <span>{t.report.simulationTitle}</span>
                </h4>
                <p className="text-xs text-[#706A82] mt-0.5">
                  {t.report.simulationSub}
                </p>
              </div>
              <button
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#2563EB] text-white text-xs font-bold transition-all shrink-0 shadow-2xs"
              >
                {isSimulating ? t.report.simulatingBtn : t.report.simulationBtn}
              </button>
            </div>

            {simulation && (
              <div className="p-5 rounded-2xl bg-white border border-[#DDD6FE] space-y-3.5 shadow-2xs animate-in fade-in">
                <div className="flex items-center justify-between text-xs border-b border-[#EDE8F7] pb-2">
                  <span className="font-bold text-[#7C3AED] uppercase tracking-wide flex items-center gap-1.5">
                    {t.report.simulationBadge}
                  </span>
                  <span className="font-mono text-[#706A82]">
                    {t.report.vectorLabel} {simulation.attack_vector}
                  </span>
                </div>

                <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] shadow-inner font-mono text-xs sm:text-sm text-[#161824] whitespace-pre-wrap leading-relaxed relative">
                  <div className="text-[10px] uppercase font-bold text-[#7C3AED] mb-1">
                    {t.report.senderLabel} {simulation.attacker_persona || (lang === 'fr' ? 'Inconnu' : lang === 'ar' ? 'مجهول' : 'Unknown')}
                  </div>
                  "{simulation.simulated_message}"
                </div>

                <p className="text-xs text-[#575146] italic leading-relaxed pt-1">
                  <strong>{t.report.deceptionMechanism}</strong> {simulation.defensive_explanation}
                </p>
              </div>
            )}
          </div>

          {/* Reset Action */}
          <div className="pt-4 border-t border-[#E8E2EE] flex items-center justify-between">
            <span className="text-xs text-[#867F95]">
              {t.common.aiNotice}
            </span>
            <button
              onClick={() => {
                setReport(null);
                setImages([]);
                setVideoFile(null);
                setZipFile(null);
                setSimulation(null);
                setResolvedChecklistItems([]);
              }}
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-[#181829] hover:bg-[#2C2A40] text-white transition-all flex items-center gap-2 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.report.resetBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
