# ✨Nitpick
A commandline interface aiding in the quality assurance of front end websites. 

## Installation

Using npm:

```
$ npm install -g @wndrfl/nitpick
```

## Quick Start
The most basic invocation of the Nitpick operates as a wizard-style program. Simply running `$ nitpick` in the command-line will present you with a table of contents of the various available features:

```
$ nitpick
? What URL would you like to fuss about? https://wonderful.io/
? What would you like to audit? (Use arrow keys)
❯ All
  SEO
  Performance
  Accessibility
```

## Commands
The Wonderpress provides different commands for many common tasks.

- `nitpick <url> <all|accessibility|seo|performance>` - Runs a Google Lighthouse audit on a provided public url, with the chosen audit category.

## License
MIT

## Collaborators
- Johnnie Munger johnnie@wonderful.io