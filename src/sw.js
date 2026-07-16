import { precacheAndRoute } from 'workbox-precaching'

precacheAndRoute(self.__WB_MANIFEST)

const CACHE_NAME = 'todo-notified'
const timers = new Map()

async function isFired(id) {
  try {
    const cache = await caches.open(CACHE_NAME)
    return (await cache.match(String(id))) !== undefined
  } catch { return false }
}

async function setFired(id) {
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(String(id), new Response('1'))
  } catch {}
}

function getBase() {
  try {
    return self.registration.scope || '/'
  } catch { return '/' }
}

function showReminder(task) {
  self.registration.showNotification('🔔 Todo Reminder', {
    body: task.title,
    tag: task.id,
    data: { id: task.id, url: getBase() },
    icon: getBase() + 'icons/icon-192.svg',
    vibrate: [200, 100, 200],
    requireInteraction: true
  })
}

function scheduleTask(task) {
  if (!task.reminder || !task.date || !task.time) return
  if (timers.has(task.id)) {
    clearTimeout(timers.get(task.id))
    timers.delete(task.id)
  }
  const target = new Date(task.date + 'T' + task.time).getTime()
  const now = Date.now()
  const delay = target - now
  if (delay < -60000) return
  if (delay < 0) {
    showReminder(task)
    setFired(task.id)
    return
  }
  const timer = setTimeout(async () => {
    if (await isFired(task.id)) return
    await setFired(task.id)
    showReminder(task)
    timers.delete(task.id)
  }, delay)
  timers.set(task.id, timer)
}

function cancelTask(id) {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
}

self.addEventListener('message', (event) => {
  if (!event.data) return
  const data = event.data
  if (data.type === 'SCHEDULE_REMINDER') {
    scheduleTask(data.task)
  }
  if (data.type === 'CANCEL_REMINDER') {
    cancelTask(data.id)
  }
  if (data.type === 'RESCHEDULE_ALL') {
    for (const [, t] of timers) clearTimeout(t)
    timers.clear()
    if (data.tasks) {
      for (const task of data.tasks) scheduleTask(task)
    }
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || getBase()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
