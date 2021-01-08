const fs = require('fs');
const lighthouse = require('./src/lib/lighthouse');
const metadata = require('./src/lib/metadata');
const mustache = require('mustache');
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

	const url = options.url;

	output.bigInfo('Nitpicking: ' + url);

	// Get metadata
	output.info('Grabbing metadata...');
	let metadataForUrl = await metadata.get(url);
	for(var m in metadataForUrl) {
		output.info(m + ': ', (metadataForUrl[m] ? metadataForUrl[m] : '-'), true);
	}


	// Lighthouse operations
	output.newline();
	if(options.lhrCategories != null && !Array.isArray(options.lhrCategories)) {
		options.lhrCategories = [options.lhrCategories];
	}

	options = mergeOptionsIntoDefaults(options);

	if(options.lhrCategories.length < 1) {
		options.lhrCategories = Object.values(supportedCategories);
	}

	output.info('Starting Lighthouse audits (' + (options.lhrCategories.map((item) => { return item.title }).join(', ')) + ')...');

	const runnerResult = await lighthouse.runLighthouse(url,options.lhrCategories.map((item) => {
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

	// Generate report

	const filename = 'report.html';

	let path = require.resolve('./report.template.html');
	let data = fs.readFileSync(path, 'utf8');

	let params = {};

	// General Meta
	params.canonical = metadataForUrl.canonical;
	params.meta_description = metadataForUrl.meta_description;
	params.fb_app_id = metadataForUrl.fb_app_id;
	params.fb_pages = metadataForUrl.fb_pages;
	params.og_image = metadataForUrl.og_image;
	params.og_title = metadataForUrl.og_title;
	params.og_type = metadataForUrl.og_type;
	params.og_url = metadataForUrl.og_url;
	params.page_title = metadataForUrl.title;
	params.url = url;

	// Improvement Opportunities
	let improvementOpportunities = [];
	for(var i in categoryResults) {
		let failed = categoryResults[i].failed;
		for(var f in failed) {
			var item = failed[f];
			improvementOpportunities.push({
				title : item.title,
				description :  item.description
			});
		}
	}
	params.total_improvement_opportunities = improvementOpportunities.length;
	params.improvement_opportunities = improvementOpportunities;


	var content = mustache.render(data, params);
	fs.writeFileSync(filename, content);

	// Open the report in the browser?
	if(options.openResultsInBrowser) {
		output.info('Opening report in browser...');
		await open(filename);
		// await fs.unlinkSync(filename);
	}

	return passes;
}