import { money, originPattern, validateWatch } from './model.js'
import { demoRequest } from './demo.js'
import { watchCard, watchDetail } from './dashboard-view.js'
const chrome = globalThis.browser || globalThis.chrome
const live = Boolean(chrome?.runtime?.id)
const $ = (selector) => document.querySelector(selector)
let data,
  filter = 'all',
  search = '',
  selectedId,
  toastTimer
async function request(message) {
  if (!live) return demoRequest(message)
  const response = await chrome.runtime.sendMessage(message)
  if (response.error) throw new Error(response.error)
  return response.data
}
function toast(text) {
  $('#toast').textContent = text
  $('#toast').hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => ($('#toast').hidden = true), 6000)
}
function latest(w) {
  return w.history.at(-1)?.price
}
function dropped(w) {
  return w.history.length > 1 && latest(w) < w.history[0].price
}
function reached(w) {
  return latest(w) != null && w.target != null && latest(w) <= w.target
}
function ago(at) {
  if (!at) return 'Not checked yet'
  const mins = Math.max(0, Math.floor((Date.now() - at) / 60000))
  return mins < 1
    ? 'Just checked'
    : mins < 60
      ? `Checked ${mins}m ago`
      : mins < 1440
        ? `Checked ${Math.floor(mins / 60)}h ago`
        : `Checked ${Math.floor(mins / 1440)}d ago`
}
function render() {
  const watches = data.watches,
    drops = watches.filter(dropped),
    targets = watches.filter(reached)
  $('#nav-count').textContent = watches.length
  $('#stat-total').replaceChildren(
    document.createTextNode(String(watches.length)),
    Object.assign(document.createElement('span'), { textContent: 'items' })
  )
  $('#stat-drops').replaceChildren(
    document.createTextNode(String(drops.length)),
    Object.assign(document.createElement('span'), {
      textContent: 'price drops'
    })
  )
  $('#stat-targets').replaceChildren(
    document.createTextNode(String(targets.length)),
    Object.assign(document.createElement('span'), {
      textContent: 'little wins'
    })
  )
  $('#all-count').textContent = watches.length
  $('#drop-count').textContent = drops.length
  const items = watches.filter(
    (w) =>
      (filter === 'all' ||
        (filter === 'drops' && dropped(w)) ||
        (filter === 'target' && reached(w))) &&
      `${w.name} ${w.url}`.toLowerCase().includes(search)
  )
  $('#empty').hidden = items.length > 0
  $('#watch-grid').replaceChildren(
    ...items.map((watch) => watchCard(watch, { latest, dropped, reached, ago }))
  )
  const interval = Number(data.settings.interval)
  $('#schedule-label').textContent = !live
    ? 'Preview only · your real watchlist starts empty'
    : interval
      ? `Checking every ${interval === 60 ? 'hour' : interval === 1440 ? 'day' : interval / 60 + ' hours'} while your browser is running`
      : 'Automatic checks off · check prices whenever you like'
  document.querySelectorAll('[data-filter]').forEach((b) => {
    b.classList.toggle('selected', b.dataset.filter === filter)
    b.setAttribute('aria-pressed', String(b.dataset.filter === filter))
  })
}
function sources() {
  const source = $('#watch-form').elements.source.value
  $('#selector-options').hidden = source !== 'selector'
  $('#api-options').hidden = source !== 'api'
}
function editor(w = {}) {
  const form = $('#watch-form')
  form.reset()
  form.elements.id.value = ''
  for (const key of [
    'id',
    'name',
    'url',
    'target',
    'currency',
    'source',
    'selector',
    'apiUrl',
    'path',
    'decimal'
  ]) {
    if (w[key] != null && form.elements[key]) {
      if (
        key === 'currency' &&
        ![...form.elements.currency.options].some((o) => o.value === w[key])
      )
        form.elements.currency.add(new Option(w[key], w[key]))
      form.elements[key].value = w[key]
    }
  }
  form.elements.url.readOnly = Boolean(w.id)
  form.elements.currency.disabled = Boolean(w.id)
  $('#editor-title').textContent = w.id ? 'A little adjustment.' : 'Track something.'
  $('#save-watch').textContent = w.id ? 'Save changes →' : 'Start watching →'
  $('#form-status').textContent =
    w.price != null
      ? `Detected ${money(w.price, w.currency)}. Confirm the product, variant, and currency before saving.`
      : w.warning || ''
  $('#form-status').className = 'form-status'
  $('#custom-options').open = Boolean(w.source && w.source !== 'auto')
  sources()
  $('#editor').showModal()
}
function formWatch() {
  const w = Object.fromEntries(new FormData($('#watch-form')))
  w.currency = $('#watch-form').elements.currency.value
  const existing = data.watches.find((x) => x.id === w.id)
  return {
    ...validateWatch({ ...w, paused: existing?.paused }),
    id: w.id || undefined
  }
}
async function permit(w) {
  if (!live) return
  const origins = [
    ...new Set([originPattern(w.url), ...(w.source === 'api' ? [originPattern(w.apiUrl)] : [])])
  ]
  if (!(await chrome.permissions.request({ origins })))
    throw new Error('Allow access to this shop so Price Lantern can check its price.')
}
async function submit(test = false) {
  if (!$('#watch-form').reportValidity()) return
  try {
    const watch = formWatch()
    // This request stays directly in the user gesture call chain.
    const permission = permit(watch)
    $('#save-watch').disabled = true
    $('#test-source').disabled = true
    $('#form-status').className = 'form-status'
    $('#form-status').textContent = 'Reading the current price…'
    await permission
    const result = await request({ type: test ? 'TEST' : 'SAVE', watch })
    if (test)
      $('#form-status').textContent =
        `Found ${money(result.price, watch.currency)}. Is this the price and variant you expected?`
    else {
      data = result
      render()
      $('#editor').close()
      toast(
        live
          ? 'On your radar. We’ll take it from here.'
          : 'Saved in your preview. Live checks require the extension.'
      )
    }
  } catch (e) {
    $('#form-status').className = 'form-status error'
    $('#form-status').textContent = e.message
  } finally {
    $('#save-watch').disabled = false
    $('#test-source').disabled = false
  }
}
function detail(id) {
  const w = data.watches.find((w) => w.id === id)
  if (!w) return
  selectedId = id
  $('#detail-content').replaceChildren(watchDetail(w, { latest, ago, live }))
  if (!$('#detail').open) $('#detail').showModal()
}
$('#watch-form').onsubmit = (e) => {
  e.preventDefault()
  submit()
}
$('#test-source').onclick = () => submit(true)
$('#watch-form').elements.source.onchange = sources
$('#add-watch').onclick = $('#empty-add').onclick = () => editor()
$('#search').oninput = (e) => {
  search = e.target.value.toLowerCase()
  render()
}
$('#watchlist-nav').onclick = () => {
  filter = 'all'
  search = ''
  $('#search').value = ''
  render()
}
document.addEventListener('click', async (e) => {
  const close = e.target.closest('.close')
  if (close) close.closest('dialog').close()
  const f = e.target.closest('[data-filter]')
  if (f) {
    filter = f.dataset.filter
    render()
  }
  const d = e.target.closest('[data-detail]')
  if (d) detail(d.dataset.detail)
  const action = e.target.closest('[data-action]')
  if (!action) return
  const id = selectedId,
    w = data.watches.find((w) => w.id === id)
  if (action.dataset.action === 'edit') {
    $('#detail').close()
    editor(w)
    return
  }
  if (action.dataset.action === 'remove') {
    if (!confirm(`Remove “${w.name}” and its saved price history?`)) return
    data = await request({ type: 'DELETE', id })
    $('#detail').close()
    render()
    toast('Removed from your watchlist.')
    return
  }
  try {
    action.disabled = true
    data = await request({
      type: action.dataset.action === 'pause' ? 'PAUSE' : 'CHECK',
      id
    })
    render()
    detail(id)
  } catch (e) {
    toast(e.message)
  } finally {
    action.disabled = false
  }
})
$('#check-all').onclick = async () => {
  const button = $('#check-all')
  button.disabled = true
  button.classList.add('checking')
  try {
    const ids = data.watches.filter((w) => !w.paused).map((w) => w.id)
    for (const id of ids) {
      data = await request({ type: 'CHECK', id })
      render()
    }
    toast(
      data.watches.some((w) => w.error)
        ? 'Checks finished. Some items need attention.'
        : 'Your watchlist is up to date.'
    )
  } catch (e) {
    toast(e.message)
  } finally {
    button.disabled = false
    button.classList.remove('checking')
  }
}
$('#settings-nav').onclick = () => {
  const f = $('#settings-form')
  f.elements.interval.value = data.settings.interval
  f.elements.notifications.checked = data.settings.notifications
  $('#settings').showModal()
}
$('#settings-form').onsubmit = async (e) => {
  e.preventDefault()
  const form = e.target
  try {
    const notifications = form.elements.notifications.checked
    if (
      live &&
      notifications &&
      !(await chrome.permissions.request({ permissions: ['notifications'] }))
    )
      throw new Error(
        'Notifications were not allowed. You can still follow prices in your watchlist.'
      )
    data = await request({
      type: 'SETTINGS',
      settings: {
        interval: Number(form.elements.interval.value),
        notifications
      }
    })
    render()
    $('#settings').close()
    toast('Preferences saved.')
  } catch (e) {
    toast(e.message)
  }
}
$('#export').onclick = () => {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          preview: !live,
          ...data
        },
        null,
        2
      )
    ],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob),
    a = document.createElement('a')
  a.href = url
  a.download = `price-lantern-watchlist-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
$('#reset-demo').onclick = async () => {
  localStorage.removeItem('still-preview')
  data = await request({ type: 'STATE' })
  render()
  toast('Sample watchlist restored.')
}
$('#preview-banner').hidden = live
try {
  data = await request({ type: 'STATE' })
  render()
  if (live)
    chrome.storage.onChanged.addListener(async (_changes, area) => {
      if (area === 'local') {
        data = await request({ type: 'STATE' })
        render()
      }
    })
  if (location.hash === '#add') {
    const draft = await request({ type: 'DRAFT' })
    editor(draft || {})
    history.replaceState(null, '', location.pathname)
  }
} catch (e) {
  toast(e.message)
}
