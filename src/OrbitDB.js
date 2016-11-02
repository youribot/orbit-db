'use strict'

const EventEmitter  = require('events').EventEmitter
const EventStore    = require('orbit-db-eventstore')
const FeedStore     = require('orbit-db-feedstore')
const KeyValueStore = require('orbit-db-kvstore')
const CounterStore  = require('orbit-db-counterstore')
const DocumentStore = require('orbit-db-docstore')
const Pubsub        = require('orbit-db-pubsub')
const Cache         = require('./Cache')

const defaultNetworkName = 'Orbit DEV Network'

/**
 * @class OrbitDB
 * @param {IPFS} ipfs IPFS instance to use
 * @param {string} [id='default'] User Id for this database
 * @return {OrbitDB} An instance of OrbitDB
 * @requires {@link http://github.com/ipfs/js-ipfs|IPFS}
 * @requires {@link http://github.com/ipfs/js-ipfs-api|IPFS}
 * @example
    const orbitdb = new OrbitDB(ipfs, 'userId')
 */
class OrbitDB {
  constructor(ipfs, id = 'default') {
    this._ipfs = ipfs
    this._pubsub = new Pubsub(ipfs)
    this.stores = {} // TODO make private

    /**
     * @readonly
     * @type {object}
     * @property {string} id User ID of this instance
     */
    this.user = { id: id }

    /**
     * @readonly
     * @type {object}
     * @property {string} name Name of the network this instance is connected to
     */
    this.network = { name: defaultNetworkName }

    /**
     * Events in OrbitDB are accessible via this EventEmitter.
     * @readonly
     * @type {EventEmitter}
     * @example
        orbitdb.events.on('data', (dbname, item) => ...)
     */
    this.events = new EventEmitter()
  }

  /* Databases */

  /**
   * Get a Feed database instance
   * 
   * @param  {String} dbname Name of the database to use
   * @param  {Object} options TODO
   * @return {FeedStore} Feed database instance
   * @see {@link FeedStore} for API documentation.
   * @example
   * const db = orbitdb.feed('posts')
   */
  feed(dbname, options) {
    return this._createStore(FeedStore, dbname, options)
  }

  /**
   * Get an Eventlog database instance
   * 
   * @param  {String} dbname Name of the database to use
   * @param  {Object} options TODO
   * @return {EventStore} Eventlog database instance
   * @example
      const db = orbitdb.eventlog('visitors')
   */
  eventlog(dbname, options) {
    return this._createStore(EventStore, dbname, options)
  }

  /**
   * Get a Key-Value database instance
   * 
   * @param  {String} dbname Name of the database to use
   * @param  {Object} options TODO
   * @return {KVStore} Key-Value database instance
   * @example
      const db = orbitdb.kvstore('profile')
   */
  kvstore(dbname, options) {
    return this._createStore(KeyValueStore, dbname, options)
  }

  /**
   * Get a Counter database instance
   * 
   * @param  {String} dbname Name of the database to use
   * @param  {Object} options TODO
   * @return {CounterStore} Counter database instance
   * @example
      const db = orbitdb.counter('likes')
   */
  counter(dbname, options) {
    return this._createStore(CounterStore, dbname, options)
  }

  /**
   * Get a Document database instance
   * 
   * @param  {String} dbname Name of the database to use
   * @param  {Object} options TODO
   * @return {DocStore} Document database instance
   * @example
      const db = orbitdb.docstore('books')
   */
  docstore(dbname, options) {
    return this._createStore(DocumentStore, dbname, options)
  }

  /**
   * Disconnect from replication and shutdown OrbitDB
   */
  disconnect() {
    if (this._pubsub) this._pubsub.disconnect()
    this.events.removeAllListeners('data')
    Object.keys(this.stores).map((e) => this.stores[e]).forEach((store) => {
      store.events.removeAllListeners('data')
      store.events.removeAllListeners('write')
      store.events.removeAllListeners('close')
    })
    this.stores = {}
    this.user = null
    this.network = null
  }

  /* Private methods */
  _createStore(Store, dbname, options = { subscribe: true, cacheFile: 'orbit-db.json' }) {
    const store = new Store(this._ipfs, this.user.id, dbname, options)
    this.stores[dbname] = store
    return this._subscribe(store, dbname, options.subscribe, options)
  }

  _subscribe(store, dbname, subscribe = true, options) {
    store.events.on('data',  this._onData.bind(this))
    store.events.on('write', this._onWrite.bind(this))
    store.events.on('close', this._onClose.bind(this))

    if(subscribe && this._pubsub)
      this._pubsub.subscribe(dbname, this._onMessage.bind(this), this._onConnected.bind(this), store.options.maxHistory > 0)
    else
      store.loadHistory().catch((e) => console.error(e.stack))

    Cache.loadCache(options.cacheFile).then(() => {
      const hash = Cache.get(dbname)
      store.loadHistory(hash).catch((e) => console.error(e.stack))
    })

    return store
  }

  /* Connected to the message broker */
  _onConnected(dbname, hash) {
    // console.log(".CONNECTED", dbname, hash)
    const store = this.stores[dbname]
    store.loadHistory(hash).catch((e) => console.error(e.stack))
  }

  /* Replication request from the message broker */
  _onMessage(dbname, hash) {
    // console.log(".MESSAGE", dbname, hash)
    const store = this.stores[dbname]
    store.sync(hash)
      .then((res) => Cache.set(dbname, hash))
      .catch((e) => console.error(e.stack))
  }

  /* Data events */
  _onWrite(dbname, hash) {
    // 'New entry written to database...', after adding a new db entry locally
    // console.log(".WRITE", dbname, hash, this.user.username)
    if(!hash) throw new Error("Hash can't be null!")
    if(this._pubsub) this._pubsub.publish(dbname, hash)
    Cache.set(dbname, hash)
  }

  /**
   * A new entry was added to the database
   *
   * @event data
   * @param {String} dbname Name of the database where the new entry was added
   * @param {Object} item Entry that was added
   * @example
   * orbitdb.events.on('data', (dbname, item) => {
   *   console.log(dbname, item)
   * })
   */
  _onData(dbname, item) {
    // 'New database entry...', after a new entry was added to the database
    // console.log(".SYNCED", dbname, items.length)
    this.events.emit('data', dbname, item)
  }

  _onClose(dbname) {
    if(this._pubsub) this._pubsub.unsubscribe(dbname)
    delete this.stores[dbname]
  }
}

module.exports = OrbitDB
