import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lock,
  Database,
  Cpu,
} from 'lucide-react';
import { Language, ScamShieldResponse, RedFlag } from '../../types.ts';
import { translations } from '../../i18n.ts';

interface ScamShieldModuleProps {
  lang: Language;
  onExecutionComplete: (info: { provider: string; model: string; latency_ms: number; fallback_used?: boolean }) => void;
  personalExposureCategories?: string[];
  lastResult: ScamShieldResponse | null;
  setLastResult: (res: ScamShieldResponse | null) => void;
}

export const ScamShieldModule: React.FC<ScamShieldModuleProps> = ({
  lang,
  onExecutionComplete,
  personalExposureCategories = [],
  lastResult,
  setLastResult,
}) => {
  const t = translations[lang].scamShield;
  const common = translations[lang].common;

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTranscription, setShowTranscription] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste handler (Ctrl+V anywhere in module)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file);
            e.preventDefault();
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'ar' ? 'يرجى تحميل ملف صورة صالح (PNG, JPG, WebP).' : 'Veuillez importer une image valide (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setSelectedImage({
        base64: base64Str,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRunAnalysis = async (textToAnalyze?: string, imageToAnalyze?: any) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : inputText;
    const img = imageToAnalyze !== undefined ? imageToAnalyze : selectedImage;

    if (!text.trim() && !img) {
      setErrorMessage(lang === 'ar' ? 'يرجى إدخال نص أو لقطة شاشة للتحليل.' : 'Veuillez saisir un message ou importer une capture d’écran.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/scam-shield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          imageBase64: img?.base64,
          imageMimeType: img?.mimeType,
          personalExposureCategories,
          userLanguage: lang,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to analyze message');
      }

      const data: ScamShieldResponse = await res.json();
      setLastResult(data);
      onExecutionComplete({
        provider: data.provider_used,
        model: data.model_used,
        latency_ms: data.latency_ms,
        fallback_used: data.fallback_used,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during risk analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSample = (sampleText: string) => {
    setInputText(sampleText);
    setSelectedImage(null);
    handleRunAnalysis(sampleText, null);
  };

  const resetAnalysis = () => {
    setLastResult(null);
    setInputText('');
    setSelectedImage(null);
    setErrorMessage(null);
  };

  // Helper to render text with underlined red flags
  const renderTextWithRedFlags = (text: string, redFlags: RedFlag[]) => {
    if (!text || redFlags.length === 0) return <span>{text}</span>;

    const segments: Array<{ text: string; flag?: RedFlag }> = [];
    let currentIdx = 0;

    // Sort red flags by appearance in text
    const validFlags = redFlags
      .map((rf) => {
        const pos = text.toLowerCase().indexOf(rf.quote_from_message.toLowerCase());
        return { ...rf, pos, length: rf.quote_from_message.length };
      })
      .filter((rf) => rf.pos !== -1)
      .sort((a, b) => a.pos - b.pos);

    if (validFlags.length === 0) return <span>{text}</span>;

    for (const vf of validFlags) {
      if (vf.pos > currentIdx) {
        segments.push({ text: text.substring(currentIdx, vf.pos) });
      }
      segments.push({
        text: text.substring(vf.pos, vf.pos + vf.length),
        flag: vf,
      });
      currentIdx = vf.pos + vf.length;
    }
    if (currentIdx < text.length) {
      segments.push({ text: text.substring(currentIdx) });
    }

    return (
      <span className="leading-relaxed">
        {segments.map((seg, i) => {
          if (!seg.flag) return <span key={i}>{seg.text}</span>;
          const isTooltipOpen = activeTooltip === `rf_${i}`;
          return (
            <span
              key={i}
              className="relative inline-block cursor-help font-semibold text-[#C0392B] underline decoration-[#C0392B] decoration-2 underline-offset-4 bg-[#FEF2F2] px-1.5 py-0.5 rounded-md transition-colors hover:bg-[#FEE2E2]"
              onMouseEnter={() => setActiveTooltip(`rf_${i}`)}
              onMouseLeave={() => setActiveTooltip(null)}
              onClick={() => setActiveTooltip(isTooltipOpen ? null : `rf_${i}`)}
            >
              {seg.text}
              {isTooltipOpen && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#181829] text-white text-xs rounded-2xl shadow-xl z-30 font-normal leading-snug animate-in fade-in border border-[#DDD6FE]/20">
                  <span className="block font-bold text-[#C0392B] mb-1">🚨 Red Flag</span>
                  {seg.flag.flag}
                </span>
              )}
            </span>
          );
        })}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10">
      {/* Eyebrow and Headline */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F5F3FF] to-[#EFF6FF] border border-[#DDD6FE] text-xs font-bold uppercase tracking-widest text-[#7C3AED] shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>{t.eyebrow}</span>
        </div>
        <h1 className="font-serif-headline text-4xl sm:text-5xl md:text-6xl font-normal text-[#161824] tracking-tight leading-[1.1]">
          {t.headline}
        </h1>
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#645D73] font-normal leading-relaxed">
          {t.subheadline}
        </p>
      </div>

      {/* Main Container Card */}
      {!lastResult ? (
        <div className="bg-white/95 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.02)] border border-[#E8E2EE] space-y-8 relative overflow-hidden text-left rtl:text-right">
          {/* Hero Custom Drop Zone with Physical Layered Depth */}
          <div className="relative group">
            {/* Colored back cutout offset */}
            <div
              className={`absolute -inset-1.5 sm:-inset-2 bg-gradient-to-br from-[#EDE8F7] to-[#E0E7FF] rounded-3xl -rotate-1 border border-[#DDD6EE] -z-10 transition-all duration-300 ${
                isDragOver ? 'translate-x-3 translate-y-3 -rotate-2 bg-[#DDD6FE]' : 'translate-x-2 translate-y-2'
              }`}
              aria-hidden="true"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer border-2 rounded-3xl p-7 sm:p-10 text-center transition-all duration-300 ease-out overflow-hidden bg-white shadow-elevated ${
                isDragOver
                  ? 'border-[#7C3AED] scale-[1.01] rotate-0.5'
                  : selectedImage
                  ? 'border-[#16A34A] bg-[#F0FDF4]'
                  : 'border-[#DDD6EE] hover:border-[#7C3AED] hover:-translate-y-0.5'
              }`}
            >
              {/* Idle Faint Scan-Line Sweep Animation at rest */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#8B5CF6]/40 to-transparent animate-scan-sweep" />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />

              {/* Custom line shield/scan icon */}
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-2xs ${
                    selectedImage
                      ? 'bg-[#DCFCE7] text-[#16A34A]'
                      : 'bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] text-[#7C3AED] border border-[#DDD6FE]'
                  }`}
                >
                  <svg
                    className="w-8 h-8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12h6" />
                    <path d="M12 9v6" />
                  </svg>
                </div>

                {selectedImage ? (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                      <CheckCircle className="w-3.5 h-3.5" />{' '}
                      {lang === 'ar' ? 'تم تحميل لقطة الشاشة' : lang === 'en' ? 'Screenshot loaded' : 'Capture d’écran chargée'}
                    </span>
                    <div className="max-w-xs mx-auto border border-[#DDD6EE] rounded-2xl overflow-hidden shadow-sm mt-2">
                      <img src={selectedImage.previewUrl} alt="Screenshot preview" className="max-h-36 mx-auto object-contain" />
                    </div>
                    <p className="text-xs text-[#706A82]">
                      {lang === 'ar' ? 'انقر لتغيير الصورة' : lang === 'en' ? 'Click to replace screenshot' : 'Cliquer pour remplacer la capture'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="font-serif-headline text-lg sm:text-xl font-bold text-[#161824] group-hover:text-[#7C3AED] transition-colors">
                      {t.dropzoneTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#706A82] max-w-sm mx-auto leading-relaxed">
                      {t.dropzoneSubtitle}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Or Paste Raw Text */}
          <div className="space-y-2 text-left rtl:text-right">
            <div className="flex items-center justify-between text-xs font-semibold text-[#645D73]">
              <span>{t.orPaste}</span>
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  className="text-[#7C3AED] hover:underline"
                >
                  {lang === 'ar' ? 'مسح' : lang === 'en' ? 'Clear' : 'Effacer'}
                </button>
              )}
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.pastePlaceholder}
              rows={4}
              className="w-full rounded-2xl p-4 text-sm sm:text-base border border-[#DDD6EE] bg-[#FAF8FF] focus:bg-white focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 outline-none transition-all placeholder:text-[#867F95] resize-y text-left rtl:text-right"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-xs sm:text-sm text-[#E11D48] flex items-center gap-2 shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#E11D48]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-[#645D73]">
              <Sparkles className="w-4 h-4 text-[#7C3AED]" />
              <span>
                {lang === 'ar'
                  ? 'تحويل تلقائي فوري بين النماذج (Gemini · Groq · Brev)'
                  : lang === 'en'
                  ? 'Real-time multi-provider routing (Gemini · Groq · Brev)'
                  : 'Bascule automatique multi-modèles (Gemini · Groq · Brev)'}
              </span>
            </div>

            <button
              onClick={() => handleRunAnalysis()}
              disabled={isAnalyzing}
              className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold text-sm sm:text-base text-white transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(99,102,241,0.25)] ${
                isAnalyzing
                  ? 'bg-[#B0A8C0] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] hover:from-[#4F46E5] hover:via-[#6D28D9] hover:to-[#2563EB] hover:scale-[1.02] active:scale-[0.99]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t.analyzing}</span>
                </>
              ) : (
                <>
                  <span>{t.analyzeBtn}</span>
                  <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </div>

          {/* Quick Sample Test Chips */}
          <div className="pt-6 border-t border-[#E8E2EE] space-y-3">
            <span className="text-xs font-semibold text-[#867F95]">
              {t.trySample}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() =>
                  loadSample(
                    'مبروك ربحتي 10000 درهم مع اتصالات المغرب. عطينا الكود باش نصيفطوها ليك فالحساب'
                  )
                }
                className="text-left rtl:text-right text-xs p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] hover:border-[#C0392B] hover:bg-[#FEF2F2] text-[#161824] transition-all flex items-center justify-between gap-2 shadow-2xs"
              >
                <span className="font-medium truncate">{t.samples.inwiPrize}</span>
                <span className="text-[10px] uppercase font-bold text-[#C0392B] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-0.5 rounded-full">Scam</span>
              </button>
              <button
                onClick={() =>
                  loadSample(
                    'Votre colis Amana est bloqué pour cause de frais de douane impayés de 18 DH. Régularisez sur: http://amana-suivi-douane.me/pay'
                  )
                }
                className="text-left rtl:text-right text-xs p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] hover:border-[#C0392B] hover:bg-[#FEF2F2] text-[#161824] transition-all flex items-center justify-between gap-2 shadow-2xs"
              >
                <span className="font-medium truncate">{t.samples.amanaFee}</span>
                <span className="text-[10px] uppercase font-bold text-[#C0392B] bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-0.5 rounded-full">Scam</span>
              </button>
              <button
                onClick={() =>
                  loadSample(
                    'Votre code de vérification est 483920. Ne le communiquez à personne.'
                  )
                }
                className="text-left rtl:text-right text-xs p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] hover:border-[#2E7D4F] hover:bg-[#F0FDF4] text-[#161824] transition-all flex items-center justify-between gap-2 shadow-2xs"
              >
                <span className="font-medium truncate">{t.samples.legitOtp}</span>
                <span className="text-[10px] uppercase font-bold text-[#2E7D4F] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full">Safe</span>
              </button>
              <button
                onClick={() =>
                  loadSample(
                    "Salut, t'es dispo demain pour le café à Maarif vers 17h ?"
                  )
                }
                className="text-left rtl:text-right text-xs p-3.5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] hover:border-[#2E7D4F] hover:bg-[#F0FDF4] text-[#161824] transition-all flex items-center justify-between gap-2 shadow-2xs"
              >
                <span className="font-medium truncate">{t.samples.colleagueCoffee}</span>
                <span className="text-[10px] uppercase font-bold text-[#2E7D4F] bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 rounded-full">Safe</span>
              </button>
            </div>
          </div>

          {/* Small Trust Strip near dropzone */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#706A82] border-t border-[#EDE8F7]">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#7C3AED]" />
              {t.trust1}
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#0284C7]" />
              {t.trust2}
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
              {t.trust3}
            </span>
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="bg-white/95 rounded-3xl p-6 sm:p-10 shadow-[0_20px_50px_-12px_rgba(99,102,241,0.08),0_4px_16px_rgba(0,0,0,0.02)] border border-[#E8E2EE] space-y-8 animate-in fade-in text-left rtl:text-right">
          {/* Top Verdict Banner */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border transition-all ${
              lastResult.verdict === 'scam'
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#C0392B]'
                : lastResult.verdict === 'suspicious'
                ? 'bg-[#FFF7ED] border-[#FED7AA] text-[#C2540A]'
                : 'bg-[#F0FDF4] border-[#BBF7D0] text-[#2E7D4F]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    lastResult.verdict === 'scam'
                      ? 'bg-[#C0392B] text-white shadow-md shadow-[#C0392B]/20'
                      : lastResult.verdict === 'suspicious'
                      ? 'bg-[#E07B1A] text-white shadow-md shadow-[#E07B1A]/20'
                      : 'bg-[#2E7D4F] text-white shadow-md shadow-[#2E7D4F]/20'
                  }`}
                >
                  {lastResult.verdict === 'scam' ? (
                    <ShieldAlert className="w-7 h-7" />
                  ) : lastResult.verdict === 'suspicious' ? (
                    <AlertTriangle className="w-7 h-7" />
                  ) : (
                    <CheckCircle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider opacity-80">
                    {t.eyebrow}
                  </span>
                  <h2 className="font-serif-headline text-3xl sm:text-4xl font-bold tracking-tight">
                    {lastResult.verdict === 'scam'
                      ? t.scamVerdict
                      : lastResult.verdict === 'suspicious'
                      ? t.suspiciousVerdict
                      : t.safeVerdict}
                  </h2>
                </div>
              </div>

              {/* Confidence & Badges */}
              <div className="text-right rtl:text-left sm:self-center">
                <div className="text-xs font-semibold uppercase tracking-wide opacity-75">
                  {t.confidence}
                </div>
                <div className="font-mono text-2xl font-bold">
                  {Math.round(lastResult.confidence * 100)}%
                </div>
              </div>
            </div>

            {/* Explanation text */}
            <p className="mt-4 text-sm sm:text-base font-medium leading-relaxed opacity-95 border-t border-black/5 pt-3">
              {lastResult.explanation}
            </p>

            {/* Guardrail badge if fired or escalated */}
            {lastResult.guardrail_escalated && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA]">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t.guardrailBadge} ({lastResult.guardrail_verdict.toUpperCase()})
              </div>
            )}

            {/* Personalization Risk Alert if triggered by session context */}
            {lastResult.personalization_risk?.detected && (
              <div className="mt-3 p-3.5 rounded-2xl bg-white/80 border border-[#FECACA] text-xs text-[#C0392B] shadow-2xs">
                <span className="font-bold">⚠️ {t.personalizationRiskBadge} :</span>{' '}
                {lastResult.personalization_risk.reason}
              </div>
            )}
          </div>

          {/* Collapsible "What I read" box if image was transcribed */}
          {lastResult.transcription && (
            <div className="border border-[#DDD6EE] rounded-2xl overflow-hidden bg-[#FAF8FF]">
              <button
                onClick={() => setShowTranscription(!showTranscription)}
                className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-[#4B445B] hover:bg-[#EDE8F7] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#7C3AED]" />
                  {t.transcriptionTitle}
                  {lastResult.transcription.sender && (
                    <span className="font-normal text-[#706A82]">
                      (De: {lastResult.transcription.sender})
                    </span>
                  )}
                </span>
                {showTranscription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showTranscription && (
                <div className="p-5 border-t border-[#DDD6EE] text-xs sm:text-sm font-mono text-[#161824] bg-white whitespace-pre-wrap leading-relaxed">
                  {lastResult.transcription.raw_text}
                </div>
              )}
            </div>
          )}

          {/* Original message with inline red flags highlighted and underlined */}
          <div className="space-y-3 text-left rtl:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#706A82]">
              {lang === 'ar'
                ? 'الرسالة الأصلية مع تحديد المؤشرات'
                : lang === 'en'
                ? 'Original message with flagged indicators'
                : 'Message original avec indicateurs relevés'}
            </h3>
            <div className="p-5 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] text-sm sm:text-base text-[#161824] leading-relaxed">
              {renderTextWithRedFlags(
                inputText || lastResult.transcription?.raw_text || '',
                lastResult.red_flags
              )}
            </div>
          </div>

          {/* Red flags list breakdown */}
          {lastResult.red_flags.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#C0392B]">
                {t.redFlagsTitle} ({lastResult.red_flags.length})
              </h3>
              <div className="space-y-2.5">
                {lastResult.red_flags.map((rf, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3 shadow-2xs"
                  >
                    <span className="text-xs font-mono font-bold text-[#C0392B] bg-white px-2.5 py-0.5 rounded-lg border border-[#FECACA] shrink-0 mt-0.5 shadow-2xs">
                      #{idx + 1}
                    </span>
                    <div className="text-xs sm:text-sm">
                      <p className="font-bold text-[#161824]">{rf.flag}</p>
                      {rf.quote_from_message && (
                        <p className="text-xs font-mono text-[#C0392B] mt-1 bg-white/90 border border-[#FECACA] px-2 py-0.5 rounded-lg inline-block">
                          "{rf.quote_from_message}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3 Steps: What to do */}
          {lastResult.what_to_do.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#EDE8F7]">
              <h3 className="text-sm font-bold text-[#161824]">
                {t.whatToDoTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {lastResult.what_to_do.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FAF8FF] border border-[#DDD6EE] space-y-1.5 shadow-2xs"
                  >
                    <span className="text-xs font-mono font-bold text-[#7C3AED]">
                      0{idx + 1}
                    </span>
                    <p className="text-xs sm:text-sm font-medium text-[#2C2A36] leading-snug">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official reporting contacts */}
          {lastResult.report_to.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#706A82]">
                {t.reportToTitle}
              </h4>
              <div className="flex flex-wrap gap-2">
                {lastResult.report_to.map((org, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#EDE9FE] to-[#E0F2FE] text-[#6D28D9] border border-[#DDD6FE] shadow-2xs"
                  >
                    🏛️ {org}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions & Reset Button */}
          <div className="pt-6 border-t border-[#EDE8F7] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#706A82]">
              {common.aiNotice}
            </span>
            <button
              onClick={resetAnalysis}
              className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-[#181829] hover:bg-[#2C2A40] text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.resetBtn}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
