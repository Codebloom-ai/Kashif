import JSZip from 'jszip';
import exifr from 'exifr';
import { FullExportData, LocationTimelineItem, ExposureReport, ExposureImageAnalysis } from './types.ts';
import { analyzeExposureImage } from './exposure.ts';
import { maskPII } from './masking.ts';

// Helper to safely parse JSON from UTF-8 string or fix Instagram's latin1/utf8 escaped text
function parseInstagramJson(rawStr: string): any {
  try {
    // Instagram exports sometimes encode UTF-8 as escaped latin1 bytes \u00e9 etc.
    const parsed = JSON.parse(rawStr);
    return parsed;
  } catch (err) {
    return null;
  }
}

// Decode Instagram's escaped UTF-8 strings if needed
function fixIgEncoding(str: string): string {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
}

export async function parseSocialArchiveZip(zipBuffer: Buffer): Promise<{
  exportData: FullExportData;
  photos: Array<{ buffer: Buffer; name: string; mimeType: string }>;
}> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipBuffer);

  const fileNames = Object.keys(loadedZip.files);
  const rawFileTree = fileNames.slice(0, 50);

  let platform: FullExportData['platform'] = 'generic';
  if (fileNames.some((f) => f.includes('instagram') || f.includes('personal_information'))) {
    platform = 'instagram';
  } else if (fileNames.some((f) => f.includes('facebook') || f.includes('your_facebook_activity'))) {
    platform = 'facebook';
  } else if (fileNames.some((f) => f.includes('tiktok') || f.includes('user_data'))) {
    platform = 'tiktok';
  }

  const exportData: FullExportData = {
    platform,
    account: {
      username: '',
    },
    captions_history: [],
    comments_history: [],
    search_history: [],
    location_timeline: [],
    ad_interests: [],
    total_posts_found: 0,
    total_comments_found: 0,
    total_searches_found: 0,
    total_photos_found: 0,
    analyzed_photos_count: 0,
    raw_file_tree: rawFileTree,
  };

  const imageFiles: Array<{ name: string; file: JSZip.JSZipObject }> = [];

  for (const [relativePath, file] of Object.entries(loadedZip.files)) {
    if (file.dir) continue;
    const lower = relativePath.toLowerCase();

    // 1. Account / Profile Info
    if (
      lower.includes('personal_information.json') ||
      lower.includes('profile_information.json') ||
      lower.includes('account_information.json') ||
      lower.endsWith('profile.json')
    ) {
      try {
        const content = await file.async('string');
        const json = parseInstagramJson(content);
        if (json) {
          const profileObj = json.profile_user?.[0]?.string_map_data || json;
          exportData.account.username =
            profileObj['Username']?.value ||
            json.username ||
            profileObj['Nom d’utilisateur']?.value ||
            exportData.account.username;
          exportData.account.full_name =
            profileObj['Name']?.value || json.name || profileObj['Nom']?.value;
          exportData.account.bio =
            profileObj['Bio']?.value || json.bio || profileObj['Biographie']?.value;
          exportData.account.email =
            profileObj['Email']?.value || json.email || profileObj['Adresse e-mail']?.value;
          exportData.account.phone =
            profileObj['Phone Number']?.value || json.phone_number || profileObj['Numéro de téléphone']?.value;
          exportData.account.created_at =
            profileObj['Date joined']?.value || json.registration_date || 'Past history';
        }
      } catch (e) {
        console.warn('Error parsing profile json:', e);
      }
    }

    // 2. Posts and Captions
    if (lower.includes('posts_') && lower.endsWith('.json') || lower.includes('content/posts') && lower.endsWith('.json')) {
      try {
        const content = await file.async('string');
        const json = parseInstagramJson(content);
        if (Array.isArray(json)) {
          exportData.total_posts_found += json.length;
          for (const item of json) {
            const mediaList = item.media || [item];
            for (const m of mediaList) {
              const caption = fixIgEncoding(m.title || item.title || m.caption || '');
              const timestamp = m.creation_timestamp
                ? new Date(m.creation_timestamp * 1000).toISOString().split('T')[0]
                : undefined;
              const locationName = m.location_data?.name || m.location;

              if (caption) {
                exportData.captions_history.push({
                  text: caption,
                  timestamp,
                  location_name: locationName,
                });
              }

              if (locationName) {
                exportData.location_timeline.push({
                  timestamp: timestamp || 'Publication passée',
                  name: locationName,
                  city: locationName.includes(',') ? locationName.split(',')[0].trim() : undefined,
                  source: 'Instagram Post Location Tag',
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Error parsing posts json:', e);
      }
    }

    // 3. Comments History
    if (lower.includes('comments') && lower.endsWith('.json')) {
      try {
        const content = await file.async('string');
        const json = parseInstagramJson(content);
        const commentsList = json.comments_post_comments || json.post_comments || (Array.isArray(json) ? json : []);
        if (Array.isArray(commentsList)) {
          exportData.total_comments_found += commentsList.length;
          for (const c of commentsList.slice(0, 50)) {
            const commentText =
              c.string_map_data?.Comment?.value ||
              c.data?.[0]?.comment?.comment ||
              c.comment ||
              '';
            const timestamp = c.string_map_data?.Comment?.timestamp
              ? new Date(c.string_map_data.Comment.timestamp * 1000).toISOString().split('T')[0]
              : undefined;
            if (commentText) {
              exportData.comments_history.push({
                text: fixIgEncoding(commentText),
                timestamp,
                to_account: c.title || undefined,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Error parsing comments json:', e);
      }
    }

    // 4. Search History
    if (lower.includes('searches') && lower.endsWith('.json') || lower.includes('recent_searches.json')) {
      try {
        const content = await file.async('string');
        const json = parseInstagramJson(content);
        const searches = json.searches_user || json.recent_searches || (Array.isArray(json) ? json : []);
        if (Array.isArray(searches)) {
          exportData.total_searches_found += searches.length;
          for (const s of searches.slice(0, 30)) {
            const query = s.string_map_data?.Search?.value || s.search_click || s.query;
            const timestamp = s.string_map_data?.Search?.timestamp
              ? new Date(s.string_map_data.Search.timestamp * 1000).toISOString().split('T')[0]
              : undefined;
            if (query) {
              exportData.search_history.push({ query: fixIgEncoding(query), timestamp });
            }
          }
        }
      } catch (e) {
        console.warn('Error parsing searches json:', e);
      }
    }

    // 5. Explicit Location History
    if (lower.includes('location_history.json') || lower.includes('past_instagram_insights') || lower.includes('device_locations')) {
      try {
        const content = await file.async('string');
        const json = parseInstagramJson(content);
        const locations = json.location_history || (Array.isArray(json) ? json : []);
        if (Array.isArray(locations)) {
          for (const loc of locations) {
            const name = loc.name || loc.city || loc.string_map_data?.Location?.value || 'Emplacement enregistré';
            const timestamp = loc.timestamp || loc.string_map_data?.Time?.timestamp;
            const dateStr = timestamp
              ? new Date(timestamp * 1000).toISOString().split('T')[0]
              : 'Historique de connexion';
            exportData.location_timeline.push({
              timestamp: dateStr,
              name,
              lat: loc.latitude,
              lon: loc.longitude,
              source: 'Instagram Device & Session Tracking',
            });
          }
        }
      } catch (e) {
        console.warn('Error parsing location history json:', e);
      }
    }

    // 6. Ad Interests & Profiling
    if (lower.includes('ads_interests') || lower.includes('topics_your_activity_suggests')) {
      try {
        const content = await file.async('string');
        const json = parseInstagramJson(content);
        const topics = json.inferred_data_ig_interests || json.topics || (Array.isArray(json) ? json : []);
        if (Array.isArray(topics)) {
          for (const t of topics.slice(0, 20)) {
            const topicName = t.string_map_data?.Name?.value || t.name || t;
            if (typeof topicName === 'string') {
              exportData.ad_interests.push(fixIgEncoding(topicName));
            }
          }
        }
      } catch (e) {
        console.warn('Error parsing ad interests json:', e);
      }
    }

    // 7. Image files collection
    if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp')
    ) {
      exportData.total_photos_found += 1;
      imageFiles.push({ name: relativePath, file });
    }
  }

  // Pick up to 20 most relevant photos to analyze
  const selectedPhotos: Array<{ buffer: Buffer; name: string; mimeType: string }> = [];
  const limitPhotos = Math.min(imageFiles.length, 20);

  for (let i = 0; i < limitPhotos; i++) {
    const item = imageFiles[i];
    try {
      const buf = await item.file.async('nodebuffer');
      const ext = item.name.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      selectedPhotos.push({
        buffer: buf,
        name: item.name.split('/').pop() || `photo_${i + 1}.jpg`,
        mimeType,
      });
    } catch (err) {
      console.warn('Could not extract image buffer:', err);
    }
  }

  exportData.analyzed_photos_count = selectedPhotos.length;

  return {
    exportData,
    photos: selectedPhotos,
  };
}

// Compile a comprehensive full-export exposure report
export async function compileFullExportReport(
  exportData: FullExportData,
  photos: Array<{ buffer: Buffer; name: string; mimeType: string }>,
  verifiedViaEmail = false,
  totalLatencyMs = 2400,
  userLanguage: 'fr' | 'en' | 'ar' = 'fr'
): Promise<ExposureReport> {
  let score = 0; // Deterministic calculation calibrated to risk factors
  const findings: ExposureReport['findings'] = [];
  const imageAnalyses: ExposureImageAnalysis[] = [];

  const username = exportData.account.username || (userLanguage === 'ar' ? 'مستخدم' : userLanguage === 'en' ? 'User' : 'Utilisateur');

  // 1. Phone number (Critical smishing / SIM swapping vector: +18)
  if (exportData.account.phone && exportData.account.phone.trim().length > 0) {
    score += 18;
    findings.push({
      category: 'contact_leakage',
      severity: 'critical',
      title: userLanguage === 'ar'
        ? 'رقم الهاتف المحمول مرتبط بالملف الشخصي'
        : userLanguage === 'en'
        ? 'Mobile Phone Number Linked to Profile'
        : 'Numéro de téléphone mobile lié au profil',
      detail: userLanguage === 'ar'
        ? `الرقم "${maskPII(exportData.account.phone)}" مكشوف في البيانات التقنية. ناقل مباشر لهجمات التصيد عبر الرسائل القصيرة (Smishing) ومحاولات سرقة شريحة الاتصال (SIM swap).`
        : userLanguage === 'en'
        ? `Phone number "${maskPII(exportData.account.phone)}" exposed in technical data. Direct attack vector for Smishing (SMS phishing) and SIM swap attempts.`
        : `Numéro "${maskPII(exportData.account.phone)}" exposé dans les données techniques. Vecteur direct pour les attaques de Smishing (SMS phishing) et tentative de SIM swap.`,
      where_seen: userLanguage === 'ar' ? 'تصدير JSON: personal_information.json' : 'Export JSON: personal_information.json',
      weight_points: 18,
    });
  }

  // 2. Email address (+8)
  if (exportData.account.email && exportData.account.email.trim().length > 0) {
    score += 8;
    findings.push({
      category: 'contact_leakage',
      severity: 'high',
      title: userLanguage === 'ar'
        ? 'البريد الإلكتروني الشخصي موجود في بيانات الحساب'
        : userLanguage === 'en'
        ? 'Personal Email Present in Account Metadata'
        : 'Email personnel présent dans les métadonnées du compte',
      detail: userLanguage === 'ar'
        ? `البريد "${maskPII(exportData.account.email)}" موجود في الأرشيف. يمكن استغلاله في هجمات حشو بيانات الاعتماد أو محاولات استرجاع الحساب غير المصرح بها.`
        : userLanguage === 'en'
        ? `Email address "${maskPII(exportData.account.email)}" found in export. Usable for credential stuffing or unauthorized account recovery attempts.`
        : `Adresse email "${maskPII(exportData.account.email)}" trouvée dans l'export. Utilisable pour du credential stuffing ou tentatives de récupération de compte.`,
      where_seen: userLanguage === 'ar' ? 'تصدير JSON: personal_information.json' : 'Export JSON: personal_information.json',
      weight_points: 8,
    });
  }

  // 3. Bio & Identifiers (+4 to +28)
  if (exportData.account.bio && exportData.account.bio.trim().length > 0) {
    const bioText = exportData.account.bio;
    const hasCin = /CIN|#BK|\b[A-Z]{1,2}\d{5,7}\b/i.test(bioText);
    const hasWork = /@|technopark|fintech|ocp|attijariwafa|maroc telecom|alstom|um6p|engineer|manager|director/i.test(bioText);
    const hasFamily = /dad|mom|père|mère|enfants|kids|papa|maman/i.test(bioText);

    if (hasCin) {
      score += 20;
      findings.push({
        category: 'visible_documents',
        severity: 'critical',
        title: userLanguage === 'ar'
          ? 'رقم بطاقة الهوية الوطنية أو وثيقة رسمية في النبذة الشخصية'
          : userLanguage === 'en'
          ? 'National ID Number or Official Document in Bio'
          : 'Numéro de CIN ou document officiel dans la biographie',
        detail: userLanguage === 'ar'
          ? `رقم بطاقة الهوية يظهر بوضوح في النبذة الشخصية: "${maskPII(bioText)}".`
          : userLanguage === 'en'
          ? `National ID or official document number appears in plaintext in your bio: "${maskPII(bioText)}".`
          : `Le numéro de pièce d'identité apparaît en clair dans votre biographie : "${maskPII(bioText)}".`,
        where_seen: userLanguage === 'ar' ? 'تصدير JSON: profile.json' : 'Export JSON: profile.json',
        weight_points: 20,
      });
    }

    if (hasWork || hasFamily) {
      score += 8;
      findings.push({
        category: 'workplace_or_school',
        severity: 'medium',
        title: userLanguage === 'ar'
          ? 'الانتماء المهني أو الوضع العائلي في النبذة الشخصية'
          : userLanguage === 'en'
          ? 'Professional Affiliation or Family Details in Bio'
          : 'Affiliation professionnelle ou situation familiale dans la bio',
        detail: userLanguage === 'ar'
          ? `تفاصيل مرئية: "${maskPII(bioText)}". تتيح بناء سيناريوهات هندسة اجتماعية موجهة.`
          : userLanguage === 'en'
          ? `Visible details: "${maskPII(bioText)}". Fuels targeted social engineering pretexts.`
          : `Détails visibles : "${maskPII(bioText)}". Permet d'alimenter un scénario d'ingénierie sociale ciblé.`,
        where_seen: userLanguage === 'ar' ? 'تصدير JSON: profile.json' : 'Export JSON: profile.json',
        weight_points: 8,
      });
    } else if (!hasCin) {
      score += 4;
      findings.push({
        category: 'profile_bio',
        severity: 'low',
        title: userLanguage === 'ar'
          ? 'سجل النبذة الشخصية العامة'
          : userLanguage === 'en'
          ? 'Public Biography History'
          : 'Historique de biographie publique',
        detail: userLanguage === 'ar'
          ? `المحتوى: "${maskPII(bioText)}".`
          : userLanguage === 'en'
          ? `Content: "${maskPII(bioText)}".`
          : `Contenu : "${maskPII(bioText)}".`,
        where_seen: userLanguage === 'ar' ? 'تصدير JSON: profile.json' : 'Export JSON: profile.json',
        weight_points: 4,
      });
    }
  }

  // 4. Location Timeline (+8 to +22)
  if (exportData.location_timeline && exportData.location_timeline.length > 0) {
    const locCount = exportData.location_timeline.length;
    const hasDeviceTracking = exportData.location_timeline.some(
      (l) => l.source?.includes('Device') || l.source?.includes('Session') || (l.lat && l.lon)
    );

    let locPoints = 8;
    let locSeverity: 'medium' | 'high' | 'critical' = 'medium';
    let locTitle = userLanguage === 'ar'
      ? `سجل المواقع الجغرافية (تم رصد ${locCount} موقع)`
      : userLanguage === 'en'
      ? `Geographic Location History (${locCount} public location(s) logged)`
      : `Historique de géolocalisation (${locCount} lieu(x) public(s) répertorié(s))`;

    if (hasDeviceTracking || locCount >= 5) {
      locPoints = 22;
      locSeverity = 'critical';
      locTitle = userLanguage === 'ar'
        ? `تتبع جغرافي مكثف (تم رصد ${locCount} مواقع وجلسات)`
        : userLanguage === 'en'
        ? `Intensive Geographic Tracking (${locCount} locations & sessions logged)`
        : `Traçage géographique intensif (${locCount} lieux et sessions tracés)`;
    } else if (locCount >= 3) {
      locPoints = 12;
      locSeverity = 'high';
      locTitle = userLanguage === 'ar'
        ? `سجل التنقلات المتكررة (تم رصد ${locCount} مواقع)`
        : userLanguage === 'en'
        ? `Frequent Travel & Location History (${locCount} locations logged)`
        : `Historique de déplacements récurrents (${locCount} lieux répertoriés)`;
    }

    score += locPoints;
    const topLocations = exportData.location_timeline
      .slice(0, 3)
      .map((l) => `${l.name} (${l.timestamp})`)
      .join(', ');

    findings.push({
      category: 'geographic_location',
      severity: locSeverity,
      title: locTitle,
      detail: userLanguage === 'ar'
        ? `يكشف ملف التصدير عن تنقلاتك: ${topLocations}.`
        : userLanguage === 'en'
        ? `Export archive reveals your movements: ${topLocations}.`
        : `L'export révèle vos déplacements : ${topLocations}.`,
      where_seen: userLanguage === 'ar' ? 'تصدير JSON: سجل المواقع والمنشورات' : userLanguage === 'en' ? 'Export JSON: location_history & tagged posts' : 'Export JSON: location_history & tagged posts',
      weight_points: locPoints,
    });
  }

  // 5. Search History (+6 to +14)
  if (exportData.search_history && exportData.search_history.length > 0) {
    const sensitiveRegex = /cin|passeport|opposition|carte|guichet|crèche|garderie|amana|virement|banque|police/i;
    const sensitiveSearches = exportData.search_history.filter((s) => sensitiveRegex.test(s.query));

    if (sensitiveSearches.length > 0) {
      score += 14;
      const sample = sensitiveSearches.slice(0, 3).map((s) => `"${maskPII(s.query)}"`).join(', ');
      findings.push({
        category: 'search_intent',
        severity: 'high',
        title: userLanguage === 'ar'
          ? `عمليات بحث حساسة وإجراءات خاصة (${sensitiveSearches.length} استعلامات حرجة)`
          : userLanguage === 'en'
          ? `Sensitive Searches and Private Matters (${sensitiveSearches.length} critical queries)`
          : `Recherches sensibles et démarches privées (${sensitiveSearches.length} requêtes critiques)`,
        detail: userLanguage === 'ar'
          ? `استعلامات حساسة محفوظة: ${sample}. تكشف عن معاملات إدارية أو بنكية أو أسرية قابلة للاستغلال كذرائع طارئة.`
          : userLanguage === 'en'
          ? `Sensitive queries preserved: ${sample}. Reveals administrative, banking, or family affairs weaponizable for urgent pretexts.`
          : `Requêtes sensibles conservées : ${sample}. Révèle des démarches administratives, bancaires ou familiales exploitables pour des prétextes d'urgence.`,
        where_seen: 'Export JSON: recent_searches.json',
        weight_points: 14,
      });
    } else {
      score += 6;
      const sample = exportData.search_history.slice(0, 3).map((s) => `"${s.query}"`).join(', ');
      findings.push({
        category: 'search_intent',
        severity: 'low',
        title: userLanguage === 'ar'
          ? `سجل استعلامات البحث (${exportData.search_history.length} استعلام)`
          : userLanguage === 'en'
          ? `Search Query History (${exportData.search_history.length} queries)`
          : `Historique de requêtes de recherche (${exportData.search_history.length} requêtes)`,
        detail: userLanguage === 'ar'
          ? `عمليات بحث ذات اهتمام عام: ${sample}.`
          : userLanguage === 'en'
          ? `General interest searches: ${sample}.`
          : `Recherches d'intérêt général : ${sample}.`,
        where_seen: 'Export JSON: recent_searches.json',
        weight_points: 6,
      });
    }
  }

  // 6. Comments History (+4 to +12)
  if (exportData.comments_history && exportData.comments_history.length > 0) {
    const familyRegex = /pédiatre|crèche|bébé|enfant|fils|fille|famille|maman|papa/i;
    const workRegex = /bureau|sprint|collègue|8h30|demain matin|réunion|client|boulot/i;

    const hasFamily = exportData.comments_history.some((c) => familyRegex.test(c.text));
    const hasWork = exportData.comments_history.some((c) => workRegex.test(c.text));

    if (hasFamily) {
      score += 12;
      findings.push({
        category: 'minor_presence',
        severity: 'high',
        title: userLanguage === 'ar'
          ? 'الدائرة الأسرية والأقارب مكشوفة في التعليقات'
          : userLanguage === 'en'
          ? 'Family Circle and Dependents Revealed in Comments'
          : 'Cercle familial et proches révélés dans les commentaires',
        detail: userLanguage === 'ar'
          ? `تشير التعليقات العامة إلى محيطك الأسري أو أطفالك (طبيب أطفال، حضانة).`
          : userLanguage === 'en'
          ? `Public comments reference your family circle or children (pediatrician, daycare).`
          : `Des commentaires publics font référence à votre entourage familial ou enfants (pédiatre, crèche).`,
        where_seen: 'Export JSON: post_comments_1.json',
        weight_points: 12,
      });
    } else if (hasWork) {
      score += 8;
      findings.push({
        category: 'social_connections',
        severity: 'medium',
        title: userLanguage === 'ar'
          ? 'جداول العمل والاجتماعات الداخلية مكشوفة في التعليقات'
          : userLanguage === 'en'
          ? 'Work Schedule and Internal Meetings Disclosed in Comments'
          : 'Horaires et relations professionnelles dans les commentaires',
        detail: userLanguage === 'ar'
          ? `تكشف التعليقات العامة عن أوقات عملك أو اجتماعاتك الداخلية.`
          : userLanguage === 'en'
          ? `Public comments reveal your work hours or internal project meetings.`
          : `Des commentaires font référence à vos collègues et horaires de présence au bureau.`,
        where_seen: 'Export JSON: post_comments_1.json',
        weight_points: 8,
      });
    } else {
      score += 4;
      findings.push({
        category: 'social_connections',
        severity: 'low',
        title: userLanguage === 'ar'
          ? `التعليقات والتفاعلات العامة (${exportData.comments_history.length} تعليق)`
          : userLanguage === 'en'
          ? `Public Comments and Interactions (${exportData.comments_history.length} comments)`
          : `Commentaires et interactions publiques (${exportData.comments_history.length} commentaires)`,
        detail: userLanguage === 'ar'
          ? `تفاعلاتك العامة تكشف عن شبكة معارفك وجهات اتصالك.`
          : userLanguage === 'en'
          ? `Your public interactions reveal your personal contact network.`
          : `Vos interactions publiques révèlent votre réseau de contacts.`,
        where_seen: 'Export JSON: post_comments_1.json',
        weight_points: 4,
      });
    }
  }

  // 7. Ad Interests (+2 to +5)
  // Localize ad_interests if from simulated export
  const localizedAdInterests = (exportData.ad_interests || []).map((ad) => {
    if (userLanguage === 'en') {
      if (ad.includes('Banques et crédits')) return 'Morocco banking & consumer loans';
      if (ad.includes('Immobilier et logements')) return 'Casablanca real estate & housing';
      if (ad.includes('Voyages et séjours')) return 'Marrakech travel & vacation stays';
      if (ad.includes('Véhicules d\'occasion')) return 'Used cars & vehicle leasing';
      if (ad.includes('Éducation et écoles')) return 'Education & private schools';
      if (ad.includes('Technologie et innovation')) return 'Technology & innovation';
      if (ad.includes('Design graphique')) return 'Graphic & UX Design';
      if (ad.includes('Cafés de spécialité')) return 'Specialty coffee & roasteries';
      if (ad.includes('Matériel informatique')) return 'IT hardware & displays';
      if (ad.includes('Logiciels 3D')) return '3D software & computer graphics';
      if (ad.includes('Photographie argentique')) return 'Analog & film photography';
    } else if (userLanguage === 'ar') {
      if (ad.includes('Banques et crédits')) return 'الأبناك والقروض الاستهلاكية بالمغرب';
      if (ad.includes('Immobilier et logements')) return 'العقارات والسكن بالدار البيضاء';
      if (ad.includes('Voyages et séjours')) return 'الأسفار والإقامات بمراكش';
      if (ad.includes('Véhicules d\'occasion')) return 'السيارات المستعملة والتأجير';
      if (ad.includes('Éducation et écoles')) return 'التعليم والمدارس الخاصة';
      if (ad.includes('Technologie et innovation')) return 'التكنولوجيا والابتكار';
      if (ad.includes('Design graphique')) return 'التصميم الجرافيكي وتجربة المستخدم';
      if (ad.includes('Cafés de spécialité')) return 'المقاهي المختصة';
      if (ad.includes('Matériel informatique')) return 'المعدات المعلوماتية والشاشات';
      if (ad.includes('Logiciels 3D')) return 'برامج التصميم ثلاثي الأبعاد';
      if (ad.includes('Photographie argentique')) return 'التصوير الفوتوغرافي التماثلي';
    }
    return ad;
  });

  if (exportData.ad_interests && exportData.ad_interests.length > 0) {
    const financialRegex = /banque|crédit|immobilier|leasing|finance/i;
    const hasFinancial = exportData.ad_interests.some((a) => financialRegex.test(a));

    if (hasFinancial) {
      score += 5;
      findings.push({
        category: 'behavioral_profiling',
        severity: 'medium',
        title: userLanguage === 'ar'
          ? `استهداف إعلاني مالي (${exportData.ad_interests.length} اهتمامات)`
          : userLanguage === 'en'
          ? `Financial Advertising Profiling (${exportData.ad_interests.length} interests)`
          : `Profilage publicitaire financier (${exportData.ad_interests.length} centres d'intérêt)`,
        detail: userLanguage === 'ar'
          ? `تصنيفات مستنتجة بواسطة المنصة: ${localizedAdInterests.slice(0, 4).join('، ')}.`
          : userLanguage === 'en'
          ? `Categories inferred by platform: ${localizedAdInterests.slice(0, 4).join(', ')}.`
          : `Catégories déduites par la plateforme : ${exportData.ad_interests.slice(0, 4).join(', ')}.`,
        where_seen: 'Export JSON: ads_interests.json',
        weight_points: 5,
      });
    } else {
      score += 2;
      findings.push({
        category: 'behavioral_profiling',
        severity: 'low',
        title: userLanguage === 'ar'
          ? `الاهتمامات الإعلانية (${exportData.ad_interests.length} اهتمامات)`
          : userLanguage === 'en'
          ? `Advertising Interests (${exportData.ad_interests.length} interests)`
          : `Centres d'intérêt publicitaires (${exportData.ad_interests.length} centres)`,
        detail: userLanguage === 'ar'
          ? `اهتمامات عامة: ${localizedAdInterests.slice(0, 4).join('، ')}.`
          : userLanguage === 'en'
          ? `General interests: ${localizedAdInterests.slice(0, 4).join(', ')}.`
          : `Intérêts généraux : ${exportData.ad_interests.slice(0, 4).join(', ')}.`,
        where_seen: 'Export JSON: ads_interests.json',
        weight_points: 2,
      });
    }
  }

  // 8. Vision Analysis on Photos (capped at 20)
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    try {
      const analysis = await analyzeExposureImage(p.buffer, p.mimeType, i, username, userLanguage);
      imageAnalyses.push(analysis);

      // Check for GPS EXIF in photos
      if (analysis.exif_data?.has_exif && analysis.exif_data.gps) {
        score += 25;
        findings.push({
          category: 'metadata_gps',
          severity: 'critical',
          title: userLanguage === 'ar'
            ? `إحداثيات GPS دقيقة في الصورة ${p.name}`
            : userLanguage === 'en'
            ? `Exact GPS Coordinates in Image ${p.name}`
            : `Coordonnées GPS exactes dans l'image ${p.name}`,
          detail: userLanguage === 'ar'
            ? `خط العرض: ${analysis.exif_data.gps.latitude.toFixed(4)}، خط الطول: ${analysis.exif_data.gps.longitude.toFixed(4)}. إحداثياتك المكانية الخام كانت مدمجة في بيانات الملف.`
            : userLanguage === 'en'
            ? `Lat: ${analysis.exif_data.gps.latitude.toFixed(4)}, Lon: ${analysis.exif_data.gps.longitude.toFixed(4)}. Raw spatial coordinates were embedded in the file.`
            : `Lat: ${analysis.exif_data.gps.latitude.toFixed(4)}, Lon: ${analysis.exif_data.gps.longitude.toFixed(4)}. Vos coordonnées spatiales brutes étaient incrustées dans le fichier.`,
          where_seen: userLanguage === 'ar' ? `صورة مصدرة: ${p.name}` : userLanguage === 'en' ? `Exported photo: ${p.name}` : `Photo exportée : ${p.name}`,
          weight_points: 25,
        });

        exportData.location_timeline.push({
          timestamp: analysis.exif_data.timestamp || (userLanguage === 'ar' ? 'صورة EXIF' : userLanguage === 'en' ? 'Photo EXIF' : 'Photo EXIF'),
          name: userLanguage === 'ar'
            ? `إحداثيات دقيقة (${analysis.exif_data.gps.latitude.toFixed(3)}، ${analysis.exif_data.gps.longitude.toFixed(3)})`
            : userLanguage === 'en'
            ? `Precise Coordinates (${analysis.exif_data.gps.latitude.toFixed(3)}, ${analysis.exif_data.gps.longitude.toFixed(3)})`
            : `Coordonnées précises (${analysis.exif_data.gps.latitude.toFixed(3)}, ${analysis.exif_data.gps.longitude.toFixed(3)})`,
          lat: analysis.exif_data.gps.latitude,
          lon: analysis.exif_data.gps.longitude,
          source: userLanguage === 'ar' ? `صورة GPS EXIF (${p.name})` : `EXIF GPS Photo (${p.name})`,
        });
      }

      if (analysis.documents_visible.length > 0) {
        score += 25;
        findings.push({
          category: 'visible_documents',
          severity: 'critical',
          title: userLanguage === 'ar'
            ? `وثيقة رسمية أو شارة عمل مرئية في ${p.name}`
            : userLanguage === 'en'
            ? `Official Document or Badge Visible in ${p.name}`
            : `Document ou badge officiel visible dans ${p.name}`,
          detail: userLanguage === 'ar'
            ? `الوثيقة المرصودة: ${analysis.documents_visible.map((d) => d.type).join(', ')}. خطر حرج لانتحال الهوية أو الاحتيال البنكي.`
            : userLanguage === 'en'
            ? `Document detected: ${analysis.documents_visible.map((d) => d.type).join(', ')}. Critical risk of identity theft or banking fraud.`
            : `Document détecté : ${analysis.documents_visible.map((d) => d.type).join(', ')}. Risque critique d'usurpation d'identité ou fraude bancaire.`,
          where_seen: userLanguage === 'ar' ? `صورة مصدرة: ${p.name}` : userLanguage === 'en' ? `Exported photo: ${p.name}` : `Photo exportée : ${p.name}`,
          weight_points: 25,
        });
      }
    } catch (e) {
      console.warn('Error analyzing export photo:', e);
    }
  }

  // Localize location timeline source strings
  exportData.location_timeline = exportData.location_timeline.map((item) => {
    let source = item.source || '';
    if (userLanguage === 'fr') {
      if (source.includes('Location Tag')) source = 'Tag de lieu publication';
      else if (source.includes('Check-in')) source = 'Check-in Instagram';
      else if (source.includes('Story Location') || source.includes('Story')) source = 'Lieu story Instagram';
      else if (source.includes('Device Session')) source = 'Traçage session appareil';
      else if (source.includes('Logged Session')) source = 'Lieu de session enregistrée';
      else if (source.includes('EXIF')) source = source.replace('EXIF GPS Photo', 'Photo EXIF GPS');
    } else if (userLanguage === 'ar') {
      if (source.includes('Location Tag')) source = 'وسم موقع المنشور';
      else if (source.includes('Check-in')) source = 'تسجيل وصول إنستغرام';
      else if (source.includes('Story Location') || source.includes('Story')) source = 'موقع قصة إنستغرام';
      else if (source.includes('Device Session')) source = 'تتبع جلسة الجهاز';
      else if (source.includes('Logged Session')) source = 'موقع جلسة مسجلة';
      else if (source.includes('EXIF')) source = source.replace('EXIF GPS Photo', 'صورة GPS EXIF');
    } else {
      if (source.includes('Tag de lieu')) source = 'Instagram Post Location Tag';
      else if (source.includes('Traçage session')) source = 'Instagram Device Session Tracking';
      else if (source.includes('Lieu de session')) source = 'Logged Session Location';
    }
    return { ...item, source };
  });

  // Sort location timeline chronologically (or reverse)
  exportData.location_timeline.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  // Cap score at 100
  score = Math.min(100, Math.max(0, score));

  let level: ExposureReport['level'] = 'low';
  if (score >= 76) level = 'critical';
  else if (score >= 51) level = 'high';
  else if (score >= 26) level = 'medium';

  // Realistic Attack Paths based on actual findings
  const attack_paths: ExposureReport['attack_paths'] = [];

  const hasPhone = !!exportData.account.phone;
  const hasWork = findings.some((f) => f.category === 'workplace_or_school');
  const hasLoc = findings.some((f) => f.category === 'geographic_location' || f.category === 'metadata_gps');
  const hasFamily = findings.some((f) => f.category === 'minor_presence');
  const hasDoc = findings.some((f) => f.category === 'visible_documents');

  if (hasDoc) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: "انتحال الهوية وسرقة شريحة الاتصال (SIM Swapping) عبر بطاقة الهوية",
        description:
          "يتيح كشف رقم بطاقة الهوية الوطنية أو الشارة الرسمية للمحتال التواصل مع مشغل الاتصالات أو الدعم البنكي لإعادة تعيين كلمات المرور احتيالياً.",
        exploited_clues: findings.filter((f) => f.category === 'visible_documents').map((f) => f.title),
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: "Identity Theft & SIM Swapping via National ID",
        description:
          "Exposing a national ID number or official badge allows a fraudster to contact telecom carriers or bank support to initiate unauthorized password resets.",
        exploited_clues: findings.filter((f) => f.category === 'visible_documents').map((f) => f.title),
      });
    } else {
      attack_paths.push({
        title: "Usurpation d'identité et SIM swapping via pièce d'identité",
        description:
          "L'exposition du numéro de CIN ou d'un badge officiel permet à un fraudeur de contacter votre opérateur télécom ou support bancaire pour initier une réinitialisation de mot de passe frauduleuse.",
        exploited_clues: findings.filter((f) => f.category === 'visible_documents').map((f) => f.title),
      });
    }
  }

  if (hasPhone && hasLoc) {
    const locRef = exportData.location_timeline[0]?.name || (userLanguage === 'ar' ? 'مدينتك' : userLanguage === 'en' ? 'your city' : 'votre ville');
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: "تصيد SMS احتيالي باسم طرد بريدي أو توصيل أمانة",
        description:
          `من خلال الجمع بين رقم هاتفك المحمول وسجل تنقلاتك الأخير (${locRef})، يرسل المحتال رسالة SMS يدعي فيها احتجاز طرد بريدي للمطالبة برسوم تخليص جمركي.`,
        exploited_clues: ['رقم الهاتف المرتبط', 'المواقع والجلسات الأخيرة'],
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: "Targeted Fake Delivery / Amana Parcel Smishing",
        description:
          `By combining your mobile phone number and recent location history (${locRef}), a scammer sends an SMS claiming a withheld package demanding customs clearance fees.`,
        exploited_clues: ['Linked mobile number', 'Recent locations & sessions'],
      });
    } else {
      attack_paths.push({
        title: "Smishing ciblé de fausse livraison ou colis Amana / Barid",
        description:
          `En combinant votre numéro de téléphone mobile et vos zones de déplacement récentes (${locRef}), un escroc envoie un SMS prétendant un colis bloqué réclamant des frais de dédouanement.`,
        exploited_clues: ['Numéro de mobile lié', 'Lieux et sessions récents'],
      });
    }
  }

  if (hasFamily) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: "احتيال انتحال الطوارئ العائلية أو الحضانة",
        description:
          "يستغل المحتال الإشارات إلى طبيب الأطفال أو رعاية الأطفال للتواصل مع الضحية مدعياً وجود حالة طبية طارئة تتطلب تحويلاً مالياً فورياً.",
        exploited_clues: ['المحيط العائلي مكشوف', 'البحث عن رعاية أطفال'],
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: "Emergency Family & Daycare Impersonation Scam",
        description:
          "A scammer weaponizing references to pediatricians or childcare contacts the victim claiming an urgent medical emergency requiring immediate money transfer.",
        exploited_clues: ['Family circle disclosed', 'Childcare searches'],
      });
    } else {
      attack_paths.push({
        title: "Arnaque à la fausse urgence familiale / crèche",
        description:
          "Un escroc exploitant les mentions de pédiatre ou de garde d'enfants contacte la victime en prétendant une urgence médicale immédiate nécessitant un virement rapide.",
        exploited_clues: ['Cercle familial révélé', 'Recherche de garde d\'enfants'],
      });
    }
  }

  if (hasWork && hasPhone) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: "التصيد الموجه بانتحال صفة زميل أو إدارة العمل",
        description:
          "ينتحل المهاجم صفة مدير أو زميل في العمل للتواصل مع الضحية مستغلاً انتمائها المهني وساعات عملها المعتادة.",
        exploited_clues: ['الانتماء المهني', 'رقم الهاتف المحمول'],
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: "Spear-Phishing via Workplace Executive Impersonation",
        description:
          "An attacker posing as an executive or colleague contacts the victim by weaponizing their professional affiliation and known working hours.",
        exploited_clues: ['Professional affiliation', 'Mobile number'],
      });
    } else {
      attack_paths.push({
        title: "Spear-phishing par usurpation de relation professionnelle",
        description:
          "Un attaquant se faisant passer pour un cadre ou collègue contacte la victime en exploitant son affiliation professionnelle et ses horaires habituels.",
        exploited_clues: ['Affiliation professionnelle', 'Numéro de mobile'],
      });
    }
  }

  if (attack_paths.length === 0) {
    if (userLanguage === 'ar') {
      attack_paths.push({
        title: "استطلاع سلبي وتصيد احتيالي عشوائي",
        description:
          "يظهر حسابك سطح هجوم ضئيل للغاية. يظل الخطر الرئيسي هو التصيد العشوائي العام الذي يستغل اسم المستخدم العام.",
        exploited_clues: ['اسم المستخدم العام'],
      });
    } else if (userLanguage === 'en') {
      attack_paths.push({
        title: "Passive Reconnaissance & Opportunistic Phishing",
        description:
          "Your profile exhibits a minimal attack surface. The primary risk remains generic untargeted phishing leveraging your public username.",
        exploited_clues: ['Public username'],
      });
    } else {
      attack_paths.push({
        title: "Reconnaissance passive et hameçonnage opportuniste",
        description:
          "Votre profil présente une surface d'attaque très réduite. Le risque principal reste le phishing générique non ciblé exploitant votre pseudonyme public.",
        exploited_clues: ['Pseudonyme public'],
      });
    }
  }

  // Actionable prioritized checklist based on actual findings
  const fix_checklist: ExposureReport['fix_checklist'] = [];
  let prio = 1;

  if (hasDoc) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: "احذف فوراً أي ذكر لرقم بطاقة الهوية الوطنية أو شارة العمل الرسمية من حسابك",
        reason: "المعرفات الرسمية دائمة ولا يمكن تغييرها، وتمكن المحتالين من انتحال الهوية بنكياً وإدارياً.",
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: "Immediately remove any national ID number or official badge mentions from your profile",
        reason: "Official identity numbers are permanent and enable fraudulent banking and administrative identity theft.",
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: "Supprimer immédiatement toute mention de numéro de CIN ou badge officiel de votre profil",
        reason: "Les identifiants officiels sont irréversibles et permettent des usurpations d'identité bancaires et administratives.",
      });
    }
  }

  if (hasPhone) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: "أزل رقم هاتفك المحمول من بيانات الملف الشخصي والبيانات الوصفية العامة",
        reason: "رقم الهاتف هو المنفذ المفضل لهجمات الرسائل النصية الاحتيالية (Smishing) وسرقة شريحة الاتصال.",
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: "Remove your mobile phone number from public profile information and metadata",
        reason: "Mobile phone numbers are the primary vector for fraudulent SMS smishing attacks and SIM swapping.",
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: "Retirer votre numéro de téléphone mobile des données de profil et métadonnées publiques",
        reason: "Le numéro de mobile est le vecteur privilégié des attaques par SMS frauduleux (Smishing) et vol de carte SIM.",
      });
    }
  }

  if (hasLoc) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: "عطّل التتبع الجغرافي الدقيق وامسح سجل المواقع المحفوظة",
        reason: "في الإعدادات ← الأذونات، أوقف الوصول للموقع في الخلفية لمنع التسجيل التلقائي لتحركاتك.",
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: "Disable precise location tracking and purge saved location history",
        reason: "Under Settings → Permissions, disable background location access to stop passive logging of your daily movements.",
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: "Désactiver la géolocalisation précise et purger l'historique des lieux enregistrés",
        reason: "Dans Réglages → Autorisations, coupez l'accès à la position en arrière-plan pour stopper l'enregistrement passif de vos déplacements.",
      });
    }
  }

  if (findings.some((f) => f.category === 'search_intent')) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: "امسح سجل عمليات البحث الأخيرة في مركز الحسابات",
        reason: "يظل سجل بحثك مخزناً على خوادم المنصة حتى تقوم بمسحه يدوياً.",
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: "Clear recent search query history in Accounts Center",
        reason: "Your search history remains stored on platform servers until manually purged.",
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: "Effacer l'historique des recherches récentes dans le Centre de Comptes",
        reason: "Votre historique de recherche reste conservé sur les serveurs de la plateforme tant qu'il n'est pas manuellement vidé.",
      });
    }
  }

  if (hasFamily) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: "احصر المنشورات والتعليقات التي تذكر الأطفال على الأصدقاء المقربين فقط",
        reason: "يحمي القُصّر من سيناريوهات الابتزاز العاطفي أو حيل الطوارئ العائلية المفبركة.",
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: "Restrict posts and comments mentioning children to Close Friends only",
        reason: "Protects minors from emotional extortion scams or fabricated family emergency schemes.",
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: "Restreindre les publications et commentaires mentionnant des enfants à vos amis proches",
        reason: "Protège les mineurs contre les scénarios d'extorsion émotionnelle ou d'urgence familiale simulée.",
      });
    }
  }

  if (hasWork) {
    if (userLanguage === 'ar') {
      fix_checklist.push({
        priority: prio++,
        action: "تجنب ذكر مواعيد وصولك أو إظهار شعارات الشركة في المنشورات",
        reason: "يحد من هجمات الهندسة الاجتماعية الموجهة التي تنتحل صفة الموارد البشرية أو الدعم التقني.",
      });
    } else if (userLanguage === 'en') {
      fix_checklist.push({
        priority: prio++,
        action: "Avoid mentioning working hours or company logos in public posts",
        reason: "Reduces targeted spear-phishing attacks impersonating HR or IT support staff.",
      });
    } else {
      fix_checklist.push({
        priority: prio++,
        action: "Éviter de mentionner vos horaires d'arrivée ou logos d'entreprise dans les publications",
        reason: "Limite les attaques ciblées se faisant passer pour les ressources humaines ou un service informatique.",
      });
    }
  }

  if (userLanguage === 'ar') {
    fix_checklist.push({
      priority: prio++,
      action: "فعّل المصادقة الثنائية (2FA) عبر تطبيق مصادقة مخصص",
      reason: "يحمي حسابك حتى في حالة تسرب بيانات تسجيل الدخول.",
    });
  } else if (userLanguage === 'en') {
    fix_checklist.push({
      priority: prio++,
      action: "Enable two-factor authentication (2FA) using a dedicated authenticator app",
      reason: "Safeguards account access even if login credentials become compromised.",
    });
  } else {
    fix_checklist.push({
      priority: prio++,
      action: "Activer l'authentification à deux facteurs (2FA) via une application d'authentification",
      reason: "Protège l'accès à votre compte même en cas de compromission d'identifiants.",
    });
  }

  let localizedCreatedAt = exportData.account.created_at;
  if (localizedCreatedAt) {
    if (userLanguage === 'en') {
      localizedCreatedAt = localizedCreatedAt
        .replace(/Janvier/i, 'January')
        .replace(/Février/i, 'February')
        .replace(/Mars/i, 'March')
        .replace(/Avril/i, 'April')
        .replace(/Mai/i, 'May')
        .replace(/Juin/i, 'June')
        .replace(/Juillet/i, 'July')
        .replace(/Août/i, 'August')
        .replace(/Septembre/i, 'September')
        .replace(/Octobre/i, 'October')
        .replace(/Novembre/i, 'November')
        .replace(/Décembre/i, 'December');
    } else if (userLanguage === 'ar') {
      localizedCreatedAt = localizedCreatedAt
        .replace(/Janvier/i, 'يناير')
        .replace(/Février/i, 'فبراير')
        .replace(/Mars/i, 'مارس')
        .replace(/Avril/i, 'أبريل')
        .replace(/Mai/i, 'مايو')
        .replace(/Juin/i, 'يونيو')
        .replace(/Juillet/i, 'يوليو')
        .replace(/Août/i, 'أغسطس')
        .replace(/Septembre/i, 'سبتمبر')
        .replace(/Octobre/i, 'أكتوبر')
        .replace(/Novembre/i, 'نوفمبر')
        .replace(/Décembre/i, 'ديسمبر');
    }
  }

  return {
    score,
    level,
    images_analyzed: photos.length,
    findings,
    attack_paths: attack_paths.slice(0, 3),
    fix_checklist: fix_checklist.slice(0, 8),
    per_image_results: imageAnalyses,
    provider_used: 'Local deterministic JSON parser + Vision model',
    model_used: 'gemini-3.1-flash-lite',
    total_latency_ms: totalLatencyMs,
    verified_via_email: verifiedViaEmail,
    claimed_username: username,
    is_full_export: true,
    export_platform: exportData.platform === 'generic' ? 'instagram' : exportData.platform,
    export_summary: {
      total_posts: exportData.total_posts_found || exportData.captions_history.length,
      total_comments: exportData.total_comments_found || exportData.comments_history.length,
      total_searches: exportData.total_searches_found || exportData.search_history.length,
      total_photos: exportData.total_photos_found,
      photos_analyzed: exportData.analyzed_photos_count,
      account_created: localizedCreatedAt,
    },
    location_timeline: exportData.location_timeline,
    search_history_highlights: exportData.search_history.slice(0, 10).map((s) => s.query),
    comments_highlights: exportData.comments_history.slice(0, 8),
    ad_interests: localizedAdInterests,
  };
}
