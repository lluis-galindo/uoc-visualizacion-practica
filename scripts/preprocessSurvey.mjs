import { csvParse } from '../node_modules/d3/src/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const surveyPath = path.join(root, 'public/data/survey/survey_results_public.csv');
const costPath = path.join(root, 'public/data/cost_of_living.csv');
const outDir = path.join(root, 'public/data/processed');

const SALARY_MIN = 1000;
const SALARY_MAX = 500_000;
const MIN_COUNTRY_N = 80;

/** @type {Record<string, number>} */
const AI_ACC_SCORE = {
  'Highly trust': 4,
  'Somewhat trust': 3,
  'Neither trust nor distrust': 2,
  'Somewhat distrust': 1,
  'Highly distrust': 0,
};

const TECH_FIELDS = [
  'LanguageHaveWorkedWith',
  'DatabaseHaveWorkedWith',
  'WebframeHaveWorkedWith',
  'PlatformHaveWorkedWith',
  'DevEnvsHaveWorkedWith',
  'OfficeStackAsyncHaveWorkedWith',
];

/** @param {string | undefined} value */
function parseMulti(value) {
  if (!value || value === 'NA') return [];
  return [...new Set(value.split(';').map((part) => part.trim()).filter(Boolean))];
}

/** @param {string | undefined} value */
function toNumber(value) {
  if (!value || value === 'NA') return Number.NaN;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** @param {string | undefined} raw */
function toolCountBin(raw) {
  const count = toNumber(raw);
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

/** @param {string | undefined} value */
function collapseRemoteWork(value) {
  if (!value || value === 'NA') return null;
  if (value === 'Remote') return 'Remoto';
  if (value === 'In-person') return 'Presencial';
  if (value.startsWith('Hybrid')) return 'Híbrido';
  if (value.startsWith('Your choice')) return 'Flexible';
  return null;
}

/** @param {number[]} sorted @param {number} p */
function quantile(sorted, p) {
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/** @param {number[]} values */
function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: sorted.length,
    median: quantile(sorted, 0.5),
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
  };
}

/** @param {number[]} values */
function median(values) {
  return quantile([...values].sort((a, b) => a - b), 0.5);
}

const costRows = csvParse(fs.readFileSync(costPath, 'utf8'));
const costMap = new Map(
  costRows.map((row) => [row.country, toNumber(row.costOfLivingIndex)]).filter(([, value]) => Number.isFinite(value)),
);

console.log('Loading survey CSV…');
const rows = csvParse(fs.readFileSync(surveyPath, 'utf8'));
console.log(`Loaded ${rows.length} rows`);

const employed = rows.filter((row) => {
  const salary = toNumber(row.ConvertedCompYearly);
  return row.MainBranch === 'I am a developer by profession' && Number.isFinite(salary) && salary >= SALARY_MIN && salary <= SALARY_MAX;
});

console.log(`Employed developers with salary: ${employed.length}`);

const toolBinSalaries = new Map();
const remoteSalaries = new Map();
const countryRecords = new Map();
const aiByToolBin = new Map();
const techCountSalaries = new Map();

for (const row of employed) {
  const salary = toNumber(row.ConvertedCompYearly);
  const toolBin = toolCountBin(row.ToolCountWork);
  const remote = collapseRemoteWork(row.RemoteWork);
  const country = row.Country?.trim();
  const colIndex = country ? costMap.get(country) : undefined;
  const techCount = TECH_FIELDS.flatMap((field) => parseMulti(row[field])).length;
  const uniqueTech = new Set(TECH_FIELDS.flatMap((field) => parseMulti(row[field]))).size;
  const aiScore = AI_ACC_SCORE[row.AIAcc ?? ''];

  if (toolBin) {
    const bucket = toolBinSalaries.get(toolBin) ?? [];
    bucket.push(salary);
    toolBinSalaries.set(toolBin, bucket);
  }

  if (remote) {
    const bucket = remoteSalaries.get(remote) ?? [];
    bucket.push(salary);
    remoteSalaries.set(remote, bucket);
  }

  if (country && colIndex) {
    const bucket = countryRecords.get(country) ?? { salaries: [], adjusted: [] };
    bucket.salaries.push(salary);
    bucket.adjusted.push((salary / colIndex) * 100);
    countryRecords.set(country, bucket);
  }

  if (toolBin && aiScore !== undefined) {
    const bucket = aiByToolBin.get(toolBin) ?? [];
    bucket.push(aiScore);
    aiByToolBin.set(toolBin, bucket);
  }

  if (uniqueTech > 0) {
    const tertileKey = uniqueTech <= 4 ? 'Baja diversidad (≤4)' : uniqueTech <= 9 ? 'Media (5–9)' : 'Alta (≥10)';
    const bucket = techCountSalaries.get(tertileKey) ?? [];
    bucket.push(salary);
    techCountSalaries.set(tertileKey, bucket);
  }
}

const toolBinOrder = ['0', '1–5', '6–10', '11–15', '16–20', '21–25', '26–50', '51+'];
const remoteOrder = ['Remoto', 'Flexible', 'Híbrido', 'Presencial'];

const q1Summary = toolBinOrder
  .map((bin) => {
    const values = toolBinSalaries.get(bin);
    if (!values?.length) return null;
    return { bin, ...summarize(values) };
  })
  .filter(Boolean);

const q2Countries = [...countryRecords.entries()]
  .map(([country, data]) => ({
    country,
    n: data.salaries.length,
    nominalMedian: median(data.salaries),
    adjustedMedian: median(data.adjusted),
    costIndex: costMap.get(country) ?? null,
  }))
  .filter((entry) => entry.n >= MIN_COUNTRY_N && entry.costIndex)
  .sort((a, b) => b.nominalMedian - a.nominalMedian)
  .slice(0, 12);

const q3AiTrust = toolBinOrder
  .map((bin) => {
    const scores = aiByToolBin.get(bin);
    if (!scores?.length) return null;
    const dist = { highlyTrust: 0, somewhatTrust: 0, neutral: 0, somewhatDistrust: 0, highlyDistrust: 0 };
    for (const score of scores) {
      if (score === 4) dist.highlyTrust += 1;
      else if (score === 3) dist.somewhatTrust += 1;
      else if (score === 2) dist.neutral += 1;
      else if (score === 1) dist.somewhatDistrust += 1;
      else dist.highlyDistrust += 1;
    }
    const n = scores.length;
    const meanScore = scores.reduce((sum, value) => sum + value, 0) / n;
    return {
      bin,
      n,
      meanScore,
      pctTrust: ((dist.highlyTrust + dist.somewhatTrust) / n) * 100,
      pctDistrust: ((dist.highlyDistrust + dist.somewhatDistrust) / n) * 100,
    };
  })
  .filter(Boolean);

const languageAiRows = employed.filter((row) => row.AIAcc && row.AIAcc !== 'NA' && row.LanguageHaveWorkedWith && row.LanguageHaveWorkedWith !== 'NA');
const languageScores = new Map();
for (const row of languageAiRows) {
  const score = AI_ACC_SCORE[row.AIAcc];
  if (score === undefined) continue;
  for (const language of parseMulti(row.LanguageHaveWorkedWith)) {
    const bucket = languageScores.get(language) ?? [];
    bucket.push(score);
    languageScores.set(language, bucket);
  }
}

const q3Languages = [...languageScores.entries()]
  .map(([language, scores]) => ({
    language,
    n: scores.length,
    meanTrust: scores.reduce((sum, value) => sum + value, 0) / scores.length,
  }))
  .filter((entry) => entry.n >= 200)
  .sort((a, b) => b.n - a.n)
  .slice(0, 10);

const q4Summary = remoteOrder
  .map((mode) => {
    const values = remoteSalaries.get(mode);
    if (!values?.length) return null;
    return { mode, ...summarize(values) };
  })
  .filter(Boolean);

const metadata = {
  totalResponses: rows.length,
  employedWithSalary: employed.length,
  countriesWithCostData: q2Countries.length,
  genderAvailable: rows.columns.some((column) => /gender/i.test(column)),
  columnsUsed: {
    salary: 'ConvertedCompYearly',
    toolCount: 'ToolCountWork',
    remoteWork: 'RemoteWork',
    aiTrust: 'AIAcc',
    aiUsage: 'AISelect',
    experience: 'WorkExp',
    technologies: TECH_FIELDS,
  },
  salaryFilter: { min: SALARY_MIN, max: SALARY_MAX },
  costOfLivingSource: 'Numbeo (índice relativo, EE.UU.=100, junio 2025)',
  processedAt: new Date().toISOString(),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify(metadata, null, 2));
fs.writeFileSync(path.join(outDir, 'q1-toolcount-salary.json'), JSON.stringify({ summary: q1Summary }, null, 2));
fs.writeFileSync(path.join(outDir, 'q2-country-adjusted-salary.json'), JSON.stringify(q2Countries, null, 2));
fs.writeFileSync(path.join(outDir, 'q3-ai-tech-trust.json'), JSON.stringify({ byToolBin: q3AiTrust, topLanguages: q3Languages }, null, 2));
fs.writeFileSync(path.join(outDir, 'q4-remote-salary.json'), JSON.stringify({ summary: q4Summary }, null, 2));

console.log('Processed files written to', outDir);
console.log('Q1 bins:', q1Summary.length);
console.log('Q2 countries:', q2Countries.length);
console.log('Q3 tool bins:', q3AiTrust.length);
console.log('Q4 modes:', q4Summary.length);
console.log('Gender column available:', metadata.genderAvailable);
