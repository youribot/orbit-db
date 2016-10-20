'use strict'

const Ipfs = require('exports?Ipfs!ipfs/dist/index.js')
const IPFSRepo = require('ipfs-repo')

const idb = window.indexedDB ||
              window.mozIndexedDB ||
              window.webkitIndexedDB ||
              window.msIndexedDB
const store = require('idb-pull-blob-store')

const OrbitDB = require('../../src/OrbitDB')

const username = new Date().getTime()
const channel  = 'browser-example'
const key      = 'greeting'

try {
  const elm = document.getElementById("result")
  // const ipfs = IpfsApi('localhost', '5001')
  const repo = new IPFSRepo('/tmp/hello-world/' + username, { stores: store })
  const ipfs = new Ipfs(repo)

  let orbit, db, log, counter

  const creatures = ['👻', '🐙', '🐷', '🐬', '🐞', '🐈', '🙉', '🐸', '🐓']

  let count = 1
  const query = () => {
    const startTime = new Date().getTime()
    const idx = Math.floor(Math.random() * creatures.length)

    // Set a key-value pair
    db.put(key, "db.put #" + count + " - GrEEtinGs to " + creatures[idx])
      .then((res) => {
        const endTime = new Date().getTime()
        console.log(`db.put (#${count}) took ${(endTime - startTime)} ms\n`)
        count ++
      })
      .then(() => counter.inc()) // Increase the counter by one
      .then(() => log.add(creatures[idx])) // Add an event to 'latest visitors' log
      .then(() => {
          const result = db.get(key)
          const latest = log.iterator({ limit: 5 }).collect()
          const count  = counter.value

          const output = 
`<b>Key-Value Store</b>
-------------------------------------------------------
Key | Value
-------------------------------------------------------
${key} | ${result}
-------------------------------------------------------

<b>Eventlog</b>
-------------------------------------------------------
Latest Visitors
-------------------------------------------------------
${latest.reverse().map((e) => e.payload.value + "   at " + new Date(e.payload.meta.ts).toISOString()).join('\n')}

<b>Counter</b>
-------------------------------------------------------
Visitor Count: ${count}
-------------------------------------------------------
`
          elm.innerHTML = output.split("\n").join("<br>")
      })
      .catch((e) => {
        elm.innerHTML = "<i>" + e.message + "</i><br><br>" + "Waiting for IPFS daemon to start..."
        console.error(e.stack)
      })
  }


  ipfs.init({ emptyRepo: true, bits: 512 }, (err) => {
    ipfs.config.get((err, config) => {
      const star_addr = ('/libp2p-webrtc-star/ip4/178.62.241.75/tcp/9090/ws/ipfs/' + config.Identity.PeerID)
      ipfs.config.set('Addresses.Swarm[1]', star_addr, (err) => {
        ipfs.load((err) => {
          ipfs.goOnline(() => {
            console.log("DAEMON READY")
            // daemon ready
            orbit = new OrbitDB(ipfs, username)
            db = orbit.kvstore(channel)
            log = orbit.eventlog(channel + ".log")
            counter = orbit.counter(channel + ".count")
            setInterval(query, Math.random() * 3 * 1000)
          })
        })
      })
     })
  })

} catch(e) {
  console.error(e.stack)
  elm.innerHTML = e.message
}
