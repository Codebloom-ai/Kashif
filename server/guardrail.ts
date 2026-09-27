import { GuardrailResult, Verdict } from './types.ts';

// Severity order for comparison: safe < suspicious < scam
export const VERDICT_SEVERITY: Record<Verdict, number> = {
  safe: 0,
  suspicious: 1,
  scam: 2,
};

export function compareVerdicts(a: Verdict, b: Verdict): Verdict {
  return VERDICT_SEVERITY[a] >= VERDICT_SEVERITY[b] ? a : b;
}

// Multilingual token dictionaries
const REWARD_HOOKS = [
  'gagné', 'gagne', 'gagner', 'félicitations', 'felicitations', 'tirage au sort', 'lot', 'cadeau', 'cadeaux',
  'ربحتي', 'مبروك', 'مبروك عليك', 'جائزة', 'هدايا', 'قرعة', 'فزت', 'فوز', 'مكافأة',
  'rbe7ti', 'rbhti', 'mabrouk', 'mabrok', 'jaiza', 'rebe7ti', 'khediti',
  'won', 'winner', 'winning', 'prize', 'reward', 'congratulations', 'lottery', 'selected to win',
];

const URGENCY_HOOKS = [
  'urgent', 'immédiatement', 'de toute urgence', 'compte bloqué', 'compte suspendu', 'colis bloqué',
  'dernier avis', 'avant minuit', 'sous 24h', 'sous 48h', 'action requise', 'expiration', 'bloque',
  'عاجل', 'ضروري', 'حساب موقوف', 'طرد معلق', 'قبل فوات الأوان', 'انتهت الصلاحية', 'حالة طارئة', 'دابا بسرعة',
  'tbloqa', 'tblooka', 'daba', 'zarba', 'urgent', 'expirer',
  'immediate', 'suspended', 'account blocked', 'parcel on hold', 'final notice', 'within 24 hours', 'urgent action',
];

const AUTHORITY_HOOKS = [
  'cnss', 'cnops', 'dgi', 'barid', 'amana', 'chronopost', 'aramex',
  'cih', 'attijari', 'bcp', 'chaabi', 'bmce', 'bank of africa', 'crédit agricole', 'sgmb',
  'police', 'gendarmerie', 'douane', 'trésorerie', 'anapec', 'maroc telecom', 'inwi', 'orange',
  'الضمان الاجتماعي', 'البريد', 'أمانة', 'التجاري', 'الشعبي', 'الجمارك', 'اتصالات المغرب',
];

const SENSITIVE_DATA_OR_ACTION = [
  'cin', 'بطاقة وطنية', 'بطاقة التعريف', 'carte nationale', 'cnie',
  'rib', 'carte bancaire', 'cvv', 'mot de passe', 'code secret', 'identifiant',
  'code', 'الكود', 'كود', 'رمز التأكيد', 'otp', 'sms de confirmation',
  'frais', 'paiement', 'virement', 'payer', 'avance', 'caution', 'frais de dossier',
  'مصاريف', 'دفع', 'تحويل', 'تسبيق', 'أرسل المال', 'صيفط فلوس',
  'sifet flous', 'khalas', 'khlass', 'dariba', 'recharge', 'scratch card',
  'bit.ly', 'tinyurl', 'is.gd', 'cutt.ly', 't.ly', 'rb.gy', 'wa.me',
  'cliquez ici', 'cliquer sur le lien', 'اضغط على الرابط', 'انقر هنا', 'dkhul l lien',
];

const FORWARD_OTP_PATTERNS = [
  /صيفطت?\s*(?:ليك|لك)\s*(?:كود|الكود)/i,
  /غلطت?\s*و?\s*(?:رسلت|صيفطت)\s*لك\s*(?:كود|الكود)/i,
  /عفاك\s*(?:رجعو|صيفطو)\s*ليا/i,
  /كود\s*(?:لي|الذي)\s*وصلك/i,
  /renvoy(?:er|ez)\s*le\s*code/i,
  /envoy(?:er|ez)\s*moi\s*le\s*code/i,
  /code\s*(?:reçu|envoyé\s*par\s*erreur)/i,
  /forward\s*(?:the\s*)?(?:verification|otp|code)/i,
  /send\s*back\s*the\s*code/i,
  /عطيني\s*الكود/i,
  /a3tini\s*l\s*code/i,
];

const UPFRONT_FEE_BEFORE_PRIZE_OR_JOB = [
  /(?:gagn|rbeh|ربح|won|prize).{1,60}(?:frais|frais\s*de\s*dossier|payer|avance|recharge|تحويل|مصاريف|بطاقة)/i,
  /(?:visa|contrat|emploi|recrutement|عمل|وظيفة).{1,60}(?:frais\s*de\s*dossier|visite\s*m[ée]dicale|avance|virement|wafacash|cash\s*plus|رسوم)/i,
  /(?:colis|amana|barid|chronopost|طرد).{1,60}(?:frais|dh|payez|régulariser|15\s*dh|20\s*dh|دفع|رسوم)/i,
  /(?:remboursement|dgi|cnss|cnops|استرجاع).{1,60}(?:coordonn[ée]es\s*bancaires|carte|rib|cvv|bit\.ly)/i,
  /(?:سلفة|قرض|prêt|crédit).{1,60}(?:frais|مصاريف|dossier|avance)/i,
];

