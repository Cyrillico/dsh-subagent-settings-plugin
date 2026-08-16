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

export { NS, DEFAULTS, isSubagent, applyAgentOptions, applyContinuableSpec, applyCallConfig }

export const name = 'dsh-subagent-settings'
export const inject = ['settings', 'subagents']

export const Config = z.object({
  enabled: z.boolean().default(DEFAULTS.enabled),
  inheritParent: z.boolean().default(DEFAULTS.inheritParent),
  provider: z.string().default(DEFAULTS.provider),
  model: z.string().default(DEFAULTS.model),
  reasoningEffort: z.string().default(DEFAULTS.reasoningEffort),
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
  }
  const scope = ctx.settings.register(NS, Config, { base: entry, applies: 'live' })

  const originalStart = ctx.subagents.start.bind(ctx.subagents)
  const originalStartContinuable = ctx.subagents.startContinuable.bind(ctx.subagents)

  ctx.subagents.start = (provider, request) => originalStart(provider, applyAgentOptions(scope.get(), request))
  ctx.subagents.startContinuable = (spec) => originalStartContinuable(applyContinuableSpec(scope.get(), spec))

  ctx.effect(() => () => {
    ctx.subagents.start = originalStart
    ctx.subagents.startContinuable = originalStartContinuable
  }, 'dsh-subagent-settings: restore subagent start')

  ctx.on('agent/request', async (payload, next) => {
    const resolved = await next()
    if (!isSubagent(payload && payload.agent)) return resolved
    return applyCallConfig(scope.get(), resolved)
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
