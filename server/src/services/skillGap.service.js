import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES_CSV = path.join(__dirname, '..', 'data', 'roles.csv');
const COURSES_JSON = path.join(__dirname, '..', 'data', 'courses.json');

const MATCH_THRESHOLD = 85;
const PARTIAL_THRESHOLD = 60;

const ALIAS_MAP = {
  powerbi: 'Power BI', 'power bi': 'Power BI', 'power-bi': 'Power BI',
  'ms excel': 'Excel', msexcel: 'Excel', 'ms-excel': 'Excel',
  ml: 'Machine Learning', ai: 'Artificial Intelligence',
  js: 'JavaScript', ts: 'TypeScript', py: 'Python',
  sklearn: 'Scikit-learn', 'scikit learn': 'Scikit-learn',
  tensorflow: 'TensorFlow', tf: 'TensorFlow',
  pytorch: 'PyTorch', torch: 'PyTorch',
  nlp: 'NLP', hf: 'Hugging Face', huggingface: 'Hugging Face',
  spacy: 'SpaCy', numpy: 'NumPy', np: 'NumPy',
  pandas: 'Pandas', git: 'Git', github: 'Git', gitlab: 'Git',
  k8s: 'Kubernetes', kube: 'Kubernetes',
  aws: 'AWS/Azure/GCP', azure: 'AWS/Azure/GCP', gcp: 'AWS/Azure/GCP',
  cloud: 'Cloud Platforms', bash: 'Python/Bash', shell: 'Python/Bash',
  cicd: 'CI/CD', 'ci/cd': 'CI/CD', devops: 'CI/CD',
  seo: 'SEO', ga: 'Google Analytics', 'google ads': 'Google Ads',
  sem: 'Google Ads', crm: 'CRM Tools', jira: 'JIRA',
  oop: 'OOP', rest: 'REST APIs', api: 'REST APIs', apis: 'REST APIs',
  html5: 'HTML', css3: 'CSS', 'react.js': 'React', reactjs: 'React',
  vue: 'JavaScript', angular: 'JavaScript',
  django: 'Django/Flask', flask: 'Django/Flask',
  spring: 'Spring Boot', springboot: 'Spring Boot',
  'network security': 'Network Security',
  'cyber security': 'Network Security', cybersecurity: 'Network Security',
  siem: 'SIEM', splunk: 'SIEM', ir: 'Incident Response',
  vuln: 'Vulnerability Assessment',
};

let rolesData = null;
let coursesData = null;

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    obj.weight = parseFloat(obj.weight) || 0.5;
    return obj;
  });
}

function loadData() {
  if (rolesData) return { roles: rolesData, courses: coursesData };
  try {
    const csv = fs.readFileSync(ROLES_CSV, 'utf-8');
    rolesData = parseCsv(csv);
  } catch {
    rolesData = [];
  }
  try {
    const json = fs.readFileSync(COURSES_JSON, 'utf-8');
    coursesData = JSON.parse(json);
  } catch {
    coursesData = {};
  }
  return { roles: rolesData, courses: coursesData };
}

function getDomains() {
  const { roles } = loadData();
  return [...new Set(roles.map((r) => r.domain))].sort();
}

function getRolesByDomain(domain) {
  const { roles } = loadData();
  return [...new Set(roles.filter((r) => r.domain === domain).map((r) => r.role))].sort();
}

function getRoleSkills(domain, role) {
  const { roles } = loadData();
  return roles.filter((r) => r.domain === domain && r.role === role);
}

function getAllCanonicalSkills() {
  const { roles } = loadData();
  return [...new Set(roles.map((r) => r.skill))].sort();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0),
      );
    }
  }
  return dp[m][n];
}

function fuzzyScore(input, target) {
  const a = input.toLowerCase();
  const b = target.toLowerCase();
  if (a === b) return 100;
  if (b.includes(a) || a.includes(b)) return 90;
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  return Math.max(0, Math.round((1 - dist / maxLen) * 100));
}

function normalizeSkill(raw, canonicals) {
  const lowered = raw.trim().toLowerCase();
  if (ALIAS_MAP[lowered]) {
    const expanded = ALIAS_MAP[lowered];
    if (canonicals.includes(expanded)) return { status: 'matched', canonical: expanded, score: 100 };
    return { status: 'alias', canonical: expanded, score: 100 };
  }
  const titled = raw.trim().replace(/\b\w/g, (c) => c.toUpperCase());
  if (canonicals.includes(titled)) return { status: 'matched', canonical: titled, score: 100 };
  let best = null, bestScore = 0;
  for (const c of canonicals) {
    const s = fuzzyScore(titled, c);
    if (s > bestScore) { bestScore = s; best = c; }
  }
  if (bestScore >= MATCH_THRESHOLD) return { status: 'matched', canonical: best, score: bestScore };
  if (bestScore >= PARTIAL_THRESHOLD) return { status: 'partial', canonical: best, score: bestScore };
  return { status: 'rejected', canonical: null, score: bestScore };
}

