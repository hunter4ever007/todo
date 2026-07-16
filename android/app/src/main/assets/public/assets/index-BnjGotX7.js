const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/esm-PZEjDvfv.js","assets/dist-Do0m8ifp.js"])))=>i.map(i=>d[i]);
(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=[],t=!1;function n(){for(t=!1;e.length;){let[t,...n]=e.shift();(t===`ERROR`?console.error:t===`WARN`?console.warn:console.log)(`[${t}]`,...n)}}function r(r,...i){e.push([r,...i]),!t&&(t=!0,typeof requestIdleCallback<`u`?requestIdleCallback(n,{timeout:100}):setTimeout(n,50))}var i=`todo:tasks`;function a(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}function o(){try{let e=localStorage.getItem(i),t=e?JSON.parse(e):[],n=!1;for(let e of t)e.text&&!e.title&&(e.title=e.text,delete e.text,n=!0),e.description===void 0&&(e.description=``),e.date===void 0&&(e.date=``),e.time===void 0&&(e.time=``),e.reminder===void 0&&(e.reminder=!1),e.priority===void 0&&(e.priority=`medium`);return n&&d(t),t}catch(e){return r(`ERROR`,`Failed to load tasks`,e),[]}}function s(e){let t=o(),n=typeof e==`string`;return t.push({id:a(),title:n?e.trim():e.title.trim(),description:n?``:e.description||``,date:n?``:e.date||``,time:n?``:e.time||``,reminder:n?!1:!!e.reminder,priority:n?`medium`:e.priority||`medium`,done:!1,createdAt:Date.now()}),d(t),r(`INFO`,`Task added`),t}function c(e,t){let n=o(),i=n.find(t=>t.id===e);return i?(t.title!==void 0&&(i.title=t.title.trim()),t.description!==void 0&&(i.description=t.description),t.date!==void 0&&(i.date=t.date),t.time!==void 0&&(i.time=t.time),t.reminder!==void 0&&(i.reminder=t.reminder),t.priority!==void 0&&(i.priority=t.priority),d(n),r(`INFO`,`Task updated`,e),n):n}function l(e){let t=o(),n=t.find(t=>t.id===e);return n?(n.done=!n.done,d(t),r(`INFO`,`Task toggled`,e,n.done),t):t}function u(e){let t=o().filter(t=>t.id!==e);return d(t),r(`INFO`,`Task deleted`,e),t}function d(e){try{localStorage.setItem(i,JSON.stringify(e))}catch(e){r(`ERROR`,`Failed to save tasks`,e)}}var f=`modulepreload`,p=function(e){return`/todo/`+e},m={},h=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,new URL(`../../../src/node/plugins/importAnalysisBuild.ts`,import.meta.url)).href}r=o(t.map(t=>{if(t=p(t,n),t=s(t),t in m)return;m[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:f,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},g=`todo:notified`;function _(){try{return JSON.parse(localStorage.getItem(g)||`[]`)}catch{return[]}}function v(e){let t=_();t.includes(e)||(t.push(e),localStorage.setItem(g,JSON.stringify(t)))}function y(){let e=document.querySelector(`base`)?.getAttribute(`href`)||`/`;return e.endsWith(`/`)?e:e+`/`}function b(e,t,n){if(!(!(`Notification`in window)||Notification.permission!==`granted`))try{navigator.serviceWorker?.ready?.then(r=>{r.showNotification(e,{body:t,tag:n,icon:y()+`icons/icon-192.svg`,vibrate:[200,100,200],requireInteraction:!0,data:{id:n,url:window.location.href}})}).catch(()=>{new Notification(e,{body:t,tag:n,icon:y()+`icons/icon-192.svg`})})}catch{}}function x(){let e=_();return o().filter(t=>!(t.done||!t.reminder||!t.date||!t.time||e.includes(t.id)))}function S(e){let t=0;for(let n=0;n<e.length;n++)t=(t<<5)-t+e.charCodeAt(n),t|=0;return Math.abs(t)%2147483647}async function C(){try{let{LocalNotifications:e}=await h(async()=>{let{LocalNotifications:e}=await import(`./esm-PZEjDvfv.js`);return{LocalNotifications:e}},__vite__mapDeps([0,1])),t=x(),n=await e.getPending();for(let r of n.notifications)t.some(e=>S(e.id)===r.id)||await e.cancel({notifications:[{id:r.id}]});let i=[];for(let e of t){let t=new Date(e.date+`T`+e.time);t.getTime()<=Date.now()||i.push({title:`🔔 Todo Reminder`,body:e.title,id:S(e.id),schedule:{at:t},sound:``,vibrate:!0,smallIcon:`ic_stat_icon_config`,iconColor:`#6366f1`,channelId:`todo-reminders`,actionTypeId:``,extra:{taskId:e.id}})}i.length>0&&(await e.schedule({notifications:i}),r(`INFO`,`Scheduled ${i.length} notifications via Capacitor`))}catch(e){return r(`WARN`,`Capacitor LocalNotifications unavailable`,e),!1}return!0}async function w(){try{let e=x();return(await navigator.serviceWorker.ready).active?.postMessage({type:`RESCHEDULE_ALL`,tasks:e}),r(`INFO`,`Sent ${e.length} reminders to SW`),!0}catch(e){return r(`WARN`,`SW unavailable`,e),!1}}function T(){`Notification`in window&&Notification.permission!==`granted`&&Notification.permission!==`denied`&&Notification.requestPermission().then(e=>r(`INFO`,`Notification permission:`,e))}async function E(){if(typeof Capacitor<`u`&&Capacitor.isNativePlatform()){if(!await C())for(let e of x())new Date(e.date+`T`+e.time).getTime()-Date.now()<0&&(b(`🔔 Todo Reminder`,e.title,e.id),v(e.id))}else await w()}async function D(e){if(typeof Capacitor<`u`&&Capacitor.isNativePlatform())try{let{LocalNotifications:t}=await h(async()=>{let{LocalNotifications:e}=await import(`./esm-PZEjDvfv.js`);return{LocalNotifications:e}},__vite__mapDeps([0,1]));await t.cancel({notifications:[{id:S(e)}]})}catch{}}async function O(){try{let{LocalNotifications:e}=await h(async()=>{let{LocalNotifications:e}=await import(`./esm-PZEjDvfv.js`);return{LocalNotifications:e}},__vite__mapDeps([0,1]));await e.createChannel({id:`todo-reminders`,name:`Todo Reminders`,description:`Task reminder notifications`,importance:5,visibility:1,sound:``,vibration:!0})}catch{}}async function k(){if(!(`Notification`in window)){r(`WARN`,`Notifications not supported`);return}typeof Capacitor<`u`&&Capacitor.isNativePlatform()&&await O(),T(),E(),document.addEventListener(`visibilitychange`,()=>{document.hidden||(T(),E())}),r(`INFO`,`Notification system started`)}var A,j=null,M=!1;function N(e){A=e,A.innerHTML=`
    <header>
      <div class="header-left">
        <h1>Todo</h1>
      </div>
      <div class="header-right">
        <button id="theme-toggle" class="btn-icon" aria-label="Toggle theme">${P()}</button>
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
  `,A.addEventListener(`submit`,L),A.addEventListener(`click`,R),V(),I(),r(`INFO`,`UI initialized`)}function P(){return document.documentElement.getAttribute(`data-theme`)===`dark`?`☀️`:`🌙`}function F(){let e=document.documentElement,t=e.getAttribute(`data-theme`)===`dark`?`light`:`dark`;e.setAttribute(`data-theme`,t),localStorage.setItem(`todo:theme`,t);let n=A?.querySelector(`#theme-toggle`);n&&(n.textContent=t===`dark`?`☀️`:`🌙`),r(`INFO`,`Theme switched to`,t)}function I(){let e=A.querySelector(`input[name="date"]`);e&&(e.min=new Date().toISOString().split(`T`)[0])}function L(e){e.preventDefault();let t=e.target;if(t.id!==`task-form`)return;let n={title:t.title.value,description:t.description.value,date:t.date.value,time:t.time.value,priority:t.priority.value,reminder:t.reminder.checked};j?(c(j,n),D(j)):s(n),B(),V(),E()}function R(e){M||(M=!0,T());let t=e.target.closest(`[data-toggle]`),n=e.target.closest(`[data-delete]`),r=e.target.closest(`[data-edit]`),i=e.target.closest(`[data-close-modal]`),a=e.target.closest(`#new-task-btn`),s=e.target.closest(`#theme-toggle`),c=e.target.closest(`.modal-overlay`);if(t&&(l(t.dataset.toggle),V(),E()),n&&(u(n.dataset.delete),V(),E(),D(n.dataset.delete)),s&&F(),r){let e=o().find(e=>e.id===r.dataset.edit);e&&z(e)}a&&z(null),(i||c&&e.target===c)&&B()}function z(e){j=e?e.id:null;let t=A.querySelector(`#task-modal`),n=A.querySelector(`#modal-title`),r=A.querySelector(`#task-form`);n.textContent=e?`Edit Task`:`New Task`,r.title.value=e?e.title:``,r.description.value=e&&e.description||``,r.date.value=e&&e.date||``,r.time.value=e&&e.time||``,r.priority.value=e&&e.priority||`medium`,r.reminder.checked=e?!!e.reminder:!1,t.classList.add(`open`),r.title.focus()}function B(){A.querySelector(`#task-modal`).classList.remove(`open`),j=null}function V(){let e=o(),t=A.querySelector(`#todo-list`);if(!t)return;let n=e.filter(e=>!e.done),r=e.filter(e=>e.done);if(e.length===0){t.innerHTML=`<p class="empty">No tasks yet. Tap + to create one.</p>`;return}let i=``;n.length>0&&(i+=H(`In Progress`,n,!1)),r.length>0&&(i+=H(`Completed`,r,!0)),t.innerHTML=i||`<p class="empty">No tasks yet. Tap + to create one.</p>`}function H(e,t,n){return`<section class="task-section">
    <div class="section-header">
      <h2>${n?`✅`:`📌`} ${e}</h2>
      <span class="count">${t.length}</span>
    </div>
    <ul>${t.map(e=>U(e)).join(``)}</ul>
  </section>`}function U(e){let t=W(e),n=e.priority||`medium`;return`<li class="task${e.done?` done`:``}${t?` overdue`:``}" data-task-id="${e.id}">
    <button class="toggle" data-toggle="${e.id}" aria-label="Toggle">${e.done?`✓`:`○`}</button>
    <div class="task-body" data-edit="${e.id}">
      <div class="task-title">${K(e.title)}</div>
      <div class="task-meta">
        ${e.date?`<span class="meta-date">📅 ${G(e.date)}</span>`:``}
        ${e.time?`<span class="meta-time">⏰ ${e.time}</span>`:``}
        <span class="priority ${n}">${n}</span>
        ${t?`<span class="badge badge-danger">Overdue</span>`:``}
        ${e.reminder?`<span class="badge badge-reminder">🔔</span>`:``}
      </div>
    </div>
    <button class="delete" data-delete="${e.id}" aria-label="Delete">✕</button>
  </li>`}function W(e){if(e.done||!e.date)return!1;let t=new Date;return new Date(e.date+(e.time?`T`+e.time:`T23:59:59`))<t}function G(e){return new Date(e+`T00:00:00`).toLocaleDateString(void 0,{month:`short`,day:`numeric`})}function K(e){let t=document.createElement(`div`);return t.appendChild(document.createTextNode(e)),t.innerHTML}var q=document.getElementById(`app`);q?(N(q),k(),r(`INFO`,`App initialized`)):r(`ERROR`,`App container not found`);export{h as t};