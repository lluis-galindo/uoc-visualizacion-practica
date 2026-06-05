export type NullableString = string | null | undefined;

export interface RawSurveyRow {
  ResponseId?: string;
  MainBranch?: string;
  Country?: string;
  DevType?: string;
  RemoteWork?: string;
  WorkExp?: string;
  ConvertedCompYearly?: string;
  ToolCountWork?: string;
  AIAcc?: string;
  AISent?: string;
  AISelect?: string;
  LanguageHaveWorkedWith?: string;
  DatabaseHaveWorkedWith?: string;
  WebframeHaveWorkedWith?: string;
  PlatformHaveWorkedWith?: string;
  DevEnvsHaveWorkedWith?: string;
  OfficeStackAsyncHaveWorkedWith?: string;
  [key: string]: string | undefined;
}

export interface RawCostOfLivingRow {
  country?: string;
  Country?: string;
  costOfLivingIndex?: string;
  CostOfLivingIndex?: string;
  index?: string;
  [key: string]: string | undefined;
}

export interface CleanSurveyRecord {
  id: string;
  country: string;
  developerType: string;
  workMode: string;
  salary: number;
  costOfLivingIndex: number;
  technologyCount: number;
  toolCountWork: number;
  toolCountBin: string | null;
  technologyAdoptionIndex: number;
  adjustedSalary: number;
  aiTrustGap: number;
  technologies: string[];
  aiTrustScore: number;
  aiSentimentScore: number;
}

export interface CountryCostEntry {
  country: string;
  costOfLivingIndex: number;
}

export interface BoxPlotRow {
  group: string;
  subgroup: string;
  salary: number;
}
