const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-push-endpoint'
}

function cors(resp) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) resp.headers.set(k, v)
  return resp
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }))

    const url = new URL(request.url)
    const path = url.pathname

    try {
      if (path === '/api/init') return cors(await handleInit(env))
      if (path === '/api/subscribe' && request.method === 'POST') return cors(await handleSubscribe(request, env))
      if (path === '/api/schedule' && request.method === 'POST') return cors(await handleSchedule(request, env))
      if (path === '/api/cancel' && request.method === 'POST') return cors(await handleCancel(request, env))
      if (path === '/api/due') return cors(await handleDue(request, env))
      if (path === '/api/health') return cors(json({ ok: true }))
    } catch (e) {
      return cors(json({ error: e.message }, 500))
    }

    return cors(new Response('Not Found', { status: 404 }))
  },

  async scheduled(event, env) {
    await processDueTasks(env)
  }
}

// ─── KV: init ────────────────────────────────────────────────────────────────

async function handleInit(env) {
  let keys = await env.KV_SCHEDULES.get('vapid-keys', 'json')
  if (!keys) {
    const pair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']
    )
    const pub = await crypto.subtle.exportKey('jwk', pair.publicKey)
    const priv = await crypto.subtle.exportKey('jwk', pair.privateKey)
    keys = { publicKey: pub, privateKey: priv }
    await env.KV_SCHEDULES.put('vapid-keys', JSON.stringify(keys))
  }
  const raw = jwkToRawPublicKeyBytes(keys.publicKey)
  return json({ publicKey: b64urlEncode(raw) })
}

// ─── KV: subscribe ───────────────────────────────────────────────────────────

async function handleSubscribe(request, env) {
  const body = await request.json()
  const sub = body.subscription
  if (!sub || !sub.endpoint) return json({ error: 'missing subscription' }, 400)
  const key = `sub:${b64urlEncode(new TextEncoder().encode(sub.endpoint))}`
  await env.KV_SCHEDULES.put(key, JSON.stringify(sub))
  await env.KV_SCHEDULES.put(`sub-rev:${b64urlEncode(new TextEncoder().encode(sub.endpoint))}`, String(Date.now()))
  return json({ ok: true })
}

// ─── KV: schedule ────────────────────────────────────────────────────────────

async function handleSchedule(request, env) {
  const { task, endpoint } = await request.json()
  if (!task || !task.id || !endpoint) return json({ error: 'missing fields' }, 400)

  const minute = makeMinuteKey(task.date, task.time)
  if (!minute) return json({ error: 'invalid date/time' }, 400)

  await env.KV_SCHEDULES.put(`sch:${task.id}`, JSON.stringify({ task, endpoint, minute }))

  const raw = await env.KV_SCHEDULES.get(`due:${minute}`)
  const ids = raw ? JSON.parse(raw) : []
  if (!ids.includes(task.id)) {
    ids.push(task.id)
    await env.KV_SCHEDULES.put(`due:${minute}`, JSON.stringify(ids))
  }

  return json({ ok: true })
}

// ─── KV: cancel ──────────────────────────────────────────────────────────────

async function handleCancel(request, env) {
  const { id } = await request.json()
  if (!id) return json({ error: 'missing id' }, 400)

  const sch = await env.KV_SCHEDULES.get(`sch:${id}`)
  if (sch) {
    const { minute } = JSON.parse(sch)
    if (minute) {
      const raw = await env.KV_SCHEDULES.get(`due:${minute}`)
      if (raw) {
        const ids = JSON.parse(raw).filter(x => x !== id)
        if (ids.length > 0) await env.KV_SCHEDULES.put(`due:${minute}`, JSON.stringify(ids))
        else await env.KV_SCHEDULES.delete(`due:${minute}`)
      }
    }
    await env.KV_SCHEDULES.delete(`sch:${id}`)
  }

  return json({ ok: true })
}

// ─── KV: due (called by SW on push event) ────────────────────────────────────

async function handleDue(request, env) {
  const endpoint = request.headers.get('x-push-endpoint')
  if (!endpoint) return json({ tasks: [] })

  const tasks = []
  let cursor
  do {
    const list = await env.KV_SCHEDULES.list({ prefix: 'sch:', cursor })
    cursor = list.cursor
    for (const key of list.keys) {
      const val = await env.KV_SCHEDULES.get(key.name)
      if (!val) continue
      const { task, endpoint: ep } = JSON.parse(val)
      if (ep !== endpoint) continue
      const target = new Date(task.date + 'T' + task.time).getTime()
      if (Date.now() >= target - 60000) {
        tasks.push(task)
        await env.KV_SCHEDULES.delete(`sch:${task.id}`)
        await removeFromDueList(env, task.id, task.date, task.time)
      }
    }
  } while (cursor)

  return json({ tasks })
}

