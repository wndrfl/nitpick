const lighthouse = require('../lib/lighthouse');

export async function run(url) {
  const runnerResult = await lighthouse.runLighthouse(url,['seo']);
  lighthouse.logResultsOfAnalysis(runnerResult, 'SEO Audit', 'seo');
  return lighthouse.analysisCategoryPasses(runnerResult, 'seo');
}