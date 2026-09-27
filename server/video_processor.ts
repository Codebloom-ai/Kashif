import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { analyzeExposureImage, compileExposureReport, generatePrePublishRecommendations } from './exposure.ts';
import { call_llm } from './llm_provider.ts';
import { ExposureImageAnalysis, ExposureReport } from './types.ts';

const execFileAsync = promisify(execFile);

interface VideoProcessingOptions {
  isPrePublish?: boolean;
  claimedUsername?: string;
  verifiedToken?: string;
  userLanguage?: 'fr' | 'en' | 'ar';
}

// Helper to inspect duration via ffprobe or ffmpeg
async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath,
    ]);
    const duration = parseFloat(stdout.trim());
    if (!isNaN(duration) && duration > 0) {
      return duration;
    }
  } catch {
    // Fallback: try ffmpeg -i and parse duration string
    try {
      const { stderr } = await execFileAsync('ffmpeg', ['-i', videoPath]);
      const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const secs = parseFloat(match[3]);
        return hours * 3600 + mins * 60 + secs;
      }
    } catch (e: any) {
      const match = (e?.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const secs = parseFloat(match[3]);
        return hours * 3600 + mins * 60 + secs;
      }
    }
  }
  return 10; // Default assumption if probe fails
}

export async function processVideoFile(
  videoBuffer: Buffer,
  mimeType: string,
  options: VideoProcessingOptions = {}
): Promise<ExposureReport> {
  const startTime = performance.now();
  const tmpDir = os.tmpdir();
  const fileId = `kashif_vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const videoExt = mimeType.includes('quicktime') ? 'mov' : mimeType.includes('webm') ? 'webm' : 'mp4';
  const videoPath = path.join(tmpDir, `${fileId}.${videoExt}`);
  const audioPath = path.join(tmpDir, `${fileId}_audio.mp3`);
  const framePaths: string[] = [];

  try {
    // 1. Write video buffer to disk
    await fs.promises.writeFile(videoPath, videoBuffer);

    // 2. Probe duration
    const rawDuration = await getVideoDuration(videoPath);
    // Cap at 30 seconds for hackathon/preview scope
    const duration = Math.min(Math.max(1, rawDuration), 30);

    // 3. Extract evenly-spaced keyframes (e.g. 6 to 10 frames)
    const targetFramesCount = Math.min(Math.max(4, Math.round(duration / 3)), 10);
    const step = duration / (targetFramesCount + 1);

    for (let i = 1; i <= targetFramesCount; i++) {
      const timestamp = (i * step).toFixed(2);
      const framePath = path.join(tmpDir, `${fileId}_frame_${i}.jpg`);
      framePaths.push(framePath);

      try {
        await execFileAsync('ffmpeg', [
          '-ss', timestamp,
          '-i', videoPath,
          '-frames:v', '1',
          '-q:v', '2',
          '-y',
          framePath,
        ]);
      } catch (fErr) {
        console.warn(`[processVideoFile] Frame extraction at ${timestamp}s warning:`, fErr);
      }
    }

    // Filter successfully extracted frames
    const existingFrames: { path: string; index: number; timestampSec: number }[] = [];
    for (let i = 0; i < framePaths.length; i++) {
      const p = framePaths[i];
      if (fs.existsSync(p)) {
        existingFrames.push({
          path: p,
          index: i,
          timestampSec: Math.round((i + 1) * step),
        });
      }
    }

    // 4. Extract audio track if present
    let hasAudio = false;
    try {
      await execFileAsync('ffmpeg', [
        '-i', videoPath,
        '-vn',
        '-acodec', 'libmp3lame',
        '-q:a', '4',
        '-y',
        audioPath,
      ]);
      if (fs.existsSync(audioPath)) {
        const stats = await fs.promises.stat(audioPath);
        if (stats.size > 2048) {
          hasAudio = true;
        }
      }
    } catch {
      hasAudio = false;
    }

    // 5. Transcribe and analyze audio if present using Gemini speech capabilities
    let transcript = '';
    const spokenFindings: ExposureReport['findings'] = [];

    const userLang = options.userLanguage || 'fr';
    const langName = userLang === 'ar' ? 'Arabic' : userLang === 'en' ? 'English' : 'French';

    if (hasAudio) {
      try {
        const audioBuffer = await fs.promises.readFile(audioPath);
        const audioBase64 = audioBuffer.toString('base64');

        const audioPrompt = `You are Kashif (كاشف) Speech Privacy & Threat Forensics Engine.
Transcribe verbatim any spoken dialogue in this audio clip (French, Moroccan Darija, Arabic, or English).
Scan the spoken text for sensitive personal disclosures:
- Spoken full names, family member names
- Spoken physical addresses, buildings, landmarks, city quarters
- Spoken phone numbers, email addresses
- Spoken workplaces, schools, employers, routines (e.g. "I'm going to work at Technopark every morning at 8")
- Spoken banking details or confidential matters

CRITICAL LANGUAGE RULE:
Respond ENTIRELY in ${langName} — do not mix languages. Spoken disclosures title, detail, and explanations MUST be written in ${langName}.

Return STRICT JSON:
{
  "transcript": "Verbatim transcript of spoken speech, or empty string if no speech",
  "has_speech": boolean,
  "spoken_disclosures": [
    {
      "category": "contact_leakage" | "workplace_or_school" | "geographic_location" | "daily_routine" | "minor_presence" | "spoken_disclosure",
      "severity": "low" | "medium" | "high" | "critical",
      "title": "Brief title in ${langName}",
      "detail": "Detailed explanation with the exact spoken quote in ${langName}",
      "weight_points": number
    }
  ]
}`;

        const audioRes = await call_llm({
          messages: [{ role: 'user', content: audioPrompt }],
          images: [{ mimeType: 'audio/mp3', base64Data: audioBase64 }],
          jsonSchema: true,
          temperature: 0.1,
          timeoutMs: 15000,
        });

        const parsedAudio = audioRes.parsedJson || {};
        transcript = parsedAudio.transcript || '';

        if (Array.isArray(parsedAudio.spoken_disclosures)) {
          for (const sd of parsedAudio.spoken_disclosures) {
            spokenFindings.push({
              category: sd.category || 'spoken_disclosure',
              severity: sd.severity || 'medium',
              title: sd.title || (userLang === 'ar' ? 'إفصاح شخصي في التسجيل الصوتي' : userLang === 'en' ? 'Personal disclosure in audio track' : 'Divulgation personnelle dans la piste audio'),
              detail: sd.detail || (userLang === 'ar' ? 'تم رصد معلومات شفهية حساسة في التسجيل الصوتي للفيديو.' : userLang === 'en' ? 'Sensitive spoken disclosures identified in video sound track.' : 'Propos oraux sensibles identifiés dans l’enregistrement sonore de la vidéo.'),
              where_seen: userLang === 'ar' ? 'المسار الصوتي للفيديو' : userLang === 'en' ? 'Video audio track' : 'Piste audio de la vidéo',
              weight_points: typeof sd.weight_points === 'number' ? sd.weight_points : 15,
            });
          }
        }
      } catch (aErr: any) {
        console.warn('[processVideoFile] Audio transcription warning:', aErr?.message || aErr);
      }
    }

    // 6. Run vision analysis on extracted video frames
    const frameAnalyses: ExposureImageAnalysis[] = [];
    for (let fIdx = 0; fIdx < existingFrames.length; fIdx++) {
      const f = existingFrames[fIdx];
      const frameBuffer = await fs.promises.readFile(f.path);
      const analysis = await analyzeExposureImage(
        frameBuffer,
        'image/jpeg',
        fIdx,
        options.claimedUsername,
        userLang
      );
      analysis.image_type = 'post';
      frameAnalyses.push(analysis);
    }

    // 7. Deduplicate visual findings across video frames
    // (e.g. same landmark or badge appearing across 4 frames shows once with note: "visible throughout the clip")
    const rawVisualReport = compileExposureReport(
      frameAnalyses,
      options.claimedUsername,
      undefined,
      !!options.verifiedToken,
      Math.round(performance.now() - startTime),
      'gemini',
      'gemini-3.8-flash',
      options.isPrePublish ?? true,
      userLang
    );

    // Group and deduplicate findings by category and normalized title
    const dedupedFindings: ExposureReport['findings'] = [];
    const seenMap = new Map<string, { count: number; finding: ExposureReport['findings'][0] }>();

    for (const f of rawVisualReport.findings) {
      const normKey = `${f.category}:${f.title.toLowerCase().replace(/image\s*\d+/gi, '').trim()}`;
      if (!seenMap.has(normKey)) {
        seenMap.set(normKey, { count: 1, finding: { ...f } });
      } else {
        const item = seenMap.get(normKey)!;
        item.count += 1;
      }
    }

    // Build consolidated list
    for (const [, item] of seenMap.entries()) {
      const consolidated = { ...item.finding };
      if (item.count > 1) {
        if (userLang === 'ar') {
          consolidated.detail = `${consolidated.detail} (تم رصده في ${item.count} لقطات رئيسية مستخرجة — ظاهر طوال مقطع الفيديو).`;
          consolidated.where_seen = `فيديو : موجود في ${item.count} لقطات`;
        } else if (userLang === 'en') {
          consolidated.detail = `${consolidated.detail} (Detected across ${item.count} extracted key frames — visible throughout the clip).`;
          consolidated.where_seen = `Video: present in ${item.count} sequences`;
        } else {
          consolidated.detail = `${consolidated.detail} (Détecté sur ${item.count} images clés extraites — visible tout au long du clip).`;
          consolidated.where_seen = `Vidéo : présent sur ${item.count} séquences`;
        }
      } else {
        consolidated.where_seen = userLang === 'ar' ? 'لقطة فيديو' : userLang === 'en' ? 'Video sequence' : 'Séquence vidéo';
      }
      dedupedFindings.push(consolidated);
    }

    // Merge audio findings into findings list
    for (const af of spokenFindings) {
      dedupedFindings.push(af);
    }

    // Recompute score deterministically from deduplicated findings
    let finalScore = 0;
    for (const f of dedupedFindings) {
      finalScore += f.weight_points;
    }
    finalScore = Math.min(100, Math.max(0, finalScore));

    let finalLevel: ExposureReport['level'] = 'low';
    if (finalScore >= 76) finalLevel = 'critical';
    else if (finalScore >= 51) finalLevel = 'high';
    else if (finalScore >= 26) finalLevel = 'medium';

    // Generate concrete pre-publish recommendations
    const prePublishRecs = generatePrePublishRecommendations(dedupedFindings, frameAnalyses, userLang);

    const totalLatency = Math.round(performance.now() - startTime);

    const defaultTranscript = hasAudio
      ? userLang === 'ar'
        ? 'لم يتم رصد حديث واضح أو موسيقى خلفية فقط'
        : userLang === 'en'
        ? 'No clear speech detected or background music only'
        : 'Parole non détectée ou musique de fond'
      : userLang === 'ar'
      ? 'فيديو صامت (لا يوجد مسار صوتي)'
      : userLang === 'en'
      ? 'Muted video (no audio track)'
      : 'Vidéo muette (aucune piste audio)';

    const videoNote = userLang === 'ar'
      ? `تحليل مبني على ${existingFrames.length} لقطات مستخرجة من الفيديو (خلال ${Math.round(duration)} ثوانٍ)`
      : userLang === 'en'
      ? `Analysis based on ${existingFrames.length} frames extracted from video (across ${Math.round(duration)} seconds)`
      : `Analyse basée sur ${existingFrames.length} images extraites de la vidéo (sur ${Math.round(duration)} secondes)`;

    return {
      score: finalScore,
      level: finalLevel,
      images_analyzed: existingFrames.length,
      findings: dedupedFindings,
      attack_paths: rawVisualReport.attack_paths,
      fix_checklist: rawVisualReport.fix_checklist,
      pre_publish_recommendations: prePublishRecs,
      video_metadata: {
        duration_sec: Math.round(duration),
        frames_extracted: existingFrames.length,
        transcript: transcript || defaultTranscript,
        audio_findings: spokenFindings.map((sf) => `${sf.title} : ${sf.detail}`),
        note: videoNote,
      },
      is_pre_publish: options.isPrePublish ?? true,
      per_image_results: frameAnalyses,
      provider_used: 'gemini',
      model_used: 'gemini-3.8-flash',
      total_latency_ms: totalLatency,
      verified_via_email: !!options.verifiedToken,
      claimed_username: options.claimedUsername,
    };
  } finally {
    // 8. Strict Zero-Persistence cleanup
    try {
      if (fs.existsSync(videoPath)) await fs.promises.unlink(videoPath);
      if (fs.existsSync(audioPath)) await fs.promises.unlink(audioPath);
      for (const p of framePaths) {
        if (fs.existsSync(p)) await fs.promises.unlink(p);
      }
    } catch {
      // ignore cleanup errors
    }
  }
}
