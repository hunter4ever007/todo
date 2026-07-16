(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[],t=!1;function n(){for(t=!1;e.length;){let[t,...n]=e.shift();(t===`ERROR`?console.error:t===`WARN`?console.warn:console.log)(`[${t}]`,...n)}}function r(r,...i){e.push([r,...i]),!t&&(t=!0,typeof requestIdleCallback<`u`?requestIdleCallback(n,{timeout:100}):setTimeout(n,50))}var i=`todo:tasks`;function a(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}function o(){try{let e=localStorage.getItem(i),t=e?JSON.parse(e):[],n=!1;for(let e of t)e.text&&!e.title&&(e.title=e.text,delete e.text,n=!0),e.description===void 0&&(e.description=``),e.date===void 0&&(e.date=``),e.time===void 0&&(e.time=``),e.reminder===void 0&&(e.reminder=!1),e.priority===void 0&&(e.priority=`medium`);return n&&d(t),t}catch(e){return r(`ERROR`,`Failed to load tasks`,e),[]}}function s(e){let t=o(),n=typeof e==`string`;return t.push({id:a(),title:n?e.trim():e.title.trim(),description:n?``:e.description||``,date:n?``:e.date||``,time:n?``:e.time||``,reminder:n?!1:!!e.reminder,priority:n?`medium`:e.priority||`medium`,done:!1,createdAt:Date.now()}),d(t),r(`INFO`,`Task added`),t}function c(e,t){let n=o(),i=n.find(t=>t.id===e);return i?(t.title!==void 0&&(i.title=t.title.trim()),t.description!==void 0&&(i.description=t.description),t.date!==void 0&&(i.date=t.date),t.time!==void 0&&(i.time=t.time),t.reminder!==void 0&&(i.reminder=t.reminder),t.priority!==void 0&&(i.priority=t.priority),d(n),r(`INFO`,`Task updated`,e),n):n}function l(e){let t=o(),n=t.find(t=>t.id===e);return n?(n.done=!n.done,d(t),r(`INFO`,`Task toggled`,e,n.done),t):t}function u(e){let t=o().filter(t=>t.id!==e);return d(t),r(`INFO`,`Task deleted`,e),t}function d(e){try{localStorage.setItem(i,JSON.stringify(e))}catch(e){r(`ERROR`,`Failed to save tasks`,e)}}var f=`https://todo-push.to-do-app.workers.dev`,p=`todo:notified`,m=`todo:push-endpoint`,h=null;function g(){try{return JSON.parse(localStorage.getItem(p)||`[]`)}catch{return[]}}function _(e){let t=g();t.includes(e)||(t.push(e),localStorage.setItem(p,JSON.stringify(t)))}function v(){let e=document.querySelector(`base`)?.getAttribute(`href`)||`/`;return e.endsWith(`/`)?e:e+`/`}function y(){try{let e=new(window.AudioContext||window.webkitAudioContext),t=e.createOscillator(),n=e.createGain();t.connect(n),n.connect(e.destination),t.frequency.value=880,t.type=`sine`,n.gain.setValueAtTime(.3,e.currentTime),n.gain.exponentialRampToValueAtTime(.01,e.currentTime+.6),t.start(e.currentTime),t.stop(e.currentTime+.6)}catch(e){r(`WARN`,`Beep unavailable`,e)}}function b(e){try{`Notification`in window&&Notification.permission===`granted`&&navigator.serviceWorker?.ready?.then(t=>{t.showNotification(`🔔 Todo Reminder`,{body:e.title,tag:e.id,data:{id:e.id,url:window.location.href},icon:v()+`icons/icon-192.svg`,vibrate:[200,100,200],requireInteraction:!0})}).catch(()=>{new Notification(`🔔 Todo Reminder`,{body:e.title,tag:e.id,icon:v()+`icons/icon-192.svg`})})}catch(e){r(`ERROR`,`Notification failed`,e)}}function x(){let e=g();return o().filter(t=>!(t.done||!t.reminder||!t.date||!t.time||e.includes(t.id)))}async function S(e,t){try{let n={headers:{"Content-Type":`application/json`}};t!==void 0&&(n.method=`POST`,n.body=JSON.stringify(t));let r=await fetch(`${f}${e}`,n);return r.ok?r.json():null}catch(t){return r(`WARN`,`API ${e} failed`,t),null}}async function C(){let e=await S(`/api/init`);return e&&e.publicKey?e.publicKey:null}async function w(){h&&await S(`/api/subscribe`,{subscription:{endpoint:h.endpoint,keys:h.toJSON().keys}})}async function T(e){h&&await S(`/api/schedule`,{task:{id:e.id,title:e.title,date:e.date,time:e.time},endpoint:h.endpoint})}async function E(e){await S(`/api/cancel`,{id:e})}async function D(e){if(!(`PushManager`in window))return r(`WARN`,`Push not supported`),null;if(Notification.permission===`denied`)return null;try{let t=await e.pushManager.getSubscription();if(!t){let n=await C();if(!n)return r(`WARN`,`Failed to get VAPID key from worker`),null;let i=P(n);t=await e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:i}),r(`INFO`,`Push subscribed`)}return localStorage.setItem(m,t.endpoint),t}catch(e){return r(`ERROR`,`Push subscribe failed`,e),null}}async function O(){if(!h){r(`WARN`,`reschedule: no push subscription`);return}let e=x();for(let t of e)await T(t);try{(await navigator.serviceWorker.ready).active?.postMessage({type:`RESCHEDULE_ALL`,tasks:e})}catch{}r(`INFO`,`Scheduled ${e.length} reminders via worker`)}function k(){`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`&&Notification.requestPermission().then(e=>r(`INFO`,`Notification permission:`,e))}async function A(){if(!(`Notification`in window)&&!(`PushManager`in window)){r(`WARN`,`Notifications not supported`);return}k();try{h=await D(await navigator.serviceWorker.ready),h&&(await w(),await O())}catch(e){r(`ERROR`,`Notification init failed`,e)}navigator.serviceWorker.addEventListener(`message`,e=>{if(e.data?.type===`REMINDER_FIRED`){y();for(let t of e.data.tasks||[])_(t.id),document.hidden&&b(t)}}),document.addEventListener(`visibilitychange`,()=>{document.hidden||k()}),r(`INFO`,`Notification system started (CF Worker push)`)}function j(e){h&&(e.reminder&&e.date&&e.time?T(e):E(e.id))}function M(){A()}function N(e){E(e)}function P(e){for(e=e.replace(/-/g,`+`).replace(/_/g,`/`);e.length%4;)e+=`=`;let t=atob(e),n=new Uint8Array(t.length);for(let e=0;e<t.length;e++)n[e]=t.charCodeAt(e);return n}var F,I=null,L=!1;function R(e){F=e,F.innerHTML=`
    <header>
      <div class="header-left">
        <h1>Todo</h1>
      </div>
      <div class="header-right">
        <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme">${z()}</button>
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
  `,F.addEventListener(`submit`,H),F.addEventListener(`click`,U),K(),V(),r(`INFO`,`UI initialized`)}function z(){return document.documentElement.getAttribute(`data-theme`)===`dark`?`☀️`:`🌙`}function B(){let e=document.documentElement,t=e.getAttribute(`data-theme`)===`dark`?`light`:`dark`;e.setAttribute(`data-theme`,t),localStorage.setItem(`todo:theme`,t);let n=F?.querySelector(`#theme-toggle`);n&&(n.textContent=t===`dark`?`☀️`:`🌙`),r(`INFO`,`Theme switched to`,t)}function V(){let e=F.querySelector(`input[name="date"]`);e&&(e.min=new Date().toISOString().split(`T`)[0])}function H(e){e.preventDefault();let t=e.target;if(t.id!==`task-form`)return;let n={title:t.title.value,description:t.description.value,date:t.date.value,time:t.time.value,priority:t.priority.value,reminder:t.reminder.checked};if(I){c(I,n),N(I);let e=o().find(e=>e.id===I);e&&j(e)}else{let e=s(n),t=e[e.length-1];t&&j(t)}G(),K(),O()}function U(e){L||(L=!0,k());let t=e.target.closest(`[data-toggle]`),n=e.target.closest(`[data-delete]`),r=e.target.closest(`[data-edit]`),i=e.target.closest(`[data-close-modal]`),a=e.target.closest(`#new-task-btn`),s=e.target.closest(`#theme-toggle`),c=e.target.closest(`.modal-overlay`);if(t&&(l(t.dataset.toggle),K(),O()),n&&(u(n.dataset.delete),K(),O(),N(n.dataset.delete)),s&&B(),r){let e=o().find(e=>e.id===r.dataset.edit);e&&W(e)}a&&W(null),(i||c&&e.target===c)&&G()}function W(e){I=e?e.id:null;let t=F.querySelector(`#task-modal`),n=F.querySelector(`#modal-title`),r=F.querySelector(`#task-form`);n.textContent=e?`Edit Task`:`New Task`,r.title.value=e?e.title:``,r.description.value=e&&e.description||``,r.date.value=e&&e.date||``,r.time.value=e&&e.time||``,r.priority.value=e&&e.priority||`medium`,r.reminder.checked=e?!!e.reminder:!1,t.classList.add(`open`),r.title.focus()}function G(){F.querySelector(`#task-modal`).classList.remove(`open`),I=null}function K(){let e=o(),t=F.querySelector(`#todo-list`);if(!t)return;let n=e.filter(e=>!e.done),r=e.filter(e=>e.done);if(e.length===0){t.innerHTML=`<p class="empty">No tasks yet. Tap + to create one.</p>`;return}let i=``;n.length>0&&(i+=q(`In Progress`,n,!1)),r.length>0&&(i+=q(`Completed`,r,!0)),t.innerHTML=i||`<p class="empty">No tasks yet. Tap + to create one.</p>`}function q(e,t,n){return`<section class="task-section">
    <div class="section-header">
      <h2>${n?`✅`:`📌`} ${e}</h2>
      <span class="count">${t.length}</span>
    </div>
    <ul>${t.map(e=>J(e)).join(``)}</ul>
  </section>`}function J(e){let t=Y(e),n=e.priority||`medium`;return`<li class="task${e.done?` done`:``}${t?` overdue`:``}" data-task-id="${e.id}">
    <button class="toggle" data-toggle="${e.id}" aria-label="Toggle">${e.done?`✓`:`○`}</button>
    <div class="task-body" data-edit="${e.id}">
      <div class="task-title">${Z(e.title)}</div>
      <div class="task-meta">
        ${e.date?`<span class="meta-date">📅 ${X(e.date)}</span>`:``}
        ${e.time?`<span class="meta-time">⏰ ${e.time}</span>`:``}
        <span class="priority ${n}">${n}</span>
        ${t?`<span class="badge badge-danger">Overdue</span>`:``}
        ${e.reminder?`<span class="badge badge-reminder">🔔</span>`:``}
      </div>
    </div>
    <button class="delete" data-delete="${e.id}" aria-label="Delete">✕</button>
  </li>`}function Y(e){if(e.done||!e.date)return!1;let t=new Date;return new Date(e.date+(e.time?`T`+e.time:`T23:59:59`))<t}function X(e){return new Date(e+`T00:00:00`).toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function Z(e){let t=document.createElement(`div`);return t.appendChild(document.createTextNode(e)),t.innerHTML}var Q={apiKey:`AIzaSyBFZ-yNuw04xTgeRbHCjBSNYLY9buY7JmM`,authDomain:`todo-app-c2bea.firebaseapp.com`,projectId:`todo-app-c2bea`,storageBucket:`todo-app-c2bea.firebasestorage.app`,messagingSenderId:`986306404787`,appId:`1:986306404787:web:6215ae0936d0dd7aa86bc6`},$=document.getElementById(`app`);$?(R($),M(Q),r(`INFO`,`App initialized`)):r(`ERROR`,`App container not found`);