const functions = require('firebase-functions/v2')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const webpush = require('web-push')

admin.initializeApp()
const db = admin.firestore()

const vapidPrivateKey = defineSecret('VAPID_PRIVATE_KEY')

exports.checkReminders = functions.scheduler.onSchedule(
  { schedule: '* * * * *', secrets: [vapidPrivateKey] },
  async (event) => {
    const key = vapidPrivateKey.value()
    if (!key) {
      functions.logger.error('VAPID_PRIVATE_KEY secret not set')
      return
    }

    const now = admin.firestore.Timestamp.now()
    const snapshot = await db.collection('reminders')
      .where('dueAt', '<=', now)
      .where('notified', '==', false)
      .get()

    if (snapshot.empty) {
      functions.logger.log('No due reminders')
      return
    }

    const batch = db.batch()
    const subsCache = {}

    for (const doc of snapshot.docs) {
      const reminder = doc.data()
      const deviceId = reminder.deviceId

      let subscription = subsCache[deviceId]
      if (!subscription) {
        const subDoc = await db.collection('subscriptions').doc(deviceId).get()
        if (!subDoc.exists) {
          functions.logger.warn(`No subscription for device ${deviceId}`)
          continue
        }
        subscription = subDoc.data()
        subsCache[deviceId] = subscription
      }

      try {
        webpush.setVapidDetails(
          'mailto:admin@todo.app',
          subscription.vapidPublicKey || '',
          key
        )
        await webpush.sendNotification(subscription, JSON.stringify({
          title: '🔔 Todo Reminder',
          body: reminder.title,
          tag: reminder.taskId,
          data: { id: reminder.taskId }
        }))
        functions.logger.log(`Push sent for task ${reminder.taskId}`)
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          functions.logger.warn(`Subscription expired for ${deviceId}, removing`)
          db.collection('subscriptions').doc(deviceId).delete()
        } else {
          functions.logger.warn(`Push failed for ${deviceId}: ${err.message}`)
        }
      }

      batch.update(doc.ref, { notified: true })
    }

    await batch.commit()
    functions.logger.log(`Processed ${snapshot.size} reminders`)
  }
)
