export interface SalarySummary {
  n: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  mean: number;
}

export interface ToolCountSalarySummary extends SalarySummary {
  bin: string;
}

export interface RemoteSalarySummary extends SalarySummary {
  mode: string;
}

export interface CountrySalaryComparison {
  country: string;
  n: number;
  nominalMedian: number;
  adjustedMedian: number;
  costIndex: number;
}

export interface AiTrustByToolBin {
  bin: string;
  n: number;
  meanScore: number;
  pctTrust: number;
  pctDistrust: number;
}

export interface LanguageAiTrust {
  language: string;
  n: number;
  meanTrust: number;
}

export interface ProcessedMetadata {
  totalResponses: number;
  employedWithSalary: number;
  countriesWithCostData: number;
  genderAvailable: boolean;
  columnsUsed: Record<string, string | string[]>;
  salaryFilter: { min: number; max: number };
  costOfLivingSource: string;
  processedAt: string;
}

export interface BoxPlotSummaryEntry {
  group: string;
  subgroup: string;
  n?: number;
  summary: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
  };
}
