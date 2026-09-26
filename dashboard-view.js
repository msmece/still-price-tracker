import { money, lowestObserved, webURL } from './model.js'
import { art } from './art.js'

const svgNS = 'http://www.w3.org/2000/svg'
const element = (tag, className = '', text = null) => {
  const result = document.createElement(tag)
  if (className) result.className = className
  if (text !== null) result.textContent = String(text)
  return result
}
const append = (parent, ...children) => {
  parent.append(...children)
  return parent
}
const button = (className, label, action) => {
  const result = element('button', className, label)
  if (action) result.dataset.action = action
  return result
}
const safeURL = (url) => {
  try {
    return webURL(url)
  } catch {
    return '#'
  }
}

export function priceChart(watch, large = false) {
  if (!watch.history.length)
    return element('p', 'field-note', 'Your history begins with the first successful check.')
  const points = watch.history.slice(-60)
  const values = points.map((point) => point.price)
  const low = Math.min(...values)
  const high = Math.max(...values)
  const span = high - low || Math.max(high * 0.2, 1)
  const start = points[0].at
  const duration = points.at(-1).at - start || 1
  const coordinates = points.map((point) => [
    points.length === 1 ? 150 : 4 + ((point.at - start) / duration) * 292,
    35 - ((point.price - low) / span) * 27
  ])
  if (high === low) coordinates.forEach((point) => (point[1] = 20))
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('class', large ? 'detail-chart' : 'sparkline')
  svg.setAttribute('viewBox', '0 0 300 44')
  svg.setAttribute('preserveAspectRatio', 'none')
  svg.setAttribute('role', 'img')
  svg.setAttribute(
    'aria-label',
    `Observed price history, ${money(low, watch.currency)} to ${money(high, watch.currency)}`
  )
  const baseline = document.createElementNS(svgNS, 'path')
  baseline.setAttribute('class', 'chart-baseline')
  baseline.setAttribute('d', 'M0 40H300')
  const line = document.createElementNS(svgNS, 'polyline')
  line.setAttribute('class', 'chart-line')
  line.setAttribute('points', coordinates.map((point) => point.join(',')).join(' '))
  line.setAttribute('vector-effect', 'non-scaling-stroke')
  const dot = document.createElementNS(svgNS, 'circle')
  dot.setAttribute('class', 'chart-dot')
  dot.setAttribute('cx', String(coordinates.at(-1)[0]))
  dot.setAttribute('cy', String(coordinates.at(-1)[1]))
  dot.setAttribute('r', '2.3')
  return append(svg, baseline, line, dot)
}

export function watchCard(watch, { latest, dropped, reached, ago }) {
  const current = latest(watch)
  const first = watch.history[0]?.price
  const isDrop = dropped(watch)
  const isTarget = reached(watch)
  const percent = first > 0 && isDrop ? Math.round(((first - current) / first) * 100) : 0
  const label = watch.error
    ? 'Needs attention'
    : watch.paused
      ? 'Paused'
      : isTarget
        ? '✓ Target reached'
        : isDrop
          ? '↘ Price dropped'
          : 'Keeping an eye on it'
  const card = element('article', 'card')
  const visual = element('div', 'card-visual')
  // These illustrations are bundled constants. Product names and site data use textContent.
  if (Object.hasOwn(art, watch.illustration)) {
    visual.append(
      new DOMParser().parseFromString(art[watch.illustration], 'image/svg+xml').documentElement
    )
  } else {
    const generic = element('div', 'generic-art', watch.name.charAt(0).toLowerCase())
    generic.setAttribute('aria-hidden', 'true')
    visual.append(generic)
  }
  const tag = element(
    'span',
    `tag ${watch.error ? 'error' : isTarget || isDrop ? 'good' : ''}`,
    label
  )
  const menu = button('card-menu icon-button', '⋯')
  menu.dataset.detail = watch.id
  menu.setAttribute('aria-label', `Details for ${watch.name}`)
  append(visual, tag, menu)

  const body = element('div', 'card-body')
  const host = new URL(watch.url).hostname.replace(/^www\./, '')
  const title = element('h2')
  const link = element('a', '', watch.name)
  link.href = safeURL(watch.url)
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  title.append(link)
  const subtitle = element(
    'div',
    'card-subtitle',
    watch.error || (watch.paused ? 'Automatic checks paused' : ago(watch.checkedAt))
  )
  const prices = element('div', 'price-row')
  prices.append(element('strong', 'current-price', money(current, watch.currency)))
  if (isDrop)
    append(
      prices,
      element('span', 'old-price', money(first, watch.currency)),
      element('span', 'change', `↘ ${percent}%`)
    )
  const historyNote = element('div', 'history-note')
  const firstDate = watch.history.length
    ? `${new Date(watch.history[0].at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — today`
    : ''
  append(
    historyNote,
    element('span', '', watch.history.length ? 'Observed history' : 'No observations yet'),
    element('span', '', firstDate)
  )
  const bottom = element('div', 'card-bottom')
  const target = element('span', '', 'Target ')
  target.append(element('strong', '', money(watch.target, watch.currency)))
  const details = button('', 'Details ↗')
  details.dataset.detail = watch.id
  append(bottom, target, details)
  append(
    body,
    element('div', 'store', host),
    title,
    subtitle,
    prices,
    priceChart(watch),
    historyNote,
    bottom
  )
  return append(card, visual, body)
}

