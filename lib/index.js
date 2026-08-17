import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  NS,
  DEFAULTS,
  isSubagent,
  applyAgentOptions,
  applyContinuableSpec,
  applyCallConfig,
  shouldRetryWithFallback,
  createConcurrencyGate,
} from './logic.js'
import { isLocalHostHeader, normalizePatch, readJsonBody, sendJson } from './http.js'

function loadFromDsh(id) {
  const homes = [process.env.DSH_HOME, process.env.HOME && join(process.env.HOME, '.dsh')].filter(Boolean)
  const bases = []
  for (const home of homes) {
    bases.push(join(home, 'profiles/web/package.json'))
    bases.push(join(home, 'profiles/headless/package.json'))
    bases.push(join(home, 'package.json'))
  }
  bases.push(join(process.cwd(), 'package.json'))
  for (const base of bases) {
    if (!existsSync(base)) continue
    try {
      return createRequire(base)(id)
    } catch {
      // try the next resolution root
    }
  }
  throw new Error(`dsh-subagent-settings: cannot resolve ${id} from DSH_HOME or cwd`)
}

const z = loadFromDsh('@deepseek-ai/schemastery')

export { NS, DEFAULTS, isSubagent, applyAgentOptions, applyContinuableSpec, applyCallConfig, shouldRetryWithFallback, createConcurrencyGate }

export const name = 'dsh-subagent-settings'
export const inject = ['settings', 'subagents']

export const Config = z.object({
  enabled: z.boolean().default(DEFAULTS.enabled),
  inheritParent: z.boolean().default(DEFAULTS.inheritParent),
  provider: z.string().default(DEFAULTS.provider),
  model: z.string().default(DEFAULTS.model),
  reasoningEffort: z.string().default(DEFAULTS.reasoningEffort),
  fallbackProvider: z.string().default(DEFAULTS.fallbackProvider),
  fallbackModel: z.string().default(DEFAULTS.fallbackModel),
  fallbackReasoningEffort: z.string().default(DEFAULTS.fallbackReasoningEffort),
  maxConcurrent: z.number().step(1).min(0).max(1000).default(DEFAULTS.maxConcurrent),
})

