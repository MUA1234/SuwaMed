import OpenAI from 'openai';
import logger from '../utils/logger';

// Lazy singleton — the OpenAI SDK reads OPENAI_API_KEY at construction time.
// If the key is missing we keep the client null and let callers fall back to
// the deterministic rule-based analyzer in symptom.controller.ts. That keeps
// dev + CI working without an OpenAI account.
let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

export type Severity = 'mild' | 'moderate' | 'severe';
export type Recommendation = 'self_care' | 'consult_doctor' | 'emergency';
export type Lang = 'en' | 'si' | 'ta';

export interface OpenAiSymptomAnalysis {
  possibleConditions: { name: string; probability: number; description: string }[];
  recommendation: Recommendation;
  selfCareAdvice: string;
  suggestedSpecializations: string[];
  disclaimer: string;
  severity: Severity;
  assessmentText: string;
}

export interface SymptomAnalysisInput {
  symptoms: string[];
  additionalNotes?: string;
  bodyArea?: string;
  language: Lang;
  age?: number;
  gender?: string;
  existingConditions?: string[];
  currentMedications?: string[];
}

const LANG_LABEL: Record<Lang, string> = {
  en: 'English',
  si: 'Sinhala (සිංහල)',
  ta: 'Tamil (தமிழ்)',
};

const DISCLAIMER: Record<Lang, string> = {
  en: 'This symptom analysis is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.',
  si: 'මෙම රෝග ලක්ෂණ විශ්ලේෂණය තොරතුරු සඳහා පමණි, සහ වෘත්තීය වෛද්‍ය උපදෙස්, රෝග විනිශ්චය, හෝ ප්‍රතිකාරයකට ආදේශකයක් නොවේ. සෑම විටම සුදුසුකම් ලත් සෞඛ්‍ය සේවා සපයන්නෙකු හමුවන්න.',
  ta: 'இந்த அறிகுறி பகுப்பாய்வு தகவல் நோக்கங்களுக்காக மட்டுமே உள்ளது மற்றும் தொழில்முறை மருத்துவ ஆலோசனை, நோயறிதல் அல்லது சிகிச்சைக்கு மாற்றாக இல்லை. எப்போதும் தகுதி வாய்ந்த சுகாதார வழங்குநரை அணுகவும்.',
};

function buildSystemPrompt(language: Lang): string {
  const label = LANG_LABEL[language];
  return [
    'You are a clinical triage assistant for a Sri Lankan telehealth app called SuwaMed.',
    'You DO NOT diagnose. You produce a structured triage assessment in JSON.',
    `Respond ONLY in ${label}. The "possibleConditions[].name", "possibleConditions[].description", "selfCareAdvice", and "assessmentText" fields MUST be written in ${label}.`,
    'The "suggestedSpecializations" entries MUST be plain English medical specialty names (e.g. "Cardiology", "General Practitioner", "Pulmonology", "Neurology", "Gastroenterology", "Orthopedics", "Dermatology", "ENT", "Ophthalmology", "Pediatrics"). These are used as filter keys against the doctor directory.',
    'The "recommendation" enum value MUST be exactly one of: "self_care" | "consult_doctor" | "emergency". The "severity" enum value MUST be exactly one of: "mild" | "moderate" | "severe".',
    'Use "emergency" for chest pain, severe shortness of breath, stroke-like symptoms, severe bleeding, loss of consciousness, suicidal ideation, severe burns, severe trauma.',
    'Probabilities in "possibleConditions[].probability" are numbers between 0 and 1, ordered most-likely first. Cap "possibleConditions" at 4 items.',
    'Do not invent dosages or specific drugs. Self-care advice should be conservative (hydration, rest, OTC pain relief, when to seek care). Never recommend prescription medication by name.',
    'Always remind the user this is not a diagnosis in the "assessmentText".',
    'Output JSON ONLY — no markdown, no commentary outside the JSON object.',
  ].join(' ');
}

interface JsonResponse {
  possibleConditions?: { name?: unknown; probability?: unknown; description?: unknown }[];
  recommendation?: unknown;
  selfCareAdvice?: unknown;
  suggestedSpecializations?: unknown[];
  severity?: unknown;
  assessmentText?: unknown;
}

function coerceString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function coerceNumber(v: unknown, fallback = 0.5): number {
  if (typeof v === 'number' && isFinite(v)) return Math.max(0, Math.min(1, v));
  if (typeof v === 'string') {
    const n = parseFloat(v);
    if (isFinite(n)) return Math.max(0, Math.min(1, n));
  }
  return fallback;
}

function coerceEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof v === 'string' && (allowed as readonly string[]).includes(v)) return v as T;
  return fallback;
}

function normalize(parsed: JsonResponse, language: Lang): OpenAiSymptomAnalysis {
  const rawConditions = Array.isArray(parsed.possibleConditions) ? parsed.possibleConditions : [];
  const possibleConditions = rawConditions
    .slice(0, 4)
    .map((c) => ({
      name: coerceString(c?.name, 'Unspecified concern'),
      probability: coerceNumber(c?.probability, 0.5),
      description: coerceString(c?.description, ''),
    }))
    .filter((c) => c.name.trim().length > 0);

  const rawSpecs = Array.isArray(parsed.suggestedSpecializations) ? parsed.suggestedSpecializations : [];
  const suggestedSpecializations = Array.from(
    new Set(
      rawSpecs
        .map((s) => coerceString(s, ''))
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    ),
  );

  const severity = coerceEnum<Severity>(parsed.severity, ['mild', 'moderate', 'severe'] as const, 'mild');
  const recommendation = coerceEnum<Recommendation>(
    parsed.recommendation,
    ['self_care', 'consult_doctor', 'emergency'] as const,
    'consult_doctor',
  );

  return {
    possibleConditions: possibleConditions.length
      ? possibleConditions
      : [{ name: 'General consultation recommended', probability: 0.5, description: '' }],
    recommendation,
    selfCareAdvice: coerceString(parsed.selfCareAdvice, ''),
    suggestedSpecializations: suggestedSpecializations.length
      ? suggestedSpecializations
      : ['General Practitioner'],
    disclaimer: DISCLAIMER[language],
    severity,
    assessmentText: coerceString(parsed.assessmentText, ''),
  };
}

function buildUserPrompt(input: SymptomAnalysisInput): string {
  const lines: string[] = [];
  lines.push(`Symptoms (free text and/or selected): ${input.symptoms.join(', ')}`);
  if (input.additionalNotes && input.additionalNotes.trim().length > 0) {
    lines.push(`Additional details: ${input.additionalNotes.trim()}`);
  }
  if (input.bodyArea) lines.push(`Affected body area: ${input.bodyArea}`);
  if (typeof input.age === 'number') lines.push(`Patient age: ${input.age}`);
  if (input.gender) lines.push(`Patient gender: ${input.gender}`);
  if (input.existingConditions && input.existingConditions.length > 0) {
    lines.push(`Existing conditions: ${input.existingConditions.join(', ')}`);
  }
  if (input.currentMedications && input.currentMedications.length > 0) {
    lines.push(`Current medications: ${input.currentMedications.join(', ')}`);
  }
  lines.push('');
  lines.push(
    'Return a JSON object with this exact shape:\n' +
      '{\n' +
      '  "possibleConditions": [{ "name": string, "probability": number, "description": string }],\n' +
      '  "recommendation": "self_care" | "consult_doctor" | "emergency",\n' +
      '  "selfCareAdvice": string,\n' +
      '  "suggestedSpecializations": string[],\n' +
      '  "severity": "mild" | "moderate" | "severe",\n' +
      '  "assessmentText": string\n' +
      '}',
  );
  return lines.join('\n');
}

export async function analyzeWithOpenAI(input: SymptomAnalysisInput): Promise<OpenAiSymptomAnalysis | null> {
  const c = getClient();
  if (!c) {
    logger.info('[openai] OPENAI_API_KEY not set — skipping AI symptom analysis');
    return null;
  }
  try {
    const completion = await c.chat.completions.create({
      model: process.env.OPENAI_SYMPTOM_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(input.language) },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content;
    if (!raw) {
      logger.warn('[openai] empty completion content');
      return null;
    }
    let parsed: JsonResponse;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      logger.warn(`[openai] could not parse model output as JSON: ${(parseErr as Error).message}`);
      return null;
    }
    const usage = completion.usage;
    if (usage) {
      logger.info(
        `[openai] symptom check usage prompt=${usage.prompt_tokens} completion=${usage.completion_tokens} total=${usage.total_tokens}`,
      );
    }
    return normalize(parsed, input.language);
  } catch (err) {
    logger.error(`[openai] symptom analysis failed: ${(err as Error).message}`);
    return null;
  }
}

export const SYMPTOM_DISCLAIMER = DISCLAIMER;
