'use strict'

const OrbitDB = require('../OrbitDB')

const initDatabase = (ipfs, databasePath, argv) => {
  const orbitdb = new OrbitDB(ipfs)
  const db = orbitdb.docstore(argv.dbname, { 
    maxHistory: argv.limit || -1,
    cachePath: databasePath,
    indexBy: argv.indexBy,
  })
  return db
}

module.exports = initDatabase
