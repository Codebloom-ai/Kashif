import { Language } from './types.ts';

export interface Translations {
  appName: string;
  appSubtitle: string;
  tabs: {
    exposureCheck: string;
    scamShield: string;
    benchmarks: string;
    monitoring: string;
  };
  header: {
    purgeBtn: string;
    purgeSuccess: string;
    debugToggle: string;
  };
  footer: {
    poweredBy: string;
    stackDesc: string;
    autoFallback: string;
    zeroPersistence: string;
    debugPanel: string;
    reliabilityLink: string;
  };
  hero: {
    eyebrow: string;
    headlinePrefix: string;
    headlineAccent: string;
    headlineSuffix: string;
    subheadline: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    scamShieldSwitchPrompt: string;
    scamShieldSwitchSub: string;
    previewCaption: string;
    howItWorksEyebrow: string;
    howItWorksSub: string;
  };
  modes: {
    fullTab: string;
    fullBadge: string;
    quickTab: string;
    quickBadge: string;
    trustNotice: string;
    fullHeroTitle: string;
    fullHeroSub: string;
    quickHeroTitle: string;
    quickHeroSub: string;
  };
  fullDropzone: {
    title: string;
    subtitle: string;
    badge: string;
    processingNote: string;
    fileLoaded: string;
    sizeLabel: string;
    readyForAnalysis: string;
    changeFile: string;
    startBtn: string;
    scanning: string;
  };
  quickDropzone: {
    title: string;
    subtitle: string;
    badge: string;
    videoBadge: string;
    pasteHint: string;
    readyCount: string;
    videoLoaded: string;
    videoLimitNote: string;
    addReplace: string;
    startBtn: string;
    scanning: string;
    extractingFrames: string;
    transcribingAudio: string;
    analyzingContent: string;
  };
  exportGuide: {
    title: string;
    subtitle: string;
    tabs: {
      instagram: string;
      facebook: string;
      tiktok: string;
    };
    instagramLabel: string;
    instagramPath: string;
    instagramNote: string;
    facebookLabel: string;
    facebookPath: string;
    facebookNote: string;
    tiktokLabel: string;
    tiktokPath: string;
    tiktokNote: string;
  };
  demoProfiles: {
    callout: string;
    title: string;
    fullModeSub: string;
    quickModeSub: string;
    oneClickBadge: string;
    readyFull: string;
    readyQuick: string;
    selectedLabel: string;
    auditAction: string;
    tiers: {
      critical: string;
      high: string;
      medium: string;
      low: string;
    };
  };
  ownership: {
    title: string;
    expl: string;
    emailLabel: string;
    usernameLabel: string;
    otpBtn: string;
    verifyBtn: string;
    verifiedBadge: string;
    accountValidated: string;
    associatedWith: string;
  };
  report: {
    scoreTitle: string;
    prePublishScoreTitle: string;
    prePublishTitle: string;
    prePublishSub: string;
    recommendationsTitle: string;
    recommendationsSub: string;
    concreteEditLabel: string;
    impactLabel: string;
    videoHonestyNote: string;
    transcriptTitle: string;
    spokenRisksTitle: string;
    levelCritical: string;
    levelHigh: string;
    levelMedium: string;
    levelLow: string;
    simulatedScoreNote: string;
    actionsResolvedSuffix: string;
    accountLabel: string;
    captionsProcessed: string;
    archiveLabel: string;
    auditLatency: string;
    verifiedOwner: string;
    exifTitle: string;
    gdprNotice: string;
    findingsTitle: string;
    weightedBySeverity: string;
    sourceLabel: string;
    locationTimelineTitle: string;
    locationTimelineSub: string;
    searchHistoryTitle: string;
    searchHistorySub: string;
    commentsTitle: string;
    adInterestsTitle: string;
    attackPathsTitle: string;
    attackPathsSub: string;
    fixChecklistTitle: string;
    fixChecklistSub: string;
    simulationTitle: string;
    simulationSub: string;
    simulationBtn: string;
    simulatingBtn: string;
    simulationBadge: string;
    vectorLabel: string;
    senderLabel: string;
    deceptionMechanism: string;
    resetBtn: string;
    photosAnalyzedNotice: string;
    photosNoticeSub: string;
    postsFound: string;
    publicComments: string;
    savedSearches: string;
    photosAndFaces: string;
    videoAnalyzedLabel: string;
    preventiveAuditBadge: string;
    anonymousUser: string;
  };
  scamShield: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    dropzoneTitle: string;
    dropzoneSubtitle: string;
    orPaste: string;
    pastePlaceholder: string;
    analyzeBtn: string;
    analyzing: string;
    trySample: string;
    samples: {
      inwiPrize: string;
      amanaFee: string;
      legitOtp: string;
      colleagueCoffee: string;
    };
    transcriptionTitle: string;
    redFlagsTitle: string;
    whatToDoTitle: string;
    reportToTitle: string;
    resetBtn: string;
    safeVerdict: string;
    suspiciousVerdict: string;
    scamVerdict: string;
    confidence: string;
    guardrailBadge: string;
    personalizationRiskBadge: string;
    trust1: string;
    trust2: string;
    trust3: string;
  };
  benchmarks: {
    eyebrow: string;
    title: string;
    subtitle: string;
    runBtn: string;
    runningBtn: string;
    setHeldOut: string;
    setDev: string;
    accuracy: string;
    precision: string;
    recall: string;
    latencyAvg: string;
    latencyP95: string;
    guardrailPass: string;
    casesEvaluated: string;
  };
  monitoring: {
    title: string;
    subtitle: string;
    systemHealth: string;
    operational: string;
    totalRequests: string;
    avgLatency: string;
    guardrailEnforcements: string;
    liveLogs: string;
  };
  common: {
    deleteSession: string;
    sessionDeleted: string;
    aiNotice: string;
    debugView: string;
    realExecution: string;
  };
}

function createSafeProxy<T extends object>(target: T, lang: string, prefix = ''): T {
  return new Proxy(target, {
    get(obj: any, prop: string | symbol) {
      if (typeof prop === 'symbol') return obj[prop];
      const val = obj[prop];
      const fullPath = prefix ? `${prefix}.${prop}` : prop;
      if (val === undefined || val === null) {
        console.warn(`[i18n MISSING] Language: ${lang}, Key: ${fullPath}`);
        return `[MISSING:${fullPath}]`;
      }
      if (typeof val === 'object' && !Array.isArray(val)) {
        return createSafeProxy(val, lang, fullPath);
      }
      return val;
    },
  });
}

