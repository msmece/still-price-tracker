const status = document.querySelector('#popup-status')
async function capture(picker) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    status.textContent = picker
      ? 'Click a price on the page. Esc cancels.'
      : 'Looking for the product price…'
    document.querySelectorAll('button').forEach((b) => (b.disabled = true))
    const response = await chrome.runtime.sendMessage({ type: 'CAPTURE', tabId: tab.id, picker })
    if (response.error) throw new Error(response.error)
    if (!response.data.cancelled) window.close()
    else status.textContent = 'Selection cancelled.'
  } catch (e) {
    status.textContent = e.message
  } finally {
    document.querySelectorAll('button').forEach((b) => (b.disabled = false))
  }
}
document.querySelector('#track').onclick = () => capture(false)
document.querySelector('#pick').onclick = () => capture(true)
document.querySelector('#dashboard').onclick = () =>
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
