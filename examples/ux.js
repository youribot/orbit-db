'use strict'

console.log("Starting...")

const path = require('path')
const Chance = require('chance')
const IpfsDaemon = require('ipfs-daemon/src/ipfs-node-daemon')
const OrbitDB = require('../src/OrbitDB')
const line = require('single-line-log').stdout
const progress = require('progress-string')

const chance = new Chance()

const dbname = process.argv[2] || 'default'
const maxHistory = Math.max(process.argv[3], -1) || -1
const interval = Math.max(process.argv[4], 30) || 200

const dataPath = './orbit-db'
const dbPath = path.join(dataPath, '/db/')
const ipfsPath = path.join(dataPath, '/ipfs/')

const conf = { 
  IpfsDataDir: ipfsPath,
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/0',
    Swarm: ['/ip4/0.0.0.0/tcp/0'],
    Gateway: '/ip4/0.0.0.0/tcp/0'
  },
}

const st = new Date().getTime()

let newEventCount = 0
let eventCount = -1

const ipfs = new IpfsDaemon(conf)

ipfs.on('error', (err) => console.error(err))

ipfs.on('ready', () => {
  const orbitdb = new OrbitDB(ipfs)
  const db = orbitdb.eventlog(dbname, { maxHistory: maxHistory, cachePath: dbPath })

  const generateEvent = () => {
    const event = { 
      ts: new Date().getTime(), 
      userId: chance.hash({ length: 46 }),
      payment: chance.floating({ min: 0, max: 999 }).toFixed(2) + '€',
    }

    db.add(event)
      .then(() => newEventCount ++)
      .then(() => line(`New events: ${newEventCount}`))
      .catch((e) => console.error(e.stack))
  }

  db.events.on('ready', () => {
    if (eventCount === -1) {
      const latest = db.iterator({ limit: 1 }).collect()[0]
      eventCount = latest ? latest.clock.time : 0
      const amountToLoad = maxHistory > -1 ? Math.min(eventCount, maxHistory) : eventCount

      const bar = progress({ 
        width: 48, 
        total: amountToLoad,
        complete: '=',
        incomplete: ' ',
        style: (complete, incomplete) => complete + '>' + incomplete,
      })

      const outputProgress = (dbname, hash, entry, progress) => {
        process.stdout.write('\r')
        process.stdout.write(`Loading database '${dbname}' [${bar(progress)}] (${progress} / ${amountToLoad} of ${eventCount})`)
      }

      db.events.on('load.progress', outputProgress)

      outputProgress(dbname, null, null, 0)

      db.load()
    } else {
      console.log()
      const all = db.iterator({ limit: -1 }).collect()
      console.log(`Database is ready`)
      setInterval(generateEvent, interval)
    }
  })

  db.load(1)
})
