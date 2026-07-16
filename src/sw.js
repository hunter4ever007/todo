import { precacheAndRoute } from 'workbox-precaching'
import { WORKER_URL } from './config.js'

precacheAndRoute(self.__WB_MANIFEST)

// ─── Push event: receives notification from CF Worker ────────────────────────

self.addEventListener('push', (event) => {
  event.waitUntil(handlePush(event))
})

async function handlePush() {
  const reg = self.registration
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return

  const tasks = await fetchDueTasks(sub.endpoint)
  for (const task of tasks) {
    reg.showNotification('🔔 Todo Reminder', {
      body: task.title,
      tag: task.id,
      data: { id: task.id, url: reg.scope },
      icon: (reg.scope || '/') + 'icons/icon-192.svg',
      vibrate: [200, 100, 200],
      requireInteraction: true
    })
  }

  const clients = await self.clients.matchAll({ type: 'window' })
  for (const client of clients) {
    client.postMessage({ type: 'REMINDER_FIRED', tasks })
  }
}

async function fetchDueTasks(endpoint) {
  try {
    const res = await fetch(`${WORKER_URL}/api/due`, {
      headers: { 'x-push-endpoint': endpoint }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.tasks || []
  } catch {
    return []
  }
}

// ─── Local fallback: IndexedDB polling (if worker is unreachable) ────────────

const DB_NAME = 'todo-schedules'
const STORE_NAME = 'tasks'
const FIRED_CACHE = 'todo-fired'
let db = null
let pollTimer = null

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return }
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    req.onsuccess = () => { db = req.result; resolve(db) }
    req.onerror = () => reject(req.error)
  })
}

async function getAllTasks() {
  const d = await openDB()
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE_NAME, 'readonly')
    const req = t.objectStore(STORE_NAME).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error)
  })
}

async function putAllTasks(tasks) {
  const d = await openDB()
  const t = d.transaction(STORE_NAME, 'readwrite')
  const store = t.objectStore(STORE_NAME)
  store.clear()
  for (const task of tasks) store.put(task)
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve()
    t.onerror = () => reject(t.error)
  })
}

async function deleteTask(id) {
  const d = await openDB()
  const t = d.transaction(STORE_NAME, 'readwrite')
  t.objectStore(STORE_NAME).delete(id)
}

async function markFired(id) {
  try {
    const cache = await caches.open(FIRED_CACHE)
    await cache.put(String(id), new Response('1'))
  } catch {}
}

async function getFiredIds() {
  try {
    const cache = await caches.open(FIRED_CACHE)
    const keys = await cache.keys()
    return keys.map(k => {
      const parts = k.url.split('/')
      return decodeURIComponent(parts[parts.length - 1])
    })
  } catch { return [] }
}

function showReminder(task) {
  const scope = self.registration.scope || '/'
  self.registration.showNotification('🔔 Todo Reminder', {
    body: task.title,
    tag: task.id,
    data: { id: task.id, url: scope },
    icon: scope + 'icons/icon-192.svg',
    vibrate: [200, 100, 200],
    requireInteraction: true
  })
}

async function checkAndNotify() {
  try {
    const tasks = await getAllTasks()
    const now = Date.now()
    for (const task of tasks) {
      const target = new Date(task.date + 'T' + task.time).getTime()
      if (target <= now + 1000) {
        await markFired(task.id)
        showReminder(task)
        await deleteTask(task.id)
      }
    }
    const remaining = await getAllTasks()
    if (remaining.length > 0) startPolling()
  } catch (e) {
    console.error('[SW] checkAndNotify error:', e)
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(checkAndNotify, 10000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

self.addEventListener('message', (event) => {
  if (!event.data) return
  const data = event.data

  if (data.type === 'RESCHEDULE_ALL') {
    putAllTasks(data.tasks || []).then(() => {
      checkAndNotify()
      startPolling()
    })
  }

  if (data.type === 'GET_FIRED') {
    getFiredIds().then(ids => {
      event.ports[0]?.postMessage({ type: 'FIRED_LIST', ids })
    })
  }

  if (data.type === 'CLEAR_ALL') {
    stopPolling()
    putAllTasks([])
  }
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'todo-check') {
    event.waitUntil(checkAndNotify())
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
  checkAndNotify()
  getAllTasks().then(tasks => { if (tasks.length > 0) startPolling() })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || self.registration.scope || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
