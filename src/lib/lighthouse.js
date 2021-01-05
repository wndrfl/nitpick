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

export function logResultsOfCategoryAnalysis(runnerResult, analysisTitle, lhrCategory) {

  if(!runnerResult.lhr.categories[lhrCategory]) {
    return;
  }

  output.newline();
  output.newline();
  output.bigInfo(analysisTitle + ' Audit');

  const auditRefs = runnerResult.lhr.categories[lhrCategory].auditRefs;
  const auditRefIds = auditRefs.map((ref) => {
    return ref.id;
  });
  output.info(auditRefIds.length + ' total audits...');

  const passedAudits = [];
  const failedAudits = [];

  for(var key in runnerResult.lhr.audits) {

    if(!auditRefIds.includes(key)) {
      continue;
    }

    if(!runnerResult.lhr.audits.hasOwnProperty(key)) {
      continue;
    }

    const audit = runnerResult.lhr.audits[key];
    const score = normalizeScore(audit.score);

    if(scorePasses(score)) {
      passedAudits.push({
        title: '✅ [' + score + '] ' + audit.title + ':', 
        msg: audit.description, 
        indented: true
      });
    } else {
      failedAudits.push({
        title: '🚨 [' + score + '] ' + audit.title + ':', 
        msg: audit.description, 
        indented: true
      });
    }
  }

  output.newline();
  output.info(failedAudits.length + ' failed audits...');
  for(var i in failedAudits) {
    output.failure(failedAudits[i].title, failedAudits[i].msg, failedAudits[i].indented);
  }

  output.newline();
  output.info(passedAudits.length + ' passed audits...');
  for(var i in passedAudits) {
    output.success(passedAudits[i].title, passedAudits[i].msg, passedAudits[i].indented);
  }

  output.newline();
  let score = normalizeScore(runnerResult.lhr.categories[lhrCategory].score);
  if(scorePasses(score)) {
    output.bigSuccess(analysisTitle + ' Audit Passed! [SCORE: ' + score + ' / 100]');
  } else {
    output.bigFailure(analysisTitle + ' Failed. [SCORE: ' + score + ' / 100] (Must be 90 - 100)');
  }
  output.newline();
}

export async function runLighthouse(url,categories) {

  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'html', onlyCategories: categories, port: chrome.port};
  const runnerResult = await lighthouse(url, options);

  // `.report` is the HTML report as a string
  // const reportHtml = runnerResult.report;
  // fs.writeFileSync('lhreport.html', reportHtml);

  // `.lhr` is the Lighthouse Result as a JS object
  // console.log('Report is done for', runnerResult.lhr.finalUrl);

  await chrome.kill();

  return runnerResult;
}