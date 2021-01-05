import arg from 'arg';
import inquirer from 'inquirer';

const lighthouse = require('./analyzers/lighthouse');

const shelljs = require('shelljs');

const defaultFn = 'all';

function parseArgumentsIntoOptions(rawArgs) {

  const args = arg(
    {
      // '--clean-slate': Boolean,
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    cleanSlate: args['--clean-slate'] || false,
    fn: args._[0],
    url: args._[1]
  };
}

async function promptForMissingOptions(options) {

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'fn',
      message: 'What would you like to QA?',
      choices: [
        {
          'name': 'All',
          'value': 'all'
        },
        {
          'name': 'SEO',
          'value': 'seo'
        },
        {
          'name': 'Performance',
          'value': 'performance'
        },
        {
          'name': 'Accessibility',
          'value': 'accessibility'
        },
      ],
      default: defaultFn,
    }
  ]);

  return {
    ...options,
    fn: options.fn || answers.fn,
  };

}

export async function cli(args) {
	
  let options = parseArgumentsIntoOptions(args);

  if(!options.fn) {
    options = await promptForMissingOptions(options);
  }

  if(!options.url) {
    let answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Which URL?',
        default: 'https://wonderful.io/',
      }
    ]);

    options.url = answers.url;
  }

  switch(options.fn) {

    case 'accessibility':
      await lighthouse.accessibility(options.url);
      break;

    case 'all':
      await lighthouse.all(options.url);
      break;

    case 'performance':
      await lighthouse.performance(options.url);
      break;

    case 'seo':
      await lighthouse.seo(options.url);
      break;

  }
}