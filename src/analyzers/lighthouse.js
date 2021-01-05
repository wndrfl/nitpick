const lighthouse = require('../lib/lighthouse');
const output = require('../lib/output');

const supportedCategories = [
	{
		title : 'Accessibility',
		key : 'accessibility'
	},
	{
		title : 'Performance',
		key : 'performance'
	},
	{
		title : 'SEO',
		key : 'seo'
	}
];

export async function all(url) {
	return await run(supportedCategories, url);
}

export async function accessibility(url) {
	return await run(supportedCategories.filter((item) => {
		return item.title == 'Accessibility';
	}), url);
}

export async function performance(url) {
	return await run(supportedCategories.filter((item) => {
		return item.title == 'Performance';
	}), url);
}

export async function seo(url) {
	return await run(supportedCategories.filter((item) => {
		return item.title == 'SEO';
	}), url);
}

export async function run(lhrCategories, url) {

	output.bigInfo('Starting audits (' + (lhrCategories.map((item) => { return item.title }).join(', ')) + ') for URL: ' + url);

	const runnerResult = await lighthouse.runLighthouse(url,lhrCategories.map((item) => {
		return item.key;
	}));

	let passes = false;
	for(var i in lhrCategories) {
		lighthouse.logResultsOfCategoryAnalysis(runnerResult, lhrCategories[i].title, lhrCategories[i].key);
		if(lighthouse.analysisCategoryPasses(runnerResult, lhrCategories[i].key)) {
			passes = true;
		}
	}

	return passes;
}