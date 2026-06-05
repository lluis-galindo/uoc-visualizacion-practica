export const SURVEY_TECH_FIELDS = [
  'LanguageHaveWorkedWith',
  'DatabaseHaveWorkedWith',
  'WebframeHaveWorkedWith',
  'PlatformHaveWorkedWith',
  'DevEnvsHaveWorkedWith',
  'OfficeStackAsyncHaveWorkedWith',
] as const;

/** Valores oficiales de AIAcc (Stack Overflow Developer Survey 2025) */
const AI_ACC_SCORE: Record<string, number> = {
  'highly trust': 4,
  'somewhat trust': 3,
  'neither trust nor distrust': 2,
  'somewhat distrust': 1,
  'highly distrust': 0,
};

/** Valores oficiales de AISent */
const AI_SENT_SCORE: Record<string, number> = {
  'very favorable': 1,
  favorable: 0.75,
  indifferent: 0.5,
  unsure: 0.45,
  unfavorable: 0.25,
  'very unfavorable': 0,
};

export function parseMultiValue(value: string | undefined): string[] {
  if (!value || value === 'NA') return [];

  return [...new Set(value.split(';').map((part) => part.trim()).filter(Boolean))];
}

export function toNumber(value: string | undefined): number {
  if (!value || value === 'NA') return Number.NaN;

  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function normalizeCountry(value: string | undefined): string {
  return (value ?? 'Unknown').trim() || 'Unknown';
}

export function normalizeLabel(value: string | undefined): string {
  if (!value || value === 'NA') return 'Unknown';
  return value.trim() || 'Unknown';
}

export function scoreAiAccuracy(value: string | undefined): number {
  if (!value || value === 'NA') return Number.NaN;
  const normalized = value.trim().toLowerCase();
  return AI_ACC_SCORE[normalized] ?? Number.NaN;
}

export function scoreAiSentiment(value: string | undefined): number {
  if (!value || value === 'NA') return Number.NaN;
  const normalized = value.trim().toLowerCase();
  return AI_SENT_SCORE[normalized] ?? Number.NaN;
}

export function parseToolCountWork(value: string | undefined): number {
  return toNumber(value);
}

export function toolCountWorkBin(count: number): string | null {
  if (!Number.isFinite(count)) return null;
  if (count === 0) return '0';
  if (count <= 5) return '1–5';
  if (count <= 10) return '6–10';
  if (count <= 15) return '11–15';
  if (count <= 20) return '16–20';
  if (count <= 25) return '21–25';
  if (count <= 50) return '26–50';
  return '51+';
}

export function collapseRemoteWork(value: string | undefined): string {
  if (!value || value === 'NA') return 'Unknown';
  if (value === 'Remote') return 'Remoto';
  if (value === 'In-person') return 'Presencial';
  if (value.startsWith('Hybrid')) return 'Híbrido';
  if (value.startsWith('Your choice')) return 'Flexible';
  return normalizeLabel(value);
}

export function computeTechnologyAdoptionIndex(
  technologyCount: number,
  maxObservedTechnologyCount: number,
): number {
  if (maxObservedTechnologyCount <= 0) return 0;
  return technologyCount / maxObservedTechnologyCount;
}

export function computeAdjustedSalary(salary: number, costOfLivingIndex: number): number {
  if (!Number.isFinite(salary)) return Number.NaN;
  if (!Number.isFinite(costOfLivingIndex) || costOfLivingIndex <= 0) return salary;
  return (salary / costOfLivingIndex) * 100;
}

export function computeAiTrustGap(trustScore: number, sentimentScore: number): number {
  const safeTrust = Number.isFinite(trustScore) ? trustScore / 4 : Number.NaN;
  const safeSentiment = Number.isFinite(sentimentScore) ? sentimentScore : Number.NaN;
  if (!Number.isFinite(safeTrust) || !Number.isFinite(safeSentiment)) return Number.NaN;
  return safeTrust - safeSentiment;
}

export function enrichSurveyRecord(input: {
  id: string;
  country: string;
  developerType: string;
  workMode: string;
  salary: number;
  costOfLivingIndex: number;
  technologies: string[];
  toolCountWork: number;
  aiTrustScore: number;
  aiSentimentScore: number;
  maxObservedTechnologyCount: number;
}) {
  const technologyCount = input.technologies.length;

  return {
    id: input.id,
    country: input.country,
    developerType: input.developerType,
    workMode: input.workMode,
    salary: input.salary,
    costOfLivingIndex: input.costOfLivingIndex,
    technologyCount,
    toolCountWork: input.toolCountWork,
    toolCountBin: toolCountWorkBin(input.toolCountWork),
    technologyAdoptionIndex: computeTechnologyAdoptionIndex(technologyCount, input.maxObservedTechnologyCount),
    adjustedSalary: computeAdjustedSalary(input.salary, input.costOfLivingIndex),
    aiTrustGap: computeAiTrustGap(input.aiTrustScore, input.aiSentimentScore),
    technologies: input.technologies,
    aiTrustScore: input.aiTrustScore,
    aiSentimentScore: input.aiSentimentScore,
  };
}
