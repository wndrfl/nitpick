const fs = require('fs');
const lighthouse = require('lighthouse');
const output = require('../lib/output');
const chromeLauncher = require('chrome-launcher');

function scorePasses(score) {
  return (score >= 90);
}

function normalizeScore(score) {
  return score * 100;
}

export function analysisCategoryPasses(runnerResult, lhrCategory) {
  const score = normalizeScore(runnerResult.lhr.categories[lhrCategory].score);
  return scorePasses(score);
}

export function logResultsOfAnalysis(runnerResult, analysisTitle, lhrCategory) {
  const score = normalizeScore(runnerResult.lhr.categories[lhrCategory].score);

  if(scorePasses(score)) {
    output.bigSuccess('********** ' + analysisTitle + ' Passed! [SCORE: ' + score + ' / 100]');

  } else {
    output.bigFailure('********** ' + analysisTitle + ' Failed.  [SCORE: ' + score + ' / 100] (Must be 90 - 100)');

    for(var key in runnerResult.lhr.audits) {

      if(!runnerResult.lhr.audits.hasOwnProperty(key)) {
        continue;
      }

      const audit = runnerResult.lhr.audits[key];
      const score = normalizeScore(audit.score);

      if(scorePasses(score)) {
        output.success('✅ [' + score + '] ' + audit.title, true);
      } else {
        const msg = '🚨 [' + score + '] ' + audit.title + ': ' + audit.description;
        output.failure(msg, true);
      }
    }
  }
}

export async function runLighthouse(url,categories) {

  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'html', onlyCategories: categories, port: chrome.port};
  const runnerResult = await lighthouse(url, options);

  // `.report` is the HTML report as a string
  // const reportHtml = runnerResult.report;
  // fs.writeFileSync('lhreport.html', reportHtml);

  // `.lhr` is the Lighthouse Result as a JS object
  console.log('Report is done for', runnerResult.lhr.finalUrl);

  await chrome.kill();

  return runnerResult;
}