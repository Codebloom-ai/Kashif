import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lightbulb,
  ShieldCheck,
  Smartphone,
  EyeOff,
  Package,
  Briefcase,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../types.ts';

interface SafetyTipsCarouselProps {
  lang: Language;
}

interface SafetyTip {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tag_fr: string;
  tag_ar: string;
  tag_en: string;
  tagColor: string;
  tagBg: string;
  tagBorder: string;
  iconGradient: string;
  iconBorder: string;
  iconColor: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  desc_fr: string;
  desc_ar: string;
  desc_en: string;
  reflex_fr: string;
  reflex_ar: string;
  reflex_en: string;
}

const SAFETY_TIPS: SafetyTip[] = [
  {
    id: 'otp_sms',
    icon: Smartphone,
    tag_fr: 'Sécurité Bancaire',
    tag_ar: 'أمان الحسابات البنكية',
    tag_en: 'Banking Security',
    tagColor: 'text-[#4F46E5]',
    tagBg: 'from-[#EEF2FF] to-[#F5F3FF]',
    tagBorder: 'border-[#DDD6FE]',
    iconGradient: 'from-[#EDE9FE] to-[#E0E7FF]',
    iconBorder: 'border-[#DDD6FE]',
    iconColor: 'text-[#4F46E5]',
    title_fr: 'Ne partagez jamais un code reçu par SMS (OTP) par téléphone ou message',
    title_ar: 'لا تشارك أبداً أي رمز تأكيد بنكي (OTP) يصلك عبر SMS هاتفياً أو عبر الرسائل',
    title_en: 'Never disclose an SMS verification code (OTP) over the phone or chat',
    desc_fr: 'Même si l’appelant prétend être le service anti-fraude de votre banque (CIH, Attijariwafa, Banque Populaire, BMCE, SGMB). Les banques et opérateurs n’ont jamais besoin de votre code de validation SMS pour annuler ou bloquer une transaction frauduleuse.',
    desc_ar: 'حتى لو ادعى المتصل أنه من مصلحة مكافحة الاحتيال ببنكك (التجاري، الشعبي، CIH وغيرها). البنوك والمؤسسات المالية لا تحتاج مطلقاً إلى رمز التأكيد الهاتفي لإلغاء أي معاملة مشبوهة.',
    desc_en: 'Even if the caller claims to be your bank’s fraud department. Legitimate institutions never require your one-time SMS verification passcode to cancel or block unauthorized transactions.',
    reflex_fr: 'En cas d’appel urgent exigeant un code de confirmation, raccrochez immédiatement et composez le numéro officiel imprimé au dos de votre carte bancaire.',
    reflex_ar: 'عند تلقي أي اتصال يلح في طلب رمز التأكيد، اقطع الاتصال فوراً واتصل بنفسك بالرقم الرسمي المطبوع على ظهر بطاقتك البنكية.',
    reflex_en: 'If an urgent caller insists on getting a verification code, hang up immediately and call the official support number on the back of your card.',
  },
  {
    id: 'blur_plates_badges',
    icon: EyeOff,
    tag_fr: 'Hygiène Photos & Réseaux',
    tag_ar: 'حماية الخصوصية الرقمية',
    tag_en: 'Photo & Privacy Hygiene',
    tagColor: 'text-[#7C3AED]',
    tagBg: 'from-[#F5F3FF] to-[#FAF5FF]',
    tagBorder: 'border-[#E9D5FF]',
    iconGradient: 'from-[#F3E8FF] to-[#EDE9FE]',
    iconBorder: 'border-[#E9D5FF]',
    iconColor: 'text-[#7C3AED]',
    title_fr: 'Floutez systématiquement badges professionnels et plaques d’immatriculation',
    title_ar: 'قم بتمويه بطاقات العمل وشارات الدخول ولوحات السيارات قبل النشر',
    title_en: 'Always blur employee badges and vehicle license plates before posting',
    desc_fr: 'Une photo partagée en story avec un cordon d’entreprise ou une plaque minéralogique visible permet aux cybercriminels de connaître votre employeur, votre département interne et votre quartier de résidence pour concevoir un spear-phishing ciblé.',
    desc_ar: 'تكشف الصور المنشورة بشارات العمل أو لوحات المركبات عن جهة عملك وقسمك الإداري ومنطقتك السكنية، مما يسهل استهدافك بهندسة اجتماعية موجهة وخبيثة.',
    desc_en: 'An innocent photo showing a company lanyard or car plate reveals your employer, exact department, and residential neighborhood to attackers for tailored spear-phishing.',
    reflex_fr: 'Utilisez l’outil de retouche de votre smartphone pour masquer les codes-barres, logos internes d’accès et plaques avant toute publication publique.',
    reflex_ar: 'استخدم أداة التمويه بهاتفك لتغطية الأكواد الشريطية والشعارات الداخلية ولوحات السيارات قبل نشر أي قصة أو صورة عامة.',
    reflex_en: 'Use your phone’s markup tool to blur barcodes, company access badges, and car plates before sharing any public photo or story.',
  },
  {
    id: 'fake_delivery_link',
    icon: Package,
    tag_fr: 'Arnaques Colis & Livraison',
    tag_ar: 'احتيال رسائل الطرود',
    tag_en: 'Package Delivery Scams',
    tagColor: 'text-[#2563EB]',
    tagBg: 'from-[#EFF6FF] to-[#EEF2FF]',
    tagBorder: 'border-[#BFDBFE]',
    iconGradient: 'from-[#DBEAFE] to-[#E0E7FF]',
    iconBorder: 'border-[#BFDBFE]',
    iconColor: 'text-[#2563EB]',
    title_fr: 'Les vrais livreurs n’envoient jamais de lien de paiement bancaire par SMS',
    title_ar: 'شركات التوصيل الحقيقية لا تطالب بأداء مالي فوري عبر روابط SMS',
    title_en: 'Authentic couriers never ask for instant fee payments via SMS links',
    desc_fr: 'Les faux SMS prétendant venir d’Amana, Barid Al-Maghrib ou DHL réclamant 15 à 30 DH de douane mènent à de fausses passerelles bancaires clonées afin de dérober vos identifiants de carte et votre code de sécurité (CVV).',
    desc_ar: 'رسائل بريد المغرب أو أمانة أو شركات الشحن المزيفة التي تطالب برسوم جمركية طفيفة (15-30 درهم) توجهك لبوابات دفع مستنسخة لسرقة بيانات بطاقتك البنكية.',
    desc_en: 'Fake SMS alerts impersonating postal or courier services asking for 15-30 DH custom fees lead to spoofed banking portals crafted to harvest card numbers and CVV codes.',
    reflex_fr: 'Ne touchez à aucun lien dans un SMS de livraison. Suivez vos colis exclusivement sur le portail officiel de l’expéditeur avec votre numéro de suivi d’origine.',
    reflex_ar: 'تجنب فتح أي رابط داخل رسائل التوصيل القصيرة، وتتبع شحنتك حصرياً عبر الموقع الرسمي للشركة باستخدام رقم التتبع الأصلي.',
    reflex_en: 'Never click links inside courier text messages. Track parcels only on the official carrier website using your authentic tracking number.',
  },
  {
    id: 'job_advance_fee',
    icon: Briefcase,
    tag_fr: 'Offres d’Emploi & Recrutement',
    tag_ar: 'عروض العمل والتوظيف',
    tag_en: 'Recruitment & Job Scams',
    tagColor: 'text-[#0284C7]',
    tagBg: 'from-[#F0F9FF] to-[#EEF2FF]',
    tagBorder: 'border-[#BAE6FD]',
    iconGradient: 'from-[#E0F2FE] to-[#EDE9FE]',
    iconBorder: 'border-[#BAE6FD]',
    iconColor: 'text-[#0284C7]',
    title_fr: 'Tout recruteur exigeant des frais de dossier préalables est un fraudeur',
    title_ar: 'طلب أي رسوم تسجيل أو تدريب مسبقة للعمل هو احتيال قاطع ومؤكد',
    title_en: 'Any recruiter asking for upfront processing fees is a confirmed scam',
    desc_fr: 'Aucun recruteur sérieux ni agence d’intérim reconnue ne demande d’argent pour une formation préparatoire, un uniforme, un badge ou des frais de dossier (par Cash Plus ou virement) avant la signature d’un contrat formel.',
    desc_ar: 'لا تطلب أي شركة حقيقية أو وكالة تشغيل معتمدة أي مقابل مالي أو تكاليف تدريب أو رسوم ملف عبر تحويلات نقدية قبل توقيع عقد العمل الرسمي.',
    desc_en: 'No legitimate employer or accredited recruiting agency requests payment for uniform fees, onboarding training, or dossier processing before signing a verified employment contract.',
    reflex_fr: 'Refusez systématiquement tout paiement préalable pour postuler ou passer un entretien, même si l’offre se pare d’un logo d’entreprise prestigieuse.',
    reflex_ar: 'ارفض بشكل قاطع دفع أي رسوم مسبقة للحصول على وظيفة أو إجراء مقابلة، مهما كان اسم المؤسسة أو بريق العرض المقدم.',
    reflex_en: 'Refuse any upfront payment request for job applications or interviews, regardless of how prestigious the alleged organization sounds.',
  },
  {
    id: 'camera_gps_exif',
    icon: ShieldCheck,
    tag_fr: 'Métadonnées & Géolocalisation',
    tag_ar: 'إحداثيات الموقع والكاميرا',
    tag_en: 'Metadata & Location Privacy',
    tagColor: 'text-[#4F46E5]',
    tagBg: 'from-[#EEF2FF] to-[#F5F3FF]',
    tagBorder: 'border-[#DDD6FE]',
    iconGradient: 'from-[#EDE9FE] to-[#DBEAFE]',
    iconBorder: 'border-[#DDD6FE]',
    iconColor: 'text-[#4F46E5]',
    title_fr: 'Désactivez la géolocalisation automatique dans l’application Caméra',
    title_ar: 'أوقف تسجيل إحداثيات GPS التلقائية في تطبيق الكاميرا بهاتفك',
    title_en: 'Turn off automatic GPS geotagging in your smartphone camera app',
    desc_fr: 'Les clichés bruts enregistrent souvent les coordonnées GPS satellites exactes (latitude et longitude au mètre près) dans les données EXIF, exposant la localisation précise de votre domicile ou de l’école de vos proches.',
    desc_ar: 'تخزن الصور الأصلية غير المعالجة إحداثيات GPS الساتلية بدقة تامة داخل بيانات EXIF المخفية، مما يعرض عنوان منزلك ومدارس عائلتك لكشف صريح.',
    desc_en: 'Raw unedited photos frequently store precise satellite GPS coordinates within hidden EXIF metadata, revealing your exact home address or daily routines to curious parties.',
    reflex_fr: 'Désactivez l’option « Balises de localisation » dans les réglages de votre appareil photo. Kashif détecte et nettoie également ces balises lors de vos scans.',
    reflex_ar: 'عطّل خاصية «حفظ الموقع الجغرافي» من إعدادات تطبيق الكاميرا، واستعن بفحص كاشف لتنقية وتجريد صورك من هذه الإحداثيات الحساسة.',
    reflex_en: 'Disable "Location tags" in your camera settings. Kashif’s audit also automatically scans and alerts you to sensitive embedded coordinates.',
  },
  {
    id: 'family_emergency',
    icon: AlertTriangle,
    tag_fr: 'Urgences Simulées & Deepfakes',
    tag_ar: 'الطوارئ العائلية المفبركة',
    tag_en: 'Family Crisis & Impersonation',
    tagColor: 'text-[#7C3AED]',
    tagBg: 'from-[#F5F3FF] to-[#EEF2FF]',
    tagBorder: 'border-[#DDD6FE]',
    iconGradient: 'from-[#F3E8FF] to-[#DBEAFE]',
    iconBorder: 'border-[#DDD6FE]',
    iconColor: 'text-[#7C3AED]',
    title_fr: 'Face à un message d’urgence d’un proche, rappelez-le sur sa ligne directe habituelle',
    title_ar: 'عند تلقي استغاثة عاجلة من قريب، اتصل برقم هاتفه المعتاد قبل تحويل أي درهم',
    title_en: 'When receiving an urgent message from family, call their direct number first',
    desc_fr: 'Les attaquants exploitent la détresse émotionnelle (« Mon téléphone est en panne, contacte-moi sur ce nouveau WhatsApp, j’ai eu un grave problème, aide-moi vite ») pour vous pousser à un virement précipité sans vérification préalable.',
    desc_ar: 'يستغل المحتالون مشاعر الذعر العائلي (مثل رسائل: «تعطل هاتفي، راسلني على هذا الرقم الجديد، وقعت في حادث وأحتاج تحويلاً سريعاً») لفرض تحويل أموال متعجل دون تدقيق.',
    desc_en: 'Attackers manipulate emotional panic ("My phone broke, text this new WhatsApp number, I had an emergency and need fast cash") to trigger impulsive money transfers without verification.',
    reflex_fr: 'Con convenez d’un mot de passe secret verbal avec vos proches, et joignez toujours la personne sur son numéro téléphonique usuel avant toute opération financière.',
    reflex_ar: 'اتفق مع أفراد أسرتك على «كلمة سر أمان شفهية» للتحقق من هويتهم، وتحدث مع قريبك مباشرة بصوته على رقمه الأصلي قبل إرسال أي مبلغ.',
    reflex_en: 'Establish a private verbal safety codeword with loved ones, and always voice-call the person on their known telephone number before sending funds.',
  },
];

