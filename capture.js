// Self-contained: the browser serializes this function into the selected page.
export function inspectPage(selector = '', rules = []) {
  try {
    const meta = (key) =>
      document.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.content
    const title =
      meta('og:title') || document.querySelector('h1')?.textContent?.trim() || document.title
    const currency =
      meta('product:price:currency') ||
      document.querySelector('[itemprop="priceCurrency"]')?.getAttribute('content') ||
      ''
    const base = {
      name: title,
      url: location.href,
      currency,
      source: selector ? 'selector' : 'auto',
      selector
    }
    if (selector) {
      let elements
      try {
        elements = document.querySelectorAll(selector)
      } catch {
        throw new Error('This CSS selector is invalid.')
      }
      if (elements.length !== 1)
        throw new Error(
          `The selector matches ${elements.length} elements. Choose exactly one price.`
        )
      const e = elements[0]
      return { ...base, raw: e.getAttribute('content') || e.textContent.trim() }
    }
    for (const rule of rules) {
      if (location.hostname !== rule.host && location.hostname !== `www.${rule.host}`) continue
      try {
        if (rule.type === 'selector') {
          const nodes = document.querySelectorAll(rule.selector)
          if (nodes.length !== 1) continue
          const raw =
            (rule.attribute && nodes[0].getAttribute(rule.attribute)) ||
            nodes[0].textContent?.trim()
          if (raw) return { ...base, currency: rule.currency, raw }
          continue
        }
        const node = document.querySelector(rule.selector)
        if (!node) continue
        const product = JSON.parse(node.getAttribute(rule.attribute))
        const at = (path) => path.split('.').reduce((value, key) => value?.[key], product)
        const id = at(rule.idPath)
        const raw = at(rule.pricePath)
        if (id == null || raw == null || !['string', 'number'].includes(typeof id)) continue
        return {
          ...base,
          name: at(rule.namePath) || title,
          currency: rule.currency,
          raw,
          source: 'api',
          apiUrl: rule.apiPrefix + encodeURIComponent(String(id)),
          path: rule.apiPath
        }
      } catch {}
    }
    const products = []
    function visit(value) {
      if (Array.isArray(value)) return value.forEach(visit)
      if (!value || typeof value !== 'object') return
      if ([value['@type']].flat().includes('Product')) products.push(value)
      if (value['@graph']) visit(value['@graph'])
      if (value.mainEntity) visit(value.mainEntity)
    }
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        visit(JSON.parse(script.textContent))
      } catch {
        /* Ignore malformed metadata. */
      }
    }
    const candidates = []
    for (const p of products) {
      for (const offer of [p.offers].flat().filter(Boolean)) {
        if (offer.price != null)
          candidates.push({ raw: offer.price, currency: offer.priceCurrency || currency })
      }
    }
    const unique = [...new Map(candidates.map((c) => [JSON.stringify(c), c])).values()]
    if (unique.length === 1) return { ...base, ...unique[0] }
    if (unique.length > 1)
      throw new Error(
        'This page has multiple prices. Use “Pick a price” to choose the right variant.'
      )
    const raw = meta('product:price:amount') || meta('og:price:amount')
    if (raw != null) return { ...base, raw }
    const nodes = document.querySelectorAll('[itemprop="price"]')
    if (nodes.length === 1)
      return { ...base, raw: nodes[0].getAttribute('content') || nodes[0].textContent.trim() }
    throw new Error('No unambiguous price found. Use “Pick a price” or a custom source.')
  } catch (error) {
    return { error: error.message }
  }
}
export function pickPrice() {
  return new Promise((resolve) => {
    if (window.__stillPickerCancel) window.__stillPickerCancel()
    const host = document.createElement('div')
    host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none'
    const root = host.attachShadow({ mode: 'closed' })
    const label = document.createElement('div')
    label.textContent = 'PRICE LANTERN  ·  Click the price you want to track. Esc to cancel.'
    label.style.cssText =
      'position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:16px 24px;border-radius:14px;background:#243e34;color:white;font:14px system-ui;box-shadow:0 8px 40px #0003;'
    const box = document.createElement('div')
    box.style.cssText =
      'position:fixed;border:2px solid #46775e;border-radius:4px;background:#46775e15;box-sizing:border-box'
    root.append(label, box)
    document.documentElement.append(host)
    function move(e) {
      const r = e.target.getBoundingClientRect()
      Object.assign(box.style, {
        left: `${r.left}px`,
        top: `${r.top}px`,
        width: `${r.width}px`,
        height: `${r.height}px`
      })
    }
    function stop(value) {
      clearTimeout(timer)
      host.remove()
      document.removeEventListener('mousemove', move, true)
      document.removeEventListener('click', click, true)
      document.removeEventListener('keydown', key, true)
      delete window.__stillPickerCancel
      resolve(value)
    }
    function click(e) {
      e.preventDefault()
      e.stopImmediatePropagation()
      let node = e.target,
        parts = []
      while (node && node.nodeType === 1) {
        if (node.id && document.querySelectorAll(`#${CSS.escape(node.id)}`).length === 1) {
          parts.unshift(`#${CSS.escape(node.id)}`)
          break
        }
        const siblings = node.parentElement
          ? [...node.parentElement.children].filter((n) => n.tagName === node.tagName)
          : []
        parts.unshift(
          node.tagName.toLowerCase() +
            (siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : '')
        )
        node = node.parentElement
      }
      const raw = e.target.getAttribute('content') || e.target.textContent.trim()
      const symbol = raw.match(/€|£|\$|CHF|USD|EUR|GBP/)
      stop({
        name: document.querySelector('h1')?.textContent?.trim() || document.title,
        url: location.href,
        raw,
        source: 'selector',
        selector: parts.join(' > '),
        currency: { '€': 'EUR', '£': 'GBP', $: 'USD' }[symbol?.[0]] || symbol?.[0] || 'EUR'
      })
    }
    function key(e) {
      if (e.key === 'Escape') stop(null)
    }
    const timer = setTimeout(() => stop(null), 120000)
    window.__stillPickerCancel = () => stop(null)
    document.addEventListener('mousemove', move, true)
    document.addEventListener('click', click, true)
    document.addEventListener('keydown', key, true)
  })
}
