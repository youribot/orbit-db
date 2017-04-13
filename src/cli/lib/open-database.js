'use strict'

const startIpfs = require('../start-ipfs.js')
const config = require('../config')
const initDB = require('../init-db.js')
const hookProgressOutput = require('../hook-output-progress')

const openDatabase = (argv, options) => {
  return startIpfs(config.daemonConfig)
    .then((ipfs) => {
      const db = initDB(ipfs, config.databasePath, argv)

      if (options.loadProgress && argv.output !== 'json') {
        hookProgressOutput(db, argv, `Loading database`, new Date().getTime())      
        process.stdout.write(`Loading database '${db.dbname}' `)
      }

      return db.loadFromSnapshot()
        .then(() => db)
    })
}

module.exports = openDatabase
