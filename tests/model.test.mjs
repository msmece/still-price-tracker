import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parsePrice,
  webURL,
  readPath,
  validateWatch,
  recordPrice,
  lowestObserved,
  originPattern
} from '../model.js'

test('localized prices and grouping without confusing current price and discounts', () => {
  for (const [raw, expected] of [
    ['1.299,95 €', 1299.95],
    ['$1,299.95', 1299.95],
    ['1 299,95 EUR', 1299.95],
    ['CHF 1’299.95', 1299.95],
    ['€ 219', 219],
    ['1,299', 1299],
    ['0,00 €', 0],
    [219, 219]
  ])
    assert.equal(parsePrice(raw), expected, raw)
  for (const raw of [
    '€129.00 was €159.00',
    '350,00 € (-50%)',
    'No price',
    'NaN',
    -1,
    Infinity,
    '99.99 129.99'
  ])
    assert.throws(() => parsePrice(raw), undefined, String(raw))
  assert.equal(parsePrice('1.299', '.'), 1.299)
})
test('only credential-free HTTPS URLs, preserving product variants', () => {
  assert.equal(
    webURL('https://shop.test/item?size=90#price'),
    'https://shop.test/item?size=90#price'
  )
  assert.equal(originPattern('https://shop.test:8443/item'), 'https://shop.test/*')
  for (const url of [
    'javascript:alert(1)',
    'file:///etc/passwd',
    'https://user:password@shop.test',
    'http://shop.test/item',
    'data:text/html,test',
    'not a url'
  ])
    assert.throws(() => webURL(url))
})
test('safe JSON dot paths support arrays and reject absent or object results', () => {
  assert.equal(readPath([{ price: { amount: 219 } }], '0.price.amount'), 219)
  for (const p of ['0.price', '0.missing', '0.__proto__', 'constructor', '0.price[0]', ''])
    assert.throws(() => readPath([{ price: { amount: 219 } }], p))
})
test('watch validation enforces source requirements and treats zero target as real', () => {
  const base = { name: 'Cabinet', url: 'https://shop.test/product', target: '0', currency: 'eur' }
  assert.equal(validateWatch(base).target, 0)
  assert.equal(validateWatch({ ...base, target: '' }).target, null)
  assert.throws(() => validateWatch({ ...base, source: 'selector' }))
  assert.throws(() => validateWatch({ ...base, source: 'api', apiUrl: 'https://shop.test/api' }))
  assert.throws(() => validateWatch({ ...base, currency: 'EURO' }))
  assert.throws(() => validateWatch({ ...base, source: 'api', apiUrl: 'http://shop.test/api', path: '0.price' }))
  assert.equal(
    validateWatch({ ...base, source: 'api', apiUrl: 'https://shop.test/api', path: '0.price' })
      .path,
    '0.price'
  )
})
test('notify on crossing target, never repeatedly below it', () => {
  let w = { history: [], target: 100 }
  let r = recordPrice(w, 120, 1)
  assert.equal(r.notify, false)
  r = recordPrice(r.watch, 100, 2)
  assert.equal(r.notify, true)
  r = recordPrice(r.watch, 90, 3)
  assert.equal(r.notify, false)
  r = recordPrice(r.watch, 110, 4)
  assert.equal(r.notify, false)
  r = recordPrice(r.watch, 95, 5)
  assert.equal(r.notify, true)
})
test('30-day observed minimum excludes older prices and never invents missing history', () => {
  const now = 40 * 86400000
  assert.equal(lowestObserved({ history: [] }, 30, now), null)
  assert.equal(
    lowestObserved(
      {
        history: [
          { at: 1, price: 40 },
          { at: now - 86400000, price: 219 }
        ]
      },
      30,
      now
    ),
    219
  )
  const w = { history: Array.from({ length: 2000 }, (_, i) => ({ at: i, price: 1 })), target: null }
  assert.equal(recordPrice(w, 2, 2001).watch.history.length, 2000)
})
