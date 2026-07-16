import { init } from './ui.js'
import * as notifications from './notification.js'
import { log } from './logger.js'

const app = document.getElementById('app')
if (!app) {
  log('ERROR', 'App container not found')
} else {
  init(app)
  notifications.start()
  log('INFO', 'App initialized')
}