const rawTranslations: Record<Language, Translations> = {
  fr: {
    appName: 'Kashif · كاشف',
    appSubtitle: 'Bouclier anti-ingénierie sociale & audit d’exposition',
    tabs: {
      exposureCheck: 'Exposure Check',
      scamShield: 'Scam Shield',
      benchmarks: 'Fiabilité & Tests',
      monitoring: 'Monitoring en direct',
    },
    header: {
      purgeBtn: 'Purger la session',
      purgeSuccess: 'Session effacée : toutes les données en mémoire ont été purgées.',
      debugToggle: 'Debug',
    },
    footer: {
      poweredBy: 'Analyse propulsée par',
      stackDesc: 'Architecture hybride multi-modèles Kashif (Gemini · Groq · Brev) avec garde-fous stricts',
      autoFallback: 'auto-fallback',
      zeroPersistence: 'Zéro persistance en mémoire · L’IA conseille, vous décidez',
      debugPanel: 'panneau de debug',
      reliabilityLink: "Voir les résultats de fiabilité et l'architecture technique →",
    },
    hero: {
      eyebrow: 'AUDIT DE VIE PRIVÉE',
      headlinePrefix: 'Découvrez ce qu’un',
      headlineAccent: 'inconnu',
      headlineSuffix: 'peut apprendre sur vous.',
      subheadline: 'Analysez 1 à 3 captures de vos réseaux sociaux ou déposez votre export de données officiel pour mesurer vos fuites d’informations et surfaces d’ingénierie sociale.',
      stat1Value: '15+',
      stat1Label: 'Vecteurs & pièges marocains',
      stat2Value: '100%',
      stat2Label: 'Audit en mémoire volatile',
      stat3Value: '0',
      stat3Label: 'Mot de passe requis',
      scamShieldSwitchPrompt: 'Vous suspectez plutôt un SMS ou un message direct ?',
      scamShieldSwitchSub: 'Basculez vers Scam Shield pour auditer un texto, lien de livraison ou faux OTP.',
      previewCaption: 'Aperçu — exemple de résultat',
      howItWorksEyebrow: 'COMMENT ÇA MARCHE',
      howItWorksSub: 'Aperçu en direct du processus d’audit',
    },
    modes: {
      fullTab: 'Audit complet (.zip export)',
      fullBadge: 'Profil existant',
      quickTab: 'Vérifier avant de publier',
      quickBadge: 'Capture ou Vidéo',
      trustNotice: '100% en mémoire locale · Aucun mot de passe requis',
      fullHeroTitle: 'Un profil ne montre que ce que vous choisissez. Votre export montre tout — même ce que vous avez oublié.',
      fullHeroSub: 'Instagram, Facebook et TikTok vous permettent de télécharger gratuitement votre archive officielle de données (aucun mot de passe nécessaire). Elle contient l’intégralité de vos publications, légendes, commentaires, historique de géolocalisation et recherches passées.',
      quickHeroTitle: 'Sur le point de publier ? Vérifiez d’abord ce que ce post révèle.',
      quickHeroSub: 'Déposez une capture ou une courte vidéo (jusqu’à 30s) que vous vous apprêtez à mettre en ligne : Kashif analyse les indices de routine, documents visibles, visages de mineurs et métadonnées avant qu’ils ne deviennent publics.',
    },
    fullDropzone: {
      title: 'Déposez votre archive .zip',
      subtitle: 'Archive officielle Instagram, Facebook ou TikTok téléchargée depuis vos paramètres.',
      badge: 'Fichier .ZIP',
      processingNote: 'Traitement 100% local',
      fileLoaded: 'Fichier archive chargé',
      sizeLabel: 'Taille',
      readyForAnalysis: 'Prêt pour l’analyse approfondie',
      changeFile: 'Changer',
      startBtn: 'Lancer l’Audit Complet de l’Archive',
      scanning: 'Extraction directe des JSON & audit en cours...',
    },
    quickDropzone: {
      title: 'Déposez votre photo ou courte vidéo',
      subtitle: 'Capture du post à venir (1-3 images) ou courte vidéo (MP4/WebM jusqu’à 30s) avant publication.',
      badge: 'Photos (PNG, JPG, WebP)',
      videoBadge: 'Vidéo (max 30s / 50Mo)',
      pasteHint: 'ou collez (Ctrl+V)',
      readyCount: 'Fichiers prêts',
      videoLoaded: 'Vidéo chargée prête pour analyse',
      videoLimitNote: 'Vidéo analysée par échantillonnage d’images clés et transcription de la piste audio.',
      addReplace: '+ Ajouter / Remplacer',
      startBtn: 'Vérifier avant publication',
      scanning: 'Audit préventif avant publication...',
      extractingFrames: 'Extraction des images clés de la vidéo...',
      transcribingAudio: 'Transcription et analyse de la piste audio...',
      analyzingContent: 'Audit visuel et détection des indices...',
    },
    exportGuide: {
      title: 'Comment télécharger votre export de données officiel (Chemin exact)',
      subtitle: 'Aucun mot de passe n’est requis par Kashif. Vous téléchargez votre propre archive directement depuis la plateforme.',
      tabs: {
        instagram: 'Instagram',
        facebook: 'Facebook',
        tiktok: 'TikTok',
      },
      instagramLabel: '📱 Sur l’application Instagram :',
      instagramPath: 'Profil → Menu (☰) → Espace Comptes (Meta) → Vos informations et autorisations → Télécharger vos informations → Format : JSON (Recommandé)',
      instagramNote: 'Instagram prépare le fichier et vous avertit par notification. Téléchargez le .zip puis glissez-le directement dans la boîte ci-dessus.',
      facebookLabel: '💻 Sur Facebook (Web ou Mobile) :',
      facebookPath: 'Paramètres et confidentialité → Paramètres → Vos informations Facebook → Télécharger vos informations de profil → Sélectionner format JSON',
      facebookNote: 'Inclut vos publications, commentaires, géolocalisations et interactions de groupes.',
      tiktokLabel: '🎵 Sur l’application TikTok :',
      tiktokPath: 'Profil → Menu (☰) → Paramètres et confidentialité → Compte → Télécharger vos données → Format : JSON',
      tiktokNote: 'Génère l’archive de vos vidéos, historiques de navigation et commentaires passés.',
    },
    demoProfiles: {
      callout: 'Pas encore votre export ? Testez avec un profil de démonstration ci-dessous.',
      title: 'Charger un profil marocain de démonstration',
      fullModeSub: '(Simule un export complet)',
      quickModeSub: '(Simule 1-3 captures)',
      oneClickBadge: '1 clic pour évaluer',
      readyFull: 'Export complet prêt',
      readyQuick: '3 captures prêtes',
      selectedLabel: 'Profil sélectionné :',
      auditAction: 'Auditer ce profil maintenant',
      tiers: {
        critical: 'Critique',
        high: 'Élevé',
        medium: 'Modéré',
        low: 'Faible',
      },
    },
    ownership: {
      title: 'Contrôle d’appartenance & anti-abus',
      expl: 'Si vous contrôlez l’email lié au compte, vous prouvez votre légitimité — le même modèle de confiance que la récupération de compte. Aucune donnée n’est conservée.',
      emailLabel: 'Votre adresse email',
      usernameLabel: 'Nom d’utilisateur du compte',
      otpBtn: 'Code OTP',
      verifyBtn: 'Vérifier',
      verifiedBadge: '✓ Vérifié',
      accountValidated: 'Compte validé',
      associatedWith: 'L’audit est associé à',
    },
    report: {
      scoreTitle: 'Score d’exposition globale',
      prePublishScoreTitle: 'Indice de risque avant publication',
      prePublishTitle: 'Ce que vous vous apprêtez à exposer',
      prePublishSub: 'Voici ce qu’un tiers pourra déduire de ce post — appliquez les recommandations concrètes ci-dessous avant de publier.',
      recommendationsTitle: 'Recommandations concrètes avant publication',
      recommendationsSub: 'Modifications chirurgicales recommandées (flou, recadrage, coupe audio) avant mise en ligne publique.',
      concreteEditLabel: 'Action recommandée :',
      impactLabel: 'Bénéfice sécurité :',
      videoHonestyNote: 'Échantillonnage vidéo certifié',
      transcriptTitle: 'Transcription de la piste audio',
      spokenRisksTitle: 'Informations révélées oralement dans la vidéo',
      levelCritical: 'CRITIQUE',
      levelHigh: 'ÉLEVÉ',
      levelMedium: 'MODÉRÉ',
      levelLow: 'FAIBLE',
      simulatedScoreNote: '✓ Score simulé après correction de',
      actionsResolvedSuffix: 'mesure(s) de sécurité.',
      accountLabel: 'Compte :',
      captionsProcessed: 'Captures traitées :',
      archiveLabel: 'Archive officielle :',
      auditLatency: 'Audit neuronal :',
      verifiedOwner: '✓ Propriétaire vérifié',
      exifTitle: 'Métadonnées EXIF & RGPD :',
      gdprNotice: 'Conforme CNDP / RGPD',
      findingsTitle: 'Indices & Fuites identifiés',
      weightedBySeverity: 'Pondération par gravité',
      sourceLabel: 'Source :',
      locationTimelineTitle: 'Chronologie des déplacements & Géolocalisations',
      locationTimelineSub: 'Lieux tracés dans l’archive',
      searchHistoryTitle: 'Recherches privées conservées dans l’export',
      searchHistorySub: 'Requêtes extraites',
      commentsTitle: 'Commentaires et interactions publiques',
      adInterestsTitle: 'Centres d’intérêt publicitaires déduits',
      attackPathsTitle: 'Scénarios d’attaque réalistes',
      attackPathsSub: 'Ingénierie sociale dérivée de vos données',
      fixChecklistTitle: 'Plan d’action correctif prioritaire',
      fixChecklistSub: 'Cochez pour simuler l’amélioration de votre score',
      simulationTitle: 'Simulation d’attaque défensive (Spear-Phishing éducatif)',
      simulationSub: 'Génère le message exact qu’un escroc pourrait vous envoyer en exploitant uniquement vos données trouvées ci-dessus.',
      simulationBtn: 'Générer la simulation',
      simulatingBtn: 'Génération...',
      simulationBadge: 'SIMULATION DÉFENSIVE : Conçue pour anticiper les pièges.',
      vectorLabel: 'Vecteur :',
      senderLabel: 'Expéditeur :',
      deceptionMechanism: 'Mécanisme de tromperie :',
      resetBtn: 'Auditer un autre profil ou archive',
      photosAnalyzedNotice: 'photos analysées sur',
      photosNoticeSub: 'Pour préserver la réactivité, l’audit vision cible les 20 plus récentes et les fichiers contenant des balises GPS.',
      postsFound: 'Publications trouvées',
      publicComments: 'Commentaires publics',
      savedSearches: 'Recherches conservées',
      photosAndFaces: 'Photos & Visages',
      videoAnalyzedLabel: 'Vidéo analysée :',
      preventiveAuditBadge: 'Audit Préventif',
      anonymousUser: 'anonyme',
    },
    scamShield: {
      eyebrow: 'BOUCLIER ANTI-ARNAQUE',
      headline: 'Un message vous paraît suspect ?',
      subheadline: 'Déposez une capture d’écran ou collez un texte SMS, WhatsApp ou email. Analyse immédiate multilingue (Darija, Arabe, Français, Anglais).',
      dropzoneTitle: 'Glissez une capture ou cliquez pour parcourir',
      dropzoneSubtitle: 'Accepte les captures d’écran (PNG, JPG, WebP) ou collez directement avec Ctrl+V',
      orPaste: 'ou écrivez / collez le message ci-dessous',
      pastePlaceholder: 'Ex: مبروك ربحتي معنا سيارة... / Votre colis est bloqué payez 15 DH sur bit.ly...',
      analyzeBtn: 'Analyser le risque',
      analyzing: 'Analyse neuronale & règles de sécurité en cours...',
      trySample: 'Tester un cas concret :',
      samples: {
        inwiPrize: 'Arnaque loterie (Darija)',
        amanaFee: 'Faux frais Amana 18 DH',
        legitOtp: 'Vrai SMS 2FA de banque',
        colleagueCoffee: 'Message collègue légitime',
      },
      transcriptionTitle: 'Ce que le système a lu sur votre capture',
      redFlagsTitle: 'Indices de fraude identifiés',
      whatToDoTitle: 'Que faire maintenant ?',
      reportToTitle: 'Signaler auprès des autorités compétentes',
      resetBtn: 'Analyser un autre message',
      safeVerdict: 'Semble légitime',
      suspiciousVerdict: 'Suspect — Prudence',
      scamVerdict: 'Arnaque confirmée',
      confidence: 'Indice de confiance',
      guardrailBadge: 'Vérifié par garde-fou déterministe',
      personalizationRiskBadge: 'Risque de ciblage personnalisé détecté',
      trust1: '15+ signatures marocaines',
      trust2: '100% traitement en mémoire',
      trust3: 'Aucun mot de passe requis',
    },
    benchmarks: {
      eyebrow: 'ÉVALUATION & VALIDATION',
      title: 'Banc d’Essai Multi-Modèles & Garde-Fou',
      subtitle: 'Matrice de validation sur 40 scénarios certifiés (phishing bancaire, loterie, 2FA légitime, et profils d’exposition).',
      runBtn: 'Lancer le benchmark complet',
      runningBtn: 'Exécution des 40 cas en direct...',
      setHeldOut: '20 Cas Held-Out (Non vus)',
      setDev: '20 Cas Dev Set (Calibration)',
      accuracy: 'Précision globale',
      precision: 'Précision',
      recall: 'Rappel',
      latencyAvg: 'Latence moyenne',
      latencyP95: 'Latence P95',
      guardrailPass: 'Garde-fous activés',
      casesEvaluated: 'cas évalués',
    },
    monitoring: {
      title: 'Supervision & Observabilité en Direct',
      subtitle: 'Télémétrie en temps réel des requêtes multi-fournisseurs, latences et déclenchements de garde-fous.',
      systemHealth: 'État du système',
      operational: 'Opérationnel',
      totalRequests: 'Requêtes traitées',
      avgLatency: 'Latence moyenne',
      guardrailEnforcements: 'Garde-fous déclenchés',
      liveLogs: 'Journaux d’exécution récents',
    },
    common: {
      deleteSession: 'Purger la session',
      sessionDeleted: 'Toutes les données en mémoire ont été effacées.',
      aiNotice: 'L’intelligence artificielle peut se tromper : vous gardez le jugement final.',
      debugView: 'Mode débogage (?debug=1)',
      realExecution: 'Mesure réelle en direct',
    },
  },

  ar: {
    appName: 'كاشف · Kashif',
    appSubtitle: 'درع الحماية من الهندسة الاجتماعية وفحص البصمة الرقمية',
    tabs: {
      exposureCheck: 'فحص البصمة',
      scamShield: 'درع الاحتيال',
      benchmarks: 'الموثوقية والتقييم',
      monitoring: 'المراقبة المباشرة',
    },
    header: {
      purgeBtn: 'مسح الجلسة',
      purgeSuccess: 'تم مسح الجلسة: تم تفريغ كافة البيانات من الذاكرة فوراً.',
      debugToggle: 'التصحيح',
    },
    footer: {
      poweredBy: 'التحليل مدعوم بواسطة',
      stackDesc: 'بنية كاشف الهجينة متعددة النماذج (Gemini · Groq · Brev) مع حواجز أمان صارمة',
      autoFallback: 'تحويل تلقائي',
      zeroPersistence: 'لا تخزين في الذاكرة الدائمة · الذكاء الاصطناعي يوجه وأنت تقرر',
      debugPanel: 'لوحة التصحيح',
      reliabilityLink: 'عرض نتائج اختبارات الموثوقية والهندسة التقنية ←',
    },
    hero: {
      eyebrow: 'تدقيق الخصوصية والبصمة',
      headlinePrefix: 'اكتشف ما يمكن',
      headlineAccent: 'لشخص غريب',
      headlineSuffix: 'معرفته عنك.',
      subheadline: 'حلل من 1 إلى 3 لقطات شاشة أو أودع ملف التصدير الرسمي لحسابك لتقييم تسريبات البيانات وثغرات الهندسة الاجتماعية التي قد تستغل ضدك.',
      stat1Value: '15+',
      stat1Label: 'أنماط احتيال مغربية معتمدة',
      stat2Value: '100%',
      stat2Label: 'فحص فوري في الذاكرة المؤقتة',
      stat3Value: '0',
      stat3Label: 'لا نطلب أي كلمة سر مطلقا',
      scamShieldSwitchPrompt: 'هل تشك في رسالة نصية أو رسالة مباشرة بدلاً من ذلك؟',
      scamShieldSwitchSub: 'انتقل إلى درع الاحتيال لفحص رسالة SMS أو رابط توصيل أو رمز بنكي مشبوه.',
      previewCaption: 'معاينة — نموذج للنتيجة',
      howItWorksEyebrow: 'كيف يعمل',
      howItWorksSub: 'معاينة حية لمراحل التدقيق',
    },
    modes: {
      fullTab: 'تدقيق شامل (تصدير zip.)',
      fullBadge: 'الحساب الحالي',
      quickTab: 'تحقق قبل النشر',
      quickBadge: 'صورة أو فيديو',
      trustNotice: '100% في الذاكرة المحلية · دون الحاجة لكلمة سر',
      fullHeroTitle: 'الملف الشخصي يظهر ما تختاره فقط. ملف التصدير يكشف كل شيء — حتى ما نسيته.',
      fullHeroSub: 'تتيح لك منصات إنستغرام وفيسبوك وتيك توك تنزيل أرشيف بياناتك الرسمي مجاناً (دون الحاجة لكلمة سر). يحتوي على كافة المنشورات والتعليقات وسجل المواقع والبحث.',
      quickHeroTitle: 'على وشك النشر؟ تحقق أولاً مما قد يكشفه هذا المنشور.',
      quickHeroSub: 'ارفع صورة أو لقطة أو مقطع فيديو تنوي نشره: يفحص كاشف معالم المكان، والوثائق، والوجوه، والبيانات قبل إتاحتها للعامة.',
    },
    fullDropzone: {
      title: 'أفلت ملف الأرشيف zip.',
      subtitle: 'الأرشيف الرسمي لإنستغرام أو فيسبوك أو تيك توك المنزّل من إعدادات حسابك.',
      badge: 'ملف ZIP.',
      processingNote: 'معالجة محلية 100%',
      fileLoaded: 'تم تحميل ملف الأرشيف بنجاح',
      sizeLabel: 'الحجم',
      readyForAnalysis: 'جاهز للتدقيق الشامل والعميق',
      changeFile: 'تغيير',
      startBtn: 'بدء التدقيق الشامل للأرشيف',
      scanning: 'جاري استخراج ملفات JSON والتدقيق الفوري...',
    },
    quickDropzone: {
      title: 'أفلت صورتك أو مقطع الفيديو القصير',
      subtitle: 'صورة للمنشور المرتقب أو مقطع فيديو (MP4/WebM حتى 30 ثانية) قبل النشر للعامة.',
      badge: 'الصور (PNG, JPG, WebP)',
      videoBadge: 'فيديو (حتى 30 ثانية / 50 ميغابايت)',
      pasteHint: 'أو الصق مباشرة (Ctrl+V)',
      readyCount: 'ملفات جاهزة',
      videoLoaded: 'تم تحميل الفيديو بنجاح',
      videoLimitNote: 'يتم تحليل الفيديو عبر استخراج لقطات محددة وتفريغ المسار الصوتي.',
      addReplace: '+ إضافة / استبدال',
      startBtn: 'فحص المحتوى قبل النشر',
      scanning: 'تدقيق وقائي قبل النشر...',
      extractingFrames: 'جاري استخراج لقطات الفيديو الرئيسية...',
      transcribingAudio: 'جاري تفريغ الصوت والتحقق من التسريبات الشفهية...',
      analyzingContent: 'جاري فحص الأدلة البصرية وكشف المخاطر...',
    },
    exportGuide: {
      title: 'كيفية تنزيل أرشيف بياناتك الرسمي (المسار الدقيق)',
      subtitle: 'لا يطلب كاشف أي كلمة سر مطلقا. تقوم بتنزيل أرشيفك الشخصي مباشرة من المنصة الرسمية.',
      tabs: {
        instagram: 'إنستغرام',
        facebook: 'فيسبوك',
        tiktok: 'تيك توك',
      },
      instagramLabel: '📱 على تطبيق إنستغرام :',
      instagramPath: 'الملف الشخصي ← القائمة (☰) ← مركز الحسابات (Meta) ← معلوماتك وأذوناتك ← تنزيل معلوماتك ← التنسيق: JSON (موصى به)',
      instagramNote: 'يقوم إنستغرام بإعداد الأرشيف وإشعارك عند جهوزيته. نزّل ملف zip. ثم أفلته في المربع أعلاه.',
      facebookLabel: '💻 على فيسبوك (الويب أو الهاتف) :',
      facebookPath: 'الإعدادات والخصوصية ← الإعدادات ← معلوماتك على فيسبوك ← تنزيل معلومات الملف الشخصي ← حدد تنسيق JSON',
      facebookNote: 'يتضمن منشوراتك وتعليقاتك وسجل المواقع وتفاعلات المجموعات.',
      tiktokLabel: '🎵 على تطبيق تيك توك :',
      tiktokPath: 'الملف الشخصي ← القائمة (☰) ← الإعدادات والخصوصية ← الحساب ← تنزيل بياناتك ← التنسيق: JSON',
      tiktokNote: 'ينشئ أرشيفاً لفيديوهاتك وسجل التصفح والتعليقات السابقة.',
    },
    demoProfiles: {
      callout: 'ليس لديك ملف التصدير بعد؟ جرب ملفاً تجريبياً أدناه.',
      title: 'تحميل ملف تجريبي مغربي',
      fullModeSub: '(يحاكي تصديراً كاملاً)',
      quickModeSub: '(يحاكي 1-3 لقطات)',
      oneClickBadge: 'نقرة واحدة للتجربة',
      readyFull: 'التصدير الكامل جاهز',
      readyQuick: '3 لقطات جاهزة',
      selectedLabel: 'الملف المختار :',
      auditAction: 'تدقيق هذا الملف الآن',
      tiers: {
        critical: 'حرج',
        high: 'عالي',
        medium: 'متوسط',
        low: 'منخفض',
      },
    },
    ownership: {
      title: 'التحقق من ملكية الحساب ومنع إساءة الاستخدام',
      expl: 'إثبات تحكمك بالبريد الإلكتروني يمنحك حق فحص الحساب — نفس نموذج الأمان المتبع في استرجاع الحسابات. لا نخزن أي بيانات.',
      emailLabel: 'بريدك الإلكتروني',
      usernameLabel: 'اسم مستخدم الحساب',
      otpBtn: 'رمز OTP',
      verifyBtn: 'تأكيد',
      verifiedBadge: '✓ مؤكد',
      accountValidated: 'تم تأكيد الحساب',
      associatedWith: 'التدقيق مرتبط بـ',
    },
    report: {
      scoreTitle: 'مستوى تعرضك للمخاطر الإجمالي',
      prePublishScoreTitle: 'مؤشر الخطورة قبل النشر',
      prePublishTitle: 'ما أنت على وشك كشفه للعامة',
      prePublishSub: 'إليك ما يمكن لجهة مجهولة استنتاجه من هذا المنشور — يُنصح بإجراء التعديلات المقترحة قبل النشر.',
      recommendationsTitle: 'توصيات وتعديلات ملموسة قبل النشر',
      recommendationsSub: 'إجراءات محددة (تمويه، قص، قطع مقطع صوتي) ينصح بها قبل النشر العام.',
      concreteEditLabel: 'الإجراء الملموس :',
      impactLabel: 'الأثر الوقائي :',
      videoHonestyNote: 'عينة إطارات موثقة',
      transcriptTitle: 'تفريغ المسار الصوتي للفيديو',
      spokenRisksTitle: 'بيانات تم الإفصاح عنها شفهياً في المقطع',
      levelCritical: 'حرج للغاية',
      levelHigh: 'عالي',
      levelMedium: 'متوسط',
      levelLow: 'منخفض',
      simulatedScoreNote: '✓ النتيجة المحاكاة بعد تطبيق',
      actionsResolvedSuffix: 'إجراءات تصحيحية أمنية.',
      accountLabel: 'الحساب :',
      captionsProcessed: 'اللقطات المعالجة :',
      archiveLabel: 'الأرشيف الرسمي :',
      auditLatency: 'زمن الفحص العصبي :',
      verifiedOwner: '✓ مالك مؤكد',
      exifTitle: 'بيانات EXIF والخصوصية :',
      gdprNotice: 'متوافق مع حماية المعطيات CNDP',
      findingsTitle: 'الأدلة والتسريبات المكتشفة',
      weightedBySeverity: 'مرتبة حسب درجة الخطورة',
      sourceLabel: 'المصدر :',
      locationTimelineTitle: 'الخط الزمني للمواقع والتنقلات',
      locationTimelineSub: 'الأماكن المرصودة في الأرشيف',
      searchHistoryTitle: 'عمليات البحث الخاصة المحفوظة في التصدير',
      searchHistorySub: 'الاستفسارات المستخرجة',
      commentsTitle: 'التعليقات والتفاعلات العامة',
      adInterestsTitle: 'الاهتمامات الإعلانية المستنتجة',
      attackPathsTitle: 'سيناريوهات الهجوم المحتملة',
      attackPathsSub: 'هندسة اجتماعية مشتقة من بياناتك المكشوفة',
      fixChecklistTitle: 'خطة الإجراءات التصحيحية ذات الأولوية',
      fixChecklistSub: 'حدد البنود لمحاكاة تحسن درجتك فوراً',
      simulationTitle: 'محاكاة هجوم دفاعي (تصيد موجه تعليمي)',
      simulationSub: 'يولد الرسالة الدقيقة التي قد يرسلها محتال باستغلال معطياتك المكشوفة أعلاه فقط.',
      simulationBtn: 'توليد المحاكاة الدفاعية',
      simulatingBtn: 'جاري التوليد...',
      simulationBadge: 'محاكاة دفاعية تعليمية: هدفها توضيح كيف يستغل المهاجم معلوماتك لتفادي الفخ.',
      vectorLabel: 'المسار :',
      senderLabel: 'المرسل :',
      deceptionMechanism: 'آلية الخداع والتضليل :',
      resetBtn: 'تدقيق حساب أو أرشيف آخر',
      photosAnalyzedNotice: 'صور تم فحصها من أصل',
      photosNoticeSub: 'للحفاظ على السرعة والاستجابة، يستهدف الفحص البصري أحدث 20 صورة والملفات المحتوية على إحداثيات GPS.',
      postsFound: 'المنشورات المرصودة',
      publicComments: 'التعليقات العامة',
      savedSearches: 'عمليات البحث المحفوظة',
      photosAndFaces: 'الصور والوجوه',
      videoAnalyzedLabel: 'فيديو محلل :',
      preventiveAuditBadge: 'فحص وقائي',
      anonymousUser: 'مجهول',
    },
    scamShield: {
      eyebrow: 'درع الحماية من الاحتيال',
      headline: 'هل وصلتك رسالة تبدو مريبة؟',
      subheadline: 'ضع لقطة شاشة أو الصق نص رسالة من واتساب أو SMS أو بريد إلكتروني. فحص فوري بالدارجة المغربية، العربية، الفرنسية والإنجليزية.',
      dropzoneTitle: 'اسحب لقطة الشاشة هنا أو انقر للاختيار',
      dropzoneSubtitle: 'يقبل صور الشاشة (PNG, JPG, WebP) أو الصق مباشرة بـ Ctrl+V',
      orPaste: 'أو اكتب أو الصق نص الرسالة هنا',
      pastePlaceholder: 'مثال: مبروك ربحتي معنا سيارة... / طرد بريدي معلق يرجى دفع 15 درهم...',
      analyzeBtn: 'فحص الرسالة الآن',
      analyzing: 'جاري التحليل وقواعد الأمان الصارمة...',
      trySample: 'جرب أمثلة واقعية:',
      samples: {
        inwiPrize: 'احتيال جائزة اتصالات (بالدارجة)',
        amanaFee: 'احتيال رسوم طرد أمانة 18 درهم',
        legitOtp: 'رمز تأكيد بنكي حقيقي وآمن',
        colleagueCoffee: 'رسالة عادية من زميل عمل',
      },
      transcriptionTitle: 'ما قرأه النظام من لقطة الشاشة',
      redFlagsTitle: 'العلامات التحذيرية المكتشفة',
      whatToDoTitle: 'ماذا يجب أن تفعل الآن؟',
      reportToTitle: 'جهات التبليغ الرسمية',
      resetBtn: 'فحص رسالة أخرى',
      safeVerdict: 'تبدو آمنة',
      suspiciousVerdict: 'مريبة — توخ الحذر',
      scamVerdict: 'احتيال مؤكد',
      confidence: 'نسبة التأكيد',
      guardrailBadge: 'مؤكد بقواعد الأمان الحتمية',
      personalizationRiskBadge: 'تم رصد استهداف مخصص لمعلوماتك',
      trust1: 'أكثر من 15 نمط احتيال مغربي',
      trust2: 'معالجة مؤقتة في الذاكرة 100%',
      trust3: 'لا نطلب أي كلمة سر مطلقا',
    },
    benchmarks: {
      eyebrow: 'التقييم والتحقق',
      title: 'منصة اختبار النماذج وحواجز الأمان',
      subtitle: 'مصفوفة تحقق عبر 40 سيناريو موثق (تصيد بنكي، جوائز وهمية، رموز حقيقية، وملفات بصمة رقمية).',
      runBtn: 'تشغيل الاختبار الكامل',
      runningBtn: 'جاري تشغيل 40 حالة مباشرة...',
      setHeldOut: '20 حالة غير مرئية مسبقاً (Held-Out)',
      setDev: '20 حالة لمعايرة النظام (Dev Set)',
      accuracy: 'الدقة العامة',
      precision: 'الدقة الموجبة',
      recall: 'نسبة الاسترجاع',
      latencyAvg: 'متوسط الاستجابة',
      latencyP95: 'استجابة P95',
      guardrailPass: 'الحواجز النشطة',
      casesEvaluated: 'حالة تم فحصها',
    },
    monitoring: {
      title: 'المراقبة الحية والرصد المباشر',
      subtitle: 'متابعة حية للطلبات متعددة النماذج والسرعات وحالات تفعيل حواجز الأمان الحتمية.',
      systemHealth: 'حالة النظام',
      operational: 'يعمل بكفاءة',
      totalRequests: 'إجمالي الطلبات',
      avgLatency: 'متوسط الاستجابة',
      guardrailEnforcements: 'الحواجز المفعلة',
      liveLogs: 'سجلات التشغيل الحديثة',
    },
    common: {
      deleteSession: 'مسح الجلسة فوراً',
      sessionDeleted: 'تم مسح جميع البيانات من الذاكرة بالكامل.',
      aiNotice: 'الذكاء الاصطناعي قد يخطئ — القرار النهائي بيدك دائماً.',
      debugView: 'لوحة التطوير (?debug=1)',
      realExecution: 'قياس زمني حقيقي',
    },
  },

  en: {
    appName: 'Kashif · كاشف',
    appSubtitle: 'Privacy-First Social Engineering Defense & Exposure Audit',
    tabs: {
      exposureCheck: 'Exposure Check',
      scamShield: 'Scam Shield',
      benchmarks: 'Reliability & Benchmarks',
      monitoring: 'Live Monitoring',
    },
    header: {
      purgeBtn: 'Purge Session',
      purgeSuccess: 'Session cleared: all memory data purged successfully.',
      debugToggle: 'Debug',
    },
    footer: {
      poweredBy: 'Analysis powered by',
      stackDesc: 'Kashif Hybrid Multi-Provider Architecture (Gemini · Groq · Brev) with strict deterministic guardrails',
      autoFallback: 'auto-fallback',
      zeroPersistence: 'Strict in-memory zero persistence · AI advises, you decide',
      debugPanel: 'debug panel',
      reliabilityLink: 'View reliability benchmark results & technical architecture →',
    },
    hero: {
      eyebrow: 'PRIVACY AUDIT',
      headlinePrefix: 'See what a',
      headlineAccent: 'stranger',
      headlineSuffix: 'could learn about you.',
      subheadline: 'Analyze 1 to 3 screenshots or upload your official data export to measure your exposed information and weaponizable social engineering footprint.',
      stat1Value: '15+',
      stat1Label: 'Moroccan threat patterns',
      stat2Value: '100%',
      stat2Label: 'In-memory volatile audit',
      stat3Value: '0',
      stat3Label: 'Passwords requested',
      scamShieldSwitchPrompt: 'Suspecting a suspicious text or direct message instead?',
      scamShieldSwitchSub: 'Switch to Scam Shield to audit a text, delivery link, or fake banking OTP.',
      previewCaption: 'Preview — example result',
      howItWorksEyebrow: 'HOW IT WORKS',
      howItWorksSub: 'Live preview of the audit process',
    },
    modes: {
      fullTab: 'Full Audit (.zip export)',
      fullBadge: 'Existing Profile',
      quickTab: 'Check Before Posting',
      quickBadge: 'Image or Video',
      trustNotice: '100% in local memory · Zero passwords needed',
      fullHeroTitle: 'A profile only shows what you choose. Your export reveals everything — even what you’ve forgotten.',
      fullHeroSub: 'Instagram, Facebook, and TikTok allow you to download your official data archive for free (no passwords needed). It contains your complete posts, captions, comments on others, location history, and past searches.',
      quickHeroTitle: 'About to post? Check what it reveals first.',
      quickHeroSub: 'Drop a screenshot or short video (up to 30s) of a post you are about to publish: Kashif analyzes routine clues, visible documents, people, and metadata before you share.',
    },
    fullDropzone: {
      title: 'Drop your .zip archive',
      subtitle: 'Official Instagram, Facebook, or TikTok archive downloaded from your account settings.',
      badge: '.ZIP File',
      processingNote: '100% Local processing',
      fileLoaded: 'Archive file loaded',
      sizeLabel: 'Size',
      readyForAnalysis: 'Ready for comprehensive audit',
      changeFile: 'Change',
      startBtn: 'Start Full Archive Audit',
      scanning: 'Parsing JSON fields & running audit...',
    },
    quickDropzone: {
      title: 'Drop your image or short video',
      subtitle: 'Screenshot of your upcoming post (1-3 images) or short video clip (MP4/WebM up to 30s) before posting.',
      badge: 'Photos (PNG, JPG, WebP)',
      videoBadge: 'Video (max 30s / 50MB)',
      pasteHint: 'or paste (Ctrl+V)',
      readyCount: 'Files ready',
      videoLoaded: 'Video loaded ready for audit',
      videoLimitNote: 'Video analyzed via keyframe sampling and audio track transcription.',
      addReplace: '+ Add / Replace',
      startBtn: 'Check Before Posting',
      scanning: 'Running pre-publish check...',
      extractingFrames: 'Extracting video keyframes...',
      transcribingAudio: 'Transcribing and analyzing audio track...',
      analyzingContent: 'Visual clues audit & threat detection...',
    },
    exportGuide: {
      title: 'How to download your official data export (Exact menu path)',
      subtitle: 'Zero passwords requested by Kashif. You download your own archive directly from the official platform.',
      tabs: {
        instagram: 'Instagram',
        facebook: 'Facebook',
        tiktok: 'TikTok',
      },
      instagramLabel: '📱 On the Instagram App:',
      instagramPath: 'Profile → Menu (☰) → Accounts Center (Meta) → Your information and permissions → Download your information → Format: JSON (Recommended)',
      instagramNote: 'Instagram prepares the archive and sends a notification. Download the .zip file and drop it directly into the box above.',
      facebookLabel: '💻 On Facebook (Web or Mobile):',
      facebookPath: 'Settings & privacy → Settings → Your Facebook information → Download profile information → Select JSON format',
      facebookNote: 'Includes your posts, comments, location tags, and group interactions.',
      tiktokLabel: '🎵 On the TikTok App:',
      tiktokPath: 'Profile → Menu (☰) → Settings and privacy → Account → Download your data → Format: JSON',
      tiktokNote: 'Generates an archive of your videos, browsing history, and past comments.',
    },
    demoProfiles: {
      callout: 'Don’t have your export yet? Try a demo profile below.',
      title: 'Load Synthetic Moroccan Demo Profiles',
      fullModeSub: '(Simulates a full export)',
      quickModeSub: '(Simulates 1-3 screenshots)',
      oneClickBadge: '1-click test',
      readyFull: 'Full export ready',
      readyQuick: '3 screenshots ready',
      selectedLabel: 'Selected profile:',
      auditAction: 'Audit this profile now',
      tiers: {
        critical: 'Critical',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
      },
    },
    ownership: {
      title: 'Anti-Misuse & Ownership Check',
      expl: 'If you control the email tied to the account, you prove legitimate ownership — the same trust model platforms use for account recovery. We store nothing.',
      emailLabel: 'Your Email Address',
      usernameLabel: 'Account Username',
      otpBtn: 'OTP Code',
      verifyBtn: 'Verify',
      verifiedBadge: '✓ Verified',
      accountValidated: 'Account validated',
      associatedWith: 'Audit is associated with',
    },
    report: {
      scoreTitle: 'Global Exposure Threat Score',
      prePublishScoreTitle: 'Pre-Publish Threat Risk Index',
      prePublishTitle: 'What you are about to expose',
      prePublishSub: 'Here is what an adversary could infer from this post — apply the concrete edits below before posting.',
      recommendationsTitle: 'Concrete Recommendations Before Posting',
      recommendationsSub: 'Actionable edits (blurring, cropping, audio removal) to neutralize risks prior to publishing.',
      concreteEditLabel: 'Recommended Action:',
      impactLabel: 'Security Benefit:',
      videoHonestyNote: 'Certified Video Keyframe Sampling',
      transcriptTitle: 'Audio Track Transcript',
      spokenRisksTitle: 'Information Disclosed Aloud in Video',
      levelCritical: 'CRITICAL',
      levelHigh: 'HIGH',
      levelMedium: 'MEDIUM',
      levelLow: 'LOW',
      simulatedScoreNote: '✓ Simulated score after resolving',
      actionsResolvedSuffix: 'recommended security measures.',
      accountLabel: 'Account:',
      captionsProcessed: 'Captures processed:',
      archiveLabel: 'Official archive:',
      auditLatency: 'Neural audit time:',
      verifiedOwner: '✓ Verified owner',
      exifTitle: 'EXIF Metadata & Privacy:',
      gdprNotice: 'CNDP / GDPR Compliant',
      findingsTitle: 'Identified Clues & Leakages',
      weightedBySeverity: 'Weighted by severity',
      sourceLabel: 'Source:',
      locationTimelineTitle: 'Movement Timeline & Location History',
      locationTimelineSub: 'Tracked places in archive',
      searchHistoryTitle: 'Private searches preserved in export',
      searchHistorySub: 'Extracted queries',
      commentsTitle: 'Public comments and interactions',
      adInterestsTitle: 'Inferred advertising interests',
      attackPathsTitle: 'Realistic Attack Paths',
      attackPathsSub: 'Social engineering derived from your data',
      fixChecklistTitle: 'Prioritized Fix Checklist',
      fixChecklistSub: 'Check items to simulate improved security score',
      simulationTitle: 'Defensive Attack Simulation (Educational Spear-Phishing)',
      simulationSub: 'Generates the exact tailored message a scammer could craft by weaponizing only your discovered public data above.',
      simulationBtn: 'Generate Simulation',
      simulatingBtn: 'Generating...',
      simulationBadge: 'DEFENSIVE SIMULATION: Crafted exclusively to illustrate exploitation patterns.',
      vectorLabel: 'Vector:',
      senderLabel: 'Sender:',
      deceptionMechanism: 'Deception mechanism:',
      resetBtn: 'Audit another profile or archive',
      photosAnalyzedNotice: 'photos analyzed out of',
      photosNoticeSub: 'To maintain responsiveness, vision analysis targets the 20 most recent photos and files with GPS tags.',
      postsFound: 'Posts Found',
      publicComments: 'Public Comments',
      savedSearches: 'Preserved Searches',
      photosAndFaces: 'Photos & Faces',
      videoAnalyzedLabel: 'Video analyzed:',
      preventiveAuditBadge: 'Preventive Audit',
      anonymousUser: 'anonymous',
    },
    scamShield: {
      eyebrow: 'SCAM SHIELD',
      headline: 'Got a strange message? Drop it here.',
      subheadline: 'Paste a message or drop a screenshot from SMS, WhatsApp, Instagram or email. Real multi-provider AI + instant deterministic guardrails.',
      dropzoneTitle: 'Drop screenshot here or click to browse',
      dropzoneSubtitle: 'Supports PNG, JPG, WebP screenshots or paste directly with Ctrl+V',
      orPaste: 'or type / paste the raw text below',
      pastePlaceholder: 'E.g. Congrats you won 10,000 DH send us the SMS code... / Your parcel is held pay 15 DH on bit.ly...',
      analyzeBtn: 'Analyze Scam Risk',
      analyzing: 'Evaluating threat vectors & security rules...',
      trySample: 'Try realistic test samples:',
      samples: {
        inwiPrize: 'Telecom Prize Scam (Darija)',
        amanaFee: 'Amana Parcel Fee (18 DH)',
        legitOtp: 'Legit Bank OTP Notice',
        colleagueCoffee: 'Legit Colleague Invitation',
      },
      transcriptionTitle: 'What I read from your screenshot',
      redFlagsTitle: 'Identified Red Flags',
      whatToDoTitle: 'Recommended Actions',
      reportToTitle: 'Official Reporting Contacts',
      resetBtn: 'Analyze Another Message',
      safeVerdict: 'Looks Safe',
      suspiciousVerdict: 'Suspicious — Caution',
      scamVerdict: 'Confirmed Scam',
      confidence: 'Confidence Score',
      guardrailBadge: 'Enforced by Deterministic Guardrail',
      personalizationRiskBadge: 'Personalized Spear-Phishing Risk Detected',
      trust1: '15+ Moroccan scam patterns',
      trust2: '100% in-memory processing',
      trust3: 'Zero passwords requested',
    },
    benchmarks: {
      eyebrow: 'BENCHMARK & VALIDATION',
      title: 'Multi-Model Benchmark & Guardrail Matrix',
      subtitle: 'System validation across 40 certified test cases (banking smishing, lottery scams, legit 2FA, and exposure profiles).',
      runBtn: 'Run Full Benchmark',
      runningBtn: 'Running 40 live cases...',
      setHeldOut: '20 Held-Out Cases (Unseen)',
      setDev: '20 Dev Set Cases (Calibration)',
      accuracy: 'Global Accuracy',
      precision: 'Precision',
      recall: 'Recall',
      latencyAvg: 'Avg Latency',
      latencyP95: 'P95 Latency',
      guardrailPass: 'Guardrails Active',
      casesEvaluated: 'cases evaluated',
    },
    monitoring: {
      title: 'Live Telemetry & Observability',
      subtitle: 'Real-time telemetry of multi-provider routing, latencies, and deterministic guardrail triggers.',
      systemHealth: 'System Health',
      operational: 'Operational',
      totalRequests: 'Total Requests',
      avgLatency: 'Avg Latency',
      guardrailEnforcements: 'Guardrails Enforced',
      liveLogs: 'Recent Execution Logs',
    },
    common: {
      deleteSession: 'Purge Session',
      sessionDeleted: 'All in-memory session traces purged successfully.',
      aiNotice: 'AI models can make mistakes — always exercise ultimate judgment.',
      debugView: 'Developer Panel (?debug=1)',
      realExecution: 'Real measured execution',
    },
  },
};

export const translations: Record<Language, Translations> = {
  fr: createSafeProxy(rawTranslations.fr, 'fr'),
  ar: createSafeProxy(rawTranslations.ar, 'ar'),
  en: createSafeProxy(rawTranslations.en, 'en'),
};
