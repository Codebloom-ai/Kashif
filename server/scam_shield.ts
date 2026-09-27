import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { call_llm } from './llm_provider.ts';
import { runDeterministicGuardrail, mergeVerdicts } from './guardrail.ts';
import { maskPII } from './masking.ts';
import { RedFlag, ScamShieldResponse, Verdict } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const patternsPath = path.join(rootDir, 'knowledge', 'scam_patterns.json');

interface ScamPattern {
  id: string;
  name: string;
  name_fr: string;
  name_ar: string;
  severity: string;
  target: string;
  keywords: string[];
  description: string;
  advice: string;
  report_to: string;
}

let loadedPatterns: ScamPattern[] = [];
try {
  if (fs.existsSync(patternsPath)) {
    loadedPatterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Failed to load scam patterns:', e);
}

function retrieveRelevantPatterns(text: string): ScamPattern[] {
  const normalized = text.toLowerCase();
  const scored = loadedPatterns.map((p) => {
    let score = 0;
    for (const kw of p.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    return { pattern: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Return top 5 or all matches with score > 0
  const matched = scored.filter((s) => s.score > 0).map((s) => s.pattern);
  return matched.length > 0 ? matched.slice(0, 5) : loadedPatterns.slice(0, 4);
}

export async function transcribeScreenshot(
  imageBase64: string,
  mimeType = 'image/png'
): Promise<{
  sender?: string;
  channel?: string;
  links?: string[];
  raw_text: string;
  provider: string;
  model: string;
  latency_ms: number;
}> {
  const prompt = `You are a forensic OCR and message transcriber for Kashif, a cybersecurity tool.
Examine this screenshot (SMS, WhatsApp, Instagram, Telegram, Email, or Web DM).
Transcribe the content VERBATIM without correcting typos or dialect spelling.
Detect:
1. Sender name or phone number shown (if any).
2. App / channel (e.g. WhatsApp, SMS, Instagram, Email, Browser).
3. Any URLs or links visible in the message.
4. The exact verbatim text content of the message.

Output valid JSON with the exact structure:
{
  "sender": "string or null",
  "channel": "string or null",
  "links": ["string"],
  "raw_text": "string verbatim transcription"
}`;

  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

  const res = await call_llm({
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    images: [{ mimeType, base64Data: cleanBase64 }],
    jsonSchema: true,
    temperature: 0.1,
  });

  const parsed = res.parsedJson || {};
  return {
    sender: parsed.sender || undefined,
    channel: parsed.channel || undefined,
    links: Array.isArray(parsed.links) ? parsed.links : [],
    raw_text: parsed.raw_text || res.content || '',
    provider: res.provider_used,
    model: res.model_used,
    latency_ms: res.latency_ms,
  };
}

export async function analyzeScamRisk(params: {
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
  personalExposureCategories?: string[];
  userLanguage?: 'fr' | 'ar' | 'en';
}): Promise<ScamShieldResponse> {
  const startTime = performance.now();
  let workingText = params.text.trim();
  let transcriptionData: any = undefined;
  let ocrLatency = 0;

  // 1. If an image is provided, transcribe first via vision LLM
  if (params.imageBase64 && params.imageBase64.length > 50) {
    try {
      const transcription = await transcribeScreenshot(params.imageBase64, params.imageMimeType || 'image/png');
      transcriptionData = {
        sender: transcription.sender,
        channel: transcription.channel,
        links: transcription.links,
        raw_text: transcription.raw_text,
      };
      ocrLatency = transcription.latency_ms;
      if (!workingText && transcription.raw_text) {
        workingText = transcription.raw_text;
      } else if (transcription.raw_text && !workingText.includes(transcription.raw_text.substring(0, 20))) {
        // Append transcription if user added some notes
        workingText = `${workingText}\n\n[Transcribed message]: ${transcription.raw_text}`;
      }
    } catch (ocrErr) {
      console.warn('OCR transcription failed, falling back to provided text:', ocrErr);
    }
  }

  if (!workingText) {
    throw new Error('Please provide text or an image containing text to analyze.');
  }

  // 2. Parallel Guardrail execution (deterministic keyword & pattern rules)
  const guardrailResult = runDeterministicGuardrail(workingText);

  // 3. Grounding Context retrieval from scam_patterns.json
  const relevantPatterns = retrieveRelevantPatterns(workingText);
  const patternsContext = relevantPatterns
    .map(
      (p) =>
        `- Pattern ID [${p.id}]: ${p.name} (FR: ${p.name_fr}). Typical targets: ${p.target}. Description: ${p.description}. Recommended action: ${p.advice}. Report to: ${p.report_to}`
    )
    .join('\n');

  // Personalization risk check context
  const personalCategories = params.personalExposureCategories || [];
  const personalizationContext =
    personalCategories.length > 0
      ? `\nSESSION EXPOSURE CONTEXT:\nThe current user has previously exposed the following information categories online: [${personalCategories.join(
          ', '
        )}].\nAssess whether the analyzed message specifically exploits any of these categories (e.g. mentions their workplace, city, family, schedule). If so, set personalization_risk.detected = true with explanation.`
      : '';

  const systemPrompt = `You are Kashif (كاشف) Scam Shield, an expert cyber defense AI specializing in detecting social engineering, SMS phishing (smishing), email phishing, OTP theft, and financial fraud, specifically in Morocco and North Africa (covering Moroccan Darija in Arabic & Latin script, standard Arabic, French, and English).

STRICT VERDICT RULES:
- "scam": High likelihood of deception, fraud, theft, phishing, or social engineering.
- "suspicious": Contains unverified links, urgency, unusual requests, or vague pretexts requiring caution.
- "safe": Normal, benign communication. "safe" requires ALL of: no request for money/code/personal data/click, no suspicious pattern match, and no artificial urgency.

FEW-SHOT EXAMPLES:
1. "مبروك ربحتي 10000 درهم. عطينا الكود باش نصيفطوها ليك" -> verdict: "scam", red_flags: [{"flag": "Prize lure combined with request for SMS confirmation code", "quote_from_message": "عطينا الكود"}]
2. "Tu as gagné 1000dh, entre ton CIN" -> verdict: "scam", red_flags: [{"flag": "Prize lure requiring National Identity Card (CIN)", "quote_from_message": "entre ton CIN"}]
3. "Votre code de vérification est 483920. Ne le communiquez à personne." -> verdict: "safe", red_flags: []
4. "Salut, t'es dispo demain pour le café ?" -> verdict: "safe", red_flags: []
5. "Votre colis est bloqué, payez 15 DH: bit.ly/xxx" -> verdict: "scam", red_flags: [{"flag": "Fake delivery fee demand via shortened link", "quote_from_message": "payez 15 DH: bit.ly/xxx"}]

GROUNDING KNOWLEDGE BASE (Use as context, evaluate the specific message):
${patternsContext}
${personalizationContext}

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "verdict": "safe" | "suspicious" | "scam",
  "confidence": number between 0.00 and 1.00 (evaluate objectively, do NOT give static or round numbers),
  "confidence_reason": "string explaining how the confidence was computed",
  "matched_patterns": ["string ids of matched patterns, or empty"],
  "red_flags": [
    {
      "flag": "string describing the red flag",
      "quote_from_message": "exact verbatim excerpt from message"
    }
  ],
  "explanation": "2-3 clear sentences in the language of the message (or ${params.userLanguage || 'French'})",
  "what_to_do": ["3 concrete, numbered action steps for the user"],
  "report_to": ["Specific organizations to report this to (e.g. DGSN Cybercrime, Bank, Carrier)"],
  "personalization_risk": {
    "detected": boolean,
    "reason": "string explaining connection to exposed data, or empty"
  }
}`;

  let llmResult: any = null;
  let isBasicCheck = false;
  let providerUsed = 'guardrail_fallback';
  let modelUsed = 'rule_engine';
  let totalLatency = 0;
  let fallbackUsed = false;
  let fallbackChain: string[] = [];

  try {
    const response = await call_llm({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze this message for social engineering / scam risk:\n\n"""\n${workingText}\n"""`,
        },
      ],
      jsonSchema: true,
      temperature: 0.1,
    });

    llmResult = response.parsedJson;
    providerUsed = response.provider_used;
    modelUsed = response.model_used;
    totalLatency = Math.round(performance.now() - startTime);
    fallbackUsed = response.fallback_used;
    fallbackChain = response.fallback_chain;
  } catch (llmErr) {
    console.warn('[ScamShield] All LLM providers failed. Falling back to deterministic guardrail alone.', llmErr);
    isBasicCheck = true;
    totalLatency = Math.round(performance.now() - startTime);
  }

  // 4. Merge LLM verdict and Guardrail verdict
  let llmVerdict: Verdict = 'safe';
  let confidence = 0.5;
  let confidenceReason = 'Computed from deterministic rule evaluation';
  let matchedPatterns: string[] = [];
  let redFlags: RedFlag[] = [];
  let explanation = '';
  let whatToDo: string[] = [];
  let reportTo: string[] = [];
  let personalizationRisk = { detected: false, reason: '' };

  if (llmResult && !isBasicCheck) {
    llmVerdict = (llmResult.verdict || 'suspicious').toLowerCase() as Verdict;
    if (!['safe', 'suspicious', 'scam'].includes(llmVerdict)) {
      llmVerdict = 'suspicious';
    }
    confidence = typeof llmResult.confidence === 'number' ? Math.min(Math.max(llmResult.confidence, 0.05), 0.99) : 0.85;
    confidenceReason = llmResult.confidence_reason || 'Evaluated through multi-step pattern grounding and semantic risk analysis';
    matchedPatterns = Array.isArray(llmResult.matched_patterns) ? llmResult.matched_patterns : [];
    redFlags = Array.isArray(llmResult.red_flags) ? llmResult.red_flags : [];
    explanation = llmResult.explanation || '';
    whatToDo = Array.isArray(llmResult.what_to_do) ? llmResult.what_to_do : [];
    reportTo = Array.isArray(llmResult.report_to) ? llmResult.report_to : [];
    if (llmResult.personalization_risk) {
      personalizationRisk = llmResult.personalization_risk;
    }
  } else {
    // Basic check when AI is unavailable
    llmVerdict = guardrailResult.verdict;
    confidence = guardrailResult.forced ? 0.92 : guardrailResult.verdict === 'safe' ? 0.6 : 0.78;
    confidenceReason = 'Basic check — AI unavailable. Result calculated solely via deterministic security guardrail rules.';
    explanation =
      guardrailResult.verdict === 'scam'
        ? 'Ce message correspond aux signatures d’attaques connues par ingénierie sociale (demande de code, faux frais ou appât de gain).'
        : guardrailResult.verdict === 'suspicious'
        ? 'Ce message contient des éléments nécessitant une vigilance accrue (liens courts ou formulation pressante).'
        : 'Aucun motif suspect flagrant n’a été relevé par le filtre de base. Restez toutefois vigilant.';
    whatToDo = [
      'Ne communiquez jamais aucun code reçu par SMS, mot de passe ou identifiant bancaire.',
      'Ne cliquez sur aucun lien raccourci ou suspect dans ce message.',
      'En cas de doute sur un organisme officiel, contactez son service client par un numéro vérifié.',
    ];
    reportTo = ['DGSN Brigade Anti-Cybercriminalité', 'Centre d’assistance client de votre opérateur ou banque'];
  }

  // Combine red flags if guardrail found specific keywords not listed in LLM red flags
  if (guardrailResult.triggered_rules.length > 0 && redFlags.length === 0) {
    for (const rule of guardrailResult.triggered_rules) {
      redFlags.push({
        flag: rule,
        quote_from_message: guardrailResult.matched_keywords.slice(0, 3).join(', ') || 'Triggered security rule',
      });
    }
  }

  const { finalVerdict, escalated } = mergeVerdicts(llmVerdict, guardrailResult, workingText);

  // If escalated by guardrail, adjust confidence and add note
  let finalConfidence = confidence;
  if (escalated) {
    finalConfidence = Math.max(confidence, 0.91);
    confidenceReason = `${confidenceReason} (Escalated to '${finalVerdict}' by deterministic guardrail: ${guardrailResult.triggered_rules[0] || 'critical risk rules'})`;
  }

  // Mask PII in returned quotes and explanations
  const sanitizedRedFlags = redFlags.map((rf) => ({
    flag: rf.flag,
    quote_from_message: maskPII(rf.quote_from_message),
  }));

  const sanitizedExplanation = maskPII(explanation);

  return {
    verdict: finalVerdict,
    llm_verdict: llmVerdict,
    guardrail_verdict: guardrailResult.verdict,
    guardrail_escalated: escalated,
    confidence: Math.round(finalConfidence * 100) / 100,
    confidence_reason: confidenceReason,
    matched_patterns: matchedPatterns,
    red_flags: sanitizedRedFlags,
    explanation: sanitizedExplanation,
    what_to_do: whatToDo,
    report_to: reportTo,
    transcription: transcriptionData,
    provider_used: providerUsed,
    model_used: modelUsed,
    latency_ms: totalLatency,
    fallback_used: fallbackUsed,
    is_basic_check: isBasicCheck,
    personalization_risk: personalizationRisk.detected ? personalizationRisk : undefined,
    debug_info: {
      raw_llm_json: llmResult,
      guardrail: guardrailResult,
      fallback_chain: fallbackChain,
    },
  };
}