export function watchDetail(watch, { latest, ago, live }) {
  const fragment = document.createDocumentFragment()
  const heading = element('div', 'dialog-heading')
  const title = element('div')
  append(
    title,
    element('div', 'eyebrow', 'A LITTLE PATIENCE, IN PERSPECTIVE'),
    element('h2', '', watch.name)
  )
  const close = button('close icon-button', '×')
  close.setAttribute('aria-label', 'Close')
  append(heading, title, close)
  const link = element('a', 'detail-link', `Visit ${new URL(watch.url).hostname} ↗`)
  link.href = safeURL(watch.url)
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  append(
    fragment,
    heading,
    link,
    element('div', 'detail-price', money(latest(watch), watch.currency)),
    element('p', 'muted', `${ago(watch.checkedAt)}${watch.paused ? ' · Paused' : ''}`)
  )
  if (watch.error) fragment.append(element('p', 'form-status error', watch.error))
  fragment.append(priceChart(watch, true))
  const stats = element('div', 'detail-stats')
  for (const [label, value] of [
    ['Lowest observed · last 30 days', lowestObserved(watch)],
    ['Your target', watch.target]
  ])
    append(
      stats,
      append(
        element('div'),
        element('span', '', label),
        element('strong', '', money(value, watch.currency))
      )
    )
  fragment.append(stats)
  fragment.append(
    element(
      'p',
      'field-note',
      `${live ? 'History starts when you add an item; this is not the retailer’s official 30-day reference price.' : 'Illustrative sample history, not verified retailer prices.'} ${watch.history.length} observations stored. Charts show the latest 60.`
    )
  )
  const tools = element('div', 'detail-tools')
  append(
    tools,
    button('primary', 'Check now ↻', 'check'),
    button('secondary', 'Edit', 'edit'),
    button('secondary', watch.paused ? 'Resume' : 'Pause', 'pause')
  )
  fragment.append(tools)
  const history = element('details')
  append(
    history,
    append(
      element('summary'),
      document.createTextNode('Recent observations '),
      element('span', '', '⌄')
    )
  )
  const table = element('table', 'history-table')
  const header = append(element('tr'), element('th', '', 'Date'), element('th', '', 'Price'))
  table.append(append(element('thead'), header))
  const rows = element('tbody')
  for (const point of watch.history.slice(-12).reverse())
    append(
      rows,
      append(
        element('tr'),
        element('td', '', new Date(point.at).toLocaleString()),
        element('td', '', money(point.price, watch.currency))
      )
    )
  table.append(rows)
  history.append(table)
  append(
    fragment,
    history,
    append(
      element('div', 'dialog-actions'),
      button('text-button danger', 'Remove from watchlist', 'remove')
    )
  )
  return fragment
}
