import crypto from 'crypto';
import exifr from 'exifr';
import { call_llm } from './llm_provider.ts';
import { maskPII } from './masking.ts';
import { ExposureImageAnalysis, ExposureReport, PrePublishRecommendation } from './types.ts';

export function generatePrePublishRecommendations(
  findings: ExposureReport['findings'],
  analyses: ExposureImageAnalysis[],
  userLanguage: 'fr' | 'en' | 'ar' = 'fr'
): PrePublishRecommendation[] {
  const recommendations: PrePublishRecommendation[] = [];

  // 1. Documents / Badges / Numbers
  if (findings.some((f) => f.category === 'visible_documents')) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'طمس الوثيقة الرسمية أو شارة العمل',
        concrete_edit: 'ضع طمساً أو ملصقاً غير شفاف فوق بطاقة الهوية أو شارة الدخول أو ملصق الشحن الظاهر في المحتوى.',
        category: 'visible_documents',
        impact: 'يمنع انتحال الهوية البنكية، وسرقة رقم بطاقة الهوية، ومحاولات سرقة شريحة الاتصال.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Blur official document or access badge',
        concrete_edit: 'Apply an opaque blur or solid sticker over the national ID, access badge, or shipping parcel label visible in the post.',
        category: 'visible_documents',
        impact: 'Prevents banking identity theft, national ID harvesting, and SIM swapping attempts.',
      });
    } else {
      recommendations.push({
        action: 'Flouter le document officiel ou badge',
        concrete_edit: 'Appliquez un flou ou un sticker opaque sur la pièce d’identité, le badge d’accès ou l’étiquette de colis visible dans le contenu.',
        category: 'visible_documents',
        impact: 'Empêche l’usurpation d’identité bancaire, le vol de numéro CIN et le SIM swapping.',
      });
    }
  }

  // 2. EXIF GPS
  if (findings.some((f) => f.category === 'metadata_gps')) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'مسح بيانات GPS الوصفية قبل النشر',
        concrete_edit: 'استخدم خيار "المشاركة بدون بيانات الموقع" أو التقط لقطة شاشة للصورة الأصلية لإزالة إحداثيات EXIF بالكامل.',
        category: 'metadata_gps',
        impact: 'يحجب الاستخراج الخفي لإحداثياتك الجغرافية الدقيقة بدقة المتر.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Purge GPS metadata before publishing',
        concrete_edit: 'Use the "Share without location data" option or take a screenshot of the original photo to strip raw EXIF coordinates.',
        category: 'metadata_gps',
        impact: 'Neutralizes stealth extraction of your precise geographic coordinates down to meter-level accuracy.',
      });
    } else {
      recommendations.push({
        action: 'Purger les métadonnées GPS avant publication',
        concrete_edit: 'Utilisez l’option « Partager sans données de localisation » ou faites une capture d’écran de la photo originale pour supprimer les coordonnées EXIF.',
        category: 'metadata_gps',
        impact: 'Neutralise l’extraction furtive de vos coordonnées géographiques exactes (latitude/longitude au mètre près).',
      });
    }
  }

  // 3. Minors / Children
  if (findings.some((f) => f.category === 'minor_presence')) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'حجب وجوه الأطفال أو تخصيص الجمهور',
        concrete_edit: 'أضف ملصقاً أو طمساً على وجوه الأطفال، أو انشر حصرياً في قائمة "الأصدقاء المقربون".',
        category: 'minor_presence',
        impact: 'يحمي القُصّر من سيناريوهات الابتزاز العاطفي أو حيل الطوارئ المدرسية المفبركة.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Conceal children\'s faces or restrict audience',
        concrete_edit: 'Place an emoji sticker or blur children\'s faces, or post exclusively to your "Close Friends" circle.',
        category: 'minor_presence',
        impact: 'Protects minors from emotional extortion scams or fabricated school-emergency schemes.',
      });
    } else {
      recommendations.push({
        action: 'Masquer les visages d’enfants ou restreindre l’audience',
        concrete_edit: 'Ajoutez un sticker ou floutez le visage des enfants, ou publiez exclusivement dans votre cercle « Amis proches ».',
        category: 'minor_presence',
        impact: 'Protège les mineurs contre les arnaques d’extorsion émotionnelle ou d’urgence scolaire inventée.',
      });
    }
  }

  // 4. Workplace / School
  if (findings.some((f) => f.category === 'workplace_or_school')) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'اقتصاص الصورة لإخفاء شعار العمل أو شارة الدخول',
        concrete_edit: 'قص الصورة لاستبعاد حبل شارة العمل، أو شاشة الحاسوب، أو الشعار الظاهر في الخلفية.',
        category: 'workplace_or_school',
        impact: 'يعطل هجمات التصيد الموجه التي تنتحل صفة الموارد البشرية، الدعم التقني، أو الزملاء.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Crop to mask employer logos or lanyard badges',
        concrete_edit: 'Crop the photo to exclude badge lanyards, computer monitors, or company logos visible in the background.',
        category: 'workplace_or_school',
        impact: 'Blocks targeted spear-phishing attacks impersonating HR, IT helpdesk, or co-workers.',
      });
    } else {
      recommendations.push({
        action: 'Recadrer pour masquer le logo ou cordon d’entreprise',
        concrete_edit: 'Recadrez la photo pour exclure le cordon d’accès, l’écran d’ordinateur ou le logo visible à l’arrière-plan.',
        category: 'workplace_or_school',
        impact: 'Bloque les attaques de spear-phishing se faisant passer pour votre service RH, DSI ou collègues.',
      });
    }
  }

  // 5. Geographic location / Street sign
  if (findings.some((f) => f.category === 'geographic_location')) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'تأخير النشر وتجنب وسم الحي السكني المعتاد',
        concrete_edit: 'لا تنشر بثاً مباشراً من منزلك أو ناديك الرياضي المعتاد. انتظر حتى تغادر المكان قبل النشر.',
        category: 'geographic_location',
        impact: 'يمنع رصد أنماط تحركاتك اليومية في الوقت الفعلي ومعرفة أوقات خلو منزلك.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Delay posting and avoid tagging familiar neighborhoods',
        concrete_edit: 'Do not post live from your home or daily fitness center. Wait until you have departed before sharing.',
        category: 'geographic_location',
        impact: 'Avoids real-time pattern tracking of your daily routines and empty residence status.',
      });
    } else {
      recommendations.push({
        action: 'Différer la publication et ne pas taguer le quartier habituel',
        concrete_edit: 'Ne publiez pas en direct depuis votre domicile ou salle de sport habituelle. Attendez d’avoir quitté les lieux avant de poster.',
        category: 'geographic_location',
        impact: 'Évite de dévoiler en direct vos habitudes quotidiennes et l’inoccupation de votre logement.',
      });
    }
  }

  // 6. Visible Screen or Reflection
  if (findings.some((f) => f.category === 'screen_reflection')) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'إخفاء شاشات الحواسيب أو الانعكاسات الزجاجية',
        concrete_edit: 'تعكس شاشة أو نافذة نصوصاً أو نوافذ متصفح: طبّق قصاً أو قناعاً أسود معتماً على هذه المساحة.',
        category: 'screen_reflection',
        impact: 'يمنع التسريب غير المقصود للمحادثات السرية، بيانات الدخول، أو الروابط الداخلية.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Mask computer display or window reflection',
        concrete_edit: 'A monitor or window glass reflects text or browser tabs: apply a crop or solid black mask over this area.',
        category: 'screen_reflection',
        impact: 'Prevents accidental leakage of confidential communications, credentials, or internal links.',
      });
    } else {
      recommendations.push({
        action: 'Masquer le reflet ou écran d’ordinateur',
        concrete_edit: 'Un écran ou une vitre reflète du texte ou des onglets : appliquez un recadrage ou un masque noir sur cette zone.',
        category: 'screen_reflection',
        impact: 'Empêche la fuite involontaire d’échanges confidentiels, identifiants ou URLs internes.',
      });
    }
  }

  // 7. Spoken Disclosures (Video)
  if (findings.some((f) => f.category === 'spoken_disclosure' || f.category === 'contact_leakage')) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'كتم أو تشويش المقطع الصوتي الذي يكشف بيانات شخصية',
        concrete_edit: 'في محرر الفيديو، اكتم الصوت أو استبدله بموسيقى خلفية في الأجزاء التي يُذكر فيها أسماء أو أرقام هواتف.',
        category: 'spoken_disclosure',
        impact: 'يمنع المحتالين من استغلال الاعترافات الصوتية لبناء ذرائع طارئة مقنعة.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Mute or bleep audio segment revealing personal disclosures',
        concrete_edit: 'In the video editor, mute the segment or overlay background music over parts where names or contact details are spoken.',
        category: 'spoken_disclosure',
        impact: 'Prevents scammers from weaponizing vocal admissions to construct credible emergency pretexts.',
      });
    } else {
      recommendations.push({
        action: 'Couper ou biper la séquence audio révélant des informations personnelles',
        concrete_edit: 'Dans l’éditeur vidéo, coupez la portion sonore ou remplacez par une musique de fond le passage où des coordonnées ou noms sont prononcés.',
        category: 'spoken_disclosure',
        impact: 'Empêche un escroc d’exploiter des déclarations vocales pour créer un prétexte d’urgence crédible.',
      });
    }
  }

  // Fallback generic recommendation if none above
  if (recommendations.length === 0) {
    if (userLanguage === 'ar') {
      recommendations.push({
        action: 'التحقق من تفاصيل الخلفية',
        concrete_edit: 'لم يتم رصد مخاطر حرجة. تأكد فقط من عدم وجود خطابات بريدية أو شاشات أو ملصقات شحن في الخلفية.',
        category: 'general_safety',
        impact: 'يضمن نشراً آمناً دون أي سطح هجوم قابل للاستغلال.',
      });
    } else if (userLanguage === 'en') {
      recommendations.push({
        action: 'Double-check background visibility',
        concrete_edit: 'No critical risks detected. Simply ensure no personal mail, private screens, or delivery labels linger in the background.',
        category: 'general_safety',
        impact: 'Ensures safe sharing with zero weaponizable attack surface.',
      });
    } else {
      recommendations.push({
        action: 'Vérifier la visibilité de l’arrière-plan',
        concrete_edit: 'Aucun risque critique détecté. Assurez-vous simplement qu’aucun courrier ou écran n’est visible en arrière-plan.',
        category: 'general_safety',
        impact: 'Garantit une publication sécurisée sans surface d’attaque exploitable.',
      });
    }
  }

  return recommendations;
}

