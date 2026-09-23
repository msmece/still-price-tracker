import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { loadSources, validateCatalog } from '../sources.js'

const bundled = JSON.parse(await readFile(new URL('../sources.json', import.meta.url)))

test('bundled source catalog contains a valid JYSK adapter', () => {
  const [rule] = validateCatalog(bundled)
  assert.equal(rule.host, 'jysk.de')
  assert.equal(rule.apiPath, '0.price.unformatted.minSingle')
})

test('public source rules cannot point to another origin or embed credentials', () => {
  for (const apiPrefix of [
    'https://other.test/price?id=',
    'http://jysk.de/price?id=',
    'https://user:pass@jysk.de/price?id='
  ]) {
    assert.throws(() =>
      validateCatalog({ version: 1, rules: [{ ...bundled.rules[0], apiPrefix }] })
    )
  }
})

test('catalog accepts CSS price rules but rejects unsafe attributes and malformed rules', () => {
  const rule = { type: 'selector', host: 'shop.test', selector: '.current-price', currency: 'EUR' }
  assert.deepEqual(validateCatalog({ version: 1, rules: [rule] })[0], { ...rule, attribute: '' })
  assert.throws(() => validateCatalog({ version: 1, rules: [{ ...rule, attribute: 'onclick' }] }))
  assert.throws(() => validateCatalog({ version: 1, rules: [{ ...rule, type: 'script' }] }))
})

test('uses a cached public catalog and falls back to the bundled catalog offline', async () => {
  const storage = {
    data: {},
    async get() {
      return this.data
    },
    async set(value) {
      Object.assign(this.data, value)
    }
  }
  globalThis.chrome = { runtime: { getURL: (path) => `moz-extension://test/${path}` } }
  let requests = 0
  const fetcher = async (url) => {
    requests++
    if (url.startsWith('https:')) throw new Error('offline')
    return { json: async () => bundled }
  }
  assert.equal((await loadSources(storage, fetcher))[0].host, 'jysk.de')
  assert.equal(requests, 2)
  storage.data.sourceCatalog = { at: Date.now(), data: bundled }
  assert.equal((await loadSources(storage, fetcher))[0].host, 'jysk.de')
  assert.equal(requests, 2)
})

test('public catalog updates are validated and cached for the next capture', async () => {
  const shared = {
    version: 1,
    rules: [{ type: 'selector', host: 'shop.test', selector: '.price', currency: 'EUR' }]
  }
  const storage = {
    data: {},
    async get() {
      return this.data
    },
    async set(value) {
      Object.assign(this.data, value)
    }
  }
  let requests = 0
  const fetcher = async (url) => {
    assert.match(url, /^https:\/\/raw\.githubusercontent\.com\//)
    requests++
    return { ok: true, text: async () => JSON.stringify(shared) }
  }
  assert.equal((await loadSources(storage, fetcher))[0].host, 'shop.test')
  assert.equal((await loadSources(storage, fetcher))[0].host, 'shop.test')
  assert.equal(requests, 1)
})
