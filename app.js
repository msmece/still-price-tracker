import { money, lowestObserved, originPattern, validateWatch } from './model.js'
import { demoRequest } from './demo.js'
import { art } from './art.js'
const live = Boolean(globalThis.chrome?.runtime?.id)
const $ = (selector) => document.querySelector(selector)
const esc = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )
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
function chart(w, large = false) {
  if (!w.history.length)
    return `<p class="field-note">Your history begins with the first successful check.</p>`
  const points = w.history.slice(-60),
    values = points.map((p) => p.price),
    low = Math.min(...values),
    high = Math.max(...values),
    span = high - low || Math.max(high * 0.2, 1)
  const start = points[0].at,
    duration = points.at(-1).at - start || 1
  const coordinates = points.map((p) => [
    points.length === 1 ? 150 : 4 + ((p.at - start) / duration) * 292,
    35 - ((p.price - low) / span) * 27
  ])
  if (high === low) coordinates.forEach((p) => (p[1] = 20))
  const path = coordinates.map((p) => p.join(',')).join(' '),
    end = coordinates.at(-1)
  return `<svg class="${large ? 'detail-chart' : 'sparkline'}" viewBox="0 0 300 44" preserveAspectRatio="none" role="img" aria-label="${esc(`Observed price history, ${money(low, w.currency)} to ${money(high, w.currency)}`)}"><path class="chart-baseline" d="M0 40H300"/><polyline class="chart-line" points="${path}" vector-effect="non-scaling-stroke"/><circle class="chart-dot" cx="${end[0]}" cy="${end[1]}" r="2.3"/></svg>`
}
function render() {
  const watches = data.watches,
    drops = watches.filter(dropped),
    targets = watches.filter(reached)
  $('#nav-count').textContent = watches.length
  $('#stat-total').innerHTML = `${watches.length}<span>items</span>`
  $('#stat-drops').innerHTML = `${drops.length}<span>price drops</span>`
  $('#stat-targets').innerHTML = `${targets.length}<span>little wins</span>`
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
  $('#watch-grid').innerHTML = items
    .map((w) => {
      const current = latest(w),
        first = w.history[0]?.price
      const pct = first > 0 && dropped(w) ? Math.round(((first - current) / first) * 100) : 0
      const tag = w.error
        ? 'Needs attention'
        : w.paused
          ? 'Paused'
          : reached(w)
            ? '✓ Target reached'
            : dropped(w)
              ? '↘ Price dropped'
              : 'Keeping an eye on it'
      const generic = `<div class="generic-art" aria-hidden="true">${esc(w.name.charAt(0).toLowerCase())}</div>`
      return `<article class="card"><div class="card-visual">${art[w.illustration] || generic}<span class="tag ${w.error ? 'error' : reached(w) || dropped(w) ? 'good' : ''}">${tag}</span><button class="card-menu icon-button" data-detail="${esc(w.id)}" aria-label="Details for ${esc(w.name)}">⋯</button></div><div class="card-body"><div class="store">${esc(new URL(w.url).hostname.replace(/^www\./, ''))}</div><h2><a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">${esc(w.name)}</a></h2><div class="card-subtitle">${esc(w.error || (w.paused ? 'Automatic checks paused' : ago(w.checkedAt)))}</div><div class="price-row"><strong class="current-price">${esc(money(current, w.currency))}</strong>${dropped(w) ? `<span class="old-price">${esc(money(first, w.currency))}</span><span class="change">↘ ${pct}%</span>` : ''}</div>${chart(w)}<div class="history-note"><span>${w.history.length ? 'Observed history' : 'No observations yet'}</span><span>${w.history.length ? new Date(w.history[0].at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' — today' : ''}</span></div><div class="card-bottom"><span>Target <strong>${esc(money(w.target, w.currency))}</strong></span><button data-detail="${esc(w.id)}">Details ↗</button></div></div></article>`
    })
    .join('')
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
  return { ...validateWatch({ ...w, paused: existing?.paused }), id: w.id || undefined }
}
async function permit(w) {
  if (!live) return
  const origins = [
    ...new Set([originPattern(w.url), ...(w.source === 'api' ? [originPattern(w.apiUrl)] : [])])
  ]
  if (!(await chrome.permissions.request({ origins })))
    throw new Error('Allow access to this shop so Still can check its price.')
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
  $('#detail-content').innerHTML =
    `<div class="dialog-heading"><div><div class="eyebrow">A LITTLE PATIENCE, IN PERSPECTIVE</div><h2>${esc(w.name)}</h2></div><button class="close icon-button" aria-label="Close">×</button></div><a class="detail-link" href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">Visit ${esc(new URL(w.url).hostname)} ↗</a><div class="detail-price">${esc(money(latest(w), w.currency))}</div><p class="muted">${esc(ago(w.checkedAt))}${w.paused ? ' · Paused' : ''}</p>${w.error ? `<p class="form-status error">${esc(w.error)}</p>` : ''}${chart(w, true)}<div class="detail-stats"><div><span>Lowest observed · last 30 days</span><strong>${esc(money(lowestObserved(w), w.currency))}</strong></div><div><span>Your target</span><strong>${esc(money(w.target, w.currency))}</strong></div></div><p class="field-note">${live ? 'History starts when you add an item; this is not the retailer’s official 30-day reference price.' : 'Illustrative sample history, not verified retailer prices.'} ${w.history.length} observations stored. Charts show the latest 60.</p><div class="detail-tools"><button class="primary" data-action="check">Check now ↻</button><button class="secondary" data-action="edit">Edit</button><button class="secondary" data-action="pause">${w.paused ? 'Resume' : 'Pause'}</button></div><details><summary>Recent observations <span>⌄</span></summary><table class="history-table"><thead><tr><th>Date</th><th>Price</th></tr></thead><tbody>${w.history
      .slice(-12)
      .reverse()
      .map(
        (p) =>
          `<tr><td>${esc(new Date(p.at).toLocaleString())}</td><td>${esc(money(p.price, w.currency))}</td></tr>`
      )
      .join(
        ''
      )}</tbody></table></details><div class="dialog-actions"><button class="text-button danger" data-action="remove">Remove from watchlist</button></div>`
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
    data = await request({ type: action.dataset.action === 'pause' ? 'PAUSE' : 'CHECK', id })
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
      settings: { interval: Number(form.elements.interval.value), notifications }
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
        { version: 1, exportedAt: new Date().toISOString(), preview: !live, ...data },
        null,
        2
      )
    ],
    { type: 'application/json' }
  )
  const url = URL.createObjectURL(blob),
    a = document.createElement('a')
  a.href = url
  a.download = `still-watchlist-${new Date().toISOString().slice(0, 10)}.json`
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