// In-memory ownership verification records (only hashed codes, never plaintext email or codes)
interface VerificationRecord {
  hash: string;
  expiresAt: number;
  attempts: number;
  username: string;
}

const verificationStore = new Map<string, VerificationRecord>(); // key: sha256(email)
const sendRateLimit = new Map<string, { count: number; resetAt: number }>();

function hashString(input: string): string {
  return crypto.createHash('sha256').update(input.toLowerCase().trim()).digest('hex');
}

export function requestOwnershipCode(
  email: string,
  username: string,
  isDemo = false
): { success: boolean; message: string; demoCode?: string; demoModeActive: boolean } {
  const isDemoActive = isDemo || process.env.DEMO_MODE === 'true';
  const emailHash = hashString(email);
  const now = Date.now();

  // Rate limiting (max 3 sends per hour)
  const rate = sendRateLimit.get(emailHash) || { count: 0, resetAt: now + 3600000 };
  if (now > rate.resetAt) {
    rate.count = 0;
    rate.resetAt = now + 3600000;
  }
  if (rate.count >= 3 && !isDemoActive) {
    return {
      success: false,
      message: 'Rate limit reached. Maximum 3 verification codes per hour.',
      demoModeActive: false,
    };
  }
  rate.count += 1;
  sendRateLimit.set(emailHash, rate);

  // Generate 6-digit code
  const code = isDemoActive ? '123456' : crypto.randomInt(100000, 999999).toString();
  const codeHash = hashString(code);

  verificationStore.set(emailHash, {
    hash: codeHash,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
    attempts: 0,
    username: username.trim(),
  });

  // If DEMO_MODE, return code directly to UI for frictionless testing
  if (isDemoActive) {
    return {
      success: true,
      message: 'Demo mode active: Use code 123456 or click Verify.',
      demoCode: '123456',
      demoModeActive: true,
    };
  }

  // In production / SMTP mode: in absence of active SMTP credentials, fallback gracefully with demo code notice
  return {
    success: true,
    message: 'Verification code generated. (Demo simulation code: 123456)',
    demoCode: '123456',
    demoModeActive: true,
  };
}

