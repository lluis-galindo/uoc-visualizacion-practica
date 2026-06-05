import { csvParse } from 'd3';
import type { CountryCostEntry, RawCostOfLivingRow, RawSurveyRow } from '../types/survey';
import {
  enrichSurveyRecord,
  normalizeCountry,
  normalizeLabel,
  parseMultiValue,
  parseToolCountWork,
  scoreAiAccuracy,
  scoreAiSentiment,
  SURVEY_TECH_FIELDS,
  toNumber,
} from './derivedVariables';

const SALARY_MIN = 1000;
const SALARY_MAX = 500_000;

function extractCostOfLivingIndex(row: RawCostOfLivingRow): number {
  return toNumber(row.costOfLivingIndex ?? row.CostOfLivingIndex ?? row.index);
}

function buildCostMap(rows: RawCostOfLivingRow[]): Map<string, number> {
  return new Map(
    rows
      .map((row) => [normalizeCountry(row.country ?? row.Country), extractCostOfLivingIndex(row)] as const)
      .filter(([, value]) => Number.isFinite(value)),
  );
}

function collectTechnologies(row: RawSurveyRow): string[] {
  return [...new Set(SURVEY_TECH_FIELDS.flatMap((field) => parseMultiValue(row[field])))];
}

export interface CleanedSurveyDataset {
  records: ReturnType<typeof enrichSurveyRecord>[];
  countries: CountryCostEntry[];
  maxObservedTechnologyCount: number;
}

export function cleanSurveyRows(
  surveyRows: RawSurveyRow[],
  costRows: RawCostOfLivingRow[],
): CleanedSurveyDataset {
  const costMap = buildCostMap(costRows);
  const technologyCounts = surveyRows.map((row) => collectTechnologies(row).length);
  const maxObservedTechnologyCount = Math.max(1, ...technologyCounts);

  const records = surveyRows
    .map((row, index) => {
      const country = normalizeCountry(row.Country);
      const technologies = collectTechnologies(row);
      const salary = toNumber(row.ConvertedCompYearly);
      const costOfLivingIndex = costMap.get(country) ?? Number.NaN;

      return enrichSurveyRecord({
        id: String(row.ResponseId ?? index),
        country,
        developerType: normalizeLabel(row.DevType),
        workMode: normalizeLabel(row.RemoteWork),
        salary,
        costOfLivingIndex,
        technologies,
        toolCountWork: parseToolCountWork(row.ToolCountWork),
        aiTrustScore: scoreAiAccuracy(row.AIAcc),
        aiSentimentScore: scoreAiSentiment(row.AISent),
        maxObservedTechnologyCount,
      });
    })
    .filter(
      (record) =>
        Number.isFinite(record.salary) &&
        record.salary >= SALARY_MIN &&
        record.salary <= SALARY_MAX,
    );

  const countries = [...costMap.entries()].map(([country, costOfLivingIndex]) => ({ country, costOfLivingIndex }));

  return { records, countries, maxObservedTechnologyCount };
}

export async function loadAndCleanSurveyData(
  surveyUrl: string,
  costOfLivingUrl: string,
): Promise<CleanedSurveyDataset> {
  const [surveyText, costText] = await Promise.all([
    fetch(surveyUrl).then((response) => response.text()),
    fetch(costOfLivingUrl).then((response) => response.text()),
  ]);

  return cleanSurveyRows(
    csvParse(surveyText) as unknown as RawSurveyRow[],
    csvParse(costText) as unknown as RawCostOfLivingRow[],
  );
}
