'use strict'

exports.command = 'docstore <command> <dbname>'
exports.desc = 'Document Database'

exports.builder = function (yargs) {
  return yargs
    .commandDir('docstore')
    .usage('Usage: $0 docstore <command>')
    .option('progress', {
      alias: 'p',
      describe: 'Display pretty progress bars',
      default: false,
    })
    .option('limit', {
      alias: 'l',
      describe: 'Limit how many entries to load to the database',
      default: -1,
    })
    .option('timing', {
      alias: 't',
      describe: 'Display how long the command took to run',
      default: false,
    })
}

exports.handler = function (argv) {}
