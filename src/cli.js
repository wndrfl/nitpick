import arg from 'arg';
import inquirer from 'inquirer';

const accessibility = require('./analyzers/accessibility');
const performance = require('./analyzers/performance');
const seo = require('./analyzers/seo');

const shelljs = require('shelljs');

const defaultFn = 'seo';

function parseArgumentsIntoOptions(rawArgs) {

  const args = arg(
    {
      '--clean-slate': Boolean,
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    cleanSlate: args['--clean-slate'] || false,
    fn: args._[0],
    server: args['--clean-slate'] || false,
    // runInstall: args['--install'] || false,
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
        // {
        //   'name': 'Accessibility',
        //   'value': 'accessibility'
        // },
        // {
        //   'name': 'WordPress Theme Code',
        //   'value': 'wordpress_theme_code'
        // }
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

  options = await promptForMissingOptions(options);

  switch(options.fn) {
    case 'accessibility':
      const accessibilityAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Which URL?',
          default: 'https://wonderful.io/',
        }
      ]);
      await accessibility.run(accessibilityAnswers.url);
      break;
    case 'performance':
      const performanceAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Which URL?',
          default: 'https://wonderful.io/',
        }
      ]);
      await performance.run(performanceAnswers.url);
      break;
    case 'seo':
      const seoAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'url',
          message: 'Which URL?',
          default: 'https://wonderful.io/',
        }
      ]);
      await seo.run(seoAnswers.url);
      break;
  }
}