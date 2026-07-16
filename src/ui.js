import { loadTasks, addTask, updateTask, toggleTask, deleteTask } from './store.js'
import { requestPermission, reschedule } from './notification.js'
import { log } from './logger.js'

let appEl
let editId = null
let notificationAsked = false

export function init(container) {
  appEl = container
  appEl.innerHTML = `
    <header>
      <div class="header-left">
        <h1>Todo</h1>
      </div>
      <div class="header-right">
        <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme">${getThemeIcon()}</button>
        <button id="new-task-btn" class="btn-primary">+ New</button>
      </div>
    </header>
    <main id="todo-list"></main>
    <div class="modal-overlay" id="task-modal">
      <div class="modal">
        <h2 id="modal-title">New Task</h2>
        <form id="task-form" novalidate>
          <div class="field">
            <label for="f-title">Title</label>
            <input id="f-title" name="title" type="text" placeholder="e.g. Buy groceries" required>
          </div>
          <div class="field">
            <label for="f-desc">Description</label>
            <textarea id="f-desc" name="description" placeholder="Optional details..." rows="2"></textarea>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="f-date">Date</label>
              <input id="f-date" name="date" type="date">
            </div>
            <div class="field">
              <label for="f-time">Time</label>
              <input id="f-time" name="time" type="time">
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="f-priority">Priority</label>
              <select id="f-priority" name="priority">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="field checkbox-field">
              <label class="checkbox-label">
                <input name="reminder" type="checkbox">
                <span>🔔 Reminder</span>
              </label>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" data-close-modal>Cancel</button>
            <button type="submit" class="btn-save">Save</button>
          </div>
        </form>
      </div>
    </div>
  `
  appEl.addEventListener('submit', onFormSubmit)
  appEl.addEventListener('click', onClick)
  renderList()
  setMinDate()
  log('INFO', 'UI initialized')
}

function getThemeIcon() {
  const theme = document.documentElement.getAttribute('data-theme')
  return theme === 'dark' ? '☀️' : '🌙'
}

export function toggleTheme() {
  const html = document.documentElement
  const current = html.getAttribute('data-theme')
  const next = current === 'dark' ? 'light' : 'dark'
  html.setAttribute('data-theme', next)
  localStorage.setItem('todo:theme', next)
  const btn = appEl?.querySelector('#theme-toggle')
  if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙'
  log('INFO', 'Theme switched to', next)
}

function setMinDate() {
  const dateInput = appEl.querySelector('input[name="date"]')
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0]
}

function onFormSubmit(e) {
  e.preventDefault()
  const form = e.target
  if (form.id !== 'task-form') return
  const data = {
    title: form.title.value,
    description: form.description.value,
    date: form.date.value,
    time: form.time.value,
    priority: form.priority.value,
    reminder: form.reminder.checked
  }
  if (editId) {
    updateTask(editId, data)
  } else {
    addTask(data)
  }
  closeModal()
  renderList()
  reschedule()
}

function onClick(e) {
  if (!notificationAsked) {
    notificationAsked = true
    requestPermission()
  }
  const toggle = e.target.closest('[data-toggle]')
  const del = e.target.closest('[data-delete]')
  const edit = e.target.closest('[data-edit]')
  const closeBtn = e.target.closest('[data-close-modal]')
  const newBtn = e.target.closest('#new-task-btn')
  const themeBtn = e.target.closest('#theme-toggle')
  const overlay = e.target.closest('.modal-overlay')

  if (toggle) { toggleTask(toggle.dataset.toggle); renderList(); reschedule() }
  if (del) { deleteTask(del.dataset.delete); renderList(); reschedule() }
  if (themeBtn) toggleTheme()
  if (edit) {
    const tasks = loadTasks()
    const task = tasks.find(t => t.id === edit.dataset.edit)
    if (task) openModal(task)
  }
  if (newBtn) openModal(null)
  if (closeBtn || (overlay && e.target === overlay)) closeModal()
}

function openModal(task) {
  editId = task ? task.id : null
  const modal = appEl.querySelector('#task-modal')
  const titleEl = appEl.querySelector('#modal-title')
  const form = appEl.querySelector('#task-form')
  titleEl.textContent = task ? 'Edit Task' : 'New Task'
  form.title.value = task ? task.title : ''
  form.description.value = task ? (task.description || '') : ''
  form.date.value = task ? (task.date || '') : ''
  form.time.value = task ? (task.time || '') : ''
  form.priority.value = task ? (task.priority || 'medium') : 'medium'
  form.reminder.checked = task ? !!task.reminder : false
  modal.classList.add('open')
  form.title.focus()
}

function closeModal() {
  appEl.querySelector('#task-modal').classList.remove('open')
  editId = null
}

function renderList() {
  const tasks = loadTasks()
  const list = appEl.querySelector('#todo-list')
  if (!list) return
  const pending = tasks.filter(t => !t.done)
  const completed = tasks.filter(t => t.done)
  if (tasks.length === 0) {
    list.innerHTML = '<p class="empty">No tasks yet. Tap + to create one.</p>'
    return
  }
  let html = ''
  if (pending.length > 0) {
    html += sectionHtml('In Progress', pending, false)
  }
  if (completed.length > 0) {
    html += sectionHtml('Completed', completed, true)
  }
  list.innerHTML = html || '<p class="empty">No tasks yet. Tap + to create one.</p>'
}

function sectionHtml(label, tasks, isDone) {
  const icon = isDone ? '✅' : '📌'
  return `<section class="task-section">
    <div class="section-header">
      <h2>${icon} ${label}</h2>
      <span class="count">${tasks.length}</span>
    </div>
    <ul>${tasks.map(t => renderItem(t)).join('')}</ul>
  </section>`
}

function renderItem(task) {
  const overdue = isOverdue(task)
  const pClass = task.priority || 'medium'
  return `<li class="task${task.done ? ' done' : ''}${overdue ? ' overdue' : ''}" data-task-id="${task.id}">
    <button class="toggle" data-toggle="${task.id}" aria-label="Toggle">${task.done ? '✓' : '○'}</button>
    <div class="task-body" data-edit="${task.id}">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        ${task.date ? `<span class="meta-date">📅 ${formatDate(task.date)}</span>` : ''}
        ${task.time ? `<span class="meta-time">⏰ ${task.time}</span>` : ''}
        <span class="priority ${pClass}">${pClass}</span>
        ${overdue ? '<span class="badge badge-danger">Overdue</span>' : ''}
        ${task.reminder ? '<span class="badge badge-reminder">🔔</span>' : ''}
      </div>
    </div>
    <button class="delete" data-delete="${task.id}" aria-label="Delete">✕</button>
  </li>`
}

function isOverdue(task) {
  if (task.done || !task.date) return false
  const now = new Date()
  const d = new Date(task.date + (task.time ? 'T' + task.time : 'T23:59:59'))
  return d < now
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function escapeHtml(str) {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}