const SHORTLINK_PATTERNS = [
  /bit\.ly\/[a-zA-Z0-9_\-]+/i,
  /tinyurl\.com\/[a-zA-Z0-9_\-]+/i,
  /is\.gd\/[a-zA-Z0-9_\-]+/i,
  /cutt\.ly\/[a-zA-Z0-9_\-]+/i,
  /t\.ly\/[a-zA-Z0-9_\-]+/i,
  /rb\.gy\/[a-zA-Z0-9_\-]+/i,
  /t\.me\/[a-zA-Z0-9_\-]+/i,
  /wa\.me\/[0-9]+/i,
  /http:\/\/[^\s]+/i, // Non-secure plain HTTP links
];

export function runDeterministicGuardrail(text: string): GuardrailResult {
  const normalized = text.toLowerCase();
  const triggered_rules: string[] = [];
  const matched_keywords: string[] = [];
  let verdict: Verdict = 'safe';
  let forced = false;

  // 1. Check Forwarding OTP rule (Force SCAM)
  for (const regex of FORWARD_OTP_PATTERNS) {
    if (regex.test(normalized)) {
      verdict = 'scam';
      forced = true;
      triggered_rules.push('RULE_FORWARD_OTP: Direct request to forward verification code or SMS OTP');
      matched_keywords.push('forward_otp_hijack');
      break;
    }
  }

  // 2. Check Upfront Fee rule (Force SCAM)
  for (const regex of UPFRONT_FEE_BEFORE_PRIZE_OR_JOB) {
    if (regex.test(normalized)) {
      verdict = 'scam';
      forced = true;
      triggered_rules.push('RULE_UPFRONT_FEE: Fee or bank card requested before prize, job, parcel, refund or loan');
      matched_keywords.push('upfront_fee_trap');
      break;
    }
  }

  // 3. Check Combination: (Reward OR Urgency OR Authority) + Sensitive Data/Action (Force SCAM)
  const foundRewards = REWARD_HOOKS.filter((k) => normalized.includes(k));
  const foundUrgency = URGENCY_HOOKS.filter((k) => normalized.includes(k));
  const foundAuthority = AUTHORITY_HOOKS.filter((k) => normalized.includes(k));
  const foundSensitive = SENSITIVE_DATA_OR_ACTION.filter((k) => normalized.includes(k));

  matched_keywords.push(...foundRewards, ...foundUrgency, ...foundAuthority, ...foundSensitive);

  const hasHook = foundRewards.length > 0 || foundUrgency.length > 0 || foundAuthority.length > 0;
  const hasSensitive = foundSensitive.length > 0;

  if (hasHook && hasSensitive) {
    verdict = 'scam';
    forced = true;
    triggered_rules.push('RULE_HOOK_PLUS_SENSITIVE_DATA: Combination of hook (reward/urgency/authority) with request for money, credentials, ID, or suspicious links');
  }

  // 4. Check Shortlinks or suspicious links (At least SUSPICIOUS)
  let hasShortlink = false;
  for (const regex of SHORTLINK_PATTERNS) {
    if (regex.test(text)) {
      hasShortlink = true;
      matched_keywords.push('shortlink_or_insecure_url');
      break;
    }
  }

  if (hasShortlink) {
    triggered_rules.push('RULE_SHORTLINK: Contains shortened or non-verified link');
    if (verdict === 'safe') {
      verdict = 'suspicious';
    }
  }

  // 5. Urgency alone or Unknown authority alone without sensitive data -> SUSPICIOUS
  if (verdict === 'safe' && (foundUrgency.length > 0 || foundRewards.length > 0)) {
    verdict = 'suspicious';
    triggered_rules.push('RULE_UNVERIFIED_URGENCY_OR_PRIZE: Contains high urgency or unverified prize hook');
  }

  // Remove duplicates from matched keywords
  const uniqueKeywords = Array.from(new Set(matched_keywords));

  const reasoning =
    triggered_rules.length > 0
      ? `Deterministic guardrail triggered ${triggered_rules.length} rule(s): ${triggered_rules.join('; ')}`
      : 'No suspicious security patterns or forbidden keyword combinations detected.';

  return {
    verdict,
    triggered_rules,
    matched_keywords: uniqueKeywords,
    reasoning,
    forced,
  };
}

/**
 * Merge LLM verdict and Guardrail verdict.
 * Rule: Guardrail can ONLY ESCALATE, NEVER DOWNGRADE.
 * safe < suspicious < scam
 * Safe requires ALL of: LLM says safe AND guardrail found nothing AND no request for money/code/personal data/click AND no pattern match AND no urgency.
 */
export function mergeVerdicts(
  llmVerdict: Verdict,
  guardrail: GuardrailResult,
  text: string
): { finalVerdict: Verdict; escalated: boolean } {
  let finalVerdict = compareVerdicts(llmVerdict, guardrail.verdict);
  const escalated = VERDICT_SEVERITY[finalVerdict] > VERDICT_SEVERITY[llmVerdict];

  // Hard safety check: To be 'safe', strict requirements must be satisfied
  if (finalVerdict === 'safe') {
    const hasAnyTrigger = guardrail.triggered_rules.length > 0;
    if (hasAnyTrigger) {
      finalVerdict = 'suspicious';
    }
  }

  return { finalVerdict, escalated };
}
