import { loadTasks } from './store.js'
import { log } from './logger.js'

const FIRED_KEY = 'todo:notified'
const pageTimers = new Map()
let ready = false
let usingSW = false

function getFired() {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '[]') }
  catch { return [] }
}

function setFired(id) {
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

function notify(task) {
  playBeep()
  setFired(task.id)
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

function schedulePageTimer(task) {
  if (pageTimers.has(task.id)) clearTimeout(pageTimers.get(task.id))
  const target = new Date(task.date + 'T' + task.time).getTime()
  const delay = target - Date.now()
  if (delay < -60000) return
  if (delay < 0) { notify(task); return }
  const id = setTimeout(() => notify(task), delay)
  pageTimers.set(task.id, id)
}

function clearPageTimers() {
  for (const [, t] of pageTimers) clearTimeout(t)
  pageTimers.clear()
}

async function sendToSW(tasks) {
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'RESCHEDULE_ALL', tasks })
    return true
  } catch { return false }
}

function getPendingTasks() {
  const fired = getFired()
  return loadTasks().filter(t => {
    if (t.done || !t.reminder || !t.date || !t.time) return false
    if (fired.includes(t.id)) return false
    return true
  })
}

export async function reschedule() {
  if (!ready) return
  clearPageTimers()
  const pending = getPendingTasks()
  if (pending.length === 0) return
  const ok = await sendToSW(pending)
  usingSW = ok
  if (!ok) {
    log('INFO', 'SW unavailable, using page timers')
    for (const task of pending) schedulePageTimer(task)
  } else {
    log('INFO', `Scheduled ${pending.length} reminders via SW`)
  }
}

export function requestPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') return
  if (Notification.permission === 'denied') return
  Notification.requestPermission().then(r => log('INFO', 'Notification permission:', r))
}

export function start() {
  if (!('Notification' in window)) { log('WARN', 'Notifications not supported'); return }
  ready = true
  requestPermission()
  reschedule()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { reschedule(); requestPermission() }
  })
  log('INFO', 'Notification scheduler started')
}

export function stop() {
  clearPageTimers()
  usingSW = false
  ready = false
}
