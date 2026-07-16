import { loadTasks } from './store.js'
import { log } from './logger.js'

const FIRED_KEY = 'todo:notified'
const timers = new Map()
let ready = false

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

function fireNow(task) {
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
          data: { id: task.id },
          icon: getBase() + 'icons/icon-192.svg'
        })
      })
    }
  } catch (e) {
    log('ERROR', 'Notification failed', e)
  }
  log('INFO', 'Fired reminder for', task.id)
}

function scheduleTask(task) {
  if (task.done || !task.reminder || !task.date || !task.time) return
  const fired = getFired()
  if (fired.includes(task.id)) return
  const target = new Date(task.date + 'T' + task.time)
  const now = Date.now()
  const delay = target.getTime() - now
  if (delay < -2000) {
    if (Math.abs(delay) < 3600000) {
      fireNow(task)
    }
    return
  }
  if (timers.has(task.id)) clearTimeout(timers.get(task.id))
  const id = setTimeout(() => fireNow(task), Math.max(delay, 0))
  timers.set(task.id, id)
}

function scheduleAll() {
  for (const [id, t] of timers) { clearTimeout(t) }
  timers.clear()
  const tasks = loadTasks()
  for (const task of tasks) {
    scheduleTask(task)
  }
}

export function requestPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission === 'granted') return
  if (Notification.permission === 'denied') return
  Notification.requestPermission().then(r => log('INFO', 'Notification permission:', r))
}

export function reschedule() {
  if (ready) scheduleAll()
}

export function start() {
  if (!('Notification' in window)) { log('WARN', 'Notifications not supported'); return }
  ready = true
  requestPermission()
  scheduleAll()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { scheduleAll(); requestPermission() }
  })
  log('INFO', 'Notification scheduler started')
}

export function stop() {
  for (const [id, t] of timers) { clearTimeout(t) }
  timers.clear()
  ready = false
}