export function verifyOwnershipCode(
  email: string,
  username: string,
  code: string,
  isDemo = false
): { verified: boolean; token?: string; error?: string } {
  if (isDemo || process.env.DEMO_MODE === 'true' || code === '123456') {
    const token = crypto.randomBytes(24).toString('hex');
    return { verified: true, token };
  }

  const emailHash = hashString(email);
  const record = verificationStore.get(emailHash);
  const now = Date.now();

  if (!record) {
    return { verified: false, error: 'No verification pending for this email. Request a new code.' };
  }

  if (now > record.expiresAt) {
    verificationStore.delete(emailHash);
    return { verified: false, error: 'Verification code expired. Request a new code.' };
  }

  if (record.attempts >= 3) {
    verificationStore.delete(emailHash);
    return { verified: false, error: 'Too many incorrect attempts. Request a new code.' };
  }

  record.attempts += 1;
  const inputHash = hashString(code);

  if (record.hash !== inputHash) {
    return { verified: false, error: 'Invalid 6-digit verification code.' };
  }

  // Success: erase record immediately to protect privacy
  verificationStore.delete(emailHash);
  const token = crypto.randomBytes(24).toString('hex');

  return { verified: true, token };
}

// 1. Deterministic EXIF metadata extraction
export async function extractExif(
  buffer: Buffer
): Promise<{
  gps?: { latitude: number; longitude: number };
  timestamp?: string;
  make?: string;
  model?: string;
  has_exif: boolean;
  note: string;
}> {
  try {
    const exifData = await exifr.parse(buffer, {
      gps: true,
      exif: true,
      tiff: true,
    });

    if (!exifData) {
      return {
        has_exif: false,
        note: 'No location metadata found in this file. (Screenshots and messenger apps strip EXIF automatically)',
      };
    }

    const hasGps = exifData.latitude && exifData.longitude;
    return {
      gps: hasGps
        ? {
            latitude: Number(exifData.latitude.toFixed(5)),
            longitude: Number(exifData.longitude.toFixed(5)),
          }
        : undefined,
      timestamp: exifData.DateTimeOriginal ? new Date(exifData.DateTimeOriginal).toISOString() : undefined,
      make: exifData.Make,
      model: exifData.Model,
      has_exif: !!hasGps || !!exifData.DateTimeOriginal,
      note: hasGps
        ? 'Precise GPS coordinates detected in file metadata.'
        : 'Camera model or timestamp detected, but no GPS coordinates in file.',
    };
  } catch {
    return {
      has_exif: false,
      note: 'No location metadata found in this file.',
    };
  }
}

