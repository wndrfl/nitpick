const fs = require('fs');
const lighthouse = require('./src/lib/lighthouse');
const open = require('open');
const output = require('./src/lib/output');

export const supportedCategories = {
	accessibility : {
		title : 'Accessibility',
		key : 'accessibility'
	},
	performance : {
		title : 'Performance',
		key : 'performance'
	},
	seo : {
		title : 'SEO',
		key : 'seo'
	}
};

const defaultOptions = {
	lhrCategories : Object.values(supportedCategories),
	openResultsInBrowser : false,
	url : 'https://wonderful.io/',
	verbose : false,
};

function mergeOptionsIntoDefaults(options) {
	return {
		...defaultOptions,
		lhrCategories: options.lhrCategories || defaultOptions.lhrCategories,
		openResultsInBrowser: options.openResultsInBrowser || defaultOptions.openResultsInBrowser,
		url: options.url || defaultOptions.url,
		verbose: options.verbose || defaultOptions.verbose
	};
}

export async function all(options) {
	return await run(options);
}

export async function category(category, options) {
	options.lhrCategories = [category];
	return await run(options);
}

export async function run(options) {

	if(options.lhrCategories != null && !Array.isArray(options.lhrCategories)) {
		options.lhrCategories = [options.lhrCategories];
	}

	options = mergeOptionsIntoDefaults(options);

	if(options.lhrCategories.length < 1) {
		options.lhrCategories = Object.values(supportedCategories);
	}

	output.bigInfo('Starting audits (' + (options.lhrCategories.map((item) => { return item.title }).join(', ')) + ') for URL: ' + options.url);

	const runnerResult = await lighthouse.runLighthouse(options.url,options.lhrCategories.map((item) => {
		return item.key;
	}));

	let categoryResults = {};

	let passes = false;
	for(var i in options.lhrCategories) {
		
		let results = lighthouse.parseResultsOfCategoryAnalysis(runnerResult, options.lhrCategories[i].key);
		if(!results) {
			continue;
		}
		
		if(lighthouse.analysisCategoryPasses(runnerResult, options.lhrCategories[i].key)) {
			passes = true;
		}

		output.newline();
		output.bigInfo(options.lhrCategories[i].title + ' Audit');
		output.success('✅ ' + results.passed.length + ' passed audits...');
		output.failure('🚨 ' + results.failed.length + ' failed audits...');
		output.warning('⚠️  ' + results.notApplicable.length + ' optional audits...');

		let score = lighthouse.normalizeScore(runnerResult.lhr.categories[options.lhrCategories[i].key].score);
		if(lighthouse.scorePasses(score)) {
			output.bigSuccess(options.lhrCategories[i].title + ' Audit Passed! [SCORE: ' + score + ' / 100]');
		} else {
			output.bigFailure(options.lhrCategories[i].title + ' Failed. [SCORE: ' + score + ' / 100] (Must be 90 - 100)');
		}

		categoryResults[options.lhrCategories[i].title] = results;
	}

	// Open the report in the browser?
	if(options.openResultsInBrowser) {
		output.info('Opening report in browser...');
		const reportHtml = runnerResult.report;
		const filename = 'lhreport.html';
		fs.writeFileSync(filename, reportHtml);
		await open(filename);
		// await fs.unlinkSync(filename);
	}

	if(options.verbose) {
		for(var i in categoryResults) {
			let failed = categoryResults[i].failed;
			output.newline();
			output.bigInfo(i + ' Improvement Opportunities');
			for(var f in failed) {
				var item = failed[f];
				output.failure('[ ] ' + item.title, "\n" + item.description);
				output.newline();
			}
		}
	}

	return passes;
}