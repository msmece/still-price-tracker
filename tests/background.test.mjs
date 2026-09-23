import { test } from 'node:test'
import assert from 'node:assert/strict'
const event = () => ({
  listeners: [],
  addListener(fn) {
    this.listeners.push(fn)
  }
})
const area = () => ({
  data: {},
  async get(keys) {
    return Object.fromEntries([keys].flat().map((k) => [k, structuredClone(this.data[k])]))
  },
  async set(value) {
    Object.assign(this.data, structuredClone(value))
  },
  async remove(key) {
    delete this.data[key]
  },
  async setAccessLevel() {}
})
const local = area(),
  session = area()
let price = 219,
  failure = false
globalThis.chrome = {
  storage: { local, session },
  runtime: {
    id: 'test',
    getURL: (path) => `chrome-extension://test/${path}`,
    onMessage: event(),
    onInstalled: event(),
    onStartup: event()
  },
  permissions: {
    async contains() {
      return true
    },
    onAdded: event()
  },
  alarms: {
    async get() {
      return null
    },
    async create() {},
    onAlarm: event()
  },
  tabs: { async remove() {} }
  // notifications intentionally absent until permission is granted.
}
globalThis.fetch = async () => ({
  ok: !failure,
  status: failure ? 503 : 200,
  text: async () => JSON.stringify([{ price: { amount: price } }])
})
await import('../background.js')
const sender = { id: 'test', url: 'chrome-extension://test/index.html' }
const send = (message) =>
  new Promise((resolve) => chrome.runtime.onMessage.listeners[0](message, sender, resolve))
const watch = {
  name: 'Cabinet',
  url: 'https://shop.test/item',
  currency: 'EUR',
  target: 180,
  source: 'api',
  apiUrl: 'https://shop.test/api/item',
  path: '0.price.amount'
}

test('worker starts with no optional notifications permission', async () => {
  const response = await send({ type: 'STATE' })
  assert.deepEqual(response.data.watches, [])
  assert.equal(response.data.settings.interval, 360)
})
test('real message flow saves, records drops, preserves history on failure, and deletes', async () => {
  let response = await send({ type: 'SAVE', watch })
  assert.equal(response.error, undefined)
  const id = response.data.watches[0].id
  assert.equal(response.data.watches[0].history[0].price, 219)
  price = 179
  response = await send({ type: 'CHECK', id })
  assert.equal(response.data.watches[0].history.at(-1).price, 179)
  failure = true
  response = await send({ type: 'CHECK', id })
  assert.equal(response.data.watches[0].history.length, 2)
  assert.match(response.data.watches[0].error, /503/)
  const saved = response.data.watches[0]
  response = await send({ type: 'SAVE', watch: { ...saved, target: 150 } })
  assert.match(response.error, /503/)
  response = await send({ type: 'STATE' })
  assert.equal(response.data.watches[0].target, 180)
  failure = false
  response = await send({ type: 'SAVE', watch: { ...saved, url: 'https://shop.test/other' } })
  assert.match(response.error, /different URL/)
  response = await send({ type: 'PAUSE', id })
  assert.equal(response.data.watches[0].paused, true)
  response = await send({ type: 'DELETE', id })
  assert.equal(response.data.watches.length, 0)
})
test('concurrent saves do not overwrite one another', async () => {
  const responses = await Promise.all([
    send({ type: 'SAVE', watch: { ...watch, name: 'A' } }),
    send({ type: 'SAVE', watch: { ...watch, name: 'B' } })
  ])
  assert.ok(responses.every((r) => !r.error))
  const response = await send({ type: 'STATE' })
  assert.equal(response.data.watches.length, 2)
})
test('messages from web pages are not accepted', () => {
  assert.equal(
    chrome.runtime.onMessage.listeners[0](
      { type: 'STATE' },
      { id: 'test', url: 'https://shop.test/' },
      () => assert.fail('must not reply')
    ),
    false
  )
})
