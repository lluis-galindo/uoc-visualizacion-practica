import type {
  AiTrustByToolBin,
  CountrySalaryComparison,
  LanguageAiTrust,
  ProcessedMetadata,
  RemoteSalarySummary,
  ToolCountSalarySummary,
} from '@/types/processed';

import metadataJson from '../../public/data/processed/metadata.json';
import q1Json from '../../public/data/processed/q1-toolcount-salary.json';
import q2Json from '../../public/data/processed/q2-country-adjusted-salary.json';
import q3Json from '../../public/data/processed/q3-ai-tech-trust.json';
import q4Json from '../../public/data/processed/q4-remote-salary.json';

export const surveyMetadata = metadataJson as ProcessedMetadata;

export const toolCountSalarySummary = (q1Json as { summary: ToolCountSalarySummary[] }).summary;

export const countryAdjustedSalary = q2Json as CountrySalaryComparison[];

export const aiTrustByToolBin = (q3Json as { byToolBin: AiTrustByToolBin[]; topLanguages: LanguageAiTrust[] }).byToolBin;

export const languageAiTrust = (q3Json as { byToolBin: AiTrustByToolBin[]; topLanguages: LanguageAiTrust[] }).topLanguages;

export const remoteSalarySummary = (q4Json as { summary: RemoteSalarySummary[] }).summary;

export function toolCountToBoxPlotSummaries(rows: ToolCountSalarySummary[]) {
  return rows.map((row) => ({
    group: row.bin,
    subgroup: 'Salario (USD)',
    n: row.n,
    summary: { min: row.min, q1: row.q1, median: row.median, q3: row.q3, max: row.max },
  }));
}

export function remoteModeToBoxPlotSummaries(rows: RemoteSalarySummary[]) {
  return rows.map((row) => ({
    group: row.mode,
    subgroup: 'Salario (USD)',
    n: row.n,
    summary: { min: row.min, q1: row.q1, median: row.median, q3: row.q3, max: row.max },
  }));
}
