'use strict'

const IpfsDaemon = require('ipfs-daemon/src/ipfs-node-daemon')

const startIpfs = (config) => {
  return new Promise((resolve, reject) => {
    const ipfs = new IpfsDaemon(config)
    ipfs.on('error', reject)
    ipfs.on('ready', () => resolve(ipfs))
  })
}

module.exports = startIpfs
