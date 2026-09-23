const catalogURL = 'https://raw.githubusercontent.com/msmece/still-price-tracker/main/sources.json'
const maxAge = 24 * 60 * 60 * 1000
const pathPattern = /^[\w-]+(?:\.[\w-]+)*$/

export function validateCatalog(data) {
  if (data?.version !== 1 || !Array.isArray(data.rules) || data.rules.length > 100)
    throw new Error('Invalid source catalog.')
  return data.rules.map((rule) => {
    const host = rule.host?.toLowerCase()
    if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host || '')) throw new Error('Invalid source host.')
    if (
      !['selector', 'json-api'].includes(rule.type) ||
      typeof rule.selector !== 'string' ||
      !rule.selector ||
      rule.selector.length > 512 ||
      !/^[A-Z]{3}$/.test(rule.currency || '')
    )
      throw new Error('Invalid source rule.')
    if (rule.type === 'selector') {
      if (rule.attribute && !/^(?:content|data-[\w-]+)$/.test(rule.attribute))
        throw new Error('Invalid price attribute.')
      return {
        type: rule.type,
        host,
        selector: rule.selector,
        currency: rule.currency,
        attribute: rule.attribute || ''
      }
    }
    if (
      !/^data-[\w-]+$/.test(rule.attribute || '') ||
      ![rule.idPath, rule.namePath, rule.pricePath, rule.apiPath].every(
        (path) => typeof path === 'string' && pathPattern.test(path) && path.length <= 160
      ) ||
      typeof rule.apiPrefix !== 'string' ||
      rule.apiPrefix.length > 1000
    )
      throw new Error('Invalid source rule.')
    const api = new URL(rule.apiPrefix)
    if (api.protocol !== 'https:' || api.hostname !== host || api.username || api.password)
      throw new Error('Source API must use HTTPS on the shop origin.')
    return {
      type: rule.type,
      host,
      selector: rule.selector,
      attribute: rule.attribute,
      idPath: rule.idPath,
      namePath: rule.namePath,
      pricePath: rule.pricePath,
      currency: rule.currency,
      apiPrefix: rule.apiPrefix,
      apiPath: rule.apiPath
    }
  })
}

export async function loadSources(
  storage = (globalThis.browser || globalThis.chrome).storage.local,
  fetcher = fetch
) {
  const { sourceCatalog } = await storage.get('sourceCatalog')
  if (sourceCatalog && Date.now() - sourceCatalog.at < maxAge) {
    try {
      return validateCatalog(sourceCatalog.data)
    } catch {}
  }
  try {
    const response = await fetcher(catalogURL, {
      credentials: 'omit',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000)
    })
    if (!response.ok) throw new Error('Source catalog unavailable.')
    const text = await response.text()
    if (text.length > 50_000) throw new Error('Source catalog too large.')
    const rules = validateCatalog(JSON.parse(text))
    await storage.set({ sourceCatalog: { at: Date.now(), data: JSON.parse(text) } })
    return rules
  } catch {
    if (sourceCatalog) {
      try {
        return validateCatalog(sourceCatalog.data)
      } catch {}
    }
    const response = await fetcher(
      (globalThis.browser || globalThis.chrome).runtime.getURL('sources.json')
    )
    return validateCatalog(await response.json())
  }
}