async function removeFromDueList(env, id, date, time) {
  const minute = makeMinuteKey(date, time)
  if (!minute) return
  const raw = await env.KV_SCHEDULES.get(`due:${minute}`)
  if (!raw) return
  const ids = JSON.parse(raw).filter(x => x !== id)
  if (ids.length > 0) await env.KV_SCHEDULES.put(`due:${minute}`, JSON.stringify(ids))
  else await env.KV_SCHEDULES.delete(`due:${minute}`)
}

// ─── Cron: process due tasks ─────────────────────────────────────────────────

async function processDueTasks(env) {
  const minute = getCurrentMinuteKey()
  const raw = await env.KV_SCHEDULES.get(`due:${minute}`)
  if (!raw) return

  const ids = JSON.parse(raw)
  const vapidKeys = await env.KV_SCHEDULES.get('vapid-keys', 'json')
  if (!vapidKeys) return

  const failed = []

  for (const id of ids) {
    const sch = await env.KV_SCHEDULES.get(`sch:${id}`)
    if (!sch) continue

    const { task, endpoint } = JSON.parse(sch)
    const key = `sub:${b64urlEncode(new TextEncoder().encode(endpoint))}`
    const subRaw = await env.KV_SCHEDULES.get(key)
    if (!subRaw) { continue }

    const subscription = JSON.parse(subRaw)

    try {
      await sendPushNotification(subscription, vapidKeys)
      await env.KV_SCHEDULES.delete(`sch:${id}`)
    } catch (e) {
      console.error('[push] failed for', id, e.message)
      if (e.message.includes('410') || e.message.includes('404')) {
        await env.KV_SCHEDULES.delete(key)
      }
      failed.push(id)
    }
  }

  if (failed.length > 0) {
    await env.KV_SCHEDULES.put(`due:${minute}`, JSON.stringify(failed))
  } else {
    await env.KV_SCHEDULES.delete(`due:${minute}`)
  }
}

// ─── Web Push with VAPID ─────────────────────────────────────────────────────

async function sendPushNotification(subscription, vapidKeys) {
  const endpoint = subscription.endpoint
  const url = new URL(endpoint)
  const aud = `${url.protocol}//${url.host}`

  const headerB64 = b64urlEncode(JSON.stringify({ alg: 'ES256', typ: 'JWT' }))
  const payloadB64 = b64urlEncode(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: 'mailto:todo@app.com'
  }))
  const signingInput = `${headerB64}.${payloadB64}`

  const privateKey = await crypto.subtle.importKey(
    'jwk', vapidKeys.privateKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  )

  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(signingInput)
  )

  const jwt = `${signingInput}.${b64urlEncode(derToRaw(new Uint8Array(sig)))}`
  const pubKeyRaw = jwkToRawPublicKeyBytes(vapidKeys.publicKey)
  const cryptoKey = `p256ecdsa=${b64urlEncode(pubKeyRaw)}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Length': '0',
      'TTL': '86400',
      'Authorization': `WebPush ${jwt}`,
      'Crypto-Key': cryptoKey
    }
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText} — ${text}`)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function derToRaw(der) {
  let offset = 2
  if (der[1] & 0x80) offset += der[1] & 0x7f
  if (der[offset] !== 0x02) throw new Error('Expected INTEGER')

  let rLen = der[offset + 1]
  let rStart = offset + 2
  let sStart = rStart + rLen
  if (der[sStart] !== 0x02) throw new Error('Expected INTEGER')
  let sLen = der[sStart + 1]
  sStart += 2

  const rData = der.slice(rStart, rStart + rLen)
  const sData = der.slice(sStart, sStart + sLen)
  const raw = new Uint8Array(64)
  if (rData.length <= 32) raw.set(rData, 32 - rData.length)
  else raw.set(rData.slice(rData.length - 32), 0)
  if (sData.length <= 32) raw.set(sData, 64 - sData.length)
  else raw.set(sData.slice(sData.length - 32), 32)
  return raw
}

function makeMinuteKey(date, time) {
  if (!date || !time) return null
  const d = new Date(date + 'T' + time)
  if (isNaN(d.getTime())) return null
  return fmtMinute(d)
}

function getCurrentMinuteKey() {
  return fmtMinute(new Date())
}

function fmtMinute(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}:${p(d.getMinutes())}`
}

function jwkToRawPublicKeyBytes(jwk) {
  const x = b64urlDecode(jwk.x)
  const y = b64urlDecode(jwk.y)
  const raw = new Uint8Array(1 + 32 + 32)
  raw[0] = 0x04
  raw.set(new Uint8Array(x), 1)
  raw.set(new Uint8Array(y), 33)
  return raw
}

function b64urlEncode(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}
