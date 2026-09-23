import {
  DEFAULT_SETTINGS,
  validateWatch,
  originPattern,
  parsePrice,
  readPath,
  recordPrice,
  money,
  webURL
} from './model.js'
import { inspectPage, pickPrice } from './capture.js'
import { loadSources } from './sources.js'
const chrome = globalThis.browser || globalThis.chrome
let writes = Promise.resolve(),
  checks = Promise.resolve()
const state = async () => {
  const data = await chrome.storage.local.get(['watches', 'settings'])
  return { watches: data.watches || [], settings: { ...DEFAULT_SETTINGS, ...data.settings } }
}
function mutate(fn) {
  const task = writes.then(async () => {
    const data = await state()
    await fn(data)
    await chrome.storage.local.set(data)
    return data
  })
  writes = task.catch(() => {})
  return task
}
function serialCheck(fn) {
  const task = checks.then(fn)
  checks = task.catch(() => {})
  return task
}
async function ensurePermission(url) {
  if (!(await chrome.permissions.contains({ origins: [originPattern(url)] })))
    throw new Error('Site access is missing. Edit this item and save to allow access.')
}
async function readPrice(watch) {
  if (watch.source === 'api') {
    await ensurePermission(watch.apiUrl)
    const response = await fetch(watch.apiUrl, {
      credentials: 'omit',
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(18000),
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) throw new Error(`The price API returned HTTP ${response.status}.`)
    const text = await response.text()
    if (text.length > 2_000_000)
      throw new Error('The API response is too large. Use a product-specific endpoint.')
    return parsePrice(readPath(JSON.parse(text), watch.path), watch.decimal)
  }
  await ensurePermission(watch.url)
  let tab
  try {
    tab = await chrome.tabs.create({ url: watch.url, active: false })
    await chrome.storage.session.set({ checkingTab: tab.id })
    let loaded = false
    for (let i = 0; i < 32; i++) {
      await new Promise((r) => setTimeout(r, 500))
      const current = await chrome.tabs.get(tab.id)
      if (current.status === 'complete') {
        loaded = true
        break
      }
    }
    if (!loaded) throw new Error('The page took too long to load. Try again later.')
    let lastError
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((r) => setTimeout(r, 1000))
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: inspectPage,
          args: [watch.source === 'selector' ? watch.selector : '', watch.source === 'auto' ? await loadSources() : []]
        })
        if (!result?.result) throw new Error('The page could not be read.')
        if (result.result.error) throw new Error(result.result.error)
        if (result.result.currency && result.result.currency !== watch.currency)
          throw new Error(
            'The page currency changed. Edit this item before recording another price.'
          )
        return parsePrice(result.result.raw, watch.decimal)
      } catch (e) {
        lastError = e
      }
    }
    throw lastError
  } finally {
    if (tab) await chrome.tabs.remove(tab.id).catch(() => {})
    await chrome.storage.session.remove('checkingTab')
  }
}
async function check(id) {
  const initial = (await state()).watches.find((w) => w.id === id)
  if (!initial) throw new Error('This item no longer exists.')
  let price, failure
  try {
    price = await readPrice(initial)
  } catch (e) {
    failure = e.message
  }
  let notice
  const data = await mutate((data) => {
    const index = data.watches.findIndex((w) => w.id === id && w.revision === initial.revision)
    if (index < 0) return
    const current = data.watches[index]
    if (failure) data.watches[index] = { ...current, error: failure, checkedAt: Date.now() }
    else {
      const result = recordPrice(current, price)
      data.watches[index] = result.watch
      if (result.notify && data.settings.notifications) notice = result.watch
    }
  })
  if (notice && (await chrome.permissions.contains({ permissions: ['notifications'] }))) {
    await chrome.notifications
      .create(`still:${notice.id}`, {
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'A little patience paid off.',
        message: `${notice.name} is now ${money(price, notice.currency)}. Your target was ${money(notice.target, notice.currency)}.`
      })
      .catch(() => {})
  }
  return data
}
async function capture(tabId, picker) {
  const tab = await chrome.tabs.get(tabId)
  webURL(tab.url)
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: picker ? pickPrice : inspectPage,
    ...(!picker && { args: ['', await loadSources()] })
  })
  if (!result?.result) return { cancelled: true }
  const draft = result.result
  if (draft.error) throw new Error(draft.error)
  try {
    draft.price = parsePrice(draft.raw)
  } catch (error) {
    draft.warning = error.message
  }
  draft.currency ||= 'EUR'
  await chrome.storage.session.set({ draft })
  await chrome.tabs.create({ url: chrome.runtime.getURL('index.html#add') })
  return { ok: true }
}
async function handle(message) {
  await ready
  switch (message.type) {
    case 'STATE':
      return state()
    case 'DRAFT': {
      const { draft } = await chrome.storage.session.get('draft')
      await chrome.storage.session.remove('draft')
      return draft || null
    }
    case 'CAPTURE':
      return capture(message.tabId, message.picker)
    case 'TEST': {
      const watch = validateWatch(message.watch)
      return { price: await serialCheck(() => readPrice(watch)) }
    }
    case 'SAVE': {
      const config = validateWatch(message.watch)
      const existing = (await state()).watches.find((w) => w.id === message.watch.id)
      if (existing && (config.url !== existing.url || config.currency !== existing.currency))
        throw new Error(
          'Add a new item to track a different URL or currency; this preserves the old history.'
        )
      const price = await serialCheck(() => readPrice(config))
      return mutate((data) => {
        const latest = data.watches.find((w) => w.id === message.watch.id)
        if (message.watch.id && !latest) throw new Error('This item was removed.')
        if (!latest && data.watches.length >= 50)
          throw new Error('This lightweight version supports up to 50 items.')
        const watch = recordPrice(
          {
            ...latest,
            ...config,
            id: latest?.id || crypto.randomUUID(),
            revision: crypto.randomUUID(),
            createdAt: latest?.createdAt || Date.now(),
            history: latest?.history || []
          },
          price
        ).watch
        data.watches = latest
          ? data.watches.map((w) => (w.id === watch.id ? watch : w))
          : [...data.watches, watch]
      })
    }
    case 'DELETE':
      return mutate((data) => {
        data.watches = data.watches.filter((w) => w.id !== message.id)
      })
    case 'PAUSE':
      return mutate((data) => {
        data.watches = data.watches.map((w) =>
          w.id === message.id ? { ...w, paused: !w.paused, revision: crypto.randomUUID() } : w
        )
      })
    case 'CHECK':
      return serialCheck(() => check(message.id))
    case 'SETTINGS':
      return mutate((data) => {
        const interval = Number(message.settings.interval)
        if (![0, 60, 360, 720, 1440].includes(interval))
          throw new Error('Choose a supported check interval.')
        data.settings = { interval, notifications: Boolean(message.settings.notifications) }
      })
    default:
      throw new Error('Unknown request.')
  }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL('')))
    return false
  handle(message).then(
    (data) => respond({ data }),
    (error) => respond({ error: error.message || 'Something went wrong.' })
  )
  return true
})
async function setup() {
  if (chrome.storage.local.setAccessLevel)
    await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
  if (!(await chrome.alarms.get('still-check')))
    await chrome.alarms.create('still-check', { periodInMinutes: 1 })
  // Recover a temporary tab if a worker was interrupted mid-check.
  const { checkingTab } = await chrome.storage.session.get('checkingTab')
  if (checkingTab != null) {
    await chrome.tabs.remove(checkingTab).catch(() => {})
    await chrome.storage.session.remove('checkingTab')
  }
}
const ready = setup()
chrome.runtime.onInstalled.addListener(() => ready)
chrome.runtime.onStartup.addListener(() => ready)
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'still-check') return
  await ready
  await serialCheck(async () => {
    const data = await state()
    if (!data.settings.interval) return
    const due = data.watches
      .filter((w) => !w.paused && Date.now() - (w.checkedAt || 0) >= data.settings.interval * 60000)
      .sort((a, b) => (a.checkedAt || 0) - (b.checkedAt || 0))
    if (due[0]) await check(due[0].id)
  })
})
let notificationsBound = false
function bindNotifications() {
  if (!chrome.notifications || notificationsBound) return
  notificationsBound = true
  chrome.notifications.onClicked.addListener(async (id) => {
    const watch = (await state()).watches.find((w) => `still:${w.id}` === id)
    if (watch) await chrome.tabs.create({ url: watch.url })
  })
}
bindNotifications()
chrome.permissions.onAdded.addListener(bindNotifications)
