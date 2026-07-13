import { inspectBaseline } from './baselineChecks.mjs';

const report = await inspectBaseline();

console.log('TOEIC Sprint baseline verification');
console.log(JSON.stringify(report, null, 2));

if (report.failures.length > 0) {
  process.exitCode = 1;
}
