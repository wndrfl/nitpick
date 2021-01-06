// https://web.dev/learn/#lighthouse

const fs = require('fs');
const lighthouse = require('lighthouse');
const output = require('../lib/output');
const chromeLauncher = require('chrome-launcher');

export function scorePasses(score) {
  return (score >= 90);
}

export function normalizeScore(score) {
  return score * 100;
}

export function analysisCategoryPasses(runnerResult, lhrCategory) {
  const score = normalizeScore(runnerResult.lhr.categories[lhrCategory].score);
  return scorePasses(score);
}

export function parseResultsOfCategoryAnalysis(runnerResult, lhrCategory) {

  if(!runnerResult.lhr.categories[lhrCategory]) {
    return;
  }

  const auditRefs = runnerResult.lhr.categories[lhrCategory].auditRefs;
  const auditRefIds = auditRefs.map((ref) => {
    return ref.id;
  });

  const notApplicableAudits = [];
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

    // Weed out various audits that don't impact the report
    if(audit.score == null && audit.scoreDisplayMode != 'notApplicable') {
      continue;
    }

    const score = normalizeScore(audit.score);      

    var auditRepresentation = {
      title: audit.title, 
      description: audit.description,
      score: score,
      details: audit.details,
    };

    // Some items are "not applicable" and don't count against
    // the score
    if(audit.scoreDisplayMode == 'notApplicable') {

      notApplicableAudits.push(auditRepresentation);

    }else{

      // If the score is above a certain threshold, it "passes"
      if(scorePasses(score)) {
        passedAudits.push(auditRepresentation);

      // If the score is below threashold
      } else {
        failedAudits.push(auditRepresentation);
      }
    }
  }

  return {
    failed: failedAudits,
    notApplicable: notApplicableAudits,
    passed: passedAudits
  }
}

export async function runLighthouse(url,categories) {

  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'html', onlyCategories: categories, port: chrome.port};
  const runnerResult = await lighthouse(url, options);

  await chrome.kill();

  return runnerResult;
}