async function catalogOf(ctx) {
  const llm = ctx.get('llm')
  if (!llm || typeof llm.listProviders !== 'function') return { groups: [], failures: [] }
  const groups = []
  const failures = []
  for (const provider of llm.listProviders()) {
    try {
      const models = await llm.listModels(provider.id)
      groups.push({
        id: provider.id,
        name: provider.name || provider.id,
        models: models.map((model) => ({
          id: model.id,
          name: model.name || model.id,
        })),
      })
    } catch (error) {
      failures.push({
        id: provider.id,
        name: provider.name || provider.id,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return { groups, failures }
}

function viewOf(ctx, scope) {
  const descriptor = ctx.settings.describe().find((candidate) => String(candidate.ns) === NS)
  return {
    value: scope.get(),
    revision: descriptor ? descriptor.revision : 0,
    writable: ctx.settings.writable === true,
  }
}

export function apply(ctx, config = {}) {
  const entry = {
    enabled: config.enabled ?? DEFAULTS.enabled,
    inheritParent: config.inheritParent ?? DEFAULTS.inheritParent,
    provider: config.provider ?? DEFAULTS.provider,
    model: config.model ?? DEFAULTS.model,
    reasoningEffort: config.reasoningEffort ?? DEFAULTS.reasoningEffort,
    fallbackProvider: config.fallbackProvider ?? DEFAULTS.fallbackProvider,
    fallbackModel: config.fallbackModel ?? DEFAULTS.fallbackModel,
    fallbackReasoningEffort: config.fallbackReasoningEffort ?? DEFAULTS.fallbackReasoningEffort,
    maxConcurrent: config.maxConcurrent ?? DEFAULTS.maxConcurrent,
  }
  const scope = ctx.settings.register(NS, Config, { base: entry, applies: 'live' })
  const fallbackAgents = new Set()
  const gate = createConcurrencyGate()
  const continuableHeld = new Map()

  const originalStart = ctx.subagents.start.bind(ctx.subagents)
  const originalStartContinuable = ctx.subagents.startContinuable.bind(ctx.subagents)

  const once = (fn) => {
    let done = false
    return () => {
      if (done) return
      done = true
      fn()
    }
  }

  ctx.subagents.start = async (provider, request) => {
    const cfg = scope.get()
    await gate.acquire(cfg.maxConcurrent, request && request.signal)
    const release = once(() => gate.release())
    try {
      const run = await originalStart(provider, applyAgentOptions(cfg, request))
      void Promise.resolve(run && run.result).finally(release)
      if (run && typeof run.dispose === 'function') {
        const dispose = run.dispose.bind(run)
        run.dispose = async () => {
          try {
            return await dispose()
          } finally {
            release()
          }
        }
      }
      return run
    } catch (error) {
      release()
      throw error
    }
  }

  ctx.subagents.startContinuable = async (spec) => {
    const cfg = scope.get()
    await gate.acquire(cfg.maxConcurrent, spec && spec.signal)
    const release = once(() => gate.release())
    try {
      const started = await originalStartContinuable(applyContinuableSpec(cfg, spec))
      const childId = started && started.childId
      if (childId) continuableHeld.set(childId, release)
      else release()
      return started
    } catch (error) {
      release()
      throw error
    }
  }

  ctx.effect(() => () => {
    ctx.subagents.start = originalStart
    ctx.subagents.startContinuable = originalStartContinuable
  }, 'dsh-subagent-settings: restore subagent start')

  ctx.on('agent/request', async (payload, next) => {
    const resolved = await next()
    if (!isSubagent(payload && payload.agent)) return resolved
    const agentId = payload.agent.id
    return applyCallConfig(scope.get(), resolved, { useFallback: fallbackAgents.has(agentId) })
  })

  ctx.on('agent/request-error', async (payload, next) => {
    if (!isSubagent(payload && payload.agent)) return next()
    const agentId = payload.agent.id
    if (!shouldRetryWithFallback(scope.get(), fallbackAgents.has(agentId), payload.failure)) return next()
    fallbackAgents.add(agentId)
    return { kind: 'retry' }
  })

  ctx.on('agent/disposed', ({ agent }) => {
    if (!agent || !agent.id) return
    fallbackAgents.delete(agent.id)
    const release = continuableHeld.get(agent.id)
    if (release) {
      continuableHeld.delete(agent.id)
      release()
    }
  })

  ctx.on('subagent/end', (info) => {
    const id = info && info.id
    if (!id) return
    const release = continuableHeld.get(id)
    if (!release) return
    continuableHeld.delete(id)
    release()
  })

  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(() => httpCtx.webServer.register({
      kind: 'exact',
      path: '/dsh-subagent-settings',
      handler: async (req, res) => {
        if (!isLocalHostHeader(req.headers.host)) {
          sendJson(res, 403, { ok: false, error: 'forbidden' })
          return
        }
        try {
          if (req.method === 'GET') {
            sendJson(res, 200, {
              ok: true,
              ...viewOf(httpCtx, scope),
              catalog: await catalogOf(httpCtx),
            })
            return
          }
          if (req.method === 'PUT' || req.method === 'POST') {
            const body = await readJsonBody(req)
            const patch = normalizePatch(body, scope.get())
            if (Object.keys(patch).length === 0) {
              sendJson(res, 400, { ok: false, error: 'empty-patch' })
              return
            }
            await httpCtx.settings.update(NS, patch)
            sendJson(res, 200, {
              ok: true,
              ...viewOf(httpCtx, scope),
            })
            return
          }
          sendJson(res, 405, { ok: false, error: 'method-not-allowed' })
        } catch (error) {
          sendJson(res, 400, {
            ok: false,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      },
    }), 'dsh-subagent-settings: settings http')
  })
}

export default {
  name,
  inject,
  Config,
  apply,
}
