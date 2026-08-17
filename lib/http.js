export function sendJson(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(data)
}

export async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  return JSON.parse(raw)
}

export function isLocalHostHeader(hostHeader) {
  if (typeof hostHeader !== 'string' || hostHeader.length === 0) return false
  const raw = hostHeader.toLowerCase()
  const hostname = raw.startsWith('[')
    ? (raw.match(/^\[([^\]]+)\]/) || [])[1]
    : raw.split(':')[0]
  if (!hostname) return false
  if (hostname === 'localhost' || hostname === '::1') return true
  const parts = hostname.split('.')
  return parts.length === 4 && parts[0] === '127' && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

const ALLOWED = new Set([
  'enabled',
  'inheritParent',
  'provider',
  'model',
  'reasoningEffort',
  'fallbackProvider',
  'fallbackModel',
  'fallbackReasoningEffort',
  'maxConcurrent',
])

export function normalizePatch(input, current) {
  const patch = {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) return patch
  if (Object.prototype.hasOwnProperty.call(input, 'field')) {
    if (ALLOWED.has(input.field)) patch[input.field] = input.value
    return patch
  }
  const source = input.patch && typeof input.patch === 'object' ? input.patch : input
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(source, key)) patch[key] = source[key]
  }
  if (typeof current === 'object' && current) {
    if (typeof patch.enabled === 'string') patch.enabled = patch.enabled === 'true'
    if (typeof patch.inheritParent === 'string') patch.inheritParent = patch.inheritParent === 'true'
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'maxConcurrent')) {
    const n = Number(patch.maxConcurrent)
    patch.maxConcurrent = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 1000) : 0
  }
  return patch
}
