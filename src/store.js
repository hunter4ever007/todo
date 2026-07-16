import { log } from './logger.js'

const STORAGE_KEY = 'todo:tasks'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const tasks = raw ? JSON.parse(raw) : []
    let migrated = false
    for (const t of tasks) {
      if (t.text && !t.title) {
        t.title = t.text
        delete t.text
        migrated = true
      }
      if (t.description === undefined) t.description = ''
      if (t.date === undefined) t.date = ''
      if (t.time === undefined) t.time = ''
      if (t.reminder === undefined) t.reminder = false
      if (t.priority === undefined) t.priority = 'medium'
    }
    if (migrated) saveTasks(tasks)
    return tasks
  } catch (e) {
    log('ERROR', 'Failed to load tasks', e)
    return []
  }
}

export function addTask(data) {
  const tasks = loadTasks()
  const isStr = typeof data === 'string'
  tasks.push({
    id: generateId(),
    title: isStr ? data.trim() : data.title.trim(),
    description: isStr ? '' : (data.description || ''),
    date: isStr ? '' : (data.date || ''),
    time: isStr ? '' : (data.time || ''),
    reminder: isStr ? false : !!data.reminder,
    priority: isStr ? 'medium' : (data.priority || 'medium'),
    done: false,
    createdAt: Date.now()
  })
  saveTasks(tasks)
  log('INFO', 'Task added')
  return tasks
}

export function updateTask(id, data) {
  const tasks = loadTasks()
  const task = tasks.find(t => t.id === id)
  if (!task) return tasks
  if (data.title !== undefined) task.title = data.title.trim()
  if (data.description !== undefined) task.description = data.description
  if (data.date !== undefined) task.date = data.date
  if (data.time !== undefined) task.time = data.time
  if (data.reminder !== undefined) task.reminder = data.reminder
  if (data.priority !== undefined) task.priority = data.priority
  saveTasks(tasks)
  log('INFO', 'Task updated', id)
  return tasks
}

export function toggleTask(id) {
  const tasks = loadTasks()
  const task = tasks.find(t => t.id === id)
  if (!task) return tasks
  task.done = !task.done
  saveTasks(tasks)
  log('INFO', 'Task toggled', id, task.done)
  return tasks
}

export function deleteTask(id) {
  const tasks = loadTasks().filter(t => t.id !== id)
  saveTasks(tasks)
  log('INFO', 'Task deleted', id)
  return tasks
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (e) {
    log('ERROR', 'Failed to save tasks', e)
  }
}
