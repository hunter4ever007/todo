(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[],t=!1;function n(){for(t=!1;e.length;){let[t,...n]=e.shift();(t===`ERROR`?console.error:t===`WARN`?console.warn:console.log)(`[${t}]`,...n)}}function r(r,...i){e.push([r,...i]),!t&&(t=!0,typeof requestIdleCallback<`u`?requestIdleCallback(n,{timeout:100}):setTimeout(n,50))}var i=`todo:tasks`;function a(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}function o(){try{let e=localStorage.getItem(i),t=e?JSON.parse(e):[],n=!1;for(let e of t)e.text&&!e.title&&(e.title=e.text,delete e.text,n=!0),e.description===void 0&&(e.description=``),e.date===void 0&&(e.date=``),e.time===void 0&&(e.time=``),e.reminder===void 0&&(e.reminder=!1),e.priority===void 0&&(e.priority=`medium`);return n&&d(t),t}catch(e){return r(`ERROR`,`Failed to load tasks`,e),[]}}function s(e){let t=o(),n=typeof e==`string`;return t.push({id:a(),title:n?e.trim():e.title.trim(),description:n?``:e.description||``,date:n?``:e.date||``,time:n?``:e.time||``,reminder:n?!1:!!e.reminder,priority:n?`medium`:e.priority||`medium`,done:!1,createdAt:Date.now()}),d(t),r(`INFO`,`Task added`),t}function c(e,t){let n=o(),i=n.find(t=>t.id===e);return i?(t.title!==void 0&&(i.title=t.title.trim()),t.description!==void 0&&(i.description=t.description),t.date!==void 0&&(i.date=t.date),t.time!==void 0&&(i.time=t.time),t.reminder!==void 0&&(i.reminder=t.reminder),t.priority!==void 0&&(i.priority=t.priority),d(n),r(`INFO`,`Task updated`,e),n):n}function l(e){let t=o(),n=t.find(t=>t.id===e);return n?(n.done=!n.done,d(t),r(`INFO`,`Task toggled`,e,n.done),t):t}function u(e){let t=o().filter(t=>t.id!==e);return d(t),r(`INFO`,`Task deleted`,e),t}function d(e){try{localStorage.setItem(i,JSON.stringify(e))}catch(e){r(`ERROR`,`Failed to save tasks`,e)}}var f=`todo:notified`;function p(){try{return JSON.parse(localStorage.getItem(f)||`[]`)}catch{return[]}}function m(e){let t=p();t.includes(e)||(t.push(e),localStorage.setItem(f,JSON.stringify(t)))}function h(){let e=document.querySelector(`base`)?.getAttribute(`href`)||`/`;return e.endsWith(`/`)?e:e+`/`}function g(){try{let e=new(window.AudioContext||window.webkitAudioContext),t=e.createOscillator(),n=e.createGain();t.connect(n),n.connect(e.destination),t.frequency.value=880,t.type=`sine`,n.gain.setValueAtTime(.3,e.currentTime),n.gain.exponentialRampToValueAtTime(.01,e.currentTime+.6),t.start(e.currentTime),t.stop(e.currentTime+.6)}catch(e){r(`WARN`,`Beep unavailable`,e)}}function _(e){g(),m(e.id);try{`Notification`in window&&Notification.permission===`granted`&&navigator.serviceWorker?.ready?.then(t=>{t.showNotification(`🔔 Todo Reminder`,{body:e.title,tag:e.id,data:{id:e.id,url:window.location.href},icon:h()+`icons/icon-192.svg`,vibrate:[200,100,200],requireInteraction:!0})}).catch(()=>{new Notification(`🔔 Todo Reminder`,{body:e.title,tag:e.id,icon:h()+`icons/icon-192.svg`})})}catch(e){r(`ERROR`,`Notification failed`,e)}r(`INFO`,`Fired reminder for`,e.id)}function v(){let e=p();return o().filter(t=>!(t.done||!t.reminder||!t.date||!t.time||e.includes(t.id)))}async function y(){try{let e=await navigator.serviceWorker.ready,t=await new Promise(t=>{let n=new MessageChannel;n.port1.onmessage=e=>t(e.data?.ids||[]),e.active?.postMessage({type:`GET_FIRED`},[n.port2]),setTimeout(()=>t([]),1e3)});for(let e of t)m(e)}catch{}}async function b(e){try{return(await navigator.serviceWorker.ready).active?.postMessage({type:`RESCHEDULE_ALL`,tasks:e}),!0}catch{return!1}}async function x(){await y();let e=v();if(e.length===0)return;let t=await b(e);if(r(`INFO`,t?`Sent ${e.length} reminders to SW`:`SW unavailable`),!t){r(`INFO`,`Falling back to page timers`);for(let t of e){let e=new Date(t.date+`T`+t.time).getTime()-Date.now();if(!(e<-6e4)){if(e<0){_(t);continue}setTimeout(()=>_(t),e)}}}}function S(){`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`&&Notification.requestPermission().then(e=>r(`INFO`,`Notification permission:`,e))}function C(){x()}function w(){if(!(`Notification`in window)){r(`WARN`,`Notifications not supported`);return}S(),x(),document.addEventListener(`visibilitychange`,()=>{document.hidden||(x(),S())}),r(`INFO`,`Notification scheduler started (SW polling)`)}var T,E=null,D=!1;function O(e){T=e,T.innerHTML=`
    <header>
      <div class="header-left">
        <h1>Todo</h1>
      </div>
      <div class="header-right">
        <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme">${k()}</button>
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
  `,T.addEventListener(`submit`,M),T.addEventListener(`click`,N),I(),j(),r(`INFO`,`UI initialized`)}function k(){return document.documentElement.getAttribute(`data-theme`)===`dark`?`☀️`:`🌙`}function A(){let e=document.documentElement,t=e.getAttribute(`data-theme`)===`dark`?`light`:`dark`;e.setAttribute(`data-theme`,t),localStorage.setItem(`todo:theme`,t);let n=T?.querySelector(`#theme-toggle`);n&&(n.textContent=t===`dark`?`☀️`:`🌙`),r(`INFO`,`Theme switched to`,t)}function j(){let e=T.querySelector(`input[name="date"]`);e&&(e.min=new Date().toISOString().split(`T`)[0])}function M(e){e.preventDefault();let t=e.target;if(t.id!==`task-form`)return;let n={title:t.title.value,description:t.description.value,date:t.date.value,time:t.time.value,priority:t.priority.value,reminder:t.reminder.checked};E?c(E,n):s(n),F(),I(),C()}function N(e){D||(D=!0,S());let t=e.target.closest(`[data-toggle]`),n=e.target.closest(`[data-delete]`),r=e.target.closest(`[data-edit]`),i=e.target.closest(`[data-close-modal]`),a=e.target.closest(`#new-task-btn`),s=e.target.closest(`#theme-toggle`),c=e.target.closest(`.modal-overlay`);if(t&&(l(t.dataset.toggle),I(),C()),n&&(u(n.dataset.delete),I(),C()),s&&A(),r){let e=o().find(e=>e.id===r.dataset.edit);e&&P(e)}a&&P(null),(i||c&&e.target===c)&&F()}function P(e){E=e?e.id:null;let t=T.querySelector(`#task-modal`),n=T.querySelector(`#modal-title`),r=T.querySelector(`#task-form`);n.textContent=e?`Edit Task`:`New Task`,r.title.value=e?e.title:``,r.description.value=e&&e.description||``,r.date.value=e&&e.date||``,r.time.value=e&&e.time||``,r.priority.value=e&&e.priority||`medium`,r.reminder.checked=e?!!e.reminder:!1,t.classList.add(`open`),r.title.focus()}function F(){T.querySelector(`#task-modal`).classList.remove(`open`),E=null}function I(){let e=o(),t=T.querySelector(`#todo-list`);if(!t)return;let n=e.filter(e=>!e.done),r=e.filter(e=>e.done);if(e.length===0){t.innerHTML=`<p class="empty">No tasks yet. Tap + to create one.</p>`;return}let i=``;n.length>0&&(i+=L(`In Progress`,n,!1)),r.length>0&&(i+=L(`Completed`,r,!0)),t.innerHTML=i||`<p class="empty">No tasks yet. Tap + to create one.</p>`}function L(e,t,n){return`<section class="task-section">
    <div class="section-header">
      <h2>${n?`✅`:`📌`} ${e}</h2>
      <span class="count">${t.length}</span>
    </div>
    <ul>${t.map(e=>R(e)).join(``)}</ul>
  </section>`}function R(e){let t=z(e),n=e.priority||`medium`;return`<li class="task${e.done?` done`:``}${t?` overdue`:``}" data-task-id="${e.id}">
    <button class="toggle" data-toggle="${e.id}" aria-label="Toggle">${e.done?`✓`:`○`}</button>
    <div class="task-body" data-edit="${e.id}">
      <div class="task-title">${V(e.title)}</div>
      <div class="task-meta">
        ${e.date?`<span class="meta-date">📅 ${B(e.date)}</span>`:``}
        ${e.time?`<span class="meta-time">⏰ ${e.time}</span>`:``}
        <span class="priority ${n}">${n}</span>
        ${t?`<span class="badge badge-danger">Overdue</span>`:``}
        ${e.reminder?`<span class="badge badge-reminder">🔔</span>`:``}
      </div>
    </div>
    <button class="delete" data-delete="${e.id}" aria-label="Delete">✕</button>
  </li>`}function z(e){if(e.done||!e.date)return!1;let t=new Date;return new Date(e.date+(e.time?`T`+e.time:`T23:59:59`))<t}function B(e){return new Date(e+`T00:00:00`).toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function V(e){let t=document.createElement(`div`);return t.appendChild(document.createTextNode(e)),t.innerHTML}var H=document.getElementById(`app`);H?(O(H),w(),r(`INFO`,`App initialized`)):r(`ERROR`,`App container not found`);