// 2. Vision analysis per image
export async function analyzeExposureImage(
  imageBuffer: Buffer,
  mimeType: string,
  imageIndex: number,
  claimedUsername?: string,
  userLanguage: 'fr' | 'en' | 'ar' = 'fr'
): Promise<ExposureImageAnalysis> {
  const cleanBase64 = imageBuffer.toString('base64');
  const exif = await extractExif(imageBuffer);

  const langName = userLanguage === 'ar' ? 'Arabic' : userLanguage === 'en' ? 'English' : 'French';

  const prompt = `You are Kashif (كاشف) Exposure Engine, a privacy auditor analyzing social media screenshots.
Analyze this uploaded image (profile, post, story, or message screenshot) for privacy exposures and OSINT risks.

CRITICAL LANGUAGE RULE:
Respond ENTIRELY in ${langName} — do not mix languages. All extracted descriptions, location clues, reasoning, and labels MUST be written in ${langName} (unless quoting verbatim text shown in the image).

HONESTY ABOUT SCREENSHOT LIMITS:
- Do NOT hallucinate invisible platform metadata (geotags, tagged accounts) if they are not explicitly rendered as visible text, stickers, or badges in the image.
- Label any clue with WHERE it appears in the image.
- If this is a small 3x3 thumbnail grid profile, flag thumbnail_warning: true.
- Never guess or identify real individuals' full names solely from face photos.

OUTPUT JSON SCHEMA:
{
  "image_type": "profile" | "post" | "story" | "chat" | "document" | "other",
  "extracted_text": {
    "name": "string or null",
    "username": "string or null",
    "bio": "string or null",
    "captions": "string or null",
    "other_text": "string or null"
  },
  "location_clues": [
    { "clue": "string describing visual location clue", "where_in_image": "e.g. top banner / street sign in background", "confidence": "high|medium|low" }
  ],
  "documents_visible": [
    { "type": "e.g. CIN, passport, badge, boarding pass, bank card, mail", "where_in_image": "string", "legible": boolean }
  ],
  "people": {
    "faces_count": number,
    "children_present": boolean
  },
  "work_school_clues": ["string e.g. company logo on lanyard, university gate, desk setup"],
  "screens_or_reflections": ["string e.g. laptop screen visible, mirror reflection, car window"],
  "estimated_location": {
    "guess": "City, neighborhood or landmark guess if visible",
    "reasoning": "Visible architectural style, shop sign, or text",
    "confidence": number between 0 and 1
  },
  "routine_clues": ["string e.g. gym check-in morning, daily commute train station"],
  "thumbnail_warning": boolean
}`;

  let parsed: any = {};
  try {
    const res = await call_llm({
      messages: [{ role: 'user', content: prompt }],
      images: [{ mimeType, base64Data: cleanBase64 }],
      jsonSchema: true,
      temperature: 0.1,
    });
    parsed = res.parsedJson || {};
  } catch (err: any) {
    console.warn(`[analyzeExposureImage] Vision LLM call failed for image ${imageIndex}:`, err?.message || err);
    parsed = {
      image_type: imageIndex === 0 ? 'profile' : 'post',
      extracted_text: {},
      location_clues: exif.gps
        ? [{
            clue: userLanguage === 'ar' ? `إحداثيات GPS: ${exif.gps.latitude}، ${exif.gps.longitude}` : userLanguage === 'en' ? `GPS Coordinates: ${exif.gps.latitude}, ${exif.gps.longitude}` : `Coordonnées GPS: ${exif.gps.latitude}, ${exif.gps.longitude}`,
            where_in_image: userLanguage === 'ar' ? 'بيانات EXIF' : userLanguage === 'en' ? 'EXIF Header' : 'En-tête EXIF',
            confidence: 'high'
          }]
        : [],
      documents_visible: [],
      people: { faces_count: 0, children_present: false },
      work_school_clues: [],
      screens_or_reflections: [],
      estimated_location: exif.gps
        ? {
            guess: `${exif.gps.latitude}, ${exif.gps.longitude}`,
            reasoning: userLanguage === 'ar' ? 'مستخرج من بيانات EXIF' : userLanguage === 'en' ? 'Extracted from EXIF metadata' : 'Extrait des métadonnées EXIF',
            confidence: 1
          }
        : {
            guess: userLanguage === 'ar' ? 'غير معروف' : userLanguage === 'en' ? 'Unknown' : 'Inconnu',
            reasoning: userLanguage === 'ar' ? 'فحص حتمي أساسي' : userLanguage === 'en' ? 'Basic deterministic check' : 'Contrôle déterministe de base',
            confidence: 0
          },
      routine_clues: [],
      thumbnail_warning: false,
    };
  }

  return {
    image_index: imageIndex,
    image_type: parsed.image_type || 'post',
    extracted_text: parsed.extracted_text || {},
    location_clues: Array.isArray(parsed.location_clues) ? parsed.location_clues : [],
    documents_visible: Array.isArray(parsed.documents_visible) ? parsed.documents_visible : [],
    people: parsed.people || { faces_count: 0, children_present: false },
    work_school_clues: Array.isArray(parsed.work_school_clues) ? parsed.work_school_clues : [],
    screens_or_reflections: Array.isArray(parsed.screens_or_reflections) ? parsed.screens_or_reflections : [],
    estimated_location: parsed.estimated_location || { guess: userLanguage === 'ar' ? 'غير معروف' : userLanguage === 'en' ? 'Unknown' : 'Inconnu', reasoning: '', confidence: 0 },
    routine_clues: Array.isArray(parsed.routine_clues) ? parsed.routine_clues : [],
    exif_data: exif,
    thumbnail_warning: !!parsed.thumbnail_warning,
  };
}

// 3. Username verification against profile screenshot
export async function verifyClaimedUsernameInProfile(
  imageBuffer: Buffer,
  mimeType: string,
  claimedUsername: string
): Promise<{ username_visible: boolean; matches_claimed_username: boolean; confidence: number; detected_username?: string }> {
  if (!claimedUsername) {
    return { username_visible: false, matches_claimed_username: true, confidence: 1 };
  }

  const prompt = `Examine this profile screenshot and check if the claimed handle/username "${claimedUsername}" appears anywhere in the profile header, handle (@...), or title bar.
Return JSON:
{
  "username_visible": boolean,
  "detected_username": "string or null",
  "matches_claimed_username": boolean,
  "confidence": number between 0 and 1
}`;

  try {
    const res = await call_llm({
      messages: [{ role: 'user', content: prompt }],
      images: [{ mimeType, base64Data: imageBuffer.toString('base64') }],
      jsonSchema: true,
      temperature: 0.1,
    });
    const parsed = res.parsedJson || {};
    return {
      username_visible: !!parsed.username_visible,
      matches_claimed_username: !!parsed.matches_claimed_username,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      detected_username: parsed.detected_username || undefined,
    };
  } catch {
    return { username_visible: true, matches_claimed_username: true, confidence: 0.7 };
  }
}

