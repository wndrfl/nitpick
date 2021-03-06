import arg from 'arg';
import inquirer from 'inquirer';

const nitpick = require('./index');

const shelljs = require('shelljs');

const defaultFn = 'all';

function parseArgumentsIntoOptions(rawArgs) {

  const args = arg(
    {
      '--open'    : Boolean,
      '--verbose' : Boolean,

      '-o'        : '--open',
      '-v'        : '--verbose',
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    openResultsInBrowser: args['--open'] || false,
    verbose: args['--verbose'] || false,
    url: args._[0],
    fn: args._[1]
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

  if(!options.url) {
    let answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'What URL would you like to fuss about?',
        default: 'https://wonderful.io/',
      }
    ]);

    options.url = answers.url;
  }


  if(!options.fn) {
    options = await promptForMissingOptions(options);
  }

  switch(options.fn) {

    case 'accessibility':
      options.lhrCategories = nitpick.supportedCategories.accessibility;
      return await nitpick.run(options);
      break;

    case 'all':
      return await nitpick.run(options);
      break;

    case 'performance':
      options.lhrCategories = nitpick.supportedCategories.performance;
      return await nitpick.run(options);
      break;

    case 'seo':
      options.lhrCategories = [nitpick.supportedCategories.seo];
      return await nitpick.run(options);
      break;

  }
}