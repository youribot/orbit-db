'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const utils = require('./test-utils')
const cli = utils.runCommand
const commands = utils.commands

describe.only('Put', function() {
  this.timeout(utils.timeout)

  before((done) => {
    done()
  })

  after(() => {
    // TODO: rimraf orbit-db data directory
  })

  it('adds a document to database', (done) => {
    cli(commands.put)
      .then(() => cli(commands.search + ' --output json'))
      .then((output) => assert.equal(output, utils.testDataOutput))
      .then(done)
      .catch(done)
  })
})
