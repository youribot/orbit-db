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
const maxHistory = Math.max(process.argv[3], -1) || 10
const displayEventsAmount = Math.max(process.argv[4], -1) || 10 // how many to show in the result output

const dataPath = './orbit-db'
const dbPath = path.join(dataPath, '/live/db/')
const ipfsPath = path.join(dataPath, '/live/ipfs/')

const conf = { 
  IpfsDataDir: ipfsPath,
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/0',
    Swarm: ['/ip4/0.0.0.0/tcp/0'],
    Gateway: '/ip4/0.0.0.0/tcp/0'
  },
}

let newEventCount = 0
let eventCount = -1

const st1 = new Date().getTime()

const ipfs = new IpfsDaemon(conf)

ipfs.on('error', (err) => console.error(err))

ipfs.on('ready', () => {
  const orbitdb = new OrbitDB(ipfs)
  const db = orbitdb.eventlog(dbname, { maxHistory: maxHistory, cachePath: dbPath })

  const query = () => {
    const events = db.iterator({ limit: maxHistory }).collect()

    const buildUserString = (userId) => {
      let padding = '                                 '
      let res = padding.split('')
      const chars = userId.length > padding.length 
        ? userId.substring(0, padding.length - 3).split('').concat(['...'])
        : userId.substring(0, padding.length).split('')
      res = userId.length > padding.length
        ? []
        : res.slice(chars.length, res.length)
      res = chars.concat(res)
      return res.join('')
    }

    const buildPaymentAmountString = (payment) => chance.pad(payment, 7, ' ')

    let size = displayEventsAmount > -1 ? displayEventsAmount : events.length
    size = displayEventsAmount > -1 
      ? Math.min(size, Math.max(maxHistory, displayEventsAmount))
      : events.length

    let lines = events.slice(-size)
      .reverse()
      .map(e => `│ ${(new Date(e.payload.value.ts)).toISOString()} │ ${buildUserString(e.payload.value.userId)} │ ${buildPaymentAmountString(e.payload.value.payment)} │ ${e.clock.time}`)
      .join('\n')

    const latest = events[events.length - 1]
    eventCount = latest ? latest.clock.time : 0

    process.stdout.write(`\nQuery ${maxHistory === -1 ? 'all' : maxHistory} events from '${dbname}', showing ${size} of ${eventCount} events`)

    let output = `\n`
    output += `┌──────────────────────────┬───────────────────────────────────┬─────────┐\n`
    output += `│ ts                       │ userId                            │ payment │\n`
    output += `├──────────────────────────┼───────────────────────────────────┼─────────┤\n`
    output += lines === '' ? '' : `${lines}\n`
    output += `└──────────────────────────┴───────────────────────────────────┴─────────┘\n`
    process.stdout.write(output)
  }

  db.events.on('ready', () => {
    if (eventCount === -1) {
      const latest = db.iterator({ limit: 1 }).collect()[0]
      eventCount = latest ? latest.clock.time : 0
      let amountToLoad = maxHistory > -1 ? Math.min(eventCount, maxHistory) : eventCount

      const bar = progress({ 
        width: 48, 
        total: amountToLoad,
        complete: '=',
        incomplete: ' ',
        style: (complete, incomplete) => complete + '>' + incomplete,
      })

      const outputProgress = (dbname, hash, entry, progress) => {
        const latest = db.iterator({ limit: 1 }).collect()[0]
        eventCount = Math.max(eventCount, entry ? entry.clock.time : 0)
        let amountToLoad = maxHistory > -1 ? Math.min(eventCount, maxHistory) : eventCount
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
      query()

      console.log()

      const et1 = new Date().getTime()
      process.stdout.write(`Started in ${et1 - st1} ms\n`)

      console.log(`Listening for updates...`)

      let st, et

      db.events.on('sync', () => {
        st = new Date().getTime()
        process.stdout.write('\nSyncing...')
      })

      db.events.on('synced', () => {
        et = new Date().getTime()
        process.stdout.write(` (sync took: ${et - st} ms)\n`)
        query()
      })
    }
  })

  // process.stdout.write('Waiting for peers...\n')
  // const timer = setInterval(() => {
  //   ipfs.pubsub.peers(dbname, (err, peers) => {
  //     if (peers.length > 0) {
  //       clearInterval(timer)
  //       process.stdout.write(`Found ${peers.length} peer(s)\n`)
  //       db.load(1)
  //     }
  //   })
  // }, 100)

  db.load(1)
})