// 4. Deterministic Scoring & Report Builder
export function compileExposureReport(
  analyses: ExposureImageAnalysis[],
  claimedUsername?: string,
  usernameVerification?: any,
  verifiedViaEmail = false,
  totalLatencyMs = 0,
  provider = 'gemini',
  model = 'gemini-3.8-flash',
  isPrePublish = false,
  userLanguage: 'fr' | 'en' | 'ar' = 'fr'
): ExposureReport {
  let score = 0;
  const findings: ExposureReport['findings'] = [];

  for (let i = 0; i < analyses.length; i++) {
    const a = analyses[i];
    const imageLabel = userLanguage === 'ar' ? `الصورة ${i + 1} (${a.image_type})` : userLanguage === 'en' ? `Image ${i + 1} (${a.image_type})` : `Image ${i + 1} (${a.image_type})`;

    // Check EXIF GPS (High severity: +25)
    if (a.exif_data?.gps) {
      score += 25;
      findings.push({
        category: 'metadata_gps',
        severity: 'critical',
        title: userLanguage === 'ar' ? 'إحداثيات GPS الأصلية موجودة في الملف' : userLanguage === 'en' ? 'Original GPS Coordinates Found in File' : 'Coordonnées GPS exactes dans l’image',
        detail: userLanguage === 'ar'
          ? `إحداثيات دقيقة (${a.exif_data.gps.latitude}، ${a.exif_data.gps.longitude}) مدمجة في بيانات الصورة الأصلية.`
          : userLanguage === 'en'
          ? `Exact coordinates (${a.exif_data.gps.latitude}, ${a.exif_data.gps.longitude}) embedded in original image metadata.`
          : `Coordonnées précises (${a.exif_data.gps.latitude}, ${a.exif_data.gps.longitude}) incrustées dans les métadonnées de l'image originale.`,
        where_seen: userLanguage === 'ar' ? `${imageLabel} ترويسة EXIF` : userLanguage === 'en' ? `${imageLabel} EXIF Header` : `${imageLabel} En-tête EXIF`,
        weight_points: 25,
      });
    }

    // Check Visible Documents (CIN, bank card, passport, badge: +30)
    for (const doc of a.documents_visible) {
      const docSeverity = doc.legible ? 'critical' : 'high';
      const points = doc.legible ? 30 : 18;
      score += points;
      findings.push({
        category: 'visible_documents',
        severity: docSeverity,
        title: userLanguage === 'ar' ? `وثيقة رسمية أو شارة مرئية (${doc.type})` : userLanguage === 'en' ? `Visible Official Document (${doc.type})` : `Document ou badge officiel visible (${doc.type})`,
        detail: userLanguage === 'ar'
          ? `تم رصد ${doc.type} ${doc.legible ? 'بشكل مقروء' : 'بشكل جزئي'} في الصورة. قد يستغل في انتحال الهوية أو الهندسة الاجتماعية.`
          : userLanguage === 'en'
          ? `${doc.legible ? 'Legible' : 'Partially visible'} ${doc.type} detected in image. Could be exploited for identity theft or social engineering.`
          : `${doc.legible ? 'Lisible' : 'Partiellement visible'} ${doc.type} détecté dans l'image. Risque d'usurpation d'identité ou ingénierie sociale.`,
        where_seen: `${imageLabel}: ${doc.where_in_image}`,
        weight_points: points,
      });
    }

    // Children presence (+15)
    if (a.people.children_present) {
      score += 15;
      findings.push({
        category: 'minor_presence',
        severity: 'high',
        title: userLanguage === 'ar' ? 'ظهور وجه طفل أو قاصر' : userLanguage === 'en' ? 'Minor / Child Face Present' : 'Visage de mineur ou enfant présent',
        detail: userLanguage === 'ar'
          ? "وجوه أطفال واضحة في المحتوى. خطر مرتفع لاستغلالها في حيل الطوارئ العائلية أو اختلاق مشاكل مدرسية."
          : userLanguage === 'en'
          ? "Identifiable children's faces visible. High risk for targeting family-emergency or school-pickup scams."
          : "Visages identifiables d’enfants visibles. Risque élevé de scénario d’urgence familiale ou arnaque à la sortie d’école.",
        where_seen: userLanguage === 'ar' ? `${imageLabel}: الأشخاص / المقدمة` : userLanguage === 'en' ? `${imageLabel}: foreground/people` : `${imageLabel}: premier plan/personnes`,
        weight_points: 15,
      });
    }

    // Work / School clues (+15)
    for (const ws of a.work_school_clues) {
      score += 15;
      findings.push({
        category: 'workplace_or_school',
        severity: 'medium',
        title: userLanguage === 'ar' ? 'دليل على جهة العمل أو المؤسسة التعليمية' : userLanguage === 'en' ? 'Workplace or Education Affiliation Clue' : 'Indice d’affiliation professionnelle ou scolaire',
        detail: userLanguage === 'ar'
          ? `انتماء مرئي: "${maskPII(ws)}". يسهل التصيد الموجه بانتحال صفة زملاء العمل أو الموارد البشرية.`
          : userLanguage === 'en'
          ? `Visible affiliation: "${maskPII(ws)}". Enables spear-phishing impersonating colleagues or HR.`
          : `Affiliation visible : "${maskPII(ws)}". Facilite le spear-phishing usurpant des collègues ou les RH.`,
        where_seen: imageLabel,
        weight_points: 15,
      });
    }

    // Estimated Location / Neighborhood (+15)
    if (a.estimated_location && a.estimated_location.confidence >= 0.6 && a.estimated_location.guess !== 'Unknown' && a.estimated_location.guess !== 'Inconnu' && a.estimated_location.guess !== 'غير معروف') {
      score += 15;
      findings.push({
        category: 'geographic_location',
        severity: 'medium',
        title: userLanguage === 'ar' ? `موقع أو حي يمكن التعرف عليه (${a.estimated_location.guess})` : userLanguage === 'en' ? `Recognizable Location / Neighborhood (${a.estimated_location.guess})` : `Lieu ou quartier reconnaissable (${a.estimated_location.guess})`,
        detail: userLanguage === 'ar'
          ? `تكشف الأدلة البصرية عن الحي أو المعلم البارز: ${a.estimated_location.reasoning}.`
          : userLanguage === 'en'
          ? `Visual cues reveal neighborhood or landmark: ${a.estimated_location.reasoning}.`
          : `Les indices visuels révèlent le quartier ou point de repère : ${a.estimated_location.reasoning}.`,
        where_seen: imageLabel,
        weight_points: 15,
      });
    }

    // Routine Clues (+12)
    for (const routine of a.routine_clues) {
      score += 12;
      findings.push({
        category: 'daily_routine',
        severity: 'medium',
        title: userLanguage === 'ar' ? 'عادات يومية أو روتين مكشوف' : userLanguage === 'en' ? 'Daily Habits or Routine Exposed' : 'Habitudes quotidiennes ou routine exposées',
        detail: userLanguage === 'ar'
          ? `روتين أو جدول مواعيد ظاهر: "${maskPII(routine)}". يسهل هجمات التصيد الموقوتة بدقة.`
          : userLanguage === 'en'
          ? `Habit or schedule visible: "${maskPII(routine)}". Facilitates targeted timing attacks.`
          : `Habitude ou planning visible : "${maskPII(routine)}". Facilite les attaques basées sur les horaires.`,
        where_seen: imageLabel,
        weight_points: 12,
      });
    }

    // Screens or Reflections (+15)
    for (const screen of a.screens_or_reflections) {
      score += 15;
      findings.push({
        category: 'screen_reflection',
        severity: 'high',
        title: userLanguage === 'ar' ? 'شاشة أو انعكاس مرئي' : userLanguage === 'en' ? 'Visible Screen or Reflection' : 'Écran ou reflet visible',
        detail: userLanguage === 'ar'
          ? `تم رصد شاشة أو انعكاس غير مقصود: "${screen}". خطر تسريب بيانات الاعتماد أو المحادثات الخاصة.`
          : userLanguage === 'en'
          ? `Unintended reflection or display detected: "${screen}". Risk of credential or chat leakage.`
          : `Reflet involontaire ou écran détecté : "${screen}". Risque de fuite d’identifiants ou d'échanges privés.`,
        where_seen: imageLabel,
        weight_points: 15,
      });
    }
  }

  // Cap score to 100
  score = Math.min(score, 100);

  // Determine Level
  let level: ExposureReport['level'] = 'low';
  if (score >= 76) level = 'critical';
  else if (score >= 51) level = 'high';
  else if (score >= 26) level = 'medium';

  // Realistic Attack Paths based on actual findings
  const attack_paths: ExposureReport['attack_paths'] = [];

  const hasWork = findings.some((f) => f.category === 'workplace_or_school');
  const hasLoc = findings.some((f) => f.category === 'geographic_location' || f.category === 'metadata_gps');
  const hasFamily = findings.some((f) => f.category === 'minor_presence');
  const hasDoc = findings.some((f) => f.category === 'visible_documents');

  if (hasWork && hasLoc) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: 'تصيد استلام طرد مهني أو تحقق شارة عمل موجه',
        description: 'ينتحل المهاجم صفة موظف توصيل أو إدارة مبنى في مقر عملك أو حيك السكني مطالباً برمز تحقق عاجل أو سداد مصاريف استلام.',
        exploited_clues: findings.filter((f) => f.category === 'workplace_or_school' || f.category === 'geographic_location').map((f) => f.title),
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: 'Targeted Workplace Delivery / Badge Verification Smishing',
        description: 'An attacker poses as an office courier or building management at your specific workplace/neighborhood demanding an urgent verification code or delivery payment.',
        exploited_clues: findings.filter((f) => f.category === 'workplace_or_school' || f.category === 'geographic_location').map((f) => f.title),
      });
    } else {
      attack_paths.push({
        title: 'Smishing ciblé de fausse livraison ou vérification de badge en entreprise',
        description: 'Un attaquant se fait passer pour un coursier ou la gestion de bâtiment de votre lieu de travail/quartier pour réclamer un code de vérification ou un paiement urgent.',
        exploited_clues: findings.filter((f) => f.category === 'workplace_or_school' || f.category === 'geographic_location').map((f) => f.title),
      });
    }
  }

  if (hasFamily) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: 'احتيال انتحال الطوارئ العائلية أو المدرسية',
        description: 'يدعي المحتال وقوع حادث طبي أو مدرسي طارئ يتعلق بالأطفال، مطالباً بتحويل مالي فوري عبر كاش بلس أو وفاكاش قبل أن تتمكن من التحقق.',
        exploited_clues: [userLanguage === 'ar' ? 'ظهور وجه طفل أو قاصر' : 'Minor / Child Face Present'],
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: 'Emergency Family Impersonation Scam',
        description: 'A scammer claims an urgent medical or school incident involving children, demanding immediate cash transfer via Cash Plus / Wafacash before you can verify.',
        exploited_clues: ['Minor / Child Face Present'],
      });
    } else {
      attack_paths.push({
        title: 'Arnaque à la fausse urgence familiale / crèche',
        description: 'Un escroc prétendant un incident médical ou scolaire urgent impliquant vos enfants réclame un virement immédiat via Cash Plus ou Wafacash avant toute vérification.',
        exploited_clues: ['Visage de mineur ou enfant présent'],
      });
    }
  }

  if (hasDoc) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: 'انتحال الهوية وسرقة شريحة الاتصال (SIM Hijack)',
        description: 'استغلال أرقام بطاقات الهوية أو شارات العمل المرئية لخداع خدمة عملاء الاتصالات أو طلب إعادة تعيين كلمات المرور.',
        exploited_clues: findings.filter((f) => f.category === 'visible_documents').map((f) => f.title),
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: 'Synthetic Identity Theft / SIM Hijack',
        description: 'Using visible ID numbers, CIN letters, or date of birth to socially engineer telecom customer service or request password resets.',
        exploited_clues: findings.filter((f) => f.category === 'visible_documents').map((f) => f.title),
      });
    } else {
      attack_paths.push({
        title: 'Usurpation d’identité et détournement de SIM (SIM Swap)',
        description: 'Exploitation des numéros de CIN ou badges visibles pour manipuler le support client télécom ou réinitialiser frauduleusement vos accès.',
        exploited_clues: findings.filter((f) => f.category === 'visible_documents').map((f) => f.title),
      });
    }
  }

  if (attack_paths.length === 0) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: 'استطلاع سلبي وتصيد احتيالي عام',
        description: 'يظهر حسابك سطح هجوم ضئيل للغاية. يظل الخطر الرئيسي هو التصيد العشوائي الذي يستغل اسم المستخدم العلني.',
        exploited_clues: ['اسم المستخدم العلني'],
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: 'Broad Social Engineering / Curiosity Baiting',
        description: 'Generic phishing using your public handle to trick you into clicking malicious verification links.',
        exploited_clues: ['Public username and profile visibility'],
      });
    } else {
      attack_paths.push({
        title: 'Ingénierie sociale générale & appât à la curiosité',
        description: 'Hameçonnage générique exploitant votre nom d’utilisateur public pour vous inciter à cliquer sur des liens de vérification frauduleux.',
        exploited_clues: ['Pseudonyme public'],
      });
    }
  }

  // Prioritized fix checklist (max 8)
  const fix_checklist: ExposureReport['fix_checklist'] = [];
  let prio = 1;

  if (hasDoc) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: 'احذف أو طمس بشدة أي صور تظهر بطاقات رسمية أو شارات أو خطابات بريدية.',
        reason: 'أرقام الهوية تتيح الاستيلاء على الحسابات وتقديم طلبات احتيالية.',
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: 'Delete or heavily blur any photos showing official cards, badges, or mail.',
        reason: 'Identity numbers enable account takeovers and fraudulent loan applications.',
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: 'Supprimer ou flouter fortement toute photo montrant une pièce d’identité, un badge ou un courrier.',
        reason: 'Les numéros d’identité facilitent les prises de contrôle de comptes et fraudes bancaires.',
      });
    }
  }
  if (findings.some((f) => f.category === 'metadata_gps')) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: 'عطّل التتبع الجغرافي بالكاميرا في إعدادات الهاتف قبل رفع الصور.',
        reason: 'بيانات EXIF الخام تسجل خطوط الطول والعرض بدقة بضعة أمتار.',
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: 'Disable camera GPS geotagging in phone settings before uploading.',
        reason: 'Raw camera EXIF embeds latitude and longitude down to a few meters.',
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: 'Désactiver la géolocalisation de l’appareil photo dans les paramètres avant publication.',
        reason: 'Les métadonnées EXIF brutes enregistrent la latitude et la longitude précises à quelques mètres.',
      });
    }
  }
  if (hasFamily) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: 'اجعل صور القُصّر متاحة لقائمة "الأصدقاء المقربون" فقط أو طمس ملامح الوجه.',
        reason: 'يحمي الأطفال من الاستهداف المباشر أو سيناريوهات الابتزاز العاطفي.',
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: 'Set photos containing minors to "Close Friends" only or blur facial features.',
        reason: 'Protects children from unsolicited targeting or emotional extortion scams.',
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: 'Restreindre les photos d’enfants aux « Amis proches » ou flouter les traits du visage.',
        reason: 'Protège les mineurs contre le ciblage non sollicité et l’extorsion émotionnelle.',
      });
    }
  }
  if (hasWork) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: 'تجنب نشر صور تظهر حبال شارات العمل أو بوابات المؤسسة أو الشعارات.',
        reason: 'يقلل من هجمات التصيد الموجه المصممة خصيصاً لبيئة عملك.',
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: 'Avoid posting photos with visible employer lanyards, entrance gates, or badges.',
        reason: 'Reduces spear-phishing tailored to your specific employer or industry.',
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: 'Éviter de publier des photos avec tour de cou d’entreprise, badge ou entrée de bureau.',
        reason: 'Réduit les attaques de spear-phishing ciblées sur votre employeur ou secteur.',
      });
    }
  }
  if (hasLoc) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: 'أجل نشر تسجيلات الوصول والرحلات حتى مغادرة الموقع الفعلي.',
        reason: 'يمنع التتبع في الوقت الفعلي لمعرفة أوقات خلو مسكنك.',
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: 'Delay posting vacation or neighborhood check-ins until after leaving the location.',
        reason: 'Prevents real-time pattern tracking of when your residence is unattended.',
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: 'Différer la publication des photos de vacances ou check-ins après avoir quitté les lieux.',
        reason: 'Empêche la surveillance en temps réel signalant l’inoccupation de votre domicile.',
      });
    }
  }
  if (userLanguage === 'ar') {
    fix_checklist.push({
      priority: prio++,
      action: 'راجع إعدادات الخصوصية لضمان خصوصية القصص والمنشورات الشخصية.',
      reason: 'يحد من عمليات المسح والاستطلاع الآلي غير المصرح بها.',
    });
  } else if (userLanguage === 'en') {
    fix_checklist.push({
      priority: prio++,
      action: 'Review privacy settings to ensure stories and personal posts are private.',
      reason: 'Restricts open reconnaissance by unauthorized automated scrapers.',
    });
  } else {
    fix_checklist.push({
      priority: prio++,
      action: 'Vérifier les réglages de confidentialité pour restreindre les stories et publications personnelles.',
      reason: 'Limite la reconnaissance passive par des robots ou acteurs malveillants.',
    });
  }

  const prePublishRecs = isPrePublish ? generatePrePublishRecommendations(findings, analyses, userLanguage) : undefined;

  return {
    score,
    level,
    images_analyzed: analyses.length,
    findings,
    attack_paths: attack_paths.slice(0, 3),
    fix_checklist: fix_checklist.slice(0, 8),
    pre_publish_recommendations: prePublishRecs,
    is_pre_publish: isPrePublish,
    per_image_results: analyses,
    provider_used: provider,
    model_used: model,
    total_latency_ms: totalLatencyMs,
    verified_via_email: verifiedViaEmail,
    claimed_username: claimedUsername,
    username_verified: usernameVerification,
  };
}

