'use strict'

const IpfsDaemon = require('ipfs-daemon')
const OrbitDB = require('../src/OrbitDB')

const userId = 123//Math.floor(Math.random() * 1000)
const conf = { 
  IpfsDataDir: '/tmp/' + userId,
  Addresses: {
    API: '/ip4/127.0.0.1/tcp/0',
    Swarm: ['/ip4/0.0.0.0/tcp/0'],
    Gateway: '/ip4/0.0.0.0/tcp/0'
  },
}

console.log("Starting...")

IpfsDaemon(conf)
  .then((res) => {
    const orbitdb = new OrbitDB(res.ipfs)
    const db = orbitdb.docstore("|orbit-db|examples|docstore-example")

    const creatures = ['🐙', '🐷', '🐬', '🐞', '🐈', '🙉', '🐸', '🐓']

    db.events.on('ready', () => {
      const latest = db.get(userId)[0]
      let output = ``
      output += `--------------------\n`
      output += `Latest Visitors\n`
      output += `--------------------\n`
      output += JSON.stringify(latest) + `\n`
      console.log(output)          
    })

    const query = () => {
      const index = Math.floor(Math.random() * creatures.length)
      // db.put({ _id: userId, avatar: creatures[index], userId: userId })
      //   .then(() => {
      //     const latest = db.get(userId)[0]
      //     let output = ``
      //     output += `--------------------\n`
      //     output += `Latest Visitors\n`
      //     output += `--------------------\n`
      //     output += JSON.stringify(latest) + `\n`
      //     console.log(output)          
      //   })
      //   .catch((e) => {
      //     console.error(e.stack)
      //   })
    }

    setInterval(query, 1000)
  })
  .catch((err) => console.error(err))
