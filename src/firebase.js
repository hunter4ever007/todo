import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { log } from './logger.js'

const DEVICE_KEY = 'todo:deviceId'
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

let db = null
let app = null

export function initFirebase(firebaseConfig) {
  if (app) return
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  log('INFO', 'Firebase initialized')
}

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

export async function ensurePushSubscription() {
  if (!VAPID_PUBLIC_KEY) {
    log('WARN', 'VAPID_PUBLIC_KEY not set — push notifications disabled')
    return null
  }
  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
    }
    const deviceId = getDeviceId()
    await setDoc(doc(db, 'subscriptions', deviceId), {
      endpoint: sub.endpoint,
      keys: sub.toJSON().keys,
      vapidPublicKey: VAPID_PUBLIC_KEY,
      email: 'admin@todo.app',
      updatedAt: new Date().toISOString()
    })
    log('INFO', 'Push subscription saved')
    return deviceId
  } catch (e) {
    log('WARN', 'Push subscription failed', e)
    return null
  }
}

export async function saveReminder(deviceId, task) {
  if (!db || !deviceId || !task.id || !task.reminder || !task.date || !task.time) return
  try {
    const docId = deviceId + '_' + task.id
    const dueAt = new Date(task.date + 'T' + task.time)
    await setDoc(doc(db, 'reminders', docId), {
      taskId: task.id,
      deviceId,
      title: task.title,
      dueAt,
      notified: false,
      createdAt: new Date().toISOString()
    })
    log('INFO', 'Reminder saved to Firestore', docId)
  } catch (e) {
    log('WARN', 'Failed to save reminder', e)
  }
}

export async function removeReminder(taskId) {
  const deviceId = getDeviceId()
  const docId = deviceId + '_' + taskId
  try {
    await deleteDoc(doc(db, 'reminders', docId))
    log('INFO', 'Reminder removed from Firestore', docId)
  } catch (e) {
    log('WARN', 'Failed to remove reminder', e)
  }
}

export async function removeAllReminders() {
  // Best-effort: the Cloud Function will clean up stale reminders
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i)
  }
  return output
}
