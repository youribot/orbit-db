'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const utils = require('./test-utils')
const cli = utils.runCommand
const commands = utils.commands

describe.only('Demo', function() {
  this.timeout(utils.timeout * 10)

  before((done) => {
    done()
  })

  after(() => {
    // TODO: rimraf orbit-db data directory
  })

  it('runs the demo', (done) => {
    cli(commands.demo)
      .then((output) => assert.notEqual(output.indexOf("Demo finished!"), -1))
      .then(done)
      .catch(done)
  })
})
