const queue = []
let flushing = false

function flush() {
  flushing = false
  while (queue.length) {
    const [level, ...args] = queue.shift()
    const fn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log
    fn(`[${level}]`, ...args)
  }
}

export function log(level, ...args) {
  queue.push([level, ...args])
  if (flushing) return
  flushing = true
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(flush, { timeout: 100 })
  } else {
    setTimeout(flush, 50)
  }
}
