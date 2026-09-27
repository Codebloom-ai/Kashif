import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { CallLLMParams, CallLLMResult } from './types.ts';
import { logUsage } from './logger.ts';

// Helper to clean JSON string from markdown code blocks
function cleanAndParseJSON(rawText: string): any {
  let cleaned = rawText.trim();
  // Remove markdown code fences if present (```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  }
  return JSON.parse(cleaned);
}

// Timeout promise wrapper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms executing ${operationName}`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Provider: Gemini
async function callGemini(params: CallLLMParams): Promise<{ content: string; model: string; tokens?: any }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Prioritize gemini-3.1-flash-lite: has active separate quota, sub-3s latency, and no thinking overhead
  const candidateModels = [
    'gemini-3.1-flash-lite',
    process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  const uniqueModels = Array.from(new Set(candidateModels));

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Build contents and system instruction
  let systemInstruction = '';
  const parts: any[] = [];

  for (const msg of params.messages) {
    if (msg.role === 'system') {
      systemInstruction += (systemInstruction ? '\n\n' : '') + msg.content;
    } else {
      parts.push({ text: `[${msg.role.toUpperCase()}]: ${msg.content}` });
    }
  }

  // Append any images (handling SVG vs Raster images)
  if (params.images && params.images.length > 0) {
    for (let idx = 0; idx < params.images.length; idx++) {
      const img = params.images[idx];
      const isSvg =
        (img.mimeType && img.mimeType.includes('svg')) ||
        (img.base64Data &&
          Buffer.from(img.base64Data.slice(0, 100), 'base64').toString('utf-8').includes('<svg'));

      if (isSvg) {
        // Gemini API rejects image/svg+xml in inlineData with 400 INVALID_ARGUMENT.
        // Send the SVG text representation directly as prompt context.
        const svgContent = Buffer.from(img.base64Data, 'base64').toString('utf-8');
        parts.push({
          text: `\n[Image ${idx + 1} - SVG Vector Screenshot Markup]:\n${svgContent}\n`,
        });
      } else {
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/png',
            data: img.base64Data,
          },
        });
      }
    }
  }

  let lastGeminiError: any = null;
  // Dedicated per-model candidate timeout (12s each)
  const perModelTimeoutMs = 12000;

  for (const m of uniqueModels) {
    try {
      const config: any = {};
      // For gemini-3 series that are not lite, set LOW thinking level to avoid 20s+ reasoning
      if (m.includes('3') && !m.includes('lite')) {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }
      if (params.jsonSchema) {
        config.responseMimeType = 'application/json';
      }
      if (typeof params.temperature === 'number') {
        config.temperature = params.temperature;
      }

      const generatePromise = ai.models.generateContent({
        model: m,
        contents: parts.length === 1 && parts[0].text ? parts[0].text : { parts },
        config,
      });

      const response = await withTimeout(generatePromise, perModelTimeoutMs, `Gemini ${m}`);

      const content = response.text || '';
      const tokens = response.usageMetadata
        ? {
            prompt: response.usageMetadata.promptTokenCount,
            completion: response.usageMetadata.candidatesTokenCount,
            total: response.usageMetadata.totalTokenCount,
          }
        : undefined;

      return { content, model: m, tokens };
    } catch (err: any) {
      lastGeminiError = err;
      console.warn(`[callGemini] Model '${m}' failed (${err?.message || err}). Attempting next candidate...`);
      continue;
    }
  }

  throw lastGeminiError || new Error('All Gemini candidate models failed');
}

// Provider: Groq
async function callGroq(params: CallLLMParams): Promise<{ content: string; model: string; tokens?: any }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const hasImages = params.images && params.images.length > 0;
  const model = process.env.GROQ_MODEL || (hasImages ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile');

  const messagesPayload: any[] = [];

  for (let i = 0; i < params.messages.length; i++) {
    const msg = params.messages[i];
    const isLastUser = msg.role === 'user' && i === params.messages.length - 1;

    if (isLastUser && hasImages) {
      const contentParts: any[] = [{ type: 'text', text: msg.content }];
      for (const img of params.images!) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType || 'image/png'};base64,${img.base64Data}`,
          },
        });
      }
      messagesPayload.push({ role: 'user', content: contentParts });
    } else {
      messagesPayload.push({ role: msg.role, content: msg.content });
    }
  }

  const bodyPayload: any = {
    model,
    messages: messagesPayload,
    temperature: params.temperature ?? 0.2,
  };

  if (params.jsonSchema) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorText}`);
  }

  const data: any = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage
    ? {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      }
    : undefined;

  return { content, model, tokens };
}