export const SafetyTipsCarousel: React.FC<SafetyTipsCarouselProps> = ({ lang }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const touchStartXRef = useRef<number | null>(null);
  const intervalRef = useRef<any>(null);
  const total = SAFETY_TIPS.length;
  const isRtl = lang === 'ar';

  const goToNext = useCallback(() => {
    setDirection('next');
    setCurrentIndex((prev) => (prev + 1) % total);
    setProgress(0);
  }, [total]);

  const goToPrev = useCallback(() => {
    setDirection('prev');
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    setProgress(0);
  }, [total]);

  const goToIndex = (targetIdx: number) => {
    if (targetIdx === currentIndex) return;
    setDirection(targetIdx > currentIndex ? 'next' : 'prev');
    setCurrentIndex(targetIdx);
    setProgress(0);
  };

  // 6-second auto-advance cycle with smooth progress tracking
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const stepMs = 60;
    const totalDurationMs = 6000;
    const stepIncrement = (stepMs / totalDurationMs) * 100;

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return Math.min(prev + stepIncrement, 100);
      });
    }, stepMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, goToNext]);

  // Touch event handlers for mobile swipe & pause
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // Swiped left
        isRtl ? goToPrev() : goToNext();
      } else {
        // Swiped right
        isRtl ? goToNext() : goToPrev();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      isRtl ? goToNext() : goToPrev();
    } else if (e.key === 'ArrowRight') {
      isRtl ? goToPrev() : goToNext();
    }
  };

  const tip = SAFETY_TIPS[currentIndex];
  const Icon = tip.icon;

  const eyebrowLabel =
    lang === 'fr'
      ? 'LE SAVIEZ-VOUS ? — RÉFLEXES DE CYBER-DÉFENSE QUOTIDIENNE'
      : lang === 'ar'
      ? 'هل تعلم؟ — قواعد الحماية واليقظة اليومية'
      : 'DID YOU KNOW? — DAILY CYBER DEFENSE HABITS';

  const reflexHeading =
    lang === 'fr'
      ? 'Réflexe cyber recommandé :'
      : lang === 'ar'
      ? 'قاعدة الحماية الذهبية :'
      : 'Recommended cyber habit:';

  const pauseStatusLabel = isPaused
    ? lang === 'fr'
      ? 'En pause'
      : lang === 'ar'
      ? 'مؤقت'
      : 'Paused'
    : lang === 'fr'
    ? 'Auto (6s)'
    : lang === 'ar'
    ? 'تلقائي (6ث)'
    : 'Auto (6s)';

  const prevAriaLabel = lang === 'fr' ? 'Conseil précédent' : lang === 'ar' ? 'النصيحة السابقة' : 'Previous tip';
  const nextAriaLabel = lang === 'fr' ? 'Conseil suivant' : lang === 'ar' ? 'النصيحة التالية' : 'Next tip';
  const togglePlayAriaLabel = isPaused
    ? lang === 'fr'
      ? 'Reprendre le défilement automatique'
      : lang === 'ar'
      ? 'استئناف التمرير التلقائي'
      : 'Resume auto-scroll'
    : lang === 'fr'
    ? 'Mettre en pause le défilement'
    : lang === 'ar'
    ? 'إيقاف التمرير مؤقتاً'
    : 'Pause auto-scroll';

  const currentTag = lang === 'fr' ? tip.tag_fr : lang === 'ar' ? tip.tag_ar : tip.tag_en;
  const currentTitle = lang === 'fr' ? tip.title_fr : lang === 'ar' ? tip.title_ar : tip.title_en;
  const currentDesc = lang === 'fr' ? tip.desc_fr : lang === 'ar' ? tip.desc_ar : tip.desc_en;
  const currentReflex = lang === 'fr' ? tip.reflex_fr : lang === 'ar' ? tip.reflex_ar : tip.reflex_en;

  const animationClass = direction === 'next' ? 'animate-tip-slide-next' : 'animate-tip-slide-prev';

  return (
    <section
      aria-label={eyebrowLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative rounded-3xl bg-gradient-to-br from-[#FAF8F5] via-[#F8F6FF] to-[#F1F6FE] border border-[#E8E2EE] p-4 sm:p-7 shadow-[0_4px_24px_-4px_rgba(99,102,241,0.05),0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/50"
    >
      {/* Decorative ambient gradient blooms */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-violet-200/35 via-indigo-100/20 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-200/30 via-purple-100/20 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header Row: Eyebrow + Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        {/* Left: Eyebrow with minimal icon container */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] border border-[#DDD6FE]/80 text-[#6366F1] flex items-center justify-center shrink-0 shadow-2xs">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#635B74]">
            {eyebrowLabel}
          </span>
        </div>

        {/* Right: Auto status badge + Navigation arrows */}
        <div className="flex items-center gap-2">
          {/* Pause / Play status toggle */}
          <button
            onClick={() => setIsPaused((prev) => !prev)}
            aria-label={togglePlayAriaLabel}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors shadow-2xs ${
              isPaused
                ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                : 'bg-white/90 text-[#554E66] border-[#E0DAEE] hover:bg-white'
            }`}
          >
            {isPaused ? (
              <Play className="w-3 h-3 text-[#B45309] fill-current" />
            ) : (
              <Pause className="w-3 h-3 text-[#6366F1]" />
            )}
            <span>{pauseStatusLabel}</span>
          </button>

          {/* Current card number badge */}
          <span className="text-xs font-mono font-semibold text-[#6D657E] bg-white/90 border border-[#E0DAEE] px-2.5 py-1 rounded-full shadow-2xs">
            {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>

          {/* Left Arrow Button */}
          <button
            onClick={isRtl ? goToNext : goToPrev}
            aria-label={prevAriaLabel}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 border border-[#DFDAF0] text-[#554E66] hover:bg-[#16181D] hover:text-white hover:border-[#16181D] active:scale-95 transition-all flex items-center justify-center shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={isRtl ? goToPrev : goToNext}
            aria-label={nextAriaLabel}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 border border-[#DFDAF0] text-[#554E66] hover:bg-[#16181D] hover:text-white hover:border-[#16181D] active:scale-95 transition-all flex items-center justify-center shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Single Tip Card: Slide + Fade Animation */}
      <div className="relative z-10 w-full overflow-hidden">
        <div
          key={currentIndex}
          className={`w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-[#FCFAFF] to-[#F7F9FF] border border-[#E4E0F4] p-5 sm:p-7 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.06),0_2px_8px_rgba(0,0,0,0.02)] relative overflow-hidden transition-all text-left rtl:text-right ${animationClass}`}
        >
          {/* Subtle interior ambient glow */}
          <div
            className="absolute top-0 right-0 w-64 h-40 bg-gradient-to-bl from-[#EDE9FE]/30 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Top row: Category tag & Minimal Icon */}
          <div className="flex items-center justify-between gap-3 mb-3.5 sm:mb-4">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${tip.tagBg} border ${tip.tagBorder} ${tip.tagColor} shadow-2xs`}
            >
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>{currentTag}</span>
            </span>

            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br ${tip.iconGradient} border ${tip.iconBorder} ${tip.iconColor} flex items-center justify-center shrink-0 shadow-2xs`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>

          {/* Title */}
          <h3 className="font-serif-headline text-lg sm:text-2xl font-normal text-[#16181D] leading-snug sm:leading-tight mb-2.5">
            {currentTitle}
          </h3>

          {/* Detailed explanation */}
          <p className="text-xs sm:text-sm text-[#575146] leading-relaxed mb-4">
            {currentDesc}
          </p>

          {/* Reflex Callout Box */}
          <div className="bg-gradient-to-r from-[#F7F5FF] via-[#F2F5FF] to-[#EFF8FF] border border-[#DDD8F3] rounded-2xl p-3.5 sm:p-4.5 flex items-start gap-3 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-white text-[#6366F1] border border-[#DDD6FE] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-xs font-bold text-[#3730A3]">
                {reflexHeading}
              </h4>
              <p className="text-xs sm:text-[13px] text-[#4338CA]/90 font-medium leading-relaxed">
                {currentReflex}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar + Pagination Controls */}
      <div className="relative z-10 mt-4 sm:mt-5 pt-1 space-y-3">
        {/* Slim 6-second progress bar */}
        <div
          className="h-1 w-full max-w-md mx-auto bg-[#EBE6F5] rounded-full overflow-hidden"
          title={pauseStatusLabel}
        >
          <div
            className="h-full bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#3B82F6] transition-[width] duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          {SAFETY_TIPS.map((tItem, dotIdx) => {
            const isActive = currentIndex === dotIdx;
            const dotTitle = lang === 'fr' ? tItem.tag_fr : lang === 'ar' ? tItem.tag_ar : tItem.tag_en;

            return (
              <button
                key={dotIdx}
                onClick={() => goToIndex(dotIdx)}
                aria-label={`Aller au conseil ${dotIdx + 1}: ${dotTitle}`}
                title={`${dotIdx + 1}. ${dotTitle}`}
                className={`transition-all duration-300 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] ${
                  isActive
                    ? 'w-7 sm:w-8 h-2 bg-gradient-to-r from-[#6366F1] via-[#7C3AED] to-[#3B82F6] shadow-2xs'
                    : 'w-2 h-2 bg-[#DFD9EB] hover:bg-[#A5B4FC]'
                }`}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
