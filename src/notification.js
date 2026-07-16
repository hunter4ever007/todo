import { loadTasks } from './store.js'
import { log } from './logger.js'

const FIRED_KEY = 'todo:notified'
const CHECK_INTERVAL = 15000
let checkTimer = null

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

function getIconUrl() {
  const base = document.querySelector('base')?.getAttribute('href') || '/'
  return base + 'icons/icon-192.svg'
}

function showNotification(task) {
  if (!('Notification' in window)) return
  if (Notification.permission === 'denied') return log('WARN', 'Notification denied for task', task.id)
  if (Notification.permission === 'default') {
    requestPermission()
    return
  }
  try {
    const n = new Notification('🔔 Todo Reminder', {
      body: task.title,
      tag: task.id,
      data: { id: task.id },
      icon: getIconUrl()
    })
    n.onclick = () => {
      window.focus()
      const el = document.querySelector(`[data-task-id="${task.id}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      n.close()
    }
    log('INFO', 'Notification sent for', task.id)
  } catch (e) {
    log('ERROR', 'Notification failed', e)
  }
}

function checkReminders() {
  const tasks = loadTasks()
  const fired = getFired()
  const now = new Date()
  for (const task of tasks) {
    if (task.done || !task.reminder || !task.date || !task.time) continue
    if (fired.includes(task.id)) continue
    const taskDate = new Date(task.date + 'T' + task.time)
    const diff = now - taskDate
    if (diff >= 0 && diff < CHECK_INTERVAL + 5000) {
      showNotification(task)
      markFired(task.id)
    }
  }
}

export function requestPermission() {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission().then(result => {
      log('INFO', 'Notification permission:', result)
    })
  }
}

export function start() {
  checkReminders()
  checkTimer = setInterval(checkReminders, CHECK_INTERVAL)
  log('INFO', 'Notification watcher started')
}

export function stop() {
  if (checkTimer) { clearInterval(checkTimer); checkTimer = null }
}
