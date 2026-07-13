import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { part5QuestionBank } from '../src/data/part5QuestionBank.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'src/App.jsx',
  'src/pages/QuestionPractice.jsx',
  'src/pages/ActiveMockTest.jsx',
  'src/pages/WrongBook.jsx',
  'src/data/part5QuestionBank.js',
  'src/data/questions.js',
  'src/lib/supabase.js',
  'supabase/migrations/202606300001_join_study_group_by_invite_code.sql',
];

const readProjectFile = (relativePath) =>
  readFile(path.join(repositoryRoot, relativePath), 'utf8');

const countLines = (source) => source.split(/\r?\n/).length;

export async function inspectBaseline() {
  const [appSource, questionsSource, supabaseSource, packageSource] = await Promise.all([
    readProjectFile('src/App.jsx'),
    readProjectFile('src/data/questions.js'),
    readProjectFile('src/lib/supabase.js'),
    readProjectFile('package.json'),
  ]);

  const packageJson = JSON.parse(packageSource);
  const rawPart7Start = questionsSource.indexOf('const rawPart7Data = [');
  const rawPart7End = questionsSource.indexOf('// Compile Part 7 passages');
  const rawPart7Source =
    rawPart7Start >= 0 && rawPart7End > rawPart7Start
      ? questionsSource.slice(rawPart7Start, rawPart7End)
      : '';
  const part7QuestionCount = (rawPart7Source.match(/part:\s*7,/g) || []).length;
  const part5AnswerDistribution = { A: 0, B: 0, C: 0, D: 0 };

  part5QuestionBank.forEach((question) => {
    if (Object.hasOwn(part5AnswerDistribution, question.answer)) {
      part5AnswerDistribution[question.answer] += 1;
    }
  });

  const fileChecks = await Promise.all(
    requiredFiles.map(async (relativePath) => {
      try {
        await readProjectFile(relativePath);
        return { relativePath, exists: true };
      } catch {
        return { relativePath, exists: false };
      }
    }),
  );

  const hasSupabaseIntegration =
    supabaseSource.includes("from '@supabase/supabase-js'") &&
    supabaseSource.includes('createClient');
  const hasPart7Adapter =
    questionsSource.includes('const parsedPart7 = []') &&
    questionsSource.includes('...parsedPart7');
  const hasAutomatedTestDependencies = [
    'vitest',
    '@testing-library/react',
    '@playwright/test',
  ].every((dependency) => Object.hasOwn(packageJson.devDependencies || {}, dependency));

  const failures = fileChecks
    .filter((check) => !check.exists)
    .map((check) => `Missing required baseline file: ${check.relativePath}`);

  if (part5QuestionBank.length < 20) {
    failures.push(`Part 5 baseline fell below 20 questions: ${part5QuestionBank.length}`);
  }
  if (part7QuestionCount < 30) {
    failures.push(`Part 7 baseline fell below 30 questions: ${part7QuestionCount}`);
  }
  if (!hasSupabaseIntegration) {
    failures.push('Supabase integration entry point is missing');
  }
  if (!hasPart7Adapter) {
    failures.push('Part 7 unified question adapter is missing');
  }

  return {
    failures,
    requiredFiles: fileChecks,
    appLineCount: countLines(appSource),
    part5Count: part5QuestionBank.length,
    part5AnswerDistribution,
    part7QuestionCount,
    hasSupabaseIntegration,
    hasPart7Adapter,
    hasAutomatedTestDependencies,
  };
}
