(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[],t=!1;function n(){for(t=!1;e.length;){let[t,...n]=e.shift();(t===`ERROR`?console.error:t===`WARN`?console.warn:console.log)(`[${t}]`,...n)}}function r(r,...i){e.push([r,...i]),!t&&(t=!0,typeof requestIdleCallback<`u`?requestIdleCallback(n,{timeout:100}):setTimeout(n,50))}var i=`todo:tasks`;function a(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}function o(){try{let e=localStorage.getItem(i),t=e?JSON.parse(e):[],n=!1;for(let e of t)e.text&&!e.title&&(e.title=e.text,delete e.text,n=!0),e.description===void 0&&(e.description=``),e.date===void 0&&(e.date=``),e.time===void 0&&(e.time=``),e.reminder===void 0&&(e.reminder=!1),e.priority===void 0&&(e.priority=`medium`);return n&&d(t),t}catch(e){return r(`ERROR`,`Failed to load tasks`,e),[]}}function s(e){let t=o(),n=typeof e==`string`;return t.push({id:a(),title:n?e.trim():e.title.trim(),description:n?``:e.description||``,date:n?``:e.date||``,time:n?``:e.time||``,reminder:n?!1:!!e.reminder,priority:n?`medium`:e.priority||`medium`,done:!1,createdAt:Date.now()}),d(t),r(`INFO`,`Task added`),t}function c(e,t){let n=o(),i=n.find(t=>t.id===e);return i?(t.title!==void 0&&(i.title=t.title.trim()),t.description!==void 0&&(i.description=t.description),t.date!==void 0&&(i.date=t.date),t.time!==void 0&&(i.time=t.time),t.reminder!==void 0&&(i.reminder=t.reminder),t.priority!==void 0&&(i.priority=t.priority),d(n),r(`INFO`,`Task updated`,e),n):n}function l(e){let t=o(),n=t.find(t=>t.id===e);return n?(n.done=!n.done,d(t),r(`INFO`,`Task toggled`,e,n.done),t):t}function u(e){let t=o().filter(t=>t.id!==e);return d(t),r(`INFO`,`Task deleted`,e),t}function d(e){try{localStorage.setItem(i,JSON.stringify(e))}catch(e){r(`ERROR`,`Failed to save tasks`,e)}}var f,p=null;function m(e){f=e,f.innerHTML=`
    <header>
      <div class="header-left">
        <h1>Todo</h1>
      </div>
      <div class="header-right">
        <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme">${h()}</button>
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
            <input id="f-title" name="title" placeholder="e.g. Buy groceries" required>
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
  `,f.addEventListener(`submit`,v),f.addEventListener(`click`,y),S(),_(),r(`INFO`,`UI initialized`)}function h(){return document.documentElement.getAttribute(`data-theme`)===`dark`?`☀️`:`🌙`}function g(){let e=document.documentElement,t=e.getAttribute(`data-theme`)===`dark`?`light`:`dark`;e.setAttribute(`data-theme`,t),localStorage.setItem(`todo:theme`,t);let n=f?.querySelector(`#theme-toggle`);n&&(n.textContent=t===`dark`?`☀️`:`🌙`),r(`INFO`,`Theme switched to`,t)}function _(){let e=f.querySelector(`input[name="date"]`);e&&(e.min=new Date().toISOString().split(`T`)[0])}function v(e){e.preventDefault();let t=e.target;if(t.id!==`task-form`)return;let n={title:t.title.value,description:t.description.value,date:t.date.value,time:t.time.value,priority:t.priority.value,reminder:t.reminder.checked};p?c(p,n):s(n),x(),S()}function y(e){let t=e.target.closest(`[data-toggle]`),n=e.target.closest(`[data-delete]`),r=e.target.closest(`[data-edit]`),i=e.target.closest(`[data-close-modal]`),a=e.target.closest(`#new-task-btn`),s=e.target.closest(`#theme-toggle`),c=e.target.closest(`.modal-overlay`);if(t&&(l(t.dataset.toggle),S()),n&&(u(n.dataset.delete),S()),s&&g(),r){let e=o().find(e=>e.id===r.dataset.edit);e&&b(e)}a&&b(null),(i||c&&e.target===c)&&x()}function b(e){p=e?e.id:null;let t=f.querySelector(`#task-modal`),n=f.querySelector(`#modal-title`),r=f.querySelector(`#task-form`);n.textContent=e?`Edit Task`:`New Task`,r.title.value=e?e.title:``,r.description.value=e&&e.description||``,r.date.value=e&&e.date||``,r.time.value=e&&e.time||``,r.priority.value=e&&e.priority||`medium`,r.reminder.checked=e?!!e.reminder:!1,t.classList.add(`open`),r.title.focus()}function x(){f.querySelector(`#task-modal`).classList.remove(`open`),p=null}function S(){let e=o(),t=f.querySelector(`#todo-list`);if(!t)return;let n=e.filter(e=>!e.done),r=e.filter(e=>e.done);if(e.length===0){t.innerHTML=`<p class="empty">No tasks yet. Tap + to create one.</p>`;return}let i=``;n.length>0&&(i+=C(`In Progress`,n,!1)),r.length>0&&(i+=C(`Completed`,r,!0)),t.innerHTML=i||`<p class="empty">No tasks yet. Tap + to create one.</p>`}function C(e,t,n){return`<section class="task-section">
    <div class="section-header">
      <h2>${n?`✅`:`📌`} ${e}</h2>
      <span class="count">${t.length}</span>
    </div>
    <ul>${t.map(e=>w(e)).join(``)}</ul>
  </section>`}function w(e){let t=T(e),n=e.priority||`medium`;return`<li class="task${e.done?` done`:``}${t?` overdue`:``}" data-task-id="${e.id}">
    <button class="toggle" data-toggle="${e.id}" aria-label="Toggle">${e.done?`✓`:`○`}</button>
    <div class="task-body" data-edit="${e.id}">
      <div class="task-title">${D(e.title)}</div>
      <div class="task-meta">
        ${e.date?`<span class="meta-date">📅 ${E(e.date)}</span>`:``}
        ${e.time?`<span class="meta-time">⏰ ${e.time}</span>`:``}
        <span class="priority ${n}">${n}</span>
        ${t?`<span class="badge badge-danger">Overdue</span>`:``}
        ${e.reminder?`<span class="badge badge-reminder">🔔</span>`:``}
      </div>
    </div>
    <button class="delete" data-delete="${e.id}" aria-label="Delete">✕</button>
  </li>`}function T(e){if(e.done||!e.date)return!1;let t=new Date;return new Date(e.date+(e.time?`T`+e.time:`T23:59:59`))<t}function E(e){return new Date(e+`T00:00:00`).toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function D(e){let t=document.createElement(`div`);return t.appendChild(document.createTextNode(e)),t.innerHTML}var O=`todo:notified`,k=3e4;function A(){try{return JSON.parse(localStorage.getItem(O)||`[]`)}catch{return[]}}function j(e){let t=A();t.includes(e)||(t.push(e),localStorage.setItem(O,JSON.stringify(t)))}function M(e){if(!(`Notification`in window)||Notification.permission!==`granted`)return;let t=new Notification(`Todo Reminder`,{body:e.title,tag:e.id,data:{id:e.id},icon:`/icons/icon-192.svg`});t.onclick=()=>{window.focus();let n=document.querySelector(`[data-task-id="${e.id}"]`);n&&n.scrollIntoView({behavior:`smooth`,block:`center`}),t.close()}}function N(){let e=o(),t=A(),n=new Date;for(let r of e){if(r.done||!r.reminder||!r.date||!r.time||t.includes(r.id))continue;let e=n-new Date(r.date+`T`+r.time);e>=0&&e<35e3&&(M(r),j(r.id))}}function P(){`Notification`in window&&Notification.permission==="default"&&Notification.requestPermission()}function F(){P(),N(),setInterval(N,k),r(`INFO`,`Notification watcher started`)}var I=document.getElementById(`app`);I?(m(I),F(),r(`INFO`,`App initialized`)):r(`ERROR`,`App container not found`);