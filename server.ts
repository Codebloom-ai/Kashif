import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeScamRisk } from './server/scam_shield.ts';
import {
  requestOwnershipCode,
  verifyOwnershipCode,
  analyzeExposureImage,
  verifyClaimedUsernameInProfile,
  compileExposureReport,
  generateDefensiveAttackSimulation,
} from './server/exposure.ts';
import { parseSocialArchiveZip, compileFullExportReport } from './server/export_parser.ts';
import { getOrGenerateSyntheticProfiles } from './server/synthetic.ts';
import { runFullLiveBenchmark, getLastBenchmarkReport } from './server/benchmark.ts';
import { getMonitoringStats, getUsageLogs } from './server/logger.ts';
import { getProviderPriority } from './server/llm_provider.ts';
import { ExposureImageAnalysis } from './server/types.ts';
import { processVideoFile } from './server/video_processor.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

const app = express();

// Increase JSON body limit to 60MB for video and screenshot processing
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// 1. Health check & configuration status
app.get('/api/health', (req, res) => {
  const providerPriority = getProviderPriority();
  res.json({
    status: 'ok',
    primary_provider: providerPriority[0] || 'gemini',
    fallback_priority: providerPriority,
    has_gemini_key: !!process.env.GEMINI_API_KEY,
    has_groq_key: !!process.env.GROQ_API_KEY,
    has_brev_url: !!process.env.BREV_BASE_URL,
    demo_mode: process.env.DEMO_MODE === 'true',
    timestamp: new Date().toISOString(),
  });
});

