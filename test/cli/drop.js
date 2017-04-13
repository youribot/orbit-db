'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const utils = require('./test-utils')
const cli = utils.runCommand
const commands = utils.commands

describe.only('Drop', function() {
  this.timeout(utils.timeout)

  before((done) => {
    cli(commands.put)
      .then(() => cli(commands.search + ' --output json'))
      .then((output) => assert.equal(output, utils.testDataOutput))
      .then(done)
      .catch(done)
  })

  after(() => {
    // TODO: rmrf orbit-db data directory
  })

  it('drops database', (done) => {
    cli(commands.drop + ' yes')
      .then((output) => {
        const successOutput = `Dropped database '${utils.dbName}'`
        const res = String(output).match(successOutput)
        assert.equal(res[0], successOutput)
      })
      .then(() => cli(commands.search))
      .then((output) => {
        const successOutput = `Database '${utils.dbName}' is empty!`
        const res = String(output).match(successOutput)
        assert.equal(res[0], successOutput)
        done()
      })
      .catch(done)
  })

  it("errors if 'confirm' argument is not 'yes'", (done) => {
    cli(commands.drop + ' no')
      .then(() => done(new Error('Database was dropped')))
      .catch((err) => {
        const res = String(err.message).match(/Can't drop the database. Confirm with: 'yes'/)
        assert.equal(res[0], "Can't drop the database. Confirm with: 'yes'")
        done()
      })
  })
})
