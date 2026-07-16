import { loadTasks } from './store.js'
import { log } from './logger.js'

const FIRED_KEY = 'todo:notified'

function getFired() {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '[]') }
  catch { return [] }
}

function markFired(id) {
  const ids = getFired()
  if (!ids.includes(id)) {
    ids.push(id)
    localStorage.setItem(FIRED_KEY, JSON.stringify(ids))
  }
}

function getBase() {
  const base = document.querySelector('base')?.getAttribute('href') || '/'
  return base.endsWith('/') ? base : base + '/'
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
  } catch (e) {
    log('WARN', 'Beep unavailable', e)
  }
}

function notifyPage(task) {
  playBeep()
  markFired(task.id)
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker?.ready?.then(reg => {
        reg.showNotification('🔔 Todo Reminder', {
          body: task.title,
          tag: task.id,
          data: { id: task.id, url: window.location.href },
          icon: getBase() + 'icons/icon-192.svg',
          vibrate: [200, 100, 200],
          requireInteraction: true
        })
      }).catch(() => {
        new Notification('🔔 Todo Reminder', {
          body: task.title,
          tag: task.id,
          icon: getBase() + 'icons/icon-192.svg'
        })
      })
    }
  } catch (e) {
    log('ERROR', 'Notification failed', e)
  }
  log('INFO', 'Fired reminder for', task.id)
}

function getPendingTasks() {
  const fired = getFired()
  return loadTasks().filter(t => {
    if (t.done || !t.reminder || !t.date || !t.time) return false
    if (fired.includes(t.id)) return false
    return true
  })
}

async function syncFiredFromSW() {
  try {
    const reg = await navigator.serviceWorker.ready
    const ids = await new Promise((resolve) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (e) => resolve(e.data?.ids || [])
      reg.active?.postMessage({ type: 'GET_FIRED' }, [channel.port2])
      setTimeout(() => resolve([]), 1000)
    })
    for (const id of ids) markFired(id)
  } catch {}
}

async function sendToSW(tasks) {
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'RESCHEDULE_ALL', tasks })
    return true
  } catch { return false }
}

async function refresh() {
  await syncFiredFromSW()
  const pending = getPendingTasks()
  if (pending.length === 0) return
  const ok = await sendToSW(pending)
  log('INFO', ok ? `Sent ${pending.length} reminders to SW` : 'SW unavailable')
  if (!ok) {
    log('INFO', 'Falling back to page timers')
    for (const task of pending) {
      const target = new Date(task.date + 'T' + task.time).getTime()
      const delay = target - Date.now()
      if (delay < -60000) continue
      if (delay < 0) { notifyPage(task); continue }
      setTimeout(() => notifyPage(task), delay)
    }
  }
}

export function requestPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') return
  if (Notification.permission === 'denied') return
  Notification.requestPermission().then(r => log('INFO', 'Notification permission:', r))
}

export function reschedule() {
  refresh()
}

export function start() {
  if (!('Notification' in window)) { log('WARN', 'Notifications not supported'); return }
  requestPermission()
  refresh()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { refresh(); requestPermission() }
  })
  log('INFO', 'Notification scheduler started (SW polling)')
}

export function stop() {
  try {
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({ type: 'CLEAR_ALL' })
    })
  } catch {}
}