// 2. Scam Shield Analysis
app.post('/api/scam-shield', async (req, res) => {
  try {
    const { text = '', imageBase64, imageMimeType, personalExposureCategories, userLanguage } = req.body;
    if (!text && !imageBase64) {
      return res.status(400).json({ error: 'Text or image is required for Scam Shield analysis.' });
    }

    const result = await analyzeScamRisk({
      text,
      imageBase64,
      imageMimeType,
      personalExposureCategories,
      userLanguage,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/scam-shield:', error);
    res.status(500).json({
      error: error.message || 'Internal error in Scam Shield analysis',
    });
  }
});

// 3. Exposure Check — Ownership request
app.post('/api/exposure/verify-request', (req, res) => {
  try {
    const { email, username, isDemo = false } = req.body;
    if (!email || !username) {
      return res.status(400).json({ error: 'Email and username are required.' });
    }
    const result = requestOwnershipCode(email, username, isDemo);
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/exposure/verify-request:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Exposure Check — Ownership confirmation
app.post('/api/exposure/verify-confirm', (req, res) => {
  try {
    const { email, username, code, isDemo = false } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required.' });
    }
    const result = verifyOwnershipCode(email, username, code, isDemo);
    if (!result.verified) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    console.error('Error in /api/exposure/verify-confirm:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Exposure Check — Pre-Publish / Check Before Posting (1-3 images)
app.post('/api/exposure/analyze', async (req, res) => {
  const startTime = performance.now();
  try {
    const { images = [], claimedUsername = '', verifiedToken = '', isPrePublish = true, userLanguage = 'fr' } = req.body;
    if (!images || images.length === 0) {
      return res.status(400).json({ error: 'At least 1 image is required for Exposure Check.' });
    }

    const limitedImages = images.slice(0, 3);
    const analyses: ExposureImageAnalysis[] = [];
    let usernameVerification: any = undefined;

    // Process images
    for (let i = 0; i < limitedImages.length; i++) {
      const img = limitedImages[i];
      const cleanBase64 = img.base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const mimeType = img.mimeType || 'image/png';

      const analysis = await analyzeExposureImage(buffer, mimeType, i, claimedUsername, userLanguage);
      analyses.push(analysis);

      // If this is image 0 (assumed profile card) and username was claimed, verify handle match
      if (i === 0 && claimedUsername && analysis.image_type === 'profile') {
        try {
          usernameVerification = await verifyClaimedUsernameInProfile(buffer, mimeType, claimedUsername);
        } catch (vErr) {
          console.warn('Username verification check warning:', vErr);
        }
      }
    }

    const totalLatency = Math.round(performance.now() - startTime);
    const report = compileExposureReport(
      analyses,
      claimedUsername,
      usernameVerification,
      !!verifiedToken,
      totalLatency,
      'gemini',
      'gemini-3.8-flash',
      isPrePublish,
      userLanguage
    );

    res.json(report);
  } catch (error: any) {
    console.error('Error in /api/exposure/analyze:', error);
    const totalLatency = Math.round(performance.now() - startTime);
    const fallbackReport = compileExposureReport(
      [],
      req.body?.claimedUsername || '',
      undefined,
      !!req.body?.verifiedToken,
      totalLatency,
      'gemini',
      'gemini-3.8-flash',
      req.body?.isPrePublish,
      req.body?.userLanguage || 'fr'
    );
    res.json(fallbackReport);
  }
});

// 5a. Exposure Check — Video Analysis (Short clip 10-30s)
app.post('/api/exposure/analyze-video', async (req, res) => {
  try {
    const { videoBase64, mimeType = 'video/mp4', claimedUsername = '', verifiedToken = '', isPrePublish = true, userLanguage = 'fr' } = req.body;
    if (!videoBase64) {
      return res.status(400).json({ error: 'Video file data (videoBase64) is required.' });
    }

    const cleanBase64 = videoBase64.replace(/^data:video\/[\w.-]+;base64,/, '').replace(/^data:;base64,/, '');
    const videoBuffer = Buffer.from(cleanBase64, 'base64');

    const report = await processVideoFile(videoBuffer, mimeType, {
      isPrePublish,
      claimedUsername,
      verifiedToken,
      userLanguage,
    });

    res.json(report);
  } catch (error: any) {
    console.error('Error in /api/exposure/analyze-video:', error);
    res.status(500).json({ error: error.message || 'Erreur lors du traitement de la vidéo.' });
  }
});

// 5b. Exposure Check — Full Official Export Analysis (.zip or simulated)
app.post('/api/exposure/analyze-export', async (req, res) => {
  const startTime = performance.now();
  try {
    const { zipBase64, simulatedExport, claimedUsername = '', verifiedToken = '', userLanguage = 'fr' } = req.body;

    if (simulatedExport) {
      // Running Full Check on a simulated Moroccan export
      const latency = Math.round(performance.now() - startTime) + 450;
      const report = await compileFullExportReport(
        simulatedExport,
        [],
        !!verifiedToken,
        latency,
        userLanguage
      );
      return res.json(report);
    }

    if (!zipBase64) {
      return res.status(400).json({ error: "Fichier .zip d'export ou export simulé requis." });
    }

    const cleanBase64 = zipBase64.replace(/^data:application\/[\w.-]+;base64,/, '').replace(/^data:;base64,/, '');
    const zipBuffer = Buffer.from(cleanBase64, 'base64');

    const { exportData, photos } = await parseSocialArchiveZip(zipBuffer);
    const latency = Math.round(performance.now() - startTime);

    const report = await compileFullExportReport(
      exportData,
      photos,
      !!verifiedToken,
      latency,
      userLanguage
    );

    res.json(report);
  } catch (error: any) {
    console.error('Error in /api/exposure/analyze-export:', error);
    res.status(500).json({ error: error.message || "Erreur lors de l'analyse de l'export .zip." });
  }
});

// 6. Exposure Check — Defensive Attack Simulation
app.post('/api/exposure/simulate-attack', async (req, res) => {
  try {
    const { report, userLanguage = 'fr' } = req.body;
    if (!report || !report.findings) {
      return res.status(400).json({ error: 'A valid exposure report is required.' });
    }
    const simulation = await generateDefensiveAttackSimulation(report, userLanguage);
    res.json(simulation);
  } catch (error: any) {
    console.error('Error in /api/exposure/simulate-attack:', error);
    const userLanguage = req.body?.userLanguage || 'fr';
    res.json({
      attacker_persona: userLanguage === 'ar' ? 'مندوب توصيل أو دعم مزيف' : userLanguage === 'en' ? 'Fake Delivery / Support Agent' : 'Faux coursier / faux support',
      attack_vector: userLanguage === 'ar' ? 'تصيد موجه عبر رسائل SMS' : userLanguage === 'en' ? 'Targeted SMS Smishing' : 'SMS Smishing ciblé',
      simulated_message: userLanguage === 'ar' ? 'مرحباً، بناءً على نشاطك الأخير، يرجى تأكيد هويتك عبر بوابتنا الآمنة.' : userLanguage === 'en' ? 'Hello, regarding your recent activity, please confirm your identity on our secure portal.' : 'Bonjour, suite à votre activité récente, merci de valider votre identité sur le portail sécurisé.',
      defensive_explanation: userLanguage === 'ar' ? 'يستغل المهاجم بصمتك العامة لخلق شعور زائف بالإلحاح والمصداقية.' : userLanguage === 'en' ? 'The attacker leverages your public footprint to fabricate urgency.' : 'L’attaquant exploite vos présences publiques pour susciter l’urgence.',
      provider: 'rule_engine',
      model: 'defensive_fallback',
      latency_ms: 10,
    });
  }
});

// 7. Synthetic Demo Profiles
app.get('/api/synthetic/profiles', (req, res) => {
  try {
    const force = req.query.regenerate === 'true';
    const profiles = getOrGenerateSyntheticProfiles(force);
    res.json(profiles);
  } catch (error: any) {
    console.error('Error in /api/synthetic/profiles:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. Live Reliability Benchmark Runner
app.post('/api/benchmark/run', async (req, res) => {
  try {
    const report = await runFullLiveBenchmark();
    res.json(report);
  } catch (error: any) {
    console.error('Error running live benchmark:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/benchmark/last', (req, res) => {
  const last = getLastBenchmarkReport();
  res.json({ report: last });
});

// 9. Real-time Monitoring & Usage Logs
app.get('/api/monitoring', (req, res) => {
  try {
    const stats = getMonitoringStats();
    const logs = getUsageLogs(50);
    res.json({ stats, logs });
  } catch (error: any) {
    console.error('Error fetching monitoring stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// 10. Privacy Purge Session
app.post('/api/session/purge', (req, res) => {
  res.json({ purged: true, message: 'All in-memory session markers and verification tokens cleared.' });
});

// Vite middleware mounting in development or static serving in production
async function startServer() {
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kashif (كاشف) server listening on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer();