function analyzeSkillGap(userSkills, roleSkills, canonicals) {
  const matchedSet = new Set();
  const partialSet = new Set();
  for (const s of userSkills) {
    const r = normalizeSkill(s, canonicals);
    if ((r.status === 'matched' || r.status === 'alias') && r.canonical) matchedSet.add(r.canonical);
    else if (r.status === 'partial' && r.canonical) partialSet.add(r.canonical);
  }
  const matched = [], missing = [], partial = [];
  for (const row of roleSkills) {
    const info = { skill: row.skill, category: row.category, proficiency: row.proficiency, weight: row.weight };
    const dbSkill = row.skill.trim().toLowerCase();
    if (matchedSet.has(row.skill) || [...matchedSet].some((m) => m.toLowerCase() === dbSkill)) matched.push(info);
    else if (partialSet.has(row.skill) || [...partialSet].some((p) => p.toLowerCase() === dbSkill)) partial.push(info);
    else missing.push(info);
  }
  return { matched, missing, partial };
}

function calculateReadinessScore(gapResult) {
  const all = [...gapResult.matched, ...gapResult.missing, ...gapResult.partial];
  const total = all.length;
  if (total === 0) return { weightedScore: 0, naiveScore: 0, coreScore: 0, secondaryScore: 0 };
  const naiveScore = Math.round((gapResult.matched.length / total) * 100 * 100) / 100;
  const coreMatchedW = gapResult.matched.filter((s) => s.category === 'core').reduce((a, s) => a + s.weight, 0);
  const coreTotalW = all.filter((s) => s.category === 'core').reduce((a, s) => a + s.weight, 0);
  const secMatchedW = gapResult.matched.filter((s) => s.category === 'secondary').reduce((a, s) => a + s.weight, 0);
  const secTotalW = all.filter((s) => s.category === 'secondary').reduce((a, s) => a + s.weight, 0);
  const coreScore = coreTotalW > 0 ? Math.round((coreMatchedW / coreTotalW) * 100 * 100) / 100 : 0;
  const secondaryScore = secTotalW > 0 ? Math.round((secMatchedW / secTotalW) * 100 * 100) / 100 : 0;
  const weightedScore = Math.round((0.70 * coreScore + 0.30 * secondaryScore) * 100) / 100;
  return { weightedScore, naiveScore, coreScore, secondaryScore };
}

function getReadinessLabel(score) {
  if (score >= 70) return 'Strong';
  if (score >= 40) return 'Developing';
  return 'Beginner';
}

function getCareerComparison(userSkills, canonicals) {
  const { roles } = loadData();
  const domainRoleMap = {};
  for (const r of roles) {
    if (!domainRoleMap[r.domain]) domainRoleMap[r.domain] = new Set();
    domainRoleMap[r.domain].add(r.role);
  }
  const results = [];
  for (const [domain, roleSet] of Object.entries(domainRoleMap)) {
    for (const role of roleSet) {
      const roleSkills = getRoleSkills(domain, role);
      if (roleSkills.length === 0) continue;
      const gap = analyzeSkillGap(userSkills, roleSkills, canonicals);
      const scores = calculateReadinessScore(gap);
      const total = gap.matched.length + gap.missing.length + gap.partial.length;
      results.push({
        domain, role,
        weightedScore: scores.weightedScore,
        naiveScore: scores.naiveScore,
        matchedCount: gap.matched.length,
        totalCount: total,
      });
    }
  }
  results.sort((a, b) => b.weightedScore - a.weightedScore);
  return results;
}

function getCoursesForSkill(skill) {
  const { courses } = loadData();
  if (courses[skill]) return courses[skill];
  const keys = Object.keys(courses);
  for (const k of keys) {
    if (fuzzyScore(skill, k) >= 80) return courses[k];
  }
  return [];
}

export function analyze(userSkills, domain, role) {
  const canonicals = getAllCanonicalSkills();
  const roleSkills = getRoleSkills(domain, role);
  if (roleSkills.length === 0) throw new Error('No skill data found for this role');
  const gap = analyzeSkillGap(userSkills, roleSkills, canonicals);
  const scores = calculateReadinessScore(gap);
  const comparison = getCareerComparison(userSkills, canonicals);
  const top5 = comparison.slice(0, 5);
  const allMissing = [...gap.missing, ...gap.partial];
  const recommendations = allMissing.map((s) => ({
    skill: s.skill,
    category: s.category,
    courses: getCoursesForSkill(s.skill),
  }));
  return {
    scores: { ...scores, label: getReadinessLabel(scores.weightedScore) },
    gap: {
      matched: gap.matched,
      missing: gap.missing,
      partial: gap.partial,
    },
    summary: {
      skillsEntered: userSkills.length,
      matched: gap.matched.length,
      missing: gap.missing.length,
      partial: gap.partial.length,
    },
    top5,
    comparison,
    recommendations,
  };
}

export function getMetadata() {
  return { domains: getDomains(), allSkills: getAllCanonicalSkills() };
}

export function getRoles(domain) {
  return getRolesByDomain(domain);
}