// Provider: Brev (vLLM / OpenAI-compatible endpoint)
async function callBrev(params: CallLLMParams): Promise<{ content: string; model: string; tokens?: any }> {
  const baseUrl = process.env.BREV_BASE_URL;
  if (!baseUrl) {
    throw new Error('BREV_BASE_URL is not configured');
  }

  const apiKey = process.env.BREV_API_KEY || 'none';
  const model = process.env.BREV_MODEL || 'meta-llama/Llama-3.3-70B-Instruct';

  const cleanBase = baseUrl.replace(/\/+$/, '');
  const endpoint = cleanBase.endsWith('/v1') ? `${cleanBase}/chat/completions` : `${cleanBase}/v1/chat/completions`;

  const messagesPayload: any[] = [];
  const hasImages = params.images && params.images.length > 0;

  for (let i = 0; i < params.messages.length; i++) {
    const msg = params.messages[i];
    const isLastUser = msg.role === 'user' && i === params.messages.length - 1;

    if (isLastUser && hasImages) {
      const contentParts: any[] = [{ type: 'text', text: msg.content }];
      for (const img of params.images!) {
        contentParts.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType || 'image/png'};base64,${img.base64Data}`,
          },
        });
      }
      messagesPayload.push({ role: 'user', content: contentParts });
    } else {
      messagesPayload.push({ role: msg.role, content: msg.content });
    }
  }

  const bodyPayload: any = {
    model,
    messages: messagesPayload,
    temperature: params.temperature ?? 0.2,
  };

  if (params.jsonSchema) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Brev vLLM API error (${res.status}): ${errorText}`);
  }

  const data: any = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  const tokens = data.usage
    ? {
        prompt: data.usage.prompt_tokens,
        completion: data.usage.completion_tokens,
        total: data.usage.total_tokens,
      }
    : undefined;

  return { content, model, tokens };
}

// Determine fallback priority list
export function getProviderPriority(): string[] {
  // If user set LLM_PROVIDER, use that as primary
  const primary = (process.env.LLM_PROVIDER || '').toLowerCase().trim();
  const rawList = process.env.PROVIDER_FALLBACK_ORDER || 'gemini,groq,brev';
  const configured = rawList
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const priority: string[] = [];
  if (primary && ['gemini', 'groq', 'brev'].includes(primary)) {
    priority.push(primary);
  }
  for (const item of configured) {
    if (!priority.includes(item) && ['gemini', 'groq', 'brev'].includes(item)) {
      priority.push(item);
    }
  }
  return priority.length > 0 ? priority : ['gemini', 'groq', 'brev'];
}

/**
 * Universal LLM caller with automatic fallback and real latency measurement.
 * Never calls specific provider SDK outside this module.
 */
export async function call_llm(params: CallLLMParams): Promise<CallLLMResult> {
  const priority = getProviderPriority();
  const timeoutMs = params.timeoutMs ?? 20000;
  const startTime = performance.now();

  const attemptedChain: string[] = [];
  let lastError: Error | null = null;

  for (let i = 0; i < priority.length; i++) {
    const provider = priority[i];
    attemptedChain.push(provider);
    const providerStartTime = performance.now();

    try {
      // Check provider configuration before attempting
      if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
        console.warn(`[call_llm] Provider 'gemini' skipped (GEMINI_API_KEY not configured)`);
        continue;
      }
      if (provider === 'groq' && !process.env.GROQ_API_KEY) {
        console.warn(`[call_llm] Provider 'groq' skipped (GROQ_API_KEY not configured)`);
        continue;
      }
      if (provider === 'brev' && !process.env.BREV_BASE_URL) {
        console.warn(`[call_llm] Provider 'brev' skipped (BREV_BASE_URL not configured)`);
        continue;
      }

      let callPromise: Promise<{ content: string; model: string; tokens?: any }>;

      if (provider === 'gemini') {
        callPromise = callGemini(params);
      } else if (provider === 'groq') {
        callPromise = callGroq(params);
      } else if (provider === 'brev') {
        callPromise = callBrev(params);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      const { content, model, tokens } = await withTimeout(callPromise, timeoutMs, `${provider} call`);
      const providerDuration = Math.round(performance.now() - providerStartTime);
      const totalDuration = Math.round(performance.now() - startTime);

      let parsedJson: any = null;
      if (params.jsonSchema) {
        try {
          parsedJson = cleanAndParseJSON(content);
        } catch (jsonErr) {
          console.warn(`[call_llm] Failed to parse JSON from ${provider}:`, jsonErr, content);
          // Try regex to pull out the first JSON object
          const match = content.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              parsedJson = JSON.parse(match[0]);
            } catch {
              // Keep null
            }
          }
        }
      }

      const fallbackUsed = i > 0;

      // Real log to usage.jsonl
      logUsage({
        provider,
        model,
        latency_ms: providerDuration,
        status: fallbackUsed ? 'fallback_success' : 'success',
        fallback_used: fallbackUsed,
        fallback_chain: attemptedChain,
        endpoint: 'call_llm',
        tokens,
      });

      return {
        content,
        parsedJson,
        provider_used: provider,
        model_used: model,
        latency_ms: totalDuration,
        fallback_used: fallbackUsed,
        fallback_chain: attemptedChain,
        tokens,
      };
    } catch (err: any) {
      lastError = err;
      const elapsed = Math.round(performance.now() - providerStartTime);
      console.warn(`[call_llm] Provider '${provider}' failed after ${elapsed}ms: ${err?.message || err}. Attempting fallback...`);

      logUsage({
        provider,
        model: 'unknown',
        latency_ms: elapsed,
        status: 'failed',
        fallback_used: i > 0,
        fallback_chain: attemptedChain,
        endpoint: 'call_llm',
      });
    }
  }

  // All providers failed
  const totalElapsed = Math.round(performance.now() - startTime);
  throw new Error(`All LLM providers failed [${attemptedChain.join(' -> ')}]: ${lastError?.message || 'Unknown error'}`);
}
