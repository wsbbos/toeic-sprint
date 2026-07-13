import assert from 'node:assert/strict';
import test from 'node:test';

import { inspectBaseline } from '../../scripts/baselineChecks.mjs';

test('baseline retains the existing Part 5, Part 7, Supabase, and core page assets', async () => {
  const report = await inspectBaseline();

  assert.equal(report.failures.length, 0, report.failures.join('\n'));
  assert.ok(report.part5Count >= 20);
  assert.ok(report.part7QuestionCount >= 30);
  assert.equal(report.hasSupabaseIntegration, true);
  assert.equal(report.hasPart7Adapter, true);
});

test('baseline reports the current modularization and question-bank metrics', async () => {
  const report = await inspectBaseline();

  assert.ok(report.appLineCount < 100);
  assert.deepEqual(report.part5AnswerDistribution, { A: 9, B: 8, C: 3, D: 0 });
  assert.equal(report.hasAutomatedTestDependencies, false);
});
