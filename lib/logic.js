export const NS = 'dsh-subagent-settings'

export const DEFAULTS = {
  enabled: true,
  inheritParent: false,
  provider: 'codex-gateway-subagent',
  model: 'gpt-5.6-terra',
  reasoningEffort: 'xhigh',
  fallbackProvider: '',
  fallbackModel: '',
  fallbackReasoningEffort: 'inherit',
}

export function isSubagent(agent) {
  if (!agent) return false
  const depth = agent.options && agent.options.subagentDepth
  if (typeof depth === 'number' && depth > 0) return true
  const meta = agent.session && agent.session.header && agent.session.header.meta
  if (!meta) return false
  if (meta.origin === 'subagent') return true
  return typeof meta.delegationDepth === 'number' && meta.delegationDepth > 0
}

export function hasFallback(cfg) {
  return !!(cfg && cfg.fallbackProvider && cfg.fallbackModel)
}

export function isAbortFailure(failure) {
  const code = String(failure && failure.code ? failure.code : '').toLowerCase()
  const message = String(failure && failure.message ? failure.message : '').toLowerCase()
  return code === 'aborted' || code === 'cancelled' || code === 'canceled' || message.includes('abort')
}

export function shouldRetryWithFallback(cfg, alreadyFallback, failure) {
  if (!cfg || cfg.enabled === false) return false
  if (alreadyFallback) return false
  if (!hasFallback(cfg)) return false
  if (isAbortFailure(failure)) return false
  return true
}

export function applyAgentOptions(cfg, request) {
  if (!cfg || cfg.enabled === false || !request) return request
  if (cfg.inheritParent) {
    const { agentOptions: _ignored, ...rest } = request
    return rest
  }
  if (!cfg.provider || !cfg.model) return request
  return {
    ...request,
    agentOptions: {
      ...(request.agentOptions || {}),
      provider: cfg.provider,
      model: cfg.model,
    },
  }
}

export function applyContinuableSpec(cfg, spec) {
  if (!spec || !spec.request) return spec
  return {
    ...spec,
    request: applyAgentOptions(cfg, spec.request),
  }
}

function applyEffort(next, effort) {
  if (!effort || effort === 'inherit') {
    delete next.reasoningEffort
  } else {
    next.reasoningEffort = effort
  }
  return next
}

export function applyCallConfig(cfg, resolved, options = {}) {
  if (!cfg || cfg.enabled === false || !resolved) return resolved
  const next = { ...resolved }
  if (options.useFallback && hasFallback(cfg)) {
    next.provider = cfg.fallbackProvider
    next.model = cfg.fallbackModel
    const effort = cfg.fallbackReasoningEffort && cfg.fallbackReasoningEffort !== 'inherit'
      ? cfg.fallbackReasoningEffort
      : cfg.reasoningEffort
    return applyEffort(next, effort)
  }
  if (!cfg.inheritParent && cfg.provider && cfg.model) {
    next.provider = cfg.provider
    next.model = cfg.model
  }
  return applyEffort(next, cfg.reasoningEffort)
}
