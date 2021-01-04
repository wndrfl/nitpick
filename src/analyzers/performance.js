const lighthouse = require('../lib/lighthouse');

export async function run(url) {
  const runnerResult = await lighthouse.runLighthouse(url,['performance']);
  lighthouse.logResultsOfAnalysis(runnerResult, 'Performance Audit', 'performance');
  return lighthouse.analysisCategoryPasses(runnerResult, 'performance');
}