const lighthouse = require('../lib/lighthouse');

export async function run(url) {
  const runnerResult = await lighthouse.runLighthouse(url,['accessibility']);
  lighthouse.logResultsOfAnalysis(runnerResult, 'Accessibility Audit', 'accessibility');
  return lighthouse.analysisCategoryPasses(runnerResult, 'accessibility');
}