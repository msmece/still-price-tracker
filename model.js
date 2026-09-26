export const DEFAULT_SETTINGS = { interval: 360, notifications: false }
export function parsePrice(raw, decimal = 'auto') {
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw < 0) throw new Error('The price must be a positive number.')
    return raw
  }
  const text = String(raw ?? '')
    .replace(/[\u00a0\u202f]/g, ' ')
    .trim()
  if (/[-−]\s*\d/.test(text)) throw new Error('A negative value is not a product price.')
  const matches = text.match(/\d[\d.,'’ ]*\d|\d/g)
  if (!matches || matches.length !== 1)
    throw new Error('Select just one price, without discounts or instalments.')
  const token = matches[0].trim()
  if (/[ '’]/.test(token) && !/^\d{1,3}(?:[ '’]\d{3})+(?:[.,]\d{1,3})?$/.test(token))
    throw new Error('Select a single price, without surrounding numbers.')
  let n = token.replace(/[ '’]/g, '')
  let separator = decimal
  if (separator === 'auto') {
    const dot = n.lastIndexOf('.'),
      comma = n.lastIndexOf(',')
    if (dot >= 0 && comma >= 0) separator = dot > comma ? '.' : ','
    else {
      const sep = dot >= 0 ? '.' : ','
      const parts = n.split(sep)
      separator = parts.length === 2 && parts[1].length <= 2 ? sep : 'none'
    }
  }
  if (separator === '.' || separator === ',') {
    n = n.replace(separator === '.' ? /,/g : /\./g, '')
    if (n.split(separator).length > 2) throw new Error('Choose the correct decimal format.')
    n = n.replace(separator, '.')
  } else {
    if (/[.,]/.test(n) && !/^\d{1,3}(?:[.,]\d{3})+$/.test(n))
      throw new Error('Could not read the number format.')
    n = n.replace(/[.,]/g, '')
  }
  const value = Number(n)
  if (!Number.isFinite(value) || value < 0 || value > 1e10)
    throw new Error('Could not read a valid price.')
  return value
}
export function webURL(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('Enter a complete HTTPS URL.')
  }
  if (url.protocol !== 'https:') throw new Error('Only HTTPS product and API URLs are supported.')
  if (url.username || url.password)
    throw new Error('Use an HTTPS URL without embedded credentials.')
  return url.href
}
export function originPattern(value) {
  const u = new URL(webURL(value))
  return `${u.protocol}//${u.hostname}/*`
}
export function readPath(data, path) {
  if (!path || !/^[\w-]+(?:\.[\w-]+)*$/.test(path))
    throw new Error('Use a dot path, such as 0.price.amount.')
  let result = data
  for (const key of path.split('.')) {
    if (
      ['__proto__', 'constructor', 'prototype'].includes(key) ||
      result == null ||
      !Object.hasOwn(Object(result), key)
    )
      throw new Error(`JSON price path not found: ${path}`)
    result = result[key]
  }
  if (!['string', 'number'].includes(typeof result))
    throw new Error('The JSON path must point to one price.')
  return result
}
export function validateWatch(input) {
  const name = String(input.name ?? '')
    .trim()
    .slice(0, 160)
  if (!name) throw new Error('Give this item a name.')
  const currency = String(input.currency || 'EUR').toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Use a three-letter currency, such as EUR.')
  const source = input.source || 'auto'
  if (!['auto', 'selector', 'api'].includes(source)) throw new Error('Choose a valid price source.')
  const selector = String(input.selector || '')
    .trim()
    .slice(0, 2000)
  const path = String(input.path || '').trim()
  if (source === 'selector' && !selector)
    throw new Error('Enter a CSS selector or pick a price on the page.')
  if (source === 'api' && (!path || !/^[\w-]+(?:\.[\w-]+)*$/.test(path)))
    throw new Error('Enter a JSON dot path, such as 0.price.amount.')
  const decimal = input.decimal || 'auto'
  if (!['auto', '.', ','].includes(decimal)) throw new Error('Choose a valid decimal format.')
  return {
    name,
    url: webURL(input.url),
    currency,
    source,
    selector,
    path,
    decimal,
    apiUrl: source === 'api' ? webURL(input.apiUrl) : '',
    target: input.target === '' || input.target == null ? null : parsePrice(input.target, '.'),
    paused: Boolean(input.paused)
  }
}
export function recordPrice(watch, price, now = Date.now()) {
  const previous = watch.history.at(-1)?.price
  const history = [...watch.history, { at: now, price: parsePrice(price) }].slice(-2000)
  const hitTarget = watch.target != null && price <= watch.target
  const wasBelow = watch.target != null && previous != null && previous <= watch.target
  return {
    watch: { ...watch, history, checkedAt: now, error: null },
    notify: hitTarget && !wasBelow
  }
}
export function lowestObserved(watch, days = 30, now = Date.now()) {
  const prices = watch.history.filter((p) => p.at >= now - days * 86400000).map((p) => p.price)
  return prices.length ? Math.min(...prices) : null
}
export function money(value, currency = 'EUR') {
  return value == null
    ? '—'
    : new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
      }).format(value)
}
