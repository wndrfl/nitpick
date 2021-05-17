const fs = require('fs');
const lighthouse = require('./src/lib/lighthouse');
const metadata = require('./src/lib/metadata');
const mustache = require('mustache');
const open = require('open');
const output = require('./src/lib/output');
const prettyBytes = require('pretty-bytes');
const prettyMilliseconds = require('pretty-ms');

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
		options.lhrCategories = [
			supportedCategories.seo,
			supportedCategories.performance
		];
		// options.lhrCategories = Object.values(supportedCategories);
	}

	output.info('Starting Lighthouse audits (' + (options.lhrCategories.map((item) => { return item.title }).join(', ')) + ')...');

	const runnerResult = await lighthouse.runLighthouse(url,options.lhrCategories.map((item) => {
		return item.key;
	}));

	let categoryResults = {};

	let passes = false;
	for(var i in options.lhrCategories) {
		
		let results = lighthouse.parseResultsOfCategoryAnalysisIntoPassFail(runnerResult, options.lhrCategories[i].key);
		if(!results) {
			continue;
		}

		// console.log(results);
		
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

	let path = require.resolve('./src/report.template.html');
	let data = fs.readFileSync(path, 'utf8');

	let params = {};

	// General Meta
	params.canonical = metadataForUrl.canonical || '-';
	params.meta_description = metadataForUrl.meta_description || '-';
	params.fb_app_id = metadataForUrl.fb_app_id || '-';
	params.fb_pages = metadataForUrl.fb_pages || '-';
	params.h1 = metadataForUrl.h1 || '-';
	params.og_image = metadataForUrl.og_image || '-';
	params.og_title = metadataForUrl.og_title || '-';
	params.og_type = metadataForUrl.og_type || '-';
	params.og_url = metadataForUrl.og_url || '-';
	params.page_title = metadataForUrl.title || '-';
	params.url = url;

	// Performance metrics
	// https://yoast.com/google-lighthouse/
	params.performance = {
		gauge_class : 'na',
		gauge_text : 'N/A',
		improvement_opportunities : null,
		metrics : {},
		score : 0,
	};
	if(runnerResult.lhr.categories['performance']) {

		const performanceMetricsToTrack = {
			first_contentful_paint : {
				goal: 2000,
				slug: 'first-contentful-paint'
			},
			largest_contentful_paint : {
				goal: 2500,
				slug: 'largest-contentful-paint'
			},
			total_blocking_time : {
				goal: 300,
				slug: 'total-blocking-time'
			},
		};

		const performanceCategory = runnerResult.lhr.categories['performance'];

		// Score
		params.performance.score = lighthouse.normalizeScore(performanceCategory.score);
		params.performance.gauge_class = (lighthouse.scorePasses(params.performance.score) ? 'pass' : 'fail');
		params.performance.gauge_text = (lighthouse.scorePasses(params.performance.score) ? 'Pass' : 'Fail');

		const auditRefs = performanceCategory.auditRefs;
		const auditRefIds = auditRefs.map((ref) => {
			return ref.id;
		});

		// Gather metrics
		for(var i in performanceMetricsToTrack) {

			let metric = performanceMetricsToTrack[i];
			let audit = runnerResult.lhr.audits[metric.slug];

			params.performance.metrics[i] = {
				class : (audit.numericValue <= metric.goal) ? 'pass' : 'fail',
				description : audit.description,
				display_value : (audit.numericUnit == 'millisecond') ? prettyMilliseconds(audit.numericValue) : audit.displayValue,
				milliseconds : (audit.numericUnit == 'millisecond') ? audit.numericValue : audit.numericValue * 1000,
				seconds : (audit.numericUnit == 'millisecond') ? audit.numericValue / 1000 : audit.numericValue,
			};	
		}

		// Improvement opportunities for performance
		let failed = categoryResults['Performance'].failed;
		for(var f in failed) {
			var item = failed[f];

			if(item.details && item.details.type == 'opportunity') {

				let opportunity = {
					id : item.id,
					title : item.title,
					description : item.description,
					details : null,
				};

				let details = {
					headers: [],
					rows: [],
					overallSavingsMs: item.details.overallSavingsMs ? prettyMilliseconds(item.details.overallSavingsMs) : 'n/a',
					overallSavingsBytes: item.details.overallSavingsBytes ? prettyBytes(item.details.overallSavingsBytes) : 'n/a',
				};

				details.headers = item.details.headings.map((heading) => {
					return heading.label;
				});

				details.rows = item.details.items.map((rowParams) => {

					let row = [];

					item.details.headings.forEach((v,i) => {
						switch(v.valueType) {
							case 'bytes':
								row.push(prettyBytes(rowParams[v.key]));
								break;
							case 'thumbnail':
								row.push('<img src="' + rowParams[v.key] + '" />');
								break;
							case 'timespanMs':
								row.push(prettyMilliseconds(rowParams[v.key]));
								break;
							case 'url':
								row.push('<a href="' + rowParams[v.key] + '" target="_blank">' + rowParams[v.key] + '</a>');
								break;
							default:
								row.push(rowParams[v.key]);
								break;
						}
					});

					return row;
				});

				opportunity.details = details;

				if(!params.performance.improvement_opportunities) {
					params.performance.improvement_opportunities = [];
				}
				
				params.performance.improvement_opportunities.push(opportunity);
			}
		}		
	}

	// SEO metrics
	params.seo = {
		gauge_class : 'na',
		gauge_text : 'N/A',
		improvement_opportunities : null,
		metrics : {},
		score : 0,
	};
	if(runnerResult.lhr.categories['seo']) {

		const seoMetricsToTrack = {
			document_title : {
				slug: 'document-title'
			},
			meta_description : {
				slug: 'meta-description'
			},

		};

		const seoCategory = runnerResult.lhr.categories['seo'];

		// Score
		params.seo.score = lighthouse.normalizeScore(seoCategory.score);
		params.seo.gauge_class = (lighthouse.scorePasses(params.seo.score) ? 'pass' : 'fail');
		params.seo.gauge_text = (lighthouse.scorePasses(params.seo.score) ? 'Pass' : 'Fail');

		const auditRefs = seoCategory.auditRefs;
		const auditRefIds = auditRefs.map((ref) => {
			return ref.id;
		});

		// Gather metrics
		for(var i in seoMetricsToTrack) {

			let metric = seoMetricsToTrack[i];
			let audit = runnerResult.lhr.audits[metric.slug];

			params.performance.metrics[i] = {
				class : (audit.numericValue <= metric.goal) ? 'pass' : 'fail',
				description : audit.description,
				display_value : (audit.numericUnit == 'millisecond') ? prettyMilliseconds(audit.numericValue) : audit.displayValue,
				milliseconds : (audit.numericUnit == 'millisecond') ? audit.numericValue : audit.numericValue * 1000,
				seconds : (audit.numericUnit == 'millisecond') ? audit.numericValue / 1000 : audit.numericValue,
			};	
		}

		// Improvement opportunities for performance
		let failed = categoryResults['SEO'].failed;
		for(var f in failed) {

			var item = failed[f];
			// console.log(item.details);

			let opportunity = {
				id : item.id,
				title : item.title,
				description : item.description,
				details : null,
			};

			let details = {
				headers: [],
				rows: [],
				overallSavingsMs: item.details.overallSavingsMs ? prettyMilliseconds(item.details.overallSavingsMs) : 'n/a',
				overallSavingsBytes: item.details.overallSavingsBytes ? prettyBytes(item.details.overallSavingsBytes) : 'n/a',
			};

			details.headers = item.details.headings.map((heading) => {
				return heading.text;
			});

			details.rows = item.details.items.map((rowParams) => {

				let row = [];

				item.details.headings.forEach((v,i) => {

					if(typeof rowParams[v.key] === 'object' && rowParams[v.key] !== null) {

						console.log(rowParams[v.key]);
						row.push('<pre>' + rowParams[v.key].snippet + '</pre>');

					}else{
						row.push(rowParams[v.key]);
					}
				});

				return row;
			});

			opportunity.details = details;

			if(!params.seo.improvement_opportunities) {
				params.seo.improvement_opportunities = [];
			}
			
			params.seo.improvement_opportunities.push(opportunity);
		}		
	}

	// Improvement Opportunities across all audits
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