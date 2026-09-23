import { DEFAULT_SETTINGS, validateWatch } from './model.js'
export function seed() {
  const now = Date.now(),
    day = 86400000
  const make = (id, name, store, currency, target, prices, illustration) => ({
    id,
    name,
    url: `https://${store}/sample-product`,
    currency,
    target,
    source: 'auto',
    selector: '',
    apiUrl: '',
    path: '',
    decimal: 'auto',
    paused: false,
    error: null,
    illustration,
    createdAt: now - 28 * day,
    checkedAt: now - 18 * 60000,
    history: prices.map((price, i) => ({ at: now - (prices.length - 1 - i) * 4 * day, price }))
  })
  return {
    settings: { ...DEFAULT_SETTINGS },
    watches: [
      make(
        'demo-lamp',
        'The little reading lamp',
        'design-store.example',
        'EUR',
        120,
        [169, 169, 159, 159, 149, 139, 129, 129],
        'lamp'
      ),
      make(
        'demo-headphones',
        'A little less outside noise',
        'audio-store.example',
        'EUR',
        250,
        [329, 329, 319, 299, 299, 279, 249, 249],
        'headphones'
      ),
      make(
        'demo-cabinet',
        'VIRUM glass cabinet',
        'jysk.de',
        'EUR',
        180,
        [219, 219, 219, 219, 219, 219, 219, 219],
        'cabinet'
      )
    ]
  }
}
export function demoRequest(message) {
  let data
  try {
    data = JSON.parse(localStorage.getItem('still-preview'))
  } catch {
    /* reset invalid preview */
  }
  data ||= seed()
  if (message.type === 'STATE') return data
  if (message.type === 'DRAFT') return null
  if (['TEST', 'CHECK', 'CHECK_ALL'].includes(message.type))
    throw new Error(
      'Live price checks run in the extension. This preview never invents a new price.'
    )
  if (message.type === 'SAVE') {
    const config = validateWatch(message.watch),
      existing = data.watches.find((w) => w.id === message.watch.id)
    if (existing && (existing.url !== config.url || existing.currency !== config.currency))
      throw new Error('Add a new item for a different URL or currency.')
    const watch = {
      ...existing,
      ...config,
      id: existing?.id || crypto.randomUUID(),
      createdAt: existing?.createdAt || Date.now(),
      history: existing?.history || [],
      error: existing ? existing.error : 'Preview item — install the extension for live checks.'
    }
    data.watches = existing
      ? data.watches.map((w) => (w.id === watch.id ? watch : w))
      : [...data.watches, watch]
  }
  if (message.type === 'DELETE') data.watches = data.watches.filter((w) => w.id !== message.id)
  if (message.type === 'PAUSE')
    data.watches = data.watches.map((w) => (w.id === message.id ? { ...w, paused: !w.paused } : w))
  if (message.type === 'SETTINGS') data.settings = message.settings
  localStorage.setItem('still-preview', JSON.stringify(data))
  return data
}