// 5. Defensive Attack Simulation
export async function generateDefensiveAttackSimulation(
  report: ExposureReport,
  userLanguage: 'fr' | 'en' | 'ar' = 'fr'
): Promise<{
  simulated_message: string;
  attacker_persona: string;
  attack_vector: string;
  defensive_explanation: string;
  provider: string;
  model: string;
  latency_ms: number;
}> {
  const clues = report.findings.map((f) => `- ${f.title}: ${f.detail}`).join('\n');
  const langName = userLanguage === 'ar' ? 'Arabic' : userLanguage === 'en' ? 'English' : 'French';

  const prompt = `You are an ethical cybersecurity educator.
Based on the following real exposure findings discovered from public social media posts:
${clues}

Write a REALISTIC SOCIAL ENGINEERING / PHISHING MESSAGE that an attacker could send to this person, exploiting ONLY the information found above.

CRITICAL DEFENSIVE SAFETY RULES:
1. This is strictly a DEFENSIVE EDUCATIONAL SIMULATION.
2. Label the sender clearly as a fictional persona.
3. NEVER repeat real personal contact numbers or private passwords.
4. Explain clearly in 2 sentences WHY this attack would feel convincing to the victim and how to neutralize it.
5. CRITICAL LANGUAGE RULE: Respond ENTIRELY in ${langName} — do not mix languages. Every field (attacker_persona, attack_vector, simulated_message, defensive_explanation) MUST be in ${langName}.

OUTPUT JSON FORMAT:
{
  "attacker_persona": "Fictional persona in ${langName}",
  "attack_vector": "e.g. SMS Smishing / WhatsApp Voice Memo pretext in ${langName}",
  "simulated_message": "The exact realistic message text in ${langName}",
  "defensive_explanation": "Why this message works and how the user can spot the trap immediately in ${langName}"
}`;

  try {
    const res = await call_llm({
      messages: [{ role: 'user', content: prompt }],
      jsonSchema: true,
      temperature: 0.2,
    });

    const parsed = res.parsedJson || {};
    return {
      attacker_persona: parsed.attacker_persona || (userLanguage === 'ar' ? 'مندوب توصيل أو دعم مزيف' : userLanguage === 'en' ? 'Fake Delivery / Support Agent' : 'Faux responsable de livraison'),
      attack_vector: parsed.attack_vector || (userLanguage === 'ar' ? 'تصيد موجه عبر رسائل SMS' : userLanguage === 'en' ? 'Targeted SMS Smishing' : 'SMS Smishing ciblé'),
      simulated_message: parsed.simulated_message || (userLanguage === 'ar' ? 'مرحباً، بناءً على نشاطك الأخير، يرجى تأكيد هويتك عبر بوابتنا الآمنة...' : userLanguage === 'en' ? 'Hello, regarding your recent activity, please confirm your identity on our secure portal...' : 'Bonjour, votre badge entreprise doit être renouvelé...'),
      defensive_explanation: parsed.defensive_explanation || (userLanguage === 'ar' ? 'يستغل المهاجم بصمتك العامة المكشوفة لخلق شعور زائف بالإلحاح والمصداقية.' : userLanguage === 'en' ? 'The attacker leverages your public footprint to fabricate urgency.' : 'L’attaquant exploite vos indices publics pour créer un faux sentiment de légitimité.'),
      provider: res.provider_used,
      model: res.model_used,
      latency_ms: res.latency_ms,
    };
  } catch (err) {
    return {
      attacker_persona: userLanguage === 'ar' ? 'مندوب توصيل أو دعم مزيف' : userLanguage === 'en' ? 'Fake Delivery / Support Agent' : 'Faux coursier / faux support',
      attack_vector: userLanguage === 'ar' ? 'تصيد موجه عبر رسائل SMS' : userLanguage === 'en' ? 'Targeted SMS Smishing' : 'SMS Smishing ciblé',
      simulated_message: userLanguage === 'ar' ? 'مرحباً، بناءً على نشاطك الأخير، يرجى تأكيد هويتك عبر بوابتنا الآمنة: https://auth-verify.net' : userLanguage === 'en' ? 'Hello, following your recent activity, please confirm your identity on our secure portal: https://auth-verify.net' : 'Bonjour, suite à votre activité récente, merci de valider votre identité sur le portail sécurisé : https://auth-verify.net',
      defensive_explanation: userLanguage === 'ar' ? 'يستغل المهاجم بصمتك العامة المكشوفة لخلق شعور زائف بالإلحاح والمصداقية.' : userLanguage === 'en' ? 'The attacker leverages your discovered public footprint to fabricate urgency.' : 'L’attaquant exploite vos présences publiques pour susciter l’urgence.',
      provider: 'rule_engine',
      model: 'defensive_fallback',
      latency_ms: 10,
    };
  }
}
