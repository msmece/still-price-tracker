import { test } from 'node:test'
import assert from 'node:assert/strict'

const event = () => ({
  listeners: [],
  addListener(listener) {
    this.listeners.push(listener)
  }
})
const storage = () => ({
  data: {},
  async get(keys) {
    return Object.fromEntries([keys].flat().map((key) => [key, this.data[key]]))
  },
  async set(data) {
    Object.assign(this.data, data)
  },
  async remove(key) {
    delete this.data[key]
  }
})

globalThis.browser = {
  storage: { local: storage(), session: storage() },
  runtime: {
    id: 'firefox-test',
    getURL: (path) => `moz-extension://firefox-test/${path}`,
    onMessage: event(),
    onInstalled: event(),
    onStartup: event()
  },
  permissions: { onAdded: event() },
  alarms: {
    async get() {
      return null
    },
    async create() {},
    onAlarm: event()
  },
  tabs: { async remove() {} }
}

await import('../background.js')

test('Firefox event page starts using browser APIs without setAccessLevel', async () => {
  const response = await new Promise((resolve) =>
    browser.runtime.onMessage.listeners[0](
      { type: 'STATE' },
      { id: browser.runtime.id, url: browser.runtime.getURL('index.html') },
      resolve
    )
  )
  assert.equal(response.error, undefined)
  assert.deepEqual(response.data.watches, [])
})
