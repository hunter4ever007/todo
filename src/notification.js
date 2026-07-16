import { loadTasks } from './store.js'
import { WORKER_URL } from './config.js'
import { log } from './logger.js'

const FIRED_KEY = 'todo:notified'
const SUB_KEY = 'todo:push-endpoint'
let pushSubscription = null

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

function showNotification(task) {
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
          body: task.title, tag: task.id,
          icon: getBase() + 'icons/icon-192.svg'
        })
      })
    }
  } catch (e) {
    log('ERROR', 'Notification failed', e)
  }
}

function getPendingTasks() {
  const fired = getFired()
  return loadTasks().filter(t => {
    if (t.done || !t.reminder || !t.date || !t.time) return false
    if (fired.includes(t.id)) return false
    return true
  })
}

// ─── API calls to CF Worker ─────────────────────────────────────────────────

async function api(path, body) {
  try {
    const opts = { headers: { 'Content-Type': 'application/json' } }
    if (body !== undefined) { opts.method = 'POST'; opts.body = JSON.stringify(body) }
    const res = await fetch(`${WORKER_URL}${path}`, opts)
    return res.ok ? res.json() : null
  } catch (e) {
    log('WARN', `API ${path} failed`, e)
    return null
  }
}

async function fetchPublicKey() {
  const data = await api('/api/init')
  if (data && data.publicKey) return data.publicKey
  return null
}

async function sendSubscribe() {
  if (!pushSubscription) return
  const sub = {
    endpoint: pushSubscription.endpoint,
    keys: pushSubscription.toJSON().keys
  }
  await api('/api/subscribe', { subscription: sub })
}

async function sendSchedule(task) {
  if (!pushSubscription) return
  await api('/api/schedule', {
    task: { id: task.id, title: task.title, date: task.date, time: task.time },
    endpoint: pushSubscription.endpoint
  })
}

async function sendCancel(id) {
  await api('/api/cancel', { id })
}

// ─── Push subscription ───────────────────────────────────────────────────────

async function subscribeToPush(reg) {
  if (!('PushManager' in window)) { log('WARN', 'Push not supported'); return null }
  if (Notification.permission === 'denied') return null

  try {
    let sub = await reg.pushManager.getSubscription()

    if (!sub) {
      const pubKeyB64 = await fetchPublicKey()
      if (!pubKeyB64) { log('WARN', 'Failed to get VAPID key from worker'); return null }

      const appKey = b642ab(pubKeyB64)
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appKey
      })
      log('INFO', 'Push subscribed')
    }

    localStorage.setItem(SUB_KEY, sub.endpoint)
    return sub
  } catch (e) {
    log('ERROR', 'Push subscribe failed', e)
    return null
  }
}

// ─── Reschedule: send all pending to worker ──────────────────────────────────

export async function reschedule() {
  if (!pushSubscription) { log('WARN', 'reschedule: no push subscription'); return }
  const pending = getPendingTasks()

  // Send all pending tasks to worker
  for (const task of pending) {
    await sendSchedule(task)
  }

  // Also send to local SW (fallback)
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'RESCHEDULE_ALL', tasks: pending })
  } catch {}

  log('INFO', `Scheduled ${pending.length} reminders via worker`)
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function requestPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') return
  if (Notification.permission === 'denied') return
  Notification.requestPermission().then(r => log('INFO', 'Notification permission:', r))
}

export async function start() {
  if (!('Notification' in window) && !('PushManager' in window)) {
    log('WARN', 'Notifications not supported'); return
  }

  requestPermission()

  try {
    const reg = await navigator.serviceWorker.ready
    pushSubscription = await subscribeToPush(reg)
    if (pushSubscription) {
      await sendSubscribe()
      await reschedule()
    }
  } catch (e) {
    log('ERROR', 'Notification init failed', e)
  }

  // Listen for SW messages (push received)
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'REMINDER_FIRED') {
      playBeep()
      for (const task of (event.data.tasks || [])) {
        markFired(task.id)
        if (document.hidden) showNotification(task)
      }
    }
  })

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) requestPermission()
  })

  log('INFO', 'Notification system started (CF Worker push)')
}

export function onTaskAdded(task) {
  if (!pushSubscription) return
  if (task.reminder && task.date && task.time) {
    sendSchedule(task)
  } else {
    sendCancel(task.id)
  }
}

export function init() { start() }

export function onTaskRemoved(id) {
  sendCancel(id)
}

export function stop() {
  try {
    navigator.serviceWorker.ready.then(reg => {
      reg.active?.postMessage({ type: 'CLEAR_ALL' })
    })
  } catch {}
}

// ─── Utility: base64url to Uint8Array ────────────────────────────────────────

function b642ab(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
