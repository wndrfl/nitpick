const lighthouse = require('../lib/lighthouse');

function scorePasses(score) {
	return (score >= 90);
}

function normalizeScore(score) {
	return score * 100;
}

export async function run(url) {
  const runnerResult = await lighthouse.runLighthouse(url,['seo']);
  lighthouse.logResultsOfAnalysis(runnerResult, 'SEO Audit', 'seo');
  return lighthouse.analysisCategoryPasses(runnerResult, 'seo');
}