import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { inspectPage } from '../capture.js'

const rule = JSON.parse(await readFile(new URL('../sources.json', import.meta.url))).rules[0]
const product = {
  content: { title: 'VIRUM cabinet', wssId: '3620281', price: { minSinglePrice: '129,95' } }
}

test('catalog rule discovers API and current price on a matching product page', () => {
  globalThis.location = { hostname: 'www.jysk.de', href: 'https://www.jysk.de/product' }
  globalThis.document = {
    title: 'Cabinet',
    querySelector: (selector) =>
      selector === rule.selector ? { getAttribute: () => JSON.stringify(product) } : null
  }
  assert.deepEqual(inspectPage('', [rule]), {
    name: 'VIRUM cabinet',
    url: 'https://www.jysk.de/product',
    currency: 'EUR',
    raw: '129,95',
    source: 'api',
    selector: '',
    apiUrl: 'https://jysk.de/service/search/product-teaser-lookup?locale=de-DE&ids=3620281',
    path: '0.price.unformatted.minSingle'
  })
})

test('explicit selector takes precedence over catalog rules', () => {
  document.querySelectorAll = () => [{ getAttribute: () => null, textContent: '119,95 EUR' }]
  assert.equal(inspectPage('#price', [rule]).raw, '119,95 EUR')
})

test('shared CSS rule captures one price without overriding manual source', () => {
  location.hostname = 'shop.test'
  document.querySelectorAll = (selector) =>
    selector === '.current-price' ? [{ getAttribute: () => null, textContent: '79,95 EUR' }] : []
  const result = inspectPage('', [
    { type: 'selector', host: 'shop.test', selector: '.current-price', currency: 'EUR' }
  ])
  assert.equal(result.raw, '79,95 EUR')
  assert.equal(result.source, 'auto')
})

test('bad catalog data falls back to normal product metadata', () => {
  location.hostname = 'www.jysk.de'
  document.querySelector = () => null
  document.querySelectorAll = (selector) =>
    selector === 'script[type="application/ld+json"]'
      ? [
          {
            textContent: JSON.stringify({
              '@type': 'Product',
              offers: { price: 149, priceCurrency: 'EUR' }
            })
          }
        ]
      : []
  assert.equal(inspectPage('', [rule]).raw, 149)
